<template>
  <Dialog
    v-model:visible="scrollStore.isActive"
    :modal="true"
    :dismissableMask="true"
    :header="'Défilement Infini'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
  >
    <div class="scroll-options">
      <div class="field mb-3">
        <h4>Seuil de déclenchement</h4>
        <div class="threshold-slider">
          <Slider
            v-model="scrollStore.options.threshold"
            :min="100"
            :max="1000"
            :step="50"
            @change="scrollStore.saveOptions()"
          />
          <small>{{ scrollStore.options.threshold }}px avant la fin</small>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Options</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="scrollStore.options.autoLoad"
            :binary="true"
            @change="scrollStore.saveOptions()"
          />
          <label>Chargement automatique</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="scrollStore.options.showProgress"
            :binary="true"
            @change="scrollStore.saveOptions()"
          />
          <label>Afficher la progression</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Limite de pages</h4>
        <InputNumber
          v-model="scrollStore.options.maxPages"
          :min="1"
          :max="50"
          @change="scrollStore.saveOptions()"
          class="w-full"
        />
        <small>Nombre maximum de pages à charger</small>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useToolflowzInfiniteScrollStore } from '@/stores/infiniteScroll'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'

const scrollStore = useToolflowzInfiniteScrollStore()

const closeDialog = () => {
  scrollStore.isActive = false
}

onMounted(async () => {
  await scrollStore.loadOptions()
})
</script>

<style scoped>
.scroll-options {
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

.threshold-slider {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

small {
  color: var(--text-color-secondary);
  display: block;
  text-align: center;
}
</style> 