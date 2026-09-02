import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('dark mode low-contrast confirmation', () => {
  const component = readFileSync('src/components/DarkModeControl.vue', 'utf8')
  const tokens = readFileSync('src/assets/design-tokens.css', 'utf8')

  it('makes the pending apply action explicit and visually noticeable', () => {
    expect(component).toContain('Confirmez pour appliquer cette couleur à la page.')
    expect(component).toContain('label="Appliquer ma couleur"')
    expect(component).toContain('class="toolglows-keep-color-action"')
    expect(component).toContain('toolglows-contrast-action-attention var(--tg-motion-attention)')
    expect(tokens).toContain('--tg-motion-attention:')
    expect(tokens).toContain('--tg-shadow-attention:')
  })

  it('stops the attention animation when reduced motion is requested', () => {
    expect(component).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.toolglows-keep-color-action[\s\S]*?animation: none/,
    )
  })
})
