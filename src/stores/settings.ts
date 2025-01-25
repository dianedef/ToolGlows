import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { bridgeApi, initBridgeListeners } from '@/bridge'
import { useToolflowzStore } from '@/stores/toolflowz'
import { useBrowserSyncStorage } from '@/composables/useBrowserStorage'

export interface ToolflowzSettings {
  expanded: boolean
  position: {
    x: number
    y: number
  }
  activeTools: string[]
  isPinned: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  console.log('[INFO] Creating settings store')

  if (!chrome?.storage?.sync) {
    console.error('[ERROR] chrome.storage.sync API not available in settings store')
    throw new Error('chrome.storage.sync API is not available')
  }

  const { data: settings, promise: settingsLoaded } = useBrowserSyncStorage<ToolflowzSettings>('toolflowzSettings', {
    expanded: false,
    position: { x: 20, y: 20 },
    activeTools: [],
    isPinned: false
  })

  // Surveille les changements de settings pour les appliquer immédiatement
  watch(() => settings.value, (newSettings) => {
    console.log('[INFO] Settings changed:', newSettings)
    applySettings(newSettings)
  }, { deep: true })

  // Applique les settings à l'UI
  const applySettings = (newSettings: ToolflowzSettings) => {
    console.log('[INFO] Applying settings:', newSettings)
    
    // Position
    const toolbar = document.querySelector('.toolflowz-bar') as HTMLElement
    if (toolbar && newSettings.position) {
      toolbar.style.left = `${newSettings.position.x}px`
      toolbar.style.top = `${newSettings.position.y}px`
    }

    // Outils actifs - seulement si différents des outils actuels
    const toolflowzStore = useToolflowzStore()
    if (newSettings.activeTools && 
        JSON.stringify(toolflowzStore.activeTools) !== JSON.stringify(newSettings.activeTools)) {
      toolflowzStore.setActiveTools(newSettings.activeTools)
      console.log('[INFO] Active tools updated:', newSettings.activeTools)
    }
  }

  const loadSettings = async () => {
    console.log('[INFO] Loading settings')
    try {
      // 1. Charge depuis le storage local
      const result = await chrome.storage.sync.get('toolflowzSettings')
      if (result.toolflowzSettings) {
        settings.value = result.toolflowzSettings
        console.log('[SUCCESS] Settings loaded from storage:', settings.value)
        applySettings(settings.value)
      } else {
        console.log('[INFO] No settings found in storage, using defaults')
      }

      // 2. Synchronise avec le background
      const state = await bridgeApi.getInitialState()
      if (state?.settings) {
        settings.value = state.settings
        console.log('[SUCCESS] Settings synced with background:', settings.value)
        applySettings(settings.value)
      }
    } catch (error) {
      console.error('[ERROR] Failed to load settings:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<ToolflowzSettings>) => {
    console.log('[INFO] Updating settings:', newSettings)
    // Met à jour localement
    settings.value = { ...settings.value, ...newSettings }
    
    try {
      // Envoie au background
      await bridgeApi.updateSettings(settings.value)
      console.log('[SUCCESS] Settings update sent to background')
    } catch (error) {
      console.error('[ERROR] Failed to update settings:', error)
    }
  }

  const updatePosition = async (x: number, y: number) => {
    console.log('[INFO] Updating position:', { x, y })
    // Met à jour localement
    settings.value.position = { x, y }
    
    try {
      // Envoie au background
      await bridgeApi.updateSettings(settings.value)
      console.log('[SUCCESS] Position update sent to background')
    } catch (error) {
      console.error('[ERROR] Failed to update position:', error)
    }
  }

  const toggleTool = async (toolId: string) => {
    console.log('[INFO] Toggling tool:', toolId)
    const index = settings.value.activeTools.indexOf(toolId)
    if (index === -1) {
      settings.value.activeTools.push(toolId)
    } else {
      settings.value.activeTools.splice(index, 1)
    }
    
    try {
      // Forcer la sauvegarde et la synchronisation
      await bridgeApi.updateSettings(settings.value)
      console.log('[SUCCESS] Tool toggle synced with background')
    } catch (error) {
      console.error('[ERROR] Failed to sync tool toggle:', error)
    }
  }

  // Initialise les listeners pour les mises à jour depuis d'autres onglets
  initBridgeListeners({
    onSettingsUpdate: (newSettings) => {
      if (newSettings) {
        console.log('[INFO] Received settings update from another instance:', newSettings)
        settings.value = newSettings
        applySettings(newSettings)
        console.log('[SUCCESS] Settings updated from another instance')
      }
    }
  })

  return {
    settings,
    loadSettings,
    updateSettings,
    updatePosition,
    toggleTool
  }
}) 