import { useLinksExplorerStore } from '@/stores/linksExplorer'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted } from 'vue'

export function useLinksExplorer() {
  const store = useLinksExplorerStore()
  const { links, isLoading, settings } = storeToRefs(store)

  onMounted(() => {
    // Initialisation si nécessaire
  })

  onUnmounted(() => {
    store.clearLinks()
  })

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

  const copyAllLinks = async () => {
    if (!links.value.length) return false

    try {
      // Séparer les liens internes et externes
      const internalLinks = links.value.filter(link => !link.isExternal)
      const externalLinks = links.value.filter(link => link.isExternal)

      // Fonction pour formater un lien selon le mode
      const formatLink = (link: typeof links.value[0]) => {
        if (settings.value.useMarkdown) {
          return `[${link.title?.trim() || 'Sans titre'}](${link.url})`
        }
        return link.url
      }

      // Formater les liens internes
      const internalSection = internalLinks.length ? [
        settings.value.useMarkdown ? '## 📌 Liens Internes' : '📌 Liens Internes',
        ...internalLinks.map(formatLink),
        ''
      ].join('\n') : ''

      // Formater les liens externes
      const externalSection = externalLinks.length ? [
        settings.value.useMarkdown ? '## 🌐 Liens Externes' : '🌐 Liens Externes',
        ...externalLinks.map(formatLink),
        ''
      ].join('\n') : ''

      // Combiner les sections
      const linksList = [
        internalSection,
        externalSection
      ].filter(Boolean).join('\n')

      return await copyToClipboard(linksList)
    } catch (error) {
      console.error('[ERROR] Erreur lors de la copie des liens:', error)
      return false
    }
  }

  return {
    links,
    isLoading,
    settings,
    exploreLinks: store.exploreLinks,
    exploreDeeper: store.exploreDeeper,
    updateSettings: store.updateSettings,
    copyAllLinks,
    loadSettings: store.loadSettings
  }
} 