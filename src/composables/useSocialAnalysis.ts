import { useSocialAnalysisStore } from '@/stores/socialAnalysis'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, computed } from 'vue'

export function useSocialAnalysis() {
  const store = useSocialAnalysisStore()
  const { comments, isLoading, stats, platform } = storeToRefs(store)

  // Calcul des pourcentages pour les graphiques
  const genderPercentages = computed(() => {
    const total = stats.value.totalComments
    if (total === 0) return { male: 0, female: 0, unknown: 0 }

    return {
      male: (stats.value.genderDistribution.male / total) * 100,
      female: (stats.value.genderDistribution.female / total) * 100,
      unknown: (stats.value.genderDistribution.unknown / total) * 100
    }
  })

  const sentimentPercentages = computed(() => {
    const result = {
      male: { positive: 0, negative: 0, neutral: 0 },
      female: { positive: 0, negative: 0, neutral: 0 }
    }

    // Pour les hommes
    const totalMale = Object.values(stats.value.sentimentByGender.male).reduce((a, b) => a + b, 0)
    if (totalMale > 0) {
      result.male = {
        positive: (stats.value.sentimentByGender.male.positive / totalMale) * 100,
        negative: (stats.value.sentimentByGender.male.negative / totalMale) * 100,
        neutral: (stats.value.sentimentByGender.male.neutral / totalMale) * 100
      }
    }

    // Pour les femmes
    const totalFemale = Object.values(stats.value.sentimentByGender.female).reduce((a, b) => a + b, 0)
    if (totalFemale > 0) {
      result.female = {
        positive: (stats.value.sentimentByGender.female.positive / totalFemale) * 100,
        negative: (stats.value.sentimentByGender.female.negative / totalFemale) * 100,
        neutral: (stats.value.sentimentByGender.female.neutral / totalFemale) * 100
      }
    }

    return result
  })

  onMounted(() => {
    store.detectPlatform()
  })

  onUnmounted(() => {
    store.clearAnalysis()
  })

  const exportToCSV = () => {
    const headers = ['Texte', 'Genre', 'Sentiment', 'URL du profil', 'Horodatage', 'Likes']
    const rows = comments.value.map(comment => [
      `"${comment.text.replace(/"/g, '""')}"`,
      comment.gender,
      comment.sentiment,
      comment.profileUrl,
      comment.timestamp || '',
      comment.likes || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analyse_sociale_${platform.value}_${new Date().toISOString()}.csv`
    link.click()
  }

  return {
    comments,
    isLoading,
    stats,
    platform,
    genderPercentages,
    sentimentPercentages,
    analyzeComments: store.analyzeComments,
    clearAnalysis: store.clearAnalysis,
    exportToCSV
  }
} 