import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useToolflowzStore } from '@/stores/toolflowz'

export function useAutoCopy() {
  const store = useAutoCopyStore()
  const toolflowzStore = useToolflowzStore()
  const isCopying = ref(false)

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
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: { title, message }
      }).catch(() => {
        // Ignorer l'erreur de connexion
        console.log('[DEBUG] Notification non envoyée (extension non prête)')
      })
    } catch (error) {
      // Ignorer l'erreur
      console.log('[DEBUG] Notification non envoyée (erreur):', error)
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

  // Fonction pour copier le texte sélectionné
  const copySelection = async () => {
    const selection = window.getSelection()
    if (!selection) return

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

    const format = store.settings.formats.find(f => {
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

    if (format) {
      store.setActiveFormat(format.id)
      copySelection()
    }
  }

  // Monter/démonter les écouteurs d'événements
  onMounted(() => {
    console.log('[DEBUG] Montage des écouteurs d\'événements AutoCopy')
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('keydown', handleShortcut)
  })

  onUnmounted(() => {
    console.log('[DEBUG] Démontage des écouteurs d\'événements AutoCopy')
    document.removeEventListener('mouseup', handleSelection)
    document.removeEventListener('keyup', handleSelection)
    document.removeEventListener('keydown', handleShortcut)
  })

  return {
    isCopying,
    settings: store.settings,
    updateSettings: store.updateSettings,
    setActiveFormat: store.setActiveFormat
  }
} 