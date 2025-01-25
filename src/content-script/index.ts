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
    console.log('✅ ID de l\'onglet initialisé:', currentTabId)
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'ID de l\'onglet:', error)
  }
}

// Attendre que l'extension soit complètement chargée
document.addEventListener('DOMContentLoaded', () => {
  initializeTabId()
})

// Gestion des messages entre l'iframe et le content script
onMessage('IFRAME_READY', async ({ data }) => {
  console.log('🔄 Iframe prête à recevoir des messages')
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
    console.error('❌ Erreur lors de la récupération de l\'état initial:', error)
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
    console.error('❌ Erreur lors de la synchronisation des changements:', error)
  }
})

// Gestion des erreurs globale
self.onerror = function (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
  console.error('❌ Erreur dans le content script:', {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  })
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('❌ Promesse rejetée non gérée dans le content script:', {
    reason: event.reason,
    promise: event.promise
  })
}

console.log('✅ Content script chargé')

export {}

