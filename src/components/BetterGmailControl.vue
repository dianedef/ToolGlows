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
    <div class="toolflowz-gmail-options">
      <div class="toolflowz-field mb-3">
        <h4>Labels</h4>
        <div class="toolflowz-labels-list">
          <div
            v-for="label in gmailStore.options.labels"
            :key="label.id"
            class="toolflowz-label-item"
          >
            <div class="toolflowz-label-info">
              <span
                class="toolflowz-label-color"
                :style="{ backgroundColor: label.color }"
              />
              <div class="toolflowz-label-details">
                <span class="toolflowz-label-name">{{ label.name }}</span>
                <small v-if="label.shortcut" class="toolflowz-label-shortcut">
                  {{ label.shortcut }}
                </small>
              </div>
            </div>
            <div class="toolflowz-label-actions">
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

      <div class="toolflowz-field mb-3">
        <h4>Options générales</h4>
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.autoArchive"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Archivage automatique</label>
        </div>

        <div class="toolflowz-field-slider mb-2">
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

        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showUnreadCount"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher le nombre de messages non lus</label>
        </div>

        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showPreview"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher l'aperçu des messages</label>
        </div>

        <div class="toolflowz-field-dropdown mb-2">
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

      <div class="toolflowz-field mb-3">
        <h4>Raccourcis clavier</h4>
        <div class="toolflowz-shortcuts-list">
          <div
            v-for="shortcut in gmailStore.options.customKeyboardShortcuts"
            :key="shortcut.id"
            class="toolflowz-shortcut-item"
          >
            <div class="toolflowz-shortcut-info">
              <span class="toolflowz-shortcut-name">{{ shortcut.name }}</span>
              <code class="toolflowz-shortcut-key">{{ shortcut.key }}</code>
            </div>
            <div class="toolflowz-shortcut-actions">
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

      <div class="toolflowz-field mb-3">
        <h4>Filtres</h4>
        <div class="toolflowz-filters-list">
          <div
            v-for="filter in gmailStore.options.filters"
            :key="filter.id"
            class="toolflowz-filter-item"
          >
            <div class="toolflowz-filter-info">
              <span class="toolflowz-filter-name">{{ filter.name }}</span>
              <div class="toolflowz-filter-conditions">
                <small v-for="(condition, index) in filter.conditions" :key="index" class="toolflowz-filter-condition">
                  {{ condition.field }} {{ condition.operator }} "{{ condition.value }}"
                </small>
              </div>
            </div>
            <div class="toolflowz-filter-actions">
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

      <div class="toolflowz-field mb-3">
        <h4>Options de composition</h4>
        <div class="toolflowz-field-input mb-2">
          <label>Signature</label>
          <Textarea
            v-model="gmailStore.options.composeDefaults.signature"
            rows="3"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolflowz-field-dropdown mb-2">
          <label>Police</label>
          <Dropdown
            v-model="gmailStore.options.composeDefaults.font"
            :options="fonts"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolflowz-field-spinner mb-2">
          <label>Taille de police</label>
          <InputNumber
            v-model="gmailStore.options.composeDefaults.fontSize"
            :min="8"
            :max="24"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.composeDefaults.spellCheck"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Vérification orthographique</label>
        </div>

        <div class="toolflowz-field-checkbox mb-2">
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
          class="toolflowz-condition-row"
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
          class="toolflowz-action-row"
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
.toolflowz-gmail-options {
  padding: 1rem;
}

.toolflowz-field {
  margin-bottom: 1.5rem;
}

.toolflowz-field h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.toolflowz-labels-list,
.toolflowz-shortcuts-list,
.toolflowz-filters-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toolflowz-label-item,
.toolflowz-shortcut-item,
.toolflowz-filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.toolflowz-label-info,
.toolflowz-shortcut-info,
.toolflowz-filter-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolflowz-label-color {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
}

.toolflowz-label-details,
.toolflowz-filter-details {
  display: flex;
  flex-direction: column;
}

.toolflowz-label-name,
.toolflowz-shortcut-name,
.toolflowz-filter-name {
  font-weight: 500;
}

.toolflowz-label-shortcut,
.toolflowz-filter-conditions {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.toolflowz-label-actions,
.toolflowz-shortcut-actions,
.toolflowz-filter-actions {
  display: flex;
  gap: 0.25rem;
}

.toolflowz-field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolflowz-field-slider {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toolflowz-field-slider label,
.toolflowz-field-input label,
.toolflowz-field-dropdown label,
.toolflowz-field-spinner label {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.toolflowz-field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.toolflowz-field-input,
.toolflowz-field-dropdown,
.toolflowz-field-spinner {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.toolflowz-shortcut-key {
  font-family: monospace;
  padding: 0.25rem 0.5rem;
  background: var(--surface-ground);
  border-radius: 4px;
  font-size: 0.875rem;
}

.toolflowz-condition-row,
.toolflowz-action-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.toolflowz-filter-conditions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toolflowz-filter-condition {
  font-family: monospace;
  padding: 0.125rem 0.25rem;
  background: var(--surface-ground);
  border-radius: 4px;
}
</style> 