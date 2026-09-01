import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('color picker surface', () => {
  it('uses one full-surface control across product settings', () => {
    const component = readFileSync('src/components/ToolGlowsColorPicker.vue', 'utf8')
    const options = readFileSync('src/ui/options/pages/index.vue', 'utf8')
    const optionsPage = readFileSync('src/ui/options-page/pages/index.vue', 'utf8')

    expect(component).toContain('padding: 0 !important')
    expect(component).toContain('width: var(--tg-size-control-comfortable) !important')
    expect(component).toContain('height: var(--tg-size-control-comfortable) !important')
    expect(component).toContain('overflow: hidden')
    expect(component).toContain('::-webkit-color-swatch-wrapper')
    expect(component).toContain('::-webkit-color-swatch')
    expect(component).toContain('::-moz-color-swatch')
    expect(options).toContain('<ToolGlowsColorPicker v-model="settings.toolbarColor" />')
    expect(optionsPage).toContain('<ToolGlowsColorPicker v-model="form.toolbarColor" />')
    expect(options).not.toContain('type="color"')
    expect(optionsPage).not.toContain('type="color"')
  })
})
