---
artifact: technical_architecture
metadata_schema_version: "1.0"
artifact_version: "1.3.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-09-22"
status: reviewed
source_skill: sg-docs
scope: extension-architecture
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - manifest.config.ts
  - manifest.chrome.config.ts
  - manifest.firefox.config.ts
  - src/background/index.ts
  - src/content-script/index.ts
  - src/bridge/index.ts
  - src/components/ToolGlowsBar.vue
depends_on:
  - artifact: shipglows_data/business/product.md
    artifact_version: "2.0.0"
    required_status: reviewed
supersedes:
  - "System Architecture Document v1.0 (2025-12-16)"
evidence:
  - "Manifest V3 configuration declares the Chrome and Firefox entrypoints and permission baseline."
  - "The content script mounts the Vue toolbar and the background worker owns privileged browser actions."
  - "The packaged Dark Mode engine applies the configurable dynamic dark theme inside each content-script context."
  - "Auto Copy regression coverage proves activation, cumulative multi-selection copying, session preview notifications, redacted diagnostics, truthful failure feedback and clipboard fallback cleanup."
next_review: "2026-11-28"
next_step: "Refresh after a manifest, bridge or browser-context change."
---

# ToolGlows Architecture

## Runtime model

ToolGlows is one Vue 3 and TypeScript codebase built by Vite/CRXJS for Chrome and Firefox. The extension uses Manifest V3 and separates browser contexts by responsibility:

| Context | Entrypoint | Responsibility |
| --- | --- | --- |
| Background worker | `src/background/index.ts` | Extension lifecycle, settings synchronization and privileged tab, window, reload and bookmark operations. |
| Content script | `src/content-script/index.ts` | Injects the Vue toolbar into matching pages, mounts styles and owns page-level interactions. |
| Cross-context bridge | `src/bridge/index.ts` | Defines serializable message shapes and relays bounded requests to the background worker. |
| Popup | `src/ui/action-popup/` | Quick entry surface from the browser toolbar, including a persisted switch that shows or hides the injected toolbar overlay without unloading active tools. |
| Options | `src/ui/options-page/` | Persistent configuration surface. |
| Side panel / sidebar | `src/ui/side-panel/` | Chrome side panel and Firefox sidebar UI. |
| Setup pages | `src/ui/setup/` | Install and update guidance opened by the background worker. |
| DevTools and offscreen | `src/devtools/`, `src/offscreen/` | Auxiliary extension contexts; validate them separately before relying on them for user-facing capability. |

The toolbar content script runs at `document_end` in the top-level document only, ensuring one ToolGlows instance and one command dispatch per tab. Frame-wide behavior belongs in dedicated lightweight entries, such as the dark-mode bootstrap, rather than duplicating the toolbar in every iframe.

## Extension flow

Cookie auto-acceptance is an opt-in top-level content-script feature. A browser-independent DOM engine is separated from the local-storage adapter and toolbar panel; no new privileged messages or permissions are introduced. See [cookie-consent automation](cookie-consent-automation.md) for the reuse boundary, CommunityGlows provenance, rule coverage, lifecycle and proof limits.

```text
web page DOM
  -> content script mounts ToolGlowsBar
  -> Pinia stores and components collect a bounded user action
  -> webext-bridge validates and serializes the request
  -> background worker calls privileged browser APIs when needed
  -> response or settings synchronization returns to extension contexts
```

`ToolGlowsBar.vue` is the current registry of the user-facing tools. Its components use dedicated stores and composables for individual capabilities; a tool added outside that registry is not part of the toolbar promise.

