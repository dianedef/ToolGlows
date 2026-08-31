const SOFTENED_ATTRIBUTE = 'data-toolglows-soft-light'
const TARGET_SELECTOR = [
  'button', '[role="button"]', 'input', 'select', 'textarea', 'span', 'fieldset', 'dialog',
  'aside', 'section', 'form', '[class*="container"]', '[class*="panel"]',
  '[class*="card"]', '[class*="filter"]', '[class*="compat" i]'
].join(',')

let observer: MutationObserver | null = null
let rescanTimers: number[] = []

function parseRgb(color: string): [number, number, number] | null {
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

export function mapBrightSurfaceColor(color: string): string | null {
  const rgb = parseRgb(color)
  if (!rgb) return null
  const [red, green, blue] = rgb
  const highest = Math.max(red, green, blue)
  const lowest = Math.min(red, green, blue)
  const spread = highest - lowest

  if (green >= 220 && red >= 185 && blue >= 180 && green - red >= 8 && green - blue >= 8) return 'success'
  if (lowest >= 248) return 'surface'
  if (lowest >= 238 && spread <= 14) return 'surface'
  if (lowest >= 221 && spread <= 18) return 'raised'
  if (red >= 235 && green >= 225 && blue >= 195 && red - blue >= 18) return 'warm'
  if (blue >= 235 && red >= 215 && green >= 225 && blue - red >= 12) return 'cool'
  return null
}

export function resolveSoftenedRole(color: string, semanticHint: string, isControl = false): string | null {
  const isSuccess = /compatible|success|valid(?:e|é)?/i.test(semanticHint)
  const role = isSuccess ? 'success' : mapBrightSurfaceColor(color)
  if (!role) return null
  return !isSuccess && isControl ? 'control' : role
}

function isExcluded(element: Element): boolean {
  return element.matches('img, picture, video, canvas, svg, #toolglows-root, #toolglows-root *, [data-toolglows-ui], [data-toolglows-ui] *')
}

function findCompactSuccessTarget(element: HTMLElement): HTMLElement {
  let target = element
  let candidate = element.parentElement
  let depth = 0

  while (candidate && depth < 3 && !candidate.matches('article, section, main, form')) {
    const text = candidate.textContent?.trim() ?? ''
    if (text.length > 40 || !/compatible/i.test(text)) break
    target = candidate
    candidate = candidate.parentElement
    depth += 1
  }

  return target
}

function softenElement(element: Element): void {
  if (!(element instanceof HTMLElement) || isExcluded(element)) return
  const ownText = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent ?? '')
    .join(' ')
  const semanticHint = `${element.getAttribute('aria-label') ?? ''} ${ownText}`
  const role = resolveSoftenedRole(
    getComputedStyle(element).backgroundColor,
    semanticHint,
    element.matches('button, [role="button"], input, select, textarea')
  )
  if (!role) {
    element.removeAttribute(SOFTENED_ATTRIBUTE)
    return
  }

  const target = role === 'success' ? findCompactSuccessTarget(element) : element
  if (target !== element) element.removeAttribute(SOFTENED_ATTRIBUTE)
  target.setAttribute(SOFTENED_ATTRIBUTE, role)
}

function scan(root: ParentNode = document): void {
  if (root instanceof Element && root.matches(TARGET_SELECTOR)) softenElement(root)
  root.querySelectorAll(TARGET_SELECTOR).forEach(softenElement)
}

export function startSofteningBrightSurfaces(): void {
  stopSofteningBrightSurfaces()
  scan()
  observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node instanceof Element) scan(node)
    }))
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  rescanTimers = [250, 1_000, 2_500].map(delay => window.setTimeout(() => scan(), delay))
}

export function stopSofteningBrightSurfaces(): void {
  observer?.disconnect()
  observer = null
  rescanTimers.forEach(timer => window.clearTimeout(timer))
  rescanTimers = []
  document.querySelectorAll<HTMLElement>(`[${SOFTENED_ATTRIBUTE}]`).forEach(element => {
    element.removeAttribute(SOFTENED_ATTRIBUTE)
  })
}
