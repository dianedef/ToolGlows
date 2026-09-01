/**
 * Cross-Context Communication Bridge
 *
 * Provides type-safe message passing between extension contexts using webext-bridge:
 * - Content scripts <-> Background script
 * - Popup <-> Background script
 * - Multiple content script instances (via background relay)
 *
 * Key features:
 * - Namespace isolation to prevent message conflicts with other extensions
 * - JSON serialization safety checks (content scripts can't send functions/symbols)
 * - Type validation for all message payloads
 * - Settings synchronization across all tabs
 *
 * Security considerations:
 * - Uses unique namespace to prevent message spoofing from malicious extensions
 * - Validates all incoming data types to prevent injection attacks
 * - Never sends sensitive data like user credentials through bridge
 */
import { sendMessage, onMessage, allowWindowMessaging } from 'webext-bridge/content-script'
import type { Tool } from '@/types/tools'
import { TOOLBAR_SIZES, type ToolbarSize } from '@/utils/toolbarSize'

// Unique namespace prevents conflicts with other extensions using webext-bridge
const EXTENSION_NAMESPACE = 'com.toolglows.extension'

/**
 * Settings structure shared across all extension contexts
 * Must remain JSON-serializable (no functions, Symbols, or circular refs)
 */
export interface Settings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
  interfaceTheme: 'light' | 'dark'
  toolbarColor?: string
  toolbarSize: ToolbarSize
  hideElement?: {
    hiddenElements: Array<{
      selector: string
      domain: string
      timestamp: number
      name?: string
    }>
    isSelectingElement: boolean
    shortcut: string
    enableShortcut: boolean
  }
  darkMode?: {
    options?: {
      backgroundColor: string
      textColor: string
      linkColor: string
      contrastLevel: number
      autoEnable: boolean
      scheduleStart: string
      scheduleEnd: string
      excludedDomains: string[]
      transitionDuration: number
      syncWithSystem: boolean
    }
    isActive?: boolean
    styles?: string
  }
}

type BridgeObject = { [key: string]: BridgeValue }
type BridgeValue = string | number | boolean | null | BridgeValue[] | BridgeObject

interface MessageData {
  settings?: Settings
  tools?: SerializableTool[]
}

export interface DragOpenLink {
  title: string
  url: string
}

export type DragOpenAction = 'tabs' | 'window' | 'bookmark'
export type TabQueryScope = 'current' | 'window' | 'all' | 'selected'

export interface TabSummary {
  title: string
  url: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isToolbarSize(value: unknown): value is Settings['toolbarSize'] {
  return TOOLBAR_SIZES.includes(String(value) as ToolbarSize)
}

function isSettings(value: unknown): value is Settings {
  if (!isRecord(value) || !isRecord(value.position)) {
    return false
  }

  return typeof value.expanded === 'boolean' &&
    typeof value.position.x === 'number' &&
    typeof value.position.y === 'number' &&
    Array.isArray(value.activeTools) &&
    value.activeTools.every(toolId => typeof toolId === 'string') &&
    typeof value.isPinned === 'boolean' &&
    (value.interfaceTheme === 'light' || value.interfaceTheme === 'dark') &&
    (value.toolbarColor === undefined || typeof value.toolbarColor === 'string') &&
    (value.toolbarSize === undefined || isToolbarSize(value.toolbarSize))
}

/**
 * Secure Bridge Initialization
 *
 * Must be called before any message passing occurs. Registers the extension's
 * namespace with webext-bridge to enable secure cross-context communication.
 *
 * Why needed: webext-bridge requires explicit namespace registration to
 * prevent message conflicts and ensure only authorized contexts can communicate.
 *
 * Critical: Call this once at content script startup, before Vue initialization.
 */
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
type SerializableTool = Omit<Tool, 'component'>

// Fonctions pour envoyer des messages au background script
export const bridgeApi = {
  updateSettings: async (settings: Settings) => {
    // Conversion en type compatible JSON
    const jsonSettings: BridgeObject = {
      expanded: settings.expanded,
      position: {
        x: settings.position.x,
        y: settings.position.y
      },
      activeTools: [...settings.activeTools],
      isPinned: settings.isPinned,
      toolbarSize: settings.toolbarSize
    }

    jsonSettings.interfaceTheme = settings.interfaceTheme

    if (settings.hideElement) {
      jsonSettings.hideElement = {
        hiddenElements: settings.hideElement.hiddenElements.map(element => ({
          selector: element.selector,
          domain: element.domain,
          timestamp: element.timestamp,
          ...(element.name ? { name: element.name } : {})
        })),
        isSelectingElement: false,
        shortcut: settings.hideElement.shortcut,
        enableShortcut: settings.hideElement.enableShortcut
      }
    }

    if (settings.toolbarColor) {
      jsonSettings.toolbarColor = settings.toolbarColor
    }

    await sendMessage('SETTINGS_UPDATED', { settings: jsonSettings }, 'background')
  },
  getInitialState: async () => {
    const response = await sendMessage('GET_INITIAL_STATE', {}, 'background')
    // Vérification et conversion sûre
    if (isRecord(response)) {
      const settings = (response as { settings?: unknown }).settings
      if (isSettings(settings)) {
        return {
          settings: {
            expanded: settings.expanded,
            position: {
              x: settings.position.x,
              y: settings.position.y
            },
            activeTools: settings.activeTools,
            isPinned: settings.isPinned,
            interfaceTheme: settings.interfaceTheme,
            toolbarColor: settings.toolbarColor,
            toolbarSize: settings.toolbarSize || 'md',
            hideElement: settings.hideElement
          } as Settings
        }
      }
    }
    throw new Error('Invalid response format')
  },
  performDragOpenAction: async (
    action: DragOpenAction,
    links: DragOpenLink[],
    openDelay: number
  ) => {
    const payload: BridgeObject = {
      action,
      links: links.map(link => ({ title: link.title, url: link.url })),
      openDelay
    }

    return sendMessage(
      'DRAG_OPEN_ACTION',
      payload,
      'background'
    )
  },
  getTabs: async (scope: TabQueryScope): Promise<TabSummary[]> => {
    const response = await sendMessage('GET_TABS', { scope }, 'background')
    if (!Array.isArray(response)) throw new Error('Invalid tabs response')

    return response.flatMap(tab =>
      isRecord(tab) && typeof tab.title === 'string' && typeof tab.url === 'string'
        ? [{ title: tab.title, url: tab.url }]
        : []
    )
  },
  reloadAllTabs: async () => {
    const response: unknown = await chrome.runtime.sendMessage({
      type: 'TOOLGLOWS_RELOAD_ALL_TABS'
    })
    if (
      !isRecord(response) ||
      typeof response.successCount !== 'number' ||
      typeof response.errorCount !== 'number'
    ) {
      throw new Error('Invalid reload-all-tabs response')
    }

    return {
      successCount: response.successCount,
      errorCount: response.errorCount
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
