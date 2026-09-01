/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const darkModeEngine = vi.hoisted(() => ({
  disable: vi.fn(),
  enable: vi.fn(),
  isEnabled: vi.fn(() => true)
}))

vi.mock('darkreader', () => darkModeEngine)
vi.mock('webext-bridge/content-script', () => ({ onMessage: vi.fn() }))

import { applyDarkMode, removeDarkMode } from '../src/content-script/darkMode'
import { maintainDarkModeBackdrop } from '../src/content-script/darkModeBootstrap'

describe('dark mode DOM lifecycle', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    darkModeEngine.disable.mockClear()
    darkModeEngine.enable.mockClear()
    darkModeEngine.isEnabled.mockReturnValue(true)
  })

  it('removes every page-level dark-mode artifact', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })

    const overrides = document.createElement('style')
    overrides.id = 'toolglows-dark-mode-overrides'
    document.head.appendChild(overrides)

    const softenedField = document.createElement('input')
    softenedField.setAttribute('data-toolglows-soft-light', 'control')
    document.body.appendChild(softenedField)

    expect(removeDarkMode()).toBe(true)
    expect(darkModeEngine.disable).toHaveBeenCalledOnce()
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).toBeNull()
    expect(document.getElementById('toolglows-dark-mode-overrides')).toBeNull()
    expect(document.querySelector('[data-toolglows-soft-light]')).toBeNull()
  })

  it('globally dims host-page images while leaving ToolGlows media unchanged', () => {
    expect(applyDarkMode({
      isActive: true,
      options: {
        backgroundColor: '#202124',
        textColor: '#f2f2f2',
        linkColor: '#8ab4f8',
        contrastLevel: 1,
        transitionDuration: 150,
        excludedDomains: []
      }
    })).toBe(true)

    const darkModeFixes = darkModeEngine.enable.mock.calls[0]?.[1]
    expect(darkModeFixes.ignoreInlineStyle).toEqual(expect.arrayContaining([
      'img', 'picture', 'video', 'svg', 'canvas', '[role="img"]'
    ]))
    expect(darkModeFixes.ignoreImageAnalysis).toEqual(expect.arrayContaining([
      'img', 'picture', 'video', 'svg', 'canvas', '[role="img"]'
    ]))

    const css = document.getElementById('toolglows-dark-mode-bootstrap')?.textContent
    expect(css).toContain('body :is(img, picture, video, svg, canvas, [role="img"]),')
    expect(css).toContain('body [data-darkreader-inline-invert] {')
    expect(css).toContain('filter: brightness(0.68) contrast(0.92) saturate(0.92) !important;')
    expect(css).toContain('#toolglows-root img')
    expect(css).toContain('#toolglows-root svg')
    expect(css).toContain('#toolglows-root [role="img"]')
    expect(css).toContain('[data-toolglows-ui] img')
    expect(css).toContain('filter: none !important;')

    const lateCss = document.getElementById('toolglows-dark-mode-overrides')?.textContent
    expect(lateCss).not.toContain('data-darkreader-inline-invert')
  })
})
