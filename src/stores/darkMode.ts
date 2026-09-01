import { defineStore } from 'pinia'
import { watch, ref, computed } from 'vue'
import { sendMessage } from 'webext-bridge/content-script'
import { onMessage } from 'webext-bridge/background'
import { applyDarkMode as applyDarkModeEngine, type DarkModeMessage } from '@/content-script/darkMode'
import {
  resolveDarkModePalettePreferences,
  switchDarkModePalette,
  type DarkModePaletteColors,
  type DarkModePalettePreset
} from './darkModePalette'

// Type pour la sérialisation JSON
type JsonValue = string | number | boolean | { [key: string]: JsonValue } | JsonValue[]

interface DarkModeOptions {
  palettePreset: DarkModePalettePreset
  customColors: DarkModePaletteColors
  backgroundColor: string
  textColor: string
  linkColor: string
  contrastLevel: number
  autoEnable: boolean
  scheduleStart: string
  scheduleEnd: string
  excludedDomains: string[]
  transitionDuration: number
  syncWithSystem: boolean
}

// Messages pour la synchronisation
interface SyncMessage {
  [key: string]: boolean | DarkModeOptions
  isActive: boolean
  options: DarkModeOptions
}

const defaultOptions: DarkModeOptions = {
  ...resolveDarkModePalettePreferences({}),
  contrastLevel: 1,
  autoEnable: false,
  scheduleStart: '20:00',
  scheduleEnd: '07:00',
  excludedDomains: [],
  transitionDuration: 300,
  syncWithSystem: false
}

function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const normalized = value.startsWith('#') ? value : `#${value}`
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : fallback
}

