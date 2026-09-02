/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const darkModeEngine = vi.hoisted(() => ({ enable: vi.fn() }))
vi.mock('darkreader', () => darkModeEngine)

import {
  buildDarkModeBackdropCss,
  DARK_MODE_BOOTSTRAP_STYLE_ID,
  DARK_MODE_PREPAINT_OVERLAY_ID,
  DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE,
  installDarkModeBootstrap,
  maintainDarkModeBackdrop,
  retireDarkModeBootstrap,
  shouldBootstrapDarkMode
} from '../src/content-script/darkModeBootstrap'

function installStorageState(localState: Record<string, unknown>, syncState: Record<string, unknown> = {}) {
  vi.stubGlobal('chrome', {
    storage: {
      local: { get: vi.fn(async () => localState) },
      sync: { get: vi.fn(async () => syncState) }
    }
  })
}

describe('dark mode early startup', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    document.documentElement.removeAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)
    darkModeEngine.enable.mockClear()
  })

  afterEach(() => {
    retireDarkModeBootstrap()
    vi.unstubAllGlobals()
  })

  it('uses the persisted manual activation state', () => {
    expect(shouldBootstrapDarkMode({ isActive: true }, 'example.com', false)).toBe(true)
    expect(shouldBootstrapDarkMode({ isActive: false }, 'example.com', true)).toBe(false)
  })

  it('respects domain exclusions before startup', () => {
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

  it('keeps only a non-blocking root backdrop', () => {
    const css = buildDarkModeBackdropCss({
      backgroundColor: '#202124',
      textColor: '#f1f3f4',
      linkColor: '#8ab4f8'
    })
    expect(css).toContain('background-color: #202124 !important')
    expect(css).toContain('color: #f1f3f4 !important')
    expect(css).toContain('body a { color: #8ab4f8 !important; }')
    expect(css).toContain('color: #f1f3f4 !important;')
    expect(css).not.toContain(DARK_MODE_PREPAINT_OVERLAY_ID)

    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    maintainDarkModeBackdrop({ backgroundColor: '#242526' })
    expect(document.querySelectorAll(`#${DARK_MODE_BOOTSTRAP_STYLE_ID}`)).toHaveLength(1)
    expect(document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)).toBeNull()
  })

  it('uses a light canvas and preserves media for the Latte palette', () => {
    const css = buildDarkModeBackdropCss({
      palettePreset: 'latte',
      backgroundColor: '#eff1f5',
      textColor: '#4c4f69',
      linkColor: '#1e66f5'
    })
    expect(css).toContain('color-scheme: light')
    expect(css).toContain('background-color: #eff1f5')
    expect(css).toContain('filter: none !important')
  })

  it('installs media color preservation before the engine can mark inline SVGs', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })

    const css = document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)?.textContent
    expect(css).toContain('body [data-darkreader-inline-invert] {')
    expect(css).toContain('filter: brightness(0.68) contrast(0.92) saturate(0.92) !important;')
    expect(css).toContain('#toolglows-root svg')

    retireDarkModeBootstrap()
    expect(document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)).toBeNull()
  })

  it('starts the actual engine from cached state and retires prepaint immediately', async () => {
    installStorageState({
      toolglowsDarkModeBootstrap: {
        isActive: true,
        options: {
          backgroundColor: '#202124',
          textColor: '#f1f3f4',
          linkColor: '#8ab4f8',
          contrastLevel: 1.2,
          transitionDuration: 150,
          excludedDomains: []
        }
      }
    })

    await installDarkModeBootstrap()

    expect(darkModeEngine.enable).toHaveBeenCalledOnce()
    expect(darkModeEngine.enable).toHaveBeenCalledWith(
      expect.objectContaining({ darkSchemeBackgroundColor: '#202124', contrast: 108 }),
      expect.objectContaining({ ignoreImageAnalysis: expect.any(Array) })
    )
    expect(document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)).not.toBeNull()
    expect(document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)).toBeNull()
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(true)
  })

  it('does not start the engine for an excluded host and cleans legacy artifacts', async () => {
    const legacyOverlay = document.createElement('div')
    legacyOverlay.id = DARK_MODE_PREPAINT_OVERLAY_ID
    document.documentElement.appendChild(legacyOverlay)
    installStorageState({
      toolglowsDarkModeBootstrap: {
        isActive: true,
        options: { excludedDomains: [window.location.hostname] }
      }
    })

    await installDarkModeBootstrap()

    expect(darkModeEngine.enable).not.toHaveBeenCalled()
    expect(document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)).toBeNull()
    expect(document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)).toBeNull()
  })
})
