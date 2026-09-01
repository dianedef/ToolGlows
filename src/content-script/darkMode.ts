import { disable, isEnabled } from 'darkreader'
import { onMessage } from 'webext-bridge/content-script'
import {
  maintainDarkModeBackdrop,
  retireDarkModePrepaint,
  retireDarkModeBootstrap
} from './darkModeBootstrap'
import { enableDarkModeEngine } from './darkModeEngine'
import { buildSiteDarkModeOverrides } from './darkModeSiteOverrides'
import { startSofteningBrightSurfaces, stopSofteningBrightSurfaces } from './softenBrightSurfaces'

export interface DarkModeThemeOptions {
  backgroundColor: string
  textColor: string
  linkColor: string
  contrastLevel: number
  transitionDuration: number
  excludedDomains: string[]
}

export interface DarkModeMessage {
  isActive: boolean
  options: DarkModeThemeOptions
}

let isDarkModeActive = false
const OVERRIDE_STYLE_ID = 'toolglows-dark-mode-overrides'

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function isDarkModeMessage(data: unknown): data is DarkModeMessage {
  if (typeof data !== 'object' || data === null) return false
  const message = data as Partial<DarkModeMessage>
  const options = message.options as Partial<DarkModeThemeOptions> | undefined

  return typeof message.isActive === 'boolean' &&
    typeof options === 'object' && options !== null &&
    isHexColor(options.backgroundColor) &&
    isHexColor(options.textColor) &&
    isHexColor(options.linkColor) &&
    typeof options.contrastLevel === 'number' && Number.isFinite(options.contrastLevel) &&
    typeof options.transitionDuration === 'number' && Number.isFinite(options.transitionDuration) &&
    Array.isArray(options.excludedDomains) &&
    options.excludedDomains.every(domain => typeof domain === 'string')
}

function isCurrentDomainExcluded(excludedDomains: string[]): boolean {
  const hostname = window.location.hostname.toLowerCase()
  return excludedDomains.some(domain => domain.toLowerCase() === hostname)
}

export function applyDarkMode(message: DarkModeMessage): boolean {
  try {
    if (!message.isActive || isCurrentDomainExcluded(message.options.excludedDomains)) {
      return removeDarkMode()
    }

    const { linkColor, transitionDuration } = enableDarkModeEngine(message.options)
    const siteOverrides = buildSiteDarkModeOverrides(window.location.hostname)
    // Keep a stable dark canvas underneath the dark-mode engine. Some sites replace their
    // body styles after hydration and would otherwise reintroduce a white page.
    maintainDarkModeBackdrop(message.options)
    retireDarkModePrepaint()

    let overrideStyle = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null
    if (!overrideStyle) {
      overrideStyle = document.createElement('style')
      overrideStyle.id = OVERRIDE_STYLE_ID
      document.head.appendChild(overrideStyle)
    }
    overrideStyle.textContent = `
      body a { color: ${linkColor} !important; }
      html, body {
        transition: background-color ${transitionDuration}ms ease, color ${transitionDuration}ms ease;
      }
      [data-toolglows-soft-light="surface"] {
        background-color: var(--tg-page-dark-surface) !important;
        color: var(--tg-page-dark-text) !important;
      }
      [data-toolglows-soft-light="raised"] {
        background-color: var(--tg-page-dark-surface-raised) !important;
        color: var(--tg-page-dark-text) !important;
      }
      [data-toolglows-soft-light="warm"] {
        background-color: var(--tg-page-dark-surface-warm) !important;
        color: var(--tg-page-dark-text) !important;
      }
      [data-toolglows-soft-light="cool"] {
        background-color: var(--tg-page-dark-surface-cool) !important;
        color: var(--tg-page-dark-text) !important;
      }
      [data-toolglows-soft-light="control"] {
        background-color: var(--tg-page-dark-surface-raised) !important;
        border: 1px solid var(--tg-page-dark-border) !important;
        box-shadow: var(--tg-page-dark-control-shadow) !important;
        color: var(--tg-page-dark-text) !important;
      }
      [data-toolglows-soft-light="control"]:hover {
        background-color: var(--tg-page-dark-action-surface) !important;
        border-color: var(--tg-page-dark-action-border) !important;
      }
      [data-toolglows-soft-light="control"]:focus-visible {
        outline: 2px solid var(--tg-page-dark-focus) !important;
        outline-offset: 2px !important;
      }
      [data-toolglows-soft-light="success"] {
        background-color: var(--tg-page-dark-success-surface) !important;
        border: 1px solid var(--tg-page-dark-success-border) !important;
        box-shadow: var(--tg-page-dark-control-shadow) !important;
        color: var(--tg-page-dark-success) !important;
      }
      [data-toolglows-soft-light="success"] :is(span, svg) {
        background-color: transparent !important;
        color: inherit !important;
      }
      ${siteOverrides}
    `
    startSofteningBrightSurfaces()

    isDarkModeActive = true
    return true
  } catch (error) {
    console.error('[DARK MODE] Failed to enable the dynamic theme:', error)
    return false
  }
}

export function removeDarkMode(): boolean {
  try {
    retireDarkModeBootstrap()
    if (isEnabled()) disable()
    document.getElementById(OVERRIDE_STYLE_ID)?.remove()
    stopSofteningBrightSurfaces()
    isDarkModeActive = false
    return true
  } catch (error) {
    console.error('[DARK MODE] Failed to disable the dynamic theme:', error)
    return false
  }
}

onMessage('DARK_MODE_UPDATE', ({ data }) => {
  if (!isDarkModeMessage(data)) {
    console.warn('[DARK MODE] Ignored invalid update payload')
    return
  }
  applyDarkMode(data)
})

export { isDarkModeActive }
