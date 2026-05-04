<template>
  <div class="shortcuts-config">
    <div 
      v-for="{ category, actions } in actionCategories"
      :key="category"
      class="shortcut-category"
    >
      <h3>{{ category }}</h3>
      <div 
        v-for="action in actions"
        :key="action.id"
        class="shortcut-item"
      >
        <div class="action-info">
          <span class="icon">{{ action.icon }}</span>
          <span class="label">{{ action.label }}</span>
        </div>
        <ShortcutInput
          :value="shortcuts[action.id]"
          @update="updateShortcut(action.id, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useQuickActionsStore } from '@/stores/quickActions'

const quickActionsStore = useQuickActionsStore()
const { actionsByCategory, shortcuts } = storeToRefs(quickActionsStore)
const { updateShortcut } = quickActionsStore

const actionCategories = computed(() => Array.from(actionsByCategory.value.entries()).map(([category, actions]) => ({
  category,
  actions
})))
</script>
