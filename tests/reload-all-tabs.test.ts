import { describe, expect, it, vi } from 'vitest'
import { reloadAllTabs } from '../src/background/reloadAllTabs'

describe('reloadAllTabs', () => {
  it('leaves the initiating tab to the responding content script', async () => {
    const reload = vi.fn().mockResolvedValue(undefined)
    const tabsApi = {
      query: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
      reload
    }

    await expect(reloadAllTabs(tabsApi, 2)).resolves.toEqual({
      successCount: 3,
      errorCount: 0
    })

    expect(reload).toHaveBeenCalledTimes(2)
    expect(reload).not.toHaveBeenCalledWith(2)
  })

  it('dispatches every other reload without waiting for slow tabs', async () => {
    const neverSettles = new Promise<void>(() => {})
    const reload = vi.fn(() => neverSettles)
    const tabsApi = {
      query: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, {}, { id: 3 }]),
      reload
    }

    await expect(reloadAllTabs(tabsApi, 1)).resolves.toEqual({
      successCount: 3,
      errorCount: 0
    })
    expect(reload).toHaveBeenCalledWith(2)
    expect(reload).toHaveBeenCalledWith(3)
  })
})
