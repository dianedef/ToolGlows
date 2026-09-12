/* @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { buildSiteDarkModeOverrides } from '../src/content-script/darkModeSiteOverrides'

afterEach(() => { document.head.innerHTML = ''; document.body.innerHTML = '' })

describe('BackerKit hosted preorder background', () => {
  it.each(['backerkit.com', 'carbon-fiber-concert-ukuleles.backerkit.com', 'WWW.BACKERKIT.COM'])('scopes the rule to %s', hostname => {
    expect(buildSiteDarkModeOverrides(hostname)).toContain('.hosted-preorders-layout .project-background')
  })
  it.each(['notbackerkit.com', 'backerkit.com.attacker.com', 'example.com'])('rejects lookalike or unrelated host %s', hostname => {
    expect(buildSiteDarkModeOverrides(hostname)).toBe('')
  })
  it('replaces only the decorative hosted background and restores it when the override retires', () => {
    document.head.innerHTML = '<style>.project-background { background-image: url("https://assets.backerkit.com/decor.jpg") }</style>'
    document.body.innerHTML = '<div class="hosted-preorders-layout"><div class="project-background"><img src="https://assets.backerkit.com/product.jpg"></div></div><div class="project-background other-layout"></div>'
    const layer = document.querySelector('.hosted-preorders-layout .project-background')!
    const other = document.querySelector('.other-layout')!
    const image = document.querySelector('img')!
    const original = getComputedStyle(layer).backgroundImage
    const override = document.createElement('style')
    override.textContent = buildSiteDarkModeOverrides('backerkit.com')
    document.head.appendChild(override)
    expect(getComputedStyle(layer).backgroundImage).toBe('none')
    expect(getComputedStyle(other).backgroundImage).toBe(original)
    expect(image.getAttribute('src')).toBe('https://assets.backerkit.com/product.jpg')
    override.remove()
    expect(getComputedStyle(layer).backgroundImage).toBe(original)
  })
})
