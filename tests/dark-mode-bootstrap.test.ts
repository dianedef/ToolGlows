/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import {
  buildDarkModeBackdropCss,
  maintainDarkModeBackdrop,
  retireDarkModeBootstrap,
  shouldBootstrapDarkMode
} from '../src/content-script/darkModeBootstrap'

describe('dark mode pre-render decision', () => {
  it('uses the persisted manual activation state', () => {
    expect(shouldBootstrapDarkMode({ isActive: true }, 'example.com', false)).toBe(true)
    expect(shouldBootstrapDarkMode({ isActive: false }, 'example.com', true)).toBe(false)
  })

  it('respects domain exclusions before painting', () => {
    expect(shouldBootstrapDarkMode({
      isActive: true,
      options: { excludedDomains: ['example.com'] }
    }, 'example.com', true)).toBe(false)
  })

  it('supports system preference and overnight schedules', () => {
    expect(shouldBootstrapDarkMode({
      options: { syncWithSystem: true }
    }, 'example.com', true)).toBe(true)

    expect(shouldBootstrapDarkMode({
      options: { autoEnable: true, scheduleStart: '20:00', scheduleEnd: '07:00' }
    }, 'example.com', false, new Date(2026, 7, 29, 23, 0))).toBe(true)
  })

  it('builds a persistent dark canvas from validated colors', () => {
    const css = buildDarkModeBackdropCss({ backgroundColor: '#202124', textColor: '#f1f3f4' })
    expect(css).toContain('background-color: #202124 !important')
    expect(css).toContain('color: #f1f3f4 !important')
  })

  it('removes the bootstrap canvas completely when dark mode stops', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).not.toBeNull()

    retireDarkModeBootstrap()
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).toBeNull()
  })
})
