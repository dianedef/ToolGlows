import { onMessage } from 'webext-bridge/content-script'

// Gestionnaire des styles du mode sombre
let darkModeStyle: HTMLStyleElement | null = null

// Fonction pour appliquer les styles
const applyDarkModeStyles = (styles: string) => {
  console.log('[DARK MODE] 🎨 Applying dark mode styles')
  
  // Supprimer l'ancien style s'il existe
  if (darkModeStyle) {
    console.log('[DARK MODE] 🧹 Removing old styles')
    darkModeStyle.remove()
    darkModeStyle = null
  }

  // Créer et ajouter le nouveau style
  darkModeStyle = document.createElement('style')
  darkModeStyle.id = 'dark-mode-content-styles'
  darkModeStyle.textContent = styles
  document.head.appendChild(darkModeStyle)
  console.log('[DARK MODE] ✨ New styles applied')
}

// Fonction pour supprimer les styles
const removeDarkModeStyles = () => {
  console.log('[DARK MODE] 🗑️ Removing dark mode styles')
  if (darkModeStyle) {
    darkModeStyle.remove()
    darkModeStyle = null
  }
}

// Écouter les messages via le bridge
onMessage('APPLY_DARK_MODE', ({ data }) => {
  console.log('[DARK MODE] 📥 Received style update:', data)
  const { styles, isActive } = data as { styles: string; isActive: boolean }
  
  if (isActive) {
    applyDarkModeStyles(styles)
  } else {
    removeDarkModeStyles()
  }
})

// Exporter les fonctions pour les utiliser ailleurs si nécessaire
export {
  applyDarkModeStyles,
  removeDarkModeStyles
} 