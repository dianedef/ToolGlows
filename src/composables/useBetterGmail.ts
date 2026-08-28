import { ref, watch } from 'vue'

interface GmailDesignOptions {
  hidePromotions?: boolean
  hideSocial?: boolean
  customWidth?: 'narrow' | 'medium' | 'wide'
  customFont?: string
  fontSize?: number
  compactHeader?: boolean
  compactNavigation?: boolean
  hideFooter?: boolean
  darkMode?: boolean
  hideAds?: boolean
  hidePromotionsTab?: boolean
  hideSocialTab?: boolean
  hideSponsored?: boolean
}

interface BundleOptions {
  enabled: boolean
  byLabel?: boolean
  bySender?: boolean
  byCategory?: boolean
  maxGroupSize?: number
  collapseByDefault?: boolean
}

interface PauseOptions {
  enabled: boolean
  hideInbox?: boolean
  disableNotifications?: boolean
  scheduledPause?: {
    start?: string // HH:mm
    end?: string // HH:mm
  }
}

interface QuoteOptions {
  enabled: boolean
  includeTimestamp?: boolean
  includeAuthor?: boolean
  quoteStyle?: 'markdown' | 'html' | 'gmail'
}

export function useBetterGmail() {
  const isEnabled = ref(false)
  const designOptions = ref<GmailDesignOptions>({
    hidePromotions: false,
    hideSocial: false,
    customWidth: 'medium',
    fontSize: 14,
    compactHeader: true,
    compactNavigation: true,
    hideFooter: true,
    hideAds: true,
    hidePromotionsTab: false,
    hideSocialTab: false,
    hideSponsored: true
  })

  const bundleOptions = ref<BundleOptions>({
    enabled: false,
    byLabel: true,
    bySender: false,
    byCategory: true,
    maxGroupSize: 5,
    collapseByDefault: true
  })

  const pauseOptions = ref<PauseOptions>({
    enabled: false,
    hideInbox: false,
    disableNotifications: true
  })

  const quoteOptions = ref<QuoteOptions>({
    enabled: true,
    includeTimestamp: true,
    includeAuthor: true,
    quoteStyle: 'gmail'
  })

  // Appliquer les modifications de design
  const applyDesignChanges = () => {
    if (!isEnabled.value) return

    const style = document.createElement('style')
    style.id = 'better-gmail-styles'

    const styles = `
      /* Masquer les éléments non désirés */
      ${designOptions.value.hidePromotions ? '.aKB { display: none !important; }' : ''}
      ${designOptions.value.hideSocial ? '.aKC { display: none !important; }' : ''}
      ${designOptions.value.hideFooter ? '.aeG { display: none !important; }' : ''}

      /* Ajuster la largeur */
      .AO {
        max-width: ${getWidthValue()} !important;
        margin: 0 auto !important;
      }

      /* Style compact */
      ${designOptions.value.compactHeader ? `
        .gb_Td {
          padding: 4px !important;
        }
      ` : ''}

      ${designOptions.value.compactNavigation ? `
        .ain {
          padding: 4px 0 !important;
        }
        .TK {
          padding: 4px 0 !important;
        }
      ` : ''}

      /* Taille de police personnalisée */
      body {
        font-size: ${designOptions.value.fontSize}px !important;
        ${designOptions.value.customFont ? `font-family: ${designOptions.value.customFont} !important;` : ''}
      }

      /* Masquer les publicités */
      ${designOptions.value.hideAds ? `
        /* Publicités dans la barre latérale */
        .aKB, .brC-aT5-aOt-bsf-Jw, .nH.PS {
          display: none !important;
        }
        /* Publicités en haut des emails */
        .nH.MC, .nH.adv {
          display: none !important;
        }
        /* Autres conteneurs de publicités */
        [data-ad-client], [data-ad-slot], .adsbygoogle {
          display: none !important;
        }
      ` : ''}

      /* Masquer l'onglet Promotions */
      ${designOptions.value.hidePromotionsTab ? `
        .aKB[data-tooltip="Promotions"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer l'onglet Social */
      ${designOptions.value.hideSocialTab ? `
        .aKB[data-tooltip="Social"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer les messages sponsorisés */
      ${designOptions.value.hideSponsored ? `
        .PA, .a3G, [data-message-ad-type] {
          display: none !important;
        }
        /* Messages avec le badge "Sponsorisé" */
        .bvI:has(span:contains("Sponsorisé")) {
          display: none !important;
        }
      ` : ''}
    `

    style.textContent = styles
    document.head.appendChild(style)
  }

  // Gérer les bundles
  const handleBundles = () => {
    if (!bundleOptions.value.enabled) return

    // Logique pour grouper les emails
    const emails = document.querySelectorAll('.zA')
    const groups = new Map()

    emails.forEach(email => {
      let key = ''

      if (bundleOptions.value.byLabel) {
        key = email.querySelector('.av')?.textContent || ''
      } else if (bundleOptions.value.bySender) {
        key = email.querySelector('.yX')?.textContent || ''
      } else if (bundleOptions.value.byCategory) {
        key = email.querySelector('.by')?.textContent || ''
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(email)
    })

    // Créer les bundles visuels
    groups.forEach((groupEmails, key) => {
      if (groupEmails.length > 1) {
        createBundle(key, groupEmails)
      }
    })
  }

  // Créer un bundle visuel
  const createBundle = (key: string, emails: Element[]) => {
    const bundle = document.createElement('div')
    bundle.className = 'better-gmail-bundle'

    const header = document.createElement('div')
    header.className = 'bundle-header'

    const title = document.createElement('span')
    title.textContent = `${key} (${emails.length})`

    const toggleButton = document.createElement('button')
    toggleButton.className = 'bundle-toggle'
    toggleButton.type = 'button'
    toggleButton.textContent = '▼'

    const content = document.createElement('div')
    content.className = 'bundle-content'
    if (bundleOptions.value.collapseByDefault) {
      content.style.display = 'none'
    }

    emails
      .slice(0, bundleOptions.value.maxGroupSize)
      .forEach(email => content.appendChild(email.cloneNode(true)))

    header.append(title, toggleButton)
    bundle.append(header, content)

    emails[0].parentNode?.insertBefore(bundle, emails[0])
    emails.forEach(email => {
      if (email instanceof HTMLElement) {
        email.style.display = 'none'
      }
    })
  }

  // Gérer la pause de l'inbox
  const toggleInboxPause = (pause: boolean) => {
    pauseOptions.value.enabled = pause

    if (pause) {
      if (pauseOptions.value.hideInbox) {
        document.querySelector('.AO')?.classList.add('hidden')
      }
      if (pauseOptions.value.disableNotifications) {
        // Désactiver les notifications
        document.title = document.title.replace(/\(\d+\)/, '')
      }
    } else {
      document.querySelector('.AO')?.classList.remove('hidden')
    }
  }

  // Utilitaire pour obtenir la valeur de largeur
  const getWidthValue = () => {
    switch (designOptions.value.customWidth) {
      case 'narrow': return '800px'
      case 'wide': return '1400px'
      default: return '1100px'
    }
  }

  // Observer les changements dans Gmail
  const initObserver = () => {
    const observer = new MutationObserver(() => {
      if (isEnabled.value) {
        applyDesignChanges()
        if (bundleOptions.value.enabled) {
          handleBundles()
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return observer
  }

  // Initialisation
  const init = () => {
    applyDesignChanges()
    addQuoteStyles()

    document.addEventListener('mouseup', handleQuoteSelection)
    const observer = initObserver()

    // Nettoyage
    return () => {
      observer.disconnect()
      document.getElementById('better-gmail-styles')?.remove()
      document.removeEventListener('mouseup', handleQuoteSelection)
      document.getElementById('gmail-quote-button')?.remove()
    }
  }

  watch([isEnabled, designOptions, bundleOptions, pauseOptions], () => {
    applyDesignChanges()
  })

  // Ajouter cette fonction pour gérer la citation
  const handleQuoteSelection = () => {
    if (!quoteOptions.value.enabled) return

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    // Créer le bouton de citation s'il n'existe pas déjà
    let quoteButton = document.getElementById('gmail-quote-button')
    if (!quoteButton) {
      quoteButton = document.createElement('button')
      quoteButton.id = 'gmail-quote-button'
      quoteButton.textContent = '💬'
      quoteButton.className = 'gmail-quote-button'
      document.body.appendChild(quoteButton)
    }

    // Positionner le bouton près de la sélection
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    quoteButton.style.position = 'fixed'
    quoteButton.style.left = `${rect.right + 10}px`
    quoteButton.style.top = `${rect.top - 10}px`
    quoteButton.style.display = 'block'

    // Gérer le clic sur le bouton
    quoteButton.onclick = () => {
      insertQuote(selection.toString())
      quoteButton.style.display = 'none'
    }
  }

  // Fonction pour insérer la citation dans la zone de composition
  const insertQuote = (text: string) => {
    const composeBox = document.querySelector('[role="textbox"]')
    if (!composeBox) return

    const author = document.querySelector('.gD')?.textContent || 'Original message'
    const timestamp = document.querySelector('.g3')?.textContent || new Date().toLocaleString()

    let quotedText: string
    switch (quoteOptions.value.quoteStyle) {
      case 'markdown':
        quotedText = `> ${text.split('\n').join('\n> ')}\n`
        if (quoteOptions.value.includeAuthor) {
          quotedText += `\n> — ${author}`
        }
        if (quoteOptions.value.includeTimestamp) {
          quotedText += ` (${timestamp})`
        }
        break

      case 'html':
        appendHtmlQuote(composeBox, text, author, timestamp)
        return

      default: // gmail style
        quotedText = `On ${timestamp}, ${author} wrote:\n`
        quotedText += text.split('\n').map(line => `> ${line}`).join('\n')
        quotedText += '\n\n'
    }

    // Insérer la citation sous forme de texte pour éviter de parser du HTML issu de la page.
    composeBox.appendChild(document.createTextNode(quotedText))
  }

  const appendHtmlQuote = (composeBox: Element, text: string, author: string, timestamp: string) => {
    const blockquote = document.createElement('blockquote')
    blockquote.appendChild(document.createTextNode(text))

    if (quoteOptions.value.includeAuthor) {
      blockquote.appendChild(document.createElement('br'))

      const attribution = document.createElement('em')
      let attributionText = author

      if (quoteOptions.value.includeTimestamp) {
        attributionText += ` (${timestamp})`
      }

      attribution.textContent = attributionText
      blockquote.appendChild(attribution)
    }

    composeBox.appendChild(blockquote)
  }

  // Ajouter les styles pour le bouton de citation
  const addQuoteStyles = () => {
    const style = document.createElement('style')
    style.textContent = `
      .gmail-quote-button {
        position: fixed;
        display: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        cursor: pointer;
        z-index: 9999;
        transition: all 0.2s;
      }

      .gmail-quote-button:hover {
        transform: scale(1.1);
        background: #f5f5f5;
      }
    `
    document.head.appendChild(style)
  }

  return {
    isEnabled,
    designOptions,
    bundleOptions,
    pauseOptions,
    init,
    toggleInboxPause,
    quoteOptions,
  }
}
