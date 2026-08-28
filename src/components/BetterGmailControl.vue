<template>
  <Dialog
    v-model:visible="gmailStore.isActive"
    :modal="true"
    :dismissable-mask="true"
    :header="'Gmail amélioré'"
    position="right"
    :style="{ width: '350px' }"
    :maximizable="true"
    @hide="closeDialog"
  >
    <div class="toolglows-gmail-options">
      <div class="toolglows-field mb-3">
        <h4>Labels</h4>
        <div class="toolglows-labels-list">
          <div
            v-for="label in gmailStore.options.labels"
            :key="label.id"
            class="toolglows-label-item"
          >
            <div class="toolglows-label-info">
              <span
                class="toolglows-label-color"
                :style="{ backgroundColor: label.color }"
              />
              <div class="toolglows-label-details">
                <span class="toolglows-label-name">{{ label.name }}</span>
                <small
                  v-if="label.shortcut"
                  class="toolglows-label-shortcut"
                >
                  {{ label.shortcut }}
                </small>
              </div>
            </div>
            <div class="toolglows-label-actions">
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

      <div class="toolglows-field mb-3">
        <h4>Options générales</h4>
        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.autoArchive"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Archivage automatique</label>
        </div>

        <div class="toolglows-field-slider mb-2">
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

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showUnreadCount"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher le nombre de messages non lus</label>
        </div>

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.showPreview"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Afficher l'aperçu des messages</label>
        </div>

        <div class="toolglows-field-dropdown mb-2">
          <label>Position de l'aperçu</label>
          <Dropdown
            v-model="gmailStore.options.previewPosition"
            :options="previewPositions"
            option-label="label"
            option-value="value"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Raccourcis clavier</h4>
        <div class="toolglows-shortcuts-list">
          <div
            v-for="shortcut in gmailStore.options.customKeyboardShortcuts"
            :key="shortcut.id"
            class="toolglows-shortcut-item"
          >
            <div class="toolglows-shortcut-info">
              <span class="toolglows-shortcut-name">{{ shortcut.name }}</span>
              <code class="toolglows-shortcut-key">{{ shortcut.key }}</code>
            </div>
            <div class="toolglows-shortcut-actions">
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

      <div class="toolglows-field mb-3">
        <h4>Filtres</h4>
        <div class="toolglows-filters-list">
          <div
            v-for="filter in gmailStore.options.filters"
            :key="filter.id"
            class="toolglows-filter-item"
          >
            <div class="toolglows-filter-info">
              <span class="toolglows-filter-name">{{ filter.name }}</span>
              <div class="toolglows-filter-conditions">
                <small
                  v-for="(condition, index) in filter.conditions"
                  :key="index"
                  class="toolglows-filter-condition"
                >
                  {{ condition.field }} {{ condition.operator }} "{{ condition.value }}"
                </small>
              </div>
            </div>
            <div class="toolglows-filter-actions">
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

      <div class="toolglows-field mb-3">
        <h4>Options de composition</h4>
        <div class="toolglows-field-input mb-2">
          <label>Signature</label>
          <Textarea
            v-model="gmailStore.options.composeDefaults.signature"
            rows="3"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolglows-field-dropdown mb-2">
          <label>Police</label>
          <Dropdown
            v-model="gmailStore.options.composeDefaults.font"
            :options="fonts"
            class="w-full"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolglows-field-spinner mb-2">
          <label>Taille de police</label>
          <InputNumber
            v-model="gmailStore.options.composeDefaults.fontSize"
            :min="8"
            :max="24"
            @change="gmailStore.saveOptions()"
          />
        </div>

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="gmailStore.options.composeDefaults.spellCheck"
            :binary="true"
            @change="gmailStore.saveOptions()"
          />
          <label>Vérification orthographique</label>
        </div>

        <div class="toolglows-field-checkbox mb-2">
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
      :dismissable-mask="true"
      :maximizable="true"
      class="p-fluid"
      append-to="body"
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
        <InputText
          v-model="newLabel.shortcut"
          placeholder="Alt+L"
        />
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
      :dismissable-mask="true"
      :maximizable="true"
      class="p-fluid"
      append-to="body"
      @hide="showAddShortcutDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newShortcut.name" />
      </div>
      <div class="field mb-3">
        <label>Touche</label>
        <InputText
          v-model="newShortcut.key"
          placeholder="Alt+X"
        />
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
      :dismissable-mask="true"
      :maximizable="true"
      class="p-fluid"
      append-to="body"
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
          class="toolglows-condition-row"
        >
          <Dropdown
            v-model="condition.field"
            :options="filterFields"
            option-label="label"
            option-value="value"
            class="w-4"
          />
          <Dropdown
            v-model="condition.operator"
            :options="filterOperators"
            option-label="label"
            option-value="value"
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
          class="mt-2"
          @click="addCondition"
        />
      </div>
      <div class="field mb-3">
        <h5>Actions</h5>
        <div
          v-for="(action, index) in newFilter.actions"
          :key="index"
          class="toolglows-action-row"
        >
          <Dropdown
            v-model="action.type"
            :options="filterActions"
            option-label="label"
            option-value="value"
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
          class="mt-2"
          @click="addAction"
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
import { ref, onMounted, watch } from 'vue'
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

