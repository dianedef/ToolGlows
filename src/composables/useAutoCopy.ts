import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useToast } from 'primevue/usetoast'

export function useAutoCopy() {
  const store = useAutoCopyStore()
  const toolglowsStore = useToolGlowsStore()
  const toast = useToast()
  const isCopying = ref(false)
  const isAltMode = ref(false)
  const highlightedElements = ref<HTMLElement[]>([])
  const altKeyTimer = ref<number | null>(null)
  const ALT_DELAY = 200 // Délai en millisecondes avant d'activer le mode ALT
  const isAltCombination = ref(false) // Pour détecter si ALT est utilisé avec une autre touche

  // Function to apply the template to the text
  const applyTemplate = (text: string, format: string): string => {
    const activeFormat = store.settings.formats.find(f => f.id === format)
    if (!activeFormat) return text

    const url = window.location.href
    const title = document.title

    let result = activeFormat.template
      .replace('{content}', text)
      .replace('{url}', url)
      .replace('{title}', title)

    // If we don't want to include the source, we remove the corresponding line
    if (!store.settings.includeSource) {
      result = result.split('\n').filter(line => !line.includes('Source:')).join('\n')
    }

    return result
  }

  // Function to format the text according to the chosen format
  const formatText = (text: string): string => {
    let formattedText = text

    if (!store.settings.preserveFormatting) {
      formattedText = formattedText.replace(/<[^>]+>/g, '')
    } else {
      switch (store.settings.activeFormat) {
        case 'markdown':
          formattedText = formattedText
            .replace(/<b>(.*?)<\/b>/g, '**$1**')
            .replace(/<i>(.*?)<\/i>/g, '_$1_')
            .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
          break
        case 'html':
          // Keep HTML as is
          break
        default:
          formattedText = formattedText.replace(/<[^>]+>/g, '')
      }
    }

    return applyTemplate(formattedText, store.settings.activeFormat)
  }

  // Function to send a notification
  const sendNotification = (title: string, message: string) => {
    try {
      toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
      })
    } catch (error) {
      console.log('[DEBUG] Error sending notification:', error)
    }
  }

  // Function to copy text to the clipboard
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // First try with the modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.log('[DEBUG] Failed to copy with navigator.clipboard:', error)
      }
    }

    // Fallback method with execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      const success = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (success) {
        return true
      } else {
        console.log('[DEBUG] Copy failed with execCommand')
        return false
      }
    } catch (error) {
      console.error('[ERROR] Copy failed with all methods:', error)
      return false
    }
  }

  // Function to check if an element should be excluded from the copy
  const isElementExcluded = (element: HTMLElement): boolean => {
    // Check if the element or one of its parents matches the exclusion selectors
    const isExcluded = element.matches('#toolglows-extension, .toolglows-extension, [id^="toolglows-"], [class*="toolglows-"], [class*="p-"], .p-component, [class*="primevue-"]') ||
                      element.closest('#toolglows-extension, .toolglows-extension, [id^="toolglows-"], [class*="toolglows-"], [class*="p-"], .p-component, [class*="primevue-"]') !== null
    return isExcluded
  }

  // Function to copy the selected text
  const copySelection = async () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Check if the selection is in an excluded element
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement

    if (!element || isElementExcluded(element)) {
      console.log('[DEBUG] Selection in an excluded element, copy ignored')
      return
    }

    const text = selection.toString()
    if (!text) return

    console.log('[DEBUG] Attempting to copy text:', text)
    isCopying.value = true

    try {
      const formattedText = formatText(text)
      console.log('[DEBUG] Formatted text:', formattedText)

      const success = await copyToClipboard(formattedText)

      if (success) {
        console.log('[DEBUG] Text copied successfully')
        if (store.settings.showNotifications) {
          sendNotification('Text copied', 'The selected text has been copied to the clipboard')
        }
      } else {
        throw new Error('Failed to copy text')
      }
    } catch (error) {
      console.error('[ERROR] Error during copy:', error)
      if (store.settings.showNotifications) {
        sendNotification('Error', 'Failed to copy the selected text')
      }
    } finally {
      isCopying.value = false
    }
  }

  // Event handler for text selection
  const handleSelection = () => {
    copySelection()
  }

  // Keyboard shortcut handler
  const handleShortcut = (event: KeyboardEvent) => {
    if (!toolglowsStore.activeTools.includes('autoCopy')) return

    const format = Array.isArray(store.settings.formats)
      ? store.settings.formats.find(f => {
          if (!f.shortcut) return false
          const keys = f.shortcut.toLowerCase().split('+')
          return keys.every(key => {
            switch (key) {
              case 'alt': return event.altKey
              case 'ctrl': return event.ctrlKey
              case 'shift': return event.shiftKey
              default: return event.key.toLowerCase() === key
            }
          })
        })
      : null

    if (format) {
      store.setActiveFormat(format.id)
      copySelection()
    }
  }

  // Function to enable ALT mode with delay
  const enableAltMode = () => {
    if (!store.settings.enableAltSelection) return

    // Nettoyer le timer existant si présent
    if (altKeyTimer.value !== null) {
      clearTimeout(altKeyTimer.value)
    }

    // Définir un nouveau timer
    altKeyTimer.value = window.setTimeout(() => {
      isAltMode.value = true
      document.body.style.cursor = 'pointer'
      // Select all text elements except those of our extension
      const selector = 'div, p, article, section, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, table, tr, td, th'
      const elements = document.querySelectorAll(selector)
      elements.forEach((el) => {
        if (el instanceof HTMLElement && !isElementExcluded(el)) {
          el.dataset.originalOutline = el.style.outline
          el.dataset.originalTransition = el.style.transition
          el.dataset.originalBackground = el.style.backgroundColor
          el.style.outline = '2px dashed #007bff'
          el.style.transition = 'all 0.2s ease-in-out'

          // Add hover handlers
          el.addEventListener('mouseenter', () => {
            if (isAltMode.value) {
              el.style.outline = '2px dashed #00ff00'
              el.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'
            }
          })
          el.addEventListener('mouseleave', () => {
            if (isAltMode.value) {
              el.style.outline = '2px dashed #007bff'
              el.style.backgroundColor = el.dataset.originalBackground || ''
            }
          })

          highlightedElements.value.push(el)
        }
      })
    }, ALT_DELAY)
  }

  // Function to disable ALT mode
  const disableAltMode = () => {
    // Nettoyer le timer si présent
    if (altKeyTimer.value !== null) {
      clearTimeout(altKeyTimer.value)
      altKeyTimer.value = null
    }

    isAltMode.value = false
    isAltCombination.value = false
    document.body.style.cursor = 'default'
    highlightedElements.value.forEach((el) => {
      el.style.outline = el.dataset.originalOutline || ''
      el.style.transition = el.dataset.originalTransition || ''
      el.style.backgroundColor = el.dataset.originalBackground || ''
      delete el.dataset.originalOutline
      delete el.dataset.originalTransition
      delete el.dataset.originalBackground

      // Remove hover handlers
      el.removeEventListener('mouseenter', () => {})
      el.removeEventListener('mouseleave', () => {})
    })
    highlightedElements.value = []
  }

  // ALT mode click handler
  const handleAltClick = (event: MouseEvent) => {
    if (!isAltMode.value || !store.settings.enableAltSelection) return

    const target = event.target as HTMLElement
    if (!target || isElementExcluded(target)) return

    const range = document.createRange()
    range.selectNodeContents(target)

    const selection = window.getSelection()
    if (!selection) return

    selection.removeAllRanges()
    selection.addRange(range)

    copySelection()
    event.preventDefault()
  }

  // Gestionnaire de touche ALT enfoncée
  const handleAltKeyDown = (event: KeyboardEvent) => {
    // Si une autre touche est déjà pressée avec ALT, on considère que c'est un raccourci
    if (event.key === 'Alt' && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
      if (!store.settings.enableAltSelection || isAltMode.value) return
      enableAltMode()
    } else if (event.altKey) {
      // Si ALT est pressé avec une autre touche, on désactive le mode
      isAltCombination.value = true
      disableAltMode()
    }
  }

  // Gestionnaire de touche ALT relâchée
  const handleAltKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      if (isAltCombination.value) {
        isAltCombination.value = false
      } else {
        disableAltMode()
      }
    }
  }

  // Gestionnaire global des touches
  const handleKeyDown = (event: KeyboardEvent) => {
    // Si une autre touche est pressée pendant que ALT est maintenu
    if (event.altKey && event.key !== 'Alt') {
      isAltCombination.value = true
      disableAltMode()
    }
  }

  // Gestionnaire de touche Échap
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isAltMode.value) {
      disableAltMode()
    }
  }

  // Mount/unmount event listeners
  onMounted(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('keydown', handleShortcut)
    document.addEventListener('keydown', handleAltKeyDown)
    document.addEventListener('keyup', handleAltKeyUp)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleEscapeKey)
    document.addEventListener('click', handleAltClick)
  })

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleSelection)
    document.removeEventListener('keyup', handleSelection)
    document.removeEventListener('keydown', handleShortcut)
    document.removeEventListener('keydown', handleAltKeyDown)
    document.removeEventListener('keyup', handleAltKeyUp)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keydown', handleEscapeKey)
    document.removeEventListener('click', handleAltClick)
    // Ensure styles are cleaned up
    disableAltMode()
  })

  return {
    isCopying,
    isAltMode,
    settings: store.settings,
    updateSettings: store.updateSettings,
    setActiveFormat: store.setActiveFormat
  }
}
