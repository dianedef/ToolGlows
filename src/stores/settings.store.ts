import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { sendMessage } from 'webext-bridge/content-script'

export const useSettingsStore = defineStore('settings', () => {
  // État persisté avec useStorage
  const settings = useStorage('toolflowz-settings', {
    darkMode: {
      autoSync: true,
      excludedDomains: [],
      sunsetTime: '19:00',
      sunriseTime: '07:00'
    },
    searchJumper: {
      defaultEngine: 'google',
      shortcuts: true,
      contextMenu: true
    },
    readerMode: {
      fontSize: 18,
      fontFamily: 'Arial',
      theme: 'light'
    },
    richCopy: {
      defaultFormat: 'markdown',
      includeFavicon: true,
      includeSource: true
    }
  })

  // Actions
  async function updateSettings(newSettings: typeof settings.value) {
    settings.value = newSettings
    // Notifier le background script
    await sendMessage('SETTINGS_UPDATED', { settings: newSettings })
  }

  async function resetSettings() {
    settings.value = {
      darkMode: {
        autoSync: true,
        excludedDomains: [],
        sunsetTime: '19:00',
        sunriseTime: '07:00'
      },
      searchJumper: {
        defaultEngine: 'google',
        shortcuts: true,
        contextMenu: true
      },
      readerMode: {
        fontSize: 18,
        fontFamily: 'Arial',
        theme: 'light'
      },
      richCopy: {
        defaultFormat: 'markdown',
        includeFavicon: true,
        includeSource: true
      }
    }
    await sendMessage('SETTINGS_UPDATED', { settings: settings.value })
  }

  return {
    settings,
    updateSettings,
    resetSettings
  }
}) 