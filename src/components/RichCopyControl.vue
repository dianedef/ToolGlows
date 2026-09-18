<template>
  <ToolGlowsDialog
    v-model:visible="dialogVisible"
    header="📋 Rich Copy — Copie d'onglets"
    modal
    position="right"
    :style="{ width: '520px' }"
    dismissable-mask
    @hide="closeDialog"
  >
    <div class="copy-options rich-copy-options">
      <!-- Section 1 : Actions rapides de copie -->
      <div class="field mb-4">
        <h4>⚡ Actions rapides</h4>
        <div class="quick-actions-grid">
          <Button
            class="p-button-outlined quick-action-btn"
            @click="copyCurrentTab()"
            :disabled="isCopying"
          >
            <span class="action-icon">📌</span>
            <div class="action-text">
              <strong>Onglet courant</strong>
              <small>URL de l’onglet actif</small>
            </div>
          </Button>

          <Button
            class="p-button-outlined quick-action-btn"
            @click="copySelectedTabs()"
            :disabled="isCopying"
          >
            <span class="action-icon">📑</span>
            <div class="action-text">
              <strong>Onglets sélectionnés</strong>
              <small>Onglets surlignés dans le navigateur</small>
            </div>
          </Button>

          <Button
            class="p-button-outlined quick-action-btn"
            @click="copyAllTabs()"
            :disabled="isCopying"
          >
            <span class="action-icon">🪟</span>
            <div class="action-text">
              <strong>Toute la fenêtre</strong>
              <small>Tous les onglets de la fenêtre</small>
            </div>
          </Button>
        </div>
      </div>

      <!-- Section 2 : Groupes d'onglets Chrome -->
      <div class="field mb-4">
        <div class="groups-header">
          <h4>🗂️ Groupes d'onglets</h4>
          <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            title="Rafraîchir les groupes"
            :loading="isLoadingGroups"
            @click="loadTabGroups"
          />
        </div>

        <div v-if="isLoadingGroups" class="loading-groups">
          <span>Chargement des groupes...</span>
        </div>
        <div v-else-if="tabGroups.length === 0" class="no-groups">
          <small>Aucun groupe d'onglets ouvert dans cette fenêtre.</small>
        </div>
        <div v-else class="groups-list">
          <div
            v-for="group in tabGroups"
            :key="group.id"
            class="group-item"
            :style="{ borderLeftColor: getGroupColor(group.color) }"
          >
            <div class="group-info">
              <span class="group-badge" :style="{ backgroundColor: getGroupColor(group.color) }"></span>
              <span class="group-title">{{ group.title }}</span>
              <span class="group-count">({{ group.tabCount }} onglet{{ group.tabCount > 1 ? 's' : '' }})</span>
            </div>
            <Button
              label="Copier"
              icon="pi pi-copy"
              size="small"
              class="p-button-sm p-button-outlined"
              :disabled="isCopying || group.tabCount === 0"
              @click="copyGroupTabs(group.id, group.title)"
            />
          </div>
        </div>
      </div>

      <!-- Section 3 : Formats & Raccourcis -->
      <div class="field mb-3">
        <h4>Formats de copie</h4>
        <div class="formats-list">
          <div
            v-for="format in copyStore.options.formats"
            :key="format.id"
            class="format-item rich-copy-format-item"
            :class="{ 'default-format': format.id === copyStore.options.defaultFormat }"
          >
            <div class="format-info">
              <span class="format-icon">{{ format.icon }}</span>
              <div class="format-details">
                <span class="format-name">
                  {{ format.name }}
                  <span v-if="format.id === copyStore.options.defaultFormat" class="default-badge">Défaut</span>
                </span>
                <small v-if="format.shortcut" class="format-shortcut">
                  {{ format.shortcut }}
                </small>
              </div>
            </div>
            <div class="format-actions rich-copy-format-actions">
              <Button
                label="Copier onglet"
                size="small"
                text
                class="p-button-sm mr-1"
                @click="copyCurrentTab(format.id)"
              />
              <Button
                aria-label="Modifier le format"
                class="p-button-text p-button-rounded rich-copy-icon-button"
                @click="editFormat(format)"
              >
                <ToolGlowsIcon name="edit" />
              </Button>
              <Button
                v-if="copyStore.options.formats.length" > 1
                aria-label="Supprimer le format"
                class="p-button-text p-button-rounded p-button-danger rich-copy-icon-button"
                @click="copyStore.removeFormat(format.id)"
              >
                <ToolGlowsIcon name="trash" />
              </Button>
            </div>
          </div>
          <Button
            class="p-button-text p-button-rounded rich-copy-add-format"
            @click="showAddFormatDialog = true"
          >
            <ToolGlowsIcon name="plus" />
            <span>Ajouter un format</span>
          </Button>
        </div>
      </div>

      <!-- Section 4 : Format par défaut -->
      <div class="field mb-3">
        <h4>Format par défaut (pour clics rapides et raccourcis)</h4>
        <Dropdown
          v-model="copyStore.options.defaultFormat"
          :options="copyStore.options.formats"
          option-label="name"
          option-value="id"
          panel-class="toolglows-settings-select-panel"
          class="w-full"
          @change="copyStore.saveOptions()"
        />
      </div>

      <!-- Section 5 : Remplacements personnalisés -->
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
              <ToolGlowsIcon name="arrowRight" />
              <span class="replace-text">{{ replacement.replace }}</span>
            </div>
            <Button
              aria-label="Supprimer le remplacement"
              class="p-button-text p-button-rounded p-button-danger rich-copy-icon-button"
              @click="copyStore.removeCustomReplacement(index)"
            >
              <ToolGlowsIcon name="trash" />
            </Button>
          </div>
          <div class="add-replacement">
            <div class="replacement-inputs">
              <InputText
                v-model="newReplacement.search"
                placeholder="Rechercher..."
                class="w-full"
              />
              <ToolGlowsIcon name="arrowRight" />
              <InputText
                v-model="newReplacement.replace"
                placeholder="Remplacer par..."
                class="w-full"
              />
            </div>
            <Button
              aria-label="Ajouter le remplacement"
              class="p-button-text p-button-rounded rich-copy-icon-button"
              :disabled="!newReplacement.search || !newReplacement.replace"
              @click="addReplacement"
            >
              <ToolGlowsIcon name="plus" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout / modification de format -->
    <ToolGlowsDialog
      v-model:visible="showAddFormatDialog"
      :header="editingFormat ? 'Modifier le format' : 'Ajouter un format'"
      :modal="true"
      :dismissable-mask="true"
      class="p-fluid"
      @hide="showAddFormatDialog = false"
    >
      <div class="field mb-3">
        <label>Nom</label>
        <InputText v-model="newFormat.name" placeholder="Ex: Markdown bullet list" />
      </div>
      <div class="field mb-3">
        <label>Template</label>
        <Textarea
          v-model="newFormat.template"
          rows="4"
          class="w-full"
          placeholder="Ex: - [{title}]({url})"
        />
        <small class="text-secondary">Variables disponibles : {title}, {url}, {date}, {datetime}</small>
      </div>
      <div class="field mb-3">
        <label>Raccourci (optionnel)</label>
        <InputText
          v-model="newFormat.shortcut"
          placeholder="Alt+M"
        />
      </div>
      <div class="field mb-3">
        <label>Icône (emoji ou texte)</label>
        <InputText
          v-model="newFormat.icon"
          placeholder="📝"
        />
      </div>
      <template #footer>
        <Button
          class="p-button-text"
          @click="showAddFormatDialog = false"
        >
          <ToolGlowsIcon name="close" />
          <span>Annuler</span>
        </Button>
        <Button
          @click="saveFormat"
        >
          <ToolGlowsIcon name="check" />
          <span>{{ editingFormat ? 'Modifier' : 'Ajouter' }}</span>
        </Button>
      </template>
    </ToolGlowsDialog>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRichCopyStore } from '@/stores/richCopy'
