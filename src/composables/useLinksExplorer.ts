import { useLinksExplorerStore } from '@/stores/linksExplorer'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

export function useLinksExplorer() {
  const store = useLinksExplorerStore()
  const { links, isLoading, settings } = storeToRefs(store)

  onMounted(() => {
    // Initialization if necessary
  })

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

  const copyAllLinks = async () => {
    if (!links.value.length) return false

    try {
      // Separate internal and external links
      const internalLinks = links.value.filter(link => !link.isExternal)
      const externalLinks = links.value.filter(link => link.isExternal)

      // Function to format a link based on the mode
      const formatLink = (link: typeof links.value[0]) => {
        if (settings.value.useMarkdown) {
          return `[${link.title?.trim() || 'Untitled'}](${link.url})`
        }
        return link.url
      }

      // Format internal links
      const internalSection = internalLinks.length ? [
        settings.value.useMarkdown ? '## 📌 Internal Links' : '📌 Internal Links',
        ...internalLinks.map(formatLink),
        ''
      ].join('\n') : ''

      // Format external links
      const externalSection = externalLinks.length ? [
        settings.value.useMarkdown ? '## 🌐 External Links' : '🌐 External Links',
        ...externalLinks.map(formatLink),
        ''
      ].join('\n') : ''

      // Combine sections
      const linksList = [
        internalSection,
        externalSection
      ].filter(Boolean).join('\n')

      return await copyToClipboard(linksList)
    } catch (error) {
      console.error('[ERROR] Error copying links:', error)
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