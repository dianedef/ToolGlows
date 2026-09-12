import { createScheduledDomScan } from './scheduledDomScan'

const CONTRAST_REPAIR_ATTRIBUTE = 'data-toolglows-contrast-repair'
const MINIMUM_TEXT_CONTRAST = 4.5
const EXCLUDED_ANCESTORS = [
  '#toolglows-root',
  '[data-toolglows-ui]',
  'svg',
  'canvas',
  'img',
  'picture',
  'video',
  'script',
  'style',
  'noscript'
].join(', ')
const DARK_READER_UPDATE_EVENTS = [
  '__darkreader__updateSheet',
  '__darkreader__adoptedStyleSheetsChange',
  '__darkreader__adoptedStyleSheetChange',
  '__darkreader__adoptedStyleDeclarationChange'
] as const

type Rgba = [number, number, number, number]

interface PreviousInlineColor {
  value: string
  priority: string
}

let observer: MutationObserver | null = null


let rescanTimers: number[] = []
let activeTextColor = ''
let activeLinkColor = ''
let activeCanvasColor = ''
const repairedElements = new Set<HTMLElement>()
const previousInlineColors = new WeakMap<HTMLElement, PreviousInlineColor>()

export function parseCssColor(value: string): Rgba | null {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    return [
      Number.parseInt(hex[1].slice(0, 2), 16),
      Number.parseInt(hex[1].slice(2, 4), 16),
      Number.parseInt(hex[1].slice(4, 6), 16),
      1
    ]
  }

  const rgb = value.trim().match(/^rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i)
  if (!rgb) return null
  const alpha = rgb[4]?.endsWith('%')
    ? Number.parseFloat(rgb[4]) / 100
    : Number.parseFloat(rgb[4] ?? '1')
  return [
    Math.min(255, Math.max(0, Number.parseFloat(rgb[1]))),
    Math.min(255, Math.max(0, Number.parseFloat(rgb[2]))),
    Math.min(255, Math.max(0, Number.parseFloat(rgb[3]))),
    Math.min(1, Math.max(0, alpha))
  ]
}

function composite(over: Rgba, under: Rgba): Rgba {
  const alpha = over[3] + under[3] * (1 - over[3])
  if (alpha === 0) return [0, 0, 0, 0]
  return [
    (over[0] * over[3] + under[0] * under[3] * (1 - over[3])) / alpha,
    (over[1] * over[3] + under[1] * under[3] * (1 - over[3])) / alpha,
    (over[2] * over[3] + under[2] * under[3] * (1 - over[3])) / alpha,
    alpha
  ]
}