type FieldType = 'from' | 'to' | 'subject' | 'hasAttachment'
type OperatorType = 'contains' | 'notContains' | 'equals' | 'notEquals' | 'matches'
type ActionType = 'label' | 'archive' | 'mark' | 'star' | 'forward'

interface Condition {
  field: FieldType
  operator: OperatorType
  value: string
}

interface Action {
  type: ActionType
  value: string
}

interface Filter {
  id: string
  name: string
  conditions: Condition[]
  actions: Action[]
}

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

const newFilter = ref<Filter>({
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
.toolglows-gmail-options {
  padding: var(--tg-space-4);
}

.toolglows-field {
  margin-bottom: var(--tg-space-5);
}

.toolglows-field h4 {
  margin-bottom: var(--tg-space-2);
  color: var(--text-color);
}

.toolglows-labels-list,
.toolglows-shortcuts-list,
.toolglows-filters-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.toolglows-label-item,
.toolglows-shortcut-item,
.toolglows-filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.toolglows-label-info,
.toolglows-shortcut-info,
.toolglows-filter-info {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-label-color {
  width: var(--tg-space-4);
  height: var(--tg-space-4);
  border-radius: 50%;
}

.toolglows-label-details,
.toolglows-filter-details {
  display: flex;
  flex-direction: column;
}

.toolglows-label-name,
.toolglows-shortcut-name,
.toolglows-filter-name {
  font-weight: 500;
}

.toolglows-label-shortcut,
.toolglows-filter-conditions {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.toolglows-label-actions,
.toolglows-shortcut-actions,
.toolglows-filter-actions {
  display: flex;
  gap: var(--tg-space-1);
}

.toolglows-field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-field-slider {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.toolglows-field-slider label,
.toolglows-field-input label,
.toolglows-field-dropdown label,
.toolglows-field-spinner label {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: var(--tg-space-1);
}

.toolglows-field-slider small {
  color: var(--text-color-secondary);
  text-align: center;
}

.toolglows-field-input,
.toolglows-field-dropdown,
.toolglows-field-spinner {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--tg-space-2);
}

.toolglows-shortcut-key {
  font-family: monospace;
  padding: var(--tg-space-1) 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--tg-radius-sm);
  font-size: 0.875rem;
}

.toolglows-condition-row,
.toolglows-action-row {
  display: flex;
  gap: var(--tg-space-2);
  margin-bottom: var(--tg-space-2);
  align-items: center;
}

.toolglows-filter-conditions {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-1);
}

.toolglows-filter-condition {
  font-family: monospace;
  padding: 0.125rem 0.25rem;
  background: var(--surface-ground);
  border-radius: var(--tg-radius-sm);
}
</style>
