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

    tools.value = initialTools

    // Load active tools from storage
    try {
      const result = await chrome.storage.sync.get('toolflowzActiveTools')

      // Convert to array if it's an object
      let storedTools = result.toolflowzActiveTools
      if (storedTools && !Array.isArray(storedTools)) {
        storedTools = Object.values(storedTools)
      }

      // Filter valid tools
      const validTools = storedTools?.filter((id: string) => 
        tools.value.some(tool => tool.id === id)
      ) || []

      // Set active tools
      activeTools.value = validTools.length > 0 ? validTools : tools.value.map(t => t.id)
      console.log('[SUCCESS] Active tools initialized:', activeTools.value)
    } catch (error) {
      console.error('[ERROR] Failed to load active tools:', error)
      activeTools.value = tools.value.map(t => t.id)
    }

    isInitialized.value = true
    console.log('[SUCCESS] Store initialized with tools:', {
      tools: tools.value,
      activeTools: activeTools.value,
      isInitialized: isInitialized.value
    })
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
  const setActiveTools = async (toolIds: string[]) => {
    console.log('[INFO] Setting active tools:', toolIds)
    
    const validIds = toolIds.filter(id => tools.value.some(t => t.id === id))
    console.log('[SUCCESS] Valid IDs:', validIds)
    
    activeTools.value = validIds
    console.log('[SUCCESS] New active tools set:', activeTools.value)
    await debouncedSaveToStorage()

    // Synchronize with background
    sendMessage('TOOLS_UPDATED', { tools: activeTools.value }, 'background')
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