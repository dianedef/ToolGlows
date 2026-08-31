<script setup lang="ts">
import { useStorage } from '@vueuse/core'

const settings = useStorage('toolglows-settings', {
  darkMode: {
    autoSync: true,
    excludedDomains: [] as string[],
    sunsetTime: '19:00',
    sunriseTime: '07:00'
  },
  searchJumper: {
    defaultEngine: 'google',
    shortcuts: true,
    contextMenu: true
  },
  readerMode: {
    fontSize: 18,
    fontFamily: 'Arial',
    theme: 'light'
  },
  richCopy: {
    defaultFormat: 'markdown',
    includeFavicon: true,
    includeSource: true
  }
})

const excludedDomainsText = computed({
  get: () => settings.value.darkMode.excludedDomains.join('\n'),
  set: (value: string) => {
    settings.value.darkMode.excludedDomains = value
      .split('\n')
      .map(domain => domain.trim())
      .filter(Boolean)
  }
})

function saveSettings() {
  void settings.value
}
</script>

<template>
  <form
    class="options-page"
    @submit.prevent="saveSettings"
  >
    <h1>Paramètres ToolGlows</h1>

    <section>
      <h2>Mode sombre</h2>
      <label class="checkbox-row">
        <input
          v-model="settings.darkMode.autoSync"
          type="checkbox"
        >
        <span>Synchronisation automatique</span>
      </label>
      <label>
        Domaines exclus
        <textarea
          v-model="excludedDomainsText"
          placeholder="example.com"
          rows="4"
        />
      </label>
      <div class="time-grid">
        <label>
          Debut
          <input
            v-model="settings.darkMode.sunsetTime"
            type="time"
          >
        </label>
        <label>
          Fin
          <input
            v-model="settings.darkMode.sunriseTime"
            type="time"
          >
        </label>
      </div>
    </section>

    <section>
      <h2>SearchJumper</h2>
      <label>
        Moteur par defaut
        <select v-model="settings.searchJumper.defaultEngine">
          <option value="google">Google</option>
          <option value="bing">Bing</option>
          <option value="duckduckgo">DuckDuckGo</option>
        </select>
      </label>
      <label class="checkbox-row">
        <input
          v-model="settings.searchJumper.shortcuts"
          type="checkbox"
        >
        <span>Activer les raccourcis</span>
      </label>
      <label class="checkbox-row">
        <input
          v-model="settings.searchJumper.contextMenu"
          type="checkbox"
        >
        <span>Menu contextuel</span>
      </label>
    </section>

    <section>
      <h2>Mode lecture</h2>
      <label>
        Taille de police
        <input
          v-model.number="settings.readerMode.fontSize"
          min="12"
          max="24"
          type="number"
        >
      </label>
      <label>
        Police
        <select v-model="settings.readerMode.fontFamily">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
        </select>
      </label>
      <label>
        Theme
        <select v-model="settings.readerMode.theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="sepia">Sepia</option>
        </select>
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

input,
select,
textarea {
  width: 100%;
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
  width: auto;
}

.time-grid {
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
