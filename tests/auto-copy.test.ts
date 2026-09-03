/* @vitest-environment jsdom */
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastAdd = vi.fn()
const toastRemoveGroup = vi.fn()

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd, removeGroup: toastRemoveGroup })
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
    toastRemoveGroup.mockReset()
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

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
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

  it('copies once when Alt element selection emits pointerup and click', async () => {
    vi.useFakeTimers()
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    const target = document.querySelector('#selection')!

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
    await vi.advanceTimersByTimeAsync(200)
    target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
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

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(log.mock.calls.flat().join(' ')).not.toContain('Sensitive text')
  })

  it('copies host-page text inside common utility classes', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    document.querySelector('#selection')?.classList.add('p-4', 'gap-2')
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledTimes(1)
  })

  it('does not copy or notify again when a click leaves the selection unchanged', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    const selected = document.querySelector('#selection')!
    selectNodeContents(selected)

    selected.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()
    selected.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    selected.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).toHaveBeenCalledTimes(1)
    expect(toastAdd).toHaveBeenCalledTimes(1)
  })

  it('softens then clears a confirmed selection after 1.5 seconds', async () => {
    vi.useFakeTimers()
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()
    expect(document.documentElement.dataset.toolglowsAutoCopySelection).toBe('confirmed')

    await vi.advanceTimersByTimeAsync(1200)
    expect(document.documentElement.dataset.toolglowsAutoCopySelection).toBe('fading')
    await vi.advanceTimersByTimeAsync(150)
    expect(document.documentElement.dataset.toolglowsAutoCopySelection).toBe('fading-out')
    await vi.advanceTimersByTimeAsync(150)
    expect(window.getSelection()?.toString()).toBe('')
    expect(document.documentElement.dataset.toolglowsAutoCopySelection).toBeUndefined()
  })

  it('replaces the current Auto Copy toast instead of stacking notifications', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(toastRemoveGroup).toHaveBeenCalledWith('auto-copy')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      group: 'auto-copy',
      closable: false
    }))
  })

  it('copies the exact selection without appending the page URL', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    const store = useAutoCopyStore()
    store.settings.includeSource = true
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
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

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(window.getSelection()?.toString()).toBe('Sensitive text')
    expect(window.getSelection()?.getRangeAt(0).commonAncestorContainer).toBe(selectedElement)
  })

  it('preserves focus and the selected range in editable fields', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    vi.mocked(document.execCommand).mockReturnValue(true)
    document.body.innerHTML = '<input id="editable" value="Selected field value">'
    wrapper = mount(Harness)
    const input = document.querySelector<HTMLInputElement>('#editable')!
    input.focus()
    input.setSelectionRange(0, 8)

    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
    await flushCopy()

    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 8])
    expect(toastAdd).toHaveBeenCalledTimes(1)
  })

  it('never copies a password field selection', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    document.body.innerHTML = '<input id="password" type="password" value="secret value">'
    wrapper = mount(Harness)
    const input = document.querySelector<HTMLInputElement>('#password')!
    input.focus()
    input.setSelectionRange(0, input.value.length)

    input.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(clipboardWrite).not.toHaveBeenCalled()
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('installs visible selection feedback only while Auto Copy is mounted and active', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    wrapper = mount(Harness)

    const style = document.querySelector('#toolglows-auto-copy-selection-style')
    expect(style?.textContent).toContain('55%, transparent')

    wrapper.unmount()
    expect(document.querySelector('#toolglows-auto-copy-selection-style')).toBeNull()
  })

  it('uses an error notification when every clipboard method fails', async () => {
    useSettingsStore().settings.activeTools = ['autoCopy']
    clipboardWrite.mockRejectedValue(new Error('denied'))
    vi.mocked(document.execCommand).mockReturnValue(false)
    wrapper = mount(Harness)
    selectNodeContents(document.querySelector('#selection')!)

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
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

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flushCopy()

    expect(document.querySelector('textarea')).toBeNull()
  })
})
