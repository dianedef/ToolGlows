import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSettingsStore } from './settings'

interface HiddenElement {
  selector: string
  domain: string
  timestamp: number
  name?: string // Nom lisible de l'élément pour l'affichage
}

export interface HideElementSettings {
  hiddenElements: HiddenElement[]
  isSelectingElement: boolean
  shortcut: string
  enableShortcut: boolean
}

const defaultSettings: HideElementSettings = {
  hiddenElements: [],
  isSelectingElement: false,
  shortcut: 'Alt+H',
  enableShortcut: true
}

export const useHideElementStore = defineStore('hideElement', () => {
  const settingsStore = useSettingsStore()
  const isActive = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const settings = ref<HideElementSettings>(defaultSettings)

  // S'assurer que isActive est mis à jour quand le store est activé
  watch(isActive, (newValue) => {
    console.log('[INFO] HideElement store isActive changed:', newValue)
    if (!newValue) {
      settings.value.isSelectingElement = false
    }
  })

  // Surveiller uniquement les changements qui nécessitent une sauvegarde
  watch(() => settings.value.hiddenElements, async () => {
    await saveSettings()
  }, { deep: true })

  watch(() => settings.value.shortcut, async () => {
    await saveSettings()
  })

  watch(() => settings.value.enableShortcut, async () => {
    await saveSettings()
  })

  const setActive = (value: boolean) => {
    console.log('[INFO] Setting HideElement store active:', value)
    try {
      isActive.value = value
    } catch (err) {
      console.error('[ERROR] Failed to set active state:', err)
    }
  }

  const hideElement = async (element: HTMLElement) => {
    try {
      // Générer un sélecteur unique pour l'élément
      const selector = generateUniqueSelector(element)

      // Ajouter à la liste des éléments masqués
      const hiddenElement: HiddenElement = {
        selector,
        domain: window.location.hostname,
        timestamp: Date.now(),
        name: getElementName(element)
      }

      settings.value.hiddenElements.push(hiddenElement)

      // Masquer l'élément
      element.style.display = 'none'
    } catch (err) {
      console.error('[ERROR] Failed to hide element:', err)
      error.value = 'Erreur lors du masquage de l\'élément'
    }
  }

  const getElementName = (element: HTMLElement): string => {
    // Essayer de trouver un nom significatif pour l'élément
    if (element.id) {
      return `#${element.id}`
    }

    if (element.textContent) {
      const text = element.textContent.trim()
      if (text.length > 0) {
        return text.length > 30 ? text.substring(0, 30) + '...' : text
      }
    }

    return element.tagName.toLowerCase()
  }

  const generateUniqueSelector = (element: HTMLElement): string => {
    // ID
    if (element.id) {
      return `#${element.id}`
    }

    // Classes
    const classes = Array.from(element.classList)
      .filter(cls => !cls.includes('toolglows'))
      .join('.')
    if (classes) {
      return `.${classes}`
    }

    // Position dans le parent
    const parent = element.parentElement
    if (parent) {
      const index = Array.from(parent.children).indexOf(element)
      return `${generateUniqueSelector(parent)} > :nth-child(${index + 1})`
    }

    return element.tagName.toLowerCase()
  }

  const removeHiddenElement = async (selector: string) => {
    const index = settings.value.hiddenElements.findIndex(el => el.selector === selector)
    if (index > -1) {
      settings.value.hiddenElements.splice(index, 1)
    }
  }

  const updateShortcut = async (shortcut: string) => {
    settings.value.shortcut = shortcut
  }

  const toggleShortcut = async (enabled: boolean) => {
    settings.value.enableShortcut = enabled
  }

  const saveSettings = async () => {
    try {
      await settingsStore.updateSettings({
        hideElement: {
          ...settings.value,
          isSelectingElement: false // Ne pas sauvegarder l'état de sélection
        }
      })
    } catch (err) {
      console.error('[ERROR] Failed to save hide element settings:', err)
      throw err
    }
  }

  const loadSettings = async () => {
    try {
      const storedSettings = settingsStore.settings.hideElement
      if (storedSettings) {
        settings.value = {
          ...defaultSettings,
          ...storedSettings
        }
        // Appliquer les masquages pour le domaine actuel
        applyHiddenElements()
      } else {
        settings.value = defaultSettings
      }
    } catch (err) {
      console.error('[ERROR] Failed to load hide element settings:', err)
      settings.value = defaultSettings
    }
  }

  // Fonction pour appliquer les masquages
  const applyHiddenElements = () => {
    const currentDomain = window.location.hostname
    const elementsToHide = settings.value.hiddenElements.filter(
      el => el.domain === currentDomain
    )

    elementsToHide.forEach(({ selector }) => {
      try {
        const element = document.querySelector(selector)
        if (element) {
          (element as HTMLElement).style.display = 'none'
        }
      } catch (err) {
        console.error(`[ERROR] Failed to hide element with selector "${selector}":`, err)
      }
    })
  }

  // Fonction pour observer les mutations du DOM et réappliquer les masquages
  const setupMutationObserver = () => {
    const observer = new MutationObserver(() => {
      applyHiddenElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return observer
  }

  // Gestionnaire de raccourci clavier
  const handleShortcut = (event: KeyboardEvent) => {
    if (!settings.value.enableShortcut) return

    const shortcut = settings.value.shortcut.toLowerCase()
    const keys = shortcut.split('+')
    const isShortcutPressed = keys.every(key => {
      switch (key) {
        case 'alt': return event.altKey
        case 'ctrl': return event.ctrlKey
        case 'shift': return event.shiftKey
        default: return event.key.toLowerCase() === key
      }
    })

    if (isShortcutPressed) {
      event.preventDefault()
      event.stopPropagation()
      try {
        settings.value.isSelectingElement = !settings.value.isSelectingElement
        if (settings.value.isSelectingElement && !isActive.value) {
          setActive(true)
        }
      } catch (err) {
        console.error('[ERROR] Failed to handle shortcut:', err)
      }
    }
  }

  return {
    isActive,
    isLoading,
    error,
    settings,
    setActive,
    hideElement,
    removeHiddenElement,
    loadSettings,
    updateShortcut,
    toggleShortcut,
    handleShortcut,
    applyHiddenElements,
    setupMutationObserver
  }
})
