<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TOOL_EXPLANATIONS, useToolOnboarding } from '@/composables/useToolOnboarding'
import ToolGlowsIcon from '@/components/ToolGlowsIcon.vue'
import { EXPERIMENTAL_TOOL_IDS, TOOL_CATALOG_NAMES, TOOL_GROUPS } from '@/data/toolCatalog'

const { ready, busy, error, load, cookiePreferences, setCookiesEnabled } = useToolOnboarding()
const finished = ref(false)
const activeTools = ref<string[]>([])
const settingsReady = ref(false)
const settingsBusy = ref(false)
const settingsError = ref('')
const pendingAction = ref<{ id: string; enabled: boolean } | null>(null)
const settingsKey = 'toolglowsSettings'

async function loadSettings() {
  settingsReady.value = false
  settingsError.value = ''
  try {
    const result = await chrome.storage.sync.get(settingsKey)
    activeTools.value = Array.isArray(result[settingsKey]?.activeTools) ? result[settingsKey].activeTools : []
    settingsReady.value = true
  } catch {
    settingsError.value = 'Impossible de charger les outils activés. Réessayez.'
    settingsReady.value = false
  }
}
onMounted(() => { void loadSettings() })

async function finish() {
  if (ready.value) finished.value = true
}

const isExperimental = (id: string) => (EXPERIMENTAL_TOOL_IDS as readonly string[]).includes(id)
const isToolActive = (id: string) => id === 'cookieConsent'
  ? cookiePreferences.value.enabled
  : activeTools.value.includes(id)

async function setToolEnabled(id: string, enabled: boolean) {
  if (!settingsReady.value || settingsBusy.value || busy.value) return
  if (id === 'cookieConsent') {
    pendingAction.value = { id, enabled }
    if (await setCookiesEnabled(enabled)) pendingAction.value = null
    return
  }

  settingsBusy.value = true
  settingsError.value = ''
  pendingAction.value = { id, enabled }
  try {
    const current = await chrome.storage.sync.get(settingsKey)
    const settings = current[settingsKey] && typeof current[settingsKey] === 'object'
      ? current[settingsKey]
      : {}
    const currentTools = Array.isArray(settings.activeTools) ? settings.activeTools : []
    const nextTools = enabled
      ? (currentTools.includes(id) ? currentTools : [...currentTools, id])
      : currentTools.filter((toolId: string) => toolId !== id)
    await chrome.storage.sync.set({ [settingsKey]: { ...settings, activeTools: nextTools } })
    activeTools.value = nextTools
    pendingAction.value = null
  } catch {
    settingsError.value = 'Impossible d’enregistrer cet outil. Réessayez.'
  } finally {
    settingsBusy.value = false
  }
}

async function toggleTool(id: string) {
  await setToolEnabled(id, !isToolActive(id))
}

async function retrySettingsAction() {
  if (pendingAction.value) {
    const { id, enabled } = pendingAction.value
    if (id === 'cookieConsent') await setCookiesEnabled(enabled)
    else await setToolEnabled(id, enabled)
  } else {
    await loadSettings()
  }
}
</script>

