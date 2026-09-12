import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('shared ToolGlows dialog shell', () => {
  it('keeps every maintained dialog on the shared semantic wrapper', () => {
    const wrapper = read('src/components/ToolGlowsDialog.vue')
    expect(wrapper).toContain('class="toolglows-dialog"')
    expect(wrapper).toContain(':auto-z-index="true"')
    expect(wrapper).toContain(':base-z-index="dialogBaseZIndex"')
    expect(wrapper).toContain(':style="dialogShellStyle"')
    expect(wrapper).toContain(':pt="dialogPassThrough"')
    expect(wrapper).toContain(':append-to="dialogAppendTarget"')
    expect(wrapper).toContain("? '#toolglows-root'")
    expect(wrapper).toContain("mask: { class: 'toolglows-dialog-mask' }")
    expect(wrapper).not.toContain('darkModeStore')
  })

  it('owns shell and settings-group finish in the shared stylesheet', () => {
    const css = read('src/assets/main.css')
    expect(css).toContain('.toolglows-dialog .p-dialog-header')
    expect(css).toContain('.toolglows-dialog .p-dialog-content')
    expect(css).toContain('.toolglows-dialog .p-dialog-footer')
    expect(css).toContain('.toolglows-dialog-mask > .toolglows-dialog.p-dialog')
    expect(css).toContain('var(--tg-radius-floating-shell)')
    expect(css).toContain('var(--tg-radius-section)')
    expect(css).toContain('var(--tg-shadow-dialog)')
  })

  it('keeps visited-page palettes independent from teleported dialogs', () => {
    const tokens = read('src/assets/design-tokens.css')
    expect(tokens).toContain("#toolglows-root[data-theme='dark'] .toolglows-bar.toolglows-palette-aurora")
    expect(tokens).not.toContain('.toolglows-dialog.toolglows-palette-aurora')
    expect(tokens).not.toContain('.toolglows-dialog-mask.toolglows-palette-aurora')
  })
})
