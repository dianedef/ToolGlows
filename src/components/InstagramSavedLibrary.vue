<template>
  <ToolGlowsDialog
    v-model:visible="igStore.isActive"
    :header="'Bibliothèque Instagram'"
    :modal="true"
    position="right"
    :style="{ width: '350px' }"
    :dismissable-mask="true"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="instagram-options">
      <div class="field mb-3">
        <h4>Collections</h4>
        <div class="collections-list">
          <div
            v-for="collection in igStore.options.collections"
            :key="collection.id"
            class="collection-item"
          >
            <div class="collection-info">
              <span class="collection-icon">{{ collection.icon || '📁' }}</span>
              <div class="collection-details">
                <span class="collection-name">{{ collection.name }}</span>
                <small
                  v-if="collection.description"
                  class="collection-description"
                >
                  {{ collection.description }}
                </small>
              </div>
            </div>
            <div class="collection-actions">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                @click="editCollection(collection)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="igStore.removeCollection(collection.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter une collection"
            icon="pi pi-plus"
            @click="showAddCollectionDialog = true"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Synchronisation</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="igStore.options.autoSync"
            :binary="true"
            @change="igStore.saveOptions()"
          />
          <label>Synchronisation automatique</label>
        </div>

        <div class="field-slider mb-2">
          <label>Intervalle de synchronisation (minutes)</label>
          <Slider
            v-model="igStore.options.syncInterval"
            :min="15"
            :max="240"
            :step="15"
            @change="igStore.saveOptions()"
          />
          <small>{{ igStore.options.syncInterval }} minutes</small>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="igStore.options.notifyOnSync"
            :binary="true"
            @change="igStore.saveOptions()"
          />
          <label>Notifier lors de la synchronisation</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Téléchargement</h4>
        <div class="field-input mb-2">
          <label>Dossier de téléchargement</label>
          <InputText
            v-model="igStore.options.downloadPath"
            class="w-full"
            @change="igStore.saveOptions()"
          />
        </div>

        <div class="field-dropdown mb-2">
          <label>Format de téléchargement</label>
          <Dropdown
            v-model="igStore.options.downloadFormat"
            :options="downloadFormats"
            option-label="label"
            option-value="value"
            class="w-full"
            @change="igStore.saveOptions()"
          />
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="igStore.options.organizeByDate"
            :binary="true"
            @change="igStore.saveOptions()"
          />
          <label>Organiser par date</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="igStore.options.organizeByCollection"
            :binary="true"
            @change="igStore.saveOptions()"
          />
          <label>Organiser par collection</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Sauvegarde</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="igStore.options.backupEnabled"
            :binary="true"
            @change="igStore.saveOptions()"
          />
          <label>Activer les sauvegardes</label>
        </div>

        <div class="field-dropdown mb-2">
          <label>Fréquence de sauvegarde</label>
          <Dropdown
            v-model="igStore.options.backupFrequency"
            :options="backupFrequencies"
            option-label="label"
            option-value="value"
            class="w-full"
            @change="igStore.saveOptions()"
          />
        </div>

        <div class="field-slider mb-2">
          <label>Nombre maximum de sauvegardes</label>
          <Slider
            v-model="igStore.options.maxBackups"
            :min="1"
            :max="10"
            :step="1"
            @change="igStore.saveOptions()"
          />
          <small>{{ igStore.options.maxBackups }} sauvegardes</small>
        </div>
      </div>
    </div>

    <ToolGlowsDialog
      v-model:visible="showAddCollectionDialog"
      :header="editingCollection ? 'Modifier la collection' : 'Ajouter une collection'"
      :modal="true"
      :dismissable-mask="true"
      class="p-fluid"
      @hide="showAddCollectionDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newCollection.name" />
      </div>
      <div class="field mb-3">
        <label>Description (optionnel)</label>
        <InputText v-model="newCollection.description" />
      </div>
      <div class="field mb-3">
        <label>Icône (optionnel)</label>
        <InputText v-model="newCollection.icon" />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddCollectionDialog = false"
        />
        <Button
          :label="editingCollection ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveCollection"
        />
      </template>
    </ToolGlowsDialog>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInstagramSavedStore } from '@/stores/instagramSaved'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import Dropdown from 'primevue/dropdown'

const igStore = useInstagramSavedStore()
const showAddCollectionDialog = ref(false)
const editingCollection = ref<string | null>(null)
const newCollection = ref({
  id: '',
  name: '',
  description: '',
  icon: ''
})

const downloadFormats = [
  { label: 'Original', value: 'original' },
  { label: 'Compressé', value: 'compressed' }
]

const backupFrequencies = [
  { label: 'Quotidienne', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Mensuelle', value: 'monthly' }
]

onMounted(async () => {
  await igStore.loadOptions()
})

function editCollection(collection: any) {
  editingCollection.value = collection.id
  newCollection.value = { ...collection }
  showAddCollectionDialog.value = true
}

function saveCollection() {
  if (editingCollection.value) {
    igStore.updateCollection(editingCollection.value, newCollection.value)
  } else {
    newCollection.value.id = Date.now().toString()
    igStore.addCollection(newCollection.value)
  }
  showAddCollectionDialog.value = false
  editingCollection.value = null
  newCollection.value = { id: '', name: '', description: '', icon: '' }
}

const closeDialog = () => {
  igStore.isActive = false
}
</script>

<style scoped>
.instagram-options {
  padding: var(--tg-space-4);
}

.field {
  margin-bottom: var(--tg-space-5);
}

.field h4 {
  margin-bottom: var(--tg-space-3);
  color: var(--text-color);
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.collection-info {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.collection-icon {
  font-size: var(--tg-size-tool-icon);
}

.collection-details {
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-weight: 500;
}

.collection-description {
  font-size: var(--tg-size-icon-sm);
  color: var(--text-color-secondary);
}

.collection-actions {
  display: flex;
  gap: var(--tg-space-1);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.field-slider {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.field-slider label,
.field-input label,
.field-dropdown label {
  font-size: var(--tg-size-icon-sm);
  color: var(--text-color);
  margin-bottom: var(--tg-space-1);
}

.field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.field-input,
.field-dropdown {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--tg-space-2);
}
</style> 
