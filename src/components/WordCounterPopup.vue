<template>
  <ToolGlowsDialog
    v-model:visible="visible"
    :modal="true"
    :header="'Statistiques du texte'"
    position="right"
    :style="{ width: '350px' }"
    :closable="true"
    :dismissable-mask="true"
    @hide="closeDialog"
  >
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <i
        class="pi pi-spin pi-spinner"
        style="font-size: var(--tg-text-2xl)"
      ></i>
      <p>Chargement des options...</p>
    </div>

    <div
      v-else
      class="stats-container"
    >
      <!-- Statistiques principales -->
      <div class="stats-group">
        <div class="stat-item">
          <h4>Mots</h4>
          <div class="stat-value">{{ stats?.wordCount || 0 }}</div>
        </div>
        <div class="stat-item">
          <h4>Caractères</h4>
          <div class="stat-value">{{ stats?.characterCount || 0 }}</div>
        </div>
        <div class="stat-item">
          <h4>Phrases</h4>
          <div class="stat-value">{{ stats?.sentenceCount || 0 }}</div>
        </div>
      </div>

      <Divider />

      <!-- Temps de lecture -->
      <div
        v-if="wordCounterStore.options.showReadingTime"
        class="reading-time"
      >
        <h4>Temps de lecture estimé</h4>
        <div class="time-details">
          <i class="pi pi-clock" />
          <span>{{ stats?.readingTime || 0 }} minutes</span>
        </div>
      </div>

      <Divider v-if="wordCounterStore.options.showReadingTime" />

      <!-- Options d'analyse -->
      <div class="analysis-options">
        <h4>Options d'analyse</h4>

        <div class="option-row">
          <Checkbox
            v-model="wordCounterStore.options.countSpaces"
            input-id="count-spaces"
            @change="wordCounterStore.saveOptions"
          />
          <label for="count-spaces">Compter les espaces</label>
        </div>

        <div class="option-row">
          <Checkbox
            v-model="wordCounterStore.options.countPunctuation"
            input-id="count-punctuation"
            @change="wordCounterStore.saveOptions"
          />
          <label for="count-punctuation">Compter la ponctuation</label>
        </div>
      </div>

      <Divider />

      <!-- Mots fréquents -->
      <div
        v-if="wordCounterStore.options.showFrequentWords"
        class="frequent-words"
      >
        <h4>Mots les plus fréquents</h4>
        <div class="words-list">
          <Chip
            v-for="word in stats?.frequentWords || []"
            :key="word.text"
            :label="`${word.text} (${word.count})`"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Fermer"
        icon="pi pi-times"
        text
        @click="close"
      />
      <Button
        label="Copier les statistiques"
        icon="pi pi-copy"
        @click="copyStats"
      />
    </template>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useWordCounter } from '@/composables/useWordCounter'
import { useWordCounterStore } from '@/stores/wordCounter'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const { stats, options, analyzeSelection, updateOptions, copyStats } =
  useWordCounter()

const wordCounterStore = useWordCounterStore()
const isLoading = ref(true)

console.log('[INFO] WordCounterPopup - Component creation')
console.log('[INFO] WordCounterPopup - Initial state:', {
  isInitialized: wordCounterStore.isInitialized,
  options: wordCounterStore.options
})

onMounted(async () => {
  console.log('[INFO] WordCounterPopup - onMounted')
  try {
    if (!wordCounterStore.isInitialized) {
      await wordCounterStore.loadOptions()
      console.log('[SUCCESS] WordCounterPopup - Options loaded')
    } else {
      console.log('[INFO] WordCounterPopup - Store already initialized')
    }
  } catch (error) {
    console.error('[ERROR] WordCounterPopup - Error:', error)
  } finally {
    isLoading.value = false
    console.log('[INFO] WordCounterPopup - Final state:', {
      isLoading: isLoading.value,
      storeInitialized: wordCounterStore.isInitialized
    })
  }
})

// La boîte de dialogue est ouverte depuis la barre ToolGlows. Recalculer à
// cette étape rend le compteur utile sans imposer un clic droit à l'utilisateur.
watch(visible, (isOpen) => {
  if (isOpen) {
    analyzeSelection()
  }
})

const close = () => {
  visible.value = false
}

const closeDialog = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--tg-space-6);
  gap: var(--tg-space-4);
  color: var(--text-color-secondary);
}

.stats-container {
  padding: 0 1rem;
}

.stats-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--tg-space-4);
  text-align: center;
}

.stat-item h4 {
  margin: 0 0 0.5rem;
  color: var(--text-color);
  font-size: var(--tg-size-icon-sm);
}

.stat-value {
  font-size: var(--tg-space-5);
  font-weight: bold;
  color: var(--primary-color);
}

.reading-time {
  text-align: center;
  padding: var(--tg-space-2) 0;
}

.reading-time h4 {
  margin: 0 0 0.5rem;
  color: var(--text-color);
  font-size: var(--tg-size-icon-sm);
}

.time-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--tg-space-2);
  color: var(--text-color-secondary);
}

.analysis-options h4 {
  margin: 0 0 0.5rem;
  color: var(--text-color);
  font-size: var(--tg-size-icon-sm);
}

.option-row {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
  margin-bottom: var(--tg-space-2);
}

.frequent-words h4 {
  margin: 0 0 0.5rem;
  color: var(--text-color);
  font-size: var(--tg-size-icon-sm);
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tg-space-2);
}

:deep(.p-dialog-content) {
  padding-top: 0;
}

:deep(.p-chip) {
  background: var(--surface-hover);
}

</style>
