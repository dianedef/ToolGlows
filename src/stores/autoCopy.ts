import { defineStore } from 'pinia'

interface CopyFormat {
  id: string
  name: string
  template: string
  shortcut?: string
  icon?: string
}

interface AutoCopySettings {
  formats: CopyFormat[]
  activeFormat: string
  preserveFormatting: boolean
  includeSource: boolean
  showNotifications: boolean
}

const defaultFormats: CopyFormat[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    template: '# {title}\n\n{content}\n\n> Source: {url}',
    shortcut: 'Alt+M',
    icon: '📝'
  },
  {
    id: 'html',
    name: 'HTML',
    template: '<h1>{title}</h1>\n<div>{content}</div>\n<p>Source: <a href="{url}">{url}</a></p>',
    shortcut: 'Alt+H',
    icon: '🌐'
  },
  {
    id: 'text',
    name: 'Texte brut',
    template: '{content}\n\nSource: {url}',
    shortcut: 'Alt+T',
    icon: '📄'
  }
]

const defaultSettings: AutoCopySettings = {
  formats: defaultFormats,
  activeFormat: 'text',
  preserveFormatting: true,
  includeSource: true,
  showNotifications: true
}

export const useAutoCopyStore = defineStore('autoCopy', {
  state: () => ({
    settings: { ...defaultSettings },
    isActive: false
  }),

  actions: {
    async loadSettings() {
      try {
        const result = await chrome.storage.sync.get('autoCopySettings')
        if (result.autoCopySettings) {
          this.settings = {
            ...defaultSettings,
            ...result.autoCopySettings,
            formats: defaultFormats
          }
        }
        console.log('[DEBUG] Settings loaded:', this.settings)
      } catch (error) {
        console.error('[ERROR] Failed to load Auto Copy settings:', error)
        this.settings = { ...defaultSettings }
      }
    },

    async saveSettings() {
      try {
        await chrome.storage.sync.set({ autoCopySettings: this.settings })
        console.log('[SUCCESS] Auto Copy settings saved:', this.settings)
      } catch (error) {
        console.error('[ERROR] Failed to save Auto Copy settings:', error)
      }
    },

    async updateSettings(newSettings: Partial<AutoCopySettings>) {
      this.settings = { ...this.settings, ...newSettings }
      await this.saveSettings()
    },

    setActiveFormat(formatId: string) {
      if (this.settings.formats.some(f => f.id === formatId)) {
        this.settings.activeFormat = formatId
        this.saveSettings()
      }
    },

    addFormat(format: CopyFormat) {
      this.settings.formats.push(format)
      this.saveSettings()
    },

    removeFormat(formatId: string) {
      const index = this.settings.formats.findIndex(f => f.id === formatId)
      if (index > -1) {
        this.settings.formats.splice(index, 1)
        this.saveSettings()
      }
    },

    updateFormat(formatId: string, updates: Partial<CopyFormat>) {
      const format = this.settings.formats.find(f => f.id === formatId)
      if (format) {
        Object.assign(format, updates)
        this.saveSettings()
      }
    },

    setActive(value: boolean) {
      this.isActive = value
    }
  }
}) 