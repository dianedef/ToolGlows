/* @vitest-environment jsdom */
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHideElementStore } from '@/stores/hideElement'

const settingsStore = {
  settings: reactive<Record<string, unknown>>({}),
  updateSettings: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => settingsStore
}))

describe('Hide Elements lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    settingsStore.settings.hideElement = undefined
    settingsStore.updateSettings.mockClear()
    document.body.innerHTML = ''
    globalThis.CSS ??= {} as CSS
    globalThis.CSS.escape ??= (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
  })

  it('keeps selection active while several elements are added', async () => {
    document.body.innerHTML = '<section id="first">First</section><aside id="second">Second</aside>'
    const store = useHideElementStore()
    store.settings.isSelectingElement = true

    await store.hideElement(document.querySelector<HTMLElement>('#first')!)
    await store.hideElement(document.querySelector<HTMLElement>('#second')!)

    expect(store.settings.isSelectingElement).toBe(true)
    expect(store.settings.hiddenElements.map(element => element.selector)).toEqual(['#first', '#second'])
    expect(document.querySelectorAll('.toolglows-hidden-element-preview')).toHaveLength(2)
  })

  it('loads persisted selectors and reapplies them after page initialization', async () => {
    document.body.innerHTML = '<main id="saved">Saved content</main>'
    settingsStore.settings.hideElement = {
      hiddenElements: [{ selector: '#saved', domain: window.location.hostname, timestamp: 1 }],
      isSelectingElement: false,
      shortcut: 'Alt+H',
      enableShortcut: true
    }
    const store = useHideElementStore()

    await store.loadSettings()

    expect(document.querySelector<HTMLElement>('#saved')!.style.display).toBe('none')
  })

  it('migrates legacy object-indexed hidden element records', async () => {
    document.body.innerHTML = '<main id="legacy">Legacy content</main>'
    settingsStore.settings.hideElement = {
      hiddenElements: {
        0: { selector: '#legacy', domain: window.location.hostname, timestamp: 1 }
      },
      isSelectingElement: false,
      shortcut: 'Alt+H',
      enableShortcut: true
    }
    const store = useHideElementStore()

    await store.loadSettings()

    expect(store.settings.hiddenElements).toHaveLength(1)
    expect(document.querySelector<HTMLElement>('#legacy')!.style.display).toBe('none')
  })

  it('shows saved targets in red editing mode and restores them individually', async () => {
    document.body.innerHTML = '<main id="saved">Saved content</main>'
    settingsStore.settings.hideElement = {
      hiddenElements: [{ selector: '#saved', domain: window.location.hostname, timestamp: 1 }],
      isSelectingElement: false,
      shortcut: 'Alt+H',
      enableShortcut: true
    }
    const store = useHideElementStore()
    await store.loadSettings()

    store.settings.isSelectingElement = true
    await Promise.resolve()

    const target = document.querySelector<HTMLElement>('#saved')!
    expect(target.style.display).toBe('')
    expect(target.classList.contains('toolglows-hidden-element-preview')).toBe(true)

    const restoreButton = document.querySelector<HTMLButtonElement>('[data-toolglows-hidden-restore]')!
    expect(restoreButton.getAttribute('aria-label')).toContain('Restaurer')
    restoreButton.click()
    await Promise.resolve()

    expect(store.settings.hiddenElements).toHaveLength(0)
    expect(target.classList.contains('toolglows-hidden-element-preview')).toBe(false)
    expect(target.style.display).toBe('')
  })

  it('stacks restore controls for nested targets with the same visual anchor', async () => {
    document.body.innerHTML = '<div id="parent"><img id="child" alt="Nested"></div>'
    settingsStore.settings.hideElement = {
      hiddenElements: [
        { selector: '#parent', domain: window.location.hostname, timestamp: 1 },
        { selector: '#child', domain: window.location.hostname, timestamp: 2 }
      ],
      isSelectingElement: false,
      shortcut: 'Alt+H',
      enableShortcut: true
    }
    const store = useHideElementStore()
    await store.loadSettings()

    store.settings.isSelectingElement = true
    await Promise.resolve()

    const controls = Array.from(document.querySelectorAll<HTMLElement>('[data-toolglows-hidden-restore]'))
    expect(controls.map(control => control.style.getPropertyValue('--tg-hidden-restore-index'))).toEqual(['0', '1'])
  })

  it('restores every saved target for the current hostname', async () => {
    document.body.innerHTML = '<div id="one"></div><div id="two"></div>'
    const store = useHideElementStore()
    await store.hideElement(document.querySelector<HTMLElement>('#one')!)
    await store.hideElement(document.querySelector<HTMLElement>('#two')!)

    await store.resetHiddenElementsForCurrentSite()

    expect(store.settings.hiddenElements).toHaveLength(0)
    expect(document.querySelector<HTMLElement>('#one')!.style.display).toBe('')
    expect(document.querySelector<HTMLElement>('#two')!.style.display).toBe('')
  })
})
