// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateSettings = vi.fn()
const settings = reactive({ toolbarVisible: true })

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ settings, updateSettings })
}))

import PopupHome from '@/ui/action-popup/pages/index.vue'

describe('popup toolbar overlay toggle', () => {
  beforeEach(() => {
    updateSettings.mockReset().mockResolvedValue(undefined)
    settings.toolbarVisible = true
    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
        sendMessage: vi.fn().mockResolvedValue({ ready: true })
      }
    })
  })

  it('persists overlay visibility from the popup switch', async () => {
    const wrapper = mount(PopupHome, {
      global: {
        stubs: {
          RouterLink: true,
          'i-ph-list-heart': true,
          'i-ph-sliders-horizontal': true
        }
      }
    })
    await flushPromises()

    await wrapper.get('input[role="switch"]').setValue(false)

    expect(updateSettings).toHaveBeenCalledWith({ toolbarVisible: false })
  })
})
