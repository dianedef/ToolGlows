import { defineStore } from 'pinia'

interface InstantOCROptions {
  language: string
  autoDetectLanguage: boolean
  copyToClipboard: boolean
  showConfidence: boolean
  minimumConfidence: number
  enableSpellCheck: boolean
}

export const useInstantOCRStore = defineStore('instantOCR', {
  state: () => ({
    options: {
      language: 'fra',
      autoDetectLanguage: true,
      copyToClipboard: true,
      showConfidence: false,
      minimumConfidence: 70,
      enableSpellCheck: true
    } as InstantOCROptions,
    isActive: false,
    isProcessing: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('instantOCROptions')
        if (result.instantOCROptions) {
          this.options = { ...this.options, ...result.instantOCROptions }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des options de l\'OCR:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ instantOCROptions: this.options })
        console.log('✅ Options de l\'OCR instantané sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options de l\'OCR:', error)
      }
    },

    async updateOptions(newOptions: Partial<InstantOCROptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    setProcessing(value: boolean) {
      this.isProcessing = value
    }
  }
}) 