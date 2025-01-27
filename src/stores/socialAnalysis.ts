import { defineStore } from 'pinia'

interface CommentData {
  text: string
  profileUrl: string
  gender?: 'male' | 'female' | 'unknown'
  sentiment: 'positive' | 'negative' | 'neutral'
  timestamp?: string
  likes?: number
}

interface SocialAnalysisState {
  isActive: boolean
  comments: CommentData[]
  stats: {
    totalComments: number
    genderDistribution: {
      male: number
      female: number
      unknown: number
    }
    sentimentByGender: {
      male: {
        positive: number
        negative: number
        neutral: number
      }
      female: {
        positive: number
        negative: number
        neutral: number
      }
    }
  }
  isLoading: boolean
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'unknown'
}

export const useSocialAnalysisStore = defineStore('socialAnalysis', {
  state: (): SocialAnalysisState => ({
    isActive: false,
    comments: [],
    stats: {
      totalComments: 0,
      genderDistribution: {
        male: 0,
        female: 0,
        unknown: 0
      },
      sentimentByGender: {
        male: {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        female: {
          positive: 0,
          negative: 0,
          neutral: 0
        }
      }
    },
    isLoading: false,
    platform: 'unknown'
  }),

  actions: {
    setActive(value: boolean) {
      this.isActive = value
    },

    detectPlatform() {
      const url = window.location.hostname
      if (url.includes('facebook')) this.platform = 'facebook'
      else if (url.includes('instagram')) this.platform = 'instagram'
      else if (url.includes('twitter')) this.platform = 'twitter'
      else if (url.includes('linkedin')) this.platform = 'linkedin'
      else this.platform = 'unknown'
    },

    async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
      // Analyse simple basée sur des mots-clés
      const positiveWords = ['super', 'génial', 'excellent', 'bravo', 'merci', '👍', '❤️', '😊']
      const negativeWords = ['nul', 'mauvais', 'horrible', 'décevant', 'déçu', '👎', '😠', '😡']
      
      const textLower = text.toLowerCase()
      let score = 0

      positiveWords.forEach(word => {
        if (textLower.includes(word.toLowerCase())) score++
      })

      negativeWords.forEach(word => {
        if (textLower.includes(word.toLowerCase())) score--
      })

      return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    },

    async predictGender(profileUrl: string): Promise<'male' | 'female' | 'unknown'> {
      try {
        // Analyse basique basée sur l'URL du profil
        const urlLower = profileUrl.toLowerCase()
        
        // Liste de prénoms communs (à enrichir)
        const maleNames = ['jean', 'pierre', 'thomas', 'nicolas', 'david']
        const femaleNames = ['marie', 'julie', 'sophie', 'laura', 'emma']

        for (const name of maleNames) {
          if (urlLower.includes(name)) return 'male'
        }

        for (const name of femaleNames) {
          if (urlLower.includes(name)) return 'female'
        }

        return 'unknown'
      } catch {
        return 'unknown'
      }
    },

    async analyzeComments() {
      this.isLoading = true
      this.comments = []
      this.detectPlatform()

      try {
        let commentElements: Element[] = []
        
        // Sélection des commentaires selon la plateforme
        switch (this.platform) {
          case 'facebook':
            commentElements = Array.from(document.querySelectorAll('[data-testid="UFI2Comment/body"]'))
            break
          case 'instagram':
            commentElements = Array.from(document.querySelectorAll('ul.x5fptzk li.grvghm5a'))
            break
          case 'twitter':
            commentElements = Array.from(document.querySelectorAll('[data-testid="tweet"]'))
            break
          case 'linkedin':
            commentElements = Array.from(document.querySelectorAll('.comments-comment-item'))
            break
        }

        // Analyse de chaque commentaire
        for (const element of commentElements) {
          const profileUrl = element.querySelector('a')?.href || ''
          const text = element.textContent || ''
          
          const [sentiment, gender] = await Promise.all([
            this.analyzeSentiment(text),
            this.predictGender(profileUrl)
          ])

          const comment: CommentData = {
            text,
            profileUrl,
            gender,
            sentiment,
            timestamp: element.querySelector('time')?.dateTime,
            likes: parseInt(element.querySelector('.likes-count')?.textContent || '0')
          }

          this.comments.push(comment)
        }

        // Mise à jour des statistiques
        this.updateStats()
      } catch (error) {
        console.error('[ERROR] Erreur lors de l\'analyse des commentaires:', error)
      } finally {
        this.isLoading = false
      }
    },

    updateStats() {
      // Réinitialisation des stats
      this.stats.totalComments = this.comments.length
      this.stats.genderDistribution = {
        male: 0,
        female: 0,
        unknown: 0
      }
      this.stats.sentimentByGender = {
        male: { positive: 0, negative: 0, neutral: 0 },
        female: { positive: 0, negative: 0, neutral: 0 }
      }

      // Calcul des statistiques
      this.comments.forEach(comment => {
        // Distribution par genre
        if (comment.gender) {
          this.stats.genderDistribution[comment.gender]++
        }

        // Sentiment par genre
        if (comment.gender && comment.gender !== 'unknown') {
          this.stats.sentimentByGender[comment.gender][comment.sentiment]++
        }
      })
    },

    clearAnalysis() {
      this.comments = []
      this.updateStats()
    }
  }
}) 