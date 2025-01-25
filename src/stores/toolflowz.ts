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
  const tools = ref<Tool[]>([])
  const activeTools = computed(() => settingsStore.settings.activeTools)
  const enabled = ref(true)
  const isInitialized = ref(false)
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

  // Initialize tools
  const initTools = async (initialTools: Tool[]) => {
    if (isInitialized.value) {
      console.log('[WARNING] Tools are already initialized')
      return
    }

    console.log('[INFO] Initializing tools:', initialTools)
    tools.value = initialTools

    // Si pas d'outils actifs, activer tous par défaut
    if (settingsStore.settings.activeTools.length === 0) {
      await settingsStore.updateSettings({
        activeTools: tools.value.map(t => t.id)
      })
      console.log('[INFO] No active tools found, activating all by default')
    }

    isInitialized.value = true
    console.log('[SUCCESS] Tools initialized')
  }

  // Toggle individual tool
  const toggleTool = async (toolId: string) => {
    await settingsStore.toggleTool(toolId)
    // Notification au background
    sendMessage('TOOLS_UPDATED', { 
      tools: settingsStore.settings.activeTools 
    }, 'background')
  }

  // Set active tools
  const setActiveTools = async (toolIds: string[] | any) => {
    const toolIdsArray = Array.isArray(toolIds) ? toolIds : 
                        typeof toolIds === 'object' ? Object.values(toolIds) : 
                        [toolIds].filter(Boolean)
    
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