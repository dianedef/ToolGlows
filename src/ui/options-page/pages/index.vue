<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSettingsStore, type ToolGlowsSettings } from '@/stores/settings'
import ToolGlowsColorPicker from '@/components/ToolGlowsColorPicker.vue'

const settingsStore = useSettingsStore()
const form = reactive<ToolGlowsSettings>({
  ...settingsStore.settings,
  position: { ...settingsStore.settings.position }
})
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')

async function saveSettings() {
  saveState.value = 'saving'
  try {
    await settingsStore.updateSettings({
      interfaceTheme: form.interfaceTheme,
      expanded: form.expanded,
      isPinned: form.isPinned,
      toolbarSize: form.toolbarSize,
      toolbarColor: form.toolbarColor
    })
    saveState.value = 'success'
  } catch {
    saveState.value = 'error'
  }
}

defineExpose({ saveState })
</script>

<template>
  <form class="options-page toolglows-settings-stack" @submit.prevent="saveSettings">
    <header class="page-heading">
      <p class="page-eyebrow">Préférences</p>
      <h1>Personnaliser ToolGlows</h1>
      <p class="page-intro">Réglez l’apparence et le comportement de votre barre d’outils.</p>
    </header>

    <section class="toolglows-settings-section" aria-labelledby="interface-heading">
      <div class="toolglows-settings-section-header">
        <div>
          <h2 id="interface-heading">Interface</h2>
          <p>Choisissez le thème des surfaces ToolGlows.</p>
        </div>
      </div>
      <label class="toolglows-settings-row">
        <span class="setting-copy">
          <span class="setting-label">Thème de l’interface</span>
          <small>Définit l’affichage clair ou sombre.</small>
        </span>
        <select v-model="form.interfaceTheme" aria-label="Thème de l’interface">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </label>
    </section>

    <section class="toolglows-settings-section" aria-labelledby="toolbar-heading">
      <div class="toolglows-settings-section-header">
        <div>
          <h2 id="toolbar-heading">Barre d’outils</h2>
          <p>Adaptez son ouverture et son apparence à votre usage.</p>
        </div>
      </div>

      <div class="settings-group">
        <h3>Comportement</h3>
        <label class="checkbox-row toolglows-settings-row">
          <span class="setting-copy">
            <span class="setting-label">Ouvrir la barre par défaut</span>
            <small>La barre s’affiche ouverte au démarrage.</small>
          </span>
          <input v-model="form.expanded" type="checkbox">
        </label>
        <label class="checkbox-row toolglows-settings-row">
          <span class="setting-copy">
            <span class="setting-label">Garder la barre épinglée</span>
            <small>Une barre épinglée reste ouverte.</small>
          </span>
          <input v-model="form.isPinned" type="checkbox">
        </label>
      </div>

      <div class="settings-group">
        <h3>Apparence</h3>
        <label class="toolglows-settings-row color-row">
          <span class="setting-copy">
            <span class="setting-label">Couleur de la barre</span>
            <small>Personnalisez la couleur de la barre d’outils.</small>
          </span>
          <ToolGlowsColorPicker v-model="form.toolbarColor" />
        </label>
        <label class="toolglows-settings-row size-row">
          <span class="setting-copy">
            <span class="setting-label">Taille de la barre</span>
            <small>Choisissez une taille selon la place disponible.</small>
          </span>
          <select v-model="form.toolbarSize" aria-label="Taille de la barre d’outils">
            <optgroup label="Compacte">
              <option value="xxs">Microscopique</option>
              <option value="xxs-plus">Microscopique +</option>
              <option value="xs">Très petite</option>
              <option value="xs-plus">Très petite +</option>
              <option value="xs-plus-mid">Très petite ++</option>
            </optgroup>
            <optgroup label="Petite">
              <option value="sm">Petite</option>
              <option value="sm-plus">Petite +</option>
              <option value="sm-plus-mid">Petite ++</option>
            </optgroup>
            <optgroup label="Moyenne">
              <option value="md">Moyenne</option>
              <option value="md-mid">Moyenne intermédiaire</option>
              <option value="md-plus">Moyenne +</option>
              <option value="md-plus-mid">Moyenne ++</option>
            </optgroup>
            <optgroup label="Grande">
              <option value="lg">Grande</option>
              <option value="lg-mid">Grande intermédiaire</option>
              <option value="lg-plus">Grande +</option>
              <option value="lg-plus-mid">Grande ++</option>
              <option value="xl">Très grande</option>
              <option value="xl-mid">Très grande +</option>
              <option value="xxl">Immense</option>
            </optgroup>
          </select>
        </label>
      </div>
    </section>

    <div class="save-row">
      <button type="submit" :disabled="saveState === 'saving'">
        {{ saveState === 'saving' ? 'Enregistrement…' : 'Enregistrer les préférences' }}
      </button>
      <p v-if="saveState === 'success'" class="save-feedback" role="status" aria-live="polite">
        Préférences enregistrées.
      </p>
      <p v-else-if="saveState === 'error'" class="save-feedback save-feedback-error" role="alert">
        Impossible d’enregistrer les préférences. Réessayez.
      </p>
    </div>
  </form>
