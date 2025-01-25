import { ref, onMounted, onUnmounted } from 'vue'

interface SpeedBrowsingOptions {
  enabled: boolean
  radius: number // Rayon en pixels autour du curseur
  maxCachedPages: number // Nombre maximum de pages en cache
  cacheTimeout: number // Durée de vie du cache en minutes
  excludedDomains: string[] // Domaines à exclure
  preloadImages: boolean // Précharger aussi les images
  throttleDelay: number // Délai entre les tentatives de préchargement
  sameDomainOnly: boolean // Ne précharger que les pages du même domaine
}

interface CachedPage {
  url: string
  content: string
  timestamp: number
}

export function useSpeedBrowsing() {
  const options = ref<SpeedBrowsingOptions>({
    enabled: true,
    radius: 50,
    maxCachedPages: 3,
    cacheTimeout: 2,
    excludedDomains: [
      'google',
      'facebook',
      'twitter',
      'linkedin',
      'youtube',
      'github',
      'instagram',
      'amazon'
    ],
    preloadImages: false,
    throttleDelay: 5000,
    sameDomainOnly: true
  })

  const cache = ref<Map<string, CachedPage>>(new Map())
  const failedUrls = ref<Set<string>>(new Set()) // URLs qui ont échoué
  const mousePosition = ref({ x: 0, y: 0 })
  const isPreloading = ref(false)
  const lastPreloadTime = ref(0)

  const isEnabled = ref(false)
  const scrollSpeed = ref(5)
  const smoothScroll = ref(true)

  const updateScrollSpeed = (value: number) => {
    scrollSpeed.value = value
  }

  const toggleSmoothScroll = (value: boolean) => {
    smoothScroll.value = value
    document.documentElement.style.scrollBehavior = value ? 'smooth' : 'auto'
  }

  onMounted(() => {
    document.documentElement.style.scrollBehavior = smoothScroll.value ? 'smooth' : 'auto'
  })

  // Vérifier si un lien est dans le rayon
  const isLinkInRadius = (link: HTMLAnchorElement): boolean => {
    const rect = link.getBoundingClientRect()
    const linkCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }

    const distance = Math.sqrt(
      Math.pow(mousePosition.value.x - linkCenter.x, 2) +
      Math.pow(mousePosition.value.y - linkCenter.y, 2)
    )

    return distance <= options.value.radius
  }

  // Précharger une page
  const preloadPage = async (url: string) => {
    if (!options.value.enabled) return
    if (cache.value.has(url)) return
    if (failedUrls.value.has(url)) return
    if (cache.value.size >= options.value.maxCachedPages) {
      clearOldestCache()
    }

    try {
      isPreloading.value = true
      
      let absoluteUrl: string
      try {
        absoluteUrl = new URL(url, window.location.origin).toString()
      } catch (e) {
        failedUrls.value.add(url)
        return // Silencieusement ignorer les URLs invalides
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000) // Timeout de 3 secondes

      const response = await fetch(absoluteUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        failedUrls.value.add(url)
        return // Silencieusement ignorer les erreurs HTTP
      }

      const content = await response.text()
      cache.value.set(url, {
        url,
        content,
        timestamp: Date.now()
      })

      if (options.value.preloadImages) {
        preloadImages(content)
      }
    } catch (error: any) {
      failedUrls.value.add(url)
      // Ne pas logger les erreurs CORS ou timeout
      if (!error.name.includes('AbortError') && !error.name.includes('CORS')) {
        console.warn(`ERROR: Failed to preload ${url}`)
      }
    } finally {
      isPreloading.value = false
    }
  }

  // Précharger les images d'une page
  const preloadImages = (content: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const images = doc.querySelectorAll('img')

    images.forEach(img => {
      const src = img.getAttribute('src')
      if (src) {
        const preloadImage = new Image()
        preloadImage.src = src
      }
    })
  }

  // Nettoyer le cache le plus ancien
  const clearOldestCache = () => {
    let oldestUrl = ''
    let oldestTimestamp = Infinity

    cache.value.forEach((page, url) => {
      if (page.timestamp < oldestTimestamp) {
        oldestTimestamp = page.timestamp
        oldestUrl = url
      }
    })

    if (oldestUrl) {
      cache.value.delete(oldestUrl)
    }
  }

  // Nettoyer le cache expiré et les URLs échouées
  const cleanExpiredCache = () => {
    const now = Date.now()
    const timeout = options.value.cacheTimeout * 60 * 1000

    cache.value.forEach((page, url) => {
      if (now - page.timestamp > timeout) {
        cache.value.delete(url)
      }
    })

    // Nettoyer les URLs échouées après un certain temps
    if (now % (timeout * 2) === 0) { // Nettoyer les URLs échouées moins fréquemment
      failedUrls.value.clear()
    }
  }

  // Gérer le mouvement de la souris
  const handleMouseMove = (event: MouseEvent) => {
    // Ne rien faire si le préchargement est en cours
    if (isPreloading.value) return

    // Mise à jour moins fréquente de la position
    if (Date.now() - lastPreloadTime.value < 200) return

    mousePosition.value = {
      x: event.clientX,
      y: event.clientY
    }

    // Ne précharger que les liens visibles dans la fenêtre
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
      .filter(link => {
        const rect = link.getBoundingClientRect()
        // Vérifier si le lien est visible et a un href valide
        return link.href &&
               rect.top >= 0 && 
               rect.left >= 0 && 
               rect.bottom <= window.innerHeight &&
               rect.right <= window.innerWidth
      })
      .slice(0, 5) // Limiter à 5 liens maximum à analyser

    // Ne tester qu'un seul lien à la fois
    for (const link of links) {
      if (isLinkInRadius(link)) {
        const url = link.href
        if (!cache.value.has(url) && !failedUrls.value.has(url) && shouldPreload(url)) {
          lastPreloadTime.value = Date.now()
          preloadPage(url)
          break // Sortir dès qu'un lien est trouvé
        }
      }
    }
  }

  // Vérifier si une URL doit être préchargée
  const shouldPreload = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const currentDomain = window.location.hostname

      // Vérifications de sécurité et de pertinence
      if (!url.startsWith('http')) return false
      if (url.includes('#')) return false                    // Ignore les ancres
      if (urlObj.pathname.match(/\.(jpg|jpeg|png|gif|pdf|zip|exe|dmg|txt|json)$/i)) return false
      if (Date.now() - lastPreloadTime.value < options.value.throttleDelay) return false
      if (options.value.sameDomainOnly && urlObj.hostname !== currentDomain) return false
      if (options.value.excludedDomains.some(domain => urlObj.hostname.includes(domain))) return false
      
      return true
    } catch {
      return false
    }
  }

  // Initialisation
  const init = () => {
    document.addEventListener('mousemove', handleMouseMove)
    
    // Nettoyer le cache périodiquement
    const cleanupInterval = setInterval(cleanExpiredCache, 60000)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearInterval(cleanupInterval)
      cache.value.clear()
    }
  }

  return {
    options,
    cache,
    isPreloading,
    init,
    isEnabled,
    scrollSpeed,
    smoothScroll,
    updateScrollSpeed,
    toggleSmoothScroll
  }
} 