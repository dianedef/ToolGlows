<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSettingsStore, type ToolGlowsSettings } from '@/stores/settings'

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
  <form class="options-page" @submit.prevent="saveSettings">
    <h1>Paramètres ToolGlows</h1>
    <section>
      <h2>Interface</h2>
      <label>Thème de l’interface
        <select v-model="form.interfaceTheme">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </label>
    </section>
    <section>
      <h2>Barre d’outils</h2>
      <label class="checkbox-row"><input v-model="form.expanded" type="checkbox"><span>Barre ouverte par défaut</span></label>
      <label class="checkbox-row"><input v-model="form.isPinned" type="checkbox"><span>Barre épinglée</span></label>
      <label>Couleur <input v-model="form.toolbarColor" type="color"></label>
      <label>Taille
        <select v-model="form.toolbarSize">
          <option value="xs">Très petite</option><option value="sm">Petite</option><option value="md">Moyenne</option><option value="lg">Grande</option><option value="xl">Très grande</option>
        </select>
      </label>
    </section>
    <div class="save-row">
      <button type="submit" :disabled="saveState === 'saving'">{{ saveState === 'saving' ? 'Enregistrement…' : 'Enregistrer' }}</button>
      <p v-if="saveState === 'success'" class="save-feedback" role="status">Paramètres enregistrés.</p>
      <p v-else-if="saveState === 'error'" class="save-feedback save-feedback-error" role="alert">Impossible d’enregistrer les paramètres. Réessayez.</p>
    </div>
  </form>
</template>

<style scoped>
.options-page { max-width: var(--tg-size-800); margin: 0 auto; padding: var(--tg-space-6); }
section { margin: var(--tg-space-6) 0; }
h2 { margin: 0 0 var(--tg-space-4); font-size: var(--tg-size-tool-font-md); font-weight: 600; }
label { display: grid; gap: var(--tg-space-1-5); margin-bottom: var(--tg-space-4); font-weight: 500; }
input, select { width: 100%; border: 1px solid var(--tg-border-default); border-radius: var(--tg-radius-control); padding: var(--tg-space-2); font: inherit; }
.checkbox-row { display: flex; align-items: center; justify-content: flex-start; gap: var(--tg-space-2); }
.checkbox-row input, input[type='color'] { width: auto; }
.save-row { display: flex; align-items: center; gap: var(--tg-space-4); flex-wrap: wrap; }
button { border: 0; border-radius: var(--tg-radius-control); background: var(--tg-action); color: var(--tg-action-on); cursor: pointer; font: inherit; font-weight: 600; padding: var(--tg-space-2) var(--tg-space-4); }
button:disabled { cursor: wait; }
.save-feedback { margin: 0; color: var(--tg-text-primary); }
</style>
