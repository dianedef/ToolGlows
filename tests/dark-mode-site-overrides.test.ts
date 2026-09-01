import { describe, expect, it } from 'vitest'
import { buildSiteDarkModeOverrides } from '../src/content-script/darkModeSiteOverrides'

describe('site-specific dark mode overrides', () => {
  it('covers Oscaro filters and bright controls without a site-specific media rule', () => {
    const css = buildSiteDarkModeOverrides('www.oscaro.com')

    expect(css).toContain('.filter-container')
    expect(css).toContain('.vehicle-identification')
    expect(css).not.toContain('.product-img')
    expect(css).not.toContain('filter: brightness')
  })

  it('does not leak Oscaro-specific styling onto other sites', () => {
    expect(buildSiteDarkModeOverrides('example.com')).toBe('')
  })
})
