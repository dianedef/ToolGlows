/**
 * DOM-only consent automation, inspired by CommunityGlows 4624351's CMP selectors.
 * Deliberately excludes its generic text clicks, cookie writes and WebView workarounds.
 * Unsupported banners, frames and closed shadow trees are left to the user.
 */
interface CmpRule {
  root?: string
  button: string
  label?: RegExp
  shadowHost?: string
}

const COMMON_ACCEPT_LABEL =
  /^(accept( all( cookies?)?)?|accept cookies on this browser|agree|agree and proceed|tout accepter|accepter tout|accepter( tout(es)?( les cookies?)?)?|tout autoriser|autoriser( tous?( les cookies?)?)?|allow( all( cookies?)?)?|j’accepte|j'accepte|confirm all|allow all)$/i

const RULES: readonly CmpRule[] = [
  // OneTrust & Cookiebot
  {
    root: '#onetrust-banner-sdk',
    button: '#onetrust-accept-btn-handler, #accept-recommended-btn-handler, .onetrust-accept-btn-handler'
  },
  {
    root: '#CybotCookiebotDialog',
    button:
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, #CybotCookiebotDialogBodyButtonAccept, #CybotCookiebotDialogBodyLevelButtonAccept'
  },
  // Didomi
  {
    root: '#didomi-notice',
    button: '#didomi-notice-agree-button, #didomi-notice-learn-more-button ~ button'
  },
  // Quantcast
  {
    root: '.qc-cmp2-container',
    button: '.qc-cmp2-summary-buttons button[mode="primary"], .qc-cmp2-summary-buttons button:first-child',
    label: COMMON_ACCEPT_LABEL
  },
  // Axeptio
  {
    button: '#axeptio_btn_acceptAll, [id="axeptio_btn_acceptAll"]'
  },
  // SourcePoint (used by major media/news sites)
  {
    button: '.sp_choice_type_11, button.sp_choice_type_11'
  },
  // Google / YouTube
  {
    button: '#L2AGLb, .tOjcNe'
  },
  // Meta / Facebook / Instagram
  {
    button:
      '[data-cookiebanner="accept_button"], [data-testid="cookie-policy-manage-dialog-accept-button"], [data-testid="GDPR-accept"]'
  },
  // TikTok (standard elements & shadow DOM host)
  {
    button: '[data-e2e="cookie-banner-accept"], .tiktok-cookie-banner button:last-child'
  },
  {
    shadowHost: 'tiktok-cookie-banner',
    button: 'button',
    label: COMMON_ACCEPT_LABEL
  },
  // Generic standard consent attributes
  {
    button: '[data-consent="accept"], [aria-label="Accept all" i], [aria-label="Tout accepter" i], [aria-label="Allow all cookies" i]'
  }
] as const

const SCAN_DELAY_MS = 150
const WATCH_MS = 60_000
const MAX_ACTIONS = 4

function canClick(button: Element, document: Document): button is HTMLElement {
  const view = document.defaultView
  if (!view || !(button instanceof view.HTMLElement) || !button.isConnected) return false
  if (!button.matches('button, a, input[type="button"], input[type="submit"], [role="button"]')) return false
  if (button.closest('#toolglows-root') || button.matches(':disabled')) return false

  for (let node: Element | null = button; node; node = node.parentElement) {
    if (
      node.hasAttribute('hidden') ||
      node.hasAttribute('inert') ||
      node.getAttribute('aria-hidden') === 'true' ||
      node.getAttribute('aria-disabled') === 'true'
    ) return false

    const style = view.getComputedStyle(node)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0' ||
      style.pointerEvents === 'none'
    ) return false
  }

  return Array.from(button.getClientRects()).some(rect => rect.width > 0 && rect.height > 0)
}

/** Robust click: dispatch PointerEvents (for React/Vue event listeners) then native click */
function robustClick(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  try {
    const opts: PointerEventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1 }
    element.dispatchEvent(new PointerEvent('pointerdown', opts))
    element.dispatchEvent(new PointerEvent('pointerup', opts))
  } catch {
    // fallback if PointerEvent creation fails
  }
  element.click()
}

/** Start a bounded observer in one document. The caller owns user consent and site exclusions. */
export function startCookieConsent(document: Document): () => void {
  const view = document.defaultView
  if (!view || !document.documentElement) return () => {}

  const clicked = new WeakSet<Element>()
  let actions = 0
  let stopped = false
  let pending: number | undefined
  let expiry: number | undefined

  const observer = new view.MutationObserver(() => {
    if (!stopped && pending === undefined) pending = view.setTimeout(scan, SCAN_DELAY_MS)
  })

  function stop() {
    stopped = true
    observer.disconnect()
    if (pending !== undefined) view!.clearTimeout(pending)
    if (expiry !== undefined) view!.clearTimeout(expiry)
    pending = undefined
    view!.removeEventListener('pagehide', stop)
  }

  function scan() {
    pending = undefined
    if (stopped) return

    for (const rule of RULES) {
      // 1. Shadow DOM handling (e.g. TikTok)
      if (rule.shadowHost) {
        for (const host of Array.from(document.querySelectorAll(rule.shadowHost))) {
          const shadow = host.shadowRoot
          if (!shadow) continue
          const buttons = Array.from(shadow.querySelectorAll(rule.button))
          for (const button of buttons) {
            if (clicked.has(button) || !canClick(button, document)) continue
            if (rule.label && !rule.label.test((button.textContent ?? '').trim().replace(/\s+/g, ' '))) continue
            clicked.add(button)
            actions += 1
            robustClick(button)
            if (stopped || actions >= MAX_ACTIONS) {
              stop()
              return
            }
            return
          }
        }
        continue
      }

      // 2. Standard DOM root or document-level query
      const roots: (Document | Element)[] = rule.root
        ? Array.from(document.querySelectorAll(rule.root))
        : [document]

      for (const root of roots) {
        for (const button of Array.from(root.querySelectorAll(rule.button))) {
          if (clicked.has(button) || !canClick(button, document)) continue
          if (rule.label && !rule.label.test((button.textContent ?? '').trim().replace(/\s+/g, ' '))) continue

          clicked.add(button)
          actions += 1
          robustClick(button)
          if (stopped || actions >= MAX_ACTIONS) {
            stop()
            return
          }
          return
        }
      }
    }
  }

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'disabled', 'aria-hidden', 'aria-disabled', 'inert']
  })

  expiry = view.setTimeout(stop, WATCH_MS)
  view.addEventListener('pagehide', stop, { once: true })
  scan()

  return stop
}
