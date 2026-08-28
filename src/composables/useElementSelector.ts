/**
 * Element Selector Composable
 *
 * Provides a point-and-click interface for selecting DOM elements on a page.
 * Similar to browser DevTools element picker, used for features like:
 * - Element hiding tool
 * - Custom CSS injection targets
 * - Data scraping selectors
 *
 * User experience:
 * 1. Call startSelecting() to enable selection mode
 * 2. Hover over elements to see visual highlight
 * 3. Click to select an element
 * 4. Press Escape to cancel
 *
 * Key features:
 * - Visual feedback with hover and selection states
 * - Excludes extension's own UI elements to prevent conflicts
 * - Preserves and restores original element styles
 * - Non-blocking: Uses event capture to intercept before page handlers
 */
import { ref, onMounted, onUnmounted } from 'vue'

interface ElementSelectorOptions {
  highlightColor?: string
  hoverColor?: string
  excludeSelector?: string  // CSS selector for elements to exclude (e.g., extension UI)
  onElementSelect?: (element: HTMLElement) => void
  onElementHover?: (element: HTMLElement | null) => void
}

export function useElementSelector(options: ElementSelectorOptions = {}) {
  const {
    highlightColor,
    hoverColor,
    excludeSelector = '.toolglows-bar, [data-component="toolglows-tool"]',
    onElementSelect = () => {},
    onElementHover = () => {}
  } = options

  const isActive = ref(false)
  const hoveredElement = ref<HTMLElement | null>(null)
  const highlightedElements = ref<HTMLElement[]>([])

  const resolveToken = (token: string) => {
    const root = document.getElementById('toolglows-root') ?? document.documentElement
    return getComputedStyle(root).getPropertyValue(token).trim()
  }

  /**
   * Checks if element should be excluded from selection
   * Uses both direct match and ancestor check via closest()
   * to prevent selecting extension UI or nested elements within it.
   */
  const isElementExcluded = (element: HTMLElement): boolean => {
    return element.matches(excludeSelector) ||
           element.closest(excludeSelector) !== null
  }

  /**
   * Restores element's original inline styles
   *
   * Why use data attributes: We modify element.style (inline styles) for
   * immediate visual feedback. Must restore original values to avoid
   * permanently breaking page styling. Data attributes provide reliable
   * storage that survives style changes.
   */
  const restoreElementStyle = (element: HTMLElement) => {
    element.style.outline = element.dataset.originalOutline || ''
    element.style.transition = element.dataset.originalTransition || ''
    element.style.backgroundColor = element.dataset.originalBackground || ''
    element.style.cursor = element.dataset.originalCursor || ''
    delete element.dataset.originalOutline
    delete element.dataset.originalTransition
    delete element.dataset.originalBackground
    delete element.dataset.originalCursor
  }

  /**
   * Saves element's current inline styles before modification
   * Stores in data attributes for later restoration
   */
  const saveElementStyle = (element: HTMLElement) => {
    element.dataset.originalOutline = element.style.outline
    element.dataset.originalTransition = element.style.transition
    element.dataset.originalBackground = element.style.backgroundColor
    element.dataset.originalCursor = element.style.cursor
  }

  // Fonction pour appliquer le style de survol à un élément
  const applyHoverStyle = (element: HTMLElement) => {
    element.style.outline = `2px dashed ${resolveToken('--tg-element-outline')}`
    element.style.backgroundColor = hoverColor || resolveToken('--tg-element-hover')
    element.style.transition = 'background-color 0.2s ease-in-out, outline-color 0.2s ease-in-out'
    element.style.cursor = 'pointer'
  }

  // Fonction pour appliquer le style de sélection à un élément
  const applySelectStyle = (element: HTMLElement) => {
    element.style.outline = `2px solid ${resolveToken('--tg-element-outline')}`
    element.style.backgroundColor = highlightColor || resolveToken('--tg-element-selected')
    element.style.transition = 'background-color 0.2s ease-in-out, outline-color 0.2s ease-in-out'
  }

  const handleMouseOver = (event: MouseEvent) => {
    if (!isActive.value) return

    const target = event.target as HTMLElement
    if (!target || isElementExcluded(target)) return

    // Restaurer le style de l'ancien élément survolé
    if (hoveredElement.value && hoveredElement.value !== target) {
      restoreElementStyle(hoveredElement.value)
    }

    // Appliquer le style au nouvel élément
    saveElementStyle(target)
    applyHoverStyle(target)
    hoveredElement.value = target
    onElementHover(target)

    event.stopPropagation()
  }

  const handleMouseOut = (event: MouseEvent) => {
    if (!isActive.value) return

    const target = event.target as HTMLElement
    if (!target || isElementExcluded(target)) return

    // Restaurer le style original
    restoreElementStyle(target)

    if (hoveredElement.value === target) {
      hoveredElement.value = null
      onElementHover(null)
    }

    event.stopPropagation()
  }

  const handleClick = (event: MouseEvent) => {
    if (!isActive.value) return

    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLElement
    if (!target || isElementExcluded(target)) return

    // Appliquer le style de sélection
    applySelectStyle(target)
    onElementSelect(target)
  }

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isActive.value) {
      stopSelecting()
    }
  }

  const startSelecting = () => {
    isActive.value = true
    document.body.style.cursor = 'pointer'
    document.addEventListener('mouseover', handleMouseOver, true)
    document.addEventListener('mouseout', handleMouseOut, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleEscapeKey)
  }

  const stopSelecting = () => {
    isActive.value = false
    document.body.style.cursor = 'default'
    document.removeEventListener('mouseover', handleMouseOver, true)
    document.removeEventListener('mouseout', handleMouseOut, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('keydown', handleEscapeKey)

    // Restaurer tous les styles
    if (hoveredElement.value) {
      restoreElementStyle(hoveredElement.value)
      hoveredElement.value = null
      onElementHover(null)
    }

    highlightedElements.value.forEach(restoreElementStyle)
    highlightedElements.value = []
  }

  onUnmounted(() => {
    stopSelecting()
  })

  return {
    isActive,
    hoveredElement,
    startSelecting,
    stopSelecting
  }
}
