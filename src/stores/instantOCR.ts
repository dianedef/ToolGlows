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
        console.error('[ERROR] Failed to load OCR options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ instantOCROptions: this.options })
        console.log('[SUCCESS] Instant OCR options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save OCR options:', error)
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