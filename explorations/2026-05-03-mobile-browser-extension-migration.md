---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "extension"
created: "2026-05-03"
updated: "2026-05-03"
status: draft
source_skill: sf-explore
scope: "Adapter une extension Chrome existante pour des navigateurs mobiles Android compatibles extensions"
owner: "unknown"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "Chrome Extensions"
  - "WebExtensions"
  - "Firefox Android"
  - "Microsoft Edge Android"
  - "Samsung Internet"
  - "Yandex Browser Android"
evidence:
  - "Mozilla Support: Firefox Android supports extension install from addons.mozilla.org/android or the Add-ons Manager."
  - "Firefox Extension Workshop: Firefox Android supports a subset of desktop WebExtensions APIs."
  - "Microsoft Learn: Chrome extensions can usually be ported to Edge with minimal changes, subject to API support."
  - "Microsoft Edge Mobile page and policy docs: Edge mobile has extension support on Android, but supported extensions may differ by OS/version."
  - "Google Chrome Help: Chrome mobile flow is Add to Desktop rather than running extensions in Chrome Android."
  - "Vivaldi Android Help: Android docs list many built-in features but no extension platform; Vivaldi extension docs describe desktop Chromium support."
  - "Samsung Developer: Samsung Internet has an Android extension/ad-blocker model with mobile-specific constraints."
  - "Yandex Support: Yandex Browser for Android can install extensions from Yandex, Chrome, and Opera catalogs, and can load unpacked extensions for testing."
depends_on: []
supersedes: []
next_step: "continue exploring with the extension folders to audit manifest.json, background/service worker, content scripts, popup/options UI, permissions, and browser APIs"
---

# Exploration Report: Chrome Extension Migration To Android Browsers

## Starting Question

The current question is whether an existing Chrome browser extension can be adapted for Android mobile browsers, or whether it needs to be rebuilt from scratch.

Short answer captured for later work: it usually does not need to be rebuilt from zero. The realistic path is to audit the existing extension's manifest, APIs, permissions, background logic, content scripts, and UI surfaces, then create browser-specific builds or manifests for the mobile targets that are worth supporting.

## Context Read

- Current project directory: `/home/ubuntu/extension`.
- Project name: `extension`.
- Git status: not available; the directory is not currently a Git repository.
- `CLAUDE.md`: not present in the project root.
- Local `TASKS.md`: not present in the project root.
- Master ShipFlow `TASKS.md`: read for global context only; no project-specific mobile extension migration task found in the visible excerpt.

## Internet Research