import { useRichCopy } from '@/composables/useRichCopy'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import ToolGlowsIcon from './ToolGlowsIcon.vue'

const copyStore = useRichCopyStore()
const props = withDefaults(defineProps<{ modelValue?: boolean; visible?: boolean }>(), {
  modelValue: undefined,
  visible: undefined
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'update:visible', value: boolean): void
}>()
const dialogVisible = computed({
  get: () => props.modelValue ?? props.visible ?? copyStore.isActive,
  set: (value: boolean) => {
    copyStore.isActive = value
    emit('update:modelValue', value)
    emit('update:visible', value)
  }
})
const {
  isCopying,
  tabGroups,
  isLoadingGroups,
  loadTabGroups,
  copyCurrentTab,
  copySelectedTabs,
  copyGroupTabs,
  copyAllTabs
} = useRichCopy()

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

const colorMap: Record<string, string> = {
  grey: '#5f6368',
  blue: '#1a73e8',
  red: '#d93025',
  yellow: '#f9ab00',
  green: '#1e8e3e',
  pink: '#e52592',
  purple: '#9334e6',
  cyan: '#12b5cb',
  orange: '#e8710a'
}

function getGroupColor(color: string): string {
  return colorMap[color] || '#1a73e8'
}

onMounted(async () => {
  await copyStore.loadOptions()
})

watch(dialogVisible, (active) => {
  if (active) {
    void loadTabGroups()
  }
}, { immediate: true })

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
  dialogVisible.value = false
}
</script>

<style scoped>
.copy-options {
  padding: var(--tg-space-4);
}

.field {
  margin-bottom: var(--tg-space-5);
}

.field h4 {
  margin-bottom: var(--tg-space-3);
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--tg-space-2);
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--tg-space-3) var(--tg-space-2) !important;
  text-align: center;
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.quick-action-btn:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
}

.action-icon {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.action-text strong {
  display: block;
  font-size: 0.85rem;
  line-height: 1.2;
}

.action-text small {
  display: block;
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  margin-top: 2px;
}

.groups-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--tg-space-2);
}

.groups-header h4 {
  margin-bottom: 0;
}

.no-groups {
  padding: var(--tg-space-2) var(--tg-space-3);
  background: var(--surface-ground);
  border-radius: var(--tg-radius-sm);
  color: var(--text-color-secondary);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2) var(--tg-space-3);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-left-width: 5px;
  border-radius: var(--tg-radius-md);
}

.group-info {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.group-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.group-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.group-count {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.formats-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.format-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.format-item.default-format {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.format-info {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.default-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  background: var(--primary-color);
  color: white;
  border-radius: 10px;
  font-weight: normal;
}

.format-shortcut {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.format-actions {
  display: flex;
  align-items: center;
  gap: var(--tg-space-1);
}

.replacements-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.replacement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.replacement-pattern {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.search-text,
.replace-text {
  font-family: monospace;
  padding: var(--tg-space-1) 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--tg-radius-sm);
}

.add-replacement {
  display: flex;
  gap: var(--tg-space-2);
  align-items: center;
}

.replacement-inputs {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
  flex: 1;
}

.text-secondary {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}
</style>
