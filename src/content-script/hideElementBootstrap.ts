export interface HideElementBootstrapRecord {
  selector: string
  domain: string
}

export interface HideElementBootstrapState {
  hiddenElements?: unknown
}

export const HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY = 'toolglowsHideElementBootstrap'
export const HIDE_ELEMENT_BOOTSTRAP_CLASS = 'toolglows-early-hidden-element'
export const HIDE_ELEMENT_BOOTSTRAP_STYLE_ID = 'toolglows-hide-element-bootstrap'

let bootstrapGeneration = 0
let bootstrapObserver: MutationObserver | null = null

function normalizeRecords(value: unknown): HideElementBootstrapRecord[] {
  const candidates = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : []

  return candidates.filter((candidate): candidate is HideElementBootstrapRecord => {
    if (!candidate || typeof candidate !== 'object') return false
    const record = candidate as Record<string, unknown>
    return typeof record.selector === 'string' && typeof record.domain === 'string'
  })
}

function ensureBootstrapStyle(): void {
  if (document.getElementById(HIDE_ELEMENT_BOOTSTRAP_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = HIDE_ELEMENT_BOOTSTRAP_STYLE_ID
  style.textContent = `.${HIDE_ELEMENT_BOOTSTRAP_CLASS} { display: none !important; }`
  ;(document.head ?? document.documentElement).append(style)
}

function hideMatchingElements(selectors: string[]): void {
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        element.classList.add(HIDE_ELEMENT_BOOTSTRAP_CLASS)
      })
    } catch (error) {
      console.warn(`[HIDE ELEMENT] Ignoring invalid bootstrap selector "${selector}":`, error)
    }
  })
}

export function retireHideElementBootstrap(): void {
  bootstrapGeneration += 1
  bootstrapObserver?.disconnect()
  bootstrapObserver = null
  document.querySelectorAll(`.${HIDE_ELEMENT_BOOTSTRAP_CLASS}`).forEach(element => {
    element.classList.remove(HIDE_ELEMENT_BOOTSTRAP_CLASS)
  })
  document.getElementById(HIDE_ELEMENT_BOOTSTRAP_STYLE_ID)?.remove()
}

export async function cacheHideElementBootstrap(hiddenElements: unknown): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return
  await chrome.storage.local.set({
    [HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY]: {
      hiddenElements: normalizeRecords(hiddenElements)
    }
  })
}

export async function installHideElementBootstrap(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return
  const installationGeneration = bootstrapGeneration

  try {
    const localState = await chrome.storage.local.get(HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY)
    let cachedState = localState[HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY] as HideElementBootstrapState | undefined

    if (!cachedState && chrome.storage.sync) {
      const syncState = await chrome.storage.sync.get('toolglowsSettings')
      const settings = syncState.toolglowsSettings as { hideElement?: HideElementBootstrapState } | undefined
      cachedState = settings?.hideElement
      if (cachedState) void cacheHideElementBootstrap(cachedState.hiddenElements)
    }

    if (installationGeneration !== bootstrapGeneration) return
    const selectors = normalizeRecords(cachedState?.hiddenElements)
      .filter(record => record.domain === window.location.hostname)
      .map(record => record.selector)
    if (selectors.length === 0) return

    ensureBootstrapStyle()
    hideMatchingElements(selectors)
    bootstrapObserver?.disconnect()
    bootstrapObserver = new MutationObserver(() => hideMatchingElements(selectors))
    bootstrapObserver.observe(document, { childList: true, subtree: true })
  } catch (error) {
    console.warn('[HIDE ELEMENT] Unable to install the pre-render mask:', error)
  }
}
