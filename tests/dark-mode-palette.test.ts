import { describe, expect, it } from 'vitest'
import {
  GRAPHITE_PALETTE,
  resolveDarkModePalettePreferences,
  switchDarkModePalette
} from '../src/stores/darkModePalette'

describe('dark mode palette presets', () => {
  it('migrates legacy colors to a preserved custom palette while activating graphite', () => {
    const preferences = resolveDarkModePalettePreferences({
      backgroundColor: '#594259',
      textColor: '#4f424f',
      linkColor: '#4a9eff'
    })

    expect(preferences.palettePreset).toBe('graphite')
    expect(preferences).toMatchObject(GRAPHITE_PALETTE)
    expect(preferences.customColors).toEqual({
      backgroundColor: '#594259',
      textColor: '#4f424f',
      linkColor: '#4a9eff'
    })
  })

  it('restores custom colors after a reversible preset round trip', () => {
    const custom = resolveDarkModePalettePreferences({
      palettePreset: 'custom',
      customColors: {
        backgroundColor: '#202124',
        textColor: '#f1f3f4',
        linkColor: '#8ab4f8'
      }
    })

    const graphite = switchDarkModePalette(custom, 'graphite')
    expect(graphite).toMatchObject(GRAPHITE_PALETTE)
    expect(switchDarkModePalette(graphite, 'custom')).toMatchObject(custom)
  })
})
