import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useToolflowzStore } from '@/stores/toolflowz'
import { useToast } from 'primevue/usetoast'

export function useAutoCopy() {
  const store = useAutoCopyStore()
  const toolflowzStore = useToolflowzStore()
  const toast = useToast()
  const isCopying = ref(false)
  const isAltMode = ref(false)
  const highlightedElements = ref<HTMLElement[]>([])

  // Fonction pour appliquer le template au texte
  const applyTemplate = (text: string, format: string): string => {
    const activeFormat = store.settings.formats.find(f => f.id === format)
    if (!activeFormat) return text

    const url = window.location.href
    const title = document.title

    let result = activeFormat.template
      .replace('{content}', text)
      .replace('{url}', url)
      .replace('{title}', title)

    // Si on ne veut pas inclure la source, on retire la ligne correspondante
    if (!store.settings.includeSource) {
      result = result.split('\n').filter(line => !line.includes('Source:')).join('\n')
    }

    return result
  }

  // Fonction pour formater le texte selon le format choisi
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
          // Garder le HTML tel quel
          break
        default:
          formattedText = formattedText.replace(/<[^>]+>/g, '')
      }
    }

    return applyTemplate(formattedText, store.settings.activeFormat)
  }

  // Fonction pour envoyer une notification
  const sendNotification = (title: string, message: string) => {
    try {
      toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
      })
    } catch (error) {
      console.log('[DEBUG] Erreur lors de l\'envoi de la notification:', error)
    }
  }

  // Fonction pour copier du texte dans le presse-papier
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Essayer d'abord avec l'API Clipboard moderne
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.log('[DEBUG] Échec de la copie avec navigator.clipboard:', error)
      }
    }

    // Méthode de secours avec execCommand
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
        console.log('[DEBUG] Échec de la copie avec execCommand')
        return false
      }
    } catch (error) {
      console.error('[ERROR] Échec de toutes les méthodes de copie:', error)
      return false
    }
  }

  // Fonction pour vérifier si un élément doit être exclu de la copie
  const isElementExcluded = (element: HTMLElement): boolean => {
    // Vérifier si l'élément ou un de ses parents correspond aux sélecteurs d'exclusion
    const isExcluded = element.matches('#toolflowz-extension, .toolflowz-extension, [id^="toolflowz-"], [class*="toolflowz-"], [class*="p-"], .p-component, [class*="primevue-"]') ||
                      element.closest('#toolflowz-extension, .toolflowz-extension, [id^="toolflowz-"], [class*="toolflowz-"], [class*="p-"], .p-component, [class*="primevue-"]') !== null
    return isExcluded
  }

  // Fonction pour copier le texte sélectionné
  const copySelection = async () => {
    const selection = window.getSelection()
    if (!selection) return

    // Vérifier si la sélection est dans un élément exclu
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement
    
    if (element && isElementExcluded(element)) {
      console.log('[DEBUG] Sélection dans un élément exclu, copie ignorée')
      return
    }

    const text = selection.toString()
    if (!text) return

    console.log('[DEBUG] Tentative de copie du texte:', text)
    isCopying.value = true

    try {
      const formattedText = formatText(text)
      console.log('[DEBUG] Texte formaté:', formattedText)
      
      const success = await copyToClipboard(formattedText)
      
      if (success) {
        console.log('[DEBUG] Texte copié avec succès')
        if (store.settings.showNotifications) {
          sendNotification('Texte copié', 'Le texte sélectionné a été copié dans le presse-papier')
        }
      } else {
        throw new Error('Impossible de copier le texte')
      }
    } catch (error) {
      console.error('[ERROR] Erreur lors de la copie:', error)
      if (store.settings.showNotifications) {
        sendNotification('Erreur', 'Impossible de copier le texte sélectionné')
      }
    } finally {
      isCopying.value = false
    }
  }

  // Gestionnaire d'événement pour la sélection de texte
  const handleSelection = () => {
    copySelection()
  }

  // Gestionnaire de raccourcis clavier
  const handleShortcut = (event: KeyboardEvent) => {
    if (!toolflowzStore.activeTools.includes('autoCopy')) return

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

  // Fonction pour activer le mode ALT
  const enableAltMode = () => {
    if (!store.settings.enableAltSelection) return
    
    isAltMode.value = true
    document.body.style.cursor = 'pointer'
    // Sélectionner tous les éléments de texte sauf ceux de notre extension
    const selector = 'div, p, article, section, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, code, table, tr, td, th'
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => {
      if (el instanceof HTMLElement && !isElementExcluded(el)) {
        el.dataset.originalOutline = el.style.outline
        el.dataset.originalTransition = el.style.transition
        el.dataset.originalBackground = el.style.backgroundColor
        el.style.outline = '2px dashed #007bff'
        el.style.transition = 'all 0.2s ease-in-out'
        
        // Ajouter les gestionnaires de survol
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
  }

  // Fonction pour désactiver le mode ALT
  const disableAltMode = () => {
    isAltMode.value = false
    document.body.style.cursor = 'default'
    highlightedElements.value.forEach((el) => {
      el.style.outline = el.dataset.originalOutline || ''
      el.style.transition = el.dataset.originalTransition || ''
      el.style.backgroundColor = el.dataset.originalBackground || ''
      delete el.dataset.originalOutline
      delete el.dataset.originalTransition
      delete el.dataset.originalBackground
      
      // Retirer les gestionnaires de survol
      el.removeEventListener('mouseenter', () => {})
      el.removeEventListener('mouseleave', () => {})
    })
    highlightedElements.value = []
  }

  // Gestionnaire de clic pour le mode ALT
  const handleAltClick = (event: MouseEvent) => {
    if (!isAltMode.value || !store.settings.enableAltSelection) return
    
    event.preventDefault()
    const element = event.target as HTMLElement
    if (!element) return

    if (!isElementExcluded(element)) {
      const text = element.innerText || element.textContent
      if (text) {
        copyToClipboard(formatText(text))
        if (store.settings.showNotifications) {
          sendNotification('Texte copié', 'L\'élément a été copié dans le presse-papier')
        }
      }
    }
    disableAltMode()
  }

  // Gestionnaires de touches pour ALT
  const handleAltKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Alt' && !isAltMode.value) {
      event.preventDefault()
      enableAltMode()
    }
  }

  const handleAltKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt' && isAltMode.value) {
      event.preventDefault()
      disableAltMode()
    }
  }

  // Monter/démonter les écouteurs d'événements
  onMounted(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('keydown', handleShortcut)
    document.addEventListener('keydown', handleAltKeyDown)
    document.addEventListener('keyup', handleAltKeyUp)
    document.addEventListener('click', handleAltClick)
  })

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleSelection)
    document.removeEventListener('keyup', handleSelection)
    document.removeEventListener('keydown', handleShortcut)
    document.removeEventListener('keydown', handleAltKeyDown)
    document.removeEventListener('keyup', handleAltKeyUp)
    document.removeEventListener('click', handleAltClick)
    // S'assurer que les styles sont nettoyés
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