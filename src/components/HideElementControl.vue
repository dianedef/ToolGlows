<template>
  <Dialog
    v-model:visible="isDialogVisible"
    :modal="true"
    :dismissableMask="true"
    header="Hide Elements"
    position="right"
    :style="{ width: '450px' }"
    @hide="closeDialog"
    appendTo="body"
  >
    <div class="toolflowz-hide-element-options">
      <div class="toolflowz-field mb-3">
        <p>This tool allows you to hide elements on the page.</p>
        
        <Message v-if="hideElementStore.error" severity="error" :closable="false" class="mb-3">
          {{ hideElementStore.error }}
        </Message>

        <!-- Selection controls -->
        <div class="selection-controls mb-4">
          <Button
            :label="elementSelector.isActive ? 'Stop Selection' : 'Select an Element'"
            :icon="elementSelector.isActive ? 'pi pi-times' : 'pi pi-eye-slash'"
            @click="toggleSelection"
            class="w-full"
            :severity="elementSelector.isActive ? 'danger' : 'primary'"
          />
        </div>

        <!-- Shortcut settings -->
        <div class="shortcut-settings mb-4">
          <h4>Keyboard Shortcut</h4>
          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="isShortcutEnabled"
              :binary="true"
            />
            <label>Enable Shortcut</label>
          </div>
          
          <div class="shortcut-input" v-if="hideElementStore.settings.enableShortcut">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-key" />
              <InputText
                v-model="shortcutInput"
                placeholder="Press keys..."
                class="w-full"
                @keydown="captureShortcut"
                @focus="isCapturingShortcut = true"
                @blur="isCapturingShortcut = false"
              />
            </span>
            <small class="text-muted">Current Shortcut : {{ hideElementStore.settings.shortcut }}</small>
          </div>
        </div>

        <!-- List of hidden elements -->
        <div v-if="domainElements.length > 0" class="hidden-elements mb-3">
          <h4>Elements Hidden on this Site</h4>
          <div
            v-for="element in domainElements"
            :key="element.selector"
            class="hidden-element-item"
          >
            <div class="hidden-element-info">
              <span class="element-name">{{ element.name || element.selector }}</span>
              <span class="timestamp">{{ formatDate(element.timestamp) }}</span>
            </div>
            <div class="hidden-element-actions">
              <Button
                icon="pi pi-eye"
                text
                rounded
                severity="secondary"
                @click="previewElement(element.selector)"
                title="Preview"
              />
              <Button
                icon="pi pi-undo"
                text
                rounded
                severity="danger"
                @click="removeElement(element.selector)"
                title="Restore"
              />
            </div>
          </div>
        </div>
        <div v-else class="no-elements">
          <p>No elements hidden on this site.</p>
          <small>Use the button above or the shortcut {{ hideElementStore.settings.shortcut }} to start hiding elements.</small>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useHideElementStore } from '@/stores/hideElement'
import { useElementSelector } from '@/composables/useElementSelector'
import { computed, onMounted, ref, onUnmounted, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Tooltip from 'primevue/tooltip'

const props = defineProps<{
  visible?: boolean,
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean],
  'update:modelValue': [value: boolean]
}>()

const hideElementStore = useHideElementStore()
const shortcutInput = ref(hideElementStore.settings.shortcut)
const isCapturingShortcut = ref(false)
const isShortcutEnabled = computed({
  get: () => hideElementStore.settings.enableShortcut,
  set: (value) => hideElementStore.toggleShortcut(value)
})

// Configuration du sélecteur d'éléments
const elementSelector = useElementSelector({
  highlightColor: 'rgba(255, 0, 0, 0.2)',
  hoverColor: 'rgba(255, 165, 0, 0.3)',
  onElementSelect: async (element) => {
    await hideElementStore.hideElement(element)
    elementSelector.stopSelecting()
    hideElementStore.settings.isSelectingElement = false
  }
})

// Synchroniser l'état de sélection avec le store
watch(() => hideElementStore.settings.isSelectingElement, (isSelecting) => {
  if (isSelecting && !elementSelector.isActive.value) {
    elementSelector.startSelecting()
  } else if (!isSelecting && elementSelector.isActive.value) {
    elementSelector.stopSelecting()
  }
})

// Liste des éléments masqués pour le domaine actuel
const domainElements = computed(() => {
  return hideElementStore.settings.hiddenElements.filter(
    el => el.domain === window.location.hostname
  )
})

const isDialogVisible = computed({
  get: () => props.modelValue ?? props.visible ?? hideElementStore.isActive,
  set: async (value) => {
    await nextTick()
    emit('update:visible', value)
    emit('update:modelValue', value)
    hideElementStore.setActive(value)
  }
})

const toggleSelection = () => {
  hideElementStore.settings.isSelectingElement = !hideElementStore.settings.isSelectingElement
}

const removeElement = async (selector: string) => {
  await hideElementStore.removeHiddenElement(selector)
  // Restore the hidden element
  const element = document.querySelector(selector)
  if (element) {
    (element as HTMLElement).style.display = ''
  }
}

const previewElement = (selector: string) => {
  const element = document.querySelector(selector)
  if (element && element instanceof HTMLElement) {
    const currentDisplay = element.style.display
    element.style.display = ''
    setTimeout(() => {
      element.style.display = currentDisplay
    }, 2000)
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const captureShortcut = (event: KeyboardEvent) => {
  if (!isCapturingShortcut.value) return

  event.preventDefault()
  event.stopPropagation()

  const keys: string[] = []
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  
  const key = event.key
  if (!['Control', 'Alt', 'Shift'].includes(key)) {
    keys.push(key.toUpperCase())
  }

  if (keys.length > 0) {
    const shortcut = keys.join('+')
    shortcutInput.value = shortcut
    hideElementStore.updateShortcut(shortcut)
  }
}

const closeDialog = async () => {
  await nextTick()
  isDialogVisible.value = false
  elementSelector.stopSelecting()
}

// Tooltip directive
const vTooltip = Tooltip

onMounted(async () => {
  await hideElementStore.loadSettings()
  await nextTick()
  
  // Add global shortcut handler
  document.addEventListener('keydown', hideElementStore.handleShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', hideElementStore.handleShortcut)
})
</script>

<style scoped>
.toolflowz-hide-element-options {
  padding: 1rem;
}

:deep(.p-message) {
  width: 100%;
}

.hidden-elements {
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.hidden-element-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.hidden-element-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.element-name {
  font-family: monospace;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.hidden-element-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.no-elements {
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;

  p {
    margin-bottom: 0.5rem;
  }
}

.shortcut-settings {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;

  h4 {
    margin: 0 0 1rem 0;
  }
}

.shortcut-input {
  margin-top: 1rem;

  small {
    display: block;
    margin-top: 0.5rem;
  }
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
}
</style> 