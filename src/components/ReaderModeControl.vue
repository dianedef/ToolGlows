<template>
  <Dialog 
    v-if="!isLoading"
    v-model:visible="readerModeStore.isActive"
    :modal="true"
    :dismissableMask="true"
    :header="'Mode lecture'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
  >
    <div class="reader-options">
      <h4>Apparence</h4>
      
      <div class="field mb-3">
        <label>Police</label>
        <Dropdown
          v-model="readerModeStore.options.fontFamily"
          :options="['system-ui', 'serif', 'sans-serif', 'monospace']"
          @change="readerModeStore.saveOptions()"
        />
      </div>

      <div class="field mb-3">
        <label>Taille du texte</label>
        <Slider 
          v-model="readerModeStore.options.fontSize"
          :min="12"
          :max="24"
          @change="readerModeStore.saveOptions()"
        />
      </div>

      <div class="field mb-3">
        <label>Hauteur de ligne</label>
        <Slider
          v-model="readerModeStore.options.lineHeight"
          :min="1"
          :max="2"
          :step="0.1"
          @change="readerModeStore.saveOptions()"
        />
      </div>

      <div class="field mb-3">
        <label>Largeur maximale</label>
        <Slider
          v-model="readerModeStore.options.maxWidth"
          :min="400"
          :max="1200"
          :step="50"
          @change="readerModeStore.saveOptions()"
        />
      </div>

      <h4>Thème</h4>
      <div class="field-radiobutton mb-3">
        <RadioButton
          v-model="readerModeStore.options.theme"
          value="light"
          @change="readerModeStore.saveOptions()"
        />
        <label>Clair</label>
      </div>
      <div class="field-radiobutton mb-3">
        <RadioButton
          v-model="readerModeStore.options.theme"
          value="sepia"
          @change="readerModeStore.saveOptions()"
        />
        <label>Sépia</label>
      </div>
      <div class="field-radiobutton mb-3">
        <RadioButton
          v-model="readerModeStore.options.theme"
          value="dark"
          @change="readerModeStore.saveOptions()"
        />
        <label>Sombre</label>
      </div>

      <h4>Contenu</h4>
      <div class="field-checkbox mb-3">
        <Checkbox
          v-model="readerModeStore.options.showImages"
          :binary="true"
          @change="readerModeStore.saveOptions()"
        />
        <label>Afficher les images</label>
      </div>
      <div class="field-checkbox mb-3">
        <Checkbox
          v-model="readerModeStore.options.showLinks"
          :binary="true"
          @change="readerModeStore.saveOptions()"
        />
        <label>Afficher les URLs des liens</label>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReaderModeStore } from '@/stores/readerMode'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Slider from 'primevue/slider'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'

const readerModeStore = useReaderModeStore()
const isLoading = ref(true)

const closeDialog = () => {
  readerModeStore.isActive = false
}

onMounted(async () => {
  await readerModeStore.loadOptions()
  isLoading.value = false
})
</script>

<style scoped>
.reader-options {
  padding: 1rem;
}
.field {
  margin-bottom: 1rem;
}
.field label {
  display: block;
  margin-bottom: 0.5rem;
}
</style> 