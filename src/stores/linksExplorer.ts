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
        // Check if the extension context is still valid
        if (!chrome.runtime?.id) {
          console.log('[INFO] Extension context invalidated, skipping settings save')
          return
        }
        
        await chrome.storage.sync.set({ linksExplorerSettings: this.settings })
        console.log('[SUCCESS] Links Explorer settings saved:', this.settings)
      } catch (error) {
        // Ignore the error if it's related to the invalidated context
        if (error.message?.includes('Extension context invalidated')) {
          console.log('[INFO] Extension context invalidated, skipping settings save')
          return
        }
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

    async exploreLinks(depth: number = 0) {
      if (depth >= this.settings.maxDepth) return []
      
      this.isLoading = true
      if (depth === 0) this.links = []
      
      try {
        // Function to clean the URL
        const cleanUrl = (url: string) => {
          try {
            const urlObj = new URL(url)
            return urlObj.origin + urlObj.pathname
          } catch {
            return url
          }
        }

        // Collect links from the current page
        const rawLinks = Array.from(document.querySelectorAll('a')).map(link => ({
          url: cleanUrl(link.href),
          isExternal: link.hostname !== window.location.hostname,
          depth,
          title: link.textContent?.trim()
        }))

        // Initial filtering of links
        const newLinks = rawLinks.filter(link => {
          if (!link.url) return false
          // Avoid duplicates
          if (this.links.some(existingLink => existingLink.url === link.url)) return false
          if (this.settings.includeExternal && link.isExternal) return true
          if (this.settings.includeInternal && !link.isExternal) return true
          return false
        })

        // Add the new links
        this.links.push(...newLinks)

        // Recursively explore internal links if necessary
        if (depth < this.settings.maxDepth - 1) {
          const internalLinks = newLinks.filter(link => !link.isExternal)
          for (const link of internalLinks) {
            try {
              // Load the page in a temporary iframe
              const iframe = document.createElement('iframe')
              iframe.style.display = 'none'
              document.body.appendChild(iframe)
              
              // Wait for the page to load
              await new Promise((resolve, reject) => {
                iframe.onload = resolve
                iframe.onerror = reject
                iframe.src = link.url
              })

              // Explore the links in the iframe
              if (iframe.contentDocument) {
                const iframeLinks = Array.from(iframe.contentDocument.querySelectorAll('a')).map(link => ({
                  url: cleanUrl(link.href),
                  isExternal: link.hostname !== window.location.hostname,
                  depth: depth + 1,
                  title: link.textContent?.trim()
                }))

                // Filter and add the links
                const newIframeLinks = iframeLinks.filter(link => {
                  if (!link.url) return false
                  if (this.links.some(existingLink => existingLink.url === link.url)) return false
                  if (this.settings.includeExternal && link.isExternal) return true
                  if (this.settings.includeInternal && !link.isExternal) return true
                  return false
                })

                this.links.push(...newIframeLinks)
              }

              // Clean up
              document.body.removeChild(iframe)
            } catch (error) {
              console.warn(`[WARN] Unable to explore ${link.url}:`, error)
            }
          }
        }

      } catch (error) {
        console.error('Error while exploring links:', error)
      } finally {
        this.isLoading = false
      }

      return this.links
    },

    async exploreDeeper() {
      if (this.settings.currentDepth >= this.settings.maxDepth) return
      
      this.isLoading = true
      this.settings.currentDepth++
      await this.saveSettings()

      try {
        // Explore level by level
        for (let depth = 0; depth <= this.settings.currentDepth; depth++) {
          console.log(`[DEBUG] Exploring depth ${depth}`)
          await this.exploreLinks(depth)
        }
      } catch (error) {
        console.error('[ERROR] Error while exploring deeper:', error)
      } finally {
        this.isLoading = false
      }
    },

    clearLinks() {
      this.links = []
      this.settings.currentDepth = 0
      // Only save if we're not unloading the page
      if (document.readyState !== 'unloading') {
        this.saveSettings()
      }
    }
  }
}) 