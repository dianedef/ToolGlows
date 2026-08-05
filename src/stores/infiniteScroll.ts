import { defineStore } from 'pinia'

interface InfiniteScrollOptions {
  threshold: number
  autoLoad: boolean
  showProgress: boolean
  maxPages: number
}

export const useToolGlowsInfiniteScrollStore = defineStore('infiniteScroll', {
  state: () => ({
    options: {
      threshold: 400,
      autoLoad: true,
      showProgress: true,
      maxPages: 20
    } as InfiniteScrollOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('infiniteScrollOptions')
        if (result.infiniteScrollOptions) {
          this.options = { ...this.options, ...result.infiniteScrollOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load infinite scroll options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ infiniteScrollOptions: this.options })
        console.log('[SUCCESS] Infinite scroll options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save infinite scroll options:', error)
      }
    },

    async updateOptions(newOptions: Partial<InfiniteScrollOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    }
  }
})

// Pour la rétrocompatibilité, on garde l'ancien nom
export const useInfiniteScrollStore = useToolGlowsInfiniteScrollStore
