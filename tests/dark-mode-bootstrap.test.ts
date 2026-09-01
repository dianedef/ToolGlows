/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildDarkModeBackdropCss,
  DARK_MODE_PREPAINT_OVERLAY_ID,
  DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE,
  hasVisibleLargeLightSurface,
  maintainDarkModeBackdrop,
  releaseDarkModePrepaintWhenReady,
  retireDarkModeBootstrap,
  shouldBootstrapDarkMode
} from '../src/content-script/darkModeBootstrap'

describe('dark mode pre-render decision', () => {
  beforeEach(() => {
    vi.useRealTimers()
    retireDarkModeBootstrap()
    document.documentElement.removeAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)
    document.querySelectorAll('.darkreader--fallback, [data-test-light-surface]').forEach(element => element.remove())
  })

  afterEach(() => {
    retireDarkModeBootstrap()
    vi.useRealTimers()
  })

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
    expect(css).toContain(`#${DARK_MODE_PREPAINT_OVERLAY_ID} { background-color: #202124 !important; }`)
  })

  it('creates one stable DOM overlay and keeps backdrop setup idempotent', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    maintainDarkModeBackdrop({ backgroundColor: '#242526' })

    const overlays = document.querySelectorAll(`#${DARK_MODE_PREPAINT_OVERLAY_ID}`)
    expect(overlays).toHaveLength(1)
    expect(overlays[0].getAttribute('aria-hidden')).toBe('true')
    expect(overlays[0].parentElement).toBe(document.documentElement)
  })

  it('removes the bootstrap canvas completely when dark mode stops', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).not.toBeNull()
    expect(document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)).not.toBeNull()

    retireDarkModeBootstrap()
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).toBeNull()
    expect(document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)).toBeNull()
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(true)
  })

  it('retires the declarative prepaint only after the dark-mode engine is ready', async () => {
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    releaseDarkModePrepaintWhenReady(2_000, 10)

    const fallback = document.createElement('style')
    fallback.className = 'darkreader darkreader--fallback'
    fallback.textContent = 'html { background: #202124; }'
    document.head.appendChild(fallback)
    document.documentElement.setAttribute('data-darkreader-mode', 'dynamic')

    await Promise.resolve()
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(false)

    fallback.textContent = ''
    await vi.waitFor(() => {
      expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(true)
    })
  })

  it('keeps the prepaint while a large visible surface is still light', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1_000 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })

    const surface = document.createElement('main')
    surface.dataset.testLightSurface = ''
    surface.style.backgroundColor = 'rgb(255, 255, 255)'
    surface.getBoundingClientRect = () => ({
      left: 100, top: 100, right: 900, bottom: 700, width: 800, height: 600, x: 100, y: 100, toJSON: () => ({})
    })
    document.body.appendChild(surface)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => surface })

    const fallback = document.createElement('style')
    fallback.className = 'darkreader darkreader--fallback'
    document.head.appendChild(fallback)
    document.documentElement.setAttribute('data-darkreader-mode', 'dynamic')
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    releaseDarkModePrepaintWhenReady(2_000, 100)

    expect(hasVisibleLargeLightSurface()).toBe(true)
    await vi.advanceTimersByTimeAsync(500)
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(false)

    surface.style.backgroundColor = 'rgb(32, 33, 36)'
    await vi.advanceTimersByTimeAsync(99)
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(true)
  })

  it('does not use the former 2.5 second escape hatch while content remains light', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1_000 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })

    const surface = document.createElement('main')
    surface.dataset.testLightSurface = ''
    surface.style.backgroundColor = 'rgb(255, 255, 255)'
    surface.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 1_000, bottom: 800, width: 1_000, height: 800, x: 0, y: 0, toJSON: () => ({})
    })
    document.body.appendChild(surface)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => surface })

    const fallback = document.createElement('style')
    fallback.className = 'darkreader darkreader--fallback'
    document.head.appendChild(fallback)
    document.documentElement.setAttribute('data-darkreader-mode', 'dynamic')
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })
    releaseDarkModePrepaintWhenReady(15_000, 150)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(document.documentElement.hasAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)).toBe(false)
  })
})
