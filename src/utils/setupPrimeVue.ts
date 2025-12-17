/**
 * PrimeVue Component Registration Utility
 * 
 * Registers PrimeVue UI components globally for use throughout the application.
 * Using global registration (vs. per-component imports) because:
 * 
 * Pros:
 * - Simpler template syntax (no imports needed in each component)
 * - Consistent component availability across all tools
 * - Better DX for rapid development
 * 
 * Cons:
 * - Slightly larger bundle size (but acceptable for extension context)
 * - All components loaded even if not used (mitigated by tree-shaking)
 * 
 * Why PrimeVue:
 * - Comprehensive component library (saves development time)
 * - Good accessibility support out of box
 * - Themeable and works well in content script context
 * - Lighter than Material UI alternatives
 * 
 * Components registered:
 * - Forms: Button, Input, Checkbox, Dropdown, Slider, etc.
 * - Layout: Sidebar, Panel, Card, Divider
 * - Dialogs: Dialog, Toast notifications
 * - Data: DataTable with Column definitions
 * 
 * Note: Only registers components actually used in the codebase.
 * Add new components here as needed rather than importing in each file.
 */
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

/**
 * Setup and register PrimeVue components
 * Call this once during Vue app initialization
 */
export function setupPrimeVue(app: App) {
  // Register ToastService for notification system
  app.use(ToastService)

  // Register all UI components globally
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