</template>

<style scoped>
.options-page {
  max-width: var(--tg-size-800);
  margin: 0 auto;
  gap: var(--tg-space-4);
}

.page-heading {
  margin-bottom: var(--tg-space-2);
}

.page-eyebrow {
  margin: 0 0 var(--tg-space-1);
  color: var(--tg-text-secondary);
  font-size: var(--tg-text-sm);
  font-weight: 700;
  letter-spacing: var(--tg-letter-spacing-pixel);
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
}

.page-intro {
  max-width: 58ch;
  margin: var(--tg-space-2) 0 0;
  color: var(--tg-text-secondary);
  line-height: var(--tg-line-height-copy);
}

.toolglows-settings-section h2 {
  margin: 0;
  font-size: var(--tg-size-tool-font-md);
  font-weight: 600;
}

.settings-group + .settings-group {
  margin-top: var(--tg-space-4);
  padding-top: var(--tg-space-3);
  border-top: var(--tg-border-width-control) solid var(--tg-border-default);
}

.settings-group h3 {
  margin: 0;
  color: var(--tg-text-secondary);
  font-size: var(--tg-text-sm);
  font-weight: 700;
}

.setting-copy {
  display: block;
  min-width: 0;
}

.setting-label {
  display: block;
  font-weight: 600;
}

.toolglows-settings-row small {
  font-size: var(--tg-text-sm);
  font-weight: 400;
}

select {
  width: min(100%, var(--tg-size-field-inline));
  min-height: var(--tg-size-control-comfortable);
  border: var(--tg-border-width-control) solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
  padding: var(--tg-space-2) var(--tg-space-3);
  background: var(--tg-surface-field);
  color: var(--tg-text-primary);
  font: inherit;
}

.checkbox-row {
  cursor: pointer;
}

.checkbox-row input {
  flex: 0 0 auto;
  appearance: auto;
  width: var(--tg-size-checkbox);
  height: var(--tg-size-checkbox);
  margin: 0;
  padding: 0;
  border: 0;
  accent-color: var(--tg-action);
}

.color-row :deep(button),
.color-row :deep(input) {
  flex: 0 0 auto;
}

.save-row {
  display: flex;
  align-items: center;
  gap: var(--tg-space-4);
  padding: var(--tg-space-1) 0;
  flex-wrap: wrap;
}

button {
  min-height: var(--tg-size-control-comfortable);
  border: 0;
  border-radius: var(--tg-radius-control);
  padding: var(--tg-space-2) var(--tg-space-5);
  background: var(--tg-action);
  color: var(--tg-action-on);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: var(--tg-border-width-control) solid var(--tg-action);
  outline-offset: 2px;
}

.save-feedback {
  margin: 0;
  color: var(--tg-text-primary);
}

.save-feedback-error {
  color: var(--tg-text-danger, var(--tg-text-primary));
}

@media (max-width: 560px) {
  .toolglows-settings-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .toolglows-settings-row > select {
    width: 100%;
  }

  .save-row button {
    width: 100%;
  }
}
</style>
