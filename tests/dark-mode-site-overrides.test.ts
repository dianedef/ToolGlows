import { describe, expect, it } from 'vitest'
import { buildSiteDarkModeOverrides } from '../src/content-script/darkModeSiteOverrides'

describe('site-specific dark mode overrides', () => {
  it('covers Oscaro filters, bright controls and product images', () => {
    const css = buildSiteDarkModeOverrides('www.oscaro.com')

    expect(css).toContain('.filter-container')
    expect(css).toContain('.vehicle-identification')
    expect(css).toContain('.product-img')
    expect(css).toContain('sepia(0.12)')
  })

  it('does not leak Oscaro-specific styling onto other sites', () => {
    expect(buildSiteDarkModeOverrides('example.com')).toBe('')
  })
})
