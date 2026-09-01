import { disable, enable, isEnabled } from 'darkreader'
import { onMessage } from 'webext-bridge/content-script'
import {
  maintainDarkModeBackdrop,
  releaseDarkModePrepaintWhenReady,
  retireDarkModeBootstrap
} from './darkModeBootstrap'
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

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
  const [red, green, blue] = channels.map(channel =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

function ensureReadableColor(preferred: string, background: string, minimumRatio: number): string {
  if (contrastRatio(preferred, background) >= minimumRatio) return preferred
  const lightFallback = '#f2f2f2'
  const darkFallback = '#111111'
  return contrastRatio(lightFallback, background) >= contrastRatio(darkFallback, background)
    ? lightFallback
    : darkFallback
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

    const requestedContrast = Math.min(Math.max(message.options.contrastLevel, 0.5), 2)
    const contrast = Math.round(100 + (requestedContrast - 1) * 40)
    const transitionDuration = Math.round(Math.min(Math.max(message.options.transitionDuration, 0), 2_000))
    const textColor = ensureReadableColor(
      message.options.textColor,
      message.options.backgroundColor,
      4.5
    )
    const linkColor = ensureReadableColor(
      message.options.linkColor,
      message.options.backgroundColor,
      3
    )
    const siteOverrides = buildSiteDarkModeOverrides(window.location.hostname)

    enable({
      mode: 1,
      brightness: 100,
      contrast,
      grayscale: 0,
      sepia: 0,
      darkSchemeBackgroundColor: message.options.backgroundColor,
      darkSchemeTextColor: textColor,
      scrollbarColor: 'auto',
      selectionColor: 'auto',
      styleSystemControls: true
    }, {
      invert: [],
      ignoreInlineStyle: [
        'img', 'picture', 'video', 'svg', 'canvas', '[role="img"]',
        '#toolglows-root', '#toolglows-root *', '[data-toolglows-ui]', '[data-toolglows-ui] *'
      ],
      ignoreImageAnalysis: [
        'img', 'picture', 'video', 'svg', 'canvas', '[role="img"]',
        '#toolglows-root', '#toolglows-root *', '[data-toolglows-ui]', '[data-toolglows-ui] *'
      ],
      disableStyleSheetsProxy: false,
      ignoreCSSUrl: [],
      css: ''
    })
    // Keep a stable dark canvas underneath the dark-mode engine. Some sites replace their
    // body styles after hydration and would otherwise reintroduce a white page.
    maintainDarkModeBackdrop(message.options)
    releaseDarkModePrepaintWhenReady()

    let overrideStyle = document.getElementById(OVERRIDE_STYLE_ID) as HTMLStyleElement | null
    if (!overrideStyle) {
      overrideStyle = document.createElement('style')
      overrideStyle.id = OVERRIDE_STYLE_ID
      document.head.appendChild(overrideStyle)
    }
    overrideStyle.textContent = `
      body a { color: ${linkColor} !important; }
      body :is(img, picture, video, svg, canvas, [role="img"]),
      body [data-darkreader-inline-invert] {
        filter: brightness(0.68) contrast(0.92) saturate(0.92) !important;
        transition: var(--tg-page-dark-media-transition);
      }
      #toolglows-root img,
      #toolglows-root svg,
      #toolglows-root [role="img"],
      [data-toolglows-ui] img,
      [data-toolglows-ui] svg,
      [data-toolglows-ui] [role="img"] {
        filter: none !important;
      }
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
