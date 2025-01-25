import { defineStore } from 'pinia'

interface SpeedBrowsingOptions {
  scrollSpeed: number
  smoothScroll: boolean
}

export const useSpeedBrowsingStore = defineStore('speedBrowsing', {
  state: () => ({
    options: {
      scrollSpeed: 5,
      smoothScroll: true
    } as SpeedBrowsingOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('speedBrowsingOptions')
        if (result.speedBrowsingOptions) {
          this.options = { ...this.options, ...result.speedBrowsingOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load speed browsing options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ speedBrowsingOptions: this.options })
        console.log('[SUCCESS] Speed browsing options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save speed browsing options:', error)
      }
    },

    async updateOptions(newOptions: Partial<SpeedBrowsingOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    }
  }
}) 