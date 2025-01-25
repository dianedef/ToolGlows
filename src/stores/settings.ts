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
  console.log('📦 Création du store settings')

  if (!chrome?.storage?.sync) {
    console.error('❌ L\'API chrome.storage.sync n\'est pas disponible dans le store settings')
    throw new Error('L\'API chrome.storage.sync n\'est pas disponible')
  }

  const settings = ref<ToolflowzSettings>({
    expanded: false,
    position: { x: 20, y: 20 },
    activeTools: [],
    isPinned: false
  })

  const loadSettings = async () => {
    console.log('📥 Chargement des paramètres')
    try {
      // Charger d'abord depuis le stockage local
      const result = await chrome.storage.sync.get('toolflowzSettings')
      if (result.toolflowzSettings) {
        settings.value = result.toolflowzSettings
        console.log('✅ Paramètres chargés:', settings.value)
      } else {
        console.log('ℹ️ Aucun paramètre trouvé, utilisation des valeurs par défaut')
      }

      // Puis synchroniser avec le background de manière non bloquante
      bridgeApi.getInitialState().then((state: any) => {
        if (state?.settings) {
          settings.value = state.settings
          console.log('✅ Paramètres synchronisés avec le background')
        }
      }).catch(error => {
        console.warn('⚠️ Erreur de synchronisation avec le background:', error)
      })
    } catch (error) {
      console.error('❌ Erreur lors du chargement des paramètres:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<ToolflowzSettings>) => {
    console.log('💾 Mise à jour des paramètres:', newSettings)
    settings.value = { ...settings.value, ...newSettings }
    try {
      // Sauvegarder localement
      await chrome.storage.sync.set({ toolflowzSettings: settings.value })
      console.log('✅ Paramètres sauvegardés localement')

      // Notifier le background de manière non bloquante
      bridgeApi.updateSettings(settings.value).catch(error => {
        console.warn('⚠️ Erreur de synchronisation avec le background:', error)
      })
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres:', error)
    }
  }

  const updatePosition = async (x: number, y: number) => {
    console.log('📍 Mise à jour de la position:', { x, y })
    settings.value.position = { x, y }
    try {
      // Sauvegarder localement
      await chrome.storage.sync.set({ toolflowzSettings: settings.value })
      console.log('✅ Position sauvegardée localement')

      // Notifier le background de manière non bloquante
      bridgeApi.updateSettings(settings.value).catch(error => {
        console.warn('⚠️ Erreur de synchronisation avec le background:', error)
      })
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la position:', error)
    }
  }

  // Écouter les mises à jour des autres instances
  initBridgeListeners({
    onSettingsUpdate: (newSettings) => {
      if (newSettings) {
        settings.value = newSettings
        console.log('✅ Paramètres mis à jour depuis une autre instance')
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