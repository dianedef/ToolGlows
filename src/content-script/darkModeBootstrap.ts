import {
  enableDarkModeEngine,
  resolveDarkModeEngineOptions,
  type DarkModeEngineOptions
} from './darkModeEngine'

export interface DarkModeBootstrapOptions extends Partial<DarkModeEngineOptions> {
  autoEnable?: unknown
  scheduleStart?: unknown
  scheduleEnd?: unknown
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

export function retireDarkModePrepaint(): void {
  document.documentElement?.setAttribute(DARK_MODE_PREPAINT_RETIRED_ATTRIBUTE, '')
  // Remove the rejected overlay from already-open tabs during extension updates.
  document.getElementById(DARK_MODE_PREPAINT_OVERLAY_ID)?.remove()
}

export function retireDarkModeBootstrap(): void {
  bootstrapGeneration += 1
  retireDarkModePrepaint()
  document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)?.remove()
}

export function buildDarkModeBackdropCss(options: DarkModeBootstrapOptions = {}): string {
  const resolved = resolveDarkModeEngineOptions(options)
  return `
    :root { color-scheme: dark !important; background-color: ${resolved.backgroundColor} !important; }
    html, body { background-color: ${resolved.backgroundColor} !important; color: ${resolved.textColor} !important; }
  `
}

export function maintainDarkModeBackdrop(options: DarkModeBootstrapOptions = {}): void {
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

    // Start the real engine at document_start. A root backdrop stays underneath,
    // but no opaque element or readiness delay hides the page while it loads.
    maintainDarkModeBackdrop(state.options)
    enableDarkModeEngine(state.options)
    retireDarkModePrepaint()
  } catch (error) {
    console.warn('[DARK MODE] Unable to install the early theme:', error)
  }
}
