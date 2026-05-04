/**
 * Internationalization (i18n) Setup
 * 
 * Configures Vue I18n for multi-language support throughout the extension.
 * Uses unplugin-vue-i18n which automatically imports translation files
 * from the locales directory.
 * 
 * Configuration:
 * - globalInjection: Makes $t() available in all components
 * - legacy: false = Uses Composition API mode (better for Vue 3)
 * - locale: Default language (English)
 * - fallbackLocale: Used when translation missing in selected language
 * 
 * Translation files location: src/locales/*.json
 * 
 * Usage in components:
 * - Template: {{ $t('key.path') }}
 * - Script: const { t } = useI18n() → t('key.path')
 * 
 * Persistence:
 * - Stores user's language choice in browser.storage.local
 * - Restores on extension startup
 * - Survives browser restarts
 * 
 * Why i18n for extensions:
 * - Reach wider audience (Chrome Web Store is global)
 * - Better UX for non-English speakers
 * - Required for some markets (e.g., China, EU)
 * - Shows attention to quality and accessibility
 */
import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  globalInjection: true,  // Enable $t() in templates
  legacy: false,          // Use Composition API mode
  locale: 'en',          // Default language
  fallbackLocale: 'en',  // Fallback if translation missing
  messages,              // Auto-imported from locales/
})

/**
 * Restore previously selected locale from storage
 * Provides persistence across browser sessions
 */
const { data: currentLocale } = useBrowserLocalStorage<string>('user-locale', 'en')

i18n.global.locale.value = currentLocale.value
