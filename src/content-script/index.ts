// Import des styles pour l'iframe
import "./index.scss"
import { onMessage, sendMessage } from 'webext-bridge/content-script'

// Types
interface StorageData {
  toolflowzSettings?: Record<string, any>
  toolflowzActiveTools?: string[]
}

// Création et injection de l'iframe
const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html")
const iframe = new DOMParser().parseFromString(
  `<iframe class="crx-iframe" src="${src}"></iframe>`,
  "text/html",
).body.firstElementChild

if (iframe) {
  document.body?.append(iframe)
}

// État local du content script
let isIframeReady = false
let currentTabId: number | undefined

// Initialisation sécurisée de l'ID de l'onglet
async function initializeTabId() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTabId = tabs[0]?.id
    console.log('[SUCCESS] Tab ID initialized:', currentTabId)
  } catch (error) {
    console.error('[ERROR] Failed to initialize tab ID:', error)
  }
}

// Attendre que l'extension soit complètement chargée
document.addEventListener('DOMContentLoaded', () => {
  initializeTabId()
})

// Gestion des messages entre l'iframe et le content script
onMessage('IFRAME_READY', async ({ data }) => {
  console.log('[INFO] Iframe ready to receive messages')
  isIframeReady = true

  // Récupérer l'état initial depuis le storage
  try {
    const storage = await chrome.storage.sync.get(['toolflowzSettings', 'toolflowzActiveTools']) as StorageData
    if (storage && currentTabId) {
      // Envoyer l'état initial à l'iframe
      await sendMessage('INITIAL_STATE', { 
        settings: storage.toolflowzSettings,
        activeTools: storage.toolflowzActiveTools
      }, { context: 'content-script', tabId: currentTabId })
    }
  } catch (error) {
    console.error('[ERROR] Failed to get initial state:', error)
  }
})

// Écouter les changements de storage pour les synchroniser avec l'iframe
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (!isIframeReady || !currentTabId) return

  const relevantChanges = {
    settings: changes.toolflowzSettings?.newValue as Record<string, any> | undefined,
    activeTools: changes.toolflowzActiveTools?.newValue as string[] | undefined
  }

  try {
    // Envoyer les changements à l'iframe
    await sendMessage('STORAGE_UPDATED', relevantChanges, { context: 'content-script', tabId: currentTabId })
  } catch (error) {
    console.error('[ERROR] Failed to sync changes:', error)
  }
})

// Gestion des erreurs globale
self.onerror = function (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
  console.error('[ERROR] Content script error:', {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  })
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('[ERROR] Unhandled promise rejection in content script:', {
    reason: event.reason,
    promise: event.promise
  })
}

console.log('[SUCCESS] Content script loaded')

export {}

