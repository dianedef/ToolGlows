import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'

console.log('INFO: Starting application')

// PrimeVue components
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Panel from 'primevue/panel'
import ThemeSwatch from './components/ThemeSwatch.vue'

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Global style
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

// Registering PrimeVue components
app.component('Button', Button)
app.component('Sidebar', Sidebar)
app.component('Checkbox', Checkbox)
app.component('Dropdown', Dropdown)
app.component('Panel', Panel)
app.component('ThemeSwatch', ThemeSwatch)

// Ensuring the DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('INFO: DOM loaded, mounting application')
    app.mount('#app')
  })
} else {
  console.log('INFO: DOM ALREADY LOADED, mounting application')
  app.mount('#app')
}

// Exporting pinia for use in other parts of the extension
export { pinia } 