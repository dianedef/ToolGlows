<template>
  <ToolGlowsDialog :visible="visible" header="Acceptation des cookies" modal dismissable-mask
    :style="{ width: 'min(var(--tg-size-600), calc(100vw - var(--tg-space-6)))' }"
    @update:visible="emit('update:visible', $event)">
    <div class="toolglows-settings-stack" :style="{ padding: 'var(--tg-space-4)', overflowWrap: 'anywhere' }">
      <p>ToolGlows peut cliquer sur « Tout accepter » dans les bannières reconnues, y compris pour les cookies publicitaires et de mesure d’audience.</p>
      <label class="toolglows-settings-row toolglows-clickable-setting">
        <span>Accepter automatiquement les cookies</span>
        <Checkbox :model-value="preferences.enabled" binary input-id="cookie-consent-enabled"
          :disabled="loading || saving" @update:model-value="save({ ...preferences, enabled: $event === true })" />
      </label>
      <label v-if="host" class="toolglows-settings-row toolglows-clickable-setting">
        <span>Ne pas accepter automatiquement sur {{ host }}</span>
        <Checkbox :model-value="preferences.excludedHosts.includes(host)" binary input-id="cookie-consent-excluded"
          :disabled="loading || saving" @update:model-value="excludeCurrentHost($event === true)" />
      </label>
      <p>Votre choix est enregistré dans ce navigateur. Désactiver l’automatisme ne retire pas les accords déjà donnés : utilisez les réglages cookies du site pour les modifier.</p>
      <p>Les bannières non reconnues restent affichées. Les bannières dans les cadres intégrés ne sont pas prises en charge dans cette version.</p>
      <div v-if="preferences.excludedHosts.length">
        <h3>Sites exclus</h3>
        <div v-for="excluded in preferences.excludedHosts" :key="excluded" class="toolglows-settings-row">
          <span>{{ excluded }}</span>
          <Button label="Retirer l’exception" text :disabled="saving || loading"
            @click="save({ ...preferences, excludedHosts: preferences.excludedHosts.filter(item => item !== excluded) })" />
        </div>
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
      <Button v-if="error && loading" label="Réessayer" @click="loadPreferences" />
    </div>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import { COOKIE_CONSENT_KEY, normalizeCookiePreferences, type CookieConsentPreferences } from '@/features/cookieConsent/preferences'

defineProps<{ visible?: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()
const preferences = ref(normalizeCookiePreferences(undefined))
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const host = /^https?:$/.test(location.protocol) ? location.hostname : ''
let revision = 0
let disposed = false

function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: string) {
  if (area === 'local' && COOKIE_CONSENT_KEY in changes) {
    revision++
    preferences.value = normalizeCookiePreferences(changes[COOKIE_CONSENT_KEY].newValue)
  }
}
async function loadPreferences() {
  error.value = ''
  const initialRevision = revision
  try {
    const result = await chrome.storage.local.get(COOKIE_CONSENT_KEY)
    if (!disposed && revision === initialRevision) preferences.value = normalizeCookiePreferences(result[COOKIE_CONSENT_KEY])
    loading.value = false
  } catch { error.value = 'Impossible de lire les réglages.' }
}
onMounted(() => {
  chrome.storage.onChanged.addListener(onChanged)
  void loadPreferences()
})
onUnmounted(() => { disposed = true; chrome.storage.onChanged.removeListener(onChanged) })

async function save(value: CookieConsentPreferences) {
  saving.value = true
  error.value = ''
  try {
    const normalized = normalizeCookiePreferences(value)
    await chrome.storage.local.set({ [COOKIE_CONSENT_KEY]: normalized })
    preferences.value = normalized
  } catch { error.value = 'Impossible d’enregistrer ce choix. Réessayez.' }
  finally { saving.value = false }
}
function excludeCurrentHost(excluded: boolean) {
  const hosts = preferences.value.excludedHosts.filter(item => item !== host)
  if (excluded && hosts.length >= 500) {
    error.value = 'La limite de 500 sites exclus est atteinte. Retirez une exception avant d’en ajouter une.'
    return
  }
  void save({ ...preferences.value, excludedHosts: excluded ? [...hosts, host] : hosts })
}
</script>
