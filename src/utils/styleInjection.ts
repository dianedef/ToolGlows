/**
 * Injecte une feuille de style externe via une URL
 */
export function injectStylesheet(url: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Vérifie si le style existe déjà
      if (document.getElementById(id)) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = url

      link.onload = () => resolve()
      link.onerror = (error) => reject(new Error(`Erreur lors du chargement du style ${url}: ${error}`))

      document.head.appendChild(link)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Injecte des styles CSS inline
 */
export function injectStyles(styles: string, id: string): void {
  try {
    // Vérifie si le style existe déjà
    if (document.getElementById(id)) {
      return
    }

    const styleElement = document.createElement('style')
    styleElement.id = id
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  } catch (error) {
    console.error(`❌ Erreur lors de l'injection des styles ${id}:`, error)
    throw error
  }
} 