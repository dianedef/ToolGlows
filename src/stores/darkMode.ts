import { defineStore } from 'pinia'
import { sendMessage } from 'webext-bridge/content-script'
import { watch, ref, computed } from 'vue'

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
      // S'assurer que excludedDomains est un tableau avant la sauvegarde
      if (!Array.isArray(options.value.excludedDomains)) {
        options.value.excludedDomains = []
      }

      await Promise.all([
        chrome.storage.sync.set({ darkModeOptions: options.value }),
        chrome.storage.local.set({ darkModeActive: isActive.value })
      ])
      
      // Appliquer les changements immédiatement
      applyDarkMode()
      
      console.log('[SUCCESS] Dark mode options saved')
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
  
  function applyDarkMode() {
    if (!isInitialized.value || isDomainExcluded.value) return

    const styles = `
      html, body {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
      }
      
      * {
        transition: background-color ${options.value.transitionDuration}ms ease,
                    color ${options.value.transitionDuration}ms ease !important;
      }

      /* Éléments de base */
      div, section, article, aside, nav, header, footer, main {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
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
      
      /* Formulaires */
      input, textarea, select, button {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
        border-color: #444 !important;
      }
      
      /* Éléments spécifiques */
      .p-component,
      .p-component * {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
      }
      
      /* Exceptions pour certains composants PrimeVue */
      .p-button {
        background-color: var(--primary-color) !important;
        color: var(--primary-color-text) !important;
      }
      
      .p-button.p-button-secondary {
        background-color: var(--secondary-color) !important;
        color: var(--secondary-color-text) !important;
      }
      
      .p-button.p-button-text {
        background-color: transparent !important;
      }
      
      /* Bordures et ombres */
      .p-dialog,
      .p-dropdown-panel,
      .p-menu {
        border: 1px solid #444 !important;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5) !important;
      }
      
      /* Arrière-plans spéciaux */
      .p-dialog-header,
      .p-dialog-content,
      .p-dialog-footer {
        background-color: ${options.value.backgroundColor} !important;
        color: ${options.value.textColor} !important;
      }
      
      /* Textes et titres */
      h1, h2, h3, h4, h5, h6, p, span {
        color: ${options.value.textColor} !important;
      }
    `

    sendMessage('APPLY_DARK_MODE', {
      styles,
      isActive: isActive.value
    }, 'background').catch(error => {
      console.error('[ERROR] Failed to send dark mode update:', error)
    })

    // Appliquer aussi les styles à la popup de l'extension
    const popupStyle = document.getElementById('dark-mode-styles')
    if (popupStyle) {
      popupStyle.remove()
    }

    if (isActive.value) {
      const style = document.createElement('style')
      style.id = 'dark-mode-styles'
      style.textContent = styles
      document.head.appendChild(style)
    }
  }

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