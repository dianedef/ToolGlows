import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import aryaBlueThemeUrl from 'primevue/resources/themes/arya-blue/theme.css?url'
import aryaGreenThemeUrl from 'primevue/resources/themes/arya-green/theme.css?url'
import aryaOrangeThemeUrl from 'primevue/resources/themes/arya-orange/theme.css?url'
import aryaPurpleThemeUrl from 'primevue/resources/themes/arya-purple/theme.css?url'
import laraDarkBlueThemeUrl from 'primevue/resources/themes/lara-dark-blue/theme.css?url'
import laraDarkIndigoThemeUrl from 'primevue/resources/themes/lara-dark-indigo/theme.css?url'
import laraDarkPurpleThemeUrl from 'primevue/resources/themes/lara-dark-purple/theme.css?url'
import laraDarkTealThemeUrl from 'primevue/resources/themes/lara-dark-teal/theme.css?url'
import laraLightBlueThemeUrl from 'primevue/resources/themes/lara-light-blue/theme.css?url'
import laraLightIndigoThemeUrl from 'primevue/resources/themes/lara-light-indigo/theme.css?url'
import laraLightPurpleThemeUrl from 'primevue/resources/themes/lara-light-purple/theme.css?url'
import laraLightTealThemeUrl from 'primevue/resources/themes/lara-light-teal/theme.css?url'
import sagaBlueThemeUrl from 'primevue/resources/themes/saga-blue/theme.css?url'
import sagaGreenThemeUrl from 'primevue/resources/themes/saga-green/theme.css?url'
import sagaOrangeThemeUrl from 'primevue/resources/themes/saga-orange/theme.css?url'
import sagaPurpleThemeUrl from 'primevue/resources/themes/saga-purple/theme.css?url'
import velaBlueThemeUrl from 'primevue/resources/themes/vela-blue/theme.css?url'
import velaGreenThemeUrl from 'primevue/resources/themes/vela-green/theme.css?url'
import velaOrangeThemeUrl from 'primevue/resources/themes/vela-orange/theme.css?url'
import velaPurpleThemeUrl from 'primevue/resources/themes/vela-purple/theme.css?url'

interface Theme {
  name: string
  isDark: boolean
  primaryColor: string
  file: string
}

const themes: Theme[] = [
  // Lara Themes (Modern)
  { name: 'Lara Light Blue', isDark: false, primaryColor: '#4a9eff', file: 'lara-light-blue' },
  { name: 'Lara Light Indigo', isDark: false, primaryColor: '#6366F1', file: 'lara-light-indigo' },
  { name: 'Lara Light Purple', isDark: false, primaryColor: '#8B5CF6', file: 'lara-light-purple' },
  { name: 'Lara Light Teal', isDark: false, primaryColor: '#14B8A6', file: 'lara-light-teal' },
  { name: 'Lara Dark Blue', isDark: true, primaryColor: '#4a9eff', file: 'lara-dark-blue' },
  { name: 'Lara Dark Indigo', isDark: true, primaryColor: '#6366F1', file: 'lara-dark-indigo' },
  { name: 'Lara Dark Purple', isDark: true, primaryColor: '#8B5CF6', file: 'lara-dark-purple' },
  { name: 'Lara Dark Teal', isDark: true, primaryColor: '#14B8A6', file: 'lara-dark-teal' },

  // Saga Themes (Material-ish)
  { name: 'Saga Blue', isDark: false, primaryColor: '#2196F3', file: 'saga-blue' },
  { name: 'Saga Green', isDark: false, primaryColor: '#4CAF50', file: 'saga-green' },
  { name: 'Saga Orange', isDark: false, primaryColor: '#FF9800', file: 'saga-orange' },
  { name: 'Saga Purple', isDark: false, primaryColor: '#9C27B0', file: 'saga-purple' },

  // Vela Themes (Dark Material)
  { name: 'Vela Blue', isDark: true, primaryColor: '#64B5F6', file: 'vela-blue' },
  { name: 'Vela Green', isDark: true, primaryColor: '#81C784', file: 'vela-green' },
  { name: 'Vela Orange', isDark: true, primaryColor: '#FFB74D', file: 'vela-orange' },
  { name: 'Vela Purple', isDark: true, primaryColor: '#BA68C8', file: 'vela-purple' },

  // Arya Themes (Dark Elegant)
  { name: 'Arya Blue', isDark: true, primaryColor: '#64B5F6', file: 'arya-blue' },
  { name: 'Arya Green', isDark: true, primaryColor: '#81C784', file: 'arya-green' },
  { name: 'Arya Orange', isDark: true, primaryColor: '#FFB74D', file: 'arya-orange' },
  { name: 'Arya Purple', isDark: true, primaryColor: '#BA68C8', file: 'arya-purple' }
]

const themeUrls: Record<string, string> = {
  'arya-blue': aryaBlueThemeUrl,
  'arya-green': aryaGreenThemeUrl,
  'arya-orange': aryaOrangeThemeUrl,
  'arya-purple': aryaPurpleThemeUrl,
  'lara-dark-blue': laraDarkBlueThemeUrl,
  'lara-dark-indigo': laraDarkIndigoThemeUrl,
  'lara-dark-purple': laraDarkPurpleThemeUrl,
  'lara-dark-teal': laraDarkTealThemeUrl,
  'lara-light-blue': laraLightBlueThemeUrl,
  'lara-light-indigo': laraLightIndigoThemeUrl,
  'lara-light-purple': laraLightPurpleThemeUrl,
  'lara-light-teal': laraLightTealThemeUrl,
  'saga-blue': sagaBlueThemeUrl,
  'saga-green': sagaGreenThemeUrl,
  'saga-orange': sagaOrangeThemeUrl,
  'saga-purple': sagaPurpleThemeUrl,
  'vela-blue': velaBlueThemeUrl,
  'vela-green': velaGreenThemeUrl,
  'vela-orange': velaOrangeThemeUrl,
  'vela-purple': velaPurpleThemeUrl,
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>(themes[0])
  const isInitialized = ref(false)

  async function loadTheme() {
    if (isInitialized.value) return

    try {
      const result = await chrome.storage.sync.get('toolglowsTheme')
      if (result.toolglowsTheme) {
        const savedTheme = themes.find(t => t.name === result.toolglowsTheme)
        if (savedTheme) {
          currentTheme.value = savedTheme
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to load theme:', error)
    } finally {
      isInitialized.value = true
    }
  }

  async function saveTheme() {
    try {
      await chrome.storage.sync.set({ toolglowsTheme: currentTheme.value.name })
      console.log('[SUCCESS] Theme saved:', currentTheme.value.name)
    } catch (error) {
      console.error('[ERROR] Failed to save theme:', error)
    }
  }

  function nextTheme() {
    const currentIndex = themes.findIndex(t => t.name === currentTheme.value.name)
    const nextIndex = (currentIndex + 1) % themes.length
    currentTheme.value = themes[nextIndex]
    saveTheme()
  }

  // Charger le CSS du thème
  watch(currentTheme, async (theme) => {
    const linkId = 'primevue-theme-link'
    let themeLink = document.getElementById(linkId) as HTMLLinkElement

    if (!themeLink) {
      themeLink = document.createElement('link')
      themeLink.id = linkId
      themeLink.rel = 'stylesheet'
      document.head.appendChild(themeLink)
    }

    themeLink.href = themeUrls[theme.file] ?? laraLightBlueThemeUrl
  }, { immediate: true })

  return {
    currentTheme,
    themes,
    loadTheme,
    saveTheme,
    nextTheme
  }
})
