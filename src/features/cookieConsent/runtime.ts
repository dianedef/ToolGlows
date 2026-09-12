import { startCookieConsent } from './engine'
import { COOKIE_CONSENT_KEY, shouldAcceptCookies } from './preferences'

/** Browser adapter. Consent is local to this browser and independent of toolbar visibility. */
export function installCookieConsentRuntime(doc: Document, storage = chrome.storage): () => void {
  let stopEngine: (() => void) | undefined
  let disposed = false
  let revision = 0
  let active = false

  const apply = (value: unknown) => {
    if (disposed) return
    const enabled = shouldAcceptCookies(value, doc.URL)
    if (active === enabled) return
    active = enabled
    stopEngine?.()
    stopEngine = enabled ? startCookieConsent(doc) : undefined
  }
  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local' || !(COOKIE_CONSENT_KEY in changes)) return
    revision++
    apply(changes[COOKIE_CONSENT_KEY].newValue)
  }
  storage.onChanged.addListener(onChanged)
  const initialRevision = revision
  void storage.local.get(COOKIE_CONSENT_KEY).then(result => {
    if (revision === initialRevision) apply(result[COOKIE_CONSENT_KEY])
  }).catch(() => { if (revision === initialRevision) apply(undefined) })

  return () => {
    disposed = true
    stopEngine?.()
    storage.onChanged.removeListener(onChanged)
  }
}
