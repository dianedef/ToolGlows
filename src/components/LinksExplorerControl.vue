<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'🔗 Explorateur de liens'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    :maximizable="true"
    :dismissable-mask="true"
    class="toolglows-links-explorer-dialog"
  >
    <div class="toolglows-links-explorer-content">
      <!-- Paramètres -->
      <div class="toolglows-links-explorer-settings">
        <div class="toolglows-settings-group">
          <h3>🎯 Type de liens</h3>
          <div class="toolglows-settings-row">
            <div class="toolglows-checkbox-wrapper">
              <Checkbox
                v-model="settings.includeInternal"
                :binary="true"
                input-id="includeInternal"
              />
              <label for="includeInternal">Liens internes</label>
            </div>

            <div class="toolglows-checkbox-wrapper">
              <Checkbox
                v-model="settings.includeExternal"
                :binary="true"
                input-id="includeExternal"
              />
              <label for="includeExternal">Liens externes</label>
            </div>
          </div>
        </div>

        <div class="toolglows-settings-group">
          <h3>⚙️ Options</h3>
          <div class="toolglows-settings-row">
            <div class="toolglows-depth-control">
              <label for="maxDepth">Profondeur max:</label>
              <InputNumber
                v-model="settings.maxDepth"
                :min="1"
                :max="5"
                input-id="maxDepth"
                class="toolglows-depth-input"
              />
            </div>

            <div class="toolglows-format-control">
              <Checkbox
                v-model="settings.useMarkdown"
                :binary="true"
                input-id="useMarkdown"
              />
              <div class="toolglows-label-with-hint">
                <label for="useMarkdown">Format Markdown</label>
                <small class="toolglows-format-hint">{{ settings.useMarkdown ? '(avec titres)' : '(liens uniquement)' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="toolglows-links-explorer-actions">
        <Button
          icon="pi pi-search"
          label="Explorer"
          :loading="isLoading"
          class="toolglows-action-button"
          @click="() => exploreLinks()"
        />
        <Button
          icon="pi pi-arrow-down"
          label="Explorer plus profond"
          :disabled="settings.currentDepth >= settings.maxDepth || isLoading"
          class="toolglows-action-button"
          @click="exploreDeeper"
        />
        <Button
          icon="pi pi-copy"
          label="Copier tous"
          :disabled="!links.length"
          class="toolglows-action-button"
          @click="handleCopy"
        />
      </div>

      <!-- Liste des liens -->
      <div
        v-if="links.length"
        class="toolglows-links-list"
      >
        <DataTable
          :value="links"
          :scrollable="true"
          scroll-height="400px"
        >
          <Column
            field="title"
            header="Titre"
          >
            <template #body="{ data }">
              {{ data.title || 'Sans titre' }}
            </template>
          </Column>
          <Column
            field="url"
            header="URL"
          >
            <template #body="{ data }">
              <a
                :href="data.url"
                target="_blank"
              >{{ data.url }}</a>
            </template>
          </Column>
          <Column
            field="isExternal"
            header="Type"
          >
            <template #body="{ data }">
              {{ data.isExternal ? 'Externe' : 'Interne' }}
            </template>
          </Column>
          <Column
            field="depth"
            header="Profondeur"
            class="toolglows-text-center"
          >
            <template #body="{ data }">
              <div class="toolglows-text-center">{{ data.depth }}</div>
            </template>
          </Column>
        </DataTable>
      </div>
      <div
        v-else
        class="toolglows-no-links"
      >
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
.toolglows-links-explorer-content {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-5);
}

.toolglows-links-explorer-settings {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-5);
}

.toolglows-settings-group {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1.25rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: var(--tg-space-4);
    color: var(--text-color);
    font-weight: 600;
  }
}

.toolglows-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.toolglows-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--tg-space-3);
  min-width: 200px;

  :deep(.p-checkbox) {
    width: var(--tg-space-5);
    height: var(--tg-space-5);
  }

  :deep(.p-checkbox-box) {
    width: var(--tg-space-5);
    height: var(--tg-space-5);
    border-radius: var(--tg-radius-sm);
  }

  :deep(.p-checkbox-icon) {
    font-size: var(--tg-space-4);
  }

  label {
    font-weight: 500;
    user-select: none;
  }
}

.toolglows-depth-control {
  display: flex;
  align-items: center;
  gap: var(--tg-space-3);
  min-width: 200px;

  label {
    font-weight: 500;
  }

  .toolglows-depth-input {
    width: 5rem;
  }
}

.toolglows-format-control {
  display: flex;
  align-items: center;
  gap: var(--tg-space-3);
  min-width: 200px;
}

.toolglows-label-with-hint {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-1);
}

.toolglows-format-hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.toolglows-links-explorer-actions {
  display: flex;
  gap: var(--tg-space-4);
  flex-wrap: wrap;
}

.toolglows-links-list {
  max-height: 400px;
  overflow-y: auto;
}

.toolglows-no-links {
  text-align: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

.toolglows-text-center {
  text-align: center;
}

:deep(.toolglows-action-button) {
  background-color: var(--primary-color) !important;
  color: white !important;
  border: none !important;
  padding: var(--tg-space-3) 1.25rem !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

:deep(.toolglows-action-button:hover) {
  background-color: var(--primary-color) !important;
  filter: brightness(1.1) !important;
  transform: translateY(-1px) !important;
}

:deep(.toolglows-action-button:disabled) {
  background-color: var(--surface-border) !important;
  color: var(--text-color-secondary) !important;
  cursor: not-allowed !important;
}
</style>
