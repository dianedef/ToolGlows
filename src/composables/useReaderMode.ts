/**
 * Reader Mode Composable
 * 
 * Converts cluttered web pages into clean, readable articles similar to
 * Safari Reader View or Firefox Reading Mode. Uses Mozilla's Readability
 * algorithm to extract main content and strip ads, sidebars, and navigation.
 * 
 * Key features:
 * - Content extraction: Identifies and isolates main article text
 * - Customizable typography: Font size, family, line height, alignment
 * - Theme support: Light, dark, and sepia color schemes
 * - Bionic reading: Bolds first half of words for faster reading
 * - Responsive layout: Adjustable width and column count
 * - Link visibility: Option to display full URLs for accessibility
 * 
 * Technical approach:
 * - Uses Mozilla's Readability library (same as Firefox Reader Mode)
 * - Fallback parsing for sites where Readability fails
 * - Replaces entire page content with cleaned version
 * - Stores original HTML for restoration
 * 
 * Use cases:
 * - Reading articles without distractions
 * - Improving readability on poorly designed sites
 * - Accessibility for users with reading difficulties
 * - Printing clean versions of web articles
 */
import { ref, computed } from 'vue'
import { Readability } from '@mozilla/readability'

interface ReaderSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  textAlign: 'left' | 'justify' | 'center'
  theme: 'light' | 'dark' | 'sepia'
  columnCount: 1 | 2
  bionicReading: boolean  // Bold first half of words for faster reading
  imageSize: 'normal' | 'small' | 'hidden'
  width: 'narrow' | 'medium' | 'wide'
  showLinks: boolean  // Display full URLs after link text
}

interface ReaderModeOptions {
  preserveImages?: boolean
  preserveLinks?: boolean
  maxImageWidth?: number
  customParsing?: {
    selectors?: string[]  // Target specific elements as content source
    excludeSelectors?: string[]  // Remove elements before parsing
  }
}

interface ParsedReaderContent {
  title: string
  content: string
  excerpt: string
  byline: string
  dir: string
  lang: string
}

