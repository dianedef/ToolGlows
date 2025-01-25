import { defineStore } from 'pinia'

interface GmailLabel {
  id: string
  name: string
  color: string
  shortcut?: string
}

interface BetterGmailOptions {
  labels: GmailLabel[]
  autoArchive: boolean
  archiveDelay: number
  showUnreadCount: boolean
  showPreview: boolean
  previewPosition: 'right' | 'bottom'
  customKeyboardShortcuts: {
    id: string
    name: string
    key: string
    action: string
  }[]
  filters: {
    id: string
    name: string
    conditions: {
      field: 'from' | 'to' | 'subject' | 'hasAttachment'
      operator: 'contains' | 'notContains' | 'equals' | 'notEquals' | 'matches'
      value: string
    }[]
    actions: {
      type: 'label' | 'archive' | 'mark' | 'star' | 'forward'
      value: string
    }[]
  }[]
  composeDefaults: {
    signature: string
    font: string
    fontSize: number
    spellCheck: boolean
    confirmationBeforeSend: boolean
  }
}

export const useBetterGmailStore = defineStore('betterGmail', {
  state: () => ({
    options: {
      labels: [],
      autoArchive: true,
      archiveDelay: 5,
      showUnreadCount: true,
      showPreview: true,
      previewPosition: 'right',
      customKeyboardShortcuts: [
        {
          id: 'archive-all',
          name: 'Archiver tout',
          key: 'Alt+A',
          action: 'archiveAll'
        },
        {
          id: 'mark-all-read',
          name: 'Marquer tout comme lu',
          key: 'Alt+R',
          action: 'markAllRead'
        }
      ],
      filters: [],
      composeDefaults: {
        signature: '',
        font: 'Arial',
        fontSize: 12,
        spellCheck: true,
        confirmationBeforeSend: true
      }
    } as BetterGmailOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('betterGmailOptions')
        if (result.betterGmailOptions) {
          this.options = { ...this.options, ...result.betterGmailOptions }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des options de Better Gmail:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ betterGmailOptions: this.options })
        console.log('✅ Options de Better Gmail sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options de Better Gmail:', error)
      }
    },

    async updateOptions(newOptions: Partial<BetterGmailOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    addLabel(label: GmailLabel) {
      this.options.labels.push(label)
      this.saveOptions()
    },

    removeLabel(labelId: string) {
      const index = this.options.labels.findIndex(l => l.id === labelId)
      if (index > -1) {
        this.options.labels.splice(index, 1)
        this.saveOptions()
      }
    },

    updateLabel(labelId: string, updates: Partial<GmailLabel>) {
      const label = this.options.labels.find(l => l.id === labelId)
      if (label) {
        Object.assign(label, updates)
        this.saveOptions()
      }
    },

    addShortcut(shortcut: BetterGmailOptions['customKeyboardShortcuts'][0]) {
      this.options.customKeyboardShortcuts.push(shortcut)
      this.saveOptions()
    },

    removeShortcut(shortcutId: string) {
      const index = this.options.customKeyboardShortcuts.findIndex(s => s.id === shortcutId)
      if (index > -1) {
        this.options.customKeyboardShortcuts.splice(index, 1)
        this.saveOptions()
      }
    },

    updateShortcut(shortcutId: string, updates: Partial<BetterGmailOptions['customKeyboardShortcuts'][0]>) {
      const shortcut = this.options.customKeyboardShortcuts.find(s => s.id === shortcutId)
      if (shortcut) {
        Object.assign(shortcut, updates)
        this.saveOptions()
      }
    },

    addFilter(filter: BetterGmailOptions['filters'][0]) {
      this.options.filters.push(filter)
      this.saveOptions()
    },

    removeFilter(filterId: string) {
      const index = this.options.filters.findIndex(f => f.id === filterId)
      if (index > -1) {
        this.options.filters.splice(index, 1)
        this.saveOptions()
      }
    },

    updateFilter(filterId: string, updates: Partial<BetterGmailOptions['filters'][0]>) {
      const filter = this.options.filters.find(f => f.id === filterId)
      if (filter) {
        Object.assign(filter, updates)
        this.saveOptions()
      }
    }
  }
}) 