import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
const mocks = vi.hoisted(() => ({ apply: vi.fn(() => true), send: vi.fn(async () => ({ success: true })) }))
vi.mock('../src/content-script/darkMode', () => ({ applyDarkMode: mocks.apply }))
vi.mock('webext-bridge/content-script', () => ({ sendMessage: mocks.send }))
import { useDarkModeStore } from '../src/stores/darkMode'

describe('dark mode store execution context', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('broadcasts from extension UI without injecting the page engine into it', async () => {
    vi.stubGlobal('window', { location: { href: 'chrome-extension://test/src/ui/setup/index.html' } })
    await useDarkModeStore().applyDarkMode()
    expect(mocks.apply).not.toHaveBeenCalled()
    expect(mocks.send).toHaveBeenCalledWith('INJECT_DARK_MODE', expect.any(Object), 'background')
    vi.unstubAllGlobals()
  })

  it('applies the engine immediately on a supported website', async () => {
    vi.stubGlobal('window', { location: { href: 'https://example.com/' } })
    await useDarkModeStore().applyDarkMode()
    expect(mocks.apply).toHaveBeenCalledOnce()
    expect(mocks.send).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
