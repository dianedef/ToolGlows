import { createApp, h, defineComponent, provide, Suspense } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import ToolflowzBar from '../../components/ToolflowzBar.vue'

// Stores
import { useSettingsStore } from '../../stores/settings'
import { useToolflowzStore } from '../../stores/toolflowz'
import { useInstantOCRStore } from '../../stores/instantOCR'
import { useWordCounterStore } from '../../stores/wordCounter'
import { useQuickActionsStore } from '../../stores/quickActions'

// Styles PrimeVue et composants
import { setupPrimeVue } from '../../utils/setupPrimeVue'
import { injectStyles, injectStylesheet } from '../../utils/styleInjection'

// Styles locaux
import mainStyles from '@/assets/main.css?inline'
import contentStyles from '@/content-script/index.scss?inline'

// Types
interface MessageData {
  settings?: Record<string, any>
  activeTools?: string[]
}

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

// Écouter les messages du content script
onMessage('INITIAL_STATE', async ({ data }) => {
  const messageData = data as MessageData
  console.log('📥 État initial reçu:', messageData)
  if (messageData.settings) {
    stores.settings.$patch(messageData.settings)
  }
  if (messageData.activeTools) {
    stores.toolflowz.$patch({ activeTools: messageData.activeTools })
  }
})

onMessage('STORAGE_UPDATED', async ({ data }) => {
  const messageData = data as MessageData
  console.log('📥 Mise à jour du storage reçue:', messageData)
  if (messageData.settings) {
    stores.settings.$patch(messageData.settings)
  }
  if (messageData.activeTools) {
    stores.toolflowz.$patch({ activeTools: messageData.activeTools })
  }
})

// Composant racine avec Suspense et gestion d'erreurs
const RootComponent = defineComponent({
  name: 'RootComponent',
  setup() {
    try {
      // Injection des stores
      Object.entries(stores).forEach(([key, store]) => {
        provide(key + 'Store', store)
      })

      return {}
    } catch (error) {
      console.error('❌ Erreur dans le setup du composant racine:', error)
      throw error
    }
  },
  render() {
    return h(Suspense, null, {
      default: () => h(ToolflowzBar),
      fallback: () => h('div', { class: 'loading' }, 'Chargement...')
    })
  }
})

// Création de l'application
const app = createApp(RootComponent)

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

// Initialisation de l'extension
async function initializeExtension() {
  try {
    console.log('🚀 Initialisation de l\'iframe')

    // Injection des styles externes via CDN avec gestion des erreurs
    await Promise.all([
      injectStylesheet('https://cdn.jsdelivr.net/npm/primevue@3.49.1/resources/themes/lara-light-blue/theme.min.css', 'toolflowz-primevue-theme'),
      injectStylesheet('https://cdn.jsdelivr.net/npm/primevue@3.49.1/resources/primevue.min.css', 'toolflowz-primevue-core'),
      injectStylesheet('https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css', 'toolflowz-prime-icons')
    ]).catch(error => {
      console.error('❌ Erreur lors du chargement des styles externes:', error)
    })

    // Injection des styles locaux
    injectStyles(mainStyles, 'toolflowz-main-styles')
    injectStyles(contentStyles, 'toolflowz-content-styles')

    // S'assurer que le DOM est prêt avant le montage
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('✅ DOM chargé, montage de l\'application')
          resolve()
        })
      })
    } else {
      console.log('✅ DOM déjà chargé')
    }

    // Montage de l'application
    app.mount('#app')
    console.log('✅ Application montée avec succès')

    // Obtenir l'ID de l'onglet actuel
    const tab = await chrome.tabs.getCurrent()
    const tabId = tab?.id

    if (!tabId) {
      throw new Error('Impossible d\'obtenir l\'ID de l\'onglet actuel')
    }

    // Informer le content script que l'iframe est prête
    await sendMessage('IFRAME_READY', {}, { context: 'content-script', tabId })
    console.log('✅ Message IFRAME_READY envoyé')

    return app
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'iframe:', error)
    throw error
  }
}

// Gestion des erreurs globales
self.onerror = function (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
  console.error('❌ Erreur dans l\'iframe:', {
    message: message instanceof Event ? message.type : message,
    source,
    lineno,
    colno,
    error
  })
}

// Gestion des rejets de promesses non gérés
self.onunhandledrejection = function(event: PromiseRejectionEvent) {
  console.error('❌ Promesse rejetée non gérée dans l\'iframe:', {
    reason: event.reason,
    promise: event.promise
  })
}

// Initialisation de l'extension
initializeExtension().catch(error => {
  console.error('❌ Erreur fatale lors de l\'initialisation de l\'iframe:', error)
})

// Exporter pinia pour une utilisation dans d'autres parties de l'extension
export { pinia }
