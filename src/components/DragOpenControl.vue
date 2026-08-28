<template>
  <Dialog
    v-model:visible="dragStore.isActive"
    :header="'Drag & Open'"
    :modal="true"
    position="right"
    :style="{ width: '450px' }"
    :dismissable-mask="true"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="drag-options">
      <div class="field mb-3">
        <h4>Options générales</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="dragStore.options.enableDragToOpen"
            :binary="true"
            @change="dragStore.saveOptions()"
          />
          <label>Activer le glisser pour ouvrir</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="dragStore.options.enableDropToOpen"
            :binary="true"
            @change="dragStore.saveOptions()"
          />
          <label>Activer le déposer pour ouvrir</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="dragStore.options.openInNewTab"
            :binary="true"
            @change="dragStore.saveOptions()"
          />
          <label>Ouvrir dans un nouvel onglet</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="dragStore.options.openInBackground"
            :binary="true"
            @change="dragStore.saveOptions()"
          />
          <label>Ouvrir en arrière-plan</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Paramètres de glisser-déposer</h4>
        <div class="field-slider mb-2">
          <label>Seuil de glissement (px)</label>
          <Slider
            v-model="dragStore.options.dragThreshold"
            :min="10"
            :max="200"
            :step="10"
            @change="dragStore.saveOptions()"
          />
          <small>{{ dragStore.options.dragThreshold }}px</small>
        </div>

        <div class="field-slider mb-2">
          <label>Délai de glissement (ms)</label>
          <Slider
            v-model="dragStore.options.dragDelay"
            :min="0"
            :max="2000"
            :step="100"
            @change="dragStore.saveOptions()"
          />
          <small>{{ dragStore.options.dragDelay }}ms</small>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Types de fichiers autorisés</h4>
        <div class="file-types">
          <Chip
            v-for="type in dragStore.options.allowedFileTypes"
            :key="type"
            :label="type"
            :removable="true"
            @remove="removeFileType(type)"
          />
          <Button
            icon="pi pi-plus"
            text
            rounded
            @click="showAddFileTypeDialog = true"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Actions personnalisées</h4>
        <div class="custom-actions">
          <div
            v-for="action in dragStore.options.customActions"
            :key="action.id"
            class="custom-action-item"
          >
            <div class="action-info">
              <span class="action-name">{{ action.name }}</span>
              <small class="action-pattern">{{ action.pattern }}</small>
            </div>
            <div class="action-buttons">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                @click="editCustomAction(action)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="dragStore.removeCustomAction(action.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter une action"
            icon="pi pi-plus"
            @click="showAddActionDialog = true"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showAddFileTypeDialog"
      header="Ajouter un type de fichier"
      :modal="true"
      :dismissable-mask="true"
      class="p-fluid"
      @hide="showAddFileTypeDialog = false"
    >
      <div class="field">
        <label>Type MIME (ex: image/*, text/plain)</label>
        <InputText v-model="newFileType" />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddFileTypeDialog = false"
        />
        <Button
          label="Ajouter"
          icon="pi pi-check"
          @click="addFileType"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showAddActionDialog"
      :header="editingAction ? 'Modifier l\'action' : 'Ajouter une action'"
      :modal="true"
      :dismissable-mask="true"
      class="p-fluid"
      @hide="showAddActionDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newAction.name" />
      </div>
      <div class="field mb-3">
        <label>Pattern (expression régulière)</label>
        <InputText v-model="newAction.pattern" />
      </div>
      <div class="field mb-3">
        <label>Type d'action</label>
        <Dropdown
          v-model="newAction.action"
          :options="actionTypes"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
      <div
        v-if="newAction.action === 'custom'"
        class="field mb-3"
      >
        <label>Script personnalisé</label>
        <Textarea
          v-model="newAction.customScript"
          rows="5"
          class="w-full"
        />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddActionDialog = false"
        />
        <Button
          :label="editingAction ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveCustomAction"
        />
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDragOpenStore } from '@/stores/dragOpen'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import Chip from 'primevue/chip'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'

const dragStore = useDragOpenStore()
const showAddFileTypeDialog = ref(false)
const showAddActionDialog = ref(false)
const newFileType = ref('')
const editingAction = ref<string | null>(null)
type CustomActionDraft = {
  id: string
  name: string
  pattern: string
  action: 'open' | 'download' | 'copy' | 'custom'
  customScript: string
}

const newAction = ref({
  id: '',
  name: '',
  pattern: '',
  action: 'open',
  customScript: ''
} as CustomActionDraft)

const actionTypes = [
  { label: 'Ouvrir', value: 'open' },
  { label: 'Télécharger', value: 'download' },
  { label: 'Copier', value: 'copy' },
  { label: 'Personnalisé', value: 'custom' }
]

onMounted(async () => {
  await dragStore.loadOptions()
})

function addFileType() {
  if (newFileType.value && !dragStore.options.allowedFileTypes.includes(newFileType.value)) {
    dragStore.options.allowedFileTypes.push(newFileType.value)
    dragStore.saveOptions()
  }
  newFileType.value = ''
  showAddFileTypeDialog.value = false
}

function removeFileType(type: string) {
  const index = dragStore.options.allowedFileTypes.indexOf(type)
  if (index > -1) {
    dragStore.options.allowedFileTypes.splice(index, 1)
    dragStore.saveOptions()
  }
}

function editCustomAction(action: any) {
  editingAction.value = action.id
  newAction.value = { ...action }
  showAddActionDialog.value = true
}

function saveCustomAction() {
  if (editingAction.value) {
    dragStore.updateCustomAction(editingAction.value, newAction.value)
  } else {
    newAction.value.id = Date.now().toString()
    dragStore.addCustomAction(newAction.value)
  }
  showAddActionDialog.value = false
  editingAction.value = null
  newAction.value = {
    id: '',
    name: '',
    pattern: '',
    action: 'open',
    customScript: ''
  }
}

const closeDialog = () => {
  dragStore.isActive = false
}
</script>

<style scoped>
.drag-options {
  padding: var(--tg-space-4);
}

.field {
  margin-bottom: var(--tg-space-5);
}

.field h4 {
  margin-bottom: var(--tg-space-3);
  color: var(--text-color);
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

.field-slider label {
  font-size: 0.875rem;
  color: var(--text-color);
}

.field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.file-types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tg-space-2);
  align-items: center;
}

.custom-actions {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.custom-action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.action-info {
  display: flex;
  flex-direction: column;
}

.action-name {
  font-weight: 500;
}

.action-pattern {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--tg-space-1);
}
</style>
