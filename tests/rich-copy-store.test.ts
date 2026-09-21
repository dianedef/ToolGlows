/* @vitest-environment jsdom */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const set = vi.fn()

vi.stubGlobal('chrome', {
  storage: { sync: { get, set } }
})

import { useRichCopyStore } from '../src/stores/richCopy'

describe('Rich Copy stored options', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockReset()
    set.mockReset()
  })

  it('recovers from malformed formats saved by an older Edge extension instance', async () => {
    get.mockResolvedValue({
      richCopyOptions: {
        formats: { url: '{url}' },
        defaultFormat: 'url',
        customReplacements: { search: 'old', replace: 'new' }
      }
    })

    const store = useRichCopyStore()
    await store.loadOptions()

    expect(Array.isArray(store.options.formats)).toBe(true)
    expect(store.options.formats.some(format => format.id === 'url')).toBe(true)
    expect(store.options.defaultFormat).toBe('url')
    expect(store.options.customReplacements).toEqual([])
  })
})
