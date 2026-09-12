import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../src/background/messageSecurity', () => ({
  assertInternalBridgeSender: (sender: { context?: string }) => {
    if (sender?.context !== 'content-script') throw new Error('Untrusted bridge sender')
  }
}))
import { fetchDarkModeResource } from '../src/background/darkModeResource'
import { normalizeDarkModeResourceUrl, MAX_DARK_MODE_RESOURCE_BYTES } from '../src/utils/darkModeResourcePolicy'

const sender = { context: 'content-script', tabId: 1, frameId: 0 }
describe('anonymous dark-mode resource bridge', () => {
  afterEach(() => vi.unstubAllGlobals())
  it.each(['file:///a.css', 'https://localhost/a', 'http://127.1/a', 'http://0x7f000001/a',
    'http://[::1]/a', 'https://name.local/a', 'https://user:pass@cdn.example.com/a', 'https://cdn.example.com:444/a'])('rejects unsafe URL %s', url => {
    expect(() => normalizeDarkModeResourceUrl(url)).toThrow()
  })
  it('fetches CSS anonymously with redirects disabled and returns bytes', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('body { color: red }', { headers: { 'content-type': 'text/css' } }))
    vi.stubGlobal('fetch', fetcher)
    const result = await fetchDarkModeResource({ url: 'https://cdn.example.com/style.css' }, sender)
    expect(atob(result.base64)).toBe('body { color: red }')
    expect(fetcher).toHaveBeenCalledWith('https://cdn.example.com/style.css', expect.objectContaining({
      method: 'GET', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer'
    }))
  })
  it('rejects extra request fields and invalid frame before network access', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    await expect(fetchDarkModeResource({ url: 'https://cdn.example.com/a', headers: {} }, sender)).rejects.toThrow()
    await expect(fetchDarkModeResource({ url: 'https://cdn.example.com/a' }, { ...sender, frameId: -1 })).rejects.toThrow()
    await expect(fetchDarkModeResource({ url: 'https://cdn.example.com/a' }, { ...sender, context: 'window' })).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('accepts the actual bridge top-frame representation with an omitted frameId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('body{}', { headers: { 'content-type': 'text/css' } })))
    const result = await fetchDarkModeResource({ url: 'https://cdn.example.com/a.css' }, { context: 'content-script', tabId: 1 })
    expect(atob(result.base64)).toBe('body{}')
  })
  it.each(['text/html', 'application/json'])('rejects %s responses', async contentType => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private document', { headers: { 'content-type': contentType } })))
    await expect(fetchDarkModeResource({ url: 'https://cdn.example.com/a' }, sender)).rejects.toThrow('Theme resource unavailable')
  })
  it('bounds streamed bytes even without Content-Length', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(MAX_DARK_MODE_RESOURCE_BYTES + 1), { headers: { 'content-type': 'image/png' } })))
    await expect(fetchDarkModeResource({ url: 'https://cdn.example.com/a' }, sender)).rejects.toThrow('Theme resource unavailable')
  })
})
