import { describe, expect, it } from 'vitest'
import { fromPickerHex, toPickerHex } from '../src/utils/colorPicker'

describe('shared color picker values', () => {
  it('adapts application colors to PrimeVue hex values', () => {
    expect(toPickerHex('#Ff69B4')).toBe('ff69b4')
  })

  it('restores the application hash when the picker changes', () => {
    expect(fromPickerHex('1A2b3C')).toBe('#1a2b3c')
  })

  it('keeps safe fallbacks for invalid values', () => {
    expect(toPickerHex('transparent', 'ffffff')).toBe('ffffff')
    expect(fromPickerHex(undefined, '#ffffff')).toBe('#ffffff')
  })
})
