import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'

console.log('🚀 Démarrage de l\'application')

// Composants PrimeVue
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Panel from 'primevue/panel'

// Styles PrimeVue
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Style global
import './assets/main.css'

import App from './App.vue'

const pinia = createPinia()

const app = createApp(App)

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

// Enregistrement des composants PrimeVue
app.component('Button', Button)
app.component('Sidebar', Sidebar)
app.component('Checkbox', Checkbox)
app.component('Dropdown', Dropdown)
app.component('Panel', Panel)

// S'assurer que le DOM est prêt avant le montage
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM chargé, montage de l\'application')
    app.mount('#app')
  })
} else {
  console.log('✅ DOM déjà chargé, montage de l\'application')
  app.mount('#app')
}

// Exporter pinia pour une utilisation dans d'autres parties de l'extension
export { pinia } 