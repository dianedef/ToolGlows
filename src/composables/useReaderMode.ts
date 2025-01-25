import { ref, computed } from 'vue'
import { Readability } from '@mozilla/readability'
import type { ParseResult } from '@mozilla/readability'

interface ReaderSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  textAlign: 'left' | 'justify' | 'center'
  theme: 'light' | 'dark' | 'sepia'
  columnCount: 1 | 2
  bionicReading: boolean
  imageSize: 'normal' | 'small' | 'hidden'
  width: 'narrow' | 'medium' | 'wide'
  showLinks: boolean
}

interface ReaderModeOptions {
  preserveImages?: boolean
  preserveLinks?: boolean
  maxImageWidth?: number
  customParsing?: {
    selectors?: string[]
    excludeSelectors?: string[]
  }
}

export function useReaderMode(options: ReaderModeOptions = {}) {
  const isEnabled = ref(false)
  const originalContent = ref<string>('')
  const parsedContent = ref<any>(null)
  const settings = ref<ReaderSettings>({
    fontSize: 18,
    fontFamily: 'Arial',
    lineHeight: 1.6,
    textAlign: 'left',
    theme: 'light',
    columnCount: 1,
    bionicReading: false,
    imageSize: 'normal',
    width: 'medium',
    showLinks: false
  })

  // Convertir le contenu en mode lecture
  const parseContent = async () => {
    try {
      // Prétraitement personnalisé
      if (options.customParsing?.selectors) {
        const customContent = document.querySelectorAll(
          options.customParsing.selectors.join(',')
        )
        if (customContent.length) {
          // Utiliser le contenu personnalisé au lieu de la page entière
          const wrapper = document.createElement('div')
          customContent.forEach(el => wrapper.appendChild(el.cloneNode(true)))
          documentClone = wrapper
        }
      }

      // Exclure certains éléments si nécessaire
      if (options.customParsing?.excludeSelectors) {
        options.customParsing.excludeSelectors.forEach(selector => {
          const elements = documentClone.querySelectorAll(selector)
          elements.forEach(el => el.remove())
        })
      }

      // Configuration de Readability
      const readerConfig = {
        keepClasses: ['important', 'highlight'],
        serializer: (element: Element) => {
          // Personnalisation du HTML généré
          if (element instanceof HTMLImageElement && !options.preserveImages) {
            return ''
          }
          if (options.maxImageWidth && element instanceof HTMLImageElement) {
            element.style.maxWidth = `${options.maxImageWidth}px`
          }
          return element.outerHTML
        }
      }

      const reader = new Readability(documentClone, readerConfig)
      const article = reader.parse()

      if (!article) {
        throw new Error('Impossible de parser le contenu')
      }

      return {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        lang: article.lang
      }
    } catch (error) {
      console.error('Erreur lors du parsing:', error)
      // Fallback sur une méthode plus simple
      return fallbackParsing()
    }
  }

  // Méthode de fallback si Readability échoue
  const fallbackParsing = () => {
    const mainContent = document.querySelector('main, article, #main, .main, .content')
    if (!mainContent) return null

    return {
      title: document.title,
      content: mainContent.innerHTML,
      excerpt: '',
      byline: '',
      dir: document.dir,
      lang: document.documentElement.lang
    }
  }

  // Appliquer le mode lecture
  const applyReaderMode = () => {
    if (!parsedContent.value) return

    // Créer le conteneur du mode lecture
    const readerContent = document.createElement('div')
    readerContent.id = 'toolflowz-reader-mode'
    
    // Appliquer les styles de base
    applyReaderStyles(readerContent)

    // Injecter le contenu parsé
    readerContent.innerHTML = `
      <article class="reader-content">
        <h1>${parsedContent.value.title}</h1>
        ${parsedContent.value.byline ? `<p class="byline">${parsedContent.value.byline}</p>` : ''}
        ${parsedContent.value.content}
      </article>
    `

    // Remplacer le contenu de la page
    document.body.innerHTML = ''
    document.body.appendChild(readerContent)

    // Appliquer le Bionic Reading si activé
    if (settings.value.bionicReading) {
      applyBionicReading()
    }

    // Afficher les URLs des liens si activé
    if (settings.value.showLinks) {
      const links = readerContent.getElementsByTagName('a')
      Array.from(links).forEach(link => {
        if (link.href && !link.querySelector('.link-url')) {
          const url = link.href
          const urlSpan = document.createElement('span')
          urlSpan.className = 'link-url'
          urlSpan.textContent = ` (${url})`
          link.appendChild(urlSpan)
        }
      })
    }
  }

  // Appliquer le Bionic Reading
  const applyBionicReading = () => {
    const textNodes = document.evaluate(
      '//text()',
      document.body,
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    )

    for (let i = 0; i < textNodes.snapshotLength; i++) {
      const node = textNodes.snapshotItem(i) as Text
      if (node.parentElement?.closest('pre, code')) continue

      const words = node.textContent?.split(/\s+/) || []
      const bionicWords = words.map(word => {
        const midpoint = Math.ceil(word.length / 2)
        return `<strong>${word.slice(0, midpoint)}</strong>${word.slice(midpoint)}`
      })

      const span = document.createElement('span')
      span.innerHTML = bionicWords.join(' ')
      node.parentNode?.replaceChild(span, node)
    }
  }

  // Appliquer les styles du mode lecture
  const applyReaderStyles = (container: HTMLElement) => {
    const style = document.createElement('style')
    style.textContent = `
      #toolflowz-reader-mode {
        max-width: ${getWidthValue()};
        margin: 0 auto;
        padding: 2rem;
        font-size: ${settings.value.fontSize}px;
        font-family: ${settings.value.fontFamily};
        line-height: ${settings.value.lineHeight};
        text-align: ${settings.value.textAlign};
        column-count: ${settings.value.columnCount};
        column-gap: 2rem;
        background: ${getThemeColors().background};
        color: ${getThemeColors().text};
      }

      #toolflowz-reader-mode .link-url {
        color: ${getThemeColors().secondary};
        font-size: 0.9em;
        font-style: italic;
      }

      #toolflowz-reader-mode img {
        ${settings.value.imageSize === 'small' ? 'max-width: 300px;' : ''}
        ${settings.value.imageSize === 'hidden' ? 'display: none;' : ''}
      }

      #toolflowz-reader-mode h1 {
        font-size: 2em;
        margin-bottom: 1rem;
      }

      #toolflowz-reader-mode .byline {
        font-style: italic;
        color: ${getThemeColors().secondary};
      }
    `
    document.head.appendChild(style)
  }

  // Obtenir les couleurs du thème
  const getThemeColors = () => {
    switch (settings.value.theme) {
      case 'dark':
        return {
          background: '#1a1a1a',
          text: '#ffffff',
          secondary: '#888888'
        }
      case 'sepia':
        return {
          background: '#f4ecd8',
          text: '#5b4636',
          secondary: '#666666'
        }
      default:
        return {
          background: '#ffffff',
          text: '#333333',
          secondary: '#666666'
        }
    }
  }

  // Obtenir la largeur en fonction du paramètre
  const getWidthValue = () => {
    switch (settings.value.width) {
      case 'narrow': return '45rem'
      case 'wide': return '75rem'
      default: return '60rem'
    }
  }

  // Activer/désactiver le mode lecture
  const toggleReaderMode = () => {
    if (!isEnabled.value) {
      parseContent()
      isEnabled.value = true
    } else {
      document.documentElement.innerHTML = originalContent.value
      isEnabled.value = false
    }
  }

  // Mettre à jour les paramètres
  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    if (isEnabled.value) {
      applyReaderMode()
    }
  }

  return {
    isEnabled,
    settings,
    toggleReaderMode,
    updateSettings
  }
} 