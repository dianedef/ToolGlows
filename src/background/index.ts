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

console.log('🚀 Background script démarré', { globalState })

// Keep alive pour Chrome
if (typeof chrome !== 'undefined' && chrome.runtime?.onConnect) {
  chrome.runtime.onConnect.addListener(port => {
    console.log('🔌 Nouvelle connexion établie:', port.name)
  })
}

// Installation listener
chrome.runtime.onInstalled.addListener(async (opt) => {
  console.log('📦 Extension installée/mise à jour:', opt.reason)
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
    console.error('❌ Erreur lors de l\'installation/mise à jour:', error)
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
          console.warn(`⚠️ Impossible d'envoyer le message à l'onglet ${tab.id}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du broadcast:', error)
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
    console.error('❌ Erreur lors de la mise à jour des paramètres:', error)
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
    console.error('❌ Erreur lors de la mise à jour des outils:', error)
  }
})

onMessage('GET_INITIAL_STATE', async () => {
  try {
    return {
      settings: globalState.settings,
      activeTools: globalState.activeTools
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'état initial:', error)
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
  console.error('❌ Erreur globale:', errorDetails)
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('❌ Promesse rejetée non gérée:', {
    reason: event.reason,
    promise: event.promise
  })
}

export {}