function getMinutes(time: string): number | null {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

function isWithinSchedule(now: Date, start: string, end: string): boolean {
  const startMinutes = getMinutes(start)
  const endMinutes = getMinutes(end)
  if (startMinutes === null || endMinutes === null) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  if (startMinutes === endMinutes) return true
  if (startMinutes < endMinutes) return currentMinutes >= startMinutes && currentMinutes <= endMinutes

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export const useDarkModeStore = defineStore('darkMode', () => {
  const options = ref({ ...defaultOptions })
  const isActive = ref(false)
  const isInitialized = ref(false)
  const currentDomain = ref('')
  const systemPrefersDark = ref<boolean | null>(null)
  let systemMediaQuery: MediaQueryList | null = null
  let scheduleTimer: ReturnType<typeof setInterval> | null = null

  const isDomainExcluded = computed(() => {
    return Array.isArray(options.value.excludedDomains) &&
           options.value.excludedDomains.includes(currentDomain.value)
  })

  const shouldActivateDarkMode = computed(() => {
    if (options.value.syncWithSystem && systemPrefersDark.value !== null) {
      return systemPrefersDark.value
    }

    if (options.value.autoEnable) {
      return isWithinSchedule(new Date(), options.value.scheduleStart, options.value.scheduleEnd)
    }

    return isActive.value
  })

  // Watcher pour appliquer automatiquement les changements
  watch([isActive, options, systemPrefersDark], () => {
    if (isInitialized.value) {
      applyDarkMode()
    }
  }, { deep: true })

  function syncWithSystemPreference() {
    if (!options.value.syncWithSystem) {
      systemPrefersDark.value = null
      return
    }

    try {
      if (!systemMediaQuery) {
        systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        systemMediaQuery.addEventListener('change', (event) => {
          systemPrefersDark.value = event.matches
        })
      }

      systemPrefersDark.value = systemMediaQuery.matches
    } catch (error) {
      console.warn('[WARN] Unable to read system color preference:', error)
      systemPrefersDark.value = null
    }
  }

  watch(() => options.value.syncWithSystem, () => {
    if (isInitialized.value) syncWithSystemPreference()
  })

  function syncScheduleTimer() {
    if (scheduleTimer) {
      clearInterval(scheduleTimer)
      scheduleTimer = null
    }

    if (options.value.autoEnable) {
      scheduleTimer = setInterval(() => {
        if (isInitialized.value) applyDarkMode()
      }, 30_000)
    }
  }

  watch(() => options.value.autoEnable, () => {
    syncScheduleTimer()
  })

  async function loadOptions() {
    if (isInitialized.value) return

    try {
      const result = await chrome.storage.sync.get('darkModeOptions')
      if (result.darkModeOptions) {
        const savedOptions = result.darkModeOptions as Partial<DarkModeOptions> & { invertImages?: unknown }
        const {
          invertImages: _legacyInvertImages,
          excludedDomains,
          ...savedOptionsWithoutLegacyImageInversion
        } = savedOptions

        const palettePreferences = resolveDarkModePalettePreferences(savedOptions)
        options.value = {
          ...defaultOptions,
          ...savedOptionsWithoutLegacyImageInversion,
          ...palettePreferences,
          excludedDomains: Array.isArray(excludedDomains) ? excludedDomains : []
        }

        if ('invertImages' in savedOptions || savedOptions.palettePreset === undefined) {
          await chrome.storage.sync.set({ darkModeOptions: options.value })
        }
      }

      const activeState = await chrome.storage.local.get('darkModeActive')
      if (activeState.darkModeActive !== undefined) {
        isActive.value = activeState.darkModeActive
      }

      try {
        currentDomain.value = window.location.hostname
      } catch (error) {
        console.warn('[WARN] Unable to detect current domain:', error)
        currentDomain.value = ''
      }

      syncWithSystemPreference()
      syncScheduleTimer()
    } catch (error) {
      console.error('[ERROR] Failed to load dark mode options:', error)
      options.value = { ...defaultOptions }
    } finally {
      isInitialized.value = true
      applyDarkMode()
    }
  }

  async function saveOptions() {
    if (!isInitialized.value) {
      await loadOptions()
    }

    try {
      options.value.backgroundColor = normalizeHexColor(options.value.backgroundColor, defaultOptions.backgroundColor)
      options.value.textColor = normalizeHexColor(options.value.textColor, defaultOptions.textColor)
      options.value.linkColor = normalizeHexColor(options.value.linkColor, defaultOptions.linkColor)
      if (options.value.palettePreset === 'custom') {
        options.value.customColors = {
          backgroundColor: options.value.backgroundColor,
          textColor: options.value.textColor,
          linkColor: options.value.linkColor
        }
      }

      await Promise.all([
        chrome.storage.sync.set({ darkModeOptions: options.value }),
        chrome.storage.local.set({
          darkModeActive: isActive.value,
          toolglowsDarkModeBootstrap: {
            isActive: isActive.value,
            options: options.value
          }
        })
      ])

      console.log('[SUCCESS] Dark mode options saved and synced')
    } catch (error) {
      console.error('[ERROR] Failed to save dark mode options:', error)
    }
  }

  async function updateOptions(newOptions: Partial<DarkModeOptions>) {
    if (!isInitialized.value) {
      await loadOptions()
    }

    options.value = { ...options.value, ...newOptions }
    await saveOptions()
  }

  async function setActive(value: boolean) {
    // A manual action is an explicit override. Leaving an automation enabled
    // here would immediately undo the user's click and make the toggle lie.
    options.value.autoEnable = false
    options.value.syncWithSystem = false
    isActive.value = value
    await saveOptions()
    // Do not rely solely on Vue's async watcher: removal from activeTools must
    // synchronously retire Dark Mode, the bootstrap canvas and DOM markers.
    if (!value) applyDarkModeEngine({
      isActive: false,
      options: {
        backgroundColor: options.value.backgroundColor,
        textColor: options.value.textColor,
        linkColor: options.value.linkColor,
        contrastLevel: options.value.contrastLevel,
        transitionDuration: options.value.transitionDuration,
        excludedDomains: [...options.value.excludedDomains]
      }
    })
  }

  async function setPalettePreset(preset: DarkModePalettePreset) {
    options.value = {
      ...options.value,
      ...switchDarkModePalette(options.value, preset)
    }
    await saveOptions()
  }

  async function setPaletteColor(color: keyof DarkModePaletteColors, value: string) {
    const fallback = options.value.customColors[color]
    const normalizedValue = normalizeHexColor(value, fallback)
    options.value = {
      ...options.value,
      palettePreset: 'custom',
      [color]: normalizedValue,
      customColors: {
        ...options.value.customColors,
        [color]: normalizedValue
      }
    }
    await saveOptions()
  }

  function setSyncWithSystem(value: boolean) {
    options.value.syncWithSystem = value
    if (value) options.value.autoEnable = false
    syncWithSystemPreference()
    saveOptions()
  }

  function setAutoEnable(value: boolean) {
    options.value.autoEnable = value
    if (value) options.value.syncWithSystem = false
    syncScheduleTimer()
    saveOptions()
  }

  function toggleDarkMode() {
    isActive.value = !isActive.value
    saveOptions()
  }

  function excludeDomain(domain: string) {
    if (!options.value.excludedDomains.includes(domain)) {
      options.value.excludedDomains.push(domain)
      saveOptions()
    }
  }

  function includeDomain(domain: string) {
    const index = options.value.excludedDomains.indexOf(domain)
    if (index > -1) {
      options.value.excludedDomains.splice(index, 1)
      saveOptions()
    }
  }

  async function applyDarkMode() {
    console.log('[DARK MODE STORE] 🎨 Applying dark mode with options:', options.value)

    const shouldApply = shouldActivateDarkMode.value && !isDomainExcluded.value
    const message: DarkModeMessage = {
      isActive: shouldApply,
      options: {
        backgroundColor: normalizeHexColor(options.value.backgroundColor, defaultOptions.backgroundColor),
        textColor: normalizeHexColor(options.value.textColor, defaultOptions.textColor),
        linkColor: normalizeHexColor(options.value.linkColor, defaultOptions.linkColor),
        contrastLevel: options.value.contrastLevel,
        transitionDuration: options.value.transitionDuration,
        excludedDomains: [...options.value.excludedDomains]
      }
    }
    const applied = applyDarkModeEngine(message)

    if (!applied) return

    // La page courante est mise à jour immédiatement. La diffusion aux autres
    // onglets reste une synchronisation secondaire, qui ne doit jamais bloquer
    // l'action demandée par la personne sur le site qu'elle visite.
    void sendMessage('INJECT_DARK_MODE', {
      ...message,
      isActive: shouldActivateDarkMode.value
    } as unknown as JsonValue, 'background')
      .then(() => console.log('[DARK MODE STORE] ✅ Dark mode update sent to background'))
      .catch(error => console.warn('[DARK MODE STORE] ⚠️ Background sync unavailable:', error))
  }

  // Écouter les mises à jour depuis d'autres onglets
  onMessage('DARK_MODE_SYNC', ({ data }) => {
    console.log('[DEBUG] Received dark mode sync:', data)
    if (typeof data === 'object' && data !== null) {
      const message = data as SyncMessage
      if (message.options) {
        options.value = message.options
      }
      if (typeof message.isActive === 'boolean') {
        isActive.value = message.isActive
      }
    }
  })

  return {
    options,
    isActive,
    isInitialized,
    currentDomain,
    isDomainExcluded,
    shouldActivateDarkMode,
    loadOptions,
    saveOptions,
    updateOptions,
    setPalettePreset,
    setPaletteColor,
    setActive,
    setSyncWithSystem,
    setAutoEnable,
    toggleDarkMode,
    excludeDomain,
    includeDomain,
    applyDarkMode
  }
})
