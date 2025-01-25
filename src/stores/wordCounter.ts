import { defineStore } from 'pinia'

interface WordCounterOptions {
  countSpaces: boolean
  countPunctuation: boolean
  showFrequentWords: boolean
  maxFrequentWords: number
  showLanguageDistribution: boolean
  showReadingTime: boolean
  wordsPerMinute: number
}

export const useWordCounterStore = defineStore('wordCounter', {
  state: () => ({
    options: {
      countSpaces: true,
      countPunctuation: true,
      showFrequentWords: true,
      maxFrequentWords: 10,
      showLanguageDistribution: true,
      showReadingTime: true,
      wordsPerMinute: 200
    } as WordCounterOptions,
    isActive: false,
    isInitialized: false,
    selectedText: ''
  }),

  actions: {
    async loadOptions() {
      if (this.isInitialized) {
        return
      }

      try {
        const result = await chrome.storage.sync.get('wordCounterOptions')
        if (result.wordCounterOptions) {
          this.options = { ...this.options, ...result.wordCounterOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load word counter options:', error)
      } finally {
        this.isInitialized = true
      }
    },

    async saveOptions() {
      if (!this.isInitialized) {
        await this.loadOptions()
      }

      try {
        await chrome.storage.sync.set({ wordCounterOptions: this.options })
      } catch (error) {
        console.error('[ERROR] Failed to save word counter options:', error)
      }
    },

    async updateOptions(newOptions: Partial<WordCounterOptions>) {
      if (!this.isInitialized) {
        await this.loadOptions()
      }

      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    setSelectedText(text: string) {
      this.selectedText = text
    }
  }
}) 