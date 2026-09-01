---
artifact: technical_architecture
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-08-29"
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
| Popup | `src/ui/action-popup/` | Quick entry surface from the browser toolbar. |
| Options | `src/ui/options-page/` | Persistent configuration surface. |
| Side panel / sidebar | `src/ui/side-panel/` | Chrome side panel and Firefox sidebar UI. |
| Setup pages | `src/ui/setup/` | Install and update guidance opened by the background worker. |
| DevTools and offscreen | `src/devtools/`, `src/offscreen/` | Auxiliary extension contexts; validate them separately before relying on them for user-facing capability. |

The toolbar content script runs at `document_end` in the top-level document only, ensuring one ToolGlows instance and one command dispatch per tab. Frame-wide behavior belongs in dedicated lightweight entries, such as the dark-mode bootstrap, rather than duplicating the toolbar in every iframe.

## Extension flow

```text
web page DOM
  -> content script mounts ToolGlowsBar
  -> Pinia stores and components collect a bounded user action
  -> webext-bridge validates and serializes the request
  -> background worker calls privileged browser APIs when needed
  -> response or settings synchronization returns to extension contexts
```

`ToolGlowsBar.vue` is the current registry of the user-facing tools. Its components use dedicated stores and composables for individual capabilities; a tool added outside that registry is not part of the toolbar promise.

The round ToolGlows button owns both primary gestures: a pointer movement drags the toolbar, while a press and release without movement opens or closes it. Document-level dialogs and tooltips do not count as outside clicks for collapse.

The dark-mode store persists activation, schedule, system preference, palette preset, custom colors, contrast and per-domain exclusions. Graphite is the coherent default preset; switching to Custom restores the last custom color triplet without loss, and legacy saved colors are preserved as that custom triplet during migration. Setting controls update and persist their values atomically. The background registers a packaged graphite prepaint stylesheet persistently while effective dark mode is active. Because registered CSS is available before the next page constructs or displays its DOM, the first root canvas is dark instead of being added asynchronously after a white render. A system-preference variant uses `prefers-color-scheme`; an alarm refreshes registration at schedule boundaries; exact hostname exclusions become `excludeMatches`. The independent `document_start` entry validates cached state and custom colors, then starts the actual Dark Mode engine immediately; the Vue toolbar remains a separate top-frame `document_end` script. Once the engine is invoked, the declarative root prepaint retires synchronously. No opaque element, page-load gate, surface polling or failsafe timer delays host rendering. A root-and-body backdrop remains underneath the engine to prevent later site hydration from restoring a white page canvas without masking content or changing descendant computed styles. A small RGB range table softens residual near-white neutral, beige and pale-blue control or panel surfaces after hydration; it excludes media and all ToolGlows UI, observes newly inserted UI, and removes its markers when dark mode stops. Host-page images receive one global glare-reduction filter at the injected page-style boundary, while ToolGlows-owned media remains unchanged. Image analysis and inline-style analysis are both disabled for images, pictures, video, SVG, canvas and elements exposed as images: ToolGlows may attenuate media but never automatically invert its colors. Narrow hostname-scoped overrides remain limited to deterministic third-party UI surfaces such as Oscaro's filter panel and bright controls, not media. Disabling the tool unregisters future prepaint injection and retires every theme layer already present in the current page.

Reader Mode keeps the visited page mounted and delegates article extraction to the packaged Mozilla Readability engine. The extracted HTML crosses an explicit allowlist sanitizer before ToolGlows constructs a semantic, full-viewport reader surface beside the page; scripts, forms, embedded documents, active SVG, event attributes and unsafe URL schemes are discarded. One Pinia store owns normalized synchronized preferences, parsing/error state and the reversible lifecycle. The reader surface traps keyboard focus, exits with Escape, restores scroll and focus, and consumes the canonical light, sepia and dark reader tokens without adding permissions or transmitting article content.

The Hide Elements store persists bounded CSS selectors per hostname in synchronized extension settings and mirrors the selector index into a local pre-render cache. The lightweight `document_start` entry applies that cache while the page DOM is being parsed, then the toolbar store retires the bootstrap markers and takes ownership at `document_end`, including for content inserted later by the page. Selection remains active for consecutive choices. While selection is active, saved targets are shown with the semantic red restoration treatment, an accessible restore control, and a tokenized non-layout shift that reveals a clickable edge of an otherwise fully covered parent. This lets users climb nested page structures deliberately; leaving selection hides the saved targets again. Users can restore one target or reset all saved targets for the current hostname without changing browser permissions.

## Browser variants and permissions

The shared manifest declares `alarms`, `bookmarks`, `scripting`, `storage` and `tabs`, plus `host_permissions: ["<all_urls>"]` for the extension's all-page utility boundary.

- `alarms` refreshes persistent dark-prepaint registration at configured schedule boundaries.
- `bookmarks` supports bookmark export from drag-and-drop actions.
- `scripting` persistently registers the packaged prepaint CSS before page DOM display.
- `storage` persists settings and active tools.
- `tabs` supports tab queries and the reload-all-tabs feature.
- The host permission authorizes dynamic stylesheet registration on the same broad page surface already served by the toolbar's static content scripts; it is not used for transmitting page data.
- Chrome adds `sidePanel` and uses `side_panel`.
- Firefox removes the Chrome-only side-panel declaration, uses `sidebar_action`, and declares no required data collection.

The manifest exposes only the packaged resources required by extension pages. Do not add `activeTab`, `webNavigation`, broader host behavior or additional web-accessible resources without a feature-specific justification, payload boundary and browser proof.

## Security and data boundaries

- Extension messages must be JSON-serializable and validate data before privileged calls.
- Content scripts may read and alter the page DOM only to fulfil an enabled page-level tool; they must not silently transmit page data.
- Browser actions with broad effect—opening tabs or windows, creating bookmarks and reloading tabs—run in the background context.
- Third-party DOM integrations are brittle by nature. Keep Gmail, Instagram and social-analysis features disabled or explicitly experimental until browser-specific tests cover their supported state.
- Build output must not rely on remote CDN fallbacks. The extension must remain usable from packaged assets.

## Design and maintenance invariants

- The toolbar must be configurable, movable, resizable and non-disruptive to the host page.
- User preferences use browser storage; changing their schema requires a migration and cross-context validation.
- Chrome and Firefox are first-class outputs. A change accepted in one browser is not evidence for the other.
- Generated `dist/`, local dependencies and vendored PrimeVue assets are not canonical documentation or hand-maintained source.

## Validation triggers

| Change | Minimum proof |
| --- | --- |
| Manifest, permissions or browser-specific config | Typecheck, production builds for both browsers and Firefox manifest lint. |
| Bridge or background action | Focused unit coverage where possible plus manual browser proof of the initiating surface and privileged outcome. |
| Toolbar tool or content-script behavior | Typecheck, focused test where practical and manual proof in a supported page. |
| Dependency or build configuration | Typecheck, tests, both builds and an updated README/developer guide when commands or prerequisites change. |
