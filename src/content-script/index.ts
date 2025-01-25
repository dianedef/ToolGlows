// Import des styles
import "./index.scss"
import { createApp, h, defineComponent, provide } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToolflowzBar from '../components/ToolflowzBar.vue'
import { setupPrimeVue } from '../utils/setupPrimeVue'
import { injectStyles, injectStylesheet } from '../utils/styleInjection'
import mainStyles from '@/assets/main.css?inline'
import contentStyles from '@/content-script/index.scss?inline'

// Import des stores
import { useSettingsStore } from '../stores/settings'
import { useToolflowzStore } from '../stores/toolflowz'
import { useInstantOCRStore } from '../stores/instantOCR'
import { useWordCounterStore } from '../stores/wordCounter'
import { useQuickActionsStore } from '../stores/quickActions'

// Types
interface StorageData {
  toolflowzSettings?: Record<string, any>
  toolflowzActiveTools?: string[]
}

let app: ReturnType<typeof createApp> | null = null

// Création de l'élément racine pour l'app Vue
function createRootElement() {
  const rootId = 'toolflowz-root'
  let rootElement = document.getElementById(rootId)
  
  if (!rootElement) {
    rootElement = document.createElement('div')
    rootElement.id = rootId
    document.body.appendChild(rootElement)
  }
  
  return rootElement
}

// Initialisation de Vue
async function initVueApp() {
  try {
    // Création de Pinia
    const pinia = createPinia()
    setActivePinia(pinia)

    // Création des stores
    const stores = {
      settings: useSettingsStore(),
      toolflowz: useToolflowzStore(),
      ocr: useInstantOCRStore(),
      wordCounter: useWordCounterStore(),
      quickActions: useQuickActionsStore()
    }

    // Composant racine
    const RootComponent = defineComponent({
      name: 'RootComponent',
      setup() {
        // Injection des stores
        Object.entries(stores).forEach(([key, store]) => {
          provide(key + 'Store', store)
        })
        return {}
      },
      render() {
        return h(ToolflowzBar)
      }
    })

    // Création de l'application
    app = createApp(RootComponent)

    // Configuration de l'application
    app.use(pinia)
    app.use(PrimeVue, {
      ripple: true,
      inputStyle: 'filled',
      pt: {
        button: {
          root: { class: 'shadow-none' }
        }
      }
    })

    // Configuration des composants PrimeVue
    setupPrimeVue(app)

    // Injection des styles
    await Promise.all([
      injectStylesheet('https://cdn.jsdelivr.net/npm/primevue@3.49.1/resources/themes/lara-light-blue/theme.min.css', 'toolflowz-primevue-theme'),
      injectStylesheet('https://cdn.jsdelivr.net/npm/primevue@3.49.1/resources/primevue.min.css', 'toolflowz-primevue-core'),
      injectStylesheet('https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css', 'toolflowz-prime-icons')
    ]).catch(error => {
      console.error('[ERROR] External styles loading error:', error)
    })

    // Injection des styles locaux
    injectStyles(mainStyles, 'toolflowz-main-styles')
    injectStyles(contentStyles, 'toolflowz-content-styles')

    // Montage de l'application
    const rootElement = createRootElement()
    app.mount(rootElement)
    
    console.log('[SUCCESS] Vue application mounted in page')
  } catch (error) {
    console.error('[ERROR] Failed to initialize Vue app:', error)
    cleanup()
  }
}

function cleanup() {
  if (app) {
    app.unmount()
    app = null
  }
  const rootElement = document.getElementById('toolflowz-root')
  if (rootElement) {
    rootElement.remove()
  }
}

// Initialisation sécurisée
function init() {
  try {
    initVueApp()
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

