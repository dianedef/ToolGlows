<template>
  <ToolGlowsDialog
    v-model:visible="isDialogVisible"
    :modal="!elementSelector.isActive.value"
    :dismissable-mask="!elementSelector.isActive.value"
    header="Hide Elements"
    position="right"
    :style="{ width: '450px' }"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="toolglows-hide-element-options">
      <div class="toolglows-field mb-3">
        <p>This tool allows you to hide elements on the page.</p>

        <Message
          v-if="hideElementStore.error"
          severity="error"
          :closable="false"
          class="mb-3"
        >
          {{ hideElementStore.error }}
        </Message>

        <!-- Selection controls -->
        <div class="selection-controls mb-4">
          <Button
            :label="elementSelector.isActive ? 'Stop Selection' : 'Select an Element'"
            :icon="elementSelector.isActive ? 'pi pi-times' : 'pi pi-eye-slash'"
            class="w-full"
            :severity="elementSelector.isActive ? 'danger' : 'primary'"
            @click="toggleSelection"
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

          <div
            v-if="hideElementStore.settings.enableShortcut"
            class="shortcut-input"
          >
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
        <div
          v-if="domainElements.length > 0"
          class="hidden-elements mb-3"
        >
          <div class="hidden-elements-header">
            <h4>Elements Hidden on this Site</h4>
            <Button
              label="Restore all"
              icon="pi pi-refresh"
              text
              severity="danger"
              @click="hideElementStore.resetHiddenElementsForCurrentSite"
            />
          </div>
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
                title="Preview"
                @click="previewElement(element.selector)"
              />
              <Button
                icon="pi pi-undo"
                text
                rounded
                severity="danger"
                title="Restore"
                @click="removeElement(element.selector)"
              />
            </div>
          </div>
        </div>
        <div
          v-else
          class="no-elements"
        >
          <p>No elements hidden on this site.</p>
          <small>Use the button above or the shortcut {{ hideElementStore.settings.shortcut }} to start hiding elements.</small>
        </div>
      </div>
    </div>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { useHideElementStore } from '@/stores/hideElement'
import { useElementSelector } from '@/composables/useElementSelector'
import { computed, onMounted, ref, onUnmounted, watch, nextTick } from 'vue'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
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
  onElementSelect: async (element) => {
    await hideElementStore.hideElement(element)
  }
})

// Synchroniser l'état de sélection avec le store
watch(() => hideElementStore.settings.isSelectingElement, (isSelecting) => {
  if (isSelecting && !elementSelector.isActive.value) {
    elementSelector.startSelecting()
  } else if (!isSelecting && elementSelector.isActive.value) {
    elementSelector.stopSelecting()
  }
  hideElementStore.applyHiddenElements()
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
  hideElementStore.settings.isSelectingElement = false
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
.toolglows-hide-element-options {
  padding: var(--tg-space-4);
}

:deep(.p-message) {
  width: var(--tg-full-width);
}

.hidden-elements {
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: var(--tg-space-4);
}

.hidden-element-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  margin-bottom: var(--tg-space-2);

  &:last-child {
    margin-bottom: 0;
  }
}

.hidden-elements-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h4 {
    margin-bottom: 0;
  }
}

.hidden-element-info {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-1);
  flex: 1;
  min-width: 0;
}

.element-name {
  font-family: monospace;
  font-size: var(--tg-text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timestamp {
  font-size: var(--tg-text-sm);
  color: var(--text-color-secondary);
}

.hidden-element-actions {
  display: flex;
  gap: var(--tg-space-2);
  margin-left: var(--tg-space-4);
}

.no-elements {
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;

  p {
    margin-bottom: var(--tg-space-2);
  }
}

.shortcut-settings {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: var(--tg-space-4);

  h4 {
    margin: 0 0 1rem 0;
  }
}

.shortcut-input {
  margin-top: var(--tg-space-4);

  small {
    display: block;
    margin-top: var(--tg-space-2);
  }
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: var(--tg-text-lg);
}
</style>
