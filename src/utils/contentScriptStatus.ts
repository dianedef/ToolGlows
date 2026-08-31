export const CONTENT_SCRIPT_STATUS_MESSAGE = 'TOOLGLOWS_CONTENT_STATUS'

export type ContentScriptStatus =
  | 'checking'
  | 'available'
  | 'access-required'
  | 'unsupported-page'

export function isSupportedPageUrl(url?: string): boolean {
  if (!url) return false

  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function extensionDetailsUrl(userAgent: string, extensionId: string): string {
  const scheme = /Edg\//.test(userAgent) ? 'edge' : 'chrome'
  return `${scheme}://extensions/?id=${encodeURIComponent(extensionId)}`
}
