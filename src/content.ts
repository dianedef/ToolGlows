import { createApp } from 'vue'
import { createPinia } from 'pinia'
import RootComponent from './RootComponent.vue'
import { useHideElementStore } from './stores/hideElement'
import { useSettingsStore } from './stores/settings'
import PrimeVue from 'primevue/config'

const initHideElement = async () => {
  const hideElementStore = useHideElementStore()

  // Charger les paramètres
  await hideElementStore.loadSettings()

  // Configurer l'observateur de mutations
  const observer = hideElementStore.setupMutationObserver()

  // Nettoyer lors du déchargement de la page
  window.addEventListener('unload', () => {
    observer.disconnect()
  })
}

// Initialiser l'application
const init = async () => {
  try {
    // Créer l'application Vue
    const app = createApp(RootComponent)
    const pinia = createPinia()
    app.use(pinia)
    app.use(PrimeVue)

    // Charger d'abord les paramètres globaux
    const settingsStore = useSettingsStore()
    await settingsStore.loadSettings()

    // Initialiser le système de masquage
    await initHideElement()

    // Monter l'application
    const container = document.createElement('div')
    container.id = 'toolglows-app'
    document.body.appendChild(container)
    app.mount(container)

    console.log('[SUCCESS] Content script initialized')
  } catch (error) {
    console.error('[ERROR] Failed to initialize content script:', error)
  }
}

init()
