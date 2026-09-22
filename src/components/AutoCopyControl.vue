<template>
  <div>
    <ToolGlowsDialog
      v-model:visible="copyStore.isActive"
      :header="'Auto Copy'"
      :modal="true"
      position="right"
      :style="{ width: '500px' }"
      :dismissable-mask="true"
      @hide="closeDialog"
    >
      <div class="copy-options">
        <div class="field mb-3">
          <h4>Formatted copy shortcuts</h4>
          <p class="section-description">
            Automatic copy always keeps the exact selected text. These formats apply only to their keyboard shortcuts.
          </p>
          <div class="formats-list">
            <div
              v-for="format in copyStore.settings.formats"
              :key="format.id"
              class="format-item"
              :class="{ 'active': format.id === copyStore.settings.activeFormat }"
              @click="copyStore.setActiveFormat(format.id)"
            >
              <div class="format-info">
                <span class="format-icon">{{ format.icon }}</span>
                <div class="format-details">
                  <span class="format-name">{{ format.name }}</span>
                  <small
                    v-if="format.shortcut"
                    class="format-shortcut"
                  >
                    {{ format.shortcut }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="field mb-3">
          <h4>Shortcut options</h4>
          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="copyStore.settings.preserveFormatting"
              :binary="true"
              @change="() => {
                copyStore.saveSettings();
                notifySetting('Formatting', copyStore.settings.preserveFormatting ? 'Formatting enabled' : 'Formatting disabled');
              }"
            />
            <label>Preserve Formatting</label>
          </div>

          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="copyStore.settings.includeSource"
              :binary="true"
              @change="() => {
                copyStore.saveSettings();
                notifySetting('Source', copyStore.settings.includeSource ? 'Source included' : 'Source not included');
              }"
            />
            <label>Include Source</label>
          </div>

          <h4 class="feedback-heading">Automatic copy</h4>

          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="copyStore.settings.showNotifications"
              :binary="true"
              @change="() => {
                copyStore.saveSettings();
                notifySetting('Notifications', 'Notifications enabled');
              }"
            />
            <label>Show Notifications</label>
          </div>

          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="copyStore.settings.enableAltSelection"
              :binary="true"
              @change="() => {
                copyStore.saveSettings();
                notifySetting('Element Selection', copyStore.settings.enableAltSelection ? 'Alt selection and multi-selection enabled' : 'Element selection disabled');
              }"
            />
            <label>Enable Alt and multi-selection</label>
          </div>

          <div class="multi-shortcut-setting">
            <label class="shortcut-setting-label" for="auto-copy-multi-shortcut">Multi-selection shortcut</label>
            <Button
              id="auto-copy-multi-shortcut"
              type="button"
              severity="secondary"
              outlined
              :label="isCapturingMultiSelectionShortcut ? 'Press a key or combination…' : copyStore.settings.multiSelectionShortcut"
              :aria-pressed="isCapturingMultiSelectionShortcut"
              aria-describedby="auto-copy-multi-shortcut-help"
              data-toolglows-shortcut-capture
              @click="isCapturingMultiSelectionShortcut = true"
              @keydown="captureMultiSelectionShortcut"
              @keyup="captureStandaloneModifier"
            />
            <small id="auto-copy-multi-shortcut-help" class="section-description">
              Hold the shortcut for 600 ms, then click the blocks to collect. Press Escape to exit. Alt remains reserved for element selection and format shortcuts.
            </small>
          </div>
        </div>
      </div>
    </ToolGlowsDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useAutoCopy } from '@/composables/useAutoCopy'
import { normalizeKeyboardShortcut, shortcutFromKeyEvent, standaloneModifierFromKeyUp } from '@/utils/keyboardShortcut'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useExcludeToolGlowsBar } from '@/composables/excludeToolGlowsBar'

const copyStore = useAutoCopyStore()
const toast = useToast()
const isCapturingMultiSelectionShortcut = ref(false)

const notifySetting = (summary: string, detail: string) => {
  if (!copyStore.settings.showNotifications) return
  toast.add({ severity: 'success', summary, detail, life: 3000 })
}

const saveMultiSelectionShortcut = (shortcut: string) => {
  const normalized = normalizeKeyboardShortcut(shortcut)
  if (!normalized) return
  copyStore.setMultiSelectionShortcut(normalized)
  isCapturingMultiSelectionShortcut.value = false
  notifySetting('Shortcut updated', `Multi-selection now uses ${normalized}`)
}

const captureMultiSelectionShortcut = (event: KeyboardEvent) => {
  if (!isCapturingMultiSelectionShortcut.value) return
  if (event.key === 'Tab') {
    isCapturingMultiSelectionShortcut.value = false
    return
  }

  event.preventDefault()
  event.stopPropagation()
  if (event.key === 'Escape') {
    isCapturingMultiSelectionShortcut.value = false
    return
  }

  const shortcut = shortcutFromKeyEvent(event)
  if (shortcut) saveMultiSelectionShortcut(shortcut)
}

const captureStandaloneModifier = (event: KeyboardEvent) => {
  if (!isCapturingMultiSelectionShortcut.value) return
  const shortcut = standaloneModifierFromKeyUp(event)
  if (shortcut) saveMultiSelectionShortcut(shortcut)
}

// Initialize the composable
useAutoCopy()

// Exclude from dark mode
useExcludeToolGlowsBar()

onMounted(async () => {
  await copyStore.loadSettings()
})

const closeDialog = () => {
  copyStore.setActive(false)
}
</script>

<style scoped>
.copy-options {
  padding: var(--tg-space-4);
}

.field {
  margin-bottom: var(--tg-space-5);
}

.field h4 {
  margin-bottom: var(--tg-space-3);
  color: var(--text-color);
}

.section-description {
  margin: 0 0 var(--tg-space-3);
  color: var(--tg-text-secondary);
}

.feedback-heading {
  margin-top: var(--tg-space-5);
}

.multi-shortcut-setting {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--tg-space-2);
  margin-top: var(--tg-space-4);
}

.formats-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.format-item {
  display: flex;
  align-items: center;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
  cursor: pointer;
  transition: var(--tg-transition-all-fast);
}

.format-item:hover {
  background: var(--surface-hover);
}

.format-item.active {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.format-info {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.format-icon {
  font-size: var(--tg-size-tool-icon);
}

.format-details {
  display: flex;
  flex-direction: column;
}

.format-name {
  font-weight: 500;
}

.format-shortcut {
  font-size: var(--tg-size-icon-sm);
  opacity: 0.8;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}
</style>

