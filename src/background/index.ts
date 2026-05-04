/**
 * Background Script - Extension Service Worker
 * 
 * This is the persistent background service worker that manages:
 * - Cross-tab communication and settings synchronization
 * - Extension lifecycle events (install/update)
 * - Dark mode CSS injection across all tabs
 * - Global state management for the extension
 * 
 * Architecture Note: Uses webext-bridge for type-safe message passing
 * between background, content scripts, and popup contexts.
 */

// Sample code if using extensionpay.com
// import { extPay } from '@/utils/payment/extPay'
// extPay.startBackground()
import { onMessage, sendMessage } from 'webext-bridge/background'

interface ErrorDetails {
  message: string
  source?: string
  lineno?: number
  colno?: number
  error?: Error
}

/**
 * Settings structure that defines the toolbar state and appearance
 * These settings are synchronized across all tabs via chrome.storage.sync
 */
interface Settings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
  toolbarColor?: string
  toolbarSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

interface MessageData {
  [key: string]: any
  settings?: Settings
  tools?: string[]
}

interface DarkModePayload {
  isActive: boolean
  styles: string
}

function isDarkModePayload(data: unknown): data is DarkModePayload {
  return typeof data === 'object' &&
    data !== null &&
    'isActive' in data &&
    'styles' in data &&
    typeof (data as DarkModePayload).isActive === 'boolean' &&
    typeof (data as DarkModePayload).styles === 'string'
}

/**
 * Global state maintained by the background script
 * This serves as a source of truth that survives individual tab closures
 */
const globalState = {
  settings: null as Settings | null
}

console.log('[BACKGROUND] 🚀 Background script started', { globalState })

/**
 * Chrome Keep-Alive Mechanism
 * 
 * In Manifest V3, service workers can be terminated after 30 seconds of inactivity.
 * This listener keeps the background script alive by maintaining port connections.
 * Critical for extensions that need to maintain state or respond quickly to events.
 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener(port => {
    console.log('[BACKGROUND] 🔌 New connection established:', port.name)
  })
}

/**
 * Extension Lifecycle Event Handler
 * 
 * Handles onboarding and update flows:
 * - On first install: Clears any stale data and shows welcome page
 * - On update: Shows changelog/update notes to user
 * 
 * Why clear storage on install: Ensures clean state if extension was
 * previously installed, avoiding conflicts from old data structures.
 */
chrome.runtime.onInstalled.addListener(async (opt) => {
  console.log('[INFO] Extension installed/updated:', opt.reason)
  try {
    if (opt.reason === "install") {
      await chrome.storage.local.clear()

      chrome.tabs.create({
        active: true,
        url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/install"),
      })
    }

    if (opt.reason === "update") {
      chrome.tabs.create({
        active: true,
        url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/update"),
      })
    }
  } catch (error) {
    console.error('[ERROR] Installation/update error:', error)
  }
})

/**
 * Cross-Tab Settings Synchronization
 * 
 * Broadcasts settings changes to all open tabs except the source tab.
 * This ensures that when a user changes settings in one tab, all other
 * tabs with the extension toolbar immediately reflect those changes.
 * 
 * @param type - Message type identifier for webext-bridge routing
 * @param data - Payload containing settings or tools data
 * @param sourceTabId - Tab that initiated the change (excluded from broadcast)
 * 
 * Design decisions:
 * - Uses Promise.allSettled to avoid one tab failure blocking others
 * - Filters out chrome:// and extension:// URLs (handled by query pattern)
 * - Parallel execution for better performance across many tabs
 */
const broadcastToOtherTabs = async (type: string, data: MessageData, sourceTabId?: number) => {
  console.log(`[BACKGROUND] 📢 Broadcasting ${type} to other tabs, source:`, sourceTabId)
  try {
    // Query only http(s) URLs where content scripts can run
    const tabs = await chrome.tabs.query({
      url: [
        "http://*/*",
        "https://*/*"
      ]
    })
    console.log('[BACKGROUND] 📋 Found active tabs:', tabs.length)

    // Send messages in parallel to all tabs except source
    const promises = tabs
      .filter(tab => tab.id && tab.id !== sourceTabId)
      .map(async tab => {
        if (!tab.id) return

        try {
          console.log(`[BACKGROUND] 📤 Sending to tab ${tab.id}:`, data)
          await sendMessage(type, data, { context: 'content-script', tabId: tab.id })
          console.log(`[BACKGROUND] ✅ Sent to tab ${tab.id}`)
        } catch (error) {
          console.warn(`[BACKGROUND] ⚠️ Could not send to tab ${tab.id}:`, error)
        }
      })

    await Promise.allSettled(promises)
    console.log('[BACKGROUND] ✅ Broadcast complete')
  } catch (error) {
    console.error('[BACKGROUND] ❌ Broadcast error:', error)
    throw error
  }
}

