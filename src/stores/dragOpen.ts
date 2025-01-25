import { defineStore } from 'pinia'

interface DragOpenOptions {
  enableDragToOpen: boolean
  enableDropToOpen: boolean
  openInNewTab: boolean
  openInBackground: boolean
  dragThreshold: number
  dragDelay: number
  allowedFileTypes: string[]
  customActions: {
    id: string
    name: string
    pattern: string
    action: 'open' | 'download' | 'copy' | 'custom'
    customScript?: string
  }[]
}

export const useDragOpenStore = defineStore('dragOpen', {
  state: () => ({
    options: {
      enableDragToOpen: true,
      enableDropToOpen: true,
      openInNewTab: true,
      openInBackground: false,
      dragThreshold: 50,
      dragDelay: 500,
      allowedFileTypes: [
        'image/*',
        'application/pdf',
        'text/*',
        'video/*',
        'audio/*'
      ],
      customActions: []
    } as DragOpenOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('dragOpenOptions')
        if (result.dragOpenOptions) {
          this.options = { ...this.options, ...result.dragOpenOptions }
        }
      } catch (error) {
        console.error('[ERROR] Failed to load Drag Open options:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ dragOpenOptions: this.options })
        console.log('[SUCCESS] Drag Open options saved')
      } catch (error) {
        console.error('[ERROR] Failed to save Drag Open options:', error)
      }
    },

    async updateOptions(newOptions: Partial<DragOpenOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    addCustomAction(action: DragOpenOptions['customActions'][0]) {
      this.options.customActions.push(action)
      this.saveOptions()
    },

    removeCustomAction(actionId: string) {
      const index = this.options.customActions.findIndex(a => a.id === actionId)
      if (index > -1) {
        this.options.customActions.splice(index, 1)
        this.saveOptions()
      }
    },

    updateCustomAction(actionId: string, updates: Partial<DragOpenOptions['customActions'][0]>) {
      const action = this.options.customActions.find(a => a.id === actionId)
      if (action) {
        Object.assign(action, updates)
        this.saveOptions()
      }
    }
  }
}) 