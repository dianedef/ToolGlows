import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { settingsState } = vi.hoisted(() => ({
  settingsState: { settings: { activeTools: [] as string[] }, updateSettings: vi.fn() }
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => settingsState
}))
vi.mock('webext-bridge/content-script', () => ({ sendMessage: vi.fn() }))
vi.mock('@/utils/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))

import { useToolGlowsStore } from '@/stores/toolglows'
import { normalizeCookiePreferences, shouldAcceptCookies } from '@/features/cookieConsent/preferences'

const tool = (id: string) => ({
  id,
  name: id,
  component: {},
  icon: id,
  emoji: '',
  category: 'appearance' as const,
  interaction: 'toggle' as const
})

describe('fresh-install tool defaults', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    settingsState.settings.activeTools = []
    settingsState.updateSettings.mockReset()
  })

  it('keeps all registered tools disabled on a fresh install', async () => {
    const store = useToolGlowsStore()
    await store.addTool(tool('darkMode'))
    await store.initTools([tool('darkMode'), tool('cookieConsent')])
    await store.addTool(tool('readerMode'))

    expect(store.activeTools).toEqual([])
    expect(settingsState.updateSettings).not.toHaveBeenCalled()
  })

  it('preserves saved active tools during registry initialization', async () => {
    settingsState.settings.activeTools = ['darkMode']
    const store = useToolGlowsStore()

    await store.initTools([tool('darkMode'), tool('cookieConsent'), tool('readerMode')])

    expect(store.activeTools).toEqual(['darkMode'])
    expect(settingsState.updateSettings).not.toHaveBeenCalled()
  })

  it('keeps cookie auto-acceptance off when no preference has been saved', () => {
    expect(normalizeCookiePreferences(undefined).enabled).toBe(false)
    expect(shouldAcceptCookies(undefined, 'https://example.com')).toBe(false)
  })
})
