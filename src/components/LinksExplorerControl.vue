<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'🔗 Explorateur de liens'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    :maximizable="true"
    :dismissableMask="true"
    class="toolflowz-links-explorer-dialog"
  >
    <div class="toolflowz-links-explorer-content">
      <!-- Paramètres -->
      <div class="toolflowz-links-explorer-settings">
        <div class="toolflowz-settings-group">
          <h3>🎯 Type de liens</h3>
          <div class="toolflowz-settings-row">
            <div class="toolflowz-checkbox-wrapper">
              <Checkbox
                v-model="settings.includeInternal"
                :binary="true"
                inputId="includeInternal"
              />
              <label for="includeInternal">Liens internes</label>
            </div>

            <div class="toolflowz-checkbox-wrapper">
              <Checkbox
                v-model="settings.includeExternal"
                :binary="true"
                inputId="includeExternal"
              />
              <label for="includeExternal">Liens externes</label>
            </div>
          </div>
        </div>

        <div class="toolflowz-settings-group">
          <h3>⚙️ Options</h3>
          <div class="toolflowz-settings-row">
            <div class="toolflowz-depth-control">
              <label for="maxDepth">Profondeur max:</label>
              <InputNumber
                v-model="settings.maxDepth"
                :min="1"
                :max="5"
                inputId="maxDepth"
                class="toolflowz-depth-input"
              />
            </div>
            
            <div class="toolflowz-format-control">
              <Checkbox
                v-model="settings.useMarkdown"
                :binary="true"
                inputId="useMarkdown"
              />
              <div class="toolflowz-label-with-hint">
                <label for="useMarkdown">Format Markdown</label>
                <small class="toolflowz-format-hint">{{ settings.useMarkdown ? '(avec titres)' : '(liens uniquement)' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="toolflowz-links-explorer-actions">
        <Button
          @click="exploreLinks"
          icon="pi pi-search"
          label="Explorer"
          :loading="isLoading"
          class="toolflowz-action-button"
        />
        <Button
          @click="exploreDeeper"
          icon="pi pi-arrow-down"
          label="Explorer plus profond"
          :disabled="settings.currentDepth >= settings.maxDepth || isLoading"
          class="toolflowz-action-button"
        />
        <Button
          @click="handleCopy"
          icon="pi pi-copy"
          label="Copier tous"
          :disabled="!links.length"
          class="toolflowz-action-button"
        />
      </div>

      <!-- Liste des liens -->
      <div class="toolflowz-links-list" v-if="links.length">
        <DataTable :value="links" :scrollable="true" scrollHeight="400px">
          <Column field="title" header="Titre">
            <template #body="{ data }">
              {{ data.title || 'Sans titre' }}
            </template>
          </Column>
          <Column field="url" header="URL">
            <template #body="{ data }">
              <a :href="data.url" target="_blank">{{ data.url }}</a>
            </template>
          </Column>
          <Column field="isExternal" header="Type">
            <template #body="{ data }">
              {{ data.isExternal ? 'Externe' : 'Interne' }}
            </template>
          </Column>
          <Column field="depth" header="Profondeur" class="toolflowz-text-center">
            <template #body="{ data }">
              <div class="toolflowz-text-center">{{ data.depth }}</div>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="toolflowz-no-links">
        Aucun lien trouvé. Lancez l'exploration pour commencer !
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useLinksExplorer } from '@/composables/useLinksExplorer'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps<{
  visible?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const toast = useToast()
const dialogVisible = ref(props.visible)

const {
  links,
  isLoading,
  settings,
  exploreLinks,
  exploreDeeper,
  copyAllLinks,
  loadSettings
} = useLinksExplorer()

onMounted(async () => {
  await loadSettings()
})

watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const handleCopy = async () => {
  const success = await copyAllLinks()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Les liens ont été copiés dans le presse-papier',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de copier les liens',
      life: 3000
    })
  }
}
</script>

<style scoped>
.toolflowz-links-explorer-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolflowz-links-explorer-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolflowz-settings-group {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1.25rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--text-color);
    font-weight: 600;
  }
}

.toolflowz-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.toolflowz-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;

  :deep(.p-checkbox) {
    width: 1.5rem;
    height: 1.5rem;
  }

  :deep(.p-checkbox-box) {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
  }

  :deep(.p-checkbox-icon) {
    font-size: 1rem;
  }

  label {
    font-weight: 500;
    user-select: none;
  }
}

.toolflowz-depth-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;

  label {
    font-weight: 500;
  }

  .toolflowz-depth-input {
    width: 5rem;
  }
}

.toolflowz-format-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;
}

.toolflowz-label-with-hint {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toolflowz-format-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.toolflowz-links-explorer-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolflowz-links-list {
  max-height: 400px;
  overflow-y: auto;
}

.toolflowz-no-links {
  text-align: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

.toolflowz-text-center {
  text-align: center;
}

:deep(.toolflowz-action-button) {
  background-color: var(--primary-color) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.25rem !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

:deep(.toolflowz-action-button:hover) {
  background-color: var(--primary-color) !important;
  filter: brightness(1.1) !important;
  transform: translateY(-1px) !important;
}

:deep(.toolflowz-action-button:disabled) {
  background-color: var(--surface-border) !important;
  color: var(--text-color-secondary) !important;
  cursor: not-allowed !important;
}
</style> 