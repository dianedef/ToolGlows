import { defineStore } from 'pinia'
import { watch, ref, computed } from 'vue'
import { sendMessage } from 'webext-bridge/content-script'
import { onMessage } from 'webext-bridge/background'

// Type pour la sérialisation JSON
type JsonValue = string | number | boolean | { [key: string]: JsonValue } | JsonValue[]

interface DarkModeOptions {
  backgroundColor: string
  textColor: string
  linkColor: string
  contrastLevel: number
  invertImages: boolean
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

// Messages pour le content script
interface ContentMessage {
  [key: string]: string | number | boolean
  styles: string
  isActive: boolean
  backgroundColor: string
  textColor: string
  linkColor: string
  invertImages: boolean
  contrastLevel: number
  transitionDuration: number
}

const defaultOptions: DarkModeOptions = {
  backgroundColor: '#1a1a1a',
  textColor: '#e0e0e0',
  linkColor: '#4a9eff',
  contrastLevel: 1,
  invertImages: false,
  autoEnable: false,
  scheduleStart: '20:00',
  scheduleEnd: '07:00',
  excludedDomains: [],
  transitionDuration: 300,
  syncWithSystem: false
}

export const useDarkModeStore = defineStore('darkMode', () => {
  const options = ref({ ...defaultOptions })
  const isActive = ref(false)
  const isInitialized = ref(false)
  const currentDomain = ref('')

  const isDomainExcluded = computed(() => {
    return Array.isArray(options.value.excludedDomains) &&
           options.value.excludedDomains.includes(currentDomain.value)
  })

  const shouldActivateDarkMode = computed(() => {
    if (!options.value.autoEnable) return isActive.value

    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const startTime = parseInt(options.value.scheduleStart.replace(':', ''))
    const endTime = parseInt(options.value.scheduleEnd.replace(':', ''))

    return currentTime >= startTime || currentTime <= endTime
  })

  // Watcher pour appliquer automatiquement les changements
  watch([isActive, options], () => {
    if (isInitialized.value) {
      applyDarkMode()
    }
  }, { deep: true })

  async function loadOptions() {
    if (isInitialized.value) return

    try {
      const result = await chrome.storage.sync.get('darkModeOptions')
      if (result.darkModeOptions) {
        const savedOptions = result.darkModeOptions
        savedOptions.excludedDomains = Array.isArray(savedOptions.excludedDomains)
          ? savedOptions.excludedDomains
          : []

        options.value = { ...defaultOptions, ...savedOptions }
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

      if (options.value.syncWithSystem) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
        isActive.value = prefersDark.matches
        prefersDark.addEventListener('change', (e) => {
          isActive.value = e.matches
        })
      }
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
      await Promise.all([
        chrome.storage.sync.set({ darkModeOptions: options.value }),
        chrome.storage.local.set({ darkModeActive: isActive.value })
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

  function setActive(value: boolean) {
    isActive.value = value
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

    const styles = `
      /* Styles de base */
      html, body {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
      }

      /* Styles des scrollbars pour Webkit (Chrome, Safari, etc.) */
      ::-webkit-scrollbar {
        width: 12px !important;
        height: 12px !important;
        background-color: ${options.value.backgroundColor} !important;
      }

      ::-webkit-scrollbar-track {
        background-color: ${options.value.backgroundColor} !important;
        border-radius: 8px !important;
      }

      ::-webkit-scrollbar-thumb {
        background-color: #444 !important;
        border: 2px solid ${options.value.backgroundColor} !important;
        border-radius: 8px !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: #666 !important;
      }

      ::-webkit-scrollbar-corner {
        background-color: ${options.value.backgroundColor} !important;
      }

      /* Styles des scrollbars pour Firefox */
      * {
        scrollbar-color: #444 ${options.value.backgroundColor} !important;
        scrollbar-width: thin !important;
      }

      /* Reste des styles... */
      html {
        background: ${options.value.backgroundColor} !important;
      }

      body {
        background: ${options.value.backgroundColor} !important;
        margin-color: ${options.value.backgroundColor} !important;
      }

      * {
        transition: background-color ${options.value.transitionDuration}ms ease,
                    color ${options.value.transitionDuration}ms ease !important;
      }

      /* Éléments de base */
      div, section, article, aside, nav, header, footer, main,
      table, tr, td, th, thead, tbody, tfoot,
      form, fieldset, legend,
      pre, code, blockquote,
      ul, ol, li, dl, dt, dd,
      details, summary, i, em {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
        background: ${options.value.backgroundColor} !important;
      }

      /* Gestion des marges et bordures */
      body::before,
      body::after,
      div::before,
      div::after,
      main::before,
      main::after,
      article::before,
      article::after,
      section::before,
      section::after,
      nav::before,
      nav::after,
      details::before,
      details::after,
      summary::before,
      summary::after,
      i::before,
      i::after {
        background: ${options.value.backgroundColor} !important;
        background-color: ${options.value.backgroundColor} !important;
        border-color: #444 !important;
      }

      /* Bordures et marges des tableaux */
      table, th, td {
        border-color: #444 !important;
      }

      /* Bordures des conteneurs */
      div, section, article, aside, nav, header, footer, main,
      .container, .content, .wrapper, .main,
      [class*="container"], [class*="content"], [class*="wrapper"],
      [class*="main"], [class*="body"], [class*="section"],
      details, summary {
        border-color: #444 !important;
        outline-color: #444 !important;
        background: ${options.value.backgroundColor} !important;
      }

      /* Suppression des marges blanches */
      [class*="bg-"],
      [class*="background"],
      [style*="background"],
      [style*="bg-"],
      [style*="margin"],
      [style*="padding"] {
        background: ${options.value.backgroundColor} !important;
        background-color: ${options.value.backgroundColor} !important;
      }

      /* Liens */
      a, a:visited, a:hover, a:active {
        color: ${options.value.linkColor} !important;
      }

      /* Images et vidéos */
      img, video, picture, svg {
        filter: ${options.value.invertImages ? 'invert(1)' : 'none'}
               brightness(${options.value.contrastLevel}) !important;
      }

      /* Formulaires et contrôles */
      input, textarea, select, button,
      [type="text"], [type="password"], [type="email"], [type="number"],
      [type="tel"], [type="url"], [type="search"], [type="date"],
      [type="time"], [type="datetime-local"], [type="month"],
      [type="week"], [type="color"], [type="file"],
      [type="submit"], [type="reset"], [type="button"] {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
        border-color: #444 !important;
      }

      /* Conteneurs spécifiques */
      .container, .content, .wrapper, .main,
      [class*="container"], [class*="content"], [class*="wrapper"],
      [class*="main"], [class*="body"], [class*="section"] {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
        background: ${options.value.backgroundColor} !important;
      }

      /* Gestion des iframes */
      iframe {
        border-color: #444 !important;
      }

      /* Gestion des éléments avec des ombres */
      [class*="shadow"],
      [class*="card"],
      [style*="box-shadow"] {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) !important;
      }

      /* Styles pour les icônes */
      i[class*="icon"],
      i[class*="fa-"],
      i[class*="material"],
      i[class*="pi-"],
      span[class*="icon"],
      span[class*="fa-"],
      span[class*="material"],
      span[class*="pi-"] {
        color: ${options.value.textColor} !important;
        background-color: #2a2a2a !important;
        background: #2a2a2a !important;
      }

      /* Styles spécifiques pour les icônes sans classe */
      i, span[class*="icon"] {
        background-color: #2a2a2a !important;
        background: #2a2a2a !important;
      }
    `

    try {
      // Envoyer au background script pour diffusion via les content scripts.
      await sendMessage('INJECT_DARK_MODE', {
        styles,
        isActive: isActive.value
      }, 'background')

      console.log('[DARK MODE STORE] ✅ Dark mode update sent to background')
    } catch (error) {
      console.error('[DARK MODE STORE] ❌ Failed to send dark mode update:', error)
    }
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
    setActive,
    toggleDarkMode,
    excludeDomain,
    includeDomain,
    applyDarkMode
  }
})
