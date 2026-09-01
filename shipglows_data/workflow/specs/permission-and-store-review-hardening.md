---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-05-04"
created_at: "2026-05-04 06:30:00 UTC"
updated: "2026-08-31"
updated_at: "2026-08-31 20:42:00 UTC"
status: reviewed
source_skill: sf-build
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "operator"
confidence: high
user_story: "As the browser-extension maintainer, I want ToolGlows hardened for Chrome and Firefox store review by reducing broad permissions, removing packaged CDN fallback code, fixing manifest icons, and preserving Chrome/Firefox builds."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
  - "src/background/index.ts"
  - "src/content-script/index.ts"
  - "src/content-script/darkMode.ts"
  - "src/stores/darkMode.ts"
  - "src/ui/options*/pages/index.vue"
  - "src/assets/icons/"
  - "package.json"
  - "pnpm-lock.yaml"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/developer-guide.md"
  - "shipglows_data/technical/code-docs-map.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: "shipped"
  - artifact: "shipglows_data/workflow/specs/typecheck-stabilization.md"
    artifact_version: "0.1.0"
    required_status: "shipped"
supersedes: []
evidence:
  - "Code audit on 2026-05-04 found broad `<all_urls>` host permissions, unused `scripting`/`webNavigation` manifest surface, packaged FormKit CDN icon fallback, wrong-size manifest icons, and weak tests."
  - "Chrome extension permission docs recommend optional permissions where possible and warn that host/content-script matches can trigger user warnings."
  - "Chrome Web Store policy emphasizes least necessary data access and transparent extension behavior."
  - "Firefox extension docs require `browser_specific_settings.gecko.data_collection_permissions.required: [\"none\"]` for extensions that do not collect or transmit data."
  - "`pnpm run typecheck`, `pnpm exec eslint .`, `pnpm exec vitest run`, `pnpm audit --audit-level high`, `pnpm run build`, and `pnpm run lint:manifest` pass after implementation."
  - "`rg -n \"cdn\\.jsdelivr|https://cdn\" src manifest*.ts dist/chrome dist/firefox` returns no matches after implementation."
next_step: "none"
---

# Title

Permission and Store Review Hardening for ToolGlows

# Status

Shipped. This chantier was intentionally bounded to locally verifiable store-review hardening that does not remove the extension's existing all-page toolbar/content-script behavior. A full redesign to user-requested optional site access remains out of scope because it changes product behavior and onboarding.

Post-completion exception, 2026-08-31: a later operator-approved, cross-site dark-mode prepaint now has concrete runtime uses for `scripting`, `<all_urls>` host access and `alarms`. The original removal remains valid historical evidence for the earlier architecture; the current permission contract is governed by `adaptive-dark-page-palette.md` and the technical architecture.

# User Story

As the browser-extension maintainer, I want ToolGlows hardened for Chrome and Firefox store review by reducing broad permissions, removing packaged CDN fallback code, fixing manifest icons, and preserving Chrome/Firefox builds.

# Behavior Contract

ToolGlows should still build for Chrome and Firefox, load its page toolbar/content script on ordinary HTTP(S) pages, synchronize toolbar settings, and apply dark-mode styles through the content script. The extension should no longer declare redundant broad host permissions or unused privileged APIs, should not package FormKit CDN fallback code, and should provide correctly sized manifest icon files.

# Success Behavior

- `manifest.config.ts` keeps only permissions that are used after the implementation.
- Dark-mode style application does not depend on `chrome.scripting`.
- The built Chrome and Firefox bundles do not contain `cdn.jsdelivr.net` references from app or FormKit fallback code.
- Manifest icons point to size-specific PNG assets.
- Options pages still expose equivalent settings controls without FormKit.
- `pnpm run typecheck`, ESLint, Vitest, build, and Firefox manifest lint pass or fail only on accepted non-blocking warnings documented in the final report.

# Error Behavior

If removing a permission breaks an existing runtime path, restore the smallest required permission and document why it is required. If any generated icon or build artifact fails manifest lint, stop and fix the asset path rather than suppressing the warning.

# Scope In

- Remove redundant `host_permissions: ["<all_urls>"]`.
- Remove unused `scripting`, `activeTab`, and `webNavigation` permissions if code no longer needs them.
- Route dark-mode CSS updates through content-script messaging.
- Remove FormKit from source and package dependencies if options pages can be represented with native controls.
- Generate 16, 24, 32, and 128 PNG icons from the existing logo and update manifest icon paths.
- Add focused tests for manifest permissions and extension package policy strings.
- Update technical docs and trackers for the changed permission/package contract.

# Scope Out

- Removing static `content_scripts.matches: ["<all_urls>"]`; that would change the product's always-available toolbar model.
- Implementing runtime optional host access prompts or a new onboarding flow.
- Redesigning options-page UX beyond preserving equivalent controls.
- Shipping/committing unrelated dirty work from the prior audit unless explicitly authorized.

# Governance Gates

Technical docs: complete. `README.md`, `shipglows_data/technical/architecture.md`, `shipglows_data/technical/developer-guide.md`, and `shipglows_data/technical/code-docs-map.md` were updated for permissions, icons, no-CDN checks, and native options forms.

Editorial docs: no public editorial impact. `shipglows_data/editorial/content-map.md` was updated only to route the technical/store-review chantier impact.

Model routing: implementation-heavy, security-sensitive multi-file work; current Codex runtime is acceptable with medium/high reasoning.

# Validation Plan

- `pnpm run typecheck`
- `pnpm exec eslint .`
- `pnpm exec vitest run`
- `pnpm audit --audit-level high`
- `pnpm run build`
- `pnpm run lint:manifest`
- `rg -n "cdn\\.jsdelivr|https://cdn" src manifest*.ts dist/chrome dist/firefox`

# Documentation Update Plan

- Code changed: `manifest*.config.ts`, `src/background/index.ts`, `src/content-script/*`, `src/stores/darkMode.ts`, `src/ui/options*/pages/index.vue`, `package.json`, `pnpm-lock.yaml`, `src/assets/icons/*`
- Subsystem: `extension permissions / store review / options forms / package policy`
- Primary technical doc: `shipglows_data/technical/architecture.md`
- Secondary docs: `shipglows_data/technical/developer-guide.md`, `shipglows_data/technical/code-docs-map.md`
- Required action: `update`
- Priority: `high`
- Reason: permissions, dependencies, and manifest packaging are store-review relevant.
- Owner role: `integrator`
- Parallel-safe: `no`
- Notes: keep docs factual and avoid claiming full optional-permission support.

# Current Chantier Flow

| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| sf-spec | done | Spec created for bounded store-review hardening | sf-ready |
| sf-ready | done | Contract has behavior, scope, gates, validation, and docs plan | sf-start |
| sf-start | done | Manifest permissions reduced, FormKit/marked removed, icons generated, dark-mode relay moved to content scripts, docs/tests updated | sf-verify |
| sf-verify | done | Typecheck, ESLint, Vitest, high audit, build, manifest lint, and CDN scan passed | sf-end |
| sf-end | done | Spec, task trackers, README, and technical docs updated | sf-ship |
| sf-ship | done | Quick ship committed and pushed the project repo | none |

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-04 | sf-build | GPT-5 Codex | Created and readied bounded store-review hardening spec | implemented | sf-start |
| 2026-05-04 | sf-build | GPT-5 Codex | Implemented, verified, and documented store-review hardening | implemented | sf-ship on explicit commit/push request |
| 2026-05-04 | sf-ship | GPT-5 Codex | Quick shipped all dirty project repo changes for store-review hardening | shipped | none |
