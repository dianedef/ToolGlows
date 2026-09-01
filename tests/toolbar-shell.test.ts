import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('collapsed toolbar shell', () => {
  it('centres the main control in an intrinsically round wrapper', () => {
    const toolbar = readFileSync('src/components/ToolGlowsBar.vue', 'utf8')
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(toolbar).toContain('padding: var(--tg-space-2) !important')
    expect(toolbar).toMatch(/gap:\s*0/)
    expect(toolbar).toContain('&:not(.toolglows-expanded)')
    expect(toolbar).toContain('border-radius: var(--tg-radius-round)')
    expect(toolbar.indexOf('<Toast position="bottom-right" />')).toBeLessThan(toolbar.indexOf('class="toolglows-bar"'))
    expect(sharedStyles).toContain('margin: 0 !important')
  })
})
