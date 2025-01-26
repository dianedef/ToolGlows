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
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

export function setupPrimeVue(app: App) {
  // Enregistrement du service Toast
  app.use(ToastService)

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
    Textarea,
    Toast,
    InputNumber,
    DataTable,
    Column
  }

  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component)
  })
} 