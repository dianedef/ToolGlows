// Import des styles pour l'iframe
import "./index.scss"
import { onMessage, sendMessage } from 'webext-bridge/content-script'

// Types
interface StorageData {
  toolflowzSettings?: Record<string, any>
  toolflowzActiveTools?: string[]
}

let iframe: Element | null = null
let isIframeReady = false

function createIframe() {
  if (iframe) return
  
  const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html")
  iframe = new DOMParser().parseFromString(
    `<iframe class="crx-iframe" src="${src}"></iframe>`,
    "text/html"
  ).body.firstElementChild

  if (iframe) {
    document.body?.append(iframe)
  }
}

function cleanup() {
  if (iframe && iframe.parentNode) {
    iframe.parentNode.removeChild(iframe)
    iframe = null
  }
  isIframeReady = false
}

// Initialisation sécurisée
function init() {
  try {
    createIframe()
  } catch (error) {
    console.error("[ERROR] Failed to initialize content script:", error)
    cleanup()
  }
}

// Gestion des erreurs
self.onerror = function (message, source, lineno, colno, error) {
  console.error("[ERROR] Content script error:", {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  })
  
  // Si l'erreur est liée à l'extension invalidée, on nettoie
  if (error && error.message.includes("Extension context invalidated")) {
    cleanup()
  }
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error("[ERROR] Unhandled promise rejection in content script:", {
    reason: event.reason,
    promise: event.promise
  })
}

// Écoute des messages de l'iframe
onMessage("IFRAME_READY", async () => {
  console.info("[INFO] Iframe ready to receive messages")
  isIframeReady = true
})

// Initialisation quand le DOM est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

// Nettoyage lors du déchargement de la page
window.addEventListener("unload", cleanup)

console.info("[INFO] Content script loaded successfully")

export {}

