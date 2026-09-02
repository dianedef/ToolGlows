import { enable } from 'darkreader'

export interface DarkModeEngineOptions {
  backgroundColor: string
  textColor: string
  linkColor: string
  contrastLevel: number
  transitionDuration: number
  excludedDomains: string[]
}

export interface ResolvedDarkModeEngineOptions extends DarkModeEngineOptions {
  contrast: number
}

const DEFAULT_OPTIONS: DarkModeEngineOptions = {
  backgroundColor: '#1b1f24',
  textColor: '#cfd4da',
  linkColor: '#7da9d1',
  contrastLevel: 1,
  transitionDuration: 300,
  excludedDomains: []
}

function normalizeHexColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback
}

export function resolveDarkModeEngineOptions(
  options: Partial<DarkModeEngineOptions> | undefined
): ResolvedDarkModeEngineOptions {
  const backgroundColor = normalizeHexColor(options?.backgroundColor, DEFAULT_OPTIONS.backgroundColor)
  const requestedTextColor = normalizeHexColor(options?.textColor, DEFAULT_OPTIONS.textColor)
  const requestedLinkColor = normalizeHexColor(options?.linkColor, DEFAULT_OPTIONS.linkColor)
  const requestedContrast = typeof options?.contrastLevel === 'number' && Number.isFinite(options.contrastLevel)
    ? Math.min(Math.max(options.contrastLevel, 0.5), 2)
    : DEFAULT_OPTIONS.contrastLevel
  const transitionDuration = typeof options?.transitionDuration === 'number' && Number.isFinite(options.transitionDuration)
    ? Math.round(Math.min(Math.max(options.transitionDuration, 0), 2_000))
    : DEFAULT_OPTIONS.transitionDuration

  return {
    backgroundColor,
    textColor: requestedTextColor,
    linkColor: requestedLinkColor,
    contrastLevel: requestedContrast,
    contrast: Math.round(100 + (requestedContrast - 1) * 40),
    transitionDuration,
    excludedDomains: Array.isArray(options?.excludedDomains)
      ? options.excludedDomains.filter((domain): domain is string => typeof domain === 'string')
      : []
  }
}

export function enableDarkModeEngine(
  options: Partial<DarkModeEngineOptions> | undefined
): ResolvedDarkModeEngineOptions {
  const resolved = resolveDarkModeEngineOptions(options)
  enable({
    mode: 1,
    brightness: 100,
    contrast: resolved.contrast,
    grayscale: 0,
    sepia: 0,
    darkSchemeBackgroundColor: resolved.backgroundColor,
    darkSchemeTextColor: resolved.textColor,
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

  return resolved
}
