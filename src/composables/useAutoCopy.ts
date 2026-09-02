import { ref, onMounted, onUnmounted } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useToast } from 'primevue/usetoast'
import { elementOutline, resolveDesignToken } from '@/utils/designTokens'

export function useAutoCopy() {
  const store = useAutoCopyStore()
  const toolglowsStore = useToolGlowsStore()
  const toast = useToast()
  const isCopying = ref(false)
  const isAltMode = ref(false)
  const highlightedElements = ref<HTMLElement[]>([])
  const highlightHandlers = new Map<HTMLElement, {
    mouseenter: () => void
    mouseleave: () => void
  }>()
  const altKeyTimer = ref<number | null>(null)
  const ALT_DELAY = 200 // Délai en millisecondes avant d'activer le mode ALT
  const isAltCombination = ref(false) // Pour détecter si ALT est utilisé avec une autre touche

  // Function to apply the template to the text
  const applyTemplate = (text: string, format: string): string => {
    const activeFormat = store.settings.formats.find(f => f.id === format)
    if (!activeFormat) return text

    const url = window.location.href
    const title = document.title

    const template = store.settings.includeSource
      ? activeFormat.template
      : activeFormat.template
          .split('\n')
          .filter(line => !line.includes('{url}') && !/^\s*>?\s*Source:/i.test(line))
          .join('\n')

    return template
      .replace('{content}', text)
      .replace('{url}', url)
      .replace('{title}', title)
  }

  const isEnabled = () => toolglowsStore.activeTools.includes('autoCopy')

  const getSelectionContent = (selection: Selection) => {
    const container = document.createElement('div')
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.appendChild(selection.getRangeAt(index).cloneContents())
    }

    return {
      text: selection.toString(),
      html: container.innerHTML
    }
  }

  // Function to format the selection according to the chosen format
  const formatText = ({ text, html }: { text: string; html: string }): string => {
    let formattedText = text

    if (store.settings.preserveFormatting) {
      switch (store.settings.activeFormat) {
        case 'markdown':
          formattedText = html
            .replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '**$2**')
            .replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '_$2_')
            .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
          break
        case 'html':
          formattedText = html
          break
        default:
          formattedText = text
      }
    }

    return applyTemplate(formattedText, store.settings.activeFormat)
  }

  // Function to send a notification
  const sendNotification = (
    severity: 'success' | 'error',
    title: string,
    message: string
  ) => {
    try {
      toast.add({
        severity,
        summary: title,
        detail: message,
        life: 3000
      })
    } catch {
      console.warn('[Auto Copy] Notification unavailable')
    }
  }

  // Function to copy text to the clipboard
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // First try with the modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        console.warn('[Auto Copy] Clipboard API unavailable, trying fallback')
      }
    }

    // Fallback method with execCommand
    const textarea = document.createElement('textarea')
    try {
      textarea.value = text
      textarea.dataset.toolglowsAutoCopyFallback = 'true'
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      const success = document.execCommand('copy')
      return success
    } catch {
      console.error('[Auto Copy] Clipboard fallback failed')
      return false
    } finally {
      textarea.remove()
    }
  }

  // Function to check if an element should be excluded from the copy
  const isElementExcluded = (element: HTMLElement): boolean => {
    // The ToolGlows root is the ownership boundary. Generic PrimeVue-like
    // selectors such as `[class*="p-"]` also match ordinary host-page utility
    // classes (`p-4`, `gap-2`, etc.) and would silently reject valid selections.
    return element.closest('#toolglows-root, #toolglows-extension, .toolglows-extension') !== null
  }

  // Function to copy the selected text
  const copySelection = async () => {
    if (!isEnabled() || isCopying.value) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Check if the selection is in an excluded element
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement

    if (!element || isElementExcluded(element)) {
      return
    }

    const content = getSelectionContent(selection)
    if (!content.text) return

    isCopying.value = true

    try {
      const formattedText = formatText(content)

      const success = await copyToClipboard(formattedText)

      if (success) {
        if (store.settings.showNotifications) {
          sendNotification('success', 'Text copied', 'The selected text has been copied to the clipboard')
        }
      } else {
        throw new Error('Failed to copy text')
      }
    } catch {
      console.error('[Auto Copy] Copy failed')
      if (store.settings.showNotifications) {
        sendNotification('error', 'Error', 'Failed to copy the selected text')
      }
    } finally {
      isCopying.value = false
    }
  }

  // Event handler for text selection
  const handleSelection = (event: MouseEvent | KeyboardEvent) => {
    if (!isEnabled() || isAltMode.value) return

    if (event instanceof KeyboardEvent) {
      const isSelectionCompletion = event.key === 'Shift'
        || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
      if (!isSelectionCompletion) return
    }

    void copySelection()
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
      void copySelection()
    }
  }

  // Function to enable ALT mode with delay
  const enableAltMode = () => {
    if (!isEnabled() || !store.settings.enableAltSelection) return

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
          el.style.outline = elementOutline('dashed')
          el.style.transition = resolveDesignToken('--tg-element-transition')

          const handlers = {
            mouseenter: () => {
            if (isAltMode.value) {
              el.style.outline = elementOutline('solid')
              el.style.backgroundColor = resolveDesignToken('--tg-element-hover')
            }
            },
            mouseleave: () => {
            if (isAltMode.value) {
              el.style.outline = elementOutline('dashed')
              el.style.backgroundColor = el.dataset.originalBackground || ''
            }
            }
          }
          el.addEventListener('mouseenter', handlers.mouseenter)
          el.addEventListener('mouseleave', handlers.mouseleave)
          highlightHandlers.set(el, handlers)

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

      const handlers = highlightHandlers.get(el)
      if (handlers) {
        el.removeEventListener('mouseenter', handlers.mouseenter)
        el.removeEventListener('mouseleave', handlers.mouseleave)
        highlightHandlers.delete(el)
      }
    })
    highlightedElements.value = []
  }

  // ALT mode click handler
  const handleAltClick = (event: MouseEvent) => {
    if (!isEnabled() || !isAltMode.value || !store.settings.enableAltSelection) return

    const target = event.target as HTMLElement
    if (!target || isElementExcluded(target)) return

    const range = document.createRange()
    range.selectNodeContents(target)

    const selection = window.getSelection()
    if (!selection) return

    selection.removeAllRanges()
    selection.addRange(range)

    void copySelection()
    event.preventDefault()
  }

  // Gestionnaire de touche ALT enfoncée
  const handleAltKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled()) return
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
    if (!isEnabled()) return
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