Auto Copy keeps its toolbar and settings in the top-frame content script and uses a separate lightweight listener in subframes, including eligible `about:blank` documents. Both contexts copy the exact pointer, touch or keyboard selection without templates, titles or source URLs; explicit format shortcuts remain top-frame behavior and retain formatting options. Password selections are rejected. Clipboard writes first use a synchronous copy event that preserves focus and selection, then the modern API, with a final temporary-element fallback that restores DOM ranges, editable caret state and focus. ToolGlows-owned elements are excluded from copied and multi-selected page content; the shortcut-capture control is also ignored by global keyboard handling. The interaction moves through idle, copying, confirmed and failed states; an unchanged selection is not copied twice, a confirmed selection fades and is cleared after 1.5 seconds, and grouped notifications replace instead of stacking. Active selection feedback resolves through ToolGlows design tokens. Single-copy notifications provide brief status feedback. Multi-selection uses one session notification with up to five copied-block text previews, refreshed after each successful cumulative copy and kept visible without a timeout while selection continues. `Escape`, focus loss or disabling Auto Copy ends the session and changes that same notification to a brief completion summary. Alt element selection remains a single-element mode with one delegated overlay. Holding the configurable multi-selection shortcut for 600 ms outside editable fields activates a separate multi-element mode that remains active after release; the default is `Ctrl`, and a single key or a modifier-plus-key combination can be captured in Auto Copy settings. Normal clicks append distinct selectable blocks in click order and copy the accumulated plain text immediately with newline separators; `Escape`, focus loss or disabling Auto Copy clears the temporary chain. `Alt` remains reserved for element selection and existing format shortcuts.

Explicit Auto Copy format templates substitute every `{content}`, `{title}` and `{url}` field in one pass without interpreting placeholder-like text inside the inserted values. Markdown conversion traverses the detached selection nodes, preserving the supported bold, italic, link and line-break markup regardless of attributes, and using decoded DOM text. Editable field values remain literal text. HTML shortcuts still put serialized HTML in the plain-text clipboard; they do not provide a rich `text/html` clipboard payload.

Rich Copy has a separate input contract: browser-tab URLs and titles, never selected page text. Its current-tab and selected-tab actions request tab metadata through the maintained bridge and background browser APIs. “Selected” means highlighted tabs in the browser tab strip. Group copying uses native tab groups when available. Formats produce plain-text clipboard content, with one formatted tab per line. Browser validation of the current-tab and selected-tab flows remains pending after the source repair; no extension build was requested.

The round ToolGlows button owns both primary gestures: a pointer movement drags the toolbar, while a press and release without movement opens or closes it. Document-level dialogs and tooltips do not count as outside clicks for collapse.

Custom text and link contrast thresholds are advisory. The settings surface measures requested colors against the custom background, stages a new low-contrast choice, and offers a minimally shifted readable suggestion. In the Custom preset only, a bounded text-owner observer starts from cached preferences in the independent `document_start` path and applies accepted text and link values directly so DarkReader cannot remap their hue. Graphite and Aurora instead run a selective contrast repair after page transformation: readable computed colors remain untouched, while a text owner below 4.5:1 receives the nearest viable theme foreground or a black/white fallback against its composited visible ancestor background. The repair covers initial and dynamically inserted HTML controls and text, excludes ToolGlows UI and media, uses bounded hydration rescans, and restores previous inline colors when dark mode stops. Contrast and bright-surface refinements run in cancellable scheduled batches (at most 50 elements or 5 ms of planning per task, then a 16 ms yield), after initial theme activation. Each batch reads computed styles before applying DOM writes; contrast batches cache shared ancestor backgrounds for that snapshot. Stop cancels pending work before restoring colors. Repeated identical theme broadcasts reuse the active engine instead of transforming the page again.

The synchronized dark-mode preferences can also hold up to 20 named custom themes. Each saved record contains a validated identifier, unique bounded name and normalized background, text and link triplet; applying one restores Custom mode atomically, while rename and confirmed deletion only mutate the saved-theme collection. Invalid, duplicate or over-limit persisted records are discarded during hydration. The palette gallery places those saved themes beside the immutable Graphite and Aurora presets. Aurora uses a deep evergreen canvas, near-white text and vivid raspberry links, participates in the same dark-surface adaptation and persistent prepaint path as Graphite, and relies on selective contrast repair rather than globally flattening host-page text colors. The same preset activates a centralized Aurora interface-token variant on the ToolGlows toolbar without leaking those interface tokens into the host page. Its internal legacy preset identifier remains stable so existing Latte selections migrate to Aurora in place.

