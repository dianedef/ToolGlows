interface WordStats {
  wordCount: number
  characterCount: number
  characterNoSpaces: number
  specialCharCount: number
  averageWordLength: number
  longestWord: string
  sentenceCount: number
  paragraphCount: number
  readingTime: number // en minutes
  speakingTime: number // en minutes
  languageDistribution: Map<string, number> // distribution des langues détectées
  frequentWords: Array<{ text: string, count: number }>
}

export function useWordCounter() {
  const stats = ref<WordStats | null>(null)
  const isVisible = ref(false)
  const position = ref({ x: 0, y: 0 })
  
  // Options d'analyse
  const options = ref({
    countSpaces: true,
    countPunctuation: true
  })

  // Mettre à jour les options
  const updateOptions = () => {
    if (stats.value) {
      // Recalculer les statistiques avec les nouvelles options
      const selection = window.getSelection()
      if (selection) {
        const text = selection.toString()
        stats.value = analyzeText(text)
      }
    }
  }

  // Copier les statistiques
  const copyStats = async () => {
    if (!stats.value) return
    
    const text = `
Statistiques du texte :
- Mots : ${stats.value.wordCount}
- Caractères : ${stats.value.characterCount}
- Phrases : ${stats.value.sentenceCount}
- Temps de lecture : ${formatTime(stats.value.readingTime)}
    `.trim()

    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  // Analyser le texte sélectionné
  const analyzeText = (text: string): WordStats => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    const specialChars = text.match(/[^a-zA-Z0-9\s]/g) || []
    
    const totalCharacters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const averageLength = words.length > 0 
      ? words.reduce((sum, word) => sum + word.length, 0) / words.length 
      : 0
    
    // Trouver le mot le plus long
    const longestWord = words.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    , '')

    // Estimer le temps de lecture (en moyenne 200 mots par minute)
    const readingTime = words.length / 200
    
    // Estimer le temps de parole (en moyenne 130 mots par minute)
    const speakingTime = words.length / 130

    // Détecter les langues (implémentation basique)
    const languageDistribution = detectLanguages(text)

    // Calculer les mots fréquents
    const wordFrequency = new Map<string, number>()
    words.forEach(word => {
      const normalized = word.toLowerCase()
      wordFrequency.set(normalized, (wordFrequency.get(normalized) || 0) + 1)
    })

    const frequentWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }))

    return {
      wordCount: words.length,
      characterCount: totalCharacters,
      characterNoSpaces: charactersNoSpaces,
      specialCharCount: specialChars.length,
      averageWordLength: Math.round(averageLength * 100) / 100,
      longestWord,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      readingTime,
      speakingTime,
      languageDistribution,
      frequentWords
    }
  }

  // Détecter les langues utilisées (implémentation basique)
  const detectLanguages = (text: string): Map<string, number> => {
    const distribution = new Map<string, number>()
    
    // Patterns basiques pour détecter les langues
    const patterns = {
      french: /[àâäéèêëîïôöùûüÿçœæ]/g,
      english: /\b(the|and|or|in|on|at|to)\b/gi,
      spanish: /[áéíóúñ¿¡]/g,
      german: /[äöüß]/g
    }

    Object.entries(patterns).forEach(([lang, pattern]) => {
      const matches = text.match(pattern)
      if (matches) {
        distribution.set(lang, matches.length)
      }
    })

    return distribution
  }

  // Gérer le clic droit
  const handleContextMenu = (event: MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    event.preventDefault()
    const text = selection.toString()
    
    if (text.trim().length > 0) {
      stats.value = analyzeText(text)
      position.value = {
        x: event.clientX,
        y: event.clientY
      }
      isVisible.value = true
    }
  }

  // Formater le temps en minutes et secondes
  const formatTime = (minutes: number): string => {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}m ${secs}s`
  }

  // Initialisation
  const init = () => {
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', () => {
      isVisible.value = false
    })

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }

  return {
    stats,
    isVisible,
    position,
    formatTime,
    init,
    options,
    updateOptions,
    copyStats
  }
} 