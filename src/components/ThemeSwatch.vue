<template>
  <div class="theme-swatch">
    <div 
      class="color-preview" 
      :style="`background-color: ${displayColor} !important`"
      @click="showColorPicker = true"
    ></div>
    
    <ColorPicker
      v-model="color"
      v-model:visible="showColorPicker"
      format="hex"
      appendTo="body"
      :inline="false"
      @hide="onHide"
      class="p-colorpicker-overlay"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import ColorPicker from 'primevue/colorpicker'

const settingsStore = useSettingsStore()
const showColorPicker = ref(false)

// Initialisation avec la couleur du store ou la couleur par défaut
const color = ref(settingsStore.settings.toolbarColor?.replace('#', '') || 'ff69b4')

// Pour l'affichage, on utilise toujours la couleur du store
const displayColor = computed(() => {
  const color = settingsStore.settings.toolbarColor || '#ff69b4'
  console.log('Displayed color:', color)
  return color
})

// On met à jour la couleur seulement quand on ferme le picker
function onHide() {
  const newColor = `#${color.value}`
  if (newColor !== settingsStore.settings.toolbarColor) {
    console.log('Updating color:', newColor)
    settingsStore.updateSettings({ toolbarColor: newColor })
  }
}
</script>

<style scoped>
.theme-swatch {
  width: 24px;
  height: 24px;
  position: relative;
  display: inline-block;
}

.color-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--surface-border);
  background-color: var(--primary-color);
}

:deep(.p-colorpicker) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 999999;
}

:deep(.p-colorpicker-panel) {
  background: white;
  border: none;
  box-shadow: var(--card-shadow);
  border-radius: var(--border-radius);
  padding: 0.5rem;
}
</style> 