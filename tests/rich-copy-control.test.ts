/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  selected: vi.fn(),
  groups: vi.fn(),
  tabGroups: [{ id: 1, title: 'Travail', color: 'blue', collapsed: false, tabCount: 2 }]
}))
vi.mock('../src/composables/useRichCopy', () => ({ useRichCopy: () => ({
  isCopying: false, tabGroups: mocks.tabGroups, isLoadingGroups: false, loadTabGroups: mocks.groups,
  copyCurrentTab: mocks.current, copySelectedTabs: mocks.selected, copyAllTabs: vi.fn(), copyGroupTabs: vi.fn()
}) }))
const store = reactive({ isActive: false, options: { formats: [], customReplacements: [], defaultFormat: 'url' }, loadOptions: vi.fn() })
vi.mock('../src/stores/richCopy', () => ({ useRichCopyStore: () => store }))
import RichCopyControl from '../src/components/RichCopyControl.vue'

describe('Rich Copy toolbar dialog', () => {
  beforeEach(() => { vi.clearAllMocks(); store.isActive = false })
  it.each(['modelValue', 'visible'])('opens from %s and dispatches both browser actions', async prop => {
    const wrapper = mount(RichCopyControl, {
      props: { [prop]: true },
      global: { stubs: {
        ToolGlowsDialog: { name: 'ToolGlowsDialog', props: ['visible'], template: '<section v-if="visible"><slot /></section>' },
        Dropdown: true, InputText: true, Textarea: true, ToolGlowsIcon: true
      } }
    })
    expect(wrapper.text()).toContain('Onglet courant')
    const buttons = wrapper.findAll('button')
    await buttons.find(button => button.text().includes('Onglet courant'))!.trigger('click')
    await buttons.find(button => button.text().includes('Onglets sélectionnés'))!.trigger('click')
    expect(mocks.current).toHaveBeenCalledOnce()
    expect(mocks.selected).toHaveBeenCalledOnce()
    const dialog = wrapper.findComponent({ name: 'ToolGlowsDialog' })
    dialog.vm.$emit('update:visible', false)
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    await wrapper.setProps({ [prop]: false })
    expect(wrapper.text()).toBe('')
    await wrapper.setProps({ [prop]: true })
    expect(wrapper.text()).toContain('Onglet courant')
    expect(mocks.groups).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('renders format actions as controls instead of leaking template markup', async () => {
    store.options.formats = [
      { id: 'markdown', name: 'Markdown', template: '[{title}]({url})', icon: '📝' },
      { id: 'url', name: 'URL uniquement', template: '{url}', icon: '🔗' }
    ]

    const wrapper = mount(RichCopyControl, {
      props: { modelValue: true },
      global: { stubs: {
        ToolGlowsDialog: { name: 'ToolGlowsDialog', props: ['visible'], template: '<section v-if="visible"><slot /></section>' },
        Dropdown: true, InputText: true, Textarea: true, ToolGlowsIcon: true
      } }
    })

    expect(wrapper.text()).not.toContain('aria-label=')
    expect(wrapper.text()).not.toContain('> 1')
    expect(wrapper.findAll('[aria-label="Supprimer le format"]')).toHaveLength(2)
    expect(wrapper.findAll('.rich-copy-format-actions .p-button')).toHaveLength(6)
    wrapper.unmount()
  })

  it('renders tab-group actions with ToolGlows SVG icons', async () => {
    const wrapper = mount(RichCopyControl, {
      props: { modelValue: true },
      global: { stubs: {
        ToolGlowsDialog: { name: 'ToolGlowsDialog', props: ['visible'], template: '<section v-if="visible"><slot /></section>' },
        Dropdown: true, InputText: true, Textarea: true
      } }
    })

    expect(wrapper.find('[title="Rafraîchir les groupes"] .toolglows-icon').attributes('data-icon-name')).toBe('refresh')
    expect(wrapper.find('[title="Rafraîchir les groupes"] i').exists()).toBe(false)
    expect(wrapper.find('.group-item button .toolglows-icon').attributes('data-icon-name')).toBe('richCopy')
    expect(wrapper.find('.group-item button').text()).toContain('Copier')
    wrapper.unmount()
  })
})
