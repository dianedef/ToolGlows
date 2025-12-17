/**
 * Toolflowz Store - Central Tool Registry
 * 
 * Manages the collection of available tools and their activation state.
 * This is the main store that coordinates between individual tool stores
 * and the settings store.
 * 
 * Responsibilities:
 * - Maintains the master list of all available tools
 * - Tracks which tools are currently active
 * - Handles tool initialization and lifecycle
 * - Coordinates tool activation changes with settings store
 * - Manages toolbar UI state (position, expansion, pinning)
 * 
 * Architecture note: Tools are registered at startup by importing their
 * definitions and calling initTools(). This allows dynamic tool loading
 * and makes it easy to add/remove tools by editing the tool manifest.
 */
import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import { useSettingsStore } from './settings'
import type { Tool } from '@/types/tools'
import { computed } from 'vue'
import { sendMessage } from 'webext-bridge/content-script'
import { i18n } from '@/utils/i18n'

export const useToolflowzStore = defineStore('toolflowz', () => {
  const t = i18n.global.t
  
  const settingsStore = useSettingsStore()
  
  // Master list of all available tools (Vue components)
  const tools = ref<Tool[]>([])
  
  // Currently active tool IDs (synced with settings)
  const activeTools = computed(() => settingsStore.settings.activeTools)
  
  // Global enable/disable switch
  const enabled = ref(true)
  
  // Prevents re-initialization during hot reload in development
  const isInitialized = ref(false)
  
  // Toolbar UI state
  const position = ref({ x: 0, y: 0 })
  const expanded = ref(true)
  const isPinned = ref(false)

  // Getters
  const isToolActive = computed(() => 
    (toolId: string) => settingsStore.settings.activeTools.includes(toolId)
  )

  // Add a tool
  const addTool = async (tool: Tool) => {
    tools.value.push(tool)
    console.log('[INFO] Tool added:', tool)
    if (!isInitialized.value) {
      await settingsStore.updateSettings({
        activeTools: [...settingsStore.settings.activeTools, tool.id]
      })
    }
  }

  /**
   * Initialize Tool Registry
   * 
   * Called once at application startup to register all available tools.
   * Idempotent: safe to call multiple times (useful during HMR).
   * 
   * First-time user experience: If no tools are active (fresh install),
   * activates all tools by default to showcase extension capabilities.
   * Users can then disable unwanted tools.
   * 
   * @param initialTools - Array of tool definitions with metadata and components
   */
  const initTools = async (initialTools: Tool[]) => {
    if (isInitialized.value) {
      console.log('[WARNING] Tools are already initialized')
      return
    }

    console.log('[INFO] Initializing tools:', initialTools)
    tools.value = initialTools

    // First-time setup: enable all tools for discoverability
    if (settingsStore.settings.activeTools.length === 0) {
      await settingsStore.updateSettings({
        activeTools: tools.value.map(t => t.id)
      })
      console.log('[INFO] No active tools found, activating all by default')
    }

    isInitialized.value = true
    console.log('[SUCCESS] Tools initialized')
  }

  /**
   * Toggle Tool Activation
   * 
   * Activates or deactivates a single tool and notifies the background
   * script to sync changes across all tabs.
   * 
   * @param toolId - Unique identifier of the tool to toggle
   */
  const toggleTool = async (toolId: string) => {
    await settingsStore.toggleTool(toolId)
    // Notify background to broadcast to other tabs
    sendMessage('TOOLS_UPDATED', { 
      tools: settingsStore.settings.activeTools 
    }, 'background')
  }

  /**
   * Set Active Tools (Batch Update)
   * 
   * Updates the entire set of active tools at once. Used when:
   * - Restoring settings from storage
   * - Syncing from another tab
   * - Bulk enabling/disabling via UI
   * 
   * Handles various input formats for robustness:
   * - Array of IDs (preferred)
   * - Object with IDs as values (legacy format)
   * - Single ID string
   * 
   * Validates all IDs against registered tools to prevent errors.
   */
  const setActiveTools = async (toolIds: string[] | any) => {
    const toolIdsArray = Array.isArray(toolIds) ? toolIds : 
                        typeof toolIds === 'object' ? Object.values(toolIds) : 
                        [toolIds].filter(Boolean)
    
    // Filter out invalid IDs to prevent UI errors
    const validIds = toolIdsArray.filter(id => tools.value.some(t => t.id === id))
    
    await settingsStore.updateSettings({ activeTools: validIds })
  }

  function updatePosition(newPosition: { x: number; y: number }) {
    position.value = newPosition
  }
  
  function toggleExpanded() {
    expanded.value = !expanded.value
  }
  
  function togglePinned() {
    isPinned.value = !isPinned.value
  }

  return {
    tools,
    activeTools,
    enabled,
    isInitialized,
    position,
    expanded,
    isPinned,
    initTools,
    toggleTool,
    setActiveTools,
    addTool,
    isToolActive,
    updatePosition,
    toggleExpanded,
    togglePinned
  }
}) 