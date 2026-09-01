interface StoredDarkModeOptions {
  autoEnable?: unknown
  scheduleStart?: unknown
  scheduleEnd?: unknown
  excludedDomains?: unknown
  syncWithSystem?: unknown
}

interface StoredDarkModeBootstrap {
  isActive?: unknown
  options?: StoredDarkModeOptions
}

export interface DarkModePrepaintApi {
  storage: {
    local: { get(keys: string | string[]): Promise<Record<string, unknown>> }
    sync: { get(keys: string | string[]): Promise<Record<string, unknown>> }
  }
  scripting: {
    getRegisteredContentScripts(filter: { ids: string[] }): Promise<Array<{ id: string }>>
    registerContentScripts(scripts: DarkModePrepaintRegistration[]): Promise<void>
    updateContentScripts(scripts: DarkModePrepaintRegistration[]): Promise<void>
    unregisterContentScripts(filter: { ids: string[] }): Promise<void>
  }
  alarms: {
    clear(name: string): Promise<boolean> | boolean
    create(name: string, alarmInfo: { when: number }): Promise<void> | void
  }
}

export interface DarkModePrepaintRegistration {
  id: string
  matches: string[]
  excludeMatches?: string[]
  css: string[]
  allFrames: boolean
  runAt: 'document_start'
  persistAcrossSessions: boolean
}

export type DarkModePrepaintMode = 'off' | 'always' | 'system'

export const DARK_MODE_PREPAINT_SCRIPT_ID = 'toolglows-dark-mode-prepaint'
export const DARK_MODE_PREPAINT_ALARM = 'toolglows-dark-mode-prepaint-schedule'

const PREPAINT_CSS_BY_MODE: Record<Exclude<DarkModePrepaintMode, 'off'>, string> = {
  always: 'dark-mode-prepaint.css',
  system: 'dark-mode-prepaint-system.css'
}

function getMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  return hours * 60 + minutes
}

export function isWithinDarkModeSchedule(now: Date, start: unknown, end: unknown): boolean {
  const startMinutes = getMinutes(start)
  const endMinutes = getMinutes(end)
  if (startMinutes === null || endMinutes === null) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (startMinutes === endMinutes) return true
  if (startMinutes < endMinutes) return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export function resolveDarkModePrepaintMode(
  state: StoredDarkModeBootstrap,
  now = new Date()
): DarkModePrepaintMode {
  const options = state.options ?? {}
  if (options.syncWithSystem === true) return 'system'
  if (options.autoEnable === true) {
    return isWithinDarkModeSchedule(now, options.scheduleStart, options.scheduleEnd) ? 'always' : 'off'
  }
  return state.isActive === true ? 'always' : 'off'
}

export function buildDarkModePrepaintExclusions(domains: unknown): string[] {
  if (!Array.isArray(domains)) return []

  return [...new Set(domains.flatMap(candidate => {
    if (typeof candidate !== 'string') return []
    const hostname = candidate.trim().toLowerCase()
    if (
      hostname.length === 0 ||
      hostname.length > 253 ||
      !/^[a-z0-9.-]+$/.test(hostname) ||
      hostname.startsWith('.') ||
      hostname.endsWith('.') ||
      hostname.includes('..')
    ) return []
    return [`*://${hostname}/*`]
  }))]
}

export function getNextDarkModeScheduleBoundary(
  options: StoredDarkModeOptions,
  now = new Date()
): Date | null {
  if (options.autoEnable !== true || options.syncWithSystem === true) return null
  const startMinutes = getMinutes(options.scheduleStart)
  const endMinutes = getMinutes(options.scheduleEnd)
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return null

  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const candidates: Date[] = []

  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1) {
    for (const minutes of [startMinutes, endMinutes + 1]) {
      const candidate = new Date(midnight)
      candidate.setDate(candidate.getDate() + dayOffset)
      candidate.setMinutes(minutes)
      if (candidate.getTime() > now.getTime()) candidates.push(candidate)
    }
  }

  return candidates.sort((first, second) => first.getTime() - second.getTime())[0] ?? null
}

function buildRegistration(
  mode: Exclude<DarkModePrepaintMode, 'off'>,
  excludedDomains: unknown
): DarkModePrepaintRegistration {
  const excludeMatches = buildDarkModePrepaintExclusions(excludedDomains)
  return {
    id: DARK_MODE_PREPAINT_SCRIPT_ID,
    matches: ['http://*/*', 'https://*/*'],
    ...(excludeMatches.length > 0 ? { excludeMatches } : {}),
    css: [PREPAINT_CSS_BY_MODE[mode]],
    allFrames: true,
    runAt: 'document_start',
    persistAcrossSessions: true
  }
}

export async function syncDarkModePrepaint(
  api: DarkModePrepaintApi,
  now = new Date()
): Promise<DarkModePrepaintMode> {
  const [localState, syncState] = await Promise.all([
    api.storage.local.get(['toolglowsDarkModeBootstrap', 'darkModeActive']),
    api.storage.sync.get('darkModeOptions')
  ])
  const cachedState = localState.toolglowsDarkModeBootstrap as StoredDarkModeBootstrap | undefined
  const state: StoredDarkModeBootstrap = cachedState ?? {
    isActive: localState.darkModeActive,
    options: syncState.darkModeOptions as StoredDarkModeOptions | undefined
  }
  const mode = resolveDarkModePrepaintMode(state, now)

  await api.alarms.clear(DARK_MODE_PREPAINT_ALARM)
  const nextBoundary = getNextDarkModeScheduleBoundary(state.options ?? {}, now)
  if (nextBoundary) {
    await api.alarms.create(DARK_MODE_PREPAINT_ALARM, { when: nextBoundary.getTime() })
  }

  const existing = await api.scripting.getRegisteredContentScripts({ ids: [DARK_MODE_PREPAINT_SCRIPT_ID] })
  if (mode === 'off') {
    if (existing.length > 0) {
      await api.scripting.unregisterContentScripts({ ids: [DARK_MODE_PREPAINT_SCRIPT_ID] })
    }
    return mode
  }

  const registration = buildRegistration(mode, state.options?.excludedDomains)
  if (existing.length > 0) {
    await api.scripting.updateContentScripts([registration])
  } else {
    await api.scripting.registerContentScripts([registration])
  }
  return mode
}
