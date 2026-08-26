import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { bridgeApi, type TabQueryScope } from '@/bridge'

type CopyFormat = 'text' | 'html' | 'markdown'

interface CopyOptions {
  format: CopyFormat
  scope: TabQueryScope
}

interface RichCopyOptions {
  format: CopyFormat
  keepFormatting: boolean
  includeLinks: boolean
  smartQuotes: boolean
  citationTemplate: 'minimal' | 'academic' | 'custom'
  customTemplate: string
}

interface LinkInfo {
  url: string
  text: string
  type: 'internal' | 'external'
  isImage?: boolean
  domain?: string
}

export function useRichCopy() {
  const settingsStore = useSettingsStore()
  const isEnabled = ref(settingsStore.settings.components?.richCopy?.enabled ?? false)
  const isCopying = ref(false)

  // État pour les liens extraits
  const extractedLinks = ref<LinkInfo[]>([])
  const linkFilters = ref({
    onlyExternal: false,
    onlyImages: false,
    domain: '',
  })

  // Options par défaut
  const options = ref<RichCopyOptions>({
    format: 'markdown',
    keepFormatting: true,
    includeLinks: true,
    smartQuotes: false,
    citationTemplate: 'minimal',
    customTemplate: 'Texte: {text}\nSource: {source}\nDate: {date}'
  })

  // Exemple de texte pour l'aperçu
  const previewText = "Ceci est un exemple de texte avec un <b>formatage</b> et un <a href='#'>lien</a>."

  // Mettre à jour les options
  const updateOptions = (newOptions: Partial<RichCopyOptions>) => {
    options.value = {
      ...options.value,
      ...newOptions
    }

    settingsStore.updateSettings({
      components: {
        ...settingsStore.settings.components,
        richCopy: {
          enabled: isEnabled.value,
          options: options.value
        }
      }
    })
  }

  // Formater un lien selon le format demandé
  const formatLink = (url: string, title: string, format: CopyFormat): string => {
    switch (format) {
      case 'html':
        return `<a href="${url}">${title}</a>`
      case 'markdown':
        return `[${title}](${url})`
      default:
        return `${title} - ${url}`
    }
  }

  // Copier les liens filtrés
  const copyFilteredLinks = async (format: CopyFormat = 'text') => {
    const links = filteredLinks.value
    let formattedText = ''

    switch (format) {
      case 'html':
        formattedText = links
          .map(link => `<a href="${link.url}">${link.text}</a>`)
          .join('<br>\n')
        break
      case 'markdown':
        formattedText = links
          .map(link => `[${link.text}](${link.url})`)
          .join('\n')
        break
      default:
        formattedText = links
          .map(link => `${link.text} - ${link.url}`)
          .join('\n')
    }

    try {
      await navigator.clipboard.writeText(formattedText)
      return true
    } catch (error) {
      console.error('Erreur lors de la copie des liens:', error)
      return false
    }
  }

  // Copier les onglets
  const copyTabs = async (options: CopyOptions) => {
    isCopying.value = true
    try {
      const tabs = await bridgeApi.getTabs(options.scope)

      const formattedLinks = tabs
        .map(tab => formatLink(tab.url, tab.title, options.format))
        .join('\n')

      await navigator.clipboard.writeText(formattedLinks)
      return true
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
      return false
    } finally {
      isCopying.value = false
    }
  }

  // Copier le texte sélectionné avec formatage
  const copySelection = async () => {
    const selection = window.getSelection()
    if (!selection) return false

    const text = selection.toString()
    await copyToClipboard(text)
    return true
  }

  // Copier du texte avec le formatage choisi
  const copyToClipboard = async (text: string) => {
    let formattedText = text

    if (options.value.smartQuotes) {
      formattedText = formattedText
        .replace(/"/g, '"')
        .replace(/'/g, "'")
    }

    switch (options.value.format) {
      case 'markdown':
        formattedText = options.value.keepFormatting
          ? formattedText
              .replace(/<b>(.*?)<\/b>/g, '**$1**')
              .replace(/<i>(.*?)<\/i>/g, '_$1_')
          : formattedText.replace(/<[^>]+>/g, '')
        break

      case 'html':
        if (!options.value.keepFormatting) {
          formattedText = formattedText.replace(/<[^>]+>/g, '')
        }
        break

      case 'text':
      default:
        formattedText = formattedText.replace(/<[^>]+>/g, '')
        break
    }

    if (options.value.includeLinks) {
      const url = window.location.href
      const title = document.title
      formattedText += `\n\nSource: ${formatLink(url, title, options.value.format)}`
    }

    try {
      await navigator.clipboard.writeText(formattedText)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  // Extraire tous les liens de la page
  const extractPageLinks = () => {
    const links = Array.from(document.querySelectorAll('a'))
    const currentDomain = window.location.hostname

    extractedLinks.value = links.map(link => {
      const url = link.href
      const linkDomain = new URL(url).hostname

      return {
        url,
        text: link.textContent?.trim() || url,
        type: linkDomain === currentDomain ? 'internal' : 'external',
        isImage: link.querySelector('img') !== null,
        domain: linkDomain
      }
    })
  }

  // Filtrer les liens extraits
  const filteredLinks = computed(() => {
    return extractedLinks.value.filter(link => {
      if (linkFilters.value.onlyExternal && link.type !== 'external') return false
      if (linkFilters.value.onlyImages && !link.isImage) return false
      if (linkFilters.value.domain && !link.domain?.includes(linkFilters.value.domain)) return false
      return true
    })
  })

  // Grouper les liens par domaine
  const linksByDomain = computed(() => {
    const grouped = new Map<string, LinkInfo[]>()

    filteredLinks.value.forEach(link => {
      const domain = link.domain || 'unknown'
      if (!grouped.has(domain)) {
        grouped.set(domain, [])
      }
      grouped.get(domain)?.push(link)
    })

    return grouped
  })

  return {
    isEnabled,
    isCopying,
    options,
    linkFilters,
    extractedLinks,
    filteredLinks,
    linksByDomain,
    previewText,
    updateOptions,
    copyToClipboard,
    copySelection,
    copyFilteredLinks,
    copyTabs,
    extractPageLinks
  }
}
