/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useToolOnboarding, toolSeenKey, ONBOARDING_SKIP_KEY } from '../src/composables/useToolOnboarding'
import { COOKIE_CONSENT_KEY } from '../src/features/cookieConsent/preferences'

describe('persisted tool onboarding', () => {
  let data: Record<string, unknown>
  let listeners: Set<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void>
  let storage: { get: ReturnType<typeof vi.fn>, set: ReturnType<typeof vi.fn> }
  const wrappers: Array<ReturnType<typeof mount>> = []
  async function session() {
    let state!: ReturnType<typeof useToolOnboarding>
    wrappers.push(mount(defineComponent({ setup() { state = useToolOnboarding(); return () => null } })))
    await flushPromises()
    return state
  }
  beforeEach(() => {
    data = {}
    listeners = new Set()
    storage = {
      get: vi.fn(async () => ({ ...data })),
      set: vi.fn(async (values: Record<string, unknown>) => {
        Object.assign(data, values)
        for (const listener of listeners) listener(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }])), 'local')
      })
    }
    vi.stubGlobal('chrome', { storage: { local: storage, onChanged: { addListener: (f: never) => listeners.add(f), removeListener: (f: never) => listeners.delete(f) } } })
  })
  afterEach(() => { wrappers.splice(0).forEach(w => w.unmount()); vi.unstubAllGlobals() })
  it('starts with guidance and cookies off, persists independent acknowledgements across sessions', async () => {
    const first = await session()
    const second = await session()
    expect(first.skipAll.value).toBe(false)
    expect(first.cookiePreferences.value.enabled).toBe(false)
    await Promise.all([first.save({ [toolSeenKey('cookieConsent')]: true }), second.save({ [toolSeenKey('readerMode')]: true })])
    expect((await session()).seen.value).toMatchObject({ cookieConsent: true, readerMode: true })
    await first.save({ [ONBOARDING_SKIP_KEY]: true })
    expect(second.skipAll.value).toBe(true)
    expect(data[COOKIE_CONSENT_KEY]).toBeUndefined()
  })
  it('preserves host exclusions while toggling and synchronizes the actual enabled state', async () => {
    data[COOKIE_CONSENT_KEY] = { enabled: false, excludedHosts: ['example.com'] }
    const first = await session()
    const second = await session()
    await first.toggleCookies()
    expect(second.cookiePreferences.value).toEqual({ enabled: true, excludedHosts: ['example.com'] })
    await first.toggleCookies()
    expect(data[COOKIE_CONSENT_KEY]).toEqual({ enabled: false, excludedHosts: ['example.com'] })
  })
  it('does not claim a failed save succeeded and allows retry', async () => {
    const state = await session()
    storage.set.mockRejectedValueOnce(new Error('storage unavailable'))
    expect(await state.save({ [ONBOARDING_SKIP_KEY]: true })).toBe(false)
    expect(state.skipAll.value).toBe(false)
    expect(state.error.value).toContain('Impossible')
    expect(await state.save({ [ONBOARDING_SKIP_KEY]: true })).toBe(true)
    expect(state.error.value).toBe('')
  })
  it('blocks on failed initial read and recovers without changing cookies', async () => {
    storage.get.mockRejectedValueOnce(new Error('unavailable'))
    const state = await session()
    expect(state.ready.value).toBe(false)
    expect(await state.load()).toBe(true)
    expect(state.ready.value).toBe(true)
    expect(storage.set).not.toHaveBeenCalled()
  })
})
