<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

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
    <h1>Parametres Toolflowz</h1>

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
      <label>
        Couleur
        <input
          v-model="settings.toolbarColor"
          type="color"
        >
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
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

section {
  margin: 2rem 0;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

label {
  display: grid;
  gap: 0.375rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font: inherit;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-row input,
input[type='color'] {
  width: auto;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

button {
  border: 0;
  border-radius: 0.375rem;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0.625rem 1rem;
}
</style>
