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
