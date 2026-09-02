export type DarkModePalettePreset = 'graphite' | 'latte' | 'custom'

export interface DarkModePaletteColors {
  backgroundColor: string
  textColor: string
  linkColor: string
}

export interface DarkModePalettePreferences extends DarkModePaletteColors {
  palettePreset: DarkModePalettePreset
  customColors: DarkModePaletteColors
}

export const GRAPHITE_PALETTE: DarkModePaletteColors = {
  backgroundColor: '#1b1f24',
  textColor: '#cfd4da',
  linkColor: '#7da9d1'
}

// Catppuccin Latte-inspired reading palette: light base, plum text and vivid blue links.
export const LATTE_PALETTE: DarkModePaletteColors = {
  backgroundColor: '#eff1f5',
  textColor: '#4c4f69',
  linkColor: '#1e66f5'
}

export const DEFAULT_CUSTOM_PALETTE: DarkModePaletteColors = {
  backgroundColor: '#1a1a1a',
  textColor: '#e0e0e0',
  linkColor: '#4a9eff'
}

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const normalized = value.startsWith('#') ? value : `#${value}`
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : fallback
}

function normalizeColors(value: Partial<DarkModePaletteColors> | undefined, fallback: DarkModePaletteColors): DarkModePaletteColors {
  return {
    backgroundColor: normalizeHexColor(value?.backgroundColor, fallback.backgroundColor),
    textColor: normalizeHexColor(value?.textColor, fallback.textColor),
    linkColor: normalizeHexColor(value?.linkColor, fallback.linkColor)
  }
}

export function resolveDarkModePalettePreferences(saved: Partial<DarkModePalettePreferences>): DarkModePalettePreferences {
  const legacyColors = normalizeColors(saved, DEFAULT_CUSTOM_PALETTE)
  const customColors = normalizeColors(saved.customColors, legacyColors)
  const palettePreset: DarkModePalettePreset = saved.palettePreset === 'custom' || saved.palettePreset === 'latte'
    ? saved.palettePreset
    : 'graphite'
  const activeColors = palettePreset === 'graphite'
    ? GRAPHITE_PALETTE
    : palettePreset === 'latte'
      ? LATTE_PALETTE
      : customColors

  return { palettePreset, customColors, ...activeColors }
}

export function switchDarkModePalette(
  preferences: DarkModePalettePreferences,
  nextPreset: DarkModePalettePreset
): DarkModePalettePreferences {
  const customColors = preferences.palettePreset === 'custom'
    ? normalizeColors(preferences, preferences.customColors)
    : preferences.customColors
  const activeColors = nextPreset === 'graphite'
    ? GRAPHITE_PALETTE
    : nextPreset === 'latte'
      ? LATTE_PALETTE
      : customColors
  return { palettePreset: nextPreset, customColors, ...activeColors }
}
