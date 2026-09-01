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
    <header class="page-heading"><p>Personnalisation</p><h1>Paramètres ToolGlows</h1></header>
    <section class="toolglows-settings-section">
      <div class="toolglows-settings-section-header">
        <div><h2>Interface</h2><p>Thème utilisé par toutes les surfaces ToolGlows.</p></div>
      </div>
      <label class="toolglows-settings-row"><span>Thème de l’interface</span>
        <select v-model="form.interfaceTheme">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </label>
    </section>
    <section class="toolglows-settings-section">
      <div class="toolglows-settings-section-header">
        <div><h2>Barre d’outils</h2><p>Ouverture, positionnement et apparence générale.</p></div>
      </div>
      <label class="checkbox-row toolglows-settings-row"><span>Barre ouverte par défaut</span><input v-model="form.expanded" type="checkbox"></label>
      <label class="checkbox-row toolglows-settings-row"><span>Barre épinglée</span><input v-model="form.isPinned" type="checkbox"></label>
      <label class="toolglows-color-field toolglows-settings-row"><span>Couleur</span><ToolGlowsColorPicker v-model="form.toolbarColor" /></label>
      <label class="toolglows-settings-row"><span>Taille de la barre d’outils</span>
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
.options-page { max-width: var(--tg-size-800); margin: 0 auto; gap: var(--tg-space-4); }
.page-heading { margin-bottom: var(--tg-space-5); }
.page-heading p { margin: 0 0 var(--tg-space-1); color: var(--tg-text-secondary); font-size: var(--tg-text-sm); font-weight: 700; letter-spacing: var(--tg-letter-spacing-pixel); text-transform: uppercase; }
.page-heading h1 { margin: 0; }
h2 { margin: 0; font-size: var(--tg-size-tool-font-md); font-weight: 600; }
label { font-weight: 500; }
input:not([type='checkbox']), select { width: var(--tg-size-field-inline); min-height: var(--tg-size-control-comfortable); border: var(--tg-border-width-control) solid var(--tg-border-default); border-radius: var(--tg-radius-control); padding: var(--tg-space-2) var(--tg-space-3); background: var(--tg-surface-field); color: var(--tg-text-primary); font: inherit; }
.checkbox-row { cursor: pointer; }
.checkbox-row input { appearance: auto; width: var(--tg-size-checkbox); height: var(--tg-size-checkbox); margin: 0; padding: 0; border: 0; box-shadow: var(--tg-shadow-none); accent-color: var(--tg-action); }
.save-row { display: flex; align-items: center; gap: var(--tg-space-4); padding: var(--tg-space-1) 0; flex-wrap: wrap; }
button { min-height: var(--tg-size-control-comfortable); border: 0; border-radius: var(--tg-radius-control); background: var(--tg-action); color: var(--tg-action-on); cursor: pointer; font: inherit; font-weight: 600; padding: var(--tg-space-2) var(--tg-space-5); }
button:disabled { cursor: wait; }
.save-feedback { margin: 0; color: var(--tg-text-primary); }
</style>
