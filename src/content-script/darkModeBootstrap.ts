export interface DarkModeBootstrapOptions {
  backgroundColor?: unknown
  textColor?: unknown
  autoEnable?: unknown
  scheduleStart?: unknown
  scheduleEnd?: unknown
  excludedDomains?: unknown
  syncWithSystem?: unknown
}

export interface DarkModeBootstrapState {
  isActive?: unknown
  options?: DarkModeBootstrapOptions
}

export const DARK_MODE_BOOTSTRAP_STYLE_ID = 'toolglows-dark-mode-bootstrap'
export const DARK_MODE_PREPAINT_OVERLAY_ID = 'toolglows-dark-mode-prepaint-overlay'
export const DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE = 'data-toolglows-dark-prepaint-retired'

let bootstrapGeneration = 0
let readinessObserver: MutationObserver | null = null
let readinessTimer: ReturnType<typeof setTimeout> | null = null
let readinessHardTimer: ReturnType<typeof setTimeout> | null = null
let readinessSettleTimer: ReturnType<typeof setTimeout> | null = null
let readinessLoadListener: (() => void) | null = null

const LIGHT_SURFACE_MIN_VIEWPORT_RATIO = 0.12
const LIGHT_SURFACE_LUMINANCE = 0.8
const VIEWPORT_SAMPLE_RATIOS = [0.2, 0.5, 0.8]

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function getMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  return hours * 60 + minutes
}

function isWithinSchedule(now: Date, start: unknown, end: unknown): boolean {
  const startMinutes = getMinutes(start)
  const endMinutes = getMinutes(end)
  if (startMinutes === null || endMinutes === null) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (startMinutes === endMinutes) return true
  if (startMinutes < endMinutes) return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export function shouldBootstrapDarkMode(
  state: DarkModeBootstrapState,
  hostname: string,
  systemPrefersDark: boolean,
  now = new Date()
): boolean {
  const options = state.options ?? {}
  const excludedDomains = Array.isArray(options.excludedDomains)
    ? options.excludedDomains.filter((domain): domain is string => typeof domain === 'string')
    : []

  if (excludedDomains.some(domain => domain.toLowerCase() === hostname.toLowerCase())) return false
  if (options.syncWithSystem === true) return systemPrefersDark
  if (options.autoEnable === true) return isWithinSchedule(now, options.scheduleStart, options.scheduleEnd)
  return state.isActive === true
}

export function retireDarkModeBootstrap(): void {
  bootstrapGeneration += 1
  readinessObserver?.disconnect()
  readinessObserver = null
  if (readinessTimer) clearTimeout(readinessTimer)
  readinessTimer = null
  if (readinessHardTimer) clearTimeout(readinessHardTimer)
  readinessHardTimer = null
  if (readinessSettleTimer) clearTimeout(readinessSettleTimer)
  readinessSettleTimer = null
  if (readinessLoadListener) window.removeEventListener('load', readinessLoadListener)
  readinessLoadListener = null
  document.documentElement?.setAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE, '')
  document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)?.remove()
  document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)?.remove()
}

function isDarkModeEngineReady(): boolean {
  if (typeof document === 'undefined') return false
  const fallback = document.querySelector('style.darkreader--fallback')
  return document.documentElement?.getAttribute('data-darkreader-mode') === 'dynamic' &&
    fallback instanceof HTMLStyleElement &&
    fallback.textContent?.trim() === ''
}

function isLightOpaqueColor(color: string): boolean {
  const match = color.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*(?:\.\d+)?))?\s*\)$/i)
  if (!match) return false

  const [, red, green, blue, alpha = '1'] = match
  if (Number(alpha) < 0.85) return false
  const luminance = (0.2126 * Number(red) + 0.7152 * Number(green) + 0.0722 * Number(blue)) / 255
  return luminance >= LIGHT_SURFACE_LUMINANCE
}

export function hasVisibleLargeLightSurface(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  if (typeof document.elementFromPoint !== 'function') return false
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const viewportArea = viewportWidth * viewportHeight
  if (viewportArea <= 0) return false

  const inspected = new Set<Element>()
  for (const yRatio of VIEWPORT_SAMPLE_RATIOS) {
    for (const xRatio of VIEWPORT_SAMPLE_RATIOS) {
      let element: Element | null = document.elementFromPoint(viewportWidth * xRatio, viewportHeight * yRatio)
      while (element) {
        if (!inspected.has(element)) {
          inspected.add(element)
          const rect = element.getBoundingClientRect()
          const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0))
          const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
          if (
            visibleWidth * visibleHeight >= viewportArea * LIGHT_SURFACE_MIN_VIEWPORT_RATIO &&
            isLightOpaqueColor(window.getComputedStyle(element).backgroundColor)
          ) return true
        }
        element = element.parentElement
      }
    }
  }
  return false
}

