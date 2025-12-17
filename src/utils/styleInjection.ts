/**
 * Style Injection Utilities
 * 
 * Provides safe CSS injection for content scripts. Content scripts share
 * the page's DOM but have isolated JavaScript contexts. These utilities
 * inject styles into the shared DOM while preventing conflicts.
 */

/**
 * Injects External Stylesheet from CDN or URL
 * 
 * Used for loading third-party libraries (PrimeVue, PrimeIcons) without
 * bundling them. This reduces extension package size and leverages browser
 * caching if the user has visited other sites using these libraries.
 * 
 * @param url - Full URL to the stylesheet
 * @param id - Unique identifier to prevent duplicate injection
 * @returns Promise that resolves when stylesheet loads
 * 
 * Design decisions:
 * - Uses <link> tag for proper browser caching and parallel loading
 * - Idempotent: Safe to call multiple times with same id
 * - Promise-based: Caller can wait for styles before rendering UI
 */
export function injectStylesheet(url: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Idempotency check: avoid duplicate injections
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
 * Injects Inline CSS Styles
 * 
 * Used for bundled extension styles (Vite processed with ?inline import).
 * Inline styles provide:
 * - Instant availability (no network request)
 * - Guaranteed presence even if CDN fails
 * - Version lock with extension code
 * 
 * @param styles - CSS content as string
 * @param id - Unique identifier to prevent duplicate injection
 * 
 * Why inline over <link>: Extension styles are small and must be
 * immediately available for proper UI rendering. Network delays for
 * external files would cause visible layout shifts.
 */
export function injectStyles(styles: string, id: string): void {
  try {
    // Idempotency check
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