The dark-mode store persists activation, schedule, system preference, palette preset, custom colors, contrast and per-domain exclusions. Graphite is the coherent default preset; switching to Custom restores the last custom color triplet without loss, and legacy saved colors are preserved as that custom triplet during migration. Setting controls update and persist their values atomically. Reactive settings cross storage and message boundaries only after recursive conversion to plain JSON-compatible data, so tool lists, exclusions and hidden-element collections remain arrays instead of index-keyed objects. The background registers a packaged graphite prepaint stylesheet persistently while effective dark mode is active. Because registered CSS is available before the next page constructs or displays its DOM, the first root canvas is dark instead of being added asynchronously after a white render. A system-preference variant uses `prefers-color-scheme`; an alarm refreshes registration at schedule boundaries; exact hostname exclusions become `excludeMatches`. The independent `document_start` entry validates cached state and custom colors, then starts the actual Dark Mode engine immediately; the Vue toolbar remains a separate top-frame `document_end` script. Once the engine is invoked, the declarative root prepaint retires synchronously. No opaque element, page-load gate, surface polling or failsafe timer delays host rendering. A root-and-body backdrop remains underneath the engine to prevent later site hydration from restoring a white page canvas without masking content or changing descendant computed styles; it also exposes the resolved custom link color before the document-end override is available. That same early style owns the generic media attenuation and explicitly neutralizes inline-SVG inversion before the engine can expose a transient color change; its selectors also cover media inserted later, exclude ToolGlows UI and are not duplicated by the document-end overrides. A small RGB range table softens residual near-white neutral, beige and pale-blue control or panel surfaces after hydration; it excludes media and all ToolGlows UI, observes newly inserted UI, and removes its markers when dark mode stops. Image analysis and inline-style analysis are both disabled for images, pictures, video, SVG, canvas and elements exposed as images: ToolGlows may attenuate media but never automatically invert its colors. Narrow hostname-scoped overrides remain limited to deterministic third-party UI surfaces such as Oscaro's filter panel and bright controls, not media. Disabling the tool unregisters future prepaint injection and retires every theme layer already present in the current page.

Reader Mode keeps the visited page mounted and delegates article extraction to the packaged Mozilla Readability engine. The extracted HTML crosses an explicit allowlist sanitizer before ToolGlows constructs a semantic, full-viewport reader surface beside the page; scripts, forms, embedded documents, active SVG, event attributes and unsafe URL schemes are discarded. One Pinia store owns normalized synchronized preferences, parsing/error state and the reversible lifecycle. The reader surface traps keyboard focus, exits with Escape, restores scroll and focus, and consumes the canonical light, sepia and dark reader tokens without adding permissions or transmitting article content.

The Hide Elements store persists bounded CSS selectors per hostname in synchronized extension settings and mirrors the selector index into a local pre-render cache. The lightweight `document_start` entry applies that cache while the page DOM is being parsed, then the toolbar store retires the bootstrap markers and takes ownership at `document_end`, including for content inserted later by the page. Selection remains active for consecutive choices. While selection is active, saved targets are shown with the semantic red restoration treatment, an accessible restore control, and a tokenized non-layout shift that reveals a clickable edge of an otherwise fully covered parent. This lets users climb nested page structures deliberately; leaving selection hides the saved targets again. Users can restore one target or reset all saved targets for the current hostname without changing browser permissions.

## Browser variants and permissions

The shared manifest declares `alarms`, `bookmarks`, `scripting`, `storage`, `tabGroups` and `tabs`, plus `host_permissions: ["<all_urls>"]` for the extension's all-page utility boundary.

- `alarms` refreshes persistent dark-prepaint registration at configured schedule boundaries.
- `bookmarks` supports bookmark export from drag-and-drop actions.
- `scripting` persistently registers the packaged prepaint CSS before page DOM display.
- `storage` persists settings and active tools.
- `tabs` supports Rich Copy URL queries and the reload-all-tabs feature.
- `tabGroups` supports listing native browser groups for Rich Copy; unavailable group APIs must not prevent current-tab or selected-tab copying.
- The host permission authorizes dynamic stylesheet registration on the same broad page surface already served by the toolbar's static content scripts; it is not used for transmitting page data.
- Chrome adds `sidePanel` and uses `side_panel`.
- Firefox removes the Chrome-only side-panel declaration, uses `sidebar_action`, and declares no required data collection.

