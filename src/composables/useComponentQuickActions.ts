import { onMounted, onUnmounted } from 'vue'
import { useQuickActionsStore } from '@/stores/quickActions'
import type { QuickAction } from '@/types/quickActions'

export function useComponentQuickActions(componentId: string, actions: QuickAction[]) {
  const quickActionsStore = useQuickActionsStore()

  onMounted(() => {
    quickActionsStore.registerActions({
      componentId,
      actions
    })
  })

  return {
    executeAction: quickActionsStore.executeAction
  }
} 