import { ref, watch } from 'vue'

interface DarkModeOptions {
  excludedDomains?: string[]
  syncWithSystem?: boolean
  syncWithLocation?: boolean
  customStyles?: {
    backgroundColor?: string
    textColor?: string
    linkColor?: string
  }
  autoSunsetTime?: string // ex: "19:00"
  autoSunriseTime?: string // ex: "07:00"
}

export function useDarkMode(options: DarkModeOptions = {}) {
  const isDarkMode = ref(false)
  const excludedDomains = ref(options.excludedDomains || [])
  const isEnabled = ref(true)

  // État pour suivre si le site actuel est exclu
  const isCurrentDomainExcluded = ref(false)

  // Vérifier si le domaine actuel est exclu
  const checkCurrentDomain = () => {
    const currentDomain = window.location.hostname
    isCurrentDomainExcluded.value = excludedDomains.value.some(domain => 
      currentDomain.includes(domain)
    )
  }

  // Détecter le mode sombre du système
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

  // Obtenir la position de l'utilisateur et l'heure locale
  const checkLocationAndTime = async () => {
    try {
      const position = await getCurrentPosition()
      const sunTimes = await calculateSunTimes(position.latitude, position.longitude)
      const now = new Date()
      
      // Vérifier si c'est la nuit
      isDarkMode.value = now < sunTimes.sunrise || now > sunTimes.sunset
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error)
      // Fallback sur les heures définies manuellement
      const now = new Date()
      const currentTime = now.getHours() * 100 + now.getMinutes()
      const sunsetTime = parseInt((options.autoSunsetTime || '19:00').replace(':', ''))
      const sunriseTime = parseInt((options.autoSunriseTime || '07:00').replace(':', ''))
      
      isDarkMode.value = currentTime >= sunsetTime || currentTime <= sunriseTime
    }
  }

  // Obtenir la position actuelle
  const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation non supportée'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        }
      )
    })
  }

  // Calculer les heures de lever et coucher du soleil
  const calculateSunTimes = async (latitude: number, longitude: number) => {
    // Utiliser une API pour obtenir les heures précises
    try {
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
      )
      const data = await response.json()
      return {
        sunrise: new Date(data.results.sunrise),
        sunset: new Date(data.results.sunset)
      }
    } catch (error) {
      console.error('Erreur lors du calcul des heures solaires:', error)
      // Fallback sur des heures par défaut
      const today = new Date()
      return {
        sunrise: new Date(today.setHours(7, 0, 0)),
        sunset: new Date(today.setHours(19, 0, 0))
      }
    }
  }

  // Appliquer le mode sombre
  const applyDarkMode = () => {
    if (!isEnabled.value || isCurrentDomainExcluded.value) return

    const style = document.createElement('style')
    style.id = 'dark-mode-styles'
    
    const customBg = options.customStyles?.backgroundColor || '#1a1a1a'
    const customText = options.customStyles?.textColor || '#ffffff'
    const customLink = options.customStyles?.linkColor || '#6ea8fe'

    style.textContent = `
      body {
        background-color: ${customBg} !important;
        color: ${customText} !important;
      }
      
      a {
        color: ${customLink} !important;
      }
      
      /* Inverser les images sombres */
      img, video {
        filter: brightness(.8) contrast(1.2);
      }
      
      /* Styles pour les éléments courants */
      input, textarea, select {
        background-color: ${customBg} !important;
        color: ${customText} !important;
        border-color: #444 !important;
      }
      
      /* Styles pour les conteneurs */
      div, section, article, aside, nav {
        background-color: ${customBg} !important;
        color: ${customText} !important;
      }
    `

    // Supprimer l'ancien style s'il existe
    const oldStyle = document.getElementById('dark-mode-styles')
    if (oldStyle) {
      oldStyle.remove()
    }

    if (isDarkMode.value) {
      document.head.appendChild(style)
    }
  }

  // Ajouter un domaine à la liste d'exclusion
  const excludeDomain = (domain: string) => {
    if (!excludedDomains.value.includes(domain)) {
      excludedDomains.value.push(domain)
      checkCurrentDomain()
      applyDarkMode()
    }
  }

  // Retirer un domaine de la liste d'exclusion
  const includeDomain = (domain: string) => {
    const index = excludedDomains.value.indexOf(domain)
    if (index > -1) {
      excludedDomains.value.splice(index, 1)
      checkCurrentDomain()
      applyDarkMode()
    }
  }

  // Initialisation
  const init = async () => {
    checkCurrentDomain()

    if (options.syncWithSystem) {
      isDarkMode.value = prefersDark.matches
      prefersDark.addEventListener('change', (e) => {
        isDarkMode.value = e.matches
      })
    }

    if (options.syncWithLocation) {
      await checkLocationAndTime()
      // Vérifier toutes les heures
      setInterval(checkLocationAndTime, 3600000)
    }

    // Observer les changements de DOM pour réappliquer le mode sombre
    const observer = new MutationObserver(() => {
      if (isDarkMode.value) {
        applyDarkMode()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Nettoyer l'observer quand le composant est démonté
    onUnmounted(() => {
      observer.disconnect()
    })
  }

  // Surveiller les changements de mode
  watch(isDarkMode, () => {
    applyDarkMode()
  })

  // Toggle manuel du mode sombre
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    isEnabled,
    excludedDomains,
    toggleDarkMode,
    excludeDomain,
    includeDomain,
    init
  }
} 