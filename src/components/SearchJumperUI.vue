<template>
  <Dialog
    v-model:visible="searchStore.isActive"
    :header="'Search Jumper'"
    :modal="true"
    position="right"
    :style="{ width: '450px' }"
    :dismissable-mask="true"
    @hide="closeDialog"
  >
    <div class="toolflowz-search-options">
      <div class="toolflowz-field mb-3">
        <h4>Moteurs de recherche</h4>
        <div class="toolflowz-engines-list">
          <div
            v-for="engine in searchStore.options.engines"
            :key="engine.id"
            class="toolflowz-engine-item"
          >
            <span class="toolflowz-engine-icon">{{ engine.icon }}</span>
            <span class="toolflowz-engine-name">{{ engine.name }}</span>
            <div class="toolflowz-engine-actions">
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

      <div class="toolflowz-field mb-3">
        <h4>Raccourci clavier</h4>
        <InputText
          v-model="searchStore.options.shortcutKey"
          class="w-full"
          @change="searchStore.saveOptions()"
        />
      </div>

      <div class="toolflowz-field mb-3">
        <h4>Options d'affichage</h4>
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.showIcons"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Afficher les icônes</label>
        </div>

        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.openInNewTab"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Ouvrir dans un nouvel onglet</label>
        </div>

        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="searchStore.options.groupByCategory"
            :binary="true"
            @change="searchStore.saveOptions()"
          />
          <label>Grouper par catégorie</label>
        </div>
      </div>

      <div class="toolflowz-field mb-3">
        <h4>Personnalisation</h4>
        <div class="toolflowz-color-pickers">
          <div class="toolflowz-color-field">
            <label>Arrière-plan</label>
            <ColorPicker
              v-model="searchStore.options.customStyles.backgroundColor"
              @change="searchStore.saveOptions()"
            />
          </div>
          <div class="toolflowz-color-field">
            <label>Texte</label>
            <ColorPicker
              v-model="searchStore.options.customStyles.textColor"
              @change="searchStore.saveOptions()"
            />
          </div>
          <div class="toolflowz-color-field">
            <label>Accent</label>
            <ColorPicker
              v-model="searchStore.options.customStyles.accentColor"
              @change="searchStore.saveOptions()"
            />
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showAddEngineDialog"
      :header="editingEngine ? 'Modifier le moteur' : 'Ajouter un moteur'"
      :modal="true"
      class="p-fluid"
    >
      <div class="toolflowz-field mb-3">
        <label>Nom</label>
        <InputText v-model="newEngine.name" />
      </div>
      <div class="toolflowz-field mb-3">
        <label>URL (utilisez {query} pour la recherche)</label>
        <InputText v-model="newEngine.url" />
      </div>
      <div class="toolflowz-field mb-3">
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
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSearchJumperStore } from '@/stores/searchJumper'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'

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
.toolflowz-search-options {
  padding: 1rem;
}

.toolflowz-field {
  margin-bottom: 1.5rem;
}

.toolflowz-field h4 {
  margin-bottom: 0.75rem;
  color: var(--text-color);
}

.toolflowz-engines-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toolflowz-engine-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.toolflowz-engine-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.toolflowz-engine-name {
  flex: 1;
}

.toolflowz-engine-actions {
  display: flex;
  gap: 0.25rem;
}

.toolflowz-field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolflowz-color-pickers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.toolflowz-color-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.toolflowz-color-field label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}
</style> 