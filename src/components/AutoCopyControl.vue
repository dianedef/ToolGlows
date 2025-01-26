<template>
  <div>
    <Dialog
      v-model:visible="copyStore.isActive"
      :header="'Auto Copy'"
      :modal="true"
      position="right"
      :style="{ width: '500px' }"
      :dismissableMask="true"
      @hide="closeDialog"
    >
      <div class="copy-options">
        <div class="field mb-3">
          <h4>Format actif</h4>
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
                  <small v-if="format.shortcut" class="format-shortcut">
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
                  summary: 'Mise en forme', 
                  detail: copyStore.settings.preserveFormatting ? 'Mise en forme activée' : 'Mise en forme désactivée',
                  life: 3000 
                });
              }"
            />
            <label>Conserver la mise en forme</label>
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
                  detail: copyStore.settings.includeSource ? 'Source incluse' : 'Source non incluse',
                  life: 3000 
                });
              }"
            />
            <label>Inclure la source</label>
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
                  detail: copyStore.settings.showNotifications ? 'Notifications activées' : 'Notifications désactivées',
                  life: 3000 
                });
              }"
            />
            <label>Afficher les notifications</label>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useAutoCopy } from '@/composables/useAutoCopy'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'

const copyStore = useAutoCopyStore()
const toast = useToast()

// Initialiser le composable
useAutoCopy()

onMounted(async () => {
  await copyStore.loadSettings()
})

const closeDialog = () => {
  copyStore.isActive = false
  toast.add({ severity: 'info', summary: 'Auto Copy', detail: 'Paramètres sauvegardés', life: 3000 })
}
</script>

<style scoped>
.copy-options {
  padding: 1rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field h4 {
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.formats-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.format-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  cursor: pointer;
  transition: all 0.2s;
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
  gap: 0.5rem;
}

.format-icon {
  font-size: 1.2rem;
}

.format-details {
  display: flex;
  flex-direction: column;
}

.format-name {
  font-weight: 500;
}

.format-shortcut {
  font-size: 0.875rem;
  opacity: 0.8;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style> 