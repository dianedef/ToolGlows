const EXACT_TEXT_ATTRIBUTE = 'data-toolglows-exact-text'
const EXACT_LINK_ATTRIBUTE = 'data-toolglows-exact-link'
const EXCLUDED_TEXT_ANCESTORS = [
  '#toolglows-root',
  '[data-toolglows-ui]',
  'a',
  'svg',
  'canvas',
  'img',
  'picture',
  'video',
  'script',
  'style',
  'noscript'
].join(', ')

interface PreviousInlineColor {
  value: string
  priority: string
}

let exactTextObserver: MutationObserver | null = null
let pendingFrame: number | null = null
let activeTextColor = ''
let activeLinkColor = ''
const styledElements = new Set<HTMLElement>()
const previousInlineColors = new WeakMap<HTMLElement, PreviousInlineColor>()

function serializeCssColor(color: string): string {
  const style = document.createElement('span').style
  style.color = color
  return style.color
}

function isTextOwner(element: HTMLElement): boolean {
  if (element.closest(EXCLUDED_TEXT_ANCESTORS)) return false
  if (element.matches('input, textarea, select, option')) return true
  return Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
}

function applyExactColor(element: HTMLElement): void {
  if (!activeTextColor || !isTextOwner(element)) return
  if (!styledElements.has(element)) {
    previousInlineColors.set(element, {
      value: element.style.getPropertyValue('color'),
      priority: element.style.getPropertyPriority('color')
    })
    styledElements.add(element)
    element.setAttribute(EXACT_TEXT_ATTRIBUTE, '')
  }
  if (element.style.getPropertyValue('color') !== activeTextColor || element.style.getPropertyPriority('color') !== 'important') {
    element.style.setProperty('color', activeTextColor, 'important')
  }
}

function applyExactLink(element: HTMLAnchorElement): void {
  if (!activeLinkColor || element.closest('#toolglows-root, [data-toolglows-ui]')) return
  if (!styledElements.has(element)) {
    previousInlineColors.set(element, {
      value: element.style.getPropertyValue('color'),
      priority: element.style.getPropertyPriority('color')
    })
    styledElements.add(element)
    element.setAttribute(EXACT_LINK_ATTRIBUTE, '')
  }
  if (element.style.getPropertyValue('color') !== activeLinkColor || element.style.getPropertyPriority('color') !== 'important') {
    element.style.setProperty('color', activeLinkColor, 'important')
  }
}

function applyWithin(root: Node): void {
  if (root instanceof HTMLAnchorElement) applyExactLink(root)
  else if (root instanceof HTMLElement) applyExactColor(root)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let textNode = walker.nextNode()
  while (textNode) {
    const parent = textNode.parentElement
    if (parent instanceof HTMLElement && textNode.textContent?.trim()) applyExactColor(parent)
    textNode = walker.nextNode()
  }
  if (root instanceof Document || root instanceof DocumentFragment || root instanceof HTMLElement) {
    root.querySelectorAll<HTMLElement>('input, textarea, select, option').forEach(applyExactColor)
    root.querySelectorAll<HTMLAnchorElement>('a').forEach(applyExactLink)
  }
}

function scheduleApply(nodes: Node[]): void {
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame)
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null
    nodes.forEach(applyWithin)
  })
}

export function startExactTextColors(textColor: string, linkColor: string): void {
  activeTextColor = serializeCssColor(textColor)
  activeLinkColor = serializeCssColor(linkColor)
  styledElements.forEach(element => {
    if (element instanceof HTMLAnchorElement) applyExactLink(element)
    else applyExactColor(element)
  })
  applyWithin(document.body ?? document.documentElement)

  if (exactTextObserver) return
  exactTextObserver = new MutationObserver(mutations => {
    const nodes = mutations.flatMap(mutation => mutation.type === 'attributes'
      ? [mutation.target]
      : Array.from(mutation.addedNodes))
    if (nodes.length > 0) scheduleApply(nodes)
  })
  exactTextObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true
  })
}

export function stopExactTextColors(): void {
  exactTextObserver?.disconnect()
  exactTextObserver = null
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame)
  pendingFrame = null
  activeTextColor = ''
  activeLinkColor = ''

  styledElements.forEach(element => {
    const previous = previousInlineColors.get(element)
    if (previous?.value) element.style.setProperty('color', previous.value, previous.priority)
    else element.style.removeProperty('color')
    element.removeAttribute(EXACT_TEXT_ATTRIBUTE)
    element.removeAttribute(EXACT_LINK_ATTRIBUTE)
  })
  styledElements.clear()
}
