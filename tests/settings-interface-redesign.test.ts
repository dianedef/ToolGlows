import { readdirSync, readFileSync } from 'node:fs'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

import { scopeToolGlowsCss } from '../src/utils/scopeCss'

describe('settings interface redesign', () => {
  it('exposes semantic tokens directly on teleported dialog boundaries', () => {
    const dialogConsumers = readdirSync('src/components')
      .filter(file => file.endsWith('.vue'))
      .filter(file =>
        readFileSync(`src/components/${file}`, 'utf8').includes(
          '<ToolGlowsDialog',
        ),
      )
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')
    const tokens = readFileSync('src/assets/design-tokens.css', 'utf8')
    const scopedTokens = postcss.parse(scopeToolGlowsCss(tokens))
    const dialogTokenRule = scopedTokens.nodes.find(
      node =>
        node.type === 'rule' &&
        node.selectors.includes('.toolglows-dialog') &&
        node.nodes.some(
          child =>
            child.type === 'decl' && child.prop === '--tg-surface-raised',
        ),
    )

    expect(dialogConsumers).toHaveLength(20)
    expect(dialogTokenRule).toBeDefined()
    expect(tokens).toContain('.toolglows-dialog,')
    expect(sharedStyles).not.toContain(
      '--surface-card: var(--tg-surface-raised)',
    )
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
