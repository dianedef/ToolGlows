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

  it('fills the PrimeVue checkbox surface with a restrained border', () => {
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(sharedStyles).toContain(
      '.toolglows-dialog .p-checkbox .p-checkbox-box',
    )
    expect(sharedStyles).toContain('width: var(--tg-full-width)')
    expect(sharedStyles).toContain('height: var(--tg-full-width)')
    expect(sharedStyles).toContain(
      'border-width: var(--tg-border-width-control)',
    )
  })
})
