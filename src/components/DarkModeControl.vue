<template>
  <Dialog
    v-if="!isLoading"
    v-model:visible="darkModeStore.isActive"
    :modal="true"
    :dismissableMask="true"
    :header="'Mode sombre'"
    position="right"
    :style="{ width: '350px' }"
    @hide="closeDialog"
  >
    <div class="dark-mode-options">
      <div class="field mb-3">
        <h4>Couleurs</h4>
        <div class="color-picker mb-2">
          <label>Arrière-plan</label>
          <ColorPicker
            v-model="darkModeStore.options.backgroundColor"
            @change="darkModeStore.saveOptions()"
          />
        </div>
        <div class="color-picker mb-2">
          <label>Texte</label>
          <ColorPicker
            v-model="darkModeStore.options.textColor"
            @change="darkModeStore.saveOptions()"
          />
        </div>
        <div class="color-picker mb-2">
          <label>Liens</label>
          <ColorPicker
            v-model="darkModeStore.options.linkColor"
            @change="darkModeStore.saveOptions()"
          />
        </div>
      </div>

      <div class="field mb-3">
        <h4>Contraste</h4>
        <Slider
          v-model="darkModeStore.options.contrastLevel"
          :min="0.5"
          :max="2"
          :step="0.1"
          @change="darkModeStore.saveOptions()"
        />
      </div>

      <div class="field-checkbox mb-3">
        <Checkbox
          v-model="darkModeStore.options.invertImages"
          :binary="true"
          @change="darkModeStore.saveOptions()"
        />
        <label>Inverser les images</label>
      </div>

      <Divider />

      <div class="field mb-3">
        <h4>Programmation</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="darkModeStore.options.autoEnable"
            :binary="true"
            @change="darkModeStore.saveOptions()"
          />
          <label>Activer automatiquement</label>
        </div>
        
        <div v-if="darkModeStore.options.autoEnable" class="schedule">
          <div class="time-picker mb-2">
            <label>Début</label>
            <Calendar
              v-model="darkModeStore.options.scheduleStart"
              timeOnly
              @change="darkModeStore.saveOptions()"
            />
          </div>
          <div class="time-picker">
            <label>Fin</label>
            <Calendar
              v-model="darkModeStore.options.scheduleEnd"
              timeOnly
              @change="darkModeStore.saveOptions()"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDarkModeStore } from '@/stores/darkMode'
import Dialog from 'primevue/dialog'
import ColorPicker from 'primevue/colorpicker'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import Divider from 'primevue/divider'

const darkModeStore = useDarkModeStore()
const isLoading = ref(true)

const closeDialog = () => {
  darkModeStore.isActive = false
}

onMounted(async () => {
  try {
    await darkModeStore.loadOptions()
  } catch (error) {
    console.error('[ERROR] Failed to load dark mode options:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.dark-mode-options {
  padding: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.field h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.color-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.schedule {
  margin-top: 1rem;
  padding-left: 1.5rem;
}

.time-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
</style> 