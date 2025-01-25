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

interface Settings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
}

interface MessageData {
  [key: string]: any
  settings?: Settings
  tools?: string[]
}

interface StorageData {
  [key: string]: any
  toolflowzSettings?: Settings
  toolflowzActiveTools?: string[]
}

// État global géré par le background script
let globalState = {
  settings: null as Settings | null,
  activeTools: [] as string[]
}

console.log('[BACKGROUND] 🚀 Background script started', { globalState })

// Keep alive pour Chrome
if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener(port => {
    console.log('[BACKGROUND] 🔌 New connection established:', port.name)
  })
}

// Installation listener
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

// Fonction utilitaire pour broadcaster aux autres onglets
const broadcastToOtherTabs = async (type: string, data: MessageData, sourceTabId?: number) => {
  console.log(`[BACKGROUND] 📢 Broadcasting ${type} to other tabs, source:`, sourceTabId)
  try {
    // Récupère tous les onglets actifs
    const tabs = await chrome.tabs.query({ status: 'complete' })
    console.log('[BACKGROUND] 📋 Found active tabs:', tabs.length)

    // Broadcast en parallèle à tous les onglets
    const promises = tabs
      .filter(tab => tab.id && tab.id !== sourceTabId)
      .map(async tab => {
        if (!tab.id) return

        try {
          console.log(`[BACKGROUND] 📤 Sending to tab ${tab.id}`)
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

// Gestionnaire de messages
onMessage('SETTINGS_UPDATED', async ({ data, sender }) => {
  console.log('[BACKGROUND] 📥 Received SETTINGS_UPDATED', { data, sender })
  try {
    const messageData = data as MessageData
    if (!messageData?.settings) {
      console.warn('[BACKGROUND] ⚠️ No settings in message data')
      return { success: false, error: 'No settings in message data' }
    }
    
    const sourceTabId = sender.tabId
    
    // 1. Met à jour l'état global
    globalState.settings = messageData.settings
    console.log('[BACKGROUND] 💾 Updated global state:', globalState)
    
    // 2. Sauvegarde dans le storage
    const storageData: StorageData = { toolflowzSettings: messageData.settings }
    await chrome.storage.sync.set(storageData)
    console.log('[BACKGROUND] 💾 Saved to storage:', storageData)
    
    // 3. Broadcast aux autres onglets
    await broadcastToOtherTabs('SETTINGS_SYNC', { settings: messageData.settings }, sourceTabId)
    console.log('[BACKGROUND] ✅ Settings update complete')
    
    // 4. Retourne une confirmation au sender
    return { success: true }
  } catch (error) {
    console.error('[BACKGROUND] ❌ Settings update error:', error)
    return { success: false, error: error.message }
  }
})

onMessage('TOOLS_UPDATED', async ({ data, sender }) => {
  try {
    const messageData = data as MessageData
    if (!messageData?.tools) return
    
    const sourceTabId = sender.tabId
    globalState.activeTools = messageData.tools
    
    // Sauvegarder dans le storage
    const storageData: StorageData = { toolflowzActiveTools: messageData.tools }
    await chrome.storage.sync.set(storageData)
    
    // Broadcast aux autres onglets
    await broadcastToOtherTabs('TOOLS_SYNC', { tools: messageData.tools }, sourceTabId)
  } catch (error) {
    console.error('[ERROR] Tools update error:', error)
  }
})

onMessage('GET_INITIAL_STATE', async () => {
  console.log('[BACKGROUND] 📥 Received GET_INITIAL_STATE request')
  try {
    const response = {
      settings: globalState.settings,
      activeTools: globalState.activeTools
    }
    console.log('[BACKGROUND] 📤 Sending initial state:', response)
    return response
  } catch (error) {
    console.error('[BACKGROUND] ❌ Failed to get initial state:', error)
    return {
      settings: null,
      activeTools: []
    }
  }
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
