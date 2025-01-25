import { ref } from 'vue'

interface AdvancedSearchOptions {
  fileType?: string
  site?: string
  excludeSite?: string
  dateRange?: string
  language?: string
  inTitle?: boolean
  inUrl?: boolean
  inText?: boolean
  exactPhrase?: boolean
  excludeWords?: string[]
  numRange?: {
    start?: number
    end?: number
  }
  cache?: boolean
  related?: boolean
}

export function useAdvancedSearch() {
  const searchOptions = ref<AdvancedSearchOptions>({})

  const fileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word' },
    { value: 'xls', label: 'Excel' },
    { value: 'ppt', label: 'PowerPoint' },
    { value: 'txt', label: 'Texte' },
    { value: 'zip', label: 'Archive ZIP' }
  ]

  const dateRanges = [
    { value: 'h', label: 'Dernière heure' },
    { value: 'd', label: 'Dernières 24h' },
    { value: 'w', label: 'Dernière semaine' },
    { value: 'm', label: 'Dernier mois' },
    { value: 'y', label: 'Dernière année' }
  ]

  const languages = [
    { value: 'lang_fr', label: 'Français' },
    { value: 'lang_en', label: 'Anglais' },
    { value: 'lang_es', label: 'Espagnol' },
    { value: 'lang_de', label: 'Allemand' }
  ]

  // Construire l'URL de recherche avancée
  const buildAdvancedQuery = (baseQuery: string): string => {
    let query = baseQuery

    const {
      fileType,
      site,
      excludeSite,
      dateRange,
      language,
      inTitle,
      inUrl,
      inText,
      exactPhrase,
      excludeWords,
      numRange,
      cache,
      related
    } = searchOptions.value

    if (exactPhrase) {
      query = `"${query}"`
    }

    if (fileType) {
      query += ` filetype:${fileType}`
    }

    if (site) {
      query += ` site:${site}`
    }

    if (excludeSite) {
      query += ` -site:${excludeSite}`
    }

    if (inTitle) {
      query = `intitle:${query}`
    }

    if (inUrl) {
      query = `inurl:${query}`
    }

    if (inText) {
      query = `intext:${query}`
    }

    if (language) {
      query += ` ${language}`
    }

    if (excludeWords?.length) {
      query += ` ${excludeWords.map(word => `-${word}`).join(' ')}`
    }

    if (numRange?.start !== undefined && numRange?.end !== undefined) {
      query += ` ${numRange.start}..${numRange.end}`
    }

    if (cache) {
      query = `cache:${query}`
    }

    if (related) {
      query = `related:${query}`
    }

    // Ajouter le paramètre de date si nécessaire
    if (dateRange) {
      query += `&tbs=qdr:${dateRange}`
    }

    return query
  }

  return {
    searchOptions,
    fileTypes,
    dateRanges,
    languages,
    buildAdvancedQuery
  }
} 