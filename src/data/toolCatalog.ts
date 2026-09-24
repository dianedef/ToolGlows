export const TOOL_GROUPS = [
  { label: 'Lire et écrire', description: 'Concentrez-vous sur le contenu et vos sélections.', ids: ['readerMode', 'wordCount', 'richCopy', 'autoCopy'] },
  { label: 'Naviguer et agir', description: 'Accédez plus vite aux liens et aux actions de page.', ids: ['searchJumper', 'speedBrowsing', 'infiniteScroll', 'dragOpen', 'quickActions', 'reloadAllTabs'] },
  { label: 'Adapter les pages', description: 'Réglez l’affichage, les flux et les éléments visibles.', ids: ['darkMode', 'hideElement', 'feedEradicator', 'cookieConsent'] },
  { label: 'Explorer et analyser', description: 'Retrouvez les liens, commentaires et contenus enregistrés.', ids: ['linksExplorer', 'socialAnalysis', 'instagramSaved', 'betterGmail'] }
] as const

export const TOOLBAR_INTERACTION_GROUPS = [
  { id: 'launch', label: 'Lancer', ids: ['linksExplorer', 'socialAnalysis', 'reloadAllTabs'] },
  {
    id: 'open', label: 'Ouvrir', ids: [
      'wordCount', 'speedBrowsing', 'infiniteScroll', 'feedEradicator', 'searchJumper',
      'dragOpen', 'instagramSaved', 'richCopy', 'betterGmail', 'quickActions'
    ]
  },
  { id: 'toggle', label: 'Activer', ids: ['darkMode', 'readerMode', 'autoCopy', 'cookieConsent', 'hideElement'] }
] as const

export const TOOL_CATALOG_NAMES: Record<string, string> = {
  readerMode: 'Mode lecture', wordCount: 'Compteur de mots', richCopy: 'Copie enrichie', autoCopy: 'Copie automatique',
  searchJumper: 'Recherche rapide', speedBrowsing: 'Navigation rapide', infiniteScroll: 'Défilement infini', dragOpen: 'Glisser-déposer',
  quickActions: 'Actions rapides', reloadAllTabs: 'Recharger les onglets', darkMode: 'Mode sombre', hideElement: 'Masquer des éléments',
  feedEradicator: 'Éradicateur de flux', cookieConsent: 'Acceptation des cookies', linksExplorer: 'Explorateur de liens',
  socialAnalysis: 'Analyse Sociale', instagramSaved: 'Bibliothèque Instagram', betterGmail: 'Gmail amélioré'
}

export const EXPERIMENTAL_TOOL_IDS = ['instagramSaved', 'betterGmail', 'socialAnalysis'] as const

export function validateToolCatalog(registeredIds: readonly string[]) {
  const catalogIds = TOOL_GROUPS.flatMap(group => group.ids)
  return catalogIds.length === registeredIds.length
    && new Set(catalogIds).size === catalogIds.length
    && catalogIds.every(id => registeredIds.includes(id))
    && registeredIds.every(id => catalogIds.includes(id as never) && Boolean(TOOL_CATALOG_NAMES[id]))
}

export function validateToolbarInteractionGroups(registeredIds: readonly string[]) {
  const groupedIds = TOOLBAR_INTERACTION_GROUPS.flatMap(group => group.ids)
  return groupedIds.length === registeredIds.length
    && new Set(groupedIds).size === groupedIds.length
    && groupedIds.every(id => registeredIds.includes(id))
    && registeredIds.every(id => groupedIds.includes(id as never))
}
