import { describe, expect, it } from 'vitest'
import { mapBrightSurfaceColor, resolveSoftenedRole } from '../src/content-script/softenBrightSurfaces'

describe('bright surface color table', () => {
  it.each([
    ['rgb(255, 255, 255)', 'surface'],
    ['rgb(244, 244, 244)', 'surface'],
    ['rgb(230, 230, 230)', 'raised'],
    ['rgb(253, 234, 202)', 'warm'],
    ['rgb(220, 232, 248)', 'cool'],
    ['rgb(226, 249, 224)', 'success']
  ])('maps %s to %s', (source, target) => {
    expect(mapBrightSurfaceColor(source)).toBe(target)
  })

  it('preserves saturated and already dark colors', () => {
    expect(mapBrightSurfaceColor('rgb(249, 94, 76)')).toBeNull()
    expect(mapBrightSurfaceColor('rgb(32, 36, 43)')).toBeNull()
  })

  it('keeps semantic Compatible controls in the success role after an earlier dark recolor', () => {
    expect(resolveSoftenedRole('rgb(32, 36, 43)', 'button Compatible', true)).toBe('success')
  })

  it('does not turn an already-dark parent into a success surface without its own semantic hint', () => {
    expect(resolveSoftenedRole('rgb(32, 36, 43)', 'product-card', false)).toBeNull()
  })
})
