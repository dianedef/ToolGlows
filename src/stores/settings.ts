/**
 * Settings Store - Persistent Configuration Management
 *
 * Central store for all extension settings with automatic persistence
 * and cross-tab synchronization. This store:
 *
 * 1. Uses chrome.storage.sync for cloud-synced persistence
 * 2. Broadcasts changes to all tabs via webext-bridge
 * 3. Validates and sanitizes incoming settings
 * 4. Applies settings changes to the live UI
 * 5. Provides boundary checking for position coordinates
 *
 * Architecture:
 * - Uses useBrowserSyncStorage for reactive chrome.storage integration
 * - Watches settings changes to trigger UI updates
 * - Coordinates with toolglows store for tool activation
 * - Implements optimistic updates with background sync
 *
 * Data flow:
 * User interaction → Update settings locally → Send to background →
 * Background saves to storage → Background broadcasts to all tabs →
 * Each tab receives update → Apply to local UI
 */
import { defineStore } from 'pinia'
import { ref, toRaw, watch } from 'vue'
import { bridgeApi, initBridgeListeners } from '@/bridge'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useBrowserSyncStorage } from '@/composables/useBrowserStorage'
import { normalizeInterfaceTheme } from '@/composables/useInterfaceTheme'
import type { HideElementSettings } from './hideElement'

/**
 * Settings Data Structure
 *
 * All fields must be JSON-serializable for chrome.storage and
 * webext-bridge compatibility. Avoid functions, Symbols, or circular refs.
 */
