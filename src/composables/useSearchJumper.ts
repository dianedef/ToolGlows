/**
 * Search Jumper Composable
 * 
 * Provides quick multi-search functionality from selected text, images, or links.
 * Similar to browser extensions like "Context Menu Search" or "Search All".
 * 
 * Key features:
 * - Text selection → search across multiple engines simultaneously
 * - Right-click context menu for images and links
 * - Keyboard shortcuts for quick access to favorite engines
 * - Drag-and-drop search initiation
 * - Customizable search engines and categories
 * - Background/foreground/incognito tab options
 * 
 * Use cases:
 * - Quick fact-checking across multiple sources
 * - Shopping price comparisons
 * - Image reverse search (Google, TinEye, Yandex)
 * - Academic research across databases
 * 
 * Architecture:
 * - Merges default and user-custom search engines
 * - Groups engines by category for organized UI
 * - Context-aware: shows relevant engines based on selection type
 * - Supports URL templating with placeholders (%s, %u, %h)
 */
import { ref, computed } from 'vue'
import { defaultSearchEngines, type SearchEngine } from './searchEngines'

interface SearchSite {
  name: string
  url: string  // Template with %s for search term
  icon?: string
  shortcut?: string
  category?: string
}

interface SearchCategory {
  name: string
  sites: SearchSite[]
  icon?: string
  showOn?: RegExp  // Pattern to show category only on specific domains
}

