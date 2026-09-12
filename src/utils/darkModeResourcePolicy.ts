/** Only anonymous public web resources may use the extension fetch path. */
export function normalizeDarkModeResourceUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 4096) throw new Error('Invalid theme resource URL')
  const url = new URL(value)
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port
    || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':')
    || /(?:^|\.)(?:localhost|local|internal|invalid|test|example|onion)$/.test(host)
    || !/^[a-z0-9.-]+$/.test(host)) throw new Error('Unsupported theme resource URL')
  url.hash = ''
  return url.href
}

export const DARK_MODE_RESOURCE_MESSAGE = 'FETCH_DARK_MODE_RESOURCE'
export const MAX_DARK_MODE_RESOURCE_BYTES = 5 * 1024 * 1024
export const DARK_MODE_RESOURCE_TIMEOUT_MS = 10_000

export function isDarkModeResourceMime(value: string): boolean {
  return /^(?:text\/css|image\/(?:png|jpeg|gif|webp|avif|svg\+xml|bmp|x-icon|vnd\.microsoft\.icon))(?:;|$)/i.test(value)
}

export interface DarkModeResourceResponse {
  contentType: string
  base64: string
}
