import { sendMessage, onMessage, allowWindowMessaging } from 'webext-bridge/content-script'
import type { Tool } from '@/types/tools'

// Namespace unique pour notre extension
const EXTENSION_NAMESPACE = 'com.toolflowz.extension'

// Types pour la communication
interface Settings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
}

interface MessageData {
  settings?: Settings
  tools?: SerializableTool[]
}

// Configuration sécurisée du bridge
export const setupSecureBridge = () => {
  console.log('[BRIDGE] 🔒 Setting up secure bridge with namespace:', EXTENSION_NAMESPACE)
  try {
    allowWindowMessaging(EXTENSION_NAMESPACE)
    console.log('[BRIDGE] ✅ Secure bridge setup complete')
  } catch (error) {
    console.error('[BRIDGE] ❌ Failed to setup secure bridge:', error)
    throw error
  }
}

// Type pour les données sérialisables d'un outil
type SerializableTool = Omit<Tool, 'component'>

// Fonctions pour envoyer des messages au background script
export const bridgeApi = {
  async updateSettings(settings: Settings) {
    console.log('[BRIDGE] 📤 Sending settings update:', settings)
    try {
      const response = await sendMessage('SETTINGS_UPDATED', { settings } as MessageData, 'background')
      console.log('[BRIDGE] ✅ Settings update sent successfully, response:', response)
      return response
    } catch (error) {
      console.error('[BRIDGE] ❌ Failed to send settings update:', error)
      throw error
    }
  },

  async updateTools(tools: Tool[]) {
    console.log('[BRIDGE] 📤 Sending tools update')
    const serializedTools: SerializableTool[] = tools.map(({ component, ...rest }) => rest)
    try {
      const response = await sendMessage('TOOLS_UPDATED', { tools: serializedTools } as MessageData, 'background')
      console.log('[BRIDGE] ✅ Tools update sent successfully')
      return response
    } catch (error) {
      console.error('[BRIDGE] ❌ Failed to send tools update:', error)
      throw error
    }
  },

  async getInitialState() {
    console.log('[BRIDGE] 📥 Requesting initial state')
    try {
      const response = await sendMessage('GET_INITIAL_STATE', {} as MessageData, 'background')
      console.log('[BRIDGE] ✅ Got initial state:', response)
      return response
    } catch (error) {
      console.error('[BRIDGE] ❌ Failed to get initial state:', error)
      throw error
    }
  }
}

// Écouteurs pour les mises à jour depuis le background
export const initBridgeListeners = (callbacks: {
  onSettingsUpdate?: (settings: Settings) => void
  onToolsUpdate?: (tools: Tool[]) => void
}) => {
  console.log('[BRIDGE] 👂 Initializing bridge listeners')
  
  try {
    // Écoute des mises à jour de settings
    onMessage('SETTINGS_SYNC', ({ data, sender }) => {
      console.log('[BRIDGE] 📥 Received settings sync:', data, 'from:', sender)
      const messageData = data as MessageData
      if (messageData?.settings) {
        console.log('[BRIDGE] ✨ Triggering settings update callback')
        callbacks.onSettingsUpdate?.(messageData.settings)
      }
    })

    // Écoute des mises à jour d'outils
    onMessage('TOOLS_SYNC', ({ data, sender }) => {
      console.log('[BRIDGE] 📥 Received tools sync:', data, 'from:', sender)
      const messageData = data as MessageData
      if (messageData?.tools) {
        console.log('[BRIDGE] ✨ Triggering tools update callback')
        const tools = messageData.tools.map(tool => ({
          ...tool,
          component: undefined
        })) as Tool[]
        callbacks.onToolsUpdate?.(tools)
      }
    })

    console.log('[BRIDGE] ✅ Bridge listeners initialized successfully')
  } catch (error) {
    console.error('[BRIDGE] ❌ Failed to initialize bridge listeners:', error)
    throw error
  }
} 