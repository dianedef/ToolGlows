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
          <h4>Active Format</h4>
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
          <h4>Options</h4>
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
                notifySetting('Alt Selection', copyStore.settings.enableAltSelection ? 'Alt Selection enabled' : 'Alt Selection disabled');
              }"
            />
            <label>Enable Alt Selection</label>
          </div>
        </div>
      </div>
    </ToolGlowsDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useAutoCopy } from '@/composables/useAutoCopy'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useExcludeToolGlowsBar } from '@/composables/excludeToolGlowsBar'

const copyStore = useAutoCopyStore()
const toast = useToast()

const notifySetting = (summary: string, detail: string) => {
  if (!copyStore.settings.showNotifications) return
  toast.add({ severity: 'success', summary, detail, life: 3000 })
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

