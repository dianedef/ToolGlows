<template>
  <ToolGlowsDialog
    v-if="!isLoading"
    v-model:visible="dialogVisible"
    :modal="true"
    :dismissable-mask="true"
    :header="'Mode sombre'"
    position="right"
    :style="{ width: '350px' }"
    :pt="{ root: { class: 'toolglows-dark-mode-dialog', 'data-toolglows-ui': 'true' } }"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="toolglows-dark-mode-options">
      <div class="toolglows-field mb-3">
        <h4>État</h4>
        <label class="toolglows-field-checkbox toolglows-checkbox-card mb-2">
          <Checkbox
            :model-value="darkModeStore.shouldActivateDarkMode && !darkModeStore.isDomainExcluded"
            :binary="true"
            input-id="dark-mode-toggle"
            name="dark-mode-toggle"
            @update:model-value="darkModeStore.setActive($event)"
          />
          <span class="p-checkbox-label">Activer le mode sombre</span>
        </label>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Couleurs</h4>
        <div class="toolglows-palette-picker mb-3">
          <label>Palette</label>
          <SelectButton
            :model-value="darkModeStore.options.palettePreset"
            :options="paletteOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-label="Palette du mode sombre"
            @update:model-value="darkModeStore.setPalettePreset($event)"
          />
        </div>
        <p
          v-if="darkModeStore.options.palettePreset === 'graphite'"
          class="toolglows-palette-description mb-3"
        >
          Palette graphite harmonisée : surfaces neutres, actions bleues et succès vert sauge.
        </p>
        <template v-else>
        <div class="toolglows-color-picker mb-2">
          <label>Arrière-plan</label>
          <ToolGlowsColorPicker
            :model-value="darkModeStore.options.backgroundColor"
            @update:model-value="setPaletteColor('backgroundColor', $event)"
          />
        </div>
        <div class="toolglows-color-picker mb-2">
          <label>Texte</label>
          <ToolGlowsColorPicker
            :model-value="darkModeStore.options.textColor"
            @update:model-value="setPaletteColor('textColor', $event)"
          />
        </div>
        <div class="toolglows-color-picker mb-2">
          <label>Liens</label>
          <ToolGlowsColorPicker
            :model-value="darkModeStore.options.linkColor"
            @update:model-value="setPaletteColor('linkColor', $event)"
          />
        </div>
        </template>
      </div>

      <div class="toolglows-field mb-3">
        <h4>Apparence</h4>
        <div class="toolglows-field-slider mb-2">
          <label>Contraste</label>
          <Slider
            :model-value="darkModeStore.options.contrastLevel"
            :min="0.5"
            :max="2"
            :step="0.1"
            @update:model-value="setNumericOption('contrastLevel', $event)"
          />
        </div>
        <div class="toolglows-field-slider mb-2">
          <label>Durée de transition (ms)</label>
          <Slider
            :model-value="darkModeStore.options.transitionDuration"
            :min="0"
            :max="1000"
            :step="50"
            @update:model-value="setNumericOption('transitionDuration', $event)"
          />
        </div>
      </div>

      <Divider />

      <div class="toolglows-field mb-3">
        <h4>Programmation</h4>
        <label class="toolglows-field-checkbox toolglows-checkbox-card mb-2">
          <Checkbox
            v-model="darkModeStore.options.syncWithSystem"
            :binary="true"
            input-id="sync-system"
            name="sync-system"
            @update:model-value="darkModeStore.setSyncWithSystem($event)"
          />
          <span class="p-checkbox-label">Synchroniser avec le système</span>
        </label>

        <label class="toolglows-field-checkbox toolglows-checkbox-card mb-2">
          <Checkbox
            v-model="darkModeStore.options.autoEnable"
            :binary="true"
            input-id="auto-enable"
            name="auto-enable"
            @update:model-value="darkModeStore.setAutoEnable($event)"
          />
          <span class="p-checkbox-label">Activer automatiquement</span>
        </label>

        <div
          v-if="darkModeStore.options.autoEnable"
          class="toolglows-schedule"
        >
          <div class="toolglows-time-picker mb-2">
            <label>Début</label>
            <TimeSelector
              :model-value="darkModeStore.options.scheduleStart"
              @update:model-value="darkModeStore.updateOptions({ scheduleStart: $event })"
            />
          </div>
          <div class="toolglows-time-picker">
            <label>Fin</label>
            <TimeSelector
              :model-value="darkModeStore.options.scheduleEnd"
              @update:model-value="darkModeStore.updateOptions({ scheduleEnd: $event })"
            />
          </div>
        </div>
      </div>

      <Divider />

      <div class="toolglows-field mb-3">
        <h4>Sites exclus</h4>
        <div class="toolglows-excluded-domains">
          <div
            v-if="darkModeStore.options.excludedDomains.length === 0"
            class="text-muted"
          >
            Aucun site exclu
          </div>
          <ul v-else>
            <li
              v-for="domain in darkModeStore.options.excludedDomains"
              :key="domain"
              class="mb-2"
            >
              {{ domain }}
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                @click="darkModeStore.includeDomain(domain)"
              />
            </li>
          </ul>
          <div
            v-if="darkModeStore.currentDomain"
            class="toolglows-add-domain mt-2"
          >
            <Button
              :label="'Exclure ' + darkModeStore.currentDomain"
              icon="pi pi-plus"
              severity="secondary"
              :disabled="darkModeStore.isDomainExcluded"
              @click="darkModeStore.excludeDomain(darkModeStore.currentDomain)"
            />
          </div>
        </div>
      </div>
    </div>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDarkModeStore } from '@/stores/darkMode'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import ToolGlowsColorPicker from './ToolGlowsColorPicker.vue'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import TimeSelector from './TimeSelector.vue'