<template>
  <main class="install-journey" :aria-busy="busy">
    <template v-if="!finished">
      <header class="journey-heading">
        <span class="brand-mark"><ToolGlowsIcon name="toolglows" /></span>
        <p class="eyebrow">Bienvenue dans ToolGlows</p>
        <h1>Vos outils web, au même endroit.</h1>
        <p class="intro-copy">
          Retrouvez des raccourcis utiles directement sur les pages que vous consultez.
          Voici comment commencer.
        </p>
      </header>

      <section class="steps-section" aria-labelledby="steps-title">
        <div class="section-heading">
          <h2 id="steps-title">En trois étapes</h2>
        </div>
        <ol class="steps-list">
          <li>
            <span class="step-number" aria-hidden="true">1</span>
            <div>
              <h3>Ouvrez un site web</h3>
              <p>Sur une page déjà ouverte avant l’installation, rechargez-la pour afficher ToolGlows.</p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">2</span>
            <div>
              <h3>Dépliez la barre</h3>
              <p>Sur une page compatible, cliquez sur le bouton rond ToolGlows pour ouvrir la barre.</p>
            </div>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">3</span>
            <div>
              <h3>Lancez votre outil</h3>
              <p>Activez vos outils ici. Après activation, le clic gauche ouvre ou lance l’outil; le clic droit affiche ses réglages.</p>
            </div>
          </li>
        </ol>
        <p class="availability-note">
          ToolGlows ne s’affiche pas sur les pages internes du navigateur, comme les paramètres ou le nouvel onglet.
        </p>
      </section>

      <section class="catalog-section" aria-labelledby="catalog-title">
        <div class="section-heading">
          <h2 id="catalog-title">Tous les outils</h2>
          <p>Les outils sont désactivés au départ. Cliquez sur une icône pour l’allumer ou l’éteindre.</p>
        </div>
        <section v-for="group in TOOL_GROUPS" :key="group.label" class="catalog-group" :aria-label="group.label">
          <div class="catalog-group-heading">
            <h3>{{ group.label }}</h3>
            <p>{{ group.description }}</p>
          </div>
          <ul class="catalog-grid">
            <li v-for="id in group.ids" :key="id" class="catalog-item" :data-tool-catalog-id="id">
              <button
                class="catalog-icon"
                :class="{ 'is-active': isToolActive(id) }"
                type="button"
                :aria-label="`${isToolActive(id) ? 'Désactiver' : 'Activer'} ${TOOL_CATALOG_NAMES[id]}`"
                :aria-pressed="isToolActive(id)"
                :disabled="!settingsReady || settingsBusy || busy"
                @click="toggleTool(id)"
              ><ToolGlowsIcon :name="id" /></button>
              <div class="catalog-copy">
                <h4>{{ TOOL_CATALOG_NAMES[id] }}</h4>
                <p>{{ TOOL_EXPLANATIONS[id] }}</p>
                <span v-if="isExperimental(id)" class="experimental-tag">Expérimental</span>
              </div>
            </li>
          </ul>
        </section>
      </section>

      <footer class="journey-footer">
        <div class="choice-copy">
          <h2>Prêt à commencer ?</h2>
          <p>Les explications sont activées. Vous pourrez modifier vos choix dans les réglages de ToolGlows.</p>
        </div>
        <div class="journey-actions">
          <button class="button-primary" :disabled="!ready || busy" @click="finish">
            {{ busy ? 'Enregistrement…' : 'Terminer' }}
          </button>
        </div>
        <p v-if="(!ready && !error) || !settingsReady" class="save-hint" role="status">Chargement de vos préférences…</p>
      </footer>
    </template>

    <section v-else class="finished-state" aria-labelledby="finished-title">
      <span class="finished-mark" aria-hidden="true">✓</span>
      <p class="eyebrow">C’est prêt</p>
      <h1 id="finished-title">À vous de jouer.</h1>
      <p class="finished-copy" role="status">
        Ouvrez une page web, puis les réglages de ToolGlows pour activer un outil et commencer.
      </p>
      <p class="availability-note">
        Vous pouvez fermer cet onglet. Rechargez les pages ouvertes avant l’installation. Les pages internes du navigateur ne sont pas prises en charge.
      </p>
      <button class="button-secondary revisit-button" @click="finished = false">Revoir le parcours</button>
    </section>

    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <p v-if="settingsError" class="error-message" role="alert">{{ settingsError }}</p>
    <button v-if="!ready && error" class="retry-button" @click="load">Réessayer de charger les préférences</button>
    <button v-else-if="error && pendingAction?.id === 'cookieConsent'" class="retry-button" @click="retrySettingsAction">Réessayer l’activation des cookies</button>
    <button v-if="settingsError" class="retry-button" @click="retrySettingsAction">Réessayer</button>
  </main>
</template>

<style scoped>
.install-journey {
  width: min(100%, var(--tg-size-800, 800px));
  margin: auto;
  padding: clamp(var(--tg-space-4), 5vw, var(--tg-space-6));
  color: var(--tg-text-primary);
  background: var(--tg-surface-raised);
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-panel);
  box-shadow: var(--tg-shadow-panel);
  line-height: 1.55;
}

