/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cssContrastRatio,
  selectReadableCssColor,
  startContrastRepair,
  stopContrastRepair
} from '../src/content-script/contrastRepair'

describe('universal dark-mode contrast repair', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    stopContrastRepair()
    document.body.innerHTML = ''
  })

  it('defers contrast scanning until after the activation task', async () => {
    document.body.innerHTML = '<section style="background:#111827"><p style="color:#111827">First</p><p style="color:#111827">Second</p></section>'
    const styleSpy = vi.spyOn(window, 'getComputedStyle')

    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    expect(styleSpy).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(document.querySelectorAll('[data-toolglows-contrast-repair]')).toHaveLength(2))
  })

  it('keeps already-readable brand colors unchanged', async () => {
    document.body.innerHTML = '<section style="background:#111827"><p id="text" style="color:#f9fafb">Readable</p></section>'
    const text = document.getElementById('text') as HTMLElement

    startContrastRepair('#cfd4da', '#7da9d1', '#1b1f24')
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.hasAttribute('data-toolglows-contrast-repair')).toBe(false)
    expect(text.style.color).toBe('rgb(249, 250, 251)')
  })

  it('repairs dark text on an inherited dark surface', async () => {
    document.body.innerHTML = '<section style="background:#17202a"><div><span id="text" style="color:#1f2937">Invisible</span></div></section>'
    const text = document.getElementById('text') as HTMLElement

    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.hasAttribute('data-toolglows-contrast-repair')).toBe(true)
    expect(cssContrastRatio(text.style.color, 'rgb(23, 32, 42)')).toBeGreaterThanOrEqual(4.5)
  })

  it('selects a readable fallback when the themed color fails', () => {
    expect(cssContrastRatio(selectReadableCssColor('#243447', '#17202a'), '#17202a')).toBeGreaterThanOrEqual(4.5)
    expect(cssContrastRatio(selectReadableCssColor('#f4fbf8', '#ffffff'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('repairs dynamically inserted text and restores its original inline color', async () => {
    document.body.innerHTML = '<main id="root" style="background:#111827"></main>'
    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    await new Promise(resolve => setTimeout(resolve, 30))
    const text = document.createElement('p')
    text.style.color = '#111827'
    text.textContent = 'Late content'
    document.getElementById('root')?.append(text)
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.hasAttribute('data-toolglows-contrast-repair')).toBe(true)
    stopContrastRepair()
    expect(text.style.color).toBe('rgb(17, 24, 39)')
  })

  it('rechecks the page when DarkReader finishes rewriting its stylesheet', async () => {
    document.body.innerHTML = '<p id="text">Late transformed text</p>'
    const style = document.createElement('style')
    style.className = 'darkreader darkreader--sync'
    document.head.append(style)
    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    await new Promise(resolve => setTimeout(resolve, 30))

    style.textContent = '#text { color: #111827; background-color: #111827; }'
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(document.getElementById('text')?.hasAttribute('data-toolglows-contrast-repair')).toBe(true)
  })

  it('rechecks after a DarkReader CSSOM update that creates no DOM mutation', async () => {
    document.body.innerHTML = '<p id="text" style="color:#f9fafb;background:#111827">Theme switch</p>'
    const text = document.getElementById('text') as HTMLElement
    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    await new Promise(resolve => setTimeout(resolve, 30))
    text.style.color = '#111827'
    document.dispatchEvent(new CustomEvent('__darkreader__updateSheet'))
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.hasAttribute('data-toolglows-contrast-repair')).toBe(true)
  })

  it('keeps a repair stable across later hydration rescans', async () => {
    document.body.innerHTML = '<div style="background:#111827"><span id="text" style="color:transparent">Gradient label</span></div>'
    const text = document.getElementById('text') as HTMLElement
    startContrastRepair('#f4fbf8', '#ff8bc2', '#142a24')
    await new Promise(resolve => setTimeout(resolve, 30))
    const repairedColor = text.style.color

    text.classList.add('hydrated')
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(text.hasAttribute('data-toolglows-contrast-repair')).toBe(true)
    expect(text.style.color).toBe(repairedColor)
  })
})
