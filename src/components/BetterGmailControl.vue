<template>
  <Dialog
    v-model:visible="gmailStore.isActive"
    :header="'Better Gmail'"
    :modal="true"
    position="right"
    :style="{ width: '450px' }"
    :dismissableMask="true"
    @hide="closeDialog"
  >
    <div class="gmail-options">
      <div class="field mb-3">
        <h4>Labels</h4>
        <div class="labels-list">
          <div
            v-for="label in gmailStore.options.labels"
            :key="label.id"
            class="label-item"
          >
            <div class="label-info">
              <span
                class="label-color"
                :style="{ backgroundColor: label.color }"
              />
              <div class="label-details">
                <span class="label-name">{{ label.name }}</span>
                <small v-if="label.shortcut" class="label-shortcut">
                  {{ label.shortcut }}
                </small>
              </div>
            </div>
            <div class="label-actions">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                @click="editLabel(label)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="gmailStore.removeLabel(label.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter un label"
            icon="pi pi-plus"
            @click="showAddLabelDialog = true"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Options générales</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.autoArchive"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Archivage automatique</label>
        </div>

        <div class="field-slider mb-2">
          <label>Délai d'archivage (secondes)</label>
          <Slider
            v-model="gmailStore.options.archiveDelay"
            :min="1"
            :max="30"
            :step="1"
            @change="gmailStore.saveOptions()"
          />
          <small>{{ gmailStore.options.archiveDelay }} secondes</small>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showUnreadCount"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher le nombre de messages non lus</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showPreview"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher l'aperçu des messages</label>
        </div>

        <div class="field-dropdown mb-2">
          <label>Position de l'aperçu</label>
          <Dropdown
            v-model="gmailStore.options.previewPosition"
            :options="previewPositions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Raccourcis clavier</h4>
        <div class="shortcuts-list">
          <div
            v-for="shortcut in gmailStore.options.customKeyboardShortcuts"
            :key="shortcut.id"
            class="shortcut-item"
          >
            <div class="shortcut-info">
              <span class="shortcut-name">{{ shortcut.name }}</span>
              <code class="shortcut-key">{{ shortcut.key }}</code>
            </div>
            <div class="shortcut-actions">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                @click="editShortcut(shortcut)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="gmailStore.removeShortcut(shortcut.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter un raccourci"
            icon="pi pi-plus"
            @click="showAddShortcutDialog = true"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Filtres</h4>
        <div class="filters-list">
          <div
            v-for="filter in gmailStore.options.filters"
            :key="filter.id"
            class="filter-item"
          >
            <div class="filter-info">
              <span class="filter-name">{{ filter.name }}</span>
              <div class="filter-conditions">
                <small v-for="(condition, index) in filter.conditions" :key="index">
                  {{ condition.field }} {{ condition.operator }} "{{ condition.value }}"
                </small>
              </div>
            </div>
            <div class="filter-actions">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                @click="editFilter(filter)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="gmailStore.removeFilter(filter.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter un filtre"
            icon="pi pi-plus"
            @click="showAddFilterDialog = true"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Options de composition</h4>
        <div class="field-input mb-2">
          <label>Signature</label>
          <Textarea
            v-model="gmailStore.options.composeDefaults.signature"
            rows="3"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="field-dropdown mb-2">
          <label>Police</label>
          <Dropdown
            v-model="gmailStore.options.composeDefaults.font"
            :options="fonts"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="field-spinner mb-2">
          <label>Taille de police</label>
          <InputNumber
            v-model="gmailStore.options.composeDefaults.fontSize"
            :min="8"
            :max="24"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.composeDefaults.spellCheck"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Vérification orthographique</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.composeDefaults.confirmationBeforeSend"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Confirmation avant envoi</label>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showAddLabelDialog"
      :header="editingLabel ? 'Modifier le label' : 'Ajouter un label'"
      :modal="true"
      :dismissableMask="true"
      class="p-fluid"
      @hide="showAddLabelDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newLabel.name" />
      </div>
      <div class="field mb-3">
        <label>Couleur</label>
        <ColorPicker v-model="newLabel.color" />
      </div>
      <div class="field mb-3">
        <label>Raccourci (optionnel)</label>
        <InputText v-model="newLabel.shortcut" placeholder="Alt+L" />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddLabelDialog = false"
        />
        <Button
          :label="editingLabel ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveLabel"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showAddShortcutDialog"
      :header="editingShortcut ? 'Modifier le raccourci' : 'Ajouter un raccourci'"
      :modal="true"
      :dismissableMask="true"
      class="p-fluid"
      @hide="showAddShortcutDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newShortcut.name" />
      </div>
      <div class="field mb-3">
        <label>Touche</label>
        <InputText v-model="newShortcut.key" placeholder="Alt+X" />
      </div>
      <div class="field mb-3">
        <label>Action</label>
        <InputText v-model="newShortcut.action" />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddShortcutDialog = false"
        />
        <Button
          :label="editingShortcut ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveShortcut"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showAddFilterDialog"
      :header="editingFilter ? 'Modifier le filtre' : 'Ajouter un filtre'"
      :modal="true"
      :dismissableMask="true"
      class="p-fluid"
      @hide="showAddFilterDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newFilter.name" />
      </div>
      <div class="field mb-3">
        <h5>Conditions</h5>
        <div
          v-for="(condition, index) in newFilter.conditions"
          :key="index"
          class="condition-row"
        >
          <Dropdown
            v-model="condition.field"
            :options="filterFields"
            optionLabel="label"
            optionValue="value"
            class="w-4"
          />
          <Dropdown
            v-model="condition.operator"
            :options="filterOperators"
            optionLabel="label"
            optionValue="value"
            class="w-4"
          />
          <InputText
            v-model="condition.value"
            class="w-4"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click="removeCondition(index)"
          />
        </div>
        <Button
          label="Ajouter une condition"
          icon="pi pi-plus"
          @click="addCondition"
          class="mt-2"
        />
      </div>
      <div class="field mb-3">
        <h5>Actions</h5>
        <div
          v-for="(action, index) in newFilter.actions"
          :key="index"
          class="action-row"
        >
          <Dropdown
            v-model="action.type"
            :options="filterActions"
            optionLabel="label"
            optionValue="value"
            class="w-6"
          />
          <InputText
            v-model="action.value"
            class="w-6"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click="removeAction(index)"
          />
        </div>
        <Button
          label="Ajouter une action"
          icon="pi pi-plus"
          @click="addAction"
          class="mt-2"
        />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddFilterDialog = false"
        />
        <Button
          :label="editingFilter ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveFilter"
        />
      </template>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBetterGmailStore } from '@/stores/betterGmail'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import Dropdown from 'primevue/dropdown'
import ColorPicker from 'primevue/colorpicker'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'

const gmailStore = useBetterGmailStore()
const showAddLabelDialog = ref(false)
const showAddShortcutDialog = ref(false)
const showAddFilterDialog = ref(false)
const editingLabel = ref<string | null>(null)
const editingShortcut = ref<string | null>(null)
const editingFilter = ref<string | null>(null)

const newLabel = ref({
  id: '',
  name: '',
  color: '#000000',
  shortcut: ''
})

const newShortcut = ref({
  id: '',
  name: '',
  key: '',
  action: ''
})

const newFilter = ref({
  id: '',
  name: '',
  conditions: [],
  actions: []
})

const previewPositions = [
  { label: 'Droite', value: 'right' },
  { label: 'Bas', value: 'bottom' }
]

const fonts = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New'
]

const filterFields = [
  { label: 'De', value: 'from' },
  { label: 'À', value: 'to' },
  { label: 'Objet', value: 'subject' },
  { label: 'Pièce jointe', value: 'hasAttachment' }
]

const filterOperators = [
  { label: 'Contient', value: 'contains' },
  { label: 'Ne contient pas', value: 'notContains' },
  { label: 'Est égal à', value: 'equals' },
  { label: "N'est pas égal à", value: 'notEquals' },
  { label: 'Correspond à', value: 'matches' }
]

const filterActions = [
  { label: 'Appliquer le label', value: 'label' },
  { label: 'Archiver', value: 'archive' },
  { label: 'Marquer comme', value: 'mark' },
  { label: 'Mettre en favoris', value: 'star' },
  { label: 'Transférer à', value: 'forward' }
]

onMounted(async () => {
  await gmailStore.loadOptions()
})

function editLabel(label: any) {
  editingLabel.value = label.id
  newLabel.value = { ...label }
  showAddLabelDialog.value = true
}

function saveLabel() {
  if (editingLabel.value) {
    gmailStore.updateLabel(editingLabel.value, newLabel.value)
  } else {
    newLabel.value.id = Date.now().toString()
    gmailStore.addLabel(newLabel.value)
  }
  showAddLabelDialog.value = false
  editingLabel.value = null
  newLabel.value = { id: '', name: '', color: '#000000', shortcut: '' }
}

function editShortcut(shortcut: any) {
  editingShortcut.value = shortcut.id
  newShortcut.value = { ...shortcut }
  showAddShortcutDialog.value = true
}

function saveShortcut() {
  if (editingShortcut.value) {
    gmailStore.updateShortcut(editingShortcut.value, newShortcut.value)
  } else {
    newShortcut.value.id = Date.now().toString()
    gmailStore.addShortcut(newShortcut.value)
  }
  showAddShortcutDialog.value = false
  editingShortcut.value = null
  newShortcut.value = { id: '', name: '', key: '', action: '' }
}

function editFilter(filter: any) {
  editingFilter.value = filter.id
  newFilter.value = JSON.parse(JSON.stringify(filter))
  showAddFilterDialog.value = true
}

function saveFilter() {
  if (editingFilter.value) {
    gmailStore.updateFilter(editingFilter.value, newFilter.value)
  } else {
    newFilter.value.id = Date.now().toString()
    gmailStore.addFilter(newFilter.value)
  }
  showAddFilterDialog.value = false
  editingFilter.value = null
  newFilter.value = { id: '', name: '', conditions: [], actions: [] }
}

function addCondition() {
  newFilter.value.conditions.push({
    field: 'from',
    operator: 'contains',
    value: ''
  })
}

function removeCondition(index: number) {
  newFilter.value.conditions.splice(index, 1)
}

function addAction() {
  newFilter.value.actions.push({
    type: 'label',
    value: ''
  })
}

function removeAction(index: number) {
  newFilter.value.actions.splice(index, 1)
}

const closeDialog = () => {
  gmailStore.isActive = false
}
</script>

<style scoped>
.gmail-options {
  padding: 1rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field h4 {
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.field h5 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.labels-list,
.shortcuts-list,
.filters-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label-item,
.shortcut-item,
.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.label-info,
.shortcut-info,
.filter-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label-color {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
}

.label-details,
.filter-details {
  display: flex;
  flex-direction: column;
}

.label-name,
.shortcut-name,
.filter-name {
  font-weight: 500;
}

.label-shortcut,
.filter-conditions {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.label-actions,
.shortcut-actions,
.filter-actions {
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

.field-slider label,
.field-input label,
.field-dropdown label,
.field-spinner label {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.field-input,
.field-dropdown,
.field-spinner {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.shortcut-key {
  font-family: monospace;
  padding: 0.25rem 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  font-size: 0.875rem;
}

.condition-row,
.action-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.filter-conditions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-conditions small {
  font-family: monospace;
  padding: 0.125rem 0.25rem;
  background: var(--surface-ground);
  border-radius: 4px;
}
</style> 