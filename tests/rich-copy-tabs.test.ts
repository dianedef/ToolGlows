import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRichCopyTabs, getRichCopyTabGroups } from '../src/background/richCopyTabs'

describe('Rich Copy browser boundary', () => {
  const api = {
    tabs: { get: vi.fn(), query: vi.fn() },
    tabGroups: { query: vi.fn() }, windows: { WINDOW_ID_CURRENT: -2 }
  }
  const browser = api as unknown as Parameters<typeof getRichCopyTabs>[0]
  const sender = { context: 'content-script', tabId: 42 }
  beforeEach(() => {
    vi.clearAllMocks()
    api.tabs.get.mockResolvedValue({ windowId: 7 })
    api.tabs.query.mockResolvedValue([])
  })
  it.each([['current', { active: true }], ['selected', { highlighted: true }]])('binds %s to the sender window', async (scope, filter) => {
    await getRichCopyTabs(browser, { scope }, sender)
    expect(api.tabs.get).toHaveBeenCalledWith(42)
    expect(api.tabs.query).toHaveBeenCalledWith({ windowId: 7, ...filter })
  })
  it('uses current window for extension popup', async () => {
    await getRichCopyTabs(browser, { scope: 'current' }, { context: 'popup' })
    expect(api.tabs.query).toHaveBeenCalledWith({ currentWindow: true, active: true })
  })
  it('returns URLs in tab order and retains untitled tabs', async () => {
    api.tabs.query.mockResolvedValue([{ index: 2, windowId: 7, url: 'https://two.example/' }, { index: 1, windowId: 7, title: 'One', url: 'https://one.example/' }, { index: 3, windowId: 7 }])
    expect(await getRichCopyTabs(browser, { scope: 'selected' }, sender)).toEqual([
      { title: 'One', url: 'https://one.example/' }, { title: 'https://two.example/', url: 'https://two.example/' }
    ])
  })
  it.each([{}, { scope: ['selected'] }, { scope: {} }, { scope: 'constructor' }, { scope: 'group' }, { scope: 'group', groupId: -1 }, { scope: 'group', groupId: 1.2 }])('rejects invalid queries without widening scope: %j', async data => {
    await expect(getRichCopyTabs(browser, data, sender)).rejects.toThrow()
    expect(api.tabs.query).not.toHaveBeenCalled()
  })
  it('rejects page-world senders and closed source tabs', async () => {
    await expect(getRichCopyTabs(browser, { scope: 'current' }, { context: 'window', tabId: 42 })).rejects.toThrow()
    api.tabs.get.mockRejectedValue(new Error('Tab closed'))
    await expect(getRichCopyTabs(browser, { scope: 'selected' }, sender)).rejects.toThrow('Tab closed')
    expect(api.tabs.query).not.toHaveBeenCalled()
  })
  it('copies a group within sender window and lists the same window groups', async () => {
    await getRichCopyTabs(browser, { scope: 'group', groupId: 5 }, sender)
    expect(api.tabs.query).toHaveBeenCalledWith({ windowId: 7, groupId: 5 })
    api.tabGroups.query.mockResolvedValue([{ id: 5, title: 'Work', color: 'blue', collapsed: false }])
    expect(await getRichCopyTabGroups(browser, sender)).toEqual([{ id: 5, title: 'Work', color: 'blue', collapsed: false, tabCount: 0 }])
    expect(api.tabGroups.query).toHaveBeenCalledWith({ windowId: 7 })
  })
  it('tolerates unsupported tab groups', async () => {
    expect(await getRichCopyTabGroups({ ...browser, tabGroups: undefined } as unknown as typeof browser, sender)).toEqual([])
  })
})
