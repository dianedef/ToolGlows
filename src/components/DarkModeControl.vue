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
    <div
      class="toolglows-dark-mode-options"
      data-toolglows-ui="true"
    >
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
        <div class="toolglows-saved-themes mb-3">
          <div class="toolglows-saved-themes-heading">
            <strong>Palettes</strong>
            <span>{{ darkModeStore.options.customThemes.length }}/{{ MAX_CUSTOM_DARK_THEMES }} personnelles</span>
          </div>
          <ul
            class="toolglows-theme-list toolglows-palette-gallery"
            aria-label="Palettes du mode sombre"
          >
            <li
              v-for="palette in builtInPalettes"
              :key="palette.id"
              :class="{ 'toolglows-theme-active': darkModeStore.options.palettePreset === palette.id }"
            >
              <button
                class="toolglows-theme-choice"
                type="button"
                :aria-pressed="darkModeStore.options.palettePreset === palette.id"
                @click="selectBuiltInPalette(palette.id)"
              >
                <span
                  class="toolglows-theme-swatches"
                  aria-hidden="true"
                >
                  <i
                    v-for="color in palette.colors"
                    :key="color"
                    data-darkreader-ignore
                    :style="{ '--toolglows-theme-swatch-color': color }"
                  />
                </span>
                <span>{{ palette.label }}</span>
                <small>{{ palette.description }}</small>
              </button>
            </li>
            <li
              v-for="theme in darkModeStore.options.customThemes"
              :key="theme.id"
              :class="{ 'toolglows-theme-active': darkModeStore.options.activeCustomThemeId === theme.id }"
            >
              <button
                class="toolglows-theme-choice"
                type="button"
                :aria-pressed="darkModeStore.options.activeCustomThemeId === theme.id"
                @click="applySavedTheme(theme.id)"
              >
                <span
                  class="toolglows-theme-swatches"
                  aria-hidden="true"
                >
                  <i
                    data-darkreader-ignore
                    :style="{ '--toolglows-theme-swatch-color': theme.backgroundColor }"
                  />
                  <i
                    data-darkreader-ignore
                    :style="{ '--toolglows-theme-swatch-color': theme.textColor }"
                  />
                  <i
                    data-darkreader-ignore
                    :style="{ '--toolglows-theme-swatch-color': theme.linkColor }"
                  />
                </span>
                <span>{{ theme.name }}</span>
                <small>Thème personnel</small>
              </button>
              <div class="toolglows-theme-actions">
                <Button
                  size="small"
                  severity="secondary"
                  text
                  label="Renommer"
                  :aria-label="`Renommer ${theme.name}`"
                  @click="startThemeEdit(theme.id, theme.name)"
                />
                <Button
                  size="small"
                  :severity="pendingThemeDeletion === theme.id ? 'danger' : 'secondary'"
                  text
                  :label="pendingThemeDeletion === theme.id ? 'Confirmer' : 'Supprimer'"
                  :aria-label="pendingThemeDeletion === theme.id ? `Confirmer la suppression de ${theme.name}` : `Supprimer ${theme.name}`"
                  @click="requestThemeDeletion(theme.id)"
                />
              </div>
            </li>
          </ul>
          <Button
            class="toolglows-new-theme-action"
            size="small"
            severity="secondary"
            label="Créer un thème"
            @click="openCustomEditor"
          />
        </div>
        <p
          v-if="!customEditorOpen && darkModeStore.options.palettePreset === 'graphite'"
          class="toolglows-palette-description mb-3"
        >
          Palette graphite harmonisée : surfaces neutres, actions bleues et succès vert sauge.
        </p>
        <p
          v-else-if="!customEditorOpen && darkModeStore.options.palettePreset === 'latte'"
          class="toolglows-palette-description mb-3"
        >
          Latte : fond crème, texte prune et liens bleus pour une lecture claire et colorée.
        </p>
        <template v-if="customEditorOpen">
          <div class="toolglows-color-field mb-2">
            <label>Arrière-plan</label>
            <ToolGlowsColorPicker
              :model-value="darkModeStore.options.backgroundColor"
              @update:model-value="setPaletteColor('backgroundColor', $event)"
            />
          </div>
          <div class="toolglows-color-field mb-2">
            <label>Texte</label>
            <ToolGlowsColorPicker
              :model-value="displayColor('textColor')"
              @update:model-value="setPaletteColor('textColor', $event)"
            />
          </div>
          <div
            v-if="contrastNotice('textColor').isLow"
            class="toolglows-contrast-warning mb-3"
            role="status"
          >
            <strong>Contraste faible : {{ contrastNotice('textColor').ratio }}:1</strong>
            <span v-if="hasPendingColor('textColor')">Le texte peut être difficile à lire. Confirmez pour appliquer cette couleur à la page.</span>
            <span v-else>Cette couleur est appliquée malgré son contraste faible.</span>
            <div class="toolglows-contrast-actions">
              <Button
                size="small"
                severity="secondary"
                :label="`Suggestion ${contrastNotice('textColor').suggestion}`"
                @click="useContrastSuggestion('textColor')"
              />
              <Button
                v-if="hasPendingColor('textColor')"
                class="toolglows-keep-color-action"
                size="small"
                icon="pi pi-check"
                label="Appliquer ma couleur"
                @click="keepPendingColor('textColor')"
              />
            </div>
          </div>
          <div class="toolglows-color-field mb-2">
            <label>Liens</label>
            <ToolGlowsColorPicker
              :model-value="displayColor('linkColor')"
              @update:model-value="setPaletteColor('linkColor', $event)"
            />
          </div>
          <div
            v-if="contrastNotice('linkColor').isLow"
            class="toolglows-contrast-warning mb-3"
            role="status"
          >
            <strong>Contraste faible : {{ contrastNotice('linkColor').ratio }}:1</strong>
            <span v-if="hasPendingColor('linkColor')">Certains liens peuvent être difficiles à distinguer. Confirmez pour appliquer cette couleur à la page.</span>
            <span v-else>Cette couleur est appliquée malgré son contraste faible.</span>
            <div class="toolglows-contrast-actions">
              <Button
                size="small"
                severity="secondary"
                :label="`Suggestion ${contrastNotice('linkColor').suggestion}`"
                @click="useContrastSuggestion('linkColor')"
              />
              <Button
                v-if="hasPendingColor('linkColor')"
                class="toolglows-keep-color-action"
                size="small"
                icon="pi pi-check"
                label="Appliquer ma couleur"
                @click="keepPendingColor('linkColor')"
              />
            </div>
          </div>
          <div class="toolglows-theme-save mt-3">
            <div class="toolglows-theme-editor">
              <InputText
                v-model="themeName"
                :maxlength="MAX_CUSTOM_DARK_THEME_NAME_LENGTH"
                :placeholder="editingThemeId ? 'Nouveau nom' : 'Nom du thème'"
                aria-label="Nom du thème personnalisé"
                @keydown.enter="submitThemeName"
              />
              <Button
                class="toolglows-theme-edit-action"
                size="small"
                :label="editingThemeId ? 'Renommer' : 'Enregistrer'"
                :disabled="!themeName.trim() || (!editingThemeId && darkModeStore.options.customThemes.length >= MAX_CUSTOM_DARK_THEMES)"
                @click="submitThemeName"
              />
              <Button
                v-if="editingThemeId"
                size="small"
                severity="secondary"
                text
                label="Annuler"
                @click="cancelThemeEdit"
              />
            </div>
            <small
              v-if="themeFeedback"
              class="toolglows-theme-feedback"
              role="status"
            >{{ themeFeedback }}</small>
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
import InputText from 'primevue/inputtext'
import TimeSelector from './TimeSelector.vue'
import {
  GRAPHITE_PALETTE,
  LATTE_PALETTE,
  type DarkModePalettePreset
} from '@/stores/darkModePalette'
import {
  MAX_CUSTOM_DARK_THEMES,
  MAX_CUSTOM_DARK_THEME_NAME_LENGTH
} from '@/stores/darkModeThemes'
import {
  getContrastRatio,
  LINK_CONTRAST_MINIMUM,
  suggestReadableColor,
  TEXT_CONTRAST_MINIMUM
} from '@/utils/colorContrast'

