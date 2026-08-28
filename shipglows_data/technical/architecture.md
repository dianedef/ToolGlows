---
artifact: technical_architecture
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-08-28"
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

The content script runs at `document_end` in all frames on the manifest match pattern. This broad page reach is part of the toolbar promise and must remain justified when reviewing store permissions and disclosure.

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

## Browser variants and permissions

The shared manifest declares `bookmarks`, `storage` and `tabs`.

- `bookmarks` supports bookmark export from drag-and-drop actions.
- `storage` persists settings and active tools.
- `tabs` supports tab queries and the reload-all-tabs feature.
- Chrome adds `sidePanel` and uses `side_panel`.
- Firefox removes the Chrome-only side-panel declaration, uses `sidebar_action`, and declares no required data collection.

The manifest exposes only the packaged resources required by extension pages. Do not add `scripting`, `activeTab`, `webNavigation`, host permissions or additional web-accessible resources without a feature-specific justification, payload boundary and browser proof.

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
