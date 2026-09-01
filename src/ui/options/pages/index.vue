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
    class="options-page"
    @submit.prevent="saveSettings"
  >
    <h1>Paramètres ToolGlows</h1>

    <section>
      <h2>Barre d'outils</h2>
      <label class="checkbox-row">
        <input
          v-model="settings.expanded"
          type="checkbox"
        >
        <span>Barre ouverte par defaut</span>
      </label>
      <label class="checkbox-row">
        <input
          v-model="settings.isPinned"
          type="checkbox"
        >
        <span>Barre epinglee</span>
      </label>
      <label class="toolglows-color-field">
        <span>Couleur</span>
        <ToolGlowsColorPicker v-model="settings.toolbarColor" />
      </label>
      <label>
        Taille
        <select v-model="settings.toolbarSize">
          <option value="xs">XS</option>
          <option value="sm">SM</option>
          <option value="md">MD</option>
          <option value="lg">LG</option>
          <option value="xl">XL</option>
        </select>
      </label>
    </section>

    <section>
      <h2>Position</h2>
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

    <section>
      <h2>Outils actifs</h2>
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

section {
  margin: var(--tg-space-6) 0;
}

h2 {
  margin: 0 0 var(--tg-space-4);
  font-size: var(--tg-size-tool-font-md);
  font-weight: 600;
}

label {
  display: grid;
  gap: var(--tg-space-1-5);
  margin-bottom: var(--tg-space-4);
  font-weight: 500;
}

input:not([type='checkbox']),
select,
textarea {
  width: var(--tg-full-width);
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
  padding: var(--tg-space-2);
  font: inherit;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
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
