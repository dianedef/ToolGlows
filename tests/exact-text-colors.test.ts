/* @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { startExactTextColors, stopExactTextColors } from '../src/content-script/exactTextColors'

describe('exact custom dark-mode text colors', () => {
  afterEach(() => {
    stopExactTextColors()
    document.body.innerHTML = ''
  })

  it('applies the exact requested color to varied text owners and excludes links and ToolGlows UI', () => {
    document.body.innerHTML = `
      <div id="plain">Texte dans div</div>
      <p id="paragraph">Texte dans p</p>
      <button id="button">Texte bouton</button>
      <a id="link" href="#">Texte lien</a>
      <div data-toolglows-ui><span id="owned">Interface ToolGlows</span></div>
    `

    startExactTextColors('#ff9ed2', '#ff80c8')

    expect(document.getElementById('plain')?.style.getPropertyValue('color')).toBe('rgb(255, 158, 210)')
    expect(document.getElementById('paragraph')?.style.getPropertyValue('color')).toBe('rgb(255, 158, 210)')
    expect(document.getElementById('button')?.style.getPropertyValue('color')).toBe('rgb(255, 158, 210)')
    expect(document.getElementById('link')?.style.getPropertyValue('color')).toBe('rgb(255, 128, 200)')
    expect(document.getElementById('owned')?.style.getPropertyValue('color')).toBe('')
  })

  it('restores previous inline colors when dark mode stops', () => {
    document.body.innerHTML = '<p id="text" style="color: #123456">Texte</p>'
    const text = document.getElementById('text') as HTMLElement

    startExactTextColors('#ff9ed2', '#ff80c8')
    expect(text.style.getPropertyValue('color')).toBe('rgb(255, 158, 210)')
    expect(text.style.getPropertyPriority('color')).toBe('important')

    stopExactTextColors()
    expect(text.style.getPropertyValue('color')).toBe('rgb(18, 52, 86)')
    expect(text.hasAttribute('data-toolglows-exact-text')).toBe(false)
  })

  it('reasserts an accepted color after a host page rewrites an existing inline style', async () => {
    document.body.innerHTML = '<p id="text">Texte</p>'
    const text = document.getElementById('text') as HTMLElement
    startExactTextColors('#ff9ed2', '#ff80c8')

    text.style.setProperty('color', '#00ff00')
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.style.getPropertyValue('color')).toBe('rgb(255, 158, 210)')
    expect(text.style.getPropertyPriority('color')).toBe('important')
  })
})
