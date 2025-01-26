import { defineStore } from 'pinia'

interface LinkItem {
  url: string
  isExternal: boolean
  depth: number
  title?: string
}

interface LinksExplorerState {
  isActive: boolean
  links: LinkItem[]
  settings: {
    maxDepth: number
    includeExternal: boolean
    includeInternal: boolean
    currentDepth: number
    useMarkdown: boolean
  }
  isLoading: boolean
}

const defaultSettings = {
  maxDepth: 1,
  includeExternal: true,
  includeInternal: true,
  currentDepth: 0,
  useMarkdown: true
}

export const useLinksExplorerStore = defineStore('linksExplorer', {
  state: (): LinksExplorerState => ({
    isActive: false,
    links: [],
    settings: { ...defaultSettings },
    isLoading: false
  }),

  actions: {
    async loadSettings() {
      try {
        const result = await chrome.storage.sync.get('linksExplorerSettings')
        if (result.linksExplorerSettings) {
          this.settings = {
            ...defaultSettings,
            ...result.linksExplorerSettings
          }
        }
        console.log('[DEBUG] Links Explorer settings loaded:', this.settings)
      } catch (error) {
        console.error('[ERROR] Failed to load Links Explorer settings:', error)
        this.settings = { ...defaultSettings }
      }
    },

    async saveSettings() {
      try {
        await chrome.storage.sync.set({ linksExplorerSettings: this.settings })
        console.log('[SUCCESS] Links Explorer settings saved:', this.settings)
      } catch (error) {
        console.error('[ERROR] Failed to save Links Explorer settings:', error)
      }
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    async updateSettings(settings: Partial<LinksExplorerState['settings']>) {
      this.settings = { ...this.settings, ...settings }
      await this.saveSettings()
    },

    async exploreLinks() {
      this.isLoading = true
      this.links = []
      
      try {
        // Fonction pour nettoyer l'URL
        const cleanUrl = (url: string) => {
          try {
            const urlObj = new URL(url)
            // Supprime le hash et ses paramètres
            return urlObj.origin + urlObj.pathname
          } catch {
            return url
          }
        }

        // Collecte et nettoyage des liens
        const rawLinks = Array.from(document.querySelectorAll('a')).map(link => ({
          url: cleanUrl(link.href),
          isExternal: link.hostname !== window.location.hostname,
          depth: 0,
          title: link.textContent?.trim()
        }))

        // Suppression des doublons en se basant sur l'URL
        const uniqueLinks = rawLinks.reduce((acc, current) => {
          const exists = acc.find(item => item.url === current.url)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, [] as typeof rawLinks)

        // Filtrage selon les paramètres
        this.links = uniqueLinks.filter(link => {
          if (!link.url) return false
          if (this.settings.includeExternal && link.isExternal) return true
          if (this.settings.includeInternal && !link.isExternal) return true
          return false
        })
      } catch (error) {
        console.error('Erreur lors de l\'exploration des liens:', error)
      } finally {
        this.isLoading = false
      }
    },

    async exploreDeeper() {
      if (this.settings.currentDepth >= this.settings.maxDepth) return
      this.settings.currentDepth++
      await this.saveSettings()
      // TODO: Implémenter la logique de scraping plus profond
    },

    clearLinks() {
      this.links = []
      this.settings.currentDepth = 0
      this.saveSettings()
    }
  }
}) 