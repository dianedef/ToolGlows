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
  }
  isLoading: boolean
}

export const useLinksExplorerStore = defineStore('linksExplorer', {
  state: (): LinksExplorerState => ({
    isActive: false,
    links: [],
    settings: {
      maxDepth: 1,
      includeExternal: true,
      includeInternal: true,
      currentDepth: 0
    },
    isLoading: false
  }),

  actions: {
    setActive(value: boolean) {
      this.isActive = value
    },

    updateSettings(settings: Partial<LinksExplorerState['settings']>) {
      this.settings = { ...this.settings, ...settings }
    },

    async exploreLinks() {
      this.isLoading = true
      this.links = []
      
      try {
        const links = Array.from(document.querySelectorAll('a')).map(link => ({
          url: link.href,
          isExternal: link.hostname !== window.location.hostname,
          depth: 0,
          title: link.textContent?.trim()
        }))

        this.links = links.filter(link => {
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
      // TODO: Implémenter la logique de scraping plus profond
    },

    clearLinks() {
      this.links = []
      this.settings.currentDepth = 0
    }
  }
}) 