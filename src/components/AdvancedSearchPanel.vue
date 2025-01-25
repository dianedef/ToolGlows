<template>
  <div class="advanced-search-panel">
    <div class="search-options">
      <!-- Options de base -->
      <Panel header="Options de base">
        <div class="option-group">
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.exactPhrase" :binary="true" />
            <label>Phrase exacte</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.inTitle" :binary="true" />
            <label>Rechercher dans le titre</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.inUrl" :binary="true" />
            <label>Rechercher dans l'URL</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.inText" :binary="true" />
            <label>Rechercher dans le texte</label>
          </div>
        </div>
      </Panel>

      <!-- Type de fichier -->
      <Panel header="Type de fichier">
        <Dropdown
          v-model="searchOptions.fileType"
          :options="fileTypes"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous les types"
          class="w-full"
        />
      </Panel>

      <!-- Domaine -->
      <Panel header="Domaine">
        <div class="flex flex-col gap-2">
          <span class="p-float-label">
            <InputText
              v-model="searchOptions.site"
              id="site"
              class="w-full"
            />
            <label for="site">ex: wikipedia.org</label>
          </span>
          <span class="p-float-label">
            <InputText
              v-model="searchOptions.excludeSite"
              id="excludeSite"
              class="w-full"
            />
            <label for="excludeSite">Domaine à exclure</label>
          </span>
        </div>
      </Panel>

      <!-- Date -->
      <Panel header="Date">
        <Dropdown
          v-model="searchOptions.dateRange"
          :options="dateRanges"
          optionLabel="label"
          optionValue="value"
          placeholder="Toutes les dates"
          class="w-full"
        />
      </Panel>

      <!-- Langue -->
      <Panel header="Langue">
        <Dropdown
          v-model="searchOptions.language"
          :options="languages"
          optionLabel="label"
          optionValue="value"
          placeholder="Toutes les langues"
          class="w-full"
        />
      </Panel>

      <!-- Mots exclus -->
      <Panel header="Mots exclus">
        <div class="excluded-words">
          <span class="p-input-icon-right w-full">
            <InputText
              v-model="newExcludedWord"
              @keyup.enter="addExcludedWord"
              placeholder="Ajouter un mot à exclure"
              class="w-full"
            />
            <Button
              icon="pi pi-plus"
              @click="addExcludedWord"
              severity="secondary"
              text
              rounded
            />
          </span>
        </div>
        <div class="tags mt-2">
          <Chip
            v-for="(word, index) in searchOptions.excludeWords"
            :key="index"
            :label="word"
            removable
            @remove="removeExcludedWord(index)"
          />
        </div>
      </Panel>

      <!-- Plage numérique -->
      <Panel header="Plage numérique">
        <div class="number-range">
          <InputNumber
            v-model="searchOptions.numRange.start"
            placeholder="Min"
            class="w-full"
            :min="0"
          />
          <span>à</span>
          <InputNumber
            v-model="searchOptions.numRange.end"
            placeholder="Max"
            class="w-full"
            :min="0"
          />
        </div>
      </Panel>

      <!-- Options avancées -->
      <Panel header="Options avancées">
        <div class="option-group">
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.cache" :binary="true" />
            <label>Version en cache</label>
          </div>
          <div class="field-checkbox">
            <Checkbox v-model="searchOptions.related" :binary="true" />
            <label>Sites similaires</label>
          </div>
        </div>
      </Panel>
    </div>

    <Panel header="Aperçu de la requête" class="mt-4">
      <code>{{ previewQuery }}</code>
    </Panel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdvancedSearch } from '@/composables/useAdvancedSearch'
import Panel from 'primevue/panel'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Chip from 'primevue/chip'

const {
  searchOptions,
  fileTypes,
  dateRanges,
  languages,
  buildAdvancedQuery
} = useAdvancedSearch()

const newExcludedWord = ref('')

const addExcludedWord = () => {
  if (newExcludedWord.value.trim()) {
    if (!searchOptions.value.excludeWords) {
      searchOptions.value.excludeWords = []
    }
    searchOptions.value.excludeWords.push(newExcludedWord.value.trim())
    newExcludedWord.value = ''
  }
}

const removeExcludedWord = (index: number) => {
  searchOptions.value.excludeWords?.splice(index, 1)
}

const previewQuery = computed(() => {
  return buildAdvancedQuery('votre recherche')
})
</script>

<style scoped>
.advanced-search-panel {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.search-options {
  display: grid;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.excluded-words {
  display: flex;
  gap: 0.5rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.number-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.p-panel) {
  margin-bottom: 0;
}

:deep(.p-panel .p-panel-header) {
  padding: 1rem;
  font-size: 1rem;
}

:deep(.p-panel .p-panel-content) {
  padding: 1rem;
}

:deep(.p-float-label) {
  width: 100%;
}

:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-chip) {
  background: var(--primary-color-lighter);
}
</style> 