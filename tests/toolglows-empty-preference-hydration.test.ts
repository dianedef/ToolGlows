/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { updateSettings } = vi.hoisted(() => ({ updateSettings: vi.fn().mockResolvedValue(undefined) }))

vi.mock('@/bridge', () => ({
  bridgeApi: { updateSettings },
  initBridgeListeners: vi.fn()
}))
vi.mock('webext-bridge/content-script', () => ({ sendMessage: vi.fn() }))
vi.mock('@/utils/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }))

import { useSettingsStore } from '@/stores/settings'
import { useToolGlowsStore } from '@/stores/toolglows'

const registeredTools = [
  { id: 'darkMode', name: 'Dark Mode', component: {}, icon: 'moon', emoji: '', category: 'appearance' as const, interaction: 'toggle' as const },
  { id: 'cookieConsent', name: 'Cookie Consent', component: {}, icon: 'cookie', emoji: '', category: 'social' as const, interaction: 'toggle' as const }
]

describe('empty activeTools preference hydration', () => {
  let storedSettings: Record<string, unknown> | undefined

  beforeEach(() => {
    storedSettings = undefined
    updateSettings.mockClear()

    const syncListeners = new Set<(changes: Record<string, chrome.storage.StorageChange>) => void>()
    const sync = {
      get: vi.fn((key: string, callback?: (result: Record<string, unknown>) => void) => {
        const result = storedSettings ? { [key]: structuredClone(storedSettings) } : {}
        if (callback) callback(result)
        return Promise.resolve(result)
      }),
      set: vi.fn(async (values: Record<string, unknown>) => {
        storedSettings = structuredClone(values.toolglowsSettings as Record<string, unknown>)
        for (const listener of syncListeners) {
          listener({ toolglowsSettings: { newValue: structuredClone(storedSettings) } as chrome.storage.StorageChange })
        }
      }),
      onChanged: {
        addListener: (listener: (changes: Record<string, chrome.storage.StorageChange>) => void) => syncListeners.add(listener),
        removeListener: (listener: (changes: Record<string, chrome.storage.StorageChange>) => void) => syncListeners.delete(listener)
      }
    }
    vi.stubGlobal('chrome', { storage: { sync } })
    setActivePinia(createPinia())
  })

  it('persists fresh defaults and restores an intentionally empty tool list without enabling tools', async () => {
    const firstSettings = useSettingsStore()
    await firstSettings.loadSettings()
    expect(storedSettings?.activeTools).toEqual([])
    expect(updateSettings).toHaveBeenCalledOnce()
    expect(updateSettings.mock.calls[0][0].activeTools).toEqual([])

    const firstTools = useToolGlowsStore()
    await firstTools.initTools(registeredTools)
    expect(firstTools.activeTools).toEqual([])
    expect(updateSettings).toHaveBeenCalledOnce()

    setActivePinia(createPinia())
    const reloadedSettings = useSettingsStore()
    await reloadedSettings.loadSettings()
    const reloadedTools = useToolGlowsStore()
    await reloadedTools.initTools(registeredTools)

    expect(reloadedTools.activeTools).toEqual([])
    expect(storedSettings?.activeTools).toEqual([])
    expect(updateSettings).toHaveBeenCalledOnce()
  })

  it('preserves non-empty saved tools through hydration and registry initialization', async () => {
    storedSettings = {
      activeTools: ['darkMode'],
      position: { x: 40, y: 30 },
      expanded: false,
      isPinned: false,
      toolbarVisible: true,
      interfaceTheme: 'light',
      toolbarSize: 'md'
    }

    const settings = useSettingsStore()
    await settings.loadSettings()
    expect(settings.settings.activeTools).toEqual(['darkMode'])

    const tools = useToolGlowsStore()
    await tools.initTools(registeredTools)

    expect(tools.activeTools).toEqual(['darkMode'])
    expect(storedSettings?.activeTools).toEqual(['darkMode'])
    expect(updateSettings).not.toHaveBeenCalled()
  })
})
