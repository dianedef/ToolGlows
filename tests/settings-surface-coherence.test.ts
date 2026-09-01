import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('settings surface coherence', () => {
  it('keeps native checkboxes out of text-field surfaces', () => {
    const optionsPages = [
      'src/ui/options/pages/index.vue',
      'src/ui/options-page/pages/index.vue',
    ].map(path => readFileSync(path, 'utf8'))

    for (const source of optionsPages) {
      expect(source).toContain("input:not([type='checkbox'])")
      expect(source).toContain('width: var(--tg-size-checkbox)')
      expect(source).toContain('height: var(--tg-size-checkbox)')
      expect(source).toContain('appearance: auto')
      expect(source).toContain('box-shadow: var(--tg-shadow-none)')
      expect(source).toContain('accent-color: var(--tg-action)')
    }
  })

  it('uses the semantic hover surface for settings cards', () => {
    const toolbar = readFileSync('src/components/ToolGlowsBar.vue', 'utf8')
    const hoverRule = toolbar.match(
      /\.toolglows-clickable-setting:hover\s*\{([\s\S]*?)\}/,
    )?.[1]

    expect(hoverRule).toContain('background: var(--tg-interaction-hover)')
    expect(hoverRule).not.toContain('var(--surface-hover)')
  })

  it('renders PrimeVue checkboxes as one compact semantic surface', () => {
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')
    const tokens = readFileSync('src/assets/design-tokens.css', 'utf8')
    const exclusionStyles = readFileSync(
      'src/composables/excludeToolGlowsBar.ts',
      'utf8',
    )

    expect(sharedStyles).toContain(
      '.toolglows-dialog .p-checkbox .p-checkbox-box',
    )
    expect(tokens).toContain('--tg-size-checkbox: var(--tg-size-20)')
    expect(sharedStyles).toContain('background: transparent !important')
    expect(sharedStyles).toContain('opacity: 0 !important')
    expect(sharedStyles).toContain('background: var(--tg-surface-field) !important')
    expect(sharedStyles).toContain('background: var(--tg-action) !important')
    expect(sharedStyles).toContain('.p-checkbox-input:focus-visible')
    expect(sharedStyles).toContain('color: var(--tg-action-on) !important')
    expect(sharedStyles).toContain(
      'border: var(--tg-border-width-control) solid var(--tg-border-default) !important',
    )
    expect(exclusionStyles).not.toContain('      .p-checkbox-box,')
    expect(exclusionStyles).not.toContain('      .p-checkbox-input,')
    expect(exclusionStyles).toContain(
      '*:not(.p-checkbox):not(.p-checkbox *)',
    )
    expect(exclusionStyles).not.toContain(
      '*:not(.p-checkbox):not(.p-checkbox-box)',
    )
  })

  it('keeps component dialogs free of checkbox size overrides', () => {
    for (const path of [
      'src/components/LinksExplorerControl.vue',
      'src/components/WordCounterPopup.vue',
      'src/components/MinimalTwitterControl.vue',
    ]) {
      expect(readFileSync(path, 'utf8')).not.toMatch(
        /:deep\(\.p-checkbox(?:-box|-icon)?\)/,
      )
    }
  })

  it('keeps the toolbar-size dropdown opaque without changing every dropdown', () => {
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(sharedStyles).toContain(
      '.toolglows-dialog .toolglows-settings-select.p-dropdown',
    )
    expect(sharedStyles).toContain(
      'background: var(--tg-surface-muted) !important',
    )
    expect(sharedStyles).toContain(
      '.toolglows-settings-select-panel.p-dropdown-panel',
    )
    expect(sharedStyles).toContain(
      'background: var(--tg-surface-overlay) !important',
    )
    expect(sharedStyles).not.toContain(
      '.toolglows-dialog .p-dropdown {\n  background: var(--tg-surface-muted) !important',
    )
  })
})
