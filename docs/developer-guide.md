# Developer Guide
# ToolFlowz Browser Extension Framework

**Version**: 1.0  
**Date**: 2025-12-16  
**Audience**: Developers building with ToolFlowz

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Development Workflow](#2-development-workflow)
3. [Project Structure](#3-project-structure)
4. [Component Development](#4-component-development)
5. [State Management](#5-state-management)
6. [Routing](#6-routing)
7. [Styling](#7-styling)
8. [Internationalization](#8-internationalization)
9. [Testing](#9-testing)
10. [Build & Deployment](#10-build--deployment)
11. [Best Practices](#11-best-practices)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Getting Started

### Prerequisites
- Node.js `^20.19.0 || ^22.13.0 || >=24.0.0` installed
- pnpm `10.33.2` package manager
- Basic knowledge of Vue 3 and TypeScript
- Understanding of browser extensions

### Installation

```bash
# Clone the repository
git clone https://github.com/dianedef/ext---ToolFlowz.git
cd ext---ToolFlowz

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Or run specific browser dev mode
pnpm dev:chrome   # Chrome only
pnpm dev:firefox  # Firefox only
```

### First Run

After starting the dev server:

1. **Chrome**: 
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/chrome` folder

2. **Firefox**:
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in `dist/firefox` folder

---

## 2. Development Workflow

### Daily Development Cycle

```bash
# 1. Start development server (auto-rebuilds on file changes)
pnpm dev

# 2. Make changes to source files in src/

# 3. Test changes in browser
#    - Extension auto-reloads in most cases
#    - Some changes require manual reload

# 4. Run linting and formatting
pnpm lint          # Lint and fix issues
pnpm format        # Format code with Prettier

# 5. Type check
pnpm typecheck     # Check TypeScript types

# 6. Manifest lint after a build
pnpm lint:manifest # Lint dist/firefox with web-ext
```

### Hot Module Replacement (HMR)

HMR works for most file changes:
- ✅ Vue components
- ✅ CSS/SCSS files
- ✅ JavaScript/TypeScript modules
- ❌ Manifest changes (requires reload)
- ❌ Background script changes (requires reload)

---

## 3. Project Structure

### Directory Organization

```
src/
├── assets/              # Global assets (images, styles)
│   ├── base.css        # Base styles
│   └── primevue/       # PrimeVue theme
│
├── background/          # Background service worker
│   └── index.ts        # Background script entry
│
├── bridge/             # Cross-context communication
│   └── index.ts        # Message bridge setup
│
├── components/         # Shared Vue components
│   ├── state/         # State-related components
│   ├── Header.vue
│   ├── Footer.vue
│   └── ...
│
├── composables/        # Vue composables
│   ├── useBrowserStorage.ts
│   ├── useLocale.ts
│   ├── useTheme.ts
│   └── ...
│
├── content-script/     # Content scripts
│   └── index.ts       # Content script entry
│
├── devtools/          # DevTools panel
│   └── index.ts       # DevTools entry
│
├── locales/           # i18n translation files
│   ├── en.yaml
│   ├── fr.yaml
│   └── ...
│
├── offscreen/         # Offscreen pages
│   └── index.html
│
├── stores/            # Pinia stores
│   ├── settings.ts
│   └── ...
│
├── types/             # TypeScript type definitions
│   └── index.ts
│
├── ui/                # UI pages
│   ├── action-popup/  # Browser toolbar popup
│   ├── options/       # Options page
│   ├── side-panel/    # Chrome side panel
│   ├── devtools-panel/# DevTools UI
│   ├── setup/         # Install/update pages
│   └── common/        # Shared pages
│
└── utils/             # Utility functions
    └── index.ts
```

### Key Configuration Files

```
├── manifest.config.ts         # Base manifest configuration
├── manifest.chrome.config.ts  # Chrome-specific manifest
├── manifest.firefox.config.ts # Firefox-specific manifest
├── vite.config.ts            # Base Vite config
├── vite.chrome.config.ts     # Chrome Vite config
├── vite.firefox.config.ts    # Firefox Vite config
├── tailwind.config.cjs       # Tailwind configuration
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies and scripts
```

---

## 4. Component Development

### Creating a New Component

```vue
<!-- src/components/MyComponent.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits
interface Emits {
  (e: 'update', value: number): void
}

const emit = defineEmits<Emits>()

// State
const localCount = ref(props.count)

// Computed
const displayText = computed(() => `${props.title}: ${localCount.value}`)

// Methods
const increment = () => {
  localCount.value++
  emit('update', localCount.value)
}
</script>

<template>
  <div class="my-component">
    <h3>{{ displayText }}</h3>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
.my-component {
  @apply p-4 rounded-lg border;
}
</style>
```

### Auto-Import

Components in `src/components/` are auto-imported:

```vue
<template>
  <!-- No import needed! -->
  <Header />
  <MyComponent title="Count" :count="5" />
  <Footer />
</template>
```

### Using Icons

Icons from Iconify are available via `unplugin-icons`:

```vue
<script setup lang="ts">
// Icons auto-imported from configured icon sets
import IconMdiHeart from '~icons/mdi/heart'
import IconCarbonUser from '~icons/carbon/user'
</script>

<template>
  <IconMdiHeart class="text-red-500" />
  <IconCarbonUser />
</template>
```

---

## 5. State Management

### Creating a Store

```typescript
// src/stores/myStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMyStore = defineStore('myStore', () => {
  // State
  const count = ref(0)
  const items = ref<string[]>([])

  // Getters
  const doubleCount = computed(() => count.value * 2)
  const itemCount = computed(() => items.value.length)

  // Actions
  function increment() {
    count.value++
  }

  function addItem(item: string) {
    items.value.push(item)
  }

  return {
    // State
    count,
    items,
    // Getters
    doubleCount,
    itemCount,
    // Actions
    increment,
    addItem
  }
})
```

### Persistent Store

```typescript
// src/stores/settings.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const locale = ref('en')

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
  }

  function setLocale(newLocale: string) {
    locale.value = newLocale
  }

  return {
    theme,
    locale,
    setTheme,
    setLocale
  }
}, {
  persist: {
    storage: 'sync', // or 'local'
    key: 'settings'
  }
})
```

### Using Stores in Components

```vue
<script setup lang="ts">
import { useMyStore } from '@/stores/myStore'
import { storeToRefs } from 'pinia'

const myStore = useMyStore()

// Reactive refs from store
const { count, doubleCount } = storeToRefs(myStore)

// Actions can be called directly
const handleClick = () => {
  myStore.increment()
}
</script>
```

---

## 6. Routing

### File-Based Routing

Routes are automatically generated from file structure:

```
src/ui/action-popup/pages/
├── index.vue          → /
├── settings.vue       → /settings
└── about.vue          → /about
```

### Creating a Page

```vue
<!-- src/ui/action-popup/pages/settings.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<template>
  <div>
    <h1>Settings</h1>
    <button @click="goBack">Back</button>
  </div>
</template>
```

### Navigation

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Programmatic navigation
router.push('/settings')
router.push({ name: 'settings', params: { id: '123' } })

// Current route
console.log(route.path)
console.log(route.params)
</script>

<template>
  <!-- Declarative navigation -->
  <router-link to="/settings">Settings</router-link>
  <router-link :to="{ name: 'about' }">About</router-link>
</template>
```

---

## 7. Styling

### Tailwind CSS

Use utility classes for styling:

```vue
<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Hello World
    </h1>
    <button class="btn btn-primary">
      Click Me
    </button>
  </div>
</template>
```

### DaisyUI Components

DaisyUI provides pre-styled components:

```vue
<template>
  <!-- Button variations -->
  <button class="btn btn-primary">Primary</button>
  <button class="btn btn-secondary">Secondary</button>
  <button class="btn btn-accent">Accent</button>
  
  <!-- Card -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Card Title</h2>
      <p>Card content goes here</p>
    </div>
  </div>
  
  <!-- Modal -->
  <dialog class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Modal Title</h3>
      <p>Modal content</p>
    </div>
  </dialog>
</template>
```

### Dark Mode

Dark mode is automatically handled:

```vue
<template>
  <!-- Automatically switches based on theme -->
  <div class="bg-white dark:bg-gray-900">
    <p class="text-black dark:text-white">
      This text adapts to theme
    </p>
  </div>
</template>
```

---

## 8. Internationalization

### Adding Translations

```yaml
# src/locales/en.yaml
common:
  welcome: Welcome
  settings: Settings
  save: Save
  cancel: Cancel

errors:
  generic: Something went wrong
  network: Network error occurred
```

### Using Translations

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const changeLanguage = (lang: string) => {
  locale.value = lang
}
</script>

<template>
  <div>
    <h1>{{ t('common.welcome') }}</h1>
    <p>{{ t('errors.generic') }}</p>
    
    <button @click="changeLanguage('fr')">
      Français
    </button>
  </div>
</template>
```

---

## 9. Testing

### Unit Tests (Vitest)

```typescript
// tests/unit/components/MyComponent.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test', count: 5 }
    })
    
    expect(wrapper.text()).toContain('Test: 5')
  })

  it('increments count on click', async () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test', count: 0 }
    })
    
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')?.[0]).toEqual([1])
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/popup.spec.ts
import { test, expect } from '@playwright/test'

