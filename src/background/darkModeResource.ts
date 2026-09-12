import { assertInternalBridgeSender } from './messageSecurity'
import {
  normalizeDarkModeResourceUrl, isDarkModeResourceMime,
  MAX_DARK_MODE_RESOURCE_BYTES, DARK_MODE_RESOURCE_TIMEOUT_MS,
  type DarkModeResourceResponse
} from '../utils/darkModeResourcePolicy'

const activeRequests = new Map<number, number>()

export async function fetchDarkModeResource(data: unknown, sender: unknown): Promise<DarkModeResourceResponse> {
  assertInternalBridgeSender(sender)
  const endpoint = sender as { context: string; tabId?: number; frameId?: number }
  // webext-bridge serializes the top frame as `content-script@tabId` and
  // parses its omitted `.0` suffix back to undefined. Other frames stay numeric.
  const frameId = endpoint.frameId === undefined ? 0 : endpoint.frameId
  if (endpoint.context !== 'content-script' || !Number.isSafeInteger(endpoint.tabId) || endpoint.tabId! < 0
    || !Number.isSafeInteger(frameId) || frameId < 0) throw new Error('Invalid theme resource sender')
  if (!data || typeof data !== 'object' || Object.keys(data).length !== 1 || !('url' in data)) {
    throw new Error('Invalid theme resource request')
  }
  const url = normalizeDarkModeResourceUrl(data.url)
  const tabId = endpoint.tabId!
  const count = activeRequests.get(tabId) ?? 0
  if (count >= 8) throw new Error('Too many theme resource requests')
  activeRequests.set(tabId, count + 1)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DARK_MODE_RESOURCE_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
      signal: controller.signal
    })
    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || !isDarkModeResourceMime(contentType) || !response.body
      || Number(response.headers.get('content-length')) > MAX_DARK_MODE_RESOURCE_BYTES) {
      await response.body?.cancel()
      throw new Error('Unsupported theme resource response')
    }
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_DARK_MODE_RESOURCE_BYTES) throw new Error('Theme resource too large')
        chunks.push(value)
      }
    } finally {
      await reader.cancel()
    }
    let binary = ''
    for (const chunk of chunks) {
      for (let offset = 0; offset < chunk.length; offset += 8192) {
        binary += String.fromCharCode(...chunk.subarray(offset, offset + 8192))
      }
    }
    return { contentType, base64: btoa(binary) }
  } catch {
    // Resource URLs can include signed query strings; keep bridge errors generic.
    throw new Error('Theme resource unavailable')
  } finally {
    controller.abort()
    clearTimeout(timer)
    const remaining = (activeRequests.get(tabId) ?? 1) - 1
    if (remaining) activeRequests.set(tabId, remaining)
    else activeRequests.delete(tabId)
  }
}
