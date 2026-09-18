import { defineStore } from 'pinia'

interface CopyFormat {
  id: string
  name: string
  template: string
  shortcut?: string
  icon?: string
}

interface RichCopyOptions {
  formats: CopyFormat[]
  defaultFormat: string
  preserveFormatting: boolean
  includeMetadata: boolean
  smartQuotes: boolean
  autoDetectLanguage: boolean
  customReplacements: {
    search: string
    replace: string
  }[]
  maxHistoryItems: number
  showNotifications: boolean
}

export const useRichCopyStore = defineStore('richCopy', {
  state: () => ({
    options: {
      formats: [
        {
          id: 'markdown',
          name: 'Markdown',
          template: '[{title}]({url})',
          shortcut: 'Alt+M',
          icon: '📝'
        },
        {
          id: 'html',
          name: 'HTML Link',
          template: '<a href="{url}">{title}</a>',
          shortcut: 'Alt+H',
          icon: '🌐'
        },
        {
          id: 'plain',
          name: 'Titre - URL',
          template: '{title} - {url}',
          shortcut: 'Alt+T',
          icon: '📄'
        },
        {
          id: 'url',
          name: 'URL uniquement',
          template: '{url}',
          shortcut: 'Alt+U',
          icon: '🔗'
        }
      ],
      defaultFormat: 'markdown',
      preserveFormatting: true,
      includeMetadata: true,
      smartQuotes: true,
      autoDetectLanguage: true,
      customReplacements: [],
      maxHistoryItems: 50,
      showNotifications: true
    } as RichCopyOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('richCopyOptions')
        if (result.richCopyOptions) {
          this.options = { ...this.options, ...result.richCopyOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load Rich Copy options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ richCopyOptions: this.options })
        console.log('[SUCCESS] Rich Copy options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save Rich Copy options:', error)
      }
    },

    async updateOptions(newOptions: Partial<RichCopyOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    addFormat(format: CopyFormat) {
      this.options.formats.push(format)
      this.saveOptions()
    },

    removeFormat(formatId: string) {
      const index = this.options.formats.findIndex(f => f.id === formatId)
      if (index > -1) {
        this.options.formats.splice(index, 1)
        this.saveOptions()
      }
    },

    updateFormat(formatId: string, updates: Partial<CopyFormat>) {
      const format = this.options.formats.find(f => f.id === formatId)
      if (format) {
        Object.assign(format, updates)
        this.saveOptions()
      }
    },

    addCustomReplacement(search: string, replace: string) {
      this.options.customReplacements.push({ search, replace })
      this.saveOptions()
    },

    removeCustomReplacement(index: number) {
      this.options.customReplacements.splice(index, 1)
      this.saveOptions()
    }
  }
}) 