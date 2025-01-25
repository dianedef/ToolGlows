import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bridgeApi, initBridgeListeners } from '@/bridge'

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

  const settings = ref<ToolflowzSettings>({
    expanded: false,
    position: { x: 20, y: 20 },
    activeTools: [],
    isPinned: false
  })

  const loadSettings = async () => {
    console.log('[INFO] Loading settings')
    try {
      const result = await chrome.storage.sync.get('toolflowzSettings')
      if (result.toolflowzSettings) {
        settings.value = result.toolflowzSettings
        console.log('[SUCCESS] Settings loaded:', settings.value)
      } else {
        console.log('[INFO] No settings found, using defaults')
      }

      bridgeApi.getInitialState().then((state: any) => {
        if (state?.settings) {
          settings.value = state.settings
          console.log('[SUCCESS] Settings synced with background')
        }
      }).catch(error => {
        console.warn('[WARNING] Background sync error:', error)
      })
    } catch (error) {
      console.error('[ERROR] Failed to load settings:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<ToolflowzSettings>) => {
    console.log('[INFO] Updating settings:', newSettings)
    settings.value = { ...settings.value, ...newSettings }
    
    try {
      await bridgeApi.updateSettings(settings.value)
      console.log('[SUCCESS] Settings update sent to background')
    } catch (error) {
      console.error('[ERROR] Failed to update settings:', error)
    }
  }

  const updatePosition = async (x: number, y: number) => {
    console.log('[INFO] Updating position:', { x, y })
    settings.value.position = { x, y }
    
    try {
      await bridgeApi.updateSettings(settings.value)
      console.log('[SUCCESS] Position update sent to background')
    } catch (error) {
      console.error('[ERROR] Failed to update position:', error)
    }
  }

  initBridgeListeners({
    onSettingsUpdate: (newSettings) => {
      if (newSettings) {
        settings.value = newSettings
        console.log('[SUCCESS] Settings updated from another instance')
      }
    }
  })

  return {
    settings,
    loadSettings,
    updateSettings,
    updatePosition
  }
}) 