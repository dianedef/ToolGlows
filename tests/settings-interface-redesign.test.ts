import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('settings interface redesign', () => {
  it('governs every dialog consumer through the semantic shared shell', () => {
    const dialogConsumers = readdirSync('src/components')
      .filter(file => file.endsWith('.vue'))
      .filter(file =>
        readFileSync(`src/components/${file}`, 'utf8').includes(
          '<ToolGlowsDialog',
        ),
      )
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(dialogConsumers).toHaveLength(20)
    expect(sharedStyles).toContain('--surface-card: var(--tg-surface-raised)')
    expect(sharedStyles).toContain('--surface-hover: var(--tg-interaction-hover)')
    expect(sharedStyles).toContain('--text-color: var(--tg-text-primary)')
    expect(sharedStyles).toContain('--primary-color: var(--tg-action)')
  })

  it('uses cards for sections rather than every simple field', () => {
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(sharedStyles).toContain(
      '.p-dialog-content > div > :is(.toolglows-field, .field)',
    )
    expect(sharedStyles).toContain('background: transparent')
    expect(sharedStyles).toContain('.toolglows-settings-section {')
    expect(sharedStyles).toContain('.toolglows-settings-row {')
  })

  it('gives quick settings a clear three-section hierarchy', () => {
    const toolbar = readFileSync('src/components/ToolGlowsBar.vue', 'utf8')

    expect(toolbar.match(/<section class="toolglows-settings-section">/g)).toHaveLength(3)
    expect(toolbar).toContain('<h3>Général</h3>')
    expect(toolbar).toContain('<h3>Page actuelle</h3>')
    expect(toolbar).toContain('<h3>Outils actifs</h3>')
    expect(toolbar).toContain('input-id="toolbarSize"')
    expect(toolbar).not.toContain('toolglows-setting-item')
  })

  it('aligns both options implementations with shared sections and rows', () => {
    for (const path of [
      'src/ui/options/pages/index.vue',
      'src/ui/options-page/pages/index.vue',
    ]) {
      const source = readFileSync(path, 'utf8')

      expect(source).toContain('toolglows-settings-stack')
      expect(source).toContain('toolglows-settings-section')
      expect(source).toContain('toolglows-settings-section-header')
      expect(source).toContain('toolglows-settings-row')
    }
  })
})
