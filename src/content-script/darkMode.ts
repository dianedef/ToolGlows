import { onMessage } from 'webext-bridge/content-script'

interface DarkModeMessage {
  styles: string
  isActive: boolean
}

// Gestionnaire des styles du mode sombre
let darkModeStyle: HTMLStyleElement | null = null
const STYLE_ID = 'dark-mode-content-styles'

// État du mode sombre
let isDarkModeActive = false

// Validation des styles CSS
const isValidCSS = (styles: string): boolean => {
  try {
    const testElement = document.createElement('style')
    testElement.textContent = styles
    document.head.appendChild(testElement)
    const isValid = testElement.sheet !== null
    testElement.remove()
    return isValid
  } catch (error) {
    console.error('[DARK MODE] ❌ Style validation failed:', error)
    return false
  }
}

// Fonction pour appliquer les styles
const applyDarkModeStyles = (styles: string): boolean => {
  try {
    console.log('[DARK MODE] 🎨 Applying dark mode styles')
    
    // Vérifier si les styles sont valides
    if (!isValidCSS(styles)) {
      console.error('[DARK MODE] ❌ Invalid CSS styles provided')
      return false
    }

    // Vérifier si les styles sont déjà appliqués et identiques
    if (darkModeStyle?.textContent === styles) {
      console.log('[DARK MODE] ℹ️ Styles already applied, skipping')
      return true
    }

    // Supprimer l'ancien style s'il existe
    removeDarkModeStyles()

    // Créer et ajouter le nouveau style
    darkModeStyle = document.createElement('style')
    darkModeStyle.id = STYLE_ID
    darkModeStyle.textContent = styles
    document.head.appendChild(darkModeStyle)
    
    console.log('[DARK MODE] ✨ New styles applied successfully')
    return true
  } catch (error) {
    console.error('[DARK MODE] ❌ Error applying styles:', error)
    return false
  }
}

// Fonction pour supprimer les styles
const removeDarkModeStyles = (): boolean => {
  try {
    console.log('[DARK MODE] 🗑️ Initiating dark mode styles removal')

    // Vérifier si le mode sombre est déjà désactivé
    if (!isDarkModeActive && !darkModeStyle && !document.getElementById(STYLE_ID)) {
      console.log('[DARK MODE] ℹ️ Dark mode already inactive, nothing to remove')
      return true
    }

    // Rechercher tous les styles potentiels (en cas de doublons accidentels)
    const existingStyles = document.querySelectorAll(`style#${STYLE_ID}`)
    
    if (existingStyles.length > 0) {
      console.log(`[DARK MODE] 🔍 Found ${existingStyles.length} style element(s) to remove`)
      existingStyles.forEach(style => {
        try {
          style.remove()
          console.log('[DARK MODE] 🗑️ Style element removed')
        } catch (removeError) {
          console.error('[DARK MODE] ⚠️ Error removing individual style:', removeError)
        }
      })
    }

    // Nettoyage de la référence en mémoire
    if (darkModeStyle) {
      darkModeStyle = null
      console.log('[DARK MODE] 🧹 Memory reference cleared')
    }

    // Mise à jour de l'état
    isDarkModeActive = false
    console.log('[DARK MODE] ✅ Dark mode successfully deactivated')
    
    return true
  } catch (error) {
    console.error('[DARK MODE] ❌ Critical error during styles removal:', error)
    return false
  }
}

// Vérifier si un objet est un message de mode sombre
function isDarkModeMessage(data: unknown): data is DarkModeMessage {
  if (typeof data !== 'object' || data === null) return false
  
  const msg = data as Partial<DarkModeMessage>
  return (
    typeof msg.styles === 'string' &&
    typeof msg.isActive === 'boolean'
  )
}

// Écouter les messages pour le mode sombre
console.log('[DARK MODE] 🎧 Initializing dark mode listeners')

onMessage('DARK_MODE_UPDATE', ({ data }) => {
  console.log('[DARK MODE] 📥 Received update:', data)
  
  if (isDarkModeMessage(data)) {
    if (data.isActive) {
      if (data.styles) {
        const success = applyDarkModeStyles(data.styles)
        if (success) {
          isDarkModeActive = true
        }
      }
    } else {
      removeDarkModeStyles()
    }
  }
})

// Nettoyage lors du déchargement de la page
window.addEventListener('unload', () => {
  if (isDarkModeActive) {
    removeDarkModeStyles()
  }
})

// Exporter les fonctions pour les utiliser ailleurs si nécessaire
export {
  applyDarkModeStyles,
  removeDarkModeStyles,
  isDarkModeActive
}
