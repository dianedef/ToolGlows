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

  // Sauvegarder les outils dans le stockage avec debounce
  const debouncedSaveToStorage = useDebounceFn(async () => {
    try {
      await chrome.storage.sync.set({ toolflowzActiveTools: activeTools.value })
      console.log('✅ Outils actifs sauvegardés dans le stockage:', activeTools.value)
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des outils actifs:', error)
    }
  }, 1000)

  // Getters
  const isToolActive = computed(() => (toolId: string) => activeTools.value.includes(toolId))

  // Ajouter un outil
  const addTool = async (tool: Tool) => {
    tools.value.push(tool)
    console.log('➕ Outil ajouté:', tool)
    if (!isInitialized.value) {
      activeTools.value.push(tool.id)
    }
  }

  // Initialiser les outils
  const initTools = async (initialTools: Tool[]) => {
    if (isInitialized.value) {
      console.log('⚠️ Les outils sont déjà initialisés')
      return
    }

    tools.value = initialTools

    // Charger les outils actifs depuis le stockage
    try {
      const result = await chrome.storage.sync.get('toolflowzActiveTools')

      // Convertir en tableau si c'est un objet
      let storedTools = result.toolflowzActiveTools
      if (storedTools && !Array.isArray(storedTools)) {
        storedTools = Object.values(storedTools)
      }

      // Filtrer les outils valides
      const validTools = storedTools?.filter((id: string) => 
        tools.value.some(tool => tool.id === id)
      ) || []

      // Définir les outils actifs
      activeTools.value = validTools.length > 0 ? validTools : tools.value.map(t => t.id)
      console.log('✅ Outils actifs initialisés:', activeTools.value)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des outils actifs:', error)
      activeTools.value = tools.value.map(t => t.id)
    }

    isInitialized.value = true
    console.log('✅ Store initialisé avec les outils:', {
      tools: tools.value,
      activeTools: activeTools.value,
      isInitialized: isInitialized.value
    })
  }

  // Toggle un outil individuel
  const toggleTool = async (toolId: string) => {
    console.log('🔄 Toggle de l\'outil:', toolId)
    const index = activeTools.value.indexOf(toolId)
    
    if (index === -1) {
      console.log('➕ Activation de l\'outil')
      activeTools.value.push(toolId)
    } else {
      console.log('➖ Désactivation de l\'outil')
      activeTools.value.splice(index, 1)
    }

    console.log('📦 État des outils actifs après toggle:', activeTools.value)
    await debouncedSaveToStorage()

    // Synchroniser avec le background
    sendMessage('TOOLS_UPDATED', { tools: activeTools.value }, 'background')
  }

  // Définir les outils actifs
  const setActiveTools = async (toolIds: string[]) => {
    console.log('🔄 Définition des outils actifs:', toolIds)
    
    // Filtrer pour ne garder que les IDs valides
    const validIds = toolIds.filter(id => tools.value.some(t => t.id === id))
    console.log('✅ IDs valides:', validIds)
    
    activeTools.value = validIds
    console.log('📦 Nouveaux outils actifs définis:', activeTools.value)
    await debouncedSaveToStorage()

    // Synchroniser avec le background
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