<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :dismissableMask="true"
    header="⚡ Actions rapides"
    class="quick-actions-dialog"
    @hide="closeDialog"
  >
    <div class="quick-actions-content">
      <div class="shortcuts-section">
        <h3>🎯 Raccourcis clavier</h3>
        <div v-for="shortcut in shortcuts" :key="shortcut.id" class="shortcut-item">
          <span class="shortcut-key">{{ shortcut.key }}</span>
          <span class="shortcut-description">{{ shortcut.description }}</span>
        </div>
      </div>
      
      <div class="actions-section">
        <h3>⚡ Actions disponibles</h3>
        <div v-for="category in actions" :key="category.category">
          <h4>{{ category.category }}</h4>
          <div 
            v-for="action in category.actions" 
            :key="action.id" 
            class="action-item"
            @click="executeAction(action.id)"
            role="button"
            tabindex="0"
          >
            <i :class="action.icon" class="action-icon"></i>
            <span class="action-name">{{ action.name }}</span>
            <span class="action-description">{{ action.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useQuickActionsStore } from '@/stores/quickActions'
import type { QuickAction } from '@/types/quickActions'

const visible = ref(false)
const quickActionsStore = inject('quickActionsStore') as ReturnType<typeof useQuickActionsStore>

if (!quickActionsStore) {
  throw new Error('Le store quickActions n\'a pas été injecté')
}

// Définition des props
const props = defineProps<{
  modelValue: boolean
}>()

// Définition des émissions
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// Gestion de la visibilité
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const closeDialog = () => {
  emit('update:modelValue', false)
}

interface ShortcutItem {
  key: string
  description: string
  id: string
}

interface ActionItem {
  id: string
  name: string
  description: string
  icon: string
}

interface CategoryActions {
  category: string
  actions: ActionItem[]
}

// Récupérer les raccourcis et les actions
const shortcuts = computed<ShortcutItem[]>(() => {
  const allShortcuts: ShortcutItem[] = []
  for (const [actionId, key] of Object.entries(quickActionsStore.shortcuts)) {
    const action = quickActionsStore.allActions.find((a: QuickAction) => a.id === actionId)
    if (action) {
      allShortcuts.push({
        id: actionId,
        key,
        description: action.label
      })
    }
  }
  return allShortcuts
})

const actions = computed<CategoryActions[]>(() => {
  return Array.from(quickActionsStore.actionsByCategory).map(([category, categoryActions]: [string, QuickAction[]]) => ({
    category,
    actions: categoryActions.map((action: QuickAction) => ({
      id: action.id,
      name: action.label,
      description: action.shortcut ? `Raccourci: ${action.shortcut}` : 'Pas de raccourci',
      icon: action.icon
    }))
  }))
})

// Exécuter une action
const executeAction = async (actionId: string) => {
  try {
    await quickActionsStore.executeAction(actionId)
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'action:', error)
  }
}
</script>

<style scoped>
.quick-actions-dialog {
  min-width: 500px;
}

.quick-actions-content {
  padding: 1rem;
}

.shortcuts-section,
.actions-section {
  margin-bottom: 2rem;
}

h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.shortcut-item,
.action-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: var(--surface-ground);
}

.shortcut-key {
  background-color: var(--surface-card);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-right: 1rem;
  font-family: monospace;
}

.action-name {
  font-weight: bold;
  margin-right: 1rem;
}

.shortcut-description,
.action-description {
  color: var(--text-color-secondary);
}

.action-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
  color: var(--primary-color);
}

h4 {
  margin: 1rem 0 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.action-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: var(--surface-ground);
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:hover {
  background-color: var(--surface-hover);
}

.action-item:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: -2px;
}
</style> 