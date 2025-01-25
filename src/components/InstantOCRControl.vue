<template>
  <Dialog
    v-model:visible="ocrStore.isActive"
    :modal="true"
    :dismissableMask="true"
    :header="'OCR Instantané'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
  >
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Chargement des options...</p>
    </div>
    
    <div v-else class="ocr-options">
      <div class="field mb-3">
        <h4>Langue</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="ocrStore.options.autoDetectLanguage"
            :binary="true"
            @change="ocrStore.saveOptions()"
          />
          <label>Détection automatique</label>
        </div>
        
        <Dropdown
          v-if="!ocrStore.options.autoDetectLanguage"
          v-model="ocrStore.options.language"
          :options="languageOptions"
          optionLabel="name"
          optionValue="code"
          @change="ocrStore.saveOptions()"
          class="w-full"
        />
      </div>

      <div class="field mb-3">
        <h4>Options</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="ocrStore.options.copyToClipboard"
            :binary="true"
            @change="ocrStore.saveOptions()"
          />
          <label>Copier automatiquement</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="ocrStore.options.showConfidence"
            :binary="true"
            @change="ocrStore.saveOptions()"
          />
          <label>Afficher le score de confiance</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="ocrStore.options.enableSpellCheck"
            :binary="true"
            @change="ocrStore.saveOptions()"
          />
          <label>Correction orthographique</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Seuil de confiance minimum</h4>
        <Slider
          v-model="ocrStore.options.minimumConfidence"
          :min="0"
          :max="100"
          :step="5"
          @change="ocrStore.saveOptions()"
        />
        <small>{{ ocrStore.options.minimumConfidence }}%</small>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInstantOCRStore } from '@/stores/instantOCR'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'

const ocrStore = useInstantOCRStore()
const isLoading = ref(true)

const closeDialog = () => {
  ocrStore.isActive = false
}

const languageOptions = [
  { name: 'Français', code: 'fra' },
  { name: 'English', code: 'eng' },
  { name: 'Español', code: 'spa' },
  { name: 'Deutsch', code: 'deu' },
  { name: 'Italiano', code: 'ita' },
  { name: 'Português', code: 'por' },
  { name: 'Nederlands', code: 'nld' },
  { name: 'Polski', code: 'pol' },
  { name: 'Русский', code: 'rus' },
  { name: '中文', code: 'chi_sim' },
  { name: '日本語', code: 'jpn' },
  { name: '한국어', code: 'kor' }
]

onMounted(async () => {
  if (!ocrStore.isInitialized) {
    await ocrStore.loadOptions()
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.ocr-options {
  padding: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

small {
  color: var(--text-color-secondary);
  display: block;
  text-align: center;
  margin-top: 0.5rem;
}
</style> 