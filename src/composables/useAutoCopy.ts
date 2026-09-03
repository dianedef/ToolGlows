import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useToast } from 'primevue/usetoast'
import { elementOutline, resolveDesignColorToken, resolveDesignToken } from '@/utils/designTokens'
import { copyTextToClipboard } from '@/utils/clipboard'

export function useAutoCopy() {
  const store = useAutoCopyStore()
  const toolglowsStore = useToolGlowsStore()
  const toast = useToast()
  const isCopying = ref(false)
  const copyState = ref<'idle' | 'copying' | 'confirmed' | 'failed'>('idle')
  const isAltMode = ref(false)
  const altKeyTimer = ref<number | null>(null)
  const ALT_DELAY = 200 // Délai en millisecondes avant d'activer le mode ALT
  const isAltCombination = ref(false) // Pour détecter si ALT est utilisé avec une autre touche
  const selectionFeedbackStyleId = 'toolglows-auto-copy-selection-style'
  const altFeedbackStyleId = 'toolglows-auto-copy-alt-style'
  const altHighlightId = 'toolglows-auto-copy-alt-highlight'
  const selectableElementSelector = 'div, p, article, section, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, table, tr, td, th'
  const highlightHoldMs = 1200
  const highlightFadeStepMs = 150
  let pointerSelectionAtStart: string | null = null
  let keyboardSelectionAtStart: string | null = null
  let highlightHoldTimer: number | null = null
  let highlightFadeTimer: number | null = null
  let highlightClearTimer: number | null = null
  let stateResetTimer: number | null = null

  const syncSelectionFeedbackStyle = () => {
    const existingStyle = document.getElementById(selectionFeedbackStyleId)
    if (!isEnabled()) {
      existingStyle?.remove()
      return
    }
    if (existingStyle) return

    const style = document.createElement('style')
    const selectionColor = resolveDesignColorToken('--tg-color-brand-default')
    style.id = selectionFeedbackStyleId
    style.textContent = `
      ::selection {
        background-color: color-mix(in srgb, ${selectionColor} 55%, transparent) !important;
        color: inherit !important;
        text-shadow: none !important;
      }
      html[data-toolglows-auto-copy-selection='fading'] ::selection {
        background-color: color-mix(in srgb, ${selectionColor} 28%, transparent) !important;
      }
      html[data-toolglows-auto-copy-selection='fading-out'] ::selection {
        background-color: color-mix(in srgb, ${selectionColor} 8%, transparent) !important;
      }
    `
    document.documentElement.appendChild(style)
  }

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

  const selectedEditableText = (target?: EventTarget | null): string | null => {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return null
    if (target instanceof HTMLInputElement && target.type === 'password') return ''
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start === null || end === null || start === end) return ''
    return target.value.slice(Math.min(start, end), Math.max(start, end))
  }

  const currentSelectionText = (target?: EventTarget | null): string => {
    const editableText = selectedEditableText(target)
    return editableText === null ? window.getSelection()?.toString() ?? '' : editableText
  }

  const getSelectionContent = (selection: Selection, eventTarget?: EventTarget | null) => {
    const editableText = selectedEditableText(eventTarget)
    if (editableText !== null) {
      return editableText ? { text: editableText, html: editableText } : null
    }

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
      toast.removeGroup('auto-copy')
      toast.add({
        group: 'auto-copy',
        severity,
        summary: title,
        detail: message,
        life: 2200,
        closable: false
      })
    } catch {
      console.warn('[Auto Copy] Notification unavailable')
    }
  }

  const clearHighlightTimers = () => {
    if (highlightHoldTimer !== null) window.clearTimeout(highlightHoldTimer)
    if (highlightFadeTimer !== null) window.clearTimeout(highlightFadeTimer)
    if (highlightClearTimer !== null) window.clearTimeout(highlightClearTimer)
    highlightHoldTimer = null
    highlightFadeTimer = null
    highlightClearTimer = null
    delete document.documentElement.dataset.toolglowsAutoCopySelection
  }

  const scheduleHighlightExpiry = (target: EventTarget | null | undefined, copiedText: string) => {
    clearHighlightTimers()
    document.documentElement.dataset.toolglowsAutoCopySelection = 'confirmed'
    highlightHoldTimer = window.setTimeout(() => {
      if (currentSelectionText(target) !== copiedText) {
        clearHighlightTimers()
        return
      }

      document.documentElement.dataset.toolglowsAutoCopySelection = 'fading'
      highlightFadeTimer = window.setTimeout(() => {
        if (currentSelectionText(target) !== copiedText) {
          clearHighlightTimers()
          return
        }
        document.documentElement.dataset.toolglowsAutoCopySelection = 'fading-out'
      }, highlightFadeStepMs)
      highlightClearTimer = window.setTimeout(() => {
        if (currentSelectionText(target) === copiedText) {
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const end = target.selectionEnd ?? target.value.length
            target.setSelectionRange(end, end)
          } else {
            window.getSelection()?.removeAllRanges()
          }
        }
        clearHighlightTimers()
        copyState.value = 'idle'
      }, highlightFadeStepMs * 2)
    }, highlightHoldMs)
  }

  // Function to check if an element should be excluded from the copy
  const isElementExcluded = (element: HTMLElement): boolean => {
    // The ToolGlows root is the ownership boundary. Generic PrimeVue-like
    // selectors such as `[class*="p-"]` also match ordinary host-page utility
    // classes (`p-4`, `gap-2`, etc.) and would silently reject valid selections.
    return element.closest('#toolglows-root, #toolglows-extension, .toolglows-extension') !== null
  }

  const findSelectableTarget = (event: Event): HTMLElement | null => {
    const pathTarget = event.composedPath().find(candidate => candidate instanceof Element)
    const element = pathTarget instanceof Element ? pathTarget : event.target instanceof Element ? event.target : null
    const target = element?.closest<HTMLElement>(selectableElementSelector) ?? null
    return target && !isElementExcluded(target) ? target : null
  }

  const updateAltHighlight = (event: PointerEvent) => {
    if (!isAltMode.value) return
    const highlight = document.getElementById(altHighlightId)
    const target = findSelectableTarget(event)
    if (!highlight || !target) {
      if (highlight) highlight.style.display = 'none'
      return
    }

    const rect = target.getBoundingClientRect()
    Object.assign(highlight.style, {
      display: 'block',
      transform: `translate(${rect.left}px, ${rect.top}px)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    })
  }

  // Function to copy the selected text
  const copySelection = async (preserveFormat = false, eventTarget?: EventTarget | null) => {
    if (!isEnabled() || isCopying.value) return

    const selection = window.getSelection()
    if (!selection) return

    const content = getSelectionContent(selection, eventTarget)
    if (!content?.text) return

    // Check if the selection is in an excluded element
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const container = range?.commonAncestorContainer
    const element = eventTarget instanceof HTMLElement
      ? eventTarget
      : container?.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container as HTMLElement | undefined

    if (!element || isElementExcluded(element)) {
      return
    }

    isCopying.value = true
    copyState.value = 'copying'

    try {
      // Pointer and keyboard selections implement the Auto Copy promise:
      // copy exactly what is selected. Formatting templates remain available
      // only through their explicit keyboard shortcuts.
      const formattedText = preserveFormat ? formatText(content) : content.text

      const success = await copyTextToClipboard(formattedText)

      if (success) {
        copyState.value = 'confirmed'
        scheduleHighlightExpiry(eventTarget, content.text)
        if (store.settings.showNotifications) {
          sendNotification('success', 'Text copied', 'The selected text has been copied to the clipboard')
        }
      } else {
        throw new Error('Failed to copy text')
      }
    } catch {
      copyState.value = 'failed'
      if (stateResetTimer !== null) window.clearTimeout(stateResetTimer)
      stateResetTimer = window.setTimeout(() => {
        copyState.value = 'idle'
        stateResetTimer = null
      }, 2200)
      console.error('[Auto Copy] Copy failed')
      if (store.settings.showNotifications) {
        sendNotification('error', 'Error', 'Failed to copy the selected text')
      }
    } finally {
      isCopying.value = false
    }
  }

  // Event handler for text selection
  const handleSelection = (event: PointerEvent | KeyboardEvent) => {
    if (!isEnabled() || isAltMode.value) return

    if (event instanceof KeyboardEvent) {
      const isSelectionCompletion = event.key === 'Shift'
        || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
      if (!isSelectionCompletion) return
      const selectedText = currentSelectionText(event.target)
      if (keyboardSelectionAtStart !== null && selectedText === keyboardSelectionAtStart) {
        keyboardSelectionAtStart = null
        return
      }
      keyboardSelectionAtStart = null
    } else {
      const selectedText = currentSelectionText(event.target)
      if (pointerSelectionAtStart !== null && selectedText === pointerSelectionAtStart) {
        pointerSelectionAtStart = null
        return
      }
      pointerSelectionAtStart = null
    }

    void copySelection(false, event.target)
  }

  const handleSelectionStart = (event: PointerEvent) => {
    if (!isEnabled() || isAltMode.value) return
    pointerSelectionAtStart = currentSelectionText(event.target)
  }

  const handleSelectionKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled() || isAltMode.value || event.repeat) return
    const startsSelection = event.key === 'Shift'
      || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
    if (startsSelection) keyboardSelectionAtStart = currentSelectionText(event.target)
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
      void copySelection(true, event.target)
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
      const style = document.createElement('style')
      const highlight = document.createElement('div')
      style.id = altFeedbackStyleId
      style.textContent = `
        html[data-toolglows-auto-copy-alt='true'] body { cursor: pointer !important; }
        #${altHighlightId} {
          position: fixed !important;
          inset: 0 auto auto 0 !important;
          pointer-events: none !important;
          box-sizing: border-box !important;
          z-index: ${resolveDesignToken('--tg-z-overlay')} !important;
          outline: ${elementOutline('solid')} !important;
          background-color: ${resolveDesignColorToken('--tg-element-hover')} !important;
          transition: ${resolveDesignToken('--tg-element-transition')} !important;
        }
      `
      highlight.id = altHighlightId
      highlight.dataset.toolglowsUi = 'true'
      highlight.style.display = 'none'
      document.getElementById(altFeedbackStyleId)?.remove()
      document.getElementById(altHighlightId)?.remove()
      document.documentElement.appendChild(style)
      document.documentElement.appendChild(highlight)
      document.documentElement.dataset.toolglowsAutoCopyAlt = 'true'
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
    delete document.documentElement.dataset.toolglowsAutoCopyAlt
    document.getElementById(altFeedbackStyleId)?.remove()
    document.getElementById(altHighlightId)?.remove()
  }

  // ALT mode click handler
  const handleAltClick = (event: MouseEvent) => {
    if (!isEnabled() || !isAltMode.value || !store.settings.enableAltSelection) return

    const target = findSelectableTarget(event)
    if (!target) return

    const range = document.createRange()
    range.selectNodeContents(target)

    const selection = window.getSelection()
    if (!selection) return

    selection.removeAllRanges()
    selection.addRange(range)

    void copySelection(false, target)
    event.preventDefault()
    event.stopImmediatePropagation()
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
    syncSelectionFeedbackStyle()
    document.addEventListener('pointerup', handleSelection)
    document.addEventListener('pointerdown', handleSelectionStart, true)
    document.addEventListener('pointermove', updateAltHighlight, true)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('keydown', handleShortcut)
    document.addEventListener('keydown', handleSelectionKeyDown)
    document.addEventListener('keydown', handleAltKeyDown)
    document.addEventListener('keyup', handleAltKeyUp)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleEscapeKey)
    document.addEventListener('click', handleAltClick, true)
  })

  onUnmounted(() => {
    document.getElementById(selectionFeedbackStyleId)?.remove()
    clearHighlightTimers()
    if (stateResetTimer !== null) window.clearTimeout(stateResetTimer)
    document.removeEventListener('pointerup', handleSelection)
    document.removeEventListener('pointerdown', handleSelectionStart, true)
    document.removeEventListener('pointermove', updateAltHighlight, true)
    document.removeEventListener('keyup', handleSelection)
    document.removeEventListener('keydown', handleShortcut)
    document.removeEventListener('keydown', handleSelectionKeyDown)
    document.removeEventListener('keydown', handleAltKeyDown)
    document.removeEventListener('keyup', handleAltKeyUp)
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keydown', handleEscapeKey)
    document.removeEventListener('click', handleAltClick, true)
    // Ensure styles are cleaned up
    disableAltMode()
  })

  watch(() => toolglowsStore.activeTools.includes('autoCopy'), enabled => {
    syncSelectionFeedbackStyle()
    if (!enabled) {
      clearHighlightTimers()
      if (stateResetTimer !== null) window.clearTimeout(stateResetTimer)
      stateResetTimer = null
      pointerSelectionAtStart = null
      keyboardSelectionAtStart = null
      copyState.value = 'idle'
      disableAltMode()
      try {
        toast.removeGroup('auto-copy')
      } catch {
        // The notification host may already be gone during teardown.
      }
    }
  })

  return {
    isCopying,
    copyState,
    isAltMode,
    settings: store.settings,
    updateSettings: store.updateSettings,
    setActiveFormat: store.setActiveFormat
  }
}
