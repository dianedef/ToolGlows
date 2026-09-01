// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateSettings = vi.fn()
const settings = reactive({
  expanded: false,
  position: { x: 10, y: 20 },
  activeTools: [],
  isPinned: false,
  interfaceTheme: 'light' as const,
  toolbarColor: '',
  toolbarSize: 'md' as const,
  components: {}
})

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ settings, updateSettings })
}))

import OptionsPage from '@/ui/options-page/pages/index.vue'

describe('options page settings persistence', () => {
  beforeEach(() => updateSettings.mockReset())

  it('saves governed fields through the maintained settings store and confirms success', async () => {
    updateSettings.mockResolvedValue(undefined)
    const wrapper = mount(OptionsPage)

    await wrapper.find('select').setValue('dark')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ interfaceTheme: 'dark' }))
    expect(wrapper.get('[role="status"]').text()).toBe('Paramètres enregistrés.')
  })

  it('announces a browser-storage failure', async () => {
    const wrapper = mount(OptionsPage)

    ;(wrapper.vm as unknown as { saveState: string }).saveState = 'error'
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="alert"]').text()).toContain('Impossible d’enregistrer')
  })
})
