import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSettingsStore } from './settings'
import { resolveDesignToken } from '@/utils/designTokens'
import { cacheHideElementBootstrap, retireHideElementBootstrap } from '@/content-script/hideElementBootstrap'

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
  let mutationObserver: MutationObserver | null = null
  const restoreButtons = new Map<string, HTMLButtonElement>()

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

  watch(() => settings.value.isSelectingElement, () => {
    applyHiddenElements()
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

      const alreadyHidden = settings.value.hiddenElements.some(
        item => item.domain === hiddenElement.domain && item.selector === hiddenElement.selector
      )
      if (!alreadyHidden) settings.value.hiddenElements.push(hiddenElement)

      // Masquer l'élément
      applyHiddenElements()
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
      return `#${CSS.escape(element.id)}`
    }

    // Classes
    const classes = Array.from(element.classList)
      .filter(cls => !cls.includes('toolglows'))
      .join('.')
    if (classes) {
      const classSelector = `.${classes.split('.').map(CSS.escape).join('.')}`
      if (document.querySelectorAll(classSelector).length === 1) return classSelector
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
    const domain = window.location.hostname
    const index = settings.value.hiddenElements.findIndex(
      el => el.domain === domain && el.selector === selector
    )
    if (index > -1) {
      settings.value.hiddenElements.splice(index, 1)
    }
    restoreElement(selector)
  }

  const resetHiddenElementsForCurrentSite = async () => {
    const domain = window.location.hostname
    const selectors = settings.value.hiddenElements
      .filter(element => element.domain === domain)
      .map(element => element.selector)
    settings.value.hiddenElements = settings.value.hiddenElements.filter(
      element => element.domain !== domain
    )
    selectors.forEach(restoreElement)
  }

  const updateShortcut = async (shortcut: string) => {
    settings.value.shortcut = shortcut
  }

  const toggleShortcut = async (enabled: boolean) => {
    settings.value.enableShortcut = enabled
  }

  const saveSettings = async () => {
    try {
      void cacheHideElementBootstrap(settings.value.hiddenElements)
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
        const storedElements = storedSettings.hiddenElements
        settings.value = {
          ...defaultSettings,
          ...storedSettings,
          hiddenElements: Array.isArray(storedElements)
            ? storedElements
            : Object.values(storedElements || {})
        }
        void cacheHideElementBootstrap(settings.value.hiddenElements)
        retireHideElementBootstrap()
        // Appliquer les masquages pour le domaine actuel
        applyHiddenElements()
      } else {
        retireHideElementBootstrap()
        settings.value = defaultSettings
      }
    } catch (err) {
      retireHideElementBootstrap()
      console.error('[ERROR] Failed to load hide element settings:', err)
      settings.value = defaultSettings
    }
  }

  const restoreElement = (selector: string) => {
    document.querySelectorAll<HTMLElement>(selector).forEach(element => {
      element.style.display = element.dataset.toolglowsOriginalDisplay || ''
      element.classList.remove('toolglows-hidden-element-preview')
      element.style.removeProperty('--red-500')
      element.style.removeProperty('--tg-element-hidden-preview')
      element.style.removeProperty('--tg-element-hidden-outline')
      element.style.removeProperty('--tg-element-hidden-radius')
      element.style.removeProperty('--tg-element-hidden-shadow')
      element.style.removeProperty('--tg-element-hidden-media-filter')
      element.style.removeProperty('--tg-element-hidden-transform')
      element.style.removeProperty('--tg-element-hidden-transform-origin')
      element.style.removeProperty('--tg-element-hidden-transition')
      element.style.removeProperty('--tg-element-outline-width')
      element.style.removeProperty('--tg-space-0-5')
      element.style.removeProperty('--tg-space-1')
      element.style.removeProperty('--tg-space-3')
      element.style.removeProperty('--tg-radius-md')
      element.style.removeProperty('--tg-motion-fast')
      delete element.dataset.toolglowsOriginalDisplay
    })
    restoreButtons.get(selector)?.remove()
    restoreButtons.delete(selector)
  }

  const createRestoreButton = (element: HTMLElement, selector: string) => {
    const existingButton = restoreButtons.get(selector)
    if (existingButton) {
      const rect = element.getBoundingClientRect()
      existingButton.style.left = `${rect.right}px`
      existingButton.style.top = `${rect.top}px`
      return
    }
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'toolglows-hidden-element-restore'
    button.dataset.toolglowsHiddenRestore = selector
    button.setAttribute('aria-label', `Restaurer ${getElementName(element)}`)
    button.textContent = '×'
    const rect = element.getBoundingClientRect()
    button.style.left = `${rect.right}px`
    button.style.top = `${rect.top}px`
    button.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      void removeHiddenElement(selector)
    }, true)
    ;(document.getElementById('toolglows-root') ?? document.body).append(button)
    restoreButtons.set(selector, button)
  }

  const stackRestoreButtons = () => {
    const occupiedAnchors: Array<{ left: number, top: number }> = []
    restoreButtons.forEach((button, selector) => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) return
      const rect = element.getBoundingClientRect()
      const proximity = Math.max(button.getBoundingClientRect().width * 0.6, 1)
      const stackIndex = occupiedAnchors.filter(anchor =>
        Math.abs(anchor.left - rect.right) < proximity && Math.abs(anchor.top - rect.top) < proximity
      ).length
      button.style.left = `${rect.right}px`
      button.style.top = `${rect.top}px`
      button.style.setProperty('--tg-hidden-restore-index', String(stackIndex))
      occupiedAnchors.push({ left: rect.right, top: rect.top })
    })
  }

  const clearEditingPreview = () => {
    document.querySelectorAll<HTMLElement>('.toolglows-hidden-element-preview').forEach(element => {
      element.classList.remove('toolglows-hidden-element-preview')
    })
    restoreButtons.forEach(button => button.remove())
    restoreButtons.clear()
  }

  // Fonction pour appliquer les masquages
  const applyHiddenElements = () => {
    const currentDomain = window.location.hostname
    const elementsToHide = settings.value.hiddenElements.filter(
      el => el.domain === currentDomain
    )

    elementsToHide.forEach(({ selector }) => {
      try {
        document.querySelectorAll<HTMLElement>(selector).forEach(element => {
          if (element.dataset.toolglowsOriginalDisplay === undefined) {
            element.dataset.toolglowsOriginalDisplay = element.style.display
          }
          if (settings.value.isSelectingElement) {
            element.style.display = element.dataset.toolglowsOriginalDisplay || ''
            element.style.setProperty('--red-500', resolveDesignToken('--red-500'))
            element.style.setProperty('--tg-element-hidden-preview', resolveDesignToken('--tg-element-hidden-preview'))
            element.style.setProperty('--tg-element-hidden-outline', resolveDesignToken('--tg-element-hidden-outline'))
            element.style.setProperty('--tg-element-hidden-radius', resolveDesignToken('--tg-element-hidden-radius'))
            element.style.setProperty('--tg-element-hidden-shadow', resolveDesignToken('--tg-element-hidden-shadow'))
            element.style.setProperty('--tg-element-hidden-media-filter', resolveDesignToken('--tg-element-hidden-media-filter'))
            element.style.setProperty('--tg-element-hidden-transform', resolveDesignToken('--tg-element-hidden-transform'))
            element.style.setProperty('--tg-element-hidden-transform-origin', resolveDesignToken('--tg-element-hidden-transform-origin'))
            element.style.setProperty('--tg-element-hidden-transition', resolveDesignToken('--tg-element-hidden-transition'))
            element.style.setProperty('--tg-element-outline-width', resolveDesignToken('--tg-element-outline-width'))
            element.style.setProperty('--tg-space-0-5', resolveDesignToken('--tg-space-0-5'))
            element.style.setProperty('--tg-space-1', resolveDesignToken('--tg-space-1'))
            element.style.setProperty('--tg-space-3', resolveDesignToken('--tg-space-3'))
            element.style.setProperty('--tg-radius-md', resolveDesignToken('--tg-radius-md'))
            element.style.setProperty('--tg-motion-fast', resolveDesignToken('--tg-motion-fast'))
            element.classList.add('toolglows-hidden-element-preview')
            createRestoreButton(element, selector)
          } else {
            element.classList.remove('toolglows-hidden-element-preview')
            element.style.display = 'none'
            restoreButtons.get(selector)?.remove()
            restoreButtons.delete(selector)
          }
        })
      } catch (err) {
        console.error(`[ERROR] Failed to hide element with selector "${selector}":`, err)
      }
    })
    stackRestoreButtons()
  }

  // Fonction pour observer les mutations du DOM et réappliquer les masquages
  const setupMutationObserver = () => {
    mutationObserver?.disconnect()
    mutationObserver = new MutationObserver(() => {
      applyHiddenElements()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
    window.addEventListener('scroll', applyHiddenElements, true)
    window.addEventListener('resize', applyHiddenElements)

    return mutationObserver
  }

  const teardown = () => {
    mutationObserver?.disconnect()
    mutationObserver = null
    window.removeEventListener('scroll', applyHiddenElements, true)
    window.removeEventListener('resize', applyHiddenElements)
    clearEditingPreview()
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
    resetHiddenElementsForCurrentSite,
    loadSettings,
    updateShortcut,
    toggleShortcut,
    handleShortcut,
    applyHiddenElements,
    setupMutationObserver,
    teardown
  }
})
