// @vitest-environment jsdom

import { reactive } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { applyInterfaceTheme, useInterfaceTheme } from '@/composables/useInterfaceTheme'
import { normalizeInterfaceTheme } from '@/composables/useInterfaceTheme'

describe('canonical interface theme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.body.removeAttribute('data-theme')
  })

  it('normalizes unknown and legacy values to the safe light theme', () => {
    expect(normalizeInterfaceTheme('dark')).toBe('dark')
    expect(normalizeInterfaceTheme('auto')).toBe('light')
    expect(normalizeInterfaceTheme(undefined)).toBe('light')
  })

  it('applies settings.interfaceTheme to standalone extension surfaces', async () => {
    const settingsStore = {
      settings: reactive({ interfaceTheme: 'light' as 'light' | 'dark' })
    }

    useInterfaceTheme(settingsStore as never)
    expect(document.documentElement.dataset.theme).toBe('light')

    settingsStore.settings.interfaceTheme = 'dark'
    await Promise.resolve()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.body.dataset.theme).toBe('dark')
  })

  it('can apply the theme to the isolated injected root', () => {
    const root = document.createElement('div')
    applyInterfaceTheme('dark', root)
    expect(root.dataset.theme).toBe('dark')
  })
})
// @vitest-environment jsdom
