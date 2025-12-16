/**
 * Dark Mode Composable
 * 
 * Applies system-wide dark mode to any website with intelligent automation.
 * Goes beyond simple CSS filters - provides multiple sync strategies and
 * per-site exclusions for optimal user experience.
 * 
 * Sync strategies:
 * 1. Manual toggle - User control via toolbar
 * 2. System preference - Follows OS dark mode setting
 * 3. Location-based - Auto-enables at sunset, disables at sunrise
 * 4. Schedule-based - Custom time ranges (e.g., "19:00" to "07:00")
 * 
 * Features:
 * - Per-domain exclusion list (e.g., already-dark sites)
 * - Customizable colors (background, text, links)
 * - Image/video brightness adjustment
 * - Form element styling
 * - MutationObserver for dynamic content
 * 
 * Implementation approach:
 * - CSS injection with !important for override
 * - Filter adjustments for media
 * - Re-applies styles when DOM mutates (for SPAs)
 * 
 * Use cases:
 * - Reducing eye strain during night browsing
 * - Battery saving on OLED displays
 * - Accessibility for light-sensitive users
 * - Preference for dark aesthetics
 */
import { ref, watch } from 'vue'

interface DarkModeOptions {
  excludedDomains?: string[]  // Sites that already have good dark modes
  syncWithSystem?: boolean     // Follow OS preference
  syncWithLocation?: boolean   // Auto-enable at sunset based on GPS
  customStyles?: {
    backgroundColor?: string
    textColor?: string
    linkColor?: string
  }
  autoSunsetTime?: string  // Fallback time (HH:MM format)
  autoSunriseTime?: string // Fallback time (HH:MM format)
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
      console.error('ERROR: Failed to get position:', error)
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

  /**
   * Calculate Astronomical Sunrise/Sunset Times
   * 
   * Uses public API to get precise sun times for user's location.
   * This provides more accurate dark mode timing than fixed schedules.
   * 
   * Why astronomical times: Simply using "7 PM" fails to account for:
   * - Seasonal variations (summer light until 9 PM, winter dark at 5 PM)
   * - Latitude differences (Nordic vs tropical day lengths)
   * - User travel across time zones
   * 
   * API: sunrise-sunset.org provides free, no-auth astronomical data
   * Fallback: If API fails or user denies location, uses configured times
   * 
   * @param latitude - GPS latitude
   * @param longitude - GPS longitude
   * @returns Sunrise and sunset Date objects for current day
   */
  const calculateSunTimes = async (latitude: number, longitude: number) => {
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
      // Fallback to default times
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

  /**
   * Initialize Dark Mode System
   * 
   * Sets up all sync strategies and observers based on config.
   * 
   * Initialization sequence:
   * 1. Check if current domain is excluded
   * 2. Setup system preference listener (if enabled)
   * 3. Calculate and schedule location-based times (if enabled)
   * 4. Create MutationObserver for dynamic content
   * 
   * MutationObserver necessity: Many modern sites (SPAs) dynamically
   * inject content after page load. Without observer, dark mode styles
   * would only apply to initial DOM, leaving new content light.
   * 
   * Performance consideration: Observer on entire body could be expensive,
   * but dark mode is opt-in feature so acceptable tradeoff for UX.
   * 
   * Hourly location check: Recalculates sun times every hour to handle:
   * - Long browsing sessions spanning sunset/sunrise
   * - User movement across locations (road trips, flights)
   */
  const init = async () => {
    checkCurrentDomain()

    // System preference sync
    if (options.syncWithSystem) {
      isDarkMode.value = prefersDark.matches
      prefersDark.addEventListener('change', (e) => {
        isDarkMode.value = e.matches
      })
    }

    // Location-based auto-enable
    if (options.syncWithLocation) {
      await checkLocationAndTime()
      // Recheck every hour for accuracy
      setInterval(checkLocationAndTime, 3600000)
    }

    // Watch for dynamic content changes (SPAs, infinite scroll, etc.)
    const observer = new MutationObserver(() => {
      if (isDarkMode.value) {
        applyDarkMode()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup on unmount
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