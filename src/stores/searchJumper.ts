import { defineStore } from 'pinia'

interface SearchEngine {
  id: string
  name: string
  url: string
  icon: string
}

interface SearchJumperOptions {
  engines: SearchEngine[]
  shortcutKey: string
  showIcons: boolean
  openInNewTab: boolean
  groupByCategory: boolean
  customStyles: {
    backgroundColor: string
    textColor: string
    accentColor: string
  }
}

export const useSearchJumperStore = defineStore('searchJumper', {
  state: () => ({
    options: {
      engines: [
        { id: 'google', name: 'Google', url: 'https://google.com/search?q={query}', icon: 'search' },
        { id: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', icon: 'duck' },
        { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', icon: 'search' },
        { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}', icon: 'video' },
        { id: 'maps', name: 'Google Maps', url: 'https://www.google.com/maps/search/{query}', icon: 'map' }
      ],
      shortcutKey: 'Alt+S',
      showIcons: true,
      openInNewTab: true,
      groupByCategory: false,
      customStyles: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        accentColor: '#2196f3'
      }
    } as SearchJumperOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('searchJumperOptions')
        if (result.searchJumperOptions) {
          this.options = { ...this.options, ...result.searchJumperOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load Search Jumper options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ searchJumperOptions: this.options })
        console.log('[SUCCESS] Search Jumper options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save Search Jumper options:', error)
      }
    },

    async updateOptions(newOptions: Partial<SearchJumperOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    addEngine(engine: SearchEngine) {
      this.options.engines.push(engine)
      this.saveOptions()
    },

    removeEngine(engineId: string) {
      const index = this.options.engines.findIndex(e => e.id === engineId)
      if (index > -1) {
        this.options.engines.splice(index, 1)
        this.saveOptions()
      }
    },

    updateEngine(engineId: string, updates: Partial<SearchEngine>) {
      const engine = this.options.engines.find(e => e.id === engineId)
      if (engine) {
        Object.assign(engine, updates)
        this.saveOptions()
      }
    }
  }
}) 