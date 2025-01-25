import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { QuickAction, ComponentQuickActions } from '@/types/quickActions'

export const useQuickActionsStore = defineStore('quickActions', () => {
  const registeredActions = ref<ComponentQuickActions[]>([])
  const shortcuts = ref<Record<string, string>>({})

  // Toutes les actions disponibles
  const allActions = computed(() => 
    registeredActions.value.flatMap(component => 
      component.actions.map(action => ({
        ...action,
        componentId: component.componentId
      }))
    )
  )

  // Grouper les actions par catégorie
  const actionsByCategory = computed(() => {
    const grouped = new Map<string, QuickAction[]>()
    
    allActions.value.forEach(action => {
      if (!grouped.has(action.category)) {
        grouped.set(action.category, [])
      }
      grouped.get(action.category)?.push(action)
    })
    
    return grouped
  })

  // Enregistrer les actions d'un composant
  const registerActions = (componentActions: ComponentQuickActions) => {
    registeredActions.value.push(componentActions)
  }

  // Mettre à jour un raccourci
  const updateShortcut = (actionId: string, shortcut: string) => {
    shortcuts.value[actionId] = shortcut
  }

  // Exécuter une action
  const executeAction = async (actionId: string) => {
    const action = allActions.value.find(a => a.id === actionId)
    if (action) {
      await action.handler()
    }
  }

  return {
    registeredActions,
    shortcuts,
    allActions,
    actionsByCategory,
    registerActions,
    updateShortcut,
    executeAction
  }
}) 