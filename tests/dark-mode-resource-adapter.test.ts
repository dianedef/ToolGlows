import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const bridge = vi.hoisted(() => vi.fn())
vi.mock('webext-bridge/content-script', () => ({ sendMessage: bridge }))
import { fetchDarkModeResource } from '../src/content-script/darkModeResource'

describe('DarkReader resource adapter', () => {
  beforeEach(() => vi.stubGlobal('location', { origin: 'https://project.backerkit.com' }))
  afterEach(() => { vi.unstubAllGlobals(); bridge.mockReset() })
  it('routes external resources directly through the bridge without a failed page CORS request', async () => {
    const nativeFetch = vi.fn().mockRejectedValue(new TypeError('CORS'))
    vi.stubGlobal('fetch', nativeFetch)
    bridge.mockResolvedValue({ contentType: 'text/css', base64: btoa('body{}') })
    expect(await (await fetchDarkModeResource('https://assets.backerkit.com/a.css')).text()).toBe('body{}')
    expect(bridge).toHaveBeenCalledWith('FETCH_DARK_MODE_RESOURCE', { url: 'https://assets.backerkit.com/a.css' }, 'background')
    expect(nativeFetch).not.toHaveBeenCalled()
  })
  it('keeps accessible and local image resources out of the privileged bridge', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('image'))))
    await fetchDarkModeResource('https://project.backerkit.com/a.png')
    await fetchDarkModeResource('data:image/png;base64,AA==')
    await fetchDarkModeResource('blob:https://assets.backerkit.com/image-id')
    expect(bridge).not.toHaveBeenCalled()
  })
  it('queues resource bursts instead of dropping styles beyond four active requests', async () => {
    const releases: Array<() => void> = []
    const fetcher = vi.fn().mockImplementation(() => new Promise<Response>(resolve => {
      releases.push(() => resolve(new Response('body{}')))
    }))
    vi.stubGlobal('fetch', fetcher)
    const requests = Array.from({ length: 12 }, (_, index) => fetchDarkModeResource(`https://project.backerkit.com/${index}.css`))
    expect(fetcher).toHaveBeenCalledTimes(4)
    for (let batch = 0; batch < 3; batch += 1) {
      releases.splice(0).forEach(release => release())
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    expect(await Promise.all(requests)).toHaveLength(12)
    expect(fetcher).toHaveBeenCalledTimes(12)
    expect(bridge).not.toHaveBeenCalled()
  })
  it('retains the bridge fallback if a same-origin anonymous fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failure')))
    bridge.mockResolvedValue({ contentType: 'text/css', base64: btoa('body{}') })
    expect(await (await fetchDarkModeResource('https://project.backerkit.com/a.css')).text()).toBe('body{}')
    expect(bridge).toHaveBeenCalledOnce()
  })
})
