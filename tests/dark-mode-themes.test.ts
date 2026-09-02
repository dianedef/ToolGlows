import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MAX_CUSTOM_DARK_THEMES,
  normalizeSavedDarkThemes,
  renameDarkTheme,
  saveDarkTheme
} from '../src/stores/darkModeThemes'

const colors = { backgroundColor: '#202124', textColor: '#ff9ed2', linkColor: '#ff80c8' }

describe('saved custom dark themes', () => {
  it('creates and renames a valid named theme', () => {
    const saved = saveDarkTheme([], '  Rose   nuit  ', colors, 'theme-1')
    expect(saved).toEqual([{ id: 'theme-1', name: 'Rose nuit', ...colors }])
    expect(renameDarkTheme(saved, 'theme-1', 'Rose pastel')[0]?.name).toBe('Rose pastel')
  })

  it('rejects duplicate names and the 20-theme limit', () => {
    const saved = saveDarkTheme([], 'Rose nuit', colors, 'theme-1')
    expect(() => saveDarkTheme(saved, 'rose NUIT', colors, 'theme-2')).toThrow('déjà')
    const full = Array.from({ length: MAX_CUSTOM_DARK_THEMES }, (_, index) => ({
      id: `theme-${index}`,
      name: `Thème ${index}`,
      ...colors
    }))
    expect(() => saveDarkTheme(full, 'Encore', colors, 'theme-extra')).toThrow('limite')
  })

  it('normalizes persisted collections and ignores corrupt entries', () => {
    expect(normalizeSavedDarkThemes([
      { id: 'theme-1', name: 'Valide', backgroundColor: '202124', textColor: '#FF9ED2', linkColor: '#ff80c8' },
      { id: 'theme-2', name: '', ...colors },
      { id: 'theme-3', name: 'Valide', ...colors }
    ])).toEqual([{ id: 'theme-1', name: 'Valide', ...colors }])
    expect(normalizeSavedDarkThemes({
      0: { id: 'theme-legacy', name: 'Ancien format', ...colors }
    })).toEqual([{ id: 'theme-legacy', name: 'Ancien format', ...colors }])
  })

  it('exposes the complete management flow in the dark-mode control', () => {
    const component = readFileSync('src/components/DarkModeControl.vue', 'utf8')
    expect(component).toContain(":label=\"editingThemeId ? 'Renommer' : 'Enregistrer'\"")
    expect(component).toContain('applySavedTheme(theme.id)')
    expect(component).toContain('startThemeEdit(theme.id, theme.name)')
    expect(component).toContain("pendingThemeDeletion === theme.id ? 'Confirmer'")
    expect(component).toContain("label: 'Latte'")
    expect(component).toContain('toolglows-palette-gallery')
    expect(component).toContain('data-darkreader-ignore')
    expect(component).toContain('--toolglows-theme-swatch-color')
    expect(component).toContain('darkModeStore.options.activeCustomThemeId === theme.id')
  })

  it('keeps the theme manager readable and usable inside the transformed page', () => {
    const component = readFileSync('src/components/DarkModeControl.vue', 'utf8')
    expect(component).toContain('data-toolglows-ui="true"')
    expect(component).toContain('class="toolglows-theme-edit-action"')
    expect(component).toContain('label="Renommer"')
    expect(component).toContain("pendingThemeDeletion === theme.id ? 'Confirmer' : 'Supprimer'")
    expect(component).toMatch(/\.toolglows-theme-editor\s*\{[\s\S]*?grid-template-columns:/)
    expect(component).toMatch(/\.toolglows-theme-list li\s*\{[\s\S]*?grid-template-columns:/)
  })
})
