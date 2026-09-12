/**
 * DOM-only consent automation, inspired by CommunityGlows 4624351's CMP selectors.
 * Deliberately excludes its generic text clicks, cookie writes and WebView workarounds.
 * Unsupported banners, frames and closed shadow trees are left to the user.
 */
const RULES = [
  { root: "#onetrust-banner-sdk", button: "#onetrust-accept-btn-handler" },
  {
    root: "#CybotCookiebotDialog",
    button:
      "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, #CybotCookiebotDialogBodyButtonAccept",
  },
  { root: "#didomi-notice", button: "#didomi-notice-agree-button" },
  {
    root: ".qc-cmp2-container",
    button: '.qc-cmp2-summary-buttons button[mode="primary"]',
    label:
      /^(accept all|agree|agree and proceed|tout accepter|accepter tout|j’accepte|j'accepte)$/i,
  },
] as const

const SCAN_DELAY_MS = 250
const WATCH_MS = 60_000
const MAX_ACTIONS = 4

function canClick(button: Element, document: Document): button is HTMLElement {
  const view = document.defaultView
  if (!view || !(button instanceof view.HTMLElement) || !button.isConnected)
    return false
  if (
    !button.matches(
      'button, input[type="button"], input[type="submit"], [role="button"]',
    )
  )
    return false
  if (button.closest("#toolglows-root") || button.matches(":disabled"))
    return false
  for (let node: Element | null = button; node; node = node.parentElement) {
    if (
      node.hasAttribute("hidden") ||
      node.hasAttribute("inert") ||
      node.getAttribute("aria-hidden") === "true" ||
      node.getAttribute("aria-disabled") === "true"
    )
      return false
    const style = view.getComputedStyle(node)
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      style.opacity === "0" ||
      style.pointerEvents === "none"
    )
      return false
  }
  return Array.from(button.getClientRects()).some(
    (rect) => rect.width > 0 && rect.height > 0,
  )
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
    if (!stopped && pending === undefined)
      pending = view.setTimeout(scan, SCAN_DELAY_MS)
  })
  function stop() {
    stopped = true
    observer.disconnect()
    if (pending !== undefined) view!.clearTimeout(pending)
    if (expiry !== undefined) view!.clearTimeout(expiry)
    pending = undefined
    view!.removeEventListener("pagehide", stop)
  }
  function scan() {
    pending = undefined
    if (stopped) return
    for (const rule of RULES) {
      for (const root of Array.from(document.querySelectorAll(rule.root))) {
        for (const button of Array.from(root.querySelectorAll(rule.button))) {
          if (clicked.has(button) || !canClick(button, document)) continue
          if (
            "label" in rule &&
            !rule.label.test(
              (button.textContent ?? "").trim().replace(/\s+/g, " "),
            )
          )
            continue
          clicked.add(button)
          actions += 1
          button.click()
          if (stopped || actions >= MAX_ACTIONS) {
            stop()
            return
          }
          // Only one action per scan; allow the CMP to update before trying another banner.
          return
        }
      }
    }
  }
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "hidden",
      "disabled",
      "aria-hidden",
      "aria-disabled",
      "inert",
    ],
  })
  expiry = view.setTimeout(stop, WATCH_MS)
  view.addEventListener("pagehide", stop, { once: true })
  scan()
  return stop
}
