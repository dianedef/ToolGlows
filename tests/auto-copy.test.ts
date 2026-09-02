/* @vitest-environment jsdom */
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastAdd = vi.fn()

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd })
}))

vi.mock('webext-bridge/content-script', () => ({
  onMessage: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../src/utils/i18n', () => ({
  i18n: { global: { t: (key: string) => key } }
}))

import { useAutoCopy } from '../src/composables/useAutoCopy'
import { useAutoCopyStore } from '../src/stores/autoCopy'
import { useSettingsStore } from '../src/stores/settings'

const Harness = defineComponent({
  setup() {
    useAutoCopy()
    return () => h('div')
  }
})

function selectNodeContents(element: Element) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(element)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

async function flushCopy() {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}

describe('Auto Copy interaction contract', () => {
  const clipboardWrite = vi.fn<() => Promise<void>>()
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.stubGlobal('chrome', {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
          onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
        }
      }
    })
    setActivePinia(createPinia())
    document.body.innerHTML = '<main><p id="selection"><strong>Sensitive</strong> text</p></main>'
    toastAdd.mockReset()
    clipboardWrite.mockReset().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite }
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    wrapper?.unmount()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.getSelection()?.removeAllRanges()
  })

  it('does not copy while only the settings surface is mounted', async () => {
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).not.toHaveBeenCalled()
  })

  it('coalesces a format shortcut into one copy and one notification', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 't', altKey: true, bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 't', altKey: true, bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledTimes(1)
  })

  it('copies once when Alt element selection emits mouseup and click', async () => {
    vi.useFakeTimers()
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    const target = document.querySelector('#selection')!

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
    await vi.advanceTimersByTimeAsync(200)
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledTimes(1)
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }))
    vi.useRealTimers()
  })

  it('never writes selected content to diagnostics', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(log.mock.calls.flat().join(' ')).not.toContain('Sensitive text')
  })

  it('copies host-page text inside common utility classes', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    document.querySelector('#selection')?.classList.add('p-4', 'gap-2')
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledTimes(1)
  })

  it('copies the exact selection without appending the page URL', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    const store = useAutoCopyStore()
    store.settings.includeSource = true
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledWith('Sensitive text')
  })

  it('restores the visible page selection after the synchronous fallback', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    vi.mocked(document.execCommand).mockReturnValue(true)
    wrapper = mount(Harness)
    const selectedElement = document.querySelector('#selection')!
    selectNodeContents(selectedElement)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(window.getSelection()?.toString()).toBe('Sensitive text')
    expect(window.getSelection()?.getRangeAt(0).commonAncestorContainer).toBe(selectedElement)
  })

  it('installs visible selection feedback only while Auto Copy is mounted and active', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)

    const style = document.querySelector('#toolglows-auto-copy-selection-style')
    expect(style?.textContent).toContain('rgba(255, 105, 180, 0.55)')

    wrapper.unmount()
    expect(document.querySelector('#toolglows-auto-copy-selection-style')).toBeNull()
  })

  it('uses an error notification when every clipboard method fails', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    clipboardWrite.mockRejectedValue(new Error('denied'))
    vi.mocked(document.execCommand).mockReturnValue(false)
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(toastAdd).toHaveBeenLastCalledWith(expect.objectContaining({
      severity: 'error',
      summary: 'Error'
    }))
  })

  it('preserves selected markup for the explicit HTML shortcut', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    const store = useAutoCopyStore()
    store.settings.activeFormat = 'html'
    store.settings.includeSource = false
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', altKey: true, bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('<strong>Sensitive</strong> text'))
  })

  it('removes the fallback textarea when execCommand throws', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    vi.mocked(document.execCommand).mockImplementation(() => {
      throw new Error('blocked')
    })
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    await flushCopy()

    expect(document.querySelector('textarea')).toBeNull()
  })
})
