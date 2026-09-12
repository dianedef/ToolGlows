import { describe, expect, it } from 'vitest'
import {
  GRAPHITE_PALETTE,
  AURORA_PALETTE,
  AURORA_TOOLBAR_FOREGROUNDS,
  AURORA_TOOLBAR_SURFACES,
  resolveDarkModePalettePreferences,
  switchDarkModePalette
} from '../src/stores/darkModePalette'
import { getContrastRatio } from '../src/utils/colorContrast'

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

  it('migrates the legacy Latte id to the reversible Aurora colors without overwriting custom colors', () => {
    const custom = resolveDarkModePalettePreferences({
      palettePreset: 'custom',
      customColors: {
        backgroundColor: '#202124',
        textColor: '#f1f3f4',
        linkColor: '#8ab4f8'
      }
    })
    const latte = switchDarkModePalette(custom, 'latte')
    expect(latte).toMatchObject(AURORA_PALETTE)
    expect(latte.customColors).toEqual(custom.customColors)
    expect(switchDarkModePalette(latte, 'custom')).toMatchObject(custom)
  })

  it('keeps Aurora text and links strongly readable on its mint canvas', () => {
    expect(getContrastRatio(AURORA_PALETTE.textColor, AURORA_PALETTE.backgroundColor)).toBeGreaterThanOrEqual(4.5)
    expect(getContrastRatio(AURORA_PALETTE.linkColor, AURORA_PALETTE.backgroundColor)).toBeGreaterThanOrEqual(4.5)
  })

  it('provides stable light and dark toolbar surfaces outside page transformation', () => {
    expect(AURORA_TOOLBAR_SURFACES).toEqual({
      light: '#dff7ec',
      dark: '#203a33'
    })
    expect(getContrastRatio(AURORA_TOOLBAR_FOREGROUNDS.light, AURORA_TOOLBAR_SURFACES.light)).toBeGreaterThanOrEqual(4.5)
    expect(getContrastRatio(AURORA_TOOLBAR_FOREGROUNDS.dark, AURORA_TOOLBAR_SURFACES.dark)).toBeGreaterThanOrEqual(4.5)
  })
})
