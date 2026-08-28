---
artifact: code_docs_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-08-28"
status: reviewed
source_skill: sg-docs
scope: code-navigation
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - src/
  - manifest.config.ts
  - package.json
  - shipglows_data/technical/architecture.md
  - shipglows_data/technical/developer-guide.md
depends_on:
  - artifact: shipglows_data/technical/architecture.md
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Current source directories, manifests and entrypoints were inspected on 2026-08-28."
next_review: "2026-11-28"
next_step: "Update when a source root, context or validation responsibility moves."
---

# ToolGlows Code Documentation Map

| Area | Primary paths | Responsibility | Read with | Validation trigger |
| --- | --- | --- | --- | --- |
| Shared manifest | `manifest.config.ts` | MV3 common entrypoints, content-script matching, permissions, icons and web-accessible resources | Architecture and claim register | Both builds; Firefox manifest lint when relevant |
| Chrome and Firefox variants | `manifest.chrome.config.ts`, `manifest.firefox.config.ts` | Browser-specific manifest deltas | Architecture | Targeted browser build; Firefox lint for Firefox |
| Build system | `vite*.config.ts`, `define.config.mjs`, `package.json` | Vite/CRXJS configuration and scripts | Developer guide and README | Typecheck, tests and both builds |
| Background worker | `src/background/` | Lifecycle, privileged browser APIs and synchronization | Architecture | Focused tests where possible; manual browser proof of privileged effects |
| Bridge | `src/bridge/` | Serializable cross-context messages and payload validation | Architecture | Sender/receiver boundary review plus focused proof |
| Injected toolbar | `src/content-script/`, `src/components/ToolGlowsBar.vue` | Page injection, toolbar mount, registered tools and host-page coexistence | Architecture and product context | Manual page proof and relevant automated test |
| Tool implementations | `src/components/`, `src/stores/`, `src/composables/` | Individual reading, navigation, focus and experimental social capabilities | Product context | Focused behavior proof; browser test for DOM-dependent tools |
| Extension UIs | `src/ui/` | Popup, options, side panel, setup and DevTools surfaces | Architecture | Targeted build and manual surface proof |
| Shared UI runtime | `src/utils/`, `src/locales/`, `src/assets/`, `src/types/` | Router, Pinia, notifications, i18n, styling and type contracts | Developer guide | Typecheck and affected UI proof |
| Tests | `tests/`, `src/**/__tests__/` | Automated policy and store-level proof | Developer guide | `pnpm exec vitest run` |

## Terms that need care

- **Tool**: a user-facing toolbar capability registered in `ToolGlowsBar.vue`; it is not merely a component file.
- **Content script**: the isolated extension context that can access the page DOM. It is not the page’s own JavaScript context.
- **Background worker**: the Manifest V3 worker that owns privileged browser APIs and can be suspended between events.
- **Bridge**: the typed, serializable message boundary between extension contexts; it is not an arbitrary event bus.
- **Experimental integration**: behavior depending on a third-party website’s DOM. It requires browser proof before becoming a stable product claim.

## Update rules

Update this map together with the affected canonical documentation when a path, runtime owner, public tool, permission, build command or validation expectation changes. This map routes readers; it does not replace source-level comments for non-obvious invariants or payload validation.