export function releaseDarkModePrepaintWhenReady(hardTimeoutMs = 15_000, settleMs = 150): void {
  readinessObserver?.disconnect()
  if (readinessTimer) clearTimeout(readinessTimer)
  if (readinessHardTimer) clearTimeout(readinessHardTimer)
  if (readinessSettleTimer) clearTimeout(readinessSettleTimer)
  if (readinessLoadListener) window.removeEventListener('load', readinessLoadListener)

  let visuallyReadySince: number | null = null
  const scheduleReleaseIfReady = () => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return false
    if (readinessTimer) clearTimeout(readinessTimer)
    readinessTimer = null
    if (!isDarkModeEngineReady() || document.readyState !== 'complete' || hasVisibleLargeLightSurface()) {
      visuallyReadySince = null
      if (readinessSettleTimer) clearTimeout(readinessSettleTimer)
      readinessSettleTimer = null
      readinessTimer = setTimeout(scheduleReleaseIfReady, 100)
      return false
    }

    const now = performance.now()
    visuallyReadySince ??= now
    const remainingSettleMs = Math.max(0, settleMs - (now - visuallyReadySince))
    if (readinessSettleTimer) clearTimeout(readinessSettleTimer)
    readinessSettleTimer = setTimeout(() => {
      readinessSettleTimer = null
      if (hasVisibleLargeLightSurface()) {
        visuallyReadySince = null
        scheduleReleaseIfReady()
        return
      }
      if (performance.now() - (visuallyReadySince ?? performance.now()) >= settleMs) {
        retireDarkModeBootstrap()
        return
      }
      scheduleReleaseIfReady()
    }, Math.min(remainingSettleMs || settleMs, 50))
    return true
  }
  scheduleReleaseIfReady()

  readinessObserver = new MutationObserver(() => {
    scheduleReleaseIfReady()
  })
  readinessObserver.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  })
  readinessLoadListener = () => scheduleReleaseIfReady()
  window.addEventListener('load', readinessLoadListener, { once: true })
  // This is only an emergency escape hatch. Normal retirement is visual: the
  // page must be fully loaded, the dark-mode engine ready, and large light surfaces gone.
  readinessHardTimer = setTimeout(() => retireDarkModeBootstrap(), hardTimeoutMs)
}

export function buildDarkModeBackdropCss(options: DarkModeBootstrapOptions = {}): string {
  const backgroundColor = normalizeColor(options.backgroundColor, '#1a1a1a')
  const textColor = normalizeColor(options.textColor, '#e0e0e0')

  return `
    :root { color-scheme: dark !important; background-color: ${backgroundColor} !important; }
    html, body { background-color: ${backgroundColor} !important; color: ${textColor} !important; }
    #${DARK_MODE_PREPAINT_OVERLAY_ID} { background-color: ${backgroundColor} !important; }
  `
}

export function maintainDarkModeBackdrop(options: DarkModeBootstrapOptions = {}): void {
  document.documentElement?.removeAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE)
  let overlay = document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = DARK_MODE_PREPAINT_OVERLAY_ID
    overlay.setAttribute('aria-hidden', 'true')
    document.documentElement?.appendChild(overlay)
  }
  let style = document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID) as HTMLStyleElement | null

  if (!style) {
    style = document.createElement('style')
    style.id = DARK_MODE_BOOTSTRAP_STYLE_ID
    ;(document.head ?? document.documentElement).appendChild(style)
  }

  style.textContent = buildDarkModeBackdropCss(options)
}

export async function installDarkModeBootstrap(): Promise<void> {
  if (!chrome?.storage?.local || !chrome?.storage?.sync) return
  const installationGeneration = bootstrapGeneration

  try {
    const [localState, syncState] = await Promise.all([
      chrome.storage.local.get(['toolglowsDarkModeBootstrap', 'darkModeActive']),
      chrome.storage.sync.get('darkModeOptions')
    ])
    if (installationGeneration !== bootstrapGeneration) return

    const cachedState = localState.toolglowsDarkModeBootstrap as DarkModeBootstrapState | undefined
    const state: DarkModeBootstrapState = cachedState ?? {
      isActive: localState.darkModeActive,
      options: syncState.darkModeOptions as DarkModeBootstrapOptions | undefined
    }
    const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

    if (!shouldBootstrapDarkMode(state, window.location.hostname, systemPrefersDark)) {
      retireDarkModeBootstrap()
      return
    }

    maintainDarkModeBackdrop(state.options)
    releaseDarkModePrepaintWhenReady()
  } catch (error) {
    console.warn('[DARK MODE] Unable to install the pre-render theme:', error)
  }
}