test('popup loads correctly', async ({ page }) => {
  await page.goto('chrome-extension://[extension-id]/popup.html')
  
  await expect(page.locator('h1')).toContainText('Welcome')
  
  await page.click('text=Settings')
  await expect(page).toHaveURL(/.*settings/)
})
```

---

## 10. Build & Deployment

### Building for Production

```bash
# Build for both browsers
pnpm build

# Build for specific browser
pnpm build:chrome
pnpm build:firefox
```

### Output Structure

```
dist/
├── chrome/
│   ├── manifest.json
│   ├── [bundle files]
│   └── chrome.zip      # Ready for Chrome Web Store
└── firefox/
    ├── manifest.json
    ├── [bundle files]
    └── firefox.zip     # Ready for Firefox Add-ons
```

### Submitting to Stores

#### Chrome Web Store
1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload `dist/chrome.zip`
3. Fill in store listing details
4. Submit for review

#### Firefox Add-ons
1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Upload `dist/firefox.zip`
3. Fill in listing information
4. Submit for review

---

## 11. Best Practices

### Code Organization
- One component per file
- Keep components small and focused
- Use composables for reusable logic
- Group related files together

### TypeScript
- Always define prop types
- Use interfaces over types when possible
- Enable strict mode
- Avoid `any` type

### Performance
- Lazy load routes
- Use `v-show` for frequently toggled content
- Memoize expensive computations
- Debounce user inputs

### State Management
- Keep stores focused and modular
- Use getters for derived state
- Actions for async operations
- Persist only necessary data

---

## 12. Troubleshooting

### Extension Not Loading
- Check manifest.json syntax
- Verify all required files exist
- Check browser console for errors
- Try reloading the extension

### HMR Not Working
- Restart dev server
- Clear browser cache
- Check for syntax errors
- Verify Vite config

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf dist`
- Check TypeScript errors: `pnpm typecheck`

### Storage Issues
- Check permissions in manifest
- Verify storage API usage
- Check storage quotas
- Use browser DevTools → Application → Storage

---

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Docs](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-16  
**For Issues**: Open a GitHub issue
