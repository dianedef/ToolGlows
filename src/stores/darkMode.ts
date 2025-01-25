import { defineStore } from 'pinia'

interface DarkModeOptions {
  backgroundColor: string
  textColor: string
  linkColor: string
  contrastLevel: number
  invertImages: boolean
  autoEnable: boolean
  scheduleStart: string
  scheduleEnd: string
}

export const useDarkModeStore = defineStore('darkMode', {
  state: () => ({
    options: {
      backgroundColor: '#1a1a1a',
      textColor: '#e0e0e0',
      linkColor: '#4a9eff',
      contrastLevel: 1,
      invertImages: false,
      autoEnable: false,
      scheduleStart: '20:00',
      scheduleEnd: '07:00'
    } as DarkModeOptions,
    isActive: false,
    isInitialized: false
  }),

  actions: {
    async loadOptions() {
      if (this.isInitialized) {
        return
      }

      try {
        const result = await chrome.storage.sync.get('darkModeOptions')
        if (result.darkModeOptions) {
          this.options = { ...this.options, ...result.darkModeOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load dark mode options:', error)
      } finally {
        this.isInitialized = true
      }
    },

    async saveOptions() {
      if (!this.isInitialized) {
        await this.loadOptions()
      }

      try {
        await chrome.storage.sync.set({ darkModeOptions: this.options })
        console.log('✅ Options du mode sombre sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options du mode sombre:', error)
      }
    },

    async updateOptions(newOptions: Partial<DarkModeOptions>) {
      if (!this.isInitialized) {
        await this.loadOptions()
      }

      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    }
  }
}) 