function luminance(color: Rgba): number {
  const [red, green, blue] = color.slice(0, 3).map(channel => {
    const normalized = channel / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function cssContrastRatio(foreground: string, background: string): number {
  const parsedBackground = parseCssColor(background)
  const parsedForeground = parseCssColor(foreground)
  if (!parsedBackground || !parsedForeground) return 1
  const opaqueBackground = composite(parsedBackground, [255, 255, 255, 1])
  const opaqueForeground = composite(parsedForeground, opaqueBackground)
  const lighter = Math.max(luminance(opaqueForeground), luminance(opaqueBackground))
  const darker = Math.min(luminance(opaqueForeground), luminance(opaqueBackground))
  return (lighter + 0.05) / (darker + 0.05)
}

export function selectReadableCssColor(preferred: string, background: string): string {
  if (cssContrastRatio(preferred, background) >= MINIMUM_TEXT_CONTRAST) return preferred
  const target = cssContrastRatio('#ffffff', background) >= cssContrastRatio('#000000', background)
    ? '#ffffff'
    : '#000000'
  const source = parseCssColor(preferred)
  const destination = parseCssColor(target)
  if (!source || !destination || source[3] < 0.05) return target

  let low = 0
  let high = 1
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const amount = (low + high) / 2
    const mixed = `rgb(${Math.round(source[0] + (destination[0] - source[0]) * amount)}, ${Math.round(source[1] + (destination[1] - source[1]) * amount)}, ${Math.round(source[2] + (destination[2] - source[2]) * amount)})`
    if (cssContrastRatio(mixed, background) >= MINIMUM_TEXT_CONTRAST) high = amount
    else low = amount
  }
  return `rgb(${Math.round(source[0] + (destination[0] - source[0]) * high)}, ${Math.round(source[1] + (destination[1] - source[1]) * high)}, ${Math.round(source[2] + (destination[2] - source[2]) * high)})`
}

function resolveVisibleBackground(element: HTMLElement, backgrounds: Map<HTMLElement, Rgba | null>): string {
  let accumulated: Rgba = [0, 0, 0, 0]
  let current: HTMLElement | null = element
  while (current && accumulated[3] < 0.999) {
    if (!backgrounds.has(current)) {
      backgrounds.set(current, parseCssColor(getComputedStyle(current).backgroundColor))
    }
    const background = backgrounds.get(current)
    if (background) accumulated = composite(accumulated, background)
    current = current.parentElement
  }
  const fallback = parseCssColor(activeCanvasColor) ?? [255, 255, 255, 1]
  const resolved = composite(accumulated, fallback)
  return `rgb(${Math.round(resolved[0])}, ${Math.round(resolved[1])}, ${Math.round(resolved[2])})`
}

function isTextOwner(element: HTMLElement): boolean {
  if (element.closest(EXCLUDED_ANCESTORS)) return false
  if (element.matches('input, textarea, select, option, button, [role="button"]')) return true
  return Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
}

function restoreInlineColor(element: HTMLElement): void {
  const previous = previousInlineColors.get(element)
  if (previous?.value) element.style.setProperty('color', previous.value, previous.priority)
  else element.style.removeProperty('color')
  element.removeAttribute(CONTRAST_REPAIR_ATTRIBUTE)
  repairedElements.delete(element)
}

function planRepair(element: HTMLElement, backgrounds: Map<HTMLElement, Rgba | null>): (() => void) | undefined {
  const wasRepaired = repairedElements.has(element)
  if (!isTextOwner(element)) {
    return wasRepaired ? () => restoreInlineColor(element) : undefined
  }

  const style = getComputedStyle(element)
  if (style.visibility === 'hidden' || style.display === 'none' || Number.parseFloat(style.opacity) === 0) {
    return wasRepaired ? () => restoreInlineColor(element) : undefined
  }
  const background = resolveVisibleBackground(element, backgrounds)
  if (cssContrastRatio(style.color, background) >= MINIMUM_TEXT_CONTRAST) return

  if (!wasRepaired) {
    previousInlineColors.set(element, {
      value: element.style.getPropertyValue('color'),
      priority: element.style.getPropertyPriority('color')
    })
  }
  const parsedCurrentColor = parseCssColor(style.color)
  const preferred = parsedCurrentColor && parsedCurrentColor[3] >= 0.05
    ? style.color
    : element.closest('a') ? activeLinkColor : activeTextColor
  const color = selectReadableCssColor(preferred, background)
  return () => {
    element.style.setProperty('color', color, 'important')
    element.setAttribute(CONTRAST_REPAIR_ATTRIBUTE, '')
    repairedElements.add(element)
  }
}

const repairScan = createScheduledDomScan('*', () => {
  const backgrounds = new Map<HTMLElement, Rgba | null>()
  return element => element instanceof HTMLElement ? planRepair(element, backgrounds) : undefined
})

function scheduleRepair(nodes: ParentNode[]): void {
  nodes.forEach(node => repairScan.enqueue(node))
}
function scheduleFullRepair(): void {
  scheduleRepair([document.body ?? document.documentElement])
}

export function startContrastRepair(textColor: string, linkColor: string, canvasColor: string): void {
  if (
    observer
    && activeTextColor === textColor
    && activeLinkColor === linkColor
    && activeCanvasColor === canvasColor
  ) return
  stopContrastRepair()
  activeTextColor = textColor
  activeLinkColor = linkColor
  activeCanvasColor = canvasColor
  scheduleFullRepair()

  observer = new MutationObserver(records => {
    const darkReaderStyleChanged = records.some(record => {
      const target = record.target instanceof Element ? record.target : record.target.parentElement
      return Boolean(target?.closest('style.darkreader'))
    })
    if (darkReaderStyleChanged) {
      scheduleRepair([document.body])
      return
    }
    const roots = records.flatMap(record => record.type === 'attributes'
      ? [record.target]
      : Array.from(record.addedNodes))
      .filter((node): node is ParentNode => node instanceof HTMLElement || node instanceof DocumentFragment)
    if (roots.length > 0) scheduleRepair(roots)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
    characterData: true,
    childList: true,
    subtree: true
  })
  DARK_READER_UPDATE_EVENTS.forEach(eventName => {
    document.addEventListener(eventName, scheduleFullRepair, true)
  })
  rescanTimers = [100, 400, 1_200, 2_500].map(delay => window.setTimeout(scheduleFullRepair, delay))
}

export function stopContrastRepair(): void {
  observer?.disconnect()
  observer = null
  DARK_READER_UPDATE_EVENTS.forEach(eventName => {
    document.removeEventListener(eventName, scheduleFullRepair, true)
  })
  repairScan.cancel()
  rescanTimers.forEach(timer => window.clearTimeout(timer))
  rescanTimers = []
  repairedElements.forEach(restoreInlineColor)
  repairedElements.clear()
  activeTextColor = ''
  activeLinkColor = ''
  activeCanvasColor = ''
}
