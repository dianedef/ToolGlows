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

console.log('[INFO] Background script started', { globalState })

// Keep alive pour Chrome
if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener(port => {
    console.log('[INFO] New connection established:', port.name)
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
  try {
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id && tab.id !== sourceTabId) {
        try {
          await sendMessage(type, data, { context: 'content-script', tabId: tab.id })
        } catch (error) {
          console.warn(`[WARNING] Could not send message to tab ${tab.id}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('[ERROR] Broadcast error:', error)
  }
}

// Gestionnaire de messages
onMessage('SETTINGS_UPDATED', async ({ data, sender }) => {
  try {
    const messageData = data as MessageData
    if (!messageData?.settings) return
    
    const sourceTabId = sender.tabId
    globalState.settings = messageData.settings
    
    // Sauvegarder dans le storage
    const storageData: StorageData = { toolflowzSettings: messageData.settings }
    await chrome.storage.sync.set(storageData)
    
    // Broadcast aux autres onglets
    await broadcastToOtherTabs('SETTINGS_SYNC', { settings: messageData.settings }, sourceTabId)
  } catch (error) {
    console.error('[ERROR] Settings update error:', error)
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
  try {
    return {
      settings: globalState.settings,
      activeTools: globalState.activeTools
    }
  } catch (error) {
    console.error('[ERROR] Failed to get initial state:', error)
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
  console.error('[ERROR] Global error:', errorDetails)
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('[ERROR] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  })
}

export {}
