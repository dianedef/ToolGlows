# DarkReader 4.9.128

`darkreader@4.9.128.patch` makes the API's existing proxy opt-outs skip the
inline script insertion when both proxies are disabled. It applies to the UMD
and ESM entries and declares the existing custom-element opt-out in the types.

ToolGlows disables both proxies because Chromium MV3 blocks their inline
page-world script. Theme styles and DOM observers remain active. This avoids
the forbidden injection attempt without weakening CSP. CSSOM-only stylesheet
changes and custom-element registry events do not receive proxy hooks; do not
claim those hooks work. On browsers where inline execution had been allowed,
this is an explicit compatibility tradeoff that needs browser retesting.

The patch is pinned and installed by pnpm. When upgrading DarkReader, inspect
upstream proxy insertion, remove the patch if upstream supports these opt-outs,
and rerun `tests/dark-mode-proxy-csp.test.ts` plus actual extension dark-mode
activation under MV3 CSP, including BackerKit and dynamic-page rendering.

# webext-bridge 6.0.1

`webext-bridge@6.0.1.patch` reads `runtime.lastError` synchronously inside
background and persistent-port disconnect listeners in the ESM and CommonJS
entries. Chrome closes extension ports when a page enters the back/forward
cache; that exact expected error is consumed without an unchecked-error entry.
Other disconnect errors remain visible as warnings. The existing session
cleanup and reconnect algorithm are preserved; the patch does not claim to
repair or prove communication after a real BFCache restoration.

Run `tests/bridge-port-disconnect.test.ts`, both browser builds, and real browser
navigation/back/forward checks when changing or removing this patch. Remove it
when upstream handles the callback-scoped error itself. Contracts:
[Chrome BFCache messaging](https://developer.chrome.com/blog/bfcache-extension-messaging-changes)
and [runtime.lastError](https://developer.chrome.com/docs/extensions/reference/api/runtime#property-lastError).
