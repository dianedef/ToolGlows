import { describe, expect, it, vi } from 'vitest'
import { persistThenNotify } from '../src/background/syncAcknowledgement'

describe('background synchronization acknowledgment', () => {
  it('acknowledges saved settings even when a receiver never answers', async () => {
    let saved = false
    const notify = vi.fn(() => new Promise<void>(() => {}))
    const result = await persistThenNotify(async () => { saved = true }, notify)
    expect(saved).toBe(true)
    expect(result).toEqual({ success: true })
    expect(notify).toHaveBeenCalledOnce()
  })

  it('waits for persistence before notifying or acknowledging', async () => {
    let finish!: () => void
    const notify = vi.fn(async () => {})
    const acknowledged = vi.fn()
    const pending = persistThenNotify(() => new Promise<void>(resolve => { finish = resolve }), notify)
      .then(acknowledged)
    await Promise.resolve()
    expect(notify).not.toHaveBeenCalled()
    expect(acknowledged).not.toHaveBeenCalled()
    finish()
    await pending
    expect(acknowledged).toHaveBeenCalledWith({ success: true })
  })

  it('does not report success or notify after a failed write', async () => {
    const notify = vi.fn(async () => {})
    await expect(persistThenNotify(async () => { throw new Error('quota exceeded') }, notify))
      .rejects.toThrow('quota exceeded')
    expect(notify).not.toHaveBeenCalled()
  })

  it('retains delivery failures as diagnostics independently of persistence', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('delivery failed')
    expect(await persistThenNotify(async () => {}, async () => { throw failure }))
      .toEqual({ success: true })
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith('[BACKGROUND] Cross-tab delivery failed:', failure))
    log.mockRestore()
  })
})
