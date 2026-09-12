export const COOKIE_CONSENT_KEY = 'toolglowsCookieConsent'

export interface CookieConsentPreferences {
  enabled: boolean
  excludedHosts: string[]
}

export function normalizeCookiePreferences(value: unknown): CookieConsentPreferences {
  const input = value as Partial<CookieConsentPreferences> | null
  return {
    enabled: input?.enabled === true,
    excludedHosts: Array.isArray(input?.excludedHosts)
      ? [...new Set(input.excludedHosts.filter((host): host is string =>
        typeof host === 'string' && host.length <= 253 && /^[a-z0-9.-]+$/i.test(host)
      ).map(host => host.toLowerCase()))].slice(0, 500)
      : []
  }
}

export function shouldAcceptCookies(value: unknown, url: string): boolean {
  const preferences = normalizeCookiePreferences(value)
  try {
    const page = new URL(url)
    return preferences.enabled && /^https?:$/.test(page.protocol) &&
      !preferences.excludedHosts.includes(page.hostname)
  } catch {
    return false
  }
}
