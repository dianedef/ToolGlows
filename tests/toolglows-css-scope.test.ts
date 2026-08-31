import { describe, expect, it } from 'vitest'
import { scopeToolGlowsCss } from '../src/utils/scopeCss'

describe('ToolGlows third-party CSS isolation', () => {
  it('does not leave host-page PrimeVue fields selectable', () => {
    const css = scopeToolGlowsCss('.p-inputtext, .p-dropdown { background: #111827; }')

    expect(css).toContain('#toolglows-root .p-inputtext')
    expect(css).toContain('#toolglows-root .p-dropdown')
    expect(css).not.toMatch(/(^|})\s*\.p-(inputtext|dropdown)\b/)
  })

  it('keeps root variables and keyframe steps valid while scoping rules', () => {
    const css = scopeToolGlowsCss(':root { --surface: black } @keyframes fade { from { opacity: 0 } to { opacity: 1 } }')

    expect(css).toContain('#toolglows-root, .toolglows-dialog')
    expect(css).toContain('--surface: black')
    expect(css).toContain('from { opacity: 0 }')
    expect(css).not.toContain('#toolglows-root from')
  })

  it('preserves existing ToolGlows selectors without leaking root styles', () => {
    const css = scopeToolGlowsCss(`
      :root, #toolglows-root { --surface: black; background: black; }
      #toolglows-root * { box-sizing: border-box; }
      body { color-scheme: dark; }
    `)

    expect(css).toContain('#toolglows-root *')
    expect(css).not.toContain('#toolglows-root #toolglows-root')
    expect(css).not.toMatch(/(^|})\s*:root\b/m)
    expect(css).not.toMatch(/(^|})\s*body\b/m)
  })

  it('preserves only the namespaced page-runtime element markers', () => {
    const css = scopeToolGlowsCss(`
      .toolglows-hidden-element-preview { outline: var(--outline); }
      .toolglows-hidden-element-preview :is(img, picture) { filter: var(--filter); }
      .toolglows-hidden-element-restore:hover { background: var(--danger); }
      .ordinary-page-class { color: red; }
    `)

    expect(css).toMatch(/(^|})\s*\.toolglows-hidden-element-preview\b/m)
    expect(css).toMatch(/(^|})\s*\.toolglows-hidden-element-preview :is\(img, picture\)/m)
    expect(css).toMatch(/(^|})\s*\.toolglows-hidden-element-restore:hover\b/m)
    expect(css).not.toMatch(/(^|})\s*\.ordinary-page-class\b/m)
  })
})
