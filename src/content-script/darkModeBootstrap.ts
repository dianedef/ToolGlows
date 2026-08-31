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

let bootstrapGeneration = 0

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
  document.getElementById(DARK_MODE_BOOTSTRAP_STYLE_ID)?.remove()
}

export function buildDarkModeBackdropCss(options: DarkModeBootstrapOptions = {}): string {
  const backgroundColor = normalizeColor(options.backgroundColor, '#1a1a1a')
  const textColor = normalizeColor(options.textColor, '#e0e0e0')

  return `
    :root { color-scheme: dark !important; background-color: ${backgroundColor} !important; }
    html, body { background-color: ${backgroundColor} !important; color: ${textColor} !important; }
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

    if (!shouldBootstrapDarkMode(state, window.location.hostname, systemPrefersDark)) return

    maintainDarkModeBackdrop(state.options)
  } catch (error) {
    console.warn('[DARK MODE] Unable to install the pre-render theme:', error)
  }
}
