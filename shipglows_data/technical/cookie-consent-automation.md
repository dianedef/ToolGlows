# Cookie consent automation

Owner: ToolGlows. Decision approved in conversation on 2026-09-06: optional automatic acceptance, reusable engine, integration only in ToolGlows.

## Behavior and boundaries

The toolbar's “Acceptation des cookies” panel offers explicit opt-in to clicking “accept all”, including advertising and analytics cookies. Automation is off by default, independently of toolbar registration. Preferences live in `chrome.storage.local` under `toolglowsCookieConsent` and are shared across tabs in this browser, not synced to other devices. Exact-host exclusions can be added for the current page or removed from the panel. Turning off automation does not revoke consent already recorded by a site.

The DOM-only engine in `src/features/cookieConsent/engine.ts` takes a Document and returns a cleanup function. It imports no browser extension or Vue APIs, so CommunityGlows can reuse it through a separately reviewed adapter. Selector provenance: CommunityGlows commit `4624351`, NativeWebViewPlugin.kt. No dependency or shared-package infrastructure is introduced.

Supported rules: OneTrust, Cookiebot, Didomi, and Quantcast (explicit French/English acceptance labels for Quantcast). Only visible enabled interactive controls inside the recognized CMP root are eligible. There is no generic “Accept” text scan, cookie inspection/write, fingerprint spoofing, anti-bot bypass, or remote rule download. Existing storage and content-script permissions suffice; no new permissions or bridge messages.

Runs in the top-level document for 60 seconds after activation/navigation, throttled to 250 ms with a maximum of four clicks and one click per element. Unsupported banners, embedded frames, closed/open shadow trees, and banners arriving after the window remain manual. Pagehide, content cleanup, disable, and exclusion stop observation; BFCache restoration reinstalls the browser adapter. Clicks are not proof of saved consent or blocked tracking. A page can change its DOM; rules require maintenance.

## Legal/product claim boundary

An explicit opt-in to automation is not a certification of valid consent for every site's processing. No store approval or legal compliance is claimed. Public-release review must assess the precise behavior and disclosures; CommunityGlows' prior removal is not reversed by this implementation.

## Verification

Current evidence, 2026-09-06: packaged Chromium UI opt-in, off-by-default, persisted exclusion after reload and live cross-context updates passed. Real OneTrust and Cookiebot pages each displayed a recognized banner with automation off, then the banner disappeared after opt-in (466 ms and 582 ms respectively on the first run). This verifies observed disappearance, not legally valid or persisted consent. Live Firefox proof remains unavailable on this host (no installed Firefox in the standard program location).

Typecheck passed. Full test suite passed: 53 files, 277 tests using `pnpm exec vitest run --maxWorkers=2`; the default worker run encountered worker-start timeouts on this host. Final Chrome and Firefox builds passed, including the UI retry and spacing changes. Final packaged Chrome fixture passed with the toolbar pinned to prevent hover collapse during automation; desktop and narrow viewport screenshots were inspected. Initial Firefox manifest lint: zero errors, eleven broad-bundle warnings (including unsupported shadow-root API and dynamic innerHTML assignments outside this engine).

Focused tests: `tests/cookie-consent-engine.test.ts`, `tests/cookie-consent-runtime.test.ts`.
Final Firefox manifest lint also passed with zero errors and the same eleven warnings.
Packaged Chrome proof: `node tests/cookie-consent-chrome-browser.mjs` uses a disposable isolated Chromium profile, deterministic fixtures, UI opt-in and exact-host exclusions, then attempts real-site banners. It prints incomplete site proof explicitly and stores screenshots under `.playwright-mcp/cookie-consent/`. No personal browser profile is used. Firefox build/manifest checks are separate from live Firefox proof.

## Toolbar and first use

Left click toggles the persisted global enabled preference; right click or Shift+F10 opens settings without changing it. A first-use introduction explains advertising/audience cookies before explicit activation. Skip-all never enables cookie acceptance. The toolbar icon reflects enabled state; its title identifies an excluded current host. Host exceptions survive toggles and browser restarts. Help remains accessible from toolbar settings. Turning the feature off does not revoke past consent.
