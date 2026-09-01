<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ToolGlowsColorPicker from '@/components/ToolGlowsColorPicker.vue'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const activeToolsText = computed({
  get: () => settings.value.activeTools.join('\n'),
  set: (value: string) => {
    settings.value.activeTools = value
      .split('\n')
      .map(tool => tool.trim())
      .filter(Boolean)
  }
})

async function saveSettings() {
  await settingsStore.updateSettings(settings.value)
}
</script>

<template>
  <form
    class="options-page toolglows-settings-stack"
    @submit.prevent="saveSettings"
  >
    <h1>Paramètres ToolGlows</h1>

    <section class="toolglows-settings-section">
      <div class="toolglows-settings-section-header">
        <div><h2>Barre d'outils</h2><p>Comportement et apparence de la barre.</p></div>
      </div>
      <label class="checkbox-row toolglows-settings-row">
        <span>Barre ouverte par défaut</span>
        <input
          v-model="settings.expanded"
          type="checkbox"
        >
      </label>
      <label class="checkbox-row toolglows-settings-row">
        <span>Barre épinglée</span>
        <input
          v-model="settings.isPinned"
          type="checkbox"
        >
      </label>
      <label class="toolglows-color-field toolglows-settings-row">
        <span>Couleur</span>
        <ToolGlowsColorPicker v-model="settings.toolbarColor" />
      </label>
      <label class="toolglows-settings-row">
        <span>Taille</span>
        <select v-model="settings.toolbarSize">
          <option value="xs">Très petite</option>
          <option value="sm">Petite</option>
          <option value="md">Moyenne</option>
          <option value="lg">Grande</option>
          <option value="xl">Très grande</option>
        </select>
      </label>
    </section>

    <section class="toolglows-settings-section">
      <div class="toolglows-settings-section-header">
        <div><h2>Position</h2><p>Coordonnées de la barre dans la page.</p></div>
      </div>
      <div class="number-grid">
        <label>
          X
          <input
            v-model.number="settings.position.x"
            min="0"
            type="number"
          >
        </label>
        <label>
          Y
          <input
            v-model.number="settings.position.y"
            min="0"
            type="number"
          >
        </label>
      </div>
    </section>

    <section class="toolglows-settings-section">
      <div class="toolglows-settings-section-header">
        <div><h2>Outils actifs</h2><p>Configuration avancée des identifiants chargés.</p></div>
      </div>
      <label>
        Identifiants, un par ligne
        <textarea
          v-model="activeToolsText"
          rows="6"
        />
      </label>
    </section>

    <button type="submit">Enregistrer</button>
  </form>
</template>

<style scoped>
.options-page {
  max-width: var(--tg-size-800);
  margin: 0 auto;
  padding: var(--tg-space-6);
}

h2 {
  margin: 0;
  font-size: var(--tg-size-tool-font-md);
  font-weight: 600;
}

label {
  font-weight: 500;
}

.number-grid label,
.toolglows-settings-section > label:not(.toolglows-settings-row) {
  display: grid;
  gap: var(--tg-space-1-5);
  margin-bottom: var(--tg-space-4);
}

input:not([type='checkbox']),
select,
textarea {
  width: var(--tg-full-width);
  border: var(--tg-border-width-control) solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
  padding: var(--tg-space-2);
  font: inherit;
}

.toolglows-settings-row > select {
  width: var(--tg-size-field-inline);
}

.checkbox-row {
  cursor: pointer;
}

.checkbox-row input {
  appearance: auto;
  width: var(--tg-size-checkbox);
  height: var(--tg-size-checkbox);
  margin: 0;
  padding: 0;
  border: 0;
  box-shadow: var(--tg-shadow-none);
  accent-color: var(--tg-action);
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tg-space-4);
}

button {
  border: 0;
  border-radius: var(--tg-radius-control);
  background: var(--tg-action);
  color: var(--tg-action-on);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: var(--tg-space-2) var(--tg-space-4);
}
</style>