export function useReaderMode(options: ReaderModeOptions = {}) {
  const isEnabled = ref(false)
  const originalBodyContent = ref<DocumentFragment | null>(null)
  const parsedContent = ref<ParsedReaderContent | null>(null)
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
      let documentClone = document.cloneNode(true) as Document

      // Prétraitement personnalisé
      if (options.customParsing?.selectors) {
        const customContent = document.querySelectorAll(
          options.customParsing.selectors.join(',')
        )
        if (customContent.length) {
          // Utiliser le contenu personnalisé au lieu de la page entière
          const customDocument = document.implementation.createHTMLDocument(document.title)
          const wrapper = customDocument.createElement('div')
          customContent.forEach(el => wrapper.appendChild(customDocument.importNode(el, true)))
          customDocument.body.appendChild(wrapper)
          documentClone = customDocument
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
        classesToPreserve: ['important', 'highlight'],
        keepClasses: false,
        serializer: (element: Node) => {
          // Personnalisation du HTML généré
          if (element instanceof HTMLImageElement && !options.preserveImages) {
            return ''
          }
          if (options.maxImageWidth && element instanceof HTMLImageElement) {
            element.style.maxWidth = `${options.maxImageWidth}px`
          }
          if (element instanceof Element) {
            return element.outerHTML
          }
          return element.textContent ?? ''
        }
      }

      const reader = new Readability<string>(documentClone, readerConfig)
      const article = reader.parse()

      if (!article) {
        throw new Error('Impossible de parser le contenu')
      }

      return {
        title: article.title ?? document.title,
        content: article.content ?? '',
        excerpt: article.excerpt ?? '',
        byline: article.byline ?? '',
        dir: article.dir ?? document.dir,
        lang: article.lang ?? document.documentElement.lang
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

  const allowedTags = new Set([
    'A',
    'ABBR',
    'ARTICLE',
    'ASIDE',
    'B',
    'BLOCKQUOTE',
    'BR',
    'CAPTION',
    'CODE',
    'DD',
    'DIV',
    'DL',
    'DT',
    'EM',
    'FIGCAPTION',
    'FIGURE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HR',
    'I',
    'IMG',
    'LI',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'TABLE',
    'TBODY',
    'TD',
    'TFOOT',
    'TH',
    'THEAD',
    'TR',
    'UL',
  ])

  const allowedAttributes = new Set(['alt', 'class', 'dir', 'href', 'lang', 'src', 'title'])

  const isSafeUrl = (value: string) => {
    try {
      const url = new URL(value, window.location.href)
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ||
        (url.protocol === 'data:' && value.startsWith('data:image/'))
    } catch {
      return false
    }
  }

  const sanitizeNode = (sourceNode: Node, ownerDocument: Document): Node | null => {
    if (sourceNode.nodeType === Node.TEXT_NODE) {
      return ownerDocument.createTextNode(sourceNode.textContent ?? '')
    }

    if (!(sourceNode instanceof Element)) {
      return null
    }

    const tagName = sourceNode.tagName.toUpperCase()
    if (!allowedTags.has(tagName)) {
      const fragment = ownerDocument.createDocumentFragment()
      sourceNode.childNodes.forEach(child => {
        const sanitizedChild = sanitizeNode(child, ownerDocument)
        if (sanitizedChild) {
          fragment.appendChild(sanitizedChild)
        }
      })
      return fragment
    }

    const element = ownerDocument.createElement(tagName.toLowerCase())
    Array.from(sourceNode.attributes).forEach(attribute => {
      const attributeName = attribute.name.toLowerCase()
      if (!allowedAttributes.has(attributeName) || attributeName.startsWith('on')) {
        return
      }

      if ((attributeName === 'href' || attributeName === 'src') && !isSafeUrl(attribute.value)) {
        return
      }

      element.setAttribute(attributeName, attribute.value)
    })

    sourceNode.childNodes.forEach(child => {
      const sanitizedChild = sanitizeNode(child, ownerDocument)
      if (sanitizedChild) {
        element.appendChild(sanitizedChild)
      }
    })

    return element
  }

  const buildSafeContentFragment = (html: string) => {
    const parsedDocument = new DOMParser().parseFromString(html, 'text/html')
    const fragment = document.createDocumentFragment()

    parsedDocument.body.childNodes.forEach(child => {
      const sanitizedChild = sanitizeNode(child, document)
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild)
      }
    })

    return fragment
  }

  // Appliquer le mode lecture
  const applyReaderMode = () => {
    if (!parsedContent.value) return

    // Créer le conteneur du mode lecture
    const readerContent = document.createElement('div')
    readerContent.id = 'toolflowz-reader-mode'
    
    // Appliquer les styles de base
    applyReaderStyles(readerContent)

    const article = document.createElement('article')
    article.className = 'reader-content'

    const title = document.createElement('h1')
    title.textContent = parsedContent.value.title
    article.appendChild(title)

    if (parsedContent.value.byline) {
      const byline = document.createElement('p')
      byline.className = 'byline'
      byline.textContent = parsedContent.value.byline
      article.appendChild(byline)
    }

    article.appendChild(buildSafeContentFragment(parsedContent.value.content))
    readerContent.appendChild(article)

    // Remplacer le contenu de la page
    document.body.replaceChildren(readerContent)

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

  /**
   * Apply Bionic Reading Enhancement
   * 
   * Bolds the first half of each word to guide eye movement and increase
   * reading speed. Based on research showing that the brain processes the
   * beginning of words more heavily than the end.
   * 
   * Algorithm:
   * 1. Find all text nodes in document using XPath
   * 2. Skip code blocks (pre, code) to preserve formatting
   * 3. Split text into words
   * 4. Bold first half of each word (rounded up for odd lengths)
   * 5. Replace original text node with formatted version
   * 
   * Performance note: XPath evaluation is fast for this use case and
   * provides cleaner results than TreeWalker or manual recursion.
   */
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
        return {
          strongPart: word.slice(0, midpoint),
          rest: word.slice(midpoint)
        }
      })

      const span = document.createElement('span')
      bionicWords.forEach((word, index) => {
        if (index > 0) {
          span.appendChild(document.createTextNode(' '))
        }

        const strong = document.createElement('strong')
        strong.textContent = word.strongPart
        span.appendChild(strong)
        span.appendChild(document.createTextNode(word.rest))
      })
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
  const toggleReaderMode = async () => {
    if (!isEnabled.value) {
      parsedContent.value = await parseContent()
      if (!parsedContent.value) return

      const bodyContent = document.createDocumentFragment()
      while (document.body.firstChild) {
        bodyContent.appendChild(document.body.firstChild)
      }
      originalBodyContent.value = bodyContent

      applyReaderMode()
      isEnabled.value = true
    } else {
      if (originalBodyContent.value) {
        document.body.replaceChildren(originalBodyContent.value)
        originalBodyContent.value = null
      }
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
