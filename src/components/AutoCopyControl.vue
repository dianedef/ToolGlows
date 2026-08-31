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
                toast.add({
                  severity: 'success',
                  summary: 'Formatting',
                  detail: copyStore.settings.preserveFormatting ? 'Formatting enabled' : 'Formatting disabled',
                  life: 3000
                });
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
                toast.add({
                  severity: 'success',
                  summary: 'Source',
                  detail: copyStore.settings.includeSource ? 'Source included' : 'Source not included',
                  life: 3000
                });
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
                toast.add({
                  severity: 'success',
                  summary: 'Notifications',
                  detail: copyStore.settings.showNotifications ? 'Notifications enabled' : 'Notifications disabled',
                  life: 3000
                });
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
                toast.add({
                  severity: 'success',
                  summary: 'Alt Selection',
                  detail: copyStore.settings.enableAltSelection ? 'Alt Selection enabled' : 'Alt Selection disabled',
                  life: 3000
                });
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

// Initialize the composable
useAutoCopy()

// Exclude from dark mode
useExcludeToolGlowsBar()

onMounted(async () => {
  console.log('[DEBUG] Before loadSettings - formats:', copyStore.settings.formats)
  await copyStore.loadSettings()
  console.log('[DEBUG] After loadSettings - formats:', copyStore.settings.formats)
})

const closeDialog = () => {
  copyStore.setActive(false)
  console.log('[DEBUG] Dialog closure - formats:', copyStore.settings.formats)
  toast.add({ severity: 'info', summary: 'Auto Copy', detail: 'Settings saved', life: 3000 })
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

