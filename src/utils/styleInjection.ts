/**
 * Injects an external stylesheet via URL
 */
export function injectStylesheet(url: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if style already exists
      if (document.getElementById(id)) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = url

      link.onload = () => resolve()
      link.onerror = (error) => reject(new Error(`Error loading style ${url}: ${error}`))

      document.head.appendChild(link)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Injects inline CSS styles
 */
export function injectStyles(styles: string, id: string): void {
  try {
    // Check if style already exists
    if (document.getElementById(id)) {
      return
    }

    const styleElement = document.createElement('style')
    styleElement.id = id
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  } catch (error) {
    console.error(`[ERROR] Failed to inject styles ${id}:`, error)
    throw error
  }
}