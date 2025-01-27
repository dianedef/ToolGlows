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

// État global géré par le background script
let globalState = {
  settings: null as Settings | null
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
  try {
    const messageData = data as MessageData
    if (!messageData?.settings) return

    const sourceTabId = sender.tabId
    
    // Validation des données
    const settings = messageData.settings
    if (!Array.isArray(settings.activeTools)) {
      settings.activeTools = Object.values(settings.activeTools || {})
    }
    
    globalState.settings = settings

    // Sauvegarder dans le storage
    await chrome.storage.sync.set({ 
      toolflowzSettings: settings 
    })

    // Broadcast aux autres onglets
    await broadcastToOtherTabs('SETTINGS_SYNC', { 
      settings: settings 
    }, sourceTabId)
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

// Gestionnaire pour le mode sombre
onMessage('APPLY_DARK_MODE', async ({ data, sender }) => {
  console.log('[BACKGROUND] 🌓 Relaying dark mode update to content script')
  
  // Obtenir l'onglet actif
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const activeTab = tabs[0]
  
  if (activeTab?.id) {
    try {
      // Injecter les styles via l'API chrome.scripting
      if (data.isActive) {
        await chrome.scripting.insertCSS({
          target: { tabId: activeTab.id },
          css: data.styles
        })
      } else {
        // Supprimer les styles si le mode sombre est désactivé
        await chrome.scripting.removeCSS({
          target: { tabId: activeTab.id },
          css: data.styles
        })
      }
      console.log('[BACKGROUND] ✨ Dark mode styles updated successfully')
    } catch (error) {
      console.error('[BACKGROUND] ❌ Failed to update dark mode styles:', error)
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
