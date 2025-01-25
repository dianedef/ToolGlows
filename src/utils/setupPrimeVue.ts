import type { App } from 'vue'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Panel from 'primevue/panel'
import Dialog from 'primevue/dialog'
import ToggleButton from 'primevue/togglebutton'
import Slider from 'primevue/slider'
import ColorPicker from 'primevue/colorpicker'
import Calendar from 'primevue/calendar'
import Divider from 'primevue/divider'
import RadioButton from 'primevue/radiobutton'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'

export function setupPrimeVue(app: App) {
  // Enregistrement des composants PrimeVue
  const components = {
    Button,
    Sidebar,
    Checkbox,
    Dropdown,
    Panel,
    Dialog,
    ToggleButton,
    Slider,
    ColorPicker,
    Calendar,
    Divider,
    RadioButton,
    InputText,
    Card,
    Textarea
  }

  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component)
  })
} 