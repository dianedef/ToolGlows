import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import { useSettingsStore } from './settings'
import { useDebounceFn } from '@vueuse/core'
import type { Tool } from '@/types/tools'
import { computed } from 'vue'
import { sendMessage } from 'webext-bridge/content-script'
import { i18n } from '@/utils/i18n'

export const useToolflowzStore = defineStore('toolflowz', () => {
  const t = i18n.global.t
  
  const tools = ref<Tool[]>([])
  const activeTools = ref<string[]>([])
  const enabled = ref(true)
  const isInitialized = ref(false)
  const position = ref({ x: 0, y: 0 })
  const expanded = ref(true)
  const isPinned = ref(false)

  // Save tools to storage with debounce
  const debouncedSaveToStorage = useDebounceFn(async () => {
    try {
      await chrome.storage.sync.set({ toolflowzActiveTools: activeTools.value })
      console.log('[SUCCESS] Active tools saved to storage:', activeTools.value)
    } catch (error) {
      console.error('[ERROR] Failed to save active tools:', error)
    }
  }, 1000)

  // Getters
  const isToolActive = computed(() => (toolId: string) => activeTools.value.includes(toolId))

  // Add a tool
  const addTool = async (tool: Tool) => {
    tools.value.push(tool)
    console.log('[INFO] Tool added:', tool)
    if (!isInitialized.value) {
      activeTools.value.push(tool.id)
    }
  }

  // Initialize tools
  const initTools = async (initialTools: Tool[]) => {
    if (isInitialized.value) {
      console.log('[WARNING] Tools are already initialized')
      return
    }

    console.log('[INFO] Initializing tools:', initialTools)
    tools.value = initialTools

    // Charge les outils actifs depuis le storage
    try {
      const result = await chrome.storage.sync.get('toolflowzActiveTools')
      if (result.toolflowzActiveTools) {
        await setActiveTools(result.toolflowzActiveTools)
        console.log('[SUCCESS] Active tools loaded from storage')
      } else {
        // Active tous les outils par défaut
        await setActiveTools(tools.value.map(t => t.id))
        console.log('[INFO] No active tools found, activating all by default')
      }
    } catch (error) {
      console.error('[ERROR] Failed to load active tools:', error)
    }

    isInitialized.value = true
    console.log('[SUCCESS] Tools initialized')
  }

  // Toggle individual tool
  const toggleTool = async (toolId: string) => {
    console.log('[INFO] Toggling tool:', toolId)
    const index = activeTools.value.indexOf(toolId)
    
    if (index === -1) {
      console.log('[INFO] Activating tool')
      activeTools.value.push(toolId)
    } else {
      console.log('[INFO] Deactivating tool')
      activeTools.value.splice(index, 1)
    }

    console.log('[INFO] Active tools state after toggle:', activeTools.value)
    await debouncedSaveToStorage()

    // Synchronize with background
    sendMessage('TOOLS_UPDATED', { tools: activeTools.value }, 'background')
  }

  // Set active tools
  const setActiveTools = async (toolIds: string[] | any) => {
    console.log('[INFO] Setting active tools:', toolIds)
    
    // Assure que toolIds est un tableau
    const toolIdsArray = Array.isArray(toolIds) ? toolIds : 
                        typeof toolIds === 'object' ? Object.values(toolIds) : 
                        [toolIds].filter(Boolean)
    
    console.log('[INFO] Normalized tool IDs:', toolIdsArray)
    
    // Filtre les IDs valides
    const validIds = toolIdsArray.filter(id => tools.value.some(t => t.id === id))
    console.log('[INFO] Valid tool IDs:', validIds)
    
    // Met à jour les outils actifs
    activeTools.value = validIds
    console.log('[SUCCESS] Active tools updated:', activeTools.value)

    // Sauvegarde dans le storage
    try {
      await chrome.storage.sync.set({ toolflowzActiveTools: activeTools.value })
      console.log('[SUCCESS] Active tools saved to storage')
    } catch (error) {
      console.error('[ERROR] Failed to save active tools to storage:', error)
    }
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