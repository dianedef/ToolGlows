<script setup lang="ts">
import { ref } from 'vue'
import { ONBOARDING_SKIP_KEY, useToolOnboarding } from '@/composables/useToolOnboarding'
const { ready, busy, error, load, save } = useToolOnboarding()
const finished = ref(false)
async function finish(skip: boolean) {
  if (await save({ [ONBOARDING_SKIP_KEY]: skip })) finished.value = true
}
</script>

<template>
  <main class="toolglows-welcome">
    <template v-if="!finished">
      <p>Bienvenue dans ToolGlows</p>
      <h1>Vos outils, directement sur la page</h1>
      <p>Sur une page web, ouvrez la barre avec le bouton ToolGlows, puis choisissez un outil.</p>
      <ol>
        <li><strong>Clic gauche :</strong> utilisez l’outil ou activez son comportement.</li>
        <li><strong>Clic droit :</strong> ouvrez ses paramètres. Au clavier, utilisez Maj + F10.</li>
        <li><strong>Première utilisation :</strong> une courte explication vous aide à démarrer. Vous pouvez la reporter.</li>
      </ol>
      <p>Les explications restent accessibles dans les paramètres de la barre. Passer les explications n’active aucun outil.</p>
      <div class="toolglows-welcome-actions">
        <button :disabled="!ready || busy" @click="finish(false)">Commencer avec les explications</button>
        <button :disabled="!ready || busy" @click="finish(true)">Passer toutes les explications</button>
      </div>
    </template>
    <template v-else>
      <h1>À vous de jouer</h1>
      <p role="status">Votre choix est enregistré. Ouvrez une page web, puis le bouton ToolGlows pour essayer votre premier outil.</p>
      <p>Vous pouvez fermer cet onglet. Sur une page déjà ouverte avant l’installation, rechargez-la pour afficher la barre. Les pages internes du navigateur ne sont pas prises en charge.</p>
      <button @click="finished = false">Revoir l’accueil</button>
    </template>
    <p v-if="error" role="alert">{{ error }}</p>
    <button v-if="!ready && error" @click="load">Réessayer</button>
  </main>
</template>

<style scoped>
.toolglows-welcome { width: 100%; max-width: var(--tg-size-800, 800px); margin: auto; padding: var(--tg-space-6); color: var(--tg-text-primary); background: var(--tg-surface-raised); border-radius: var(--tg-radius-panel); line-height: 1.6; }
.toolglows-welcome h1 { font-size: var(--tg-font-size-2xl, 1.5rem); font-weight: 700; }
.toolglows-welcome p, .toolglows-welcome ol { margin-block: var(--tg-space-4); }
.toolglows-welcome ol { padding-left: var(--tg-space-6); list-style: decimal; }
.toolglows-welcome-actions { display: flex; gap: var(--tg-space-3); flex-wrap: wrap; }
.toolglows-welcome button { font: inherit; padding: var(--tg-space-3) var(--tg-space-4); border: 1px solid currentColor; border-radius: var(--tg-radius-md); cursor: pointer; }
.toolglows-welcome button:disabled { opacity: .5; cursor: wait; }
.toolglows-welcome button:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
</style>
