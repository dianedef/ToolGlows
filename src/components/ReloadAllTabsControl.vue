<template>
  <Dialog
    v-model:visible="isDialogVisible"
    :modal="true"
    :dismissable-mask="true"
    header="Recharger tous les onglets"
    position="right"
    :style="{ width: '350px' }"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="toolglows-reload-tabs-options">
      <div class="toolglows-field mb-3">
        <p>Cette action va recharger tous les onglets ouverts dans votre navigateur.</p>

        <Message
          v-if="reloadAllTabsStore.error"
          severity="error"
          :closable="false"
          class="mb-3"
        >
          {{ reloadAllTabsStore.error }}
        </Message>

        <!-- Paramètres des raccourcis -->
        <div class="shortcut-settings mb-4">
          <h4>Raccourci clavier</h4>
          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="isShortcutEnabled"
              :binary="true"
            />
            <label>Activer le raccourci</label>
          </div>

          <div
            v-if="isShortcutEnabled"
            class="shortcut-input"
          >
            <span class="p-input-icon-left w-full">
              <i class="pi pi-key" />
              <InputText
                v-model="shortcutInput"
                placeholder="Appuyez sur les touches..."
                class="w-full"
                @keydown="captureShortcut"
                @focus="isCapturingShortcut = true"
                @blur="isCapturingShortcut = false"
              />
            </span>
            <small class="text-muted">Raccourci actuel : {{ shortcutInput }}</small>
          </div>
        </div>

        <Button
          label="Recharger tous les onglets"
          icon="pi pi-refresh"
          :loading="reloadAllTabsStore.isLoading"
          class="w-full"
          @click="handleReloadAllTabs"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useReloadAllTabsStore } from '@/stores/reloadAllTabs'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'

const props = defineProps<{
  visible?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const reloadAllTabsStore = useReloadAllTabsStore()
const isShortcutEnabled = computed({
  get: () => reloadAllTabsStore.settings.enableShortcut,
  set: (value) => reloadAllTabsStore.toggleShortcut(value)
})
const shortcutInput = ref(reloadAllTabsStore.settings.shortcut)
const isCapturingShortcut = ref(false)

const isDialogVisible = computed({
  get: () => props.visible || reloadAllTabsStore.isActive,
  set: (value) => {
    emit('update:visible', value)
    reloadAllTabsStore.setActive(value)
  }
})

const closeDialog = () => {
  isDialogVisible.value = false
}

const handleReloadAllTabs = async () => {
  try {
    await reloadAllTabsStore.reloadAllTabs()
    if (!reloadAllTabsStore.error) {
      closeDialog()
    }
  } catch (error) {
    console.error('[ERROR] Failed to reload tabs:', error)
  }
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
    reloadAllTabsStore.updateShortcut(shortcut)
  }
}

onMounted(async () => {
  await reloadAllTabsStore.loadSettings()

  // Ajouter le gestionnaire de raccourci global
  document.addEventListener('keydown', reloadAllTabsStore.handleShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', reloadAllTabsStore.handleShortcut)
})
</script>

<style scoped>
.toolglows-reload-tabs-options {
  padding: 1rem;
}

:deep(.p-message) {
  width: 100%;
}

.shortcut-settings {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;

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
