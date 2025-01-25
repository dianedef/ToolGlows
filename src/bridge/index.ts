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

// Type pour assurer la compatibilité JSON
type JsonCompatible<T> = {
  [P in keyof T]: T[P] extends object ? JsonCompatible<T[P]> : T[P]
} & { [key: string]: any }

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

// Pour les tools, même approche
interface SerializableTool extends JsonCompatible<Omit<Tool, 'component'>> {}

// Pour la conversion Tool -> SerializableTool
const toolToSerializable = (tool: Tool): SerializableTool => {
  const { component, ...serializablePart } = tool
  return serializablePart
}

// Définir un type pour les données JSON-safe
interface SerializableSettings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
}

// Fonctions pour envoyer des messages au background script
export const bridgeApi = {
  updateSettings: async (settings: Settings) => {
    // Conversion en type compatible JSON
    const jsonSettings: JsonCompatible<Settings> = {
      expanded: settings.expanded,
      position: {
        x: settings.position.x,
        y: settings.position.y
      },
      activeTools: [...settings.activeTools],
      isPinned: settings.isPinned
    }
    await sendMessage('SETTINGS_UPDATED', { settings: jsonSettings }, 'background')
  },
  getInitialState: async () => {
    const response = await sendMessage('GET_INITIAL_STATE', {}, 'background')
    // Vérification et conversion sûre
    if (typeof response === 'object' && response !== null) {
      const settings = (response as any).settings
      if (settings && 
          typeof settings.expanded === 'boolean' &&
          typeof settings.position?.x === 'number' &&
          typeof settings.position?.y === 'number' &&
          Array.isArray(settings.activeTools) &&
          typeof settings.isPinned === 'boolean') {
        return { 
          settings: {
            expanded: settings.expanded,
            position: {
              x: settings.position.x,
              y: settings.position.y
            },
            activeTools: settings.activeTools,
            isPinned: settings.isPinned
          } as Settings 
        }
      }
    }
    throw new Error('Invalid response format')
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
        // Conversion sûre
        const tools = messageData.tools.map(toolData => ({
          ...toolData,
          component: null // ou une valeur par défaut appropriée
        })) as unknown as Tool[]
        callbacks.onToolsUpdate?.(tools)
      }
    })

    console.log('[BRIDGE] ✅ Bridge listeners initialized successfully')
  } catch (error) {
    console.error('[BRIDGE] ❌ Failed to initialize bridge listeners:', error)
    throw error
  }
} 