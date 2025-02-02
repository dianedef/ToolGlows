import { ref, onMounted, onUnmounted } from 'vue'

interface ElementSelectorOptions {
  highlightColor?: string
  hoverColor?: string
  excludeSelector?: string
  onElementSelect?: (element: HTMLElement) => void
  onElementHover?: (element: HTMLElement | null) => void
}

export function useElementSelector(options: ElementSelectorOptions = {}) {
  const {
    highlightColor = 'rgba(255, 0, 0, 0.2)',
    hoverColor = 'rgba(255, 165, 0, 0.3)',
    excludeSelector = '.toolflowz-bar, [data-component="toolflowz-tool"]',
    onElementSelect = () => {},
    onElementHover = () => {}
  } = options

  const isActive = ref(false)
  const hoveredElement = ref<HTMLElement | null>(null)
  const highlightedElements = ref<HTMLElement[]>([])

  // Fonction pour vérifier si un élément doit être exclu
  const isElementExcluded = (element: HTMLElement): boolean => {
    return element.matches(excludeSelector) || 
           element.closest(excludeSelector) !== null
  }

  // Fonction pour restaurer les styles originaux d'un élément
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

  // Fonction pour sauvegarder les styles originaux d'un élément
  const saveElementStyle = (element: HTMLElement) => {
    element.dataset.originalOutline = element.style.outline
    element.dataset.originalTransition = element.style.transition
    element.dataset.originalBackground = element.style.backgroundColor
    element.dataset.originalCursor = element.style.cursor
  }

  // Fonction pour appliquer le style de survol à un élément
  const applyHoverStyle = (element: HTMLElement) => {
    element.style.outline = '2px dashed orange'
    element.style.backgroundColor = hoverColor
    element.style.transition = 'all 0.2s ease-in-out'
    element.style.cursor = 'pointer'
  }

  // Fonction pour appliquer le style de sélection à un élément
  const applySelectStyle = (element: HTMLElement) => {
    element.style.outline = '2px solid red'
    element.style.backgroundColor = highlightColor
    element.style.transition = 'all 0.2s ease-in-out'
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