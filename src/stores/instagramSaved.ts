import { defineStore } from 'pinia'

interface Collection {
  id: string
  name: string
  description?: string
  icon?: string
}

interface InstagramSavedOptions {
  collections: Collection[]
  autoSync: boolean
  syncInterval: number
  notifyOnSync: boolean
  downloadPath: string
  downloadFormat: 'original' | 'compressed'
  organizeByDate: boolean
  organizeByCollection: boolean
  backupEnabled: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  maxBackups: number
}

export const useInstagramSavedStore = defineStore('instagramSaved', {
  state: () => ({
    options: {
      collections: [],
      autoSync: true,
      syncInterval: 60,
      notifyOnSync: true,
      downloadPath: 'Instagram/Saved',
      downloadFormat: 'original',
      organizeByDate: true,
      organizeByCollection: true,
      backupEnabled: true,
      backupFrequency: 'weekly',
      maxBackups: 5
    } as InstagramSavedOptions,
    isActive: false
  }),

  actions: {
    async loadOptions() {
      try {
        const result = await chrome.storage.sync.get('instagramSavedOptions')
        if (result.instagramSavedOptions) {
          this.options = { ...this.options, ...result.instagramSavedOptions }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des options de Instagram Saved:', error)
      }
    },

    async saveOptions() {
      try {
        await chrome.storage.sync.set({ instagramSavedOptions: this.options })
        console.log('✅ Options de Instagram Saved sauvegardées')
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des options de Instagram Saved:', error)
      }
    },

    async updateOptions(newOptions: Partial<InstagramSavedOptions>) {
      this.options = { ...this.options, ...newOptions }
      await this.saveOptions()
    },

    setActive(value: boolean) {
      this.isActive = value
    },

    addCollection(collection: Collection) {
      this.options.collections.push(collection)
      this.saveOptions()
    },

    removeCollection(collectionId: string) {
      const index = this.options.collections.findIndex(c => c.id === collectionId)
      if (index > -1) {
        this.options.collections.splice(index, 1)
        this.saveOptions()
      }
    },

    updateCollection(collectionId: string, updates: Partial<Collection>) {
      const collection = this.options.collections.find(c => c.id === collectionId)
      if (collection) {
        Object.assign(collection, updates)
        this.saveOptions()
      }
    }
  }
}) 