/**
 * SETTINGS_UPDATED Message Handler
 * 
 * Central handler for settings changes from any content script.
 * Implements the complete settings synchronization flow:
 * 
 * 1. Validates and normalizes incoming settings data
 * 2. Updates background script's in-memory state
 * 3. Persists to chrome.storage.sync (auto-syncs across devices)
 * 4. Broadcasts to all other tabs twice for reliability
 * 
 * Why double broadcast: Content scripts may not be fully initialized
 * when the first broadcast arrives. The delayed second broadcast catches
 * any tabs that were in the process of loading their content scripts.
 */
onMessage('SETTINGS_UPDATED', async ({ data, sender }) => {
  try {
    const messageData = data as MessageData
    if (!messageData?.settings) return

    const sourceTabId = sender.tabId
    
    // Normalize activeTools to array if received as object (compatibility fix)
    const settings = messageData.settings
    if (!Array.isArray(settings.activeTools)) {
      settings.activeTools = Object.values(settings.activeTools || {})
    }
    
    // Update global state for immediate availability
    globalState.settings = settings

    // Persist to sync storage (survives browser restarts, syncs across devices)
    await chrome.storage.sync.set({ 
      toolflowzSettings: settings 
    })

    console.log('[BACKGROUND] 💾 Settings saved:', settings)

    // Immediate broadcast to responsive tabs
    await broadcastToOtherTabs('SETTINGS_SYNC', { 
      settings: settings 
    }, sourceTabId)

    // Delayed broadcast to catch tabs that were loading
    setTimeout(async () => {
      await broadcastToOtherTabs('SETTINGS_SYNC', { 
        settings: settings 
      }, sourceTabId)
    }, 500)
  } catch (error) {
    console.error('[ERROR] Settings update error:', error)
  }
})

onMessage('TOOLS_UPDATED', async ({ data, sender }) => {
  try {
    const messageData = data as MessageData
    if (!messageData?.tools) return
    
    const sourceTabId = sender.tabId
    
    // Récupérer les settings actuels
    const result = await chrome.storage.sync.get('toolflowzSettings')
    const currentSettings = result.toolflowzSettings || {}
    
    // S'assurer que tools est un tableau
    const tools = Array.isArray(messageData.tools) ? 
      messageData.tools : 
      Object.values(messageData.tools)
    
    // Mettre à jour uniquement activeTools
    const updatedSettings = {
      ...currentSettings,
      activeTools: tools
    }
    
    // Sauvegarder les settings complets
    await chrome.storage.sync.set({ 
      toolflowzSettings: updatedSettings 
    })
    
    // Broadcast aux autres onglets
    await broadcastToOtherTabs('SETTINGS_SYNC', { 
      settings: updatedSettings 
    }, sourceTabId)
  } catch (error) {
    console.error('[ERROR] Tools update error:', error)
  }
})

onMessage('GET_INITIAL_STATE', async () => {
  try {
    // Récupérer l'état depuis le storage
    const result = await chrome.storage.sync.get('toolflowzSettings')
    return { settings: result.toolflowzSettings }
  } catch (error) {
    console.error('[ERROR] Failed to get initial state:', error)
    return { settings: null }
  }
})

async function broadcastDarkModeUpdate(data: unknown) {
  if (!isDarkModePayload(data)) {
    console.warn('[BACKGROUND] Invalid dark mode payload:', data)
    return
  }

  console.log('[BACKGROUND] 🌓 Broadcasting dark mode update to content scripts')
  const payload = {
    isActive: data.isActive,
    styles: data.styles
  }

  try {
    const tabs = await chrome.tabs.query({
      url: [
        "http://*/*",
        "https://*/*"
      ]
    })

    await Promise.allSettled(tabs.map(async tab => {
      if (tab.id) {
        try {
          await sendMessage('DARK_MODE_UPDATE', payload, { context: 'content-script', tabId: tab.id })
        } catch (error) {
          console.warn(`[BACKGROUND] ⚠️ Could not update dark mode in tab ${tab.id}:`, error)
        }
      }
    }))
  } catch (error) {
    console.error('[BACKGROUND] ❌ Failed to query tabs:', error)
  }
}

// Gestionnaire historique conserve pour compatibilite avec les anciens appelants.
onMessage('APPLY_DARK_MODE', async ({ data }) => {
  await broadcastDarkModeUpdate(data)
})

// Gestionnaire pour l'injection du mode sombre via content scripts.
onMessage('INJECT_DARK_MODE', async ({ data }) => {
  await broadcastDarkModeUpdate(data)
})

// Gestion des erreurs globale
self.onerror = function (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
  const errorDetails: ErrorDetails = {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  }
  console.error('[BACKGROUND] ❌ Global error:', errorDetails)
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('[BACKGROUND] ❌ Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  })
}

export {}
