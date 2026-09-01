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
  <form class="options-page" @submit.prevent="saveSettings">
    <header class="page-heading"><p>Personnalisation</p><h1>Paramètres ToolGlows</h1></header>
    <section class="settings-section">
      <h2>Interface</h2>
      <label>Thème de l’interface
        <select v-model="form.interfaceTheme">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </label>
    </section>
    <section class="settings-section">
      <h2>Barre d’outils</h2>
      <label class="checkbox-row"><input v-model="form.expanded" type="checkbox"><span>Barre ouverte par défaut</span></label>
      <label class="checkbox-row"><input v-model="form.isPinned" type="checkbox"><span>Barre épinglée</span></label>
      <label class="toolglows-color-field"><span>Couleur</span><ToolGlowsColorPicker v-model="form.toolbarColor" /></label>
      <label>Taille de la barre d’outils
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
.options-page { max-width: var(--tg-size-800); margin: 0 auto; }
.page-heading { margin-bottom: var(--tg-space-5); }
.page-heading p { margin: 0 0 var(--tg-space-1); color: var(--tg-text-secondary); font-size: var(--tg-text-sm); font-weight: 700; letter-spacing: var(--tg-letter-spacing-pixel); text-transform: uppercase; }
.page-heading h1 { margin: 0; }
.settings-section { margin-bottom: var(--tg-space-4); padding: var(--tg-space-5); border: 1px solid var(--tg-border-default); border-radius: var(--tg-radius-panel); background: var(--tg-surface-raised); box-shadow: var(--tg-shadow-panel); }
h2 { margin: 0 0 var(--tg-space-5-half); font-size: var(--tg-size-tool-font-md); font-weight: 600; }
label { display: grid; gap: var(--tg-space-2); margin-bottom: var(--tg-space-4); font-weight: 500; }
label:last-child { margin-bottom: 0; }
input, select { width: 100%; min-height: var(--tg-size-control-comfortable); border: 1px solid var(--tg-border-default); border-radius: var(--tg-radius-control); padding: var(--tg-space-2) var(--tg-space-3); background: var(--tg-surface-field); color: var(--tg-text-primary); font: inherit; }
.checkbox-row { display: flex; align-items: center; justify-content: flex-start; gap: var(--tg-space-2); }
.checkbox-row input { width: auto; }
.save-row { display: flex; align-items: center; gap: var(--tg-space-4); padding: var(--tg-space-1) 0; flex-wrap: wrap; }
button { min-height: var(--tg-size-control-comfortable); border: 0; border-radius: var(--tg-radius-control); background: var(--tg-action); color: var(--tg-action-on); cursor: pointer; font: inherit; font-weight: 600; padding: var(--tg-space-2) var(--tg-space-5); }
button:disabled { cursor: wait; }
.save-feedback { margin: 0; color: var(--tg-text-primary); }
</style>