.journey-heading,
.finished-state { text-align: center; }
.brand-mark,
.finished-mark {
  display: grid;
  place-items: center;
  width: var(--tg-size-50);
  height: var(--tg-size-50);
  margin: 0 auto var(--tg-space-3);
  border-radius: var(--tg-radius-section);
  background: var(--tg-action);
  color: var(--tg-action-on);
  font-weight: 800;
}
.brand-mark { font-size: var(--tg-text-lg); }
.brand-mark :deep(.toolglows-icon) { width: var(--tg-size-icon-xl); height: var(--tg-size-icon-xl); }
.eyebrow {
  margin: 0 0 var(--tg-space-2);
  color: var(--tg-action);
  font-size: var(--tg-text-sm);
  font-weight: 700;
  text-transform: uppercase;
}
h1, h2, h3, p { margin-top: 0; }
.journey-heading h1,
.finished-state h1 {
  margin-bottom: var(--tg-space-3);
  font-size: var(--tg-text-2xl);
  line-height: 1.2;
}
.intro-copy,
.section-heading p,
.choice-copy p,
.finished-copy { color: var(--tg-text-secondary); }
.intro-copy { max-width: 42rem; margin: 0 auto; }
.steps-section,
.catalog-section { margin-top: var(--tg-space-6); }
.section-heading { margin-bottom: var(--tg-space-3); }
.section-heading h2,
.choice-copy h2 { margin-bottom: var(--tg-space-1); font-size: var(--tg-text-lg); }
.section-heading p,
.choice-copy p { margin-bottom: 0; font-size: var(--tg-text-base); }
.catalog-group + .catalog-group { margin-top: var(--tg-space-5); }
.catalog-group-heading { margin-bottom: var(--tg-space-2); }
.catalog-group-heading h3 { margin-bottom: var(--tg-space-1); font-size: var(--tg-text-base); }
.catalog-group-heading p { margin: 0; color: var(--tg-text-secondary); font-size: var(--tg-text-sm); }
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tg-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.catalog-item {
  display: flex;
  align-items: flex-start;
  gap: var(--tg-space-2);
  min-width: 0;
  padding: var(--tg-space-3);
  background: var(--tg-surface-muted);
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-section);
}
.catalog-icon {
  display: grid;
  place-items: center;
  flex: 0 0 var(--tg-size-40);
  height: var(--tg-size-40);
  border-radius: var(--tg-radius-md);
  background: var(--tg-surface-raised);
  color: var(--tg-action);
  font-size: var(--tg-text-lg);
  font-weight: 750;
  padding: 0;
  border: 1px solid var(--tg-border-default);
  cursor: pointer;
  transition: color var(--tg-motion-fast), background-color var(--tg-motion-fast), box-shadow var(--tg-motion-fast), border-color var(--tg-motion-fast);
}
.catalog-icon:hover:not(:disabled) { transform: translateY(-1px); }
.catalog-icon:disabled { cursor: wait; opacity: 0.65; }
.catalog-icon.is-active {
  color: var(--tg-action-on);
  background: var(--tg-action);
  border-color: var(--tg-action);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tg-action) 24%, transparent), 0 0 16px color-mix(in srgb, var(--tg-action) 62%, transparent);
}
.catalog-icon :deep(.toolglows-icon) { width: var(--tg-size-icon-md); height: var(--tg-size-icon-md); }
.catalog-copy { min-width: 0; }
.catalog-copy h4 { margin: 0 0 var(--tg-space-1); font-size: var(--tg-text-sm); }
.catalog-copy p,
.steps-list p { margin-bottom: 0; color: var(--tg-text-secondary); font-size: var(--tg-text-sm); }
.experimental-tag { display: inline-block; margin-top: var(--tg-space-2); color: var(--tg-warning-text, #8a4b08); font-size: var(--tg-text-xs); font-weight: 700; }
.steps-list h3 { margin-bottom: var(--tg-space-1); font-size: var(--tg-text-base); }
.steps-list { display: grid; gap: var(--tg-space-3); margin: 0; padding: 0; list-style: none; }
.steps-list li { display: flex; align-items: flex-start; gap: var(--tg-space-3); }
.step-number {
  display: grid;
  place-items: center;
  flex: 0 0 var(--tg-size-40);
  height: var(--tg-size-40);
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-full);
  color: var(--tg-action);
  font-weight: 800;
}
.steps-list li > div { padding-top: var(--tg-space-1); }
.availability-note {
  margin: var(--tg-space-4) 0 0;
  padding: var(--tg-space-3) var(--tg-space-4);
  border-left: 3px solid var(--tg-action);
  background: var(--tg-surface-muted);
  color: var(--tg-text-secondary);
  font-size: var(--tg-text-sm);
}
.journey-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
  margin-top: var(--tg-space-6);
  padding-top: var(--tg-space-5);
  border-top: 1px solid var(--tg-border-default);
}
.choice-copy { max-width: 22rem; }
.journey-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tg-space-2); }
button {
  min-height: var(--tg-size-control-comfortable);
  padding: var(--tg-space-2) var(--tg-space-4);
  border: 1px solid transparent;
  border-radius: var(--tg-radius-control);
  font: inherit;
  font-weight: 650;
  cursor: pointer;
  transition: background-color var(--tg-motion-fast), border-color var(--tg-motion-fast), transform var(--tg-motion-fast);
}
button:hover:not(:disabled) { transform: translateY(-1px); }
button:focus-visible { outline: 3px solid var(--tg-interaction-focus); outline-offset: 2px; }
button:disabled { cursor: wait; opacity: 0.6; }
.button-primary { background: var(--tg-action); color: var(--tg-action-on); }
.button-primary:hover:not(:disabled) { background: var(--tg-action-hover); }
.button-secondary { border-color: var(--tg-border-default); background: var(--tg-surface-raised); color: var(--tg-text-primary); }
.button-secondary:hover:not(:disabled) { background: var(--tg-interaction-hover); }
.save-hint { flex-basis: 100%; margin: 0; color: var(--tg-text-secondary); font-size: var(--tg-text-sm); text-align: right; }
.finished-state { max-width: 38rem; margin: 0 auto; padding-block: var(--tg-space-5); }
.finished-mark { border-radius: var(--tg-radius-full); font-size: var(--tg-text-xl); }
.finished-copy { margin: 0 auto; }
.finished-state .availability-note { text-align: left; }
.revisit-button { margin-top: var(--tg-space-4); }
.error-message { margin: var(--tg-space-4) 0 0; color: var(--red-600, #b42318); }
.retry-button { margin-top: var(--tg-space-2); border-color: var(--tg-border-default); background: var(--tg-surface-raised); color: var(--tg-text-primary); }

@media (max-width: 680px) {
  .catalog-grid { grid-template-columns: 1fr; }
  .journey-footer { align-items: stretch; flex-direction: column; }
  .choice-copy { max-width: none; }
  .journey-actions { justify-content: stretch; flex-direction: column; }
  .journey-actions button { width: 100%; }
  .save-hint { text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
</style>
