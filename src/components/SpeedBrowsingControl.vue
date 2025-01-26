<template>
  <Dialog
    v-model:visible="speedBrowsingStore.isActive"
    :modal="true"
    :dismissableMask="true"
    :header="'Navigation rapide'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
    appendTo="self"
  >
    <div class="speed-options">
      <!-- Vitesse de défilement -->
      <div class="field mb-3">
        <h4>Vitesse de défilement</h4>
        <div class="slider-container">
          <Slider
            v-model="speedBrowsingStore.options.scrollSpeed"
            :min="1"
            :max="10"
            :step="1"
            @change="speedBrowsingStore.saveOptions()"
          />
          <span class="slider-value">{{ speedBrowsingStore.options.scrollSpeed }}</span>
        </div>
      </div>

      <Divider />

      <!-- Défilement fluide -->
      <div class="field mb-3">
        <h4>Défilement fluide</h4>
        <ToggleButton
          v-model="speedBrowsingStore.options.smoothScroll"
          onLabel="Activé"
          offLabel="Désactivé"
          class="w-full"
          @change="speedBrowsingStore.saveOptions()"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSpeedBrowsingStore } from '@/stores/speedBrowsing'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Divider from 'primevue/divider'
import ToggleButton from 'primevue/togglebutton'

const speedBrowsingStore = useSpeedBrowsingStore()

const closeDialog = () => {
  speedBrowsingStore.isActive = false
}

onMounted(async () => {
  await speedBrowsingStore.loadOptions()
})
</script>

<style scoped>
.speed-options {
  padding: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider-value {
  min-width: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

:deep(.p-togglebutton) {
  width: 100%;
}

:deep(.p-togglebutton .p-button-label) {
  flex: 1;
  text-align: center;
}
</style> 