export interface ToolGlowsSettings {
  expanded: boolean
  position: {
    x: number
    y: number
  }
  activeTools: string[]
  isPinned: boolean
  interfaceTheme: 'light' | 'dark'
  toolbarColor?: string
  toolbarSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  hideElement?: HideElementSettings
  components?: {
    richCopy?: {
      enabled: boolean
      options?: unknown
    }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  console.log('[INFO] Creating settings store')

  if (!chrome?.storage?.sync) {
    console.error('[ERROR] chrome.storage.sync API not available in settings store')
    throw new Error('chrome.storage.sync API is not available')
  }

  const defaultSettings: ToolGlowsSettings = {
    expanded: false,
    position: { x: window.innerWidth - 100, y: 20 },
    activeTools: [],
    isPinned: false,
    interfaceTheme: 'light',
    toolbarColor: '#ff69b4',
    toolbarSize: 'md',
    hideElement: {
      hiddenElements: [],
      isSelectingElement: false,
      shortcut: 'Alt+H',
      enableShortcut: true
    },
    components: {}
  }

  const { data: settings, promise: settingsLoaded } = useBrowserSyncStorage<ToolGlowsSettings>(
    'toolglowsSettings',
    defaultSettings
  )

  const normalizeSettings = (value: Partial<ToolGlowsSettings> | undefined): ToolGlowsSettings => ({
    ...defaultSettings,
    ...value,
    position: { ...defaultSettings.position, ...value?.position },
    activeTools: Array.isArray(value?.activeTools) ? value.activeTools : defaultSettings.activeTools,
    interfaceTheme: normalizeInterfaceTheme(value?.interfaceTheme),
    hideElement: {
      hiddenElements: Array.isArray(value?.hideElement?.hiddenElements)
        ? value.hideElement.hiddenElements
        : defaultSettings.hideElement!.hiddenElements,
      isSelectingElement: value?.hideElement?.isSelectingElement ?? defaultSettings.hideElement!.isSelectingElement,
      shortcut: value?.hideElement?.shortcut ?? defaultSettings.hideElement!.shortcut,
      enableShortcut: value?.hideElement?.enableShortcut ?? defaultSettings.hideElement!.enableShortcut
    },
    components: { ...defaultSettings.components, ...value?.components }
  })

  /**
   * Reactive Settings Watcher
   *
   * Monitors UI-affecting settings and triggers live updates when they change.
   * Uses a computed object to track only relevant properties, avoiding
   * unnecessary re-renders for non-UI settings.
   *
   * Deep watch is necessary because position is a nested object.
   */
  watch(() => ({
    position: settings.value.position,
    activeTools: settings.value.activeTools,
    toolbarColor: settings.value.toolbarColor,
    expanded: settings.value.expanded,
    isPinned: settings.value.isPinned,
    interfaceTheme: settings.value.interfaceTheme
  }), (newSettings) => {
    applySettings(settings.value)
  }, { deep: true })

  /**
   * Apply Settings to Live UI
   *
   * Translates settings data structure into DOM changes.
   * Called when:
   * - Settings are loaded from storage
   * - Settings are synced from another tab
   * - User changes settings in current tab
   *
   * Implementation notes:
   * - Validates/normalizes activeTools format (handles legacy object format)
   * - Directly manipulates toolbar styles for immediate visual feedback
   * - Coordinates with toolglows store to update tool activation
   * - Uses JSON comparison to avoid unnecessary updates
   */
  const applySettings = (newSettings: ToolGlowsSettings) => {
    console.log('[INFO] Applying settings:', newSettings)

    // Legacy format handling: convert object to array
    if (!Array.isArray(newSettings.activeTools)) {
      newSettings.activeTools = Object.values(newSettings.activeTools || {})
    }

    // Direct style manipulation for instant feedback
    const toolbar = document.querySelector('.toolglows-bar') as HTMLElement
    if (toolbar) {
      toolbar.style.backgroundColor = newSettings.toolbarColor || 'var(--tg-color-light-surface)'
    }

    // Update active tools if changed (avoid redundant updates)
    const toolglowsStore = useToolGlowsStore()
    if (newSettings.activeTools &&
        JSON.stringify(toolglowsStore.activeTools) !== JSON.stringify(newSettings.activeTools)) {
      toolglowsStore.setActiveTools(newSettings.activeTools)
      console.log('[INFO] Active tools updated:', newSettings.activeTools)
    }
  }

  const loadSettings = async () => {
    console.log('[INFO] Loading settings')
    try {
      // 1. Charge depuis le storage local
      await settingsLoaded
      const result = await chrome.storage.sync.get('toolglowsSettings')
      if (result.toolglowsSettings) {
        settings.value = normalizeSettings(result.toolglowsSettings)
        console.log('[SUCCESS] Settings loaded from storage:', settings.value)
        applySettings(settings.value)
      } else {
        console.log('[INFO] No settings found in storage, using defaults')
        // A fresh profile has no background state to request yet. Persist the
        // local defaults first so toolbar initialization never waits on an
        // empty bridge response.
        await updateSettings(settings.value)
        return
      }

      // Storage is the durable source of truth. Cross-tab synchronization is
      // received asynchronously through the bridge listeners and must not
      // delay first render while a Manifest V3 worker wakes up.
    } catch (error) {
      console.error('[ERROR] Failed to load settings:', error)
      throw error
    }
  }

  const updateSettings = async (newSettings: Partial<ToolGlowsSettings>) => {
    console.log('[INFO] Updating settings:', newSettings)
    // Met à jour localement en préservant les valeurs existantes
    settings.value = normalizeSettings({
      ...settings.value,
      ...newSettings
    })

    await chrome.storage.sync.set({ toolglowsSettings: toRaw(settings.value) })

    // The toolbar owns the local state. Background synchronization is a
    // best-effort enhancement and must never prevent the UI from rendering.
    void bridgeApi.updateSettings(settings.value)
      .then(() => console.log('[SUCCESS] Settings update sent to background'))
      .catch(error => console.error('[ERROR] Failed to update settings:', error))
  }

  /**
   * Update Toolbar Position with Boundary Constraints
   *
   * Ensures the toolbar stays within visible viewport bounds even on:
   * - Window resize
   * - Zoom changes
   * - Multi-monitor setups
   *
   * Boundary logic:
   * - Minimum 20px from edges (prevents cutoff)
   * - Maximum allows 100px margin (keeps toolbar grabbable)
   *
   * This prevents the common UX issue where draggable elements get
   * "lost" off-screen and become unreachable without resetting settings.
   */
  const updatePosition = async (x: number, y: number) => {
    console.log('[INFO] Updating position:', { x, y })

    // Calculate safe boundaries
    const maxX = window.innerWidth - 100  // Reserve 100px for toolbar width
    const maxY = window.innerHeight - 100

    // Clamp to boundaries
    const boundedX = Math.max(20, Math.min(x, maxX))
    const boundedY = Math.max(20, Math.min(y, maxY))

    // Optimistic local update
    settings.value.position = { x: boundedX, y: boundedY }

    void bridgeApi.updateSettings(settings.value)
      .then(() => console.log('[SUCCESS] Position update sent to background'))
      .catch(error => console.error('[ERROR] Failed to update position:', error))
  }

  const toggleTool = async (toolId: string) => {
    console.log('[INFO] Toggling tool:', toolId)
    const index = settings.value.activeTools.indexOf(toolId)
    if (index === -1) {
      settings.value.activeTools.push(toolId)
    } else {
      settings.value.activeTools.splice(index, 1)
    }

    void bridgeApi.updateSettings(settings.value)
      .then(() => console.log('[SUCCESS] Tool toggle synced with background'))
      .catch(error => console.error('[ERROR] Failed to sync tool toggle:', error))
  }

  /**
   * Cross-Tab Synchronization Listener
   *
   * Receives settings updates broadcast from other tabs via the background
   * script. This enables real-time synchronization when user changes settings
   * in one tab and sees immediate updates in all other tabs.
   *
   * Critical for UX: Without this, users would need to reload tabs to see
   * settings changes, leading to confusion and perceived bugs.
   *
   * Flow: Other tab → Background → This tab → Update local state → Apply to UI
   */
  initBridgeListeners({
    onSettingsUpdate: (newSettings) => {
      if (newSettings) {
        console.log('[INFO] Received settings update from another instance:', newSettings)
        const normalizedSettings = normalizeSettings(newSettings)
        settings.value = normalizedSettings
        applySettings(normalizedSettings)
        console.log('[SUCCESS] Settings updated from another instance')
      }
    }
  })

  return {
    settings,
    loadSettings,
    updateSettings,
    updatePosition,
    toggleTool
  }
})