const darkModeStore = useDarkModeStore()
const isLoading = ref(true)
const builtInPalettes: Array<{
  id: Exclude<DarkModePalettePreset, 'custom'>
  label: string
  description: string
  colors: string[]
}> = [
  { id: 'graphite', label: 'Graphite', description: 'Sombre et neutre', colors: Object.values(GRAPHITE_PALETTE) },
  { id: 'latte', label: 'Latte', description: 'Clair et nuancé', colors: Object.values(LATTE_PALETTE) }
]

type ContrastColor = 'textColor' | 'linkColor'
const pendingColors = ref<Partial<Record<ContrastColor, string>>>({})
const customEditorOpen = ref(false)
const themeName = ref('')
const editingThemeId = ref<string | null>(null)
const pendingThemeDeletion = ref<string | null>(null)
const themeFeedback = ref('')

const cancelThemeEdit = () => {
  editingThemeId.value = null
  themeName.value = ''
  themeFeedback.value = ''
}

const selectBuiltInPalette = async (palette: Exclude<DarkModePalettePreset, 'custom'>) => {
  customEditorOpen.value = false
  pendingColors.value = {}
  await darkModeStore.setPalettePreset(palette)
}

const openCustomEditor = async () => {
  customEditorOpen.value = true
  pendingColors.value = {}
  await darkModeStore.setPalettePreset('custom')
}

