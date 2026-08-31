<template>
  <ToolGlowsDialog
    v-model:visible="searchStore.isActive"
    :header="'Search Jumper'"
    :modal="true"
    position="right"
    :style="{ width: '450px' }"
    :dismissable-mask="true"
    @hide="closeDialog"
  >
    <div class="toolglows-search-options">
      <div class="toolglows-field mb-3">
        <h4>Moteurs de recherche</h4>
        <div class="toolglows-engines-list">
          <div
            v-for="engine in searchStore.options.engines"
            :key="engine.id"
            class="toolglows-engine-item"
          >
            <span class="toolglows-engine-icon">{{ engine.icon }}</span>
            <span class="toolglows-engine-name">{{ engine.name }}</span>
            <div class="toolglows-engine-actions">
              <Button
                icon="pi pi-pencil"
                text
                severity="secondary"
                @click="editEngine(engine)"
              />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                @click="searchStore.removeEngine(engine.id)"
              />
            </div>
          </div>
          <Button
            label="Ajouter un moteur"
            icon="pi pi-plus"
            @click="showAddEngineDialog = true"
          />
        </div>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Raccourci clavier</h4>
        <InputText
          v-model="searchStore.options.shortcutKey"
          class="w-full"
          @change="searchStore.saveOptions()"
        />
      </div>

      <div class="toolglows-field mb-3">
        <h4>Options d'affichage</h4>
        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.showIcons"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Afficher les icônes</label>
        </div>

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.openInNewTab"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Ouvrir dans un nouvel onglet</label>
        </div>

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.groupByCategory"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Grouper par catégorie</label>
        </div>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Personnalisation</h4>
        <div class="toolglows-color-pickers">
          <div class="toolglows-color-field">
            <label>Arrière-plan</label>
            <ToolGlowsColorPicker
              v-model="searchStore.options.customStyles.backgroundColor"
              @update:model-value="searchStore.saveOptions()"
            />
          </div>
          <div class="toolglows-color-field">
            <label>Texte</label>
            <ToolGlowsColorPicker
              v-model="searchStore.options.customStyles.textColor"
              @update:model-value="searchStore.saveOptions()"
            />
          </div>
          <div class="toolglows-color-field">
            <label>Accent</label>
            <ToolGlowsColorPicker
              v-model="searchStore.options.customStyles.accentColor"
              @update:model-value="searchStore.saveOptions()"
            />
          </div>
        </div>
      </div>
    </div>

    <ToolGlowsDialog
      v-model:visible="showAddEngineDialog"
      :header="editingEngine ? 'Modifier le moteur' : 'Ajouter un moteur'"
      :modal="true"
      class="p-fluid"
    >
      <div class="toolglows-field mb-3">
        <label>Nom</label>
        <InputText v-model="newEngine.name" />
      </div>
      <div class="toolglows-field mb-3">
        <label>URL (utilisez {query} pour la recherche)</label>
        <InputText v-model="newEngine.url" />
      </div>
      <div class="toolglows-field mb-3">
        <label>Icône</label>
        <InputText v-model="newEngine.icon" />
      </div>
      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showAddEngineDialog = false"
        />
        <Button
          :label="editingEngine ? 'Modifier' : 'Ajouter'"
          icon="pi pi-check"
          @click="saveEngine"
        />
      </template>
    </ToolGlowsDialog>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSearchJumperStore } from '@/stores/searchJumper'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ToolGlowsColorPicker from './ToolGlowsColorPicker.vue'

const searchStore = useSearchJumperStore()
const showAddEngineDialog = ref(false)
const editingEngine = ref<string | null>(null)
const newEngine = ref({
  id: '',
  name: '',
  url: '',
  icon: ''
})

const closeDialog = () => {
  searchStore.isActive = false
}

onMounted(async () => {
  await searchStore.loadOptions()
})

function editEngine(engine: any) {
  editingEngine.value = engine.id
  newEngine.value = { ...engine }
  showAddEngineDialog.value = true
}

function saveEngine() {
  if (editingEngine.value) {
    searchStore.updateEngine(editingEngine.value, newEngine.value)
  } else {
    newEngine.value.id = Date.now().toString()
    searchStore.addEngine(newEngine.value)
  }
  showAddEngineDialog.value = false
  editingEngine.value = null
  newEngine.value = { id: '', name: '', url: '', icon: '' }
}
</script>

<style scoped>
.toolglows-search-options {
  padding: var(--tg-space-4);
}

.toolglows-field {
  margin-bottom: var(--tg-space-5);
}

.toolglows-field h4 {
  margin-bottom: var(--tg-space-3);
  color: var(--text-color);
}

.toolglows-engines-list {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.toolglows-engine-item {
  display: flex;
  align-items: center;
  padding: var(--tg-space-2);
  background: var(--surface-card);
  border-radius: var(--tg-radius-md);
  border: 1px solid var(--surface-border);
}

.toolglows-engine-icon {
  font-size: var(--tg-size-tool-icon);
  margin-right: var(--tg-space-2);
}

.toolglows-engine-name {
  flex: 1;
}

.toolglows-engine-actions {
  display: flex;
  gap: var(--tg-space-1);
}

.toolglows-field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-color-pickers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--tg-space-4);
}

.toolglows-color-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-color-field label {
  font-size: var(--tg-size-icon-sm);
  color: var(--text-color-secondary);
}
</style>

