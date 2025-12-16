<template>
  <Dialog
    v-model:visible="ocrStore.isActive"
    :modal="true"
    :dismissable-mask="true"
    :header="'OCR instantané'"
    position="right"
    :style="{ width: '350px' }"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="ocr-options">
      <div
        v-if="isLoading"
        class="loading-state"
      >
        <i
          class="pi pi-spin pi-spinner"
          style="font-size: 2rem"
        ></i>
        <p>Chargement des options...</p>
      </div>
      
      <template v-else>
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
            option-label="name"
            option-value="code"
            class="w-full"
            @change="ocrStore.saveOptions()"
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
      </template>
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
  try {
    await ocrStore.loadOptions()
  } catch (error) {
    console.error('[ERROR] Failed to load OCR options:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.ocr-options {
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: var(--text-color-secondary);
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