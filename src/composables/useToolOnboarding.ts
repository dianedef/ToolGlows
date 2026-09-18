import { onMounted, onUnmounted, ref } from 'vue'
import { COOKIE_CONSENT_KEY, normalizeCookiePreferences } from '@/features/cookieConsent/preferences'

export const ONBOARDING_SKIP_KEY = 'toolglowsOnboarding.v1.skipAll'
export const toolSeenKey = (id: string) => `toolglowsOnboarding.v1.seen.${id}`

export const TOOL_EXPLANATIONS: Record<string, string> = {
  wordCount: 'Consultez les statistiques de mots et de caractères de votre sélection ou de la page depuis le panneau du compteur.',
  darkMode: 'Passez la page en mode sombre pour une lecture plus confortable. Un nouveau clic le désactive ; les paramètres permettent d’ajuster le rendu.',
  speedBrowsing: 'Ouvrez les réglages de navigation rapide pour configurer le préchargement des liens. Le préchargement peut effectuer des requêtes avant votre clic.',
  infiniteScroll: 'Configurez le défilement infini pour charger la suite sur les pages compatibles. Certains sites ne proposent pas de pagination reconnue.',
  feedEradicator: 'Choisissez les flux à masquer sur les réseaux compatibles pour réduire les distractions. Les réglages permettent de les réafficher.',
  readerMode: 'Ouvrez le mode lecture pour extraire le contenu principal et ajuster sa présentation. Les pages sans article peuvent ne pas être reconnues.',
  searchJumper: 'Ouvrez les réglages de recherche rapide pour choisir comment rechercher votre sélection.',
  dragOpen: 'Configurez l’ouverture des liens par glisser-déposer. Consultez les gestes dans les paramètres avant de les utiliser.',
  instagramSaved: 'Ouvrez votre bibliothèque Instagram. Cet outil expérimental dépend de la structure du site et de votre session Instagram.',
  richCopy: 'Activez Rich Copy pour utiliser ses raccourcis de copie d’URL. Faites un clic droit sur son icône pour ouvrir les réglages et copier l’URL de l’onglet courant, des onglets sélectionnés ou d’un groupe disponible.',
  betterGmail: 'Configurez les améliorations de Gmail. Cet outil expérimental fonctionne dans Gmail et dépend de sa structure actuelle.',
  quickActions: 'Ouvrez les actions rapides pour choisir l’opération à effectuer sur la page.',
  autoCopy: 'Copiez automatiquement le texte sélectionné dans le presse-papiers. Un nouveau clic désactive ce comportement ; les paramètres permettent de choisir le format.',
  cookieConsent: 'ToolGlows clique sur « Tout accepter » dans les bannières reconnues, y compris pour les cookies publicitaires et de mesure d’audience. L’automatisme s’applique aux sites non exclus dans ce navigateur. Le désactiver ne retire pas les accords déjà donnés. Les bannières non reconnues et les cadres intégrés restent inchangés.',
  linksExplorer: 'Recherchez les liens présents sur cette page et consultez les résultats dans le panneau de l’explorateur.',
  socialAnalysis: 'Lancez l’analyse des commentaires de la page. Cet outil expérimental dépend des structures reconnues et peut ne produire aucun résultat sur un site non compatible.',
  reloadAllTabs: 'Rechargez les onglets via la commande de l’outil. Pensez à enregistrer les saisies en cours avant de continuer.',
  hideElement: 'Activez la sélection, puis cliquez sur un élément de la page pour le masquer. Retrouvez les éléments enregistrés dans les paramètres et utilisez « Tout restaurer » pour les réafficher.'
}

/** Separate keys prevent acknowledgements in different tabs from overwriting one another. */
export function useToolOnboarding() {
  const skipAll = ref(false)
  const seen = ref<Record<string, boolean>>({})
  const cookiePreferences = ref(normalizeCookiePreferences(undefined))
  const ready = ref(false)
  const busy = ref(false)
  const error = ref('')
  let revision = 0
  let disposed = false
  const keys = [ONBOARDING_SKIP_KEY, COOKIE_CONSENT_KEY, ...Object.keys(TOOL_EXPLANATIONS).map(toolSeenKey)]

  function apply(values: Record<string, unknown>) {
    if (ONBOARDING_SKIP_KEY in values) skipAll.value = values[ONBOARDING_SKIP_KEY] === true
    if (COOKIE_CONSENT_KEY in values) cookiePreferences.value = normalizeCookiePreferences(values[COOKIE_CONSENT_KEY])
    for (const id of Object.keys(TOOL_EXPLANATIONS)) {
      if (toolSeenKey(id) in values) seen.value[id] = values[toolSeenKey(id)] === true
    }
  }
  function changed(changes: Record<string, chrome.storage.StorageChange>, area: string) {
    if (area !== 'local' || !keys.some(key => key in changes)) return
    revision++
    apply(Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])))
  }
  async function load() {
    error.value = ''
    try {
      const before = revision
      const values = await chrome.storage.local.get(keys)
      if (disposed) return false
      // A change during the initial snapshot requires a fresh snapshot (including untouched keys).
      if (revision !== before) return await load()
      apply(Object.fromEntries(keys.map(key => [key, values[key]])))
      ready.value = true
      return true
    } catch {
      error.value = 'Impossible de lire vos préférences. Réessayez.'
      return false
    }
  }
  async function save(values: Record<string, unknown>) {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    try {
      await chrome.storage.local.set(values)
      if (!disposed) apply(values)
      return true
    } catch {
      error.value = 'Impossible d’enregistrer votre choix. Réessayez.'
      return false
    } finally { busy.value = false }
  }
  async function toggleCookies() {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    try {
      const values = await chrome.storage.local.get(COOKIE_CONSENT_KEY)
      const current = normalizeCookiePreferences(values[COOKIE_CONSENT_KEY])
      const next = { ...current, enabled: !current.enabled }
      await chrome.storage.local.set({ [COOKIE_CONSENT_KEY]: next })
      if (!disposed) cookiePreferences.value = next
      return true
    } catch {
      error.value = 'Impossible de modifier l’acceptation des cookies. Réessayez.'
      return false
    } finally { busy.value = false }
  }
  onMounted(() => { chrome.storage.onChanged.addListener(changed); void load() })
  onUnmounted(() => { disposed = true; chrome.storage.onChanged.removeListener(changed) })
  return { skipAll, seen, cookiePreferences, ready, busy, error, load, save, toggleCookies }
}
