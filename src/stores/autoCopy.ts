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
  enableAltSelection: boolean
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
  showNotifications: true,
  enableAltSelection: true
}

export const useAutoCopyStore = defineStore('autoCopy', {
  state: () => ({
    isActive: false,
    settings: defaultSettings
  }),

  actions: {
    setActive(value: boolean) {
      this.isActive = value
    },

    setActiveFormat(format: string) {
      this.settings.activeFormat = format
      this.saveSettings()
    },

    updateSettings(settings: AutoCopySettings) {
      this.settings = {
        ...defaultSettings,
        ...settings,
        formats: settings.formats || defaultFormats
      }
      this.saveSettings()
    },

    async saveSettings() {
      try {
        // S'assurer que formats est un tableau avant la sauvegarde
        const settingsToSave = {
          ...this.settings,
          formats: Array.isArray(this.settings.formats) ? this.settings.formats : defaultFormats
        }
        
        await chrome.storage.sync.set({ autoCopySettings: settingsToSave })
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error)
      }
    },

    async loadSettings() {
      try {
        const data = await chrome.storage.sync.get('autoCopySettings')
        
        if (data.autoCopySettings) {
          // Convertir formats en tableau si nécessaire
          let loadedFormats = data.autoCopySettings.formats
          if (loadedFormats && !Array.isArray(loadedFormats)) {
            loadedFormats = Object.values(loadedFormats)
          }
          
          // S'assurer que le format actif existe dans la liste des formats
          const formats = Array.isArray(loadedFormats) ? loadedFormats : defaultFormats
          const activeFormat = data.autoCopySettings.activeFormat
          const formatExists = formats.some(f => f.id === activeFormat)
          
          this.settings = {
            ...defaultSettings,
            ...data.autoCopySettings,
            formats,
            // Si le format actif n'existe pas, utiliser le format par défaut
            activeFormat: formatExists ? activeFormat : defaultSettings.activeFormat
          }
        } else {
          this.settings = defaultSettings
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
        this.settings = defaultSettings
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
    }
  }
}) 