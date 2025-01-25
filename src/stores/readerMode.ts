import { defineStore } from 'pinia'

interface ReaderModeOptions {
  fontFamily: string
  fontSize: number
  lineHeight: number
  maxWidth: number
  theme: 'light' | 'sepia' | 'dark'
  showImages: boolean
  showLinks: boolean
}

export const useReaderModeStore = defineStore('readerMode', {
  state: () => ({
    options: {
      fontFamily: 'system-ui',
      fontSize: 18,
      lineHeight: 1.6,
      maxWidth: 800,
      theme: 'light',
      showImages: true,
      showLinks: false
    } as ReaderModeOptions,
    isActive: false,
    isInitialized: false
  }),

  actions: {
    async loadOptions() {
      if (this.isInitialized) {
        return
      }

      try {
        const result = await chrome.storage.sync.get('readerModeOptions')
        if (result.readerModeOptions) {
          this.options = { ...this.options, ...result.readerModeOptions }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des options du mode lecture:', error)
      } finally {
        this.isInitialized = true
      }
    },

    async saveOptions() {
      if (!this.isInitialized) {
        await this.loadOptions()
      }

      try {
        await chrome.storage.sync.set({ readerModeOptions: this.options })
        console.log('✅ Options du mode lecture sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options du mode lecture:', error)
      }
    },

    async updateOptions(newOptions: Partial<ReaderModeOptions>) {
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