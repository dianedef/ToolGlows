// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { installCookieConsentRuntime } from '../src/features/cookieConsent/runtime'
import { COOKIE_CONSENT_KEY, normalizeCookiePreferences, shouldAcceptCookies } from '../src/features/cookieConsent/preferences'

const mocks = vi.hoisted(() => ({ stop: vi.fn(), start: vi.fn() }))
vi.mock('../src/features/cookieConsent/engine', () => ({ startCookieConsent: mocks.start }))
afterEach(() => vi.clearAllMocks())

function storage(initial: unknown) {
  let listener: (changes: any, area: string) => void = () => {}
  const api = {
    local: { get: vi.fn().mockResolvedValue({ [COOKIE_CONSENT_KEY]: initial }) },
    onChanged: { addListener: vi.fn(fn => { listener = fn }), removeListener: vi.fn() }
  }
  return { api: api as unknown as typeof chrome.storage, change: (value: unknown, area = 'local') => listener({ [COOKIE_CONSENT_KEY]: { newValue: value } }, area) }
}
const doc = { URL: 'https://example.com/article' } as Document

describe('cookie consent preferences and runtime', () => {
  it('requires an explicit boolean and excludes exact hosts, never URL substrings', () => {
    expect(normalizeCookiePreferences({ enabled: 'true', excludedHosts: [null, 'EXAMPLE.COM', 'https://bad.com', 'example.com'] })).toEqual({ enabled: false, excludedHosts: ['example.com'] })
    expect(shouldAcceptCookies(undefined, doc.URL)).toBe(false)
    expect(shouldAcceptCookies({ enabled: true }, 'chrome://settings')).toBe(false)
    expect(shouldAcceptCookies({ enabled: true, excludedHosts: ['example.com'] }, doc.URL)).toBe(false)
    expect(shouldAcceptCookies({ enabled: true, excludedHosts: ['example.com'] }, 'https://other.com/example.com')).toBe(true)
  })
  it('starts only on local opt-in, stops immediately on exclusion and removes listeners', async () => {
    mocks.start.mockReturnValue(mocks.stop)
    const fake = storage(undefined)
    const dispose = installCookieConsentRuntime(doc, fake.api)
    await Promise.resolve()
    expect(mocks.start).not.toHaveBeenCalled()
    fake.change({ enabled: true }, 'sync')
    expect(mocks.start).not.toHaveBeenCalled()
    fake.change({ enabled: true })
    expect(mocks.start).toHaveBeenCalledOnce()
    fake.change({ enabled: true, excludedHosts: ['example.com'] })
    expect(mocks.stop).toHaveBeenCalledOnce()
    dispose()
    expect(fake.api.onChanged.removeListener).toHaveBeenCalledOnce()
  })
  it('does not overwrite a recent opt-out with a delayed startup read', async () => {
    const fake = storage(undefined)
    let resolve!: (value: unknown) => void
    vi.mocked(fake.api.local.get).mockReturnValue(new Promise(done => { resolve = done }) as any)
    const dispose = installCookieConsentRuntime(doc, fake.api)
    fake.change({ enabled: false })
    resolve({ [COOKIE_CONSENT_KEY]: { enabled: true } })
    await Promise.resolve()
    expect(mocks.start).not.toHaveBeenCalled()
    dispose()
  })
})
