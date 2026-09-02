import type { DarkModePaletteColors } from './darkModePalette'

export const MAX_CUSTOM_DARK_THEMES = 20
export const MAX_CUSTOM_DARK_THEME_NAME_LENGTH = 40

export interface SavedDarkTheme extends DarkModePaletteColors {
  id: string
  name: string
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function normalizeName(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').slice(0, MAX_CUSTOM_DARK_THEME_NAME_LENGTH)
    : ''
}

function normalizeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const color = value.startsWith('#') ? value : `#${value}`
  return HEX_COLOR.test(color) ? color.toLowerCase() : null
}

function normalizedTheme(value: unknown): SavedDarkTheme | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<SavedDarkTheme>
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const name = normalizeName(candidate.name)
  const backgroundColor = normalizeColor(candidate.backgroundColor)
  const textColor = normalizeColor(candidate.textColor)
  const linkColor = normalizeColor(candidate.linkColor)
  if (!id || !name || !backgroundColor || !textColor || !linkColor) return null
  return { id, name, backgroundColor, textColor, linkColor }
}

export function normalizeSavedDarkThemes(value: unknown): SavedDarkTheme[] {
  const collection = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : []
  const themes: SavedDarkTheme[] = []
  const ids = new Set<string>()
  const names = new Set<string>()
  for (const item of collection) {
    const theme = normalizedTheme(item)
    if (!theme) continue
    const normalizedThemeName = theme.name.toLocaleLowerCase()
    if (ids.has(theme.id) || names.has(normalizedThemeName)) continue
    ids.add(theme.id)
    names.add(normalizedThemeName)
    themes.push(theme)
    if (themes.length === MAX_CUSTOM_DARK_THEMES) break
  }
  return themes
}

export function saveDarkTheme(
  themes: SavedDarkTheme[],
  name: string,
  colors: DarkModePaletteColors,
  id: string
): SavedDarkTheme[] {
  const normalizedName = normalizeName(name)
  if (!normalizedName) throw new Error('Donnez un nom au thème.')
  if (themes.length >= MAX_CUSTOM_DARK_THEMES) throw new Error('La limite de 20 thèmes est atteinte.')
  if (themes.some(theme => theme.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    throw new Error('Un thème porte déjà ce nom.')
  }
  const theme = normalizedTheme({ id, name: normalizedName, ...colors })
  if (!theme) throw new Error('Les couleurs du thème sont invalides.')
  return [...themes, theme]
}

export function renameDarkTheme(themes: SavedDarkTheme[], id: string, name: string): SavedDarkTheme[] {
  const normalizedName = normalizeName(name)
  if (!normalizedName) throw new Error('Donnez un nom au thème.')
  if (themes.some(theme => theme.id !== id && theme.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    throw new Error('Un thème porte déjà ce nom.')
  }
  return themes.map(theme => theme.id === id ? { ...theme, name: normalizedName } : theme)
}
