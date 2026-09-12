import { sendMessage } from 'webext-bridge/content-script'
import {
  DARK_MODE_RESOURCE_MESSAGE, DARK_MODE_RESOURCE_TIMEOUT_MS, MAX_DARK_MODE_RESOURCE_BYTES,
  isDarkModeResourceMime, normalizeDarkModeResourceUrl
} from '../utils/darkModeResourcePolicy'

let activeRequests = 0
const waiting: Array<() => void> = []

export async function fetchDarkModeResource(url: string): Promise<Response> {
  if (activeRequests >= 4) {
    if (waiting.length >= 64) throw new Error('Too many pending theme resources')
    await new Promise<void>(resolve => waiting.push(resolve))
  } else activeRequests += 1
  try {
    return await loadResource(url)
  } finally {
    const next = waiting.shift()
    if (next) next()
    else activeRequests -= 1
  }
}

async function loadResource(url: string): Promise<Response> {
  // Local image representations never need extension privileges.
  if (/^(?:data:|blob:)/i.test(url)) return fetch(url)
  const resourceUrl = normalizeDarkModeResourceUrl(url)
  // Cross-origin resources use the validated extension route immediately;
  // attempting them from the page first emits avoidable browser CORS errors.
  if (new URL(resourceUrl).origin === location.origin) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DARK_MODE_RESOURCE_TIMEOUT_MS)
    try {
      const response = await fetch(resourceUrl, { credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal })
      if (response.ok) return response
      await response.body?.cancel()
    } catch { /* Retain the bounded extension fallback for inaccessible page resources. */ }
    finally { clearTimeout(timer) }
  }
  const result = await sendMessage(DARK_MODE_RESOURCE_MESSAGE, { url: resourceUrl }, 'background')
  if (!result || typeof result !== 'object' || !('base64' in result) || !('contentType' in result)
    || typeof result.base64 !== 'string' || typeof result.contentType !== 'string'
    || result.base64.length > Math.ceil(MAX_DARK_MODE_RESOURCE_BYTES / 3) * 4
    || !isDarkModeResourceMime(result.contentType)) throw new Error('Invalid theme resource response')
  const bytes = Uint8Array.from(atob(result.base64), character => character.charCodeAt(0))
  return new Response(bytes, { headers: { 'content-type': result.contentType } })
}
