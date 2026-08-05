/**
 * Content Script - Main Entry Point
 *
 * This script runs in every web page and injects the ToolGlows toolbar UI.
 * It operates in an isolated context separate from the page's JavaScript
 * but shares the same DOM, allowing safe UI injection without page interference.
 *
 * Architecture:
 * - Creates a complete Vue 3 app instance with Pinia stores
 * - Injects PrimeVue UI framework and required stylesheets
 * - Establishes webext-bridge communication with background script
 * - Handles graceful cleanup on page unload and context invalidation
 *
 * Key challenges solved:
 * - CSS isolation: Uses scoped styles to prevent page CSS conflicts
 * - Bridge initialization order: Must setup bridge before Vue to enable messaging
 * - Context invalidation: Cleans up when extension is reloaded
 */

// Import des styles
import "./index.scss"
import { createApp, h, defineComponent, provide } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import primeVueThemeStyles from 'primevue/resources/themes/lara-light-blue/theme.css?inline'
import primeVueCoreStyles from 'primevue/resources/primevue.min.css?inline'
import primeIconsStyles from 'primeicons/primeicons.css?inline'
import ToolGlowsBar from '../components/ToolGlowsBar.vue'
import { setupPrimeVue } from '../utils/setupPrimeVue'
import { injectStyles } from '../utils/styleInjection'
import mainStyles from '@/assets/main.css?inline'
import contentStyles from '@/content-script/index.scss?inline'
import { setupSecureBridge } from '@/bridge'
import './darkMode'

// Import des stores
import { useSettingsStore } from '../stores/settings'
import { useToolGlowsStore } from '../stores/toolglows'
import { useInstantOCRStore } from '../stores/instantOCR'
import { useWordCounterStore } from '../stores/wordCounter'
import { useQuickActionsStore } from '../stores/quickActions'

// Types
interface StorageData {
  toolglowsSettings?: Record<string, any>
  toolglowsActiveTools?: string[]
}

let app: ReturnType<typeof createApp> | null = null
let bridgeInitialized = false

/**
 * Creates Vue App Mount Point in Page DOM
 *
 * Injects a container element for the Vue app at the beginning of <html>.
 * This placement strategy ensures:
 * - Toolbar appears above all page content (z-index control)
 * - Survives even aggressive page DOM manipulations
 * - Doesn't interfere with page's body content
 *
 * Idempotent: Safe to call multiple times, reuses existing element.
 */
function createRootElement() {
  const rootId = 'toolglows-root'
  let rootElement = document.getElementById(rootId)

  if (!rootElement) {
    rootElement = document.createElement('div')
    rootElement.id = rootId
    // Insert as first child of <html> for maximum DOM stability
    const htmlElement = document.documentElement
    htmlElement.insertBefore(rootElement, htmlElement.firstChild)
  }

  return rootElement
}

/**
 * Vue Application Initialization in Content Script Context
 *
 * Sets up a complete Vue 3 application with:
 * - Pinia stores for state management (settings, tools, OCR, etc.)
 * - PrimeVue component library with custom configuration
 * - External CDN stylesheets (with fallback error handling)
 * - Inline styles for extension UI
 *
 * Critical initialization order:
 * 1. Create Pinia and set as active (required for store instantiation)
 * 2. Create all stores (some may depend on each other)
 * 3. Setup root component with store injection
 * 4. Configure PrimeVue with custom theme
 * 5. Load external styles (parallel for performance)
 * 6. Inject inline styles
 * 7. Mount to DOM
 *
 * Why provide stores explicitly: While Pinia's useStore() works, explicit
 * injection gives better TypeScript support and makes dependencies clear.
 */
async function initVueApp() {
  try {
    // Initialize Pinia store system
    const pinia = createPinia()
    setActivePinia(pinia)

    // Create all stores upfront for cross-store dependencies
    const stores = {
      settings: useSettingsStore(),
      toolglows: useToolGlowsStore(),
      ocr: useInstantOCRStore(),
      wordCounter: useWordCounterStore(),
      quickActions: useQuickActionsStore()
    }

    // Root component with store injection
    const RootComponent = defineComponent({
      name: 'RootComponent',
      setup() {
        // Provide stores to child components via Vue's injection system
        Object.entries(stores).forEach(([key, store]) => {
          provide(key + 'Store', store)
        })
        return {}
      },
      render() {
        return h(ToolGlowsBar)
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

    // Injection des styles locaux et dépendances packagées.
    injectStyles(primeVueThemeStyles, 'toolglows-primevue-theme')
    injectStyles(primeVueCoreStyles, 'toolglows-primevue-core')
    injectStyles(primeIconsStyles, 'toolglows-prime-icons')
    injectStyles(mainStyles, 'toolglows-main-styles')
    injectStyles(contentStyles, 'toolglows-content-styles')

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
  const rootElement = document.getElementById('toolglows-root')
  if (rootElement) {
    rootElement.remove()
  }
}

// Initialisation sécurisée
async function init() {
  console.log('[CONTENT] 🚀 Starting content script initialization')
  try {
    // 1. Setup du bridge en premier
    if (!bridgeInitialized) {
      console.log('[CONTENT] 🔒 Setting up secure bridge')
      setupSecureBridge()
      bridgeInitialized = true
      console.log('[CONTENT] ✅ Bridge initialized')
    }

    // 2. Initialisation de Vue après le bridge
    console.log('[CONTENT] 🎯 Initializing Vue app')
    await initVueApp()

    console.log('[CONTENT] ✅ Content script initialization complete')
  } catch (error) {
    console.error("[CONTENT] ❌ Failed to initialize content script:", error)
    cleanup()
  }
}

// Gestion des erreurs
self.onerror = function (message, source, lineno, colno, error) {
  console.error("[CONTENT] ❌ Content script error:", {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  })

  // Si l'erreur est liée à l'extension invalidée, on nettoie
  if (error && error.message.includes("Extension context invalidated")) {
    console.log('[CONTENT] 🧹 Cleaning up due to invalidated context')
    cleanup()
  }
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error("[CONTENT] ❌ Unhandled promise rejection:", {
    reason: event.reason,
    promise: event.promise
  })
}

// Initialisation quand le DOM est prêt
if (document.readyState === "loading") {
  console.log('[CONTENT] ⏳ DOM still loading, waiting for DOMContentLoaded')
  document.addEventListener("DOMContentLoaded", () => init())
} else {
  console.log('[CONTENT] 🎯 DOM already loaded, initializing now')
  init()
}

// Nettoyage lors du déchargement de la page
window.addEventListener("unload", () => {
  console.log('[CONTENT] 🧹 Page unloading, cleaning up')
  cleanup()
})

console.log("[CONTENT] ✨ Content script loaded successfully")

export {}
