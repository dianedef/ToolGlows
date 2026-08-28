<template>
  <Dialog
    v-model:visible="scrollStore.isActive"
    :modal="true"
    :dismissable-mask="true"
    :header="'Défilement Infini'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
  >
    <div class="toolglows-scroll-options">
      <div class="toolglows-field mb-3">
        <h4>Seuil de déclenchement</h4>
        <div class="toolglows-threshold-slider">
          <Slider
            v-model="scrollStore.options.threshold"
            :min="100"
            :max="1000"
            :step="50"
            @change="scrollStore.saveOptions()"
          />
          <small class="toolglows-small">{{ scrollStore.options.threshold }}px avant la fin</small>
        </div>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Options</h4>
        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="scrollStore.options.autoLoad"
            :binary="true"
            @change="scrollStore.saveOptions()"
          />
          <label>Chargement automatique</label>
        </div>

        <div class="toolglows-field-checkbox mb-2">
          <Checkbox
            v-model="scrollStore.options.showProgress"
            :binary="true"
            @change="scrollStore.saveOptions()"
          />
          <label>Afficher la progression</label>
        </div>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Limite de pages</h4>
        <InputNumber
          v-model="scrollStore.options.maxPages"
          :min="1"
          :max="50"
          class="w-full"
          @change="scrollStore.saveOptions()"
        />
        <small class="toolglows-small">Nombre maximum de pages à charger</small>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useToolGlowsInfiniteScrollStore } from '@/stores/infiniteScroll'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'

const scrollStore = useToolGlowsInfiniteScrollStore()

const closeDialog = () => {
  scrollStore.isActive = false
}

onMounted(async () => {
  await scrollStore.loadOptions()
})
</script>

<style scoped>
.toolglows-scroll-options {
  padding: var(--tg-space-4);
}

.toolglows-field {
  margin-bottom: var(--tg-space-4);
}

.toolglows-field h4 {
  margin-bottom: var(--tg-space-2);
  color: var(--text-color);
}

.toolglows-field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-threshold-slider {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
}

.toolglows-small {
  color: var(--text-color-secondary);
  display: block;
  text-align: center;
}
</style>
