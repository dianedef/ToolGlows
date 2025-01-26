<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'🔗 Explorateur de liens'"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    :maximizable="true"
    class="links-explorer-dialog"
  >
    <div class="links-explorer-content">
      <!-- Paramètres -->
      <div class="links-explorer-settings">
        <div class="settings-row">
          <Checkbox
            v-model="settings.includeInternal"
            :binary="true"
            inputId="includeInternal"
          />
          <label for="includeInternal">Liens internes</label>

          <Checkbox
            v-model="settings.includeExternal"
            :binary="true"
            inputId="includeExternal"
          />
          <label for="includeExternal">Liens externes</label>
        </div>

        <div class="settings-row">
          <label for="maxDepth">Profondeur max:</label>
          <InputNumber
            v-model="settings.maxDepth"
            :min="1"
            :max="5"
            inputId="maxDepth"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="links-explorer-actions">
        <Button
          @click="exploreLinks"
          icon="pi pi-search"
          label="Explorer"
          :loading="isLoading"
          class="action-button"
        />
        <Button
          @click="exploreDeeper"
          icon="pi pi-arrow-down"
          label="Explorer plus profond"
          :disabled="settings.currentDepth >= settings.maxDepth || isLoading"
          class="action-button"
        />
        <Button
          @click="handleCopy"
          icon="pi pi-copy"
          label="Copier tous"
          :disabled="!links.length"
          class="action-button"
        />
      </div>

      <!-- Liste des liens -->
      <div class="links-list" v-if="links.length">
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
          <Column field="depth" header="Profondeur" class="text-center">
            <template #body="{ data }">
              <div class="text-center">{{ data.depth }}</div>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="no-links">
        Aucun lien trouvé. Lancez l'exploration pour commencer !
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
  copyAllLinks
} = useLinksExplorer()

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
.links-explorer-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.links-explorer-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.links-explorer-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.links-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-links {
  text-align: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

.text-center {
  text-align: center;
}

:deep(.action-button) {
  background-color: var(--primary-color) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.25rem !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

:deep(.action-button:hover) {
  background-color: var(--primary-color) !important;
  filter: brightness(1.1) !important;
  transform: translateY(-1px) !important;
}

:deep(.action-button:disabled) {
  background-color: var(--surface-border) !important;
  color: var(--text-color-secondary) !important;
  cursor: not-allowed !important;
}
</style> 