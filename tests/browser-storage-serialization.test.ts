/* @vitest-environment jsdom */
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useBrowserSyncStorage } from '../src/composables/useBrowserStorage'

describe('browser storage serialization', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('restores legacy indexed collections and persists nested arrays as arrays', async () => {
    const listeners: Array<(changes: Record<string, { newValue: unknown }>) => void> = []
    const set = vi.fn()
    vi.stubGlobal('chrome', {
      storage: {
        sync: {
          get: vi.fn((_key, callback) => callback({
            settings: {
              activeTools: { 0: 'darkMode' },
              hideElement: {
                hiddenElements: { 0: { selector: '#content' } }
              }
            }
          })),
          set,
          onChanged: { addListener: (listener: typeof listeners[number]) => listeners.push(listener) }
        }
      }
    })

    const { data, promise } = useBrowserSyncStorage('settings', {
      activeTools: [] as string[],
      hideElement: { hiddenElements: [] as Array<{ selector: string }> }
    })
    await promise

    expect(data.value.activeTools).toEqual(['darkMode'])
    expect(data.value.hideElement.hiddenElements).toEqual([{ selector: '#content' }])

    data.value.activeTools.push('readerMode')
    await nextTick()
    await nextTick()

    expect(set).toHaveBeenLastCalledWith({
      settings: {
        activeTools: ['darkMode', 'readerMode'],
        hideElement: { hiddenElements: [{ selector: '#content' }] }
      }
    })

    listeners[0]?.({
      settings: {
        newValue: {
          activeTools: { 0: 'darkMode' },
          hideElement: { hiddenElements: { 0: { selector: '#saved' } } }
        }
      }
    })
    await nextTick()

    expect(data.value.activeTools).toEqual(['darkMode'])
    expect(data.value.hideElement.hiddenElements).toEqual([{ selector: '#saved' }])
  })
})
