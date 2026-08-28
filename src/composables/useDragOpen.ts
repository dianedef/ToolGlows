import { ref, computed } from 'vue'
import { bridgeApi, type DragOpenAction } from '@/bridge'
import { elementOutline, resolveDesignToken } from '@/utils/designTokens'

interface DragOpenOptions {
  enabled: boolean
  activationKey: 'shift' | 'alt' | 'ctrl' | 'none'
  mouseButton: 'left' | 'right'
  smartSelect: boolean
  autoScroll: boolean
  scrollSpeed: number
  openDelay: number
  action: 'tabs' | 'window' | 'copy' | 'bookmark' | 'multiple'
  filterInclude: string[]
  filterExclude: string[]
}

interface SelectionBox {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isActive: boolean
}

export function useDragOpen() {
  const options = ref<DragOpenOptions>({
    enabled: true,
    activationKey: 'shift',
    mouseButton: 'left',
    smartSelect: true,
    autoScroll: true,
    scrollSpeed: 15,
    openDelay: 100,
    action: 'tabs',
    filterInclude: [],
    filterExclude: []
  })

  const selection = ref<SelectionBox>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false
  })

  const selectedLinks = ref<HTMLAnchorElement[]>([])
  const isDragging = ref(false)
  const scrollInterval = ref<number | null>(null)

  // Calculer les coordonnées de la boîte de sélection
  const selectionBox = computed(() => {
    const left = Math.min(selection.value.startX, selection.value.currentX)
    const top = Math.min(selection.value.startY, selection.value.currentY)
    const width = Math.abs(selection.value.currentX - selection.value.startX)
    const height = Math.abs(selection.value.currentY - selection.value.startY)

    return { left, top, width, height }
  })

  // Démarrer la sélection
  const startSelection = (event: MouseEvent) => {
    if (!isValidActivation(event)) return

    event.preventDefault()
    selection.value = {
      startX: event.pageX,
      startY: event.pageY,
      currentX: event.pageX,
      currentY: event.pageY,
      isActive: true
    }
    isDragging.value = true
    createSelectionElement()
  }

  // Mettre à jour la sélection
  const updateSelection = (event: MouseEvent) => {
    if (!isDragging.value) return

    selection.value.currentX = event.pageX
    selection.value.currentY = event.pageY
    updateSelectionElement()
    updateSelectedLinks()
    handleAutoScroll(event)
  }

  // Terminer la sélection
  const endSelection = () => {
    if (!isDragging.value) return

    isDragging.value = false
    removeSelectionElement()
    stopAutoScroll()
    processSelectedLinks()
  }

  // Vérifier si l'activation est valide
  const isValidActivation = (event: MouseEvent): boolean => {
    if (!options.value.enabled) return false

    const keyMatch = options.value.activationKey === 'none' ||
      (options.value.activationKey === 'shift' && event.shiftKey) ||
      (options.value.activationKey === 'alt' && event.altKey) ||
      (options.value.activationKey === 'ctrl' && event.ctrlKey)

    const buttonMatch = 
      (options.value.mouseButton === 'left' && event.button === 0) ||
      (options.value.mouseButton === 'right' && event.button === 2)

    return keyMatch && buttonMatch
  }

  // Créer l'élément de sélection visuel
  const createSelectionElement = () => {
    const element = document.createElement('div')
    element.id = 'drag-open-selection'
    element.style.cssText = `
      position: fixed;
      border: ${elementOutline('solid')};
      background: ${resolveDesignToken('--tg-element-hover')};
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(element)
  }

  // Mettre à jour l'élément de sélection
  const updateSelectionElement = () => {
    const element = document.getElementById('drag-open-selection')
    if (!element) return

    const { left, top, width, height } = selectionBox.value
    element.style.left = `${left}px`
    element.style.top = `${top}px`
    element.style.width = `${width}px`
    element.style.height = `${height}px`
  }

  // Supprimer l'élément de sélection
  const removeSelectionElement = () => {
    document.getElementById('drag-open-selection')?.remove()
  }

  // Gérer le défilement automatique
  const handleAutoScroll = (event: MouseEvent) => {
    if (!options.value.autoScroll) return

    const scrollThreshold = 50
    const viewportHeight = window.innerHeight
    const mouseY = event.clientY

    if (mouseY < scrollThreshold) {
      startAutoScroll('up')
    } else if (mouseY > viewportHeight - scrollThreshold) {
      startAutoScroll('down')
    } else {
      stopAutoScroll()
    }
  }

  // Démarrer le défilement automatique
  const startAutoScroll = (direction: 'up' | 'down') => {
    if (scrollInterval.value) return

    scrollInterval.value = window.setInterval(() => {
      window.scrollBy(0, direction === 'up' ? 
        -options.value.scrollSpeed : 
        options.value.scrollSpeed
      )
      updateSelectedLinks()
    }, 16)
  }

  // Arrêter le défilement automatique
  const stopAutoScroll = () => {
    if (scrollInterval.value) {
      clearInterval(scrollInterval.value)
      scrollInterval.value = null
    }
  }

  // Mettre à jour les liens sélectionnés
  const updateSelectedLinks = () => {
    const links = document.querySelectorAll('a')
    const { left, top, width, height } = selectionBox.value

    selectedLinks.value = Array.from(links).filter(link => {
      const rect = link.getBoundingClientRect()
      const isInBox = 
        rect.left >= left &&
        rect.right <= left + width &&
        rect.top >= top &&
        rect.bottom <= top + height

      if (!isInBox) return false

      if (options.value.smartSelect) {
        // Exclure les liens de navigation, footer, etc.
        const isNavLink = link.closest('nav, footer, header')
        if (isNavLink) return false
      }

      // Appliquer les filtres
      const url = link.href.toLowerCase()
      const hasIncluded = options.value.filterInclude.length === 0 ||
        options.value.filterInclude.some(term => url.includes(term.toLowerCase()))
      const hasExcluded = options.value.filterExclude.some(term => 
        url.includes(term.toLowerCase())
      )

      return hasIncluded && !hasExcluded
    })
  }

  // Traiter les liens sélectionnés
  const processSelectedLinks = async () => {
    if (selectedLinks.value.length === 0) return

    switch (options.value.action) {
      case 'tabs':
        await openInTabs()
        break
      case 'window':
        await openInWindow()
        break
      case 'copy':
        await copyToClipboard()
        break
      case 'bookmark':
        await saveAsBookmarks()
        break
      case 'multiple':
        showActionMenu()
        break
    }
  }

  // Ouvrir dans de nouveaux onglets
  const openInTabs = async () => {
    await performPrivilegedAction('tabs')
  }

  // Ouvrir dans une nouvelle fenêtre
  const openInWindow = async () => {
    await performPrivilegedAction('window')
  }

  // Copier dans le presse-papiers
  const copyToClipboard = async () => {
    const text = selectedLinks.value
      .map(link => `${link.textContent} - ${link.href}`)
      .join('\n')
    await navigator.clipboard.writeText(text)
  }

  // Sauvegarder comme favoris
  const saveAsBookmarks = async () => {
    await performPrivilegedAction('bookmark')
  }

  const performPrivilegedAction = async (action: DragOpenAction) => {
    await bridgeApi.performDragOpenAction(
      action,
      selectedLinks.value.map(link => ({
        title: link.textContent?.trim() || link.href,
        url: link.href
      })),
      options.value.openDelay
    )
  }

  // Afficher le menu d'actions
  const showActionMenu = () => {
    // À implémenter : menu contextuel avec toutes les actions
  }

  // Initialisation
  const init = () => {
    document.addEventListener('mousedown', startSelection)
    document.addEventListener('mousemove', updateSelection)
    document.addEventListener('mouseup', endSelection)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') endSelection()
    })

    return () => {
      document.removeEventListener('mousedown', startSelection)
      document.removeEventListener('mousemove', updateSelection)
      document.removeEventListener('mouseup', endSelection)
      stopAutoScroll()
    }
  }

  return {
    options,
    selectedLinks,
    isDragging,
    init
  }
}
