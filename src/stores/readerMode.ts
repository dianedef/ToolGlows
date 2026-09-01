import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import {
  defaultReaderModeOptions,
  extractReaderArticle,
  normalizeReaderModeOptions,
  type ReaderArticle,
  type ReaderModeOptions,
} from '@/composables/useReaderMode'

const storageKey = 'readerModeOptions'

interface HostPageState {
  activeElement: HTMLElement | null
  documentOverflow: string
  scrollX: number
  scrollY: number
}

export const useReaderModeStore = defineStore('readerMode', {
  state: () => ({
    options: { ...defaultReaderModeOptions } as ReaderModeOptions,
    article: null as ReaderArticle | null,
    isActive: false,
    isInitialized: false,
    isParsing: false,
    errorMessage: '',
    hostPageState: null as HostPageState | null,
  }),

  actions: {
    async loadOptions() {
      if (this.isInitialized) return
      try {
        const result = await chrome.storage.sync.get(storageKey)
        this.options = normalizeReaderModeOptions(result[storageKey])
      } catch (error) {
        console.error('[Reader Mode] Failed to load preferences:', error)
        this.options = { ...defaultReaderModeOptions }
      } finally {
        this.isInitialized = true
      }
    },

    async saveOptions() {
      if (!this.isInitialized) await this.loadOptions()
      this.options = normalizeReaderModeOptions(this.options)
      try {
        await chrome.storage.sync.set({ [storageKey]: this.options })
      } catch (error) {
        console.error('[Reader Mode] Failed to save preferences:', error)
      }
    },

    async updateOptions(newOptions: Partial<ReaderModeOptions>) {
      const requiresArticleRefresh =
        newOptions.showImages !== undefined || newOptions.showLinks !== undefined
      this.options = normalizeReaderModeOptions({ ...this.options, ...newOptions })
      await this.saveOptions()
      if (this.isActive && requiresArticleRefresh) await this.refreshArticle()
    },

    captureHostPage() {
      if (this.hostPageState) return
      this.hostPageState = {
        activeElement: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        documentOverflow: document.documentElement.style.overflow,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      }
      document.documentElement.style.overflow = 'hidden'
    },

    restoreHostPage() {
      const state = this.hostPageState
      if (!state) return
      document.documentElement.style.overflow = state.documentOverflow
      window.scrollTo(state.scrollX, state.scrollY)
      const previousFocusWasToolGlows = state.activeElement?.closest('#toolglows-root') !== null
      const previousFocusWasPageRoot =
        state.activeElement === document.body || state.activeElement === document.documentElement
      const needsFallbackFocus = previousFocusWasToolGlows || previousFocusWasPageRoot
      if (needsFallbackFocus) {
        window.setTimeout(() => {
          document.querySelector<HTMLElement>(
            '[data-toolglows-main], [data-tool-id="readerMode"]'
          )?.focus({ preventScroll: true })
        }, 0)
      } else if (state.activeElement?.isConnected) {
        state.activeElement.focus({ preventScroll: true })
      }
      this.hostPageState = null
    },

    async activate() {
      if (this.isActive || this.isParsing) return this.isActive
      await this.loadOptions()
      this.errorMessage = ''
      this.isParsing = true
      try {
        const article = await extractReaderArticle(document, this.options)
        if (!article) {
          this.errorMessage = 'Aucun article suffisamment structuré n’a été trouvé sur cette page.'
          return false
        }
        this.article = markRaw(article)
        this.captureHostPage()
        this.isActive = true
        return true
      } catch (error) {
        console.error('[Reader Mode] Failed to extract article:', error)
        this.errorMessage = 'Le contenu de cette page ne peut pas être converti en mode lecture.'
        return false
      } finally {
        this.isParsing = false
      }
    },

    deactivate() {
      this.isActive = false
      this.article = null
      this.restoreHostPage()
    },

    async refreshArticle() {
      if (!this.isActive) return
      try {
        const article = await extractReaderArticle(document, this.options)
        if (article) this.article = markRaw(article)
      } catch (error) {
        console.error('[Reader Mode] Failed to refresh article:', error)
      }
    },

    setActive(value: boolean) {
      return value ? this.activate() : Promise.resolve(this.deactivate())
    },
  },
})