export function useSearchJumper() {
  const selectedText = ref('')
  const categories = ref<SearchCategory[]>([])
  const isVisible = ref(false)
  const currentCategory = ref<SearchCategory | null>(null)

  // État pour le mode de recherche actuel
  const searchMode = ref<'text' | 'image' | 'link' | 'page'>('text')

  // Gestion des moteurs de recherche personnalisés
  const customSearchEngines = ref<SearchEngine[]>([])
  
  // Combiner les moteurs de recherche par défaut et personnalisés
  const allSearchEngines = computed(() => [...defaultSearchEngines, ...customSearchEngines.value])
  
  // Grouper les moteurs de recherche par catégorie
  const searchEnginesByCategory = computed(() => {
    const grouped = new Map<string, SearchEngine[]>()
    allSearchEngines.value.forEach(engine => {
      if (!grouped.has(engine.category)) {
        grouped.set(engine.category, [])
      }
      grouped.get(engine.category)?.push(engine)
    })
    return grouped
  })

  // Ajouter un moteur de recherche personnalisé
  const addCustomSearchEngine = (engine: SearchEngine) => {
    customSearchEngines.value.push(engine)
  }

  // Supprimer un moteur de recherche personnalisé
  const removeCustomSearchEngine = (engineId: string) => {
    const index = customSearchEngines.value.findIndex(e => e.id === engineId)
    if (index !== -1) {
      customSearchEngines.value.splice(index, 1)
    }
  }

  // Menu contextuel
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    
    const target = event.target as HTMLElement
    const isImage = target instanceof HTMLImageElement
    const isLink = target instanceof HTMLAnchorElement
    
    // Déterminer le type de contenu
    if (isImage) {
      searchMode.value = 'image'
      selectedText.value = target.src
    } else if (isLink) {
      searchMode.value = 'link'
      selectedText.value = target.href
    } else {
      searchMode.value = 'text'
      const selection = window.getSelection()
      if (selection) {
        selectedText.value = selection.toString().trim()
      }
    }

    // Filtrer les moteurs de recherche pertinents
    const relevantEngines = allSearchEngines.value.filter(engine => {
      if (!engine.contextMenu) return false
      
      switch (searchMode.value) {
        case 'image': return engine.contextMenu.image
        case 'link': return engine.contextMenu.link
        case 'text': return engine.contextMenu.text
        default: return false
      }
    })

    if (relevantEngines.length && selectedText.value) {
      isVisible.value = true
      // Vous pouvez ici positionner le menu près du curseur
      // et afficher uniquement les moteurs pertinents
    }
  }

  // Fonction pour initialiser les moteurs de recherche
  const initSearchEngines = (customEngines?: SearchCategory[]) => {
    categories.value = customEngines || [
      {
        name: 'General',
        sites: [
          {
            name: 'Google',
            url: 'https://www.google.com/search?q=%s',
            shortcut: 'alt+g'
          },
          {
            name: 'Bing',
            url: 'https://www.bing.com/search?q=%s',
            shortcut: 'alt+b'
          }
        ]
      }
    ]
  }

  // Fonction pour effectuer une recherche
  const search = async (site: SearchSite, options: {
    newTab?: boolean
    background?: boolean
    incognito?: boolean
  } = {}) => {
    const searchUrl = prepareSearchUrl(site.url)
    
    if (options.incognito) {
      // Ouvrir en navigation privée
      window.open(searchUrl, '_blank')?.focus()
      return
    }

    if (options.background) {
      // Ouvrir en arrière-plan
      const win = window.open(searchUrl, '_blank')
      win?.blur()
      window.focus()
      return
    }

    if (options.newTab) {
      window.open(searchUrl, '_blank')?.focus()
    } else {
      window.location.href = searchUrl
    }
  }

  /**
   * Prepare Search URL with Template Substitution
   * 
   * Replaces placeholders in search engine URLs with actual values:
   * - %s: Selected text/search term (URI encoded for safety)
   * - %u: Current page URL (for "search similar pages" features)
   * - %h: Current hostname (for site-specific searches)
   * 
   * Example: "https://google.com/search?q=%s" → "https://google.com/search?q=vue%20composition%20api"
   * 
   * URI encoding prevents injection attacks and handles special characters.
   */
  const prepareSearchUrl = (url: string): string => {
    return url
      .replace('%s', encodeURIComponent(selectedText.value))
      .replace('%u', window.location.href)
      .replace('%h', window.location.host)
  }

  // Gestionnaire de sélection de texte
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection) {
      selectedText.value = selection.toString().trim()
      if (selectedText.value) {
        isVisible.value = true
      }
    }
  }

  // Recherche par raccourci clavier
  const handleShortcut = (event: KeyboardEvent) => {
    categories.value.forEach(category => {
      category.sites.forEach(site => {
        if (site.shortcut && isShortcutMatch(event, site.shortcut)) {
          search(site)
        }
      })
    })
  }

  // Vérifier si un raccourci correspond
  const isShortcutMatch = (event: KeyboardEvent, shortcut: string): boolean => {
    const keys = shortcut.toLowerCase().split('+')
    const pressedKey = event.key.toLowerCase()
    
    return keys.every(key => {
      switch (key) {
        case 'alt': return event.altKey
        case 'ctrl': return event.ctrlKey
        case 'shift': return event.shiftKey
        default: return key === pressedKey
      }
    })
  }

  // Recherche par glisser-déposer
  const handleDragSearch = (event: DragEvent) => {
    if (!event.dataTransfer) return
    
    const text = event.dataTransfer.getData('text/plain')
    if (text) {
      selectedText.value = text
      isVisible.value = true
    }
  }

  // Recherche d'images
  const handleImageSearch = (imgElement: HTMLImageElement) => {
    searchMode.value = 'image'
    selectedText.value = imgElement.src
    isVisible.value = true
  }

  // Recherche de liens
  const handleLinkSearch = (linkElement: HTMLAnchorElement) => {
    searchMode.value = 'link' 
    selectedText.value = linkElement.href
    isVisible.value = true
  }

  // Initialiser les écouteurs d'événements
  const initEventListeners = () => {
    document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('keydown', handleShortcut)
    document.addEventListener('dragend', handleDragSearch)
    document.addEventListener('contextmenu', handleContextMenu)
  }

  // Nettoyer les écouteurs d'événements
  const cleanup = () => {
    document.removeEventListener('mouseup', handleTextSelection)
    document.removeEventListener('keydown', handleShortcut)
    document.removeEventListener('dragend', handleDragSearch)
    document.removeEventListener('contextmenu', handleContextMenu)
  }

  return {
    selectedText,
    categories,
    isVisible,
    currentCategory,
    searchMode,
    initSearchEngines,
    search,
    handleTextSelection,
    handleImageSearch,
    handleLinkSearch,
    initEventListeners,
    cleanup,
    searchEnginesByCategory,
    addCustomSearchEngine,
    removeCustomSearchEngine,
    allSearchEngines
  }
} 