/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createScheduledDomScan } from '../src/content-script/scheduledDomScan'

describe('deferred page refinements', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('yields between bounded batches and cancels all remaining writes on disable', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<p>Text</p>'.repeat(120)
    const scan = createScheduledDomScan('p', () => {
      let wrote = false
      return element => {
        expect(wrote).toBe(false)
        return () => {
          wrote = true
          element.setAttribute('data-repaired', '')
        }
      }
    })
    scan.enqueue(document.body)
    expect(document.querySelectorAll('[data-repaired]')).toHaveLength(0)

    vi.advanceTimersToNextTimer()
    const count = document.querySelectorAll('[data-repaired]').length
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(50)

    scan.cancel()
    vi.runAllTimers()
    expect(document.querySelectorAll('[data-repaired]')).toHaveLength(count)
  })

  it('retains independent insertions and coalesces pending roots', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<section><p>First</p></section><aside><p>Second</p></aside>'
    const visit = vi.fn((element: Element) => () => element.setAttribute('data-repaired', ''))
    const scan = createScheduledDomScan('p', () => visit)
    scan.enqueue(document.querySelector('section')!)
    scan.enqueue(document.querySelector('aside')!)
    scan.enqueue(document.body)
    vi.runAllTimers()
    expect(visit).toHaveBeenCalledTimes(2)
    expect(document.querySelectorAll('[data-repaired]')).toHaveLength(2)
    scan.cancel()
  })
})
