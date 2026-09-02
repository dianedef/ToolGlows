import { describe, expect, it, vi } from 'vitest'

vi.mock('darkreader', () => ({ enable: vi.fn() }))
import {
  getContrastRatio,
  LINK_CONTRAST_MINIMUM,
  suggestReadableColor,
  TEXT_CONTRAST_MINIMUM
} from '../src/utils/colorContrast'
import { resolveDarkModeEngineOptions } from '../src/content-script/darkModeEngine'

describe('custom dark-mode color contrast', () => {
  it('reports contrast without silently replacing the requested color', () => {
    const resolved = resolveDarkModeEngineOptions({
      backgroundColor: '#f7d7e8',
      textColor: '#f2a7ce',
      linkColor: '#f5b4d7'
    })

    expect(getContrastRatio(resolved.textColor, resolved.backgroundColor)).toBeLessThan(TEXT_CONTRAST_MINIMUM)
    expect(getContrastRatio(resolved.linkColor, resolved.backgroundColor)).toBeLessThan(LINK_CONTRAST_MINIMUM)
    expect(resolved.textColor).toBe('#f2a7ce')
    expect(resolved.linkColor).toBe('#f5b4d7')
  })

  it('suggests the closest mixed color that reaches the requested threshold', () => {
    const suggestion = suggestReadableColor('#f2a7ce', '#f7d7e8', TEXT_CONTRAST_MINIMUM)
    expect(suggestion).not.toBe('#f2a7ce')
    expect(getContrastRatio(suggestion, '#f7d7e8')).toBeGreaterThanOrEqual(TEXT_CONTRAST_MINIMUM)
  })
})
