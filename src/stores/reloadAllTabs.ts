import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bridgeApi } from '@/bridge'

interface ReloadAllTabsSettings {
  shortcut: string
  enableShortcut: boolean
}

const defaultSettings: ReloadAllTabsSettings = {
  shortcut: 'Alt+R',
  enableShortcut: false
}

export const useReloadAllTabsStore = defineStore('reloadAllTabs', () => {
  const isActive = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const settings = ref<ReloadAllTabsSettings>(defaultSettings)

  const reloadAllTabs = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('[INFO] Starting tabs reload')
      const { successCount, errorCount } = await bridgeApi.reloadAllTabs()
      
      console.log(`[SUCCESS] Reloaded ${successCount} tabs successfully, ${errorCount} failures`)
      
      if (errorCount > 0) {
        error.value = `${errorCount} tab(s) failed to reload`
      }
    } catch (err) {
      console.error('[ERROR] Failed to reload tabs:', err)
      error.value = 'Error during tabs reload'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setActive = (value: boolean) => {
    isActive.value = value
  }

  const updateShortcut = async (shortcut: string) => {
    settings.value.shortcut = shortcut
    await saveSettings()
  }

  const toggleShortcut = async (enabled: boolean) => {
    settings.value.enableShortcut = enabled
    await saveSettings()
  }

  const saveSettings = async () => {
    try {
      await chrome.storage.sync.set({ reloadAllTabsSettings: settings.value })
    } catch (err) {
      console.error('[ERROR] Failed to save reload all tabs settings:', err)
      throw err
    }
  }

  const loadSettings = async () => {
    try {
      const data = await chrome.storage.sync.get('reloadAllTabsSettings')
      if (data.reloadAllTabsSettings) {
        settings.value = {
          ...defaultSettings,
          ...data.reloadAllTabsSettings
        }
      } else {
        settings.value = defaultSettings
      }
    } catch (err) {
      console.error('[ERROR] Failed to load reload all tabs settings:', err)
      settings.value = defaultSettings
    }
  }

  // Gestionnaire de raccourci clavier
  const handleShortcut = (event: KeyboardEvent) => {
    if (!settings.value.enableShortcut) return

    const shortcut = settings.value.shortcut.toLowerCase()
    const keys = shortcut.split('+')
    const isShortcutPressed = keys.every(key => {
      switch (key) {
        case 'alt': return event.altKey
        case 'ctrl': return event.ctrlKey
        case 'shift': return event.shiftKey
        default: return event.key.toLowerCase() === key
      }
    })

    if (isShortcutPressed) {
      reloadAllTabs()
    }
  }

  return {
    isActive,
    isLoading,
    error,
    settings,
    setActive,
    reloadAllTabs,
    updateShortcut,
    toggleShortcut,
    loadSettings,
    handleShortcut
  }
})