import type { DarkModePalettePreset } from '@/stores/darkModePalette'

const darkModeStore = useDarkModeStore()
const isLoading = ref(true)
const paletteOptions: Array<{ label: string; value: DarkModePalettePreset }> = [
  { label: 'Graphite', value: 'graphite' },
  { label: 'Personnalisé', value: 'custom' }
]

const setPaletteColor = (
  color: 'backgroundColor' | 'textColor' | 'linkColor',
  value: string | undefined
) => {
  if (value) void darkModeStore.setPaletteColor(color, value)
}

const setNumericOption = (
  option: 'contrastLevel' | 'transitionDuration',
  value: number | number[] | undefined
) => {
  if (typeof value === 'number') void darkModeStore.updateOptions({ [option]: value })
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

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
  dialogVisible.value = false
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
.toolglows-dark-mode-options {
  padding: var(--tg-space-4);
}

.toolglows-field {
  margin-bottom: var(--tg-space-4);
}

.toolglows-field h4 {
  margin-bottom: var(--tg-space-2);
  color: var(--text-color);
}

.toolglows-color-picker,
.toolglows-palette-picker,
.toolglows-field-slider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
}

.toolglows-field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.toolglows-palette-description {
  color: var(--tg-text-secondary);
  line-height: var(--tg-line-height-copy);
}

.toolglows-checkbox-card {
  width: var(--tg-full-width);
  min-height: var(--tg-size-control-comfortable);
  padding: var(--tg-space-2) var(--tg-space-3);
  border: 1px solid var(--surface-border);
  border-radius: var(--tg-radius-control);
  cursor: pointer;
}

.toolglows-checkbox-card:hover {
  background: var(--surface-hover);
}

.toolglows-schedule {
  margin-top: var(--tg-space-4);
  padding-left: var(--tg-space-5);
}

.toolglows-time-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
}

.toolglows-excluded-domains {
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--tg-space-2);
    background: var(--surface-ground);
    border-radius: var(--border-radius);
  }
}

.text-muted {
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