const submitThemeName = async () => {
  try {
    const wasEditing = editingThemeId.value !== null
    if (editingThemeId.value) await darkModeStore.renameCustomTheme(editingThemeId.value, themeName.value)
    else await darkModeStore.saveCustomTheme(themeName.value)
    themeFeedback.value = wasEditing ? 'Thème renommé.' : 'Thème enregistré.'
    editingThemeId.value = null
    themeName.value = ''
    if (wasEditing) customEditorOpen.value = false
  } catch (error) {
    themeFeedback.value = error instanceof Error ? error.message : 'Impossible d’enregistrer ce thème.'
  }
}

const startThemeEdit = (id: string, name: string) => {
  customEditorOpen.value = true
  editingThemeId.value = id
  themeName.value = name
  pendingThemeDeletion.value = null
  themeFeedback.value = ''
}

const applySavedTheme = async (id: string) => {
  customEditorOpen.value = false
  pendingColors.value = {}
  await darkModeStore.applyCustomTheme(id)
  themeFeedback.value = 'Thème appliqué à la page.'
}

const requestThemeDeletion = async (id: string) => {
  if (pendingThemeDeletion.value !== id) {
    pendingThemeDeletion.value = id
    themeFeedback.value = 'Cliquez sur Confirmer pour supprimer ce thème.'
    return
  }
  await darkModeStore.deleteCustomTheme(id)
  pendingThemeDeletion.value = null
  themeFeedback.value = 'Thème supprimé.'
}

const displayColor = (color: ContrastColor) => pendingColors.value[color] ?? darkModeStore.options[color]
const hasPendingColor = (color: ContrastColor) => pendingColors.value[color] !== undefined

const contrastNotice = (color: ContrastColor) => {
  const foreground = displayColor(color)
  const minimum = color === 'textColor' ? TEXT_CONTRAST_MINIMUM : LINK_CONTRAST_MINIMUM
  const ratio = getContrastRatio(foreground, darkModeStore.options.backgroundColor)
  return {
    isLow: ratio < minimum,
    ratio: ratio.toFixed(2),
    suggestion: suggestReadableColor(foreground, darkModeStore.options.backgroundColor, minimum)
  }
}

const setPaletteColor = (
  color: 'backgroundColor' | 'textColor' | 'linkColor',
  value: string | undefined
) => {
  if (!value) return
  if (color === 'backgroundColor') {
    void darkModeStore.setPaletteColor(color, value)
    return
  }

  const minimum = color === 'textColor' ? TEXT_CONTRAST_MINIMUM : LINK_CONTRAST_MINIMUM
  if (getContrastRatio(value, darkModeStore.options.backgroundColor) < minimum) {
    pendingColors.value = { ...pendingColors.value, [color]: value }
    return
  }

  const { [color]: _discarded, ...remaining } = pendingColors.value
  pendingColors.value = remaining
  void darkModeStore.setPaletteColor(color, value)
}