The manifest exposes only the packaged resources required by extension pages. Do not add `activeTab`, `webNavigation`, broader host behavior or additional web-accessible resources without a feature-specific justification, payload boundary and browser proof.

## Security and data boundaries

- Extension messages must be JSON-serializable and validate data before privileged calls.
- The all-sites content script never enables page-world/window messaging. Every background bridge handler rejects non-internal senders before reading its payload, and privileged payloads are normalized again at that authoritative boundary.
- Content scripts may read and alter the page DOM only to fulfil an enabled page-level tool; they must not silently transmit page data.
- Browser actions with broad effect—opening tabs or windows, creating bookmarks and reloading tabs—run in the background context.
- Third-party DOM integrations are brittle by nature. Keep Gmail, Instagram and social-analysis features disabled or explicitly experimental until browser-specific tests cover their supported state.
- Build output must not rely on remote CDN fallbacks. The extension must remain usable from packaged assets.

## Design and maintenance invariants

- The toolbar must be configurable, movable, resizable and non-disruptive to the host page.
- User preferences use browser storage; changing their schema requires a migration and cross-context validation.
- Chrome and Firefox are first-class outputs. A change accepted in one browser is not evidence for the other.
- Generated `dist/`, local dependencies and vendored PrimeVue assets are not canonical documentation or hand-maintained source.

## Dark-mode external resources

The embedded DarkReader engine registers a dedicated resource fetch adapter before activation. Eligible cross-origin public HTTP(S) CSS/image resources use `FETCH_DARK_MODE_RESOURCE` through the existing internal content-script/background bridge and existing host permissions, without first issuing a failing page CORS request. Same-origin resources first use anonymous native fetch; data/blob images remain native. The background validates the internal sender and numeric tab/frame identifiers, accepts only a URL field, and performs GET without cookies or referrer. It rejects userinfo, IP literals, local/special hostnames, nondefault ports and redirects; response MIME is restricted to CSS and supported images, including JPEG. Streaming is bounded to 5 MiB and 10 seconds. Content requests queue at four concurrent/64 pending per context; the background caps concurrent requests at eight per tab. Bytes return only to the extension content script, with no page-world API or persistent resource cache. Browser APIs do not expose preflight DNS resolution; hostname validation is not a guarantee against a public hostname resolving to a private address.

Bright-surface markers remain stable through hydration rescans: reading the extension's own dark override must not remove the marker and restore a white surface. Disabling dark mode cancels scans and removes markers, restoring the site's original styles.

DarkReader 4.9.128 is installed with the tracked pnpm patch in `patches/`. Its API normally inserts an inline page-world proxy even when its proxy options are disabled. ToolGlows disables both stylesheet and custom-element proxies, and the patch skips that unused script insertion. This avoids an MV3 CSP violation without weakening CSP; theme generation and DOM observers remain active. CSSOM-only changes and custom-element registry events do not receive proxy hooks. Recheck this limitation and the patch against both browsers when upgrading DarkReader. The shared Vite build also disables module preloads: native module imports remain, while extension cross-world preload mismatches are avoided.

On `backerkit.com` and its subdomains only, the hosted-preorder layout's `.project-background` decorative image is replaced by the dark surface token. That image is enlarged into a nearly white canvas on the observed project page; the override targets `.hosted-preorders-layout .project-background` and leaves content image elements intact. Removing the dark-mode override restores the original decorative background.

## Validation triggers

| Change | Minimum proof |
| --- | --- |
| Manifest, permissions or browser-specific config | Typecheck, production builds for both browsers and Firefox manifest lint. |
| Bridge or background action | Focused unit coverage where possible plus manual browser proof of the initiating surface and privileged outcome. |
| Toolbar tool or content-script behavior | Typecheck, focused test where practical and manual proof in a supported page. |
| Dependency or build configuration | Typecheck, tests, both builds and an updated README/developer guide when commands or prerequisites change. |
