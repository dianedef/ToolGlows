/* @vitest-environment jsdom */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getTabs: vi.fn(), getTabGroups: vi.fn(), copy: vi.fn(), toast: vi.fn(),
  store: { options: { defaultFormat: 'url', formats: [{ id: 'url', template: '{url}' }], customReplacements: [] } }
}))
vi.mock('../src/stores/richCopy', () => ({ useRichCopyStore: () => mocks.store }))
vi.mock('../src/bridge', () => ({ bridgeApi: mocks }))
vi.mock('../src/utils/clipboard', () => ({ copyTextToClipboard: mocks.copy }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toast }) }))
import { useRichCopy } from '../src/composables/useRichCopy'

describe('Rich Copy browser URL contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.copy.mockResolvedValue(true)
    mocks.getTabs.mockResolvedValue([{ title: 'Browser tab', url: 'https://browser.example/path' }])
  })

  function setup() {
    let copy!: ReturnType<typeof useRichCopy>
    const wrapper = mount(defineComponent({ setup() { copy = useRichCopy(); return () => h('div') } }))
    return { copy, wrapper }
  }

  it('gets the current tab URL from the browser, never the page document', async () => {
    const { copy, wrapper } = setup()
    expect(await copy.copyCurrentTab()).toBe(true)
    expect(mocks.getTabs).toHaveBeenCalledWith('current', undefined)
    expect(mocks.copy).toHaveBeenCalledWith('https://browser.example/path', { allowModernApi: false })
    wrapper.unmount()
  })

  it('copies selected browser tabs as one URL per line', async () => {
    mocks.getTabs.mockResolvedValue([{ title: 'One', url: 'https://one.example/' }, { title: 'Two', url: 'https://two.example/' }])
    const { copy, wrapper } = setup()
    expect(await copy.copySelectedTabs()).toBe(true)
    expect(mocks.getTabs).toHaveBeenCalledWith('selected', undefined)
    expect(mocks.copy).toHaveBeenCalledWith('https://one.example/\nhttps://two.example/', { allowModernApi: false })
    wrapper.unmount()
  })

  it('does not copy page content when browser lookup fails or returns no tabs', async () => {
    const { copy, wrapper } = setup()
    mocks.getTabs.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Tab closed'))
    expect(await copy.copyCurrentTab()).toBe(false)
    expect(await copy.copySelectedTabs()).toBe(false)
    expect(mocks.copy).not.toHaveBeenCalled()
    expect(copy.isCopying.value).toBe(false)
    wrapper.unmount()
  })

  it('preserves replacement-like characters in browser URLs', async () => {
    mocks.getTabs.mockResolvedValue([{ title: '{url}', url: 'https://example.test/?q=$&{title}' }])
    const { copy, wrapper } = setup()
    await copy.copyCurrentTab()
    expect(mocks.copy).toHaveBeenCalledWith('https://example.test/?q=$&{title}', { allowModernApi: false })
    wrapper.unmount()
  })

  it('keeps the Rich Copy action template compilable', () => {
    const source = readFileSync(resolve('src/components/RichCopyControl.vue'), 'utf8')
    const { descriptor, errors } = parse(source)
    expect(errors).toEqual([])
    expect(compileTemplate({ source: descriptor.template!.content, filename: 'RichCopyControl.vue', id: 'rich-copy' }).errors).toEqual([])
  })
})
