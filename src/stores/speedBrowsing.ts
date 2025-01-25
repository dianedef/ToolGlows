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
        console.error('❌ Erreur lors du chargement des options de navigation rapide:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ speedBrowsingOptions: this.options })
        console.log('✅ Options de navigation rapide sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options de navigation rapide:', error)
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