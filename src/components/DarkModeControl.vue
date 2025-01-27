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
    appendTo="body"
  >
    <div class="toolflowz-dark-mode-options">
      <div class="toolflowz-field mb-3">
        <h4>État</h4>
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="darkModeStore.isActive"
            :binary="true"
            @update:modelValue="darkModeStore.setActive($event)"
            inputId="dark-mode-toggle"
            name="dark-mode-toggle"
          />
          <label class="p-checkbox-label" for="dark-mode-toggle">Activer le mode sombre</label>
        </div>
      </div>

      <div class="toolflowz-field mb-3">
        <h4>Couleurs</h4>
        <div class="toolflowz-color-picker mb-2">
          <label>Arrière-plan</label>
          <ColorPicker
            v-model="darkModeStore.options.backgroundColor"
            @update:modelValue="darkModeStore.saveOptions()"
          />
        </div>
        <div class="toolflowz-color-picker mb-2">
          <label>Texte</label>
          <ColorPicker
            v-model="darkModeStore.options.textColor"
            @update:modelValue="darkModeStore.saveOptions()"
          />
        </div>
        <div class="toolflowz-color-picker mb-2">
          <label>Liens</label>
          <ColorPicker
            v-model="darkModeStore.options.linkColor"
            @update:modelValue="darkModeStore.saveOptions()"
          />
        </div>
      </div>

      <div class="toolflowz-field mb-3">
        <h4>Apparence</h4>
        <div class="toolflowz-field-slider mb-2">
          <label>Contraste</label>
          <Slider
            v-model="darkModeStore.options.contrastLevel"
            :min="0.5"
            :max="2"
            :step="0.1"
            @update:modelValue="darkModeStore.saveOptions()"
          />
        </div>
        <div class="toolflowz-field-slider mb-2">
          <label>Durée de transition (ms)</label>
          <Slider
            v-model="darkModeStore.options.transitionDuration"
            :min="0"
            :max="1000"
            :step="50"
            @update:modelValue="darkModeStore.saveOptions()"
          />
        </div>
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="darkModeStore.options.invertImages"
            :binary="true"
            @update:modelValue="darkModeStore.saveOptions()"
            inputId="invert-images"
            name="invert-images"
          />
          <label class="p-checkbox-label" for="invert-images">Inverser les images</label>
        </div>
      </div>

      <Divider />

      <div class="toolflowz-field mb-3">
        <h4>Programmation</h4>
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="darkModeStore.options.syncWithSystem"
            :binary="true"
            @update:modelValue="darkModeStore.saveOptions()"
            inputId="sync-system"
            name="sync-system"
          />
          <label class="p-checkbox-label" for="sync-system">Synchroniser avec le système</label>
        </div>
        
        <div class="toolflowz-field-checkbox mb-2">
          <Checkbox
            v-model="darkModeStore.options.autoEnable"
            :binary="true"
            @update:modelValue="darkModeStore.saveOptions()"
            inputId="auto-enable"
            name="auto-enable"
          />
          <label class="p-checkbox-label" for="auto-enable">Activer automatiquement</label>
        </div>
        
        <div v-if="darkModeStore.options.autoEnable" class="toolflowz-schedule">
          <div class="toolflowz-time-picker mb-2">
            <label>Début</label>
            <TimeSelector
              v-model="darkModeStore.options.scheduleStart"
              @update:modelValue="darkModeStore.saveOptions()"
            />
          </div>
          <div class="toolflowz-time-picker">
            <label>Fin</label>
            <TimeSelector
              v-model="darkModeStore.options.scheduleEnd"
              @update:modelValue="darkModeStore.saveOptions()"
            />
          </div>
        </div>
      </div>

      <Divider />

      <div class="toolflowz-field mb-3">
        <h4>Sites exclus</h4>
        <div class="toolflowz-excluded-domains">
          <div v-if="darkModeStore.options.excludedDomains.length === 0" class="text-muted">
            Aucun site exclu
          </div>
          <ul v-else>
            <li v-for="domain in darkModeStore.options.excludedDomains" :key="domain" class="mb-2">
              {{ domain }}
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                @click="darkModeStore.includeDomain(domain)"
              />
            </li>
          </ul>
          <div class="toolflowz-add-domain mt-2" v-if="darkModeStore.currentDomain">
            <Button
              :label="'Exclure ' + darkModeStore.currentDomain"
              icon="pi pi-plus"
              severity="secondary"
              @click="darkModeStore.excludeDomain(darkModeStore.currentDomain)"
              :disabled="darkModeStore.isDomainExcluded"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDarkModeStore } from '@/stores/darkMode'
import Dialog from 'primevue/dialog'
import ColorPicker from 'primevue/colorpicker'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Button from 'primevue/button'
import TimeSelector from './TimeSelector.vue'

const darkModeStore = useDarkModeStore()
const isLoading = ref(true)

// Initialisation synchrone
const init = async () => {
  try {
    await darkModeStore.loadOptions()
  } catch (error) {
    console.error('[ERROR] Failed to load dark mode options:', error)
  } finally {
    isLoading.value = false
  }
}

// Appel immédiat de l'initialisation
init()

const closeDialog = () => {
  darkModeStore.isActive = false
}

// Convertir les chaînes de temps en objets Date pour le Calendar
const getTimeAsDate = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

const scheduleStart = computed(() => getTimeAsDate(darkModeStore.options.scheduleStart))
const scheduleEnd = computed(() => getTimeAsDate(darkModeStore.options.scheduleEnd))

// Gérer les changements de temps
const onTimeChange = (value: unknown, isStart: boolean) => {
  if (!value || !(value instanceof Date)) return
  
  const timeString = `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
  if (isStart) {
    darkModeStore.options.scheduleStart = timeString
  } else {
    darkModeStore.options.scheduleEnd = timeString
  }
  darkModeStore.saveOptions()
}
</script>

<style scoped>
.toolflowz-dark-mode-options {
  padding: 1rem;
}

.toolflowz-field {
  margin-bottom: 1rem;
}

.toolflowz-field h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.toolflowz-color-picker,
.toolflowz-field-slider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toolflowz-field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolflowz-schedule {
  margin-top: 1rem;
  padding-left: 1.5rem;
}

.toolflowz-time-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toolflowz-excluded-domains {
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: var(--surface-ground);
    border-radius: var(--border-radius);
  }
}

.text-muted {
  color: var(--text-color-secondary);
  font-style: italic;
}
</style> 