- [Find and install extensions on Firefox for Android](https://support.mozilla.org/en-US/kb/find-and-install-add-ons-firefox-mobile) - Accessed 2026-05-03 - Confirms Firefox Android can install extensions from `addons.mozilla.org/android` or the in-browser Add-ons Manager.
- [Differences between desktop and Android extensions](https://extensionworkshop.com/documentation/develop/differences-between-desktop-and-android-extensions/) - Accessed 2026-05-03 - Defines Android-specific WebExtensions differences, including API and UI limitations.
- [Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/port-chrome-extension) - Accessed 2026-05-03 - Establishes that Chrome extensions are usually code-compatible with Edge when APIs and manifest keys are supported.
- [Microsoft Edge Mobile - Policies](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-mobile-policies) - Accessed 2026-05-03 - Shows `extensions` as an Edge Android policy-controlled feature, confirming Android relevance.
- [Download Microsoft Edge Mobile](https://www.microsoft.com/en-us/edge/mobile) - Accessed 2026-05-03 - Microsoft describes extensions on mobile and notes supported extensions may differ between operating systems.
- [Install and manage extensions - Google Chrome Help](https://support.google.com/chrome/answer/2664769) - Accessed 2026-05-03 - On mobile, Chrome's official extension flow points to adding an extension to desktop Chrome rather than running it in Chrome Android.
- [Vivaldi Browser on Android](https://vivaldi.com/android/) - Accessed 2026-05-03 - Lists Vivaldi Android features; useful because extensions are not presented as a supported Android feature.
- [Android - Vivaldi Browser Help](https://help.vivaldi.com/android/) - Accessed 2026-05-03 - Android help category lists built-in Android browser features without an extensions section.
- [Using Extensions in Vivaldi](https://help.vivaldi.com/article/extensions/) - Accessed 2026-05-03 - Confirms Vivaldi desktop supports Chrome Web Store extensions because it is Chromium-based; does not establish Android support.
- [Samsung Internet Extensions](https://developer.samsung.com/internet/android/extension-guide.html) - Accessed 2026-05-03 - Documents Samsung Internet's Android extension direction and mobile-specific extension model.
- [Ad Blockers Development Guide - Samsung Internet](https://developer.samsung.com/internet/android/adblockers-guide.html) - Accessed 2026-05-03 - Relevant if the existing extension is content-blocking oriented rather than a general WebExtension.
- [Extensions - Yandex Browser for Android smartphones](https://yandex.com/support/browser-mobile-android-phone/en/personal-settings/extensions) - Accessed 2026-05-03 - Confirms Yandex Browser for Android can install extensions from Yandex, Chrome, and Opera catalogs and can load unpacked extensions for testing.

## Problem Framing

The migration is not "Chrome desktop extension to generic mobile extension." It is more like:

```
Existing Chrome extension
        |
        v
Audit actual extension surfaces
        |
        +--> Content scripts: often reusable
        +--> Shared business logic: often reusable
        +--> Popup/options UI: needs mobile testing and likely layout changes
        +--> Background/service worker: depends on lifecycle and API support
        +--> Browser APIs: target-specific compatibility risk
        +--> Manifest: likely needs variants per store/browser
```

The practical question is not whether extension code can be reused, but which browser targets justify a supported build.

## Option Space

### Option A: Firefox Android First

- Summary: Treat Firefox Android as the first mobile WebExtensions target.
- Pros: Official extension support; clear Android-specific developer documentation; AMO has a mobile extension channel; WebExtensions model is close enough to Chrome for reuse in many cases.
- Cons: Firefox Android supports only a subset of desktop WebExtensions APIs; popup and browser UI behavior differs on mobile; APIs such as `commands`, DevTools APIs, some tab/window assumptions, native messaging, and desktop-oriented UI features may need removal or replacement.

### Option B: Edge Android First

- Summary: Treat Edge Android as the first Chromium-family mobile target.
- Pros: Existing Chrome extension code is often close to Edge extension code; Edge mobile now exposes extensions on Android; this may be the least disruptive Chromium path.
- Cons: Mobile supported-extension availability appears curated and OS/version-dependent; desktop Edge compatibility does not guarantee Edge Android compatibility; certification and store visibility constraints need verification.

### Option C: Firefox Android And Edge Android As Primary Targets

- Summary: Build a shared extension core, then maintain separate target manifests/build flags for Firefox Android and Edge Android.
- Pros: Best balance of official mobile support and market credibility; avoids overfitting to one browser; lets the project preserve most reusable logic.
- Cons: Requires disciplined target abstraction around browser APIs and UI; testing matrix expands; features may need graceful degradation per browser.

### Option D: Include Samsung Internet As A Secondary Target

- Summary: Explore Samsung Internet if the extension maps to Samsung's extension/ad-blocker model.
- Pros: Samsung Internet is a real Android browser with documented extension-related APIs; useful if the extension is content blocking or browser augmentation for Samsung users.
- Cons: Its model is not a simple Chrome Web Store/WebExtensions republish; distribution and supported extension types may be constrained; likely not the first target unless the extension's purpose fits.

### Option E: Include Yandex Browser Android As A Test Or Niche Target

- Summary: Use Yandex Browser Android as a compatibility experiment or niche distribution target.
- Pros: Official Yandex docs say mobile Yandex can install from Chrome and Opera catalogs, and can load unpacked extensions for testing.
- Cons: It may not match the intended user base; store trust, support burden, and geopolitical/business considerations may make it less attractive as a primary target.

### Option F: Target Chrome Android Or Vivaldi Android

- Summary: Try to support Chrome Android or Vivaldi Android directly.
- Pros: Chrome and Vivaldi are familiar brands; Vivaldi desktop has strong Chrome extension compatibility.
- Cons: Chrome Android standard does not provide normal extension execution; Vivaldi Android docs do not present extension support. These should not be primary migration targets unless their support changes.

## Comparison

| Target | Reuse from Chrome extension | Official Android extension path | Current migration value |
|---|---:|---:|---|
| Firefox Android | Medium to high, depending on APIs | Yes | High |
| Edge Android | High in Chromium-compatible areas | Yes, but mobile support must be verified | High |
| Chrome Android | Low as a direct target | No normal extension support | Low |
| Vivaldi Android | Low as a direct mobile target | Not shown in Android docs | Low |
| Samsung Internet | Medium only if extension model fits | Yes, but specialized | Medium/conditional |
| Yandex Android | Potentially high for Chrome Web Store-style extensions | Yes | Medium/conditional |

## Emerging Recommendation

Start with an audit of the existing Chrome extension rather than a rewrite.

The most likely migration shape:

```
shared/
  core extension logic
  content script logic
  API client logic

targets/
  chrome-desktop manifest/build
  firefox-android manifest/build
  edge-android manifest/build
  optional samsung/yandex experiments
```

The first supported mobile targets should probably be Firefox Android and Edge Android. Chrome Android and Vivaldi Android should be treated as non-targets for now. Samsung Internet and Yandex Android are worth tracking, but probably only after seeing the extension's actual feature set.

Confidence is medium because no project folders or `manifest.json` have been reviewed yet.

## Non-Decisions

- No decision yet on whether Manifest V2 or Manifest V3 is required for each target.
- No decision yet on publishing channels, store accounts, or review processes.
- No decision yet on whether the mobile version should have feature parity or a reduced feature set.
- No decision yet on whether Samsung Internet or Yandex should be supported beyond testing.

## Rejected Paths

- Rebuild from zero - rejected for now because Chrome extensions often share enough WebExtensions structure to justify an audit-and-adapt approach first.
- Target Chrome Android standard first - rejected for now because official Chrome Android does not expose the normal extension runtime.
- Assume Vivaldi Android behaves like Vivaldi desktop - rejected because Vivaldi's Android documentation does not establish extension support.

## Risks And Unknowns

- API compatibility: the extension may use desktop-only or Chromium-only APIs that are unavailable on Firefox Android or Edge Android.
- UI compatibility: desktop popups/options pages may be too large or rely on hover, keyboard shortcuts, context menus, or multi-window behavior.
- Background lifecycle: mobile browsers and Android can suspend or kill extension/background processes more aggressively than desktop.
- Permissions and store review: mobile extension stores may reject broad permissions or require clearer user-facing justification.
- Distribution constraints: Edge Android and Samsung Internet may not expose every extension or every capability to end users.
- Manifest differences: target browsers may require manifest key changes, browser-specific IDs, removed fields such as `update_url`, or packaging changes.
- Feature parity risk: a mobile extension may need to be intentionally smaller than the desktop version.

## Redaction Review

- Reviewed: yes.
- Sensitive inputs seen: none.
- Redactions applied: none.
- Notes: The report contains public source summaries and project-structure observations only. No extension source files, secrets, logs, tokens, or customer data were inspected or persisted.

## Decision Inputs For Spec

- User story seed: As a user on Android, I want the existing browser extension's core value to work in a supported mobile browser without needing a desktop browser.
- Scope in seed: audit existing Chrome extension; identify reusable code; define Firefox Android and Edge Android compatibility plan; create target-specific manifests/build outputs if implementation proceeds.
- Scope out seed: Chrome Android support unless official extension support becomes available; Vivaldi Android support unless official docs/product support changes; full Samsung/Yandex distribution until the extension's fit is proven.
- Invariants/constraints seed: no rebuild until audit proves reuse is not viable; preserve desktop Chrome behavior; avoid leaking permissions or secrets; mobile UI must be usable on small screens and touch input.
- Validation seed: run extension in desktop Chrome baseline, Firefox Android test path, and Edge Android test path; verify content scripts, popup/options, background lifecycle, storage, permissions, and core user flow.

## Handoff

- Recommended next command: continue exploring by showing the extension folders/files first; then use `/sf-spec` once the target scope is chosen.
- Why this next step: the browser/platform research is enough for a direction, but the real migration risk lives in the existing code's `manifest.json`, APIs, background scripts/service worker, content scripts, popup/options UI, and build tooling.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-05-03 00:00:00 UTC | Save mobile browser extension compatibility research and sources | Used `sf-explore`; checked project context; researched official browser docs; created durable exploration report | Captured migration framing, source list, target ranking, risks, and handoff inputs | Review the extension folders to map actual compatibility work |
