import { afterEach, describe, expect, it, vi } from 'vitest'
import { isContentScriptReady } from '../src/background/contentScriptReady'

describe('content script broadcast readiness', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
  it('uses the existing top-frame status contract', async () => {
    const sendMessage = vi.fn(async () => ({ ready: true }))
    vi.stubGlobal('chrome', { tabs: { sendMessage } })
    expect(await isContentScriptReady(7)).toBe(true)
    expect(sendMessage).toHaveBeenCalledWith(7, { type: 'TOOLGLOWS_CONTENT_STATUS' }, { frameId: 0 })
  })
  it('skips tabs without a listener', async () => {
    vi.stubGlobal('chrome', { tabs: { sendMessage: vi.fn().mockRejectedValue(new Error('No receiver')) } })
    expect(await isContentScriptReady(7)).toBe(false)
  })
  it('bounds a frozen receiver before a bridge delivery is queued', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('chrome', { tabs: { sendMessage: vi.fn(() => new Promise(() => {})) } })
    const ready = isContentScriptReady(7)
    await vi.advanceTimersByTimeAsync(300)
    expect(await ready).toBe(false)
  })
})
