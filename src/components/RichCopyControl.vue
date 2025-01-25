<template>
  <Dialog
    v-model:visible="copyStore.isActive"
    :header="'Rich Copy'"
    :modal="true"
    position="right"
    :style="{ width: '500px' }"
    :dismissableMask="true"
    @hide="closeDialog"
  >
    <div class="copy-options">
      <div class="field mb-3">
        <h4>Formats de copie</h4>
        <div class="formats-list">
          <div
            v-for="format in copyStore.options.formats"
            :key="format.id"
            class="format-item"
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
            <div class="format-actions">
              <Button
                class="p-button-text p-button-rounded"
                @click="editFormat(format)"
              >
                <i class="pi pi-pencil"></i>
              </Button>
              <Button
                class="p-button-text p-button-rounded p-button-danger"
                @click="copyStore.removeFormat(format.id)"
              >
                <i class="pi pi-trash"></i>
              </Button>
            </div>
          </div>
          <Button
            class="p-button-text p-button-rounded"
            @click="showAddFormatDialog = true"
          >
            <i class="pi pi-plus"></i>
            <span>Ajouter un format</span>
          </Button>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Format par défaut</h4>
        <Dropdown
          v-model="copyStore.options.defaultFormat"
          :options="copyStore.options.formats"
          optionLabel="name"
          optionValue="id"
          class="w-full"
          @change="copyStore.saveOptions()"
        />
      </div>

      <div class="field mb-3">
        <h4>Options générales</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="copyStore.options.preserveFormatting"
            :binary="true"
            @change="copyStore.saveOptions()"
          />
          <label>Conserver la mise en forme</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="copyStore.options.includeMetadata"
            :binary="true"
            @change="copyStore.saveOptions()"
          />
          <label>Inclure les métadonnées</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="copyStore.options.smartQuotes"
            :binary="true"
            @change="copyStore.saveOptions()"
          />
          <label>Guillemets intelligents</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="copyStore.options.autoDetectLanguage"
            :binary="true"
            @change="copyStore.saveOptions()"
          />
          <label>Détection automatique de la langue</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="copyStore.options.showNotifications"
            :binary="true"
            @change="copyStore.saveOptions()"
          />
          <label>Afficher les notifications</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Historique</h4>
        <div class="field-slider mb-2">
          <label>Nombre maximum d'éléments</label>
          <Slider
            v-model="copyStore.options.maxHistoryItems"
            :min="10"
            :max="200"
            :step="10"
            @change="copyStore.saveOptions()"
          />
          <small>{{ copyStore.options.maxHistoryItems }} éléments</small>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Remplacements personnalisés</h4>
        <div class="replacements-list">
          <div
            v-for="(replacement, index) in copyStore.options.customReplacements"
            :key="index"
            class="replacement-item"
          >
            <div class="replacement-pattern">
              <span class="search-text">{{ replacement.search }}</span>
              <i class="pi pi-arrow-right"></i>
              <span class="replace-text">{{ replacement.replace }}</span>
            </div>
            <Button
              class="p-button-text p-button-rounded p-button-danger"
              @click="copyStore.removeCustomReplacement(index)"
            >
              <i class="pi pi-trash"></i>
            </Button>
          </div>
          <div class="add-replacement">
            <div class="replacement-inputs">
              <InputText
                v-model="newReplacement.search"
                placeholder="Rechercher..."
                class="w-full"
              />
              <i class="pi pi-arrow-right"></i>
              <InputText
                v-model="newReplacement.replace"
                placeholder="Remplacer par..."
                class="w-full"
              />
            </div>
            <Button
              class="p-button-text p-button-rounded"
              @click="addReplacement"
              :disabled="!newReplacement.search || !newReplacement.replace"
            >
              <i class="pi pi-plus"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showAddFormatDialog"
      :header="editingFormat ? 'Modifier le format' : 'Ajouter un format'"
      :modal="true"
      :dismissableMask="true"
      class="p-fluid"
      @hide="showAddFormatDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newFormat.name" />
      </div>
      <div class="field mb-3">
        <label>Template</label>
        <Textarea
          v-model="newFormat.template"
          rows="5"
          class="w-full"
          placeholder="Utilisez {title}, {content}, {url} comme variables"
        />
      </div>
      <div class="field mb-3">
        <label>Raccourci (optionnel)</label>
        <InputText v-model="newFormat.shortcut" placeholder="Alt+X" />
      </div>
      <div class="field mb-3">
        <label>Icône (optionnel)</label>
        <InputText v-model="newFormat.icon" placeholder="📝" />
      </div>
      <template #footer>
        <Button
          class="p-button-text"
          @click="showAddFormatDialog = false"
        >
          <i class="pi pi-times"></i>
          <span>Annuler</span>
        </Button>
        <Button
          @click="saveFormat"
        >
          <i class="pi pi-check"></i>
          <span>{{ editingFormat ? 'Modifier' : 'Ajouter' }}</span>
        </Button>
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRichCopyStore } from '@/stores/richCopy'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'

const copyStore = useRichCopyStore()
const showAddFormatDialog = ref(false)
const editingFormat = ref<string | null>(null)
const newFormat = ref({
  id: '',
  name: '',
  template: '',
  shortcut: '',
  icon: ''
})

const newReplacement = ref({
  search: '',
  replace: ''
})

onMounted(async () => {
  await copyStore.loadOptions()
})

function editFormat(format: any) {
  editingFormat.value = format.id
  newFormat.value = { ...format }
  showAddFormatDialog.value = true
}

function saveFormat() {
  if (editingFormat.value) {
    copyStore.updateFormat(editingFormat.value, newFormat.value)
  } else {
    newFormat.value.id = Date.now().toString()
    copyStore.addFormat(newFormat.value)
  }
  showAddFormatDialog.value = false
  editingFormat.value = null
  newFormat.value = { id: '', name: '', template: '', shortcut: '', icon: '' }
}

function addReplacement() {
  if (newReplacement.value.search && newReplacement.value.replace) {
    copyStore.addCustomReplacement(
      newReplacement.value.search,
      newReplacement.value.replace
    )
    newReplacement.value = { search: '', replace: '' }
  }
}

const closeDialog = () => {
  copyStore.isActive = false
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
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
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
  color: var(--text-color-secondary);
}

.format-actions {
  display: flex;
  gap: 0.25rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-slider {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-slider label {
  font-size: 0.875rem;
  color: var(--text-color);
}

.field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.replacements-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.replacement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.replacement-pattern {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-text,
.replace-text {
  font-family: monospace;
  padding: 0.25rem 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
}

.add-replacement {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.replacement-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.pi-arrow-right {
  color: var(--text-color-secondary);
}

.pi {
  font-size: 1rem;
  line-height: 1;
  vertical-align: middle;
}

.p-button .pi {
  margin-right: 0.5rem;
}

.p-button-icon-only .pi {
  margin-right: 0;
}
</style> 