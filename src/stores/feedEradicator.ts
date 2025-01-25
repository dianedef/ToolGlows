import { defineStore } from 'pinia'

interface FeedEradicatorOptions {
  blockedSites: string[]
  showQuotes: boolean
  showTasks: boolean
  showTimer: boolean
  showNotifications: boolean
  soundNotifications: boolean
  notificationDuration: number
}

export const useFeedEradicatorStore = defineStore('feedEradicator', {
  state: () => ({
    options: {
      blockedSites: [],
      showQuotes: true,
      showTasks: true,
      showTimer: false,
      showNotifications: true,
      soundNotifications: false,
      notificationDuration: 3
    } as FeedEradicatorOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('feedEradicatorOptions')
        if (result.feedEradicatorOptions) {
          this.options = { ...this.options, ...result.feedEradicatorOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load Feed Eradicator options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ feedEradicatorOptions: this.options })
        console.log('[SUCCESS] Feed Eradicator options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save Feed Eradicator options:', error)
      }
    },

    async updateOptions(newOptions: Partial<FeedEradicatorOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    }
  }
}) 