const keepPendingColor = (color: ContrastColor) => {
  const value = pendingColors.value[color]
  if (!value) return
  const { [color]: _discarded, ...remaining } = pendingColors.value
  pendingColors.value = remaining
  void darkModeStore.setPaletteColor(color, value)
}

const useContrastSuggestion = (color: ContrastColor) => {
  const value = contrastNotice(color).suggestion
  const { [color]: _discarded, ...remaining } = pendingColors.value
  pendingColors.value = remaining
  void darkModeStore.setPaletteColor(color, value)
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

.toolglows-contrast-warning {
  display: grid;
  gap: var(--tg-space-2);
  padding: var(--tg-space-3);
  color: var(--tg-text-primary);
  background: var(--tg-status-warning-surface);
  border: 1px solid var(--tg-status-warning-border);
  border-radius: var(--tg-radius-control);
  line-height: var(--tg-line-height-copy);
}

.toolglows-contrast-warning > span {
  color: var(--tg-text-secondary);
}

.toolglows-contrast-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tg-space-2);
}

.toolglows-saved-themes {
  display: grid;
  gap: var(--tg-space-2);
  padding-top: var(--tg-space-3);
  border-top: var(--tg-border-width-control) solid var(--tg-border-default);
}

.toolglows-saved-themes-heading,
.toolglows-theme-choice,
.toolglows-theme-actions,
.toolglows-theme-swatches {
  display: flex;
  align-items: center;
}

.toolglows-saved-themes-heading {
  justify-content: space-between;
}

.toolglows-saved-themes-heading span,
.toolglows-theme-feedback {
  color: var(--tg-text-secondary);
}

.toolglows-theme-actions,
.toolglows-theme-choice,
.toolglows-theme-swatches {
  gap: var(--tg-space-2);
}

.toolglows-theme-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: var(--tg-space-2);
}

.toolglows-theme-editor :deep(.p-inputtext) {
  width: var(--tg-full-width);
  min-width: 0;
}

.toolglows-theme-editor :deep(.p-button) {
  width: var(--tg-full-width);
  min-height: var(--tg-size-control-comfortable);
}

.toolglows-theme-list {
  display: grid;
  gap: var(--tg-space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.toolglows-palette-gallery {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.toolglows-theme-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--tg-space-2);
  padding: var(--tg-space-2);
  background: var(--tg-surface-raised);
  border: var(--tg-border-width-control) solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
}

.toolglows-theme-list li.toolglows-theme-active {
  background: var(--tg-interaction-selected);
  border-color: var(--tg-action);
}

.toolglows-theme-choice {
  display: grid;
  align-content: start;
  justify-items: start;
  width: var(--tg-full-width);
  min-width: 0;
  padding: var(--tg-space-1);
  color: var(--tg-text-primary);
  background: transparent;
  border: 0;
  border-radius: var(--tg-radius-control);
  cursor: pointer;
}

.toolglows-theme-choice small {
  color: var(--tg-text-secondary);
  line-height: var(--tg-line-height-copy);
  text-align: left;
}

.toolglows-theme-choice > span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
}

.toolglows-theme-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  padding-top: var(--tg-space-1);
  border-top: var(--tg-border-width-control) solid var(--tg-border-default);
}

.toolglows-new-theme-action {
  width: var(--tg-full-width);
}

.toolglows-theme-choice:focus-visible {
  outline: var(--tg-element-outline-width) solid var(--tg-element-outline);
  outline-offset: var(--tg-space-1);
}

.toolglows-theme-swatches i {
  width: var(--tg-space-4);
  height: var(--tg-space-4);
  background-color: var(--toolglows-theme-swatch-color) !important;
  border: var(--tg-border-width-control) solid var(--tg-border-default);
  border-radius: var(--tg-radius-round);
}

.toolglows-keep-color-action {
  animation: toolglows-contrast-action-attention var(--tg-motion-attention);
}

@keyframes toolglows-contrast-action-attention {
  0%,
  100% {
    transform: scale(1);
    box-shadow: var(--tg-shadow-control);
  }

  45% {
    transform: scale(var(--tg-motion-attention-scale));
    box-shadow: var(--tg-shadow-attention);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toolglows-keep-color-action {
    animation: none;
  }
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
