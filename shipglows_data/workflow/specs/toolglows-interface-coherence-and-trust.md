---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-09-01"
created_at: "2026-09-01 11:59:25 UTC"
updated: "2026-09-01"
updated_at: "2026-09-01 12:32:45 UTC"
status: complete
source_skill: sg-design
source_model: "Codex"
scope: "interface-theme-settings-trust"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "src/assets/design-tokens.css"
  - "src/stores/settings.ts"
  - "src/stores/theme.ts"
  - "src/composables/useTheme.ts"
  - "src/ui/action-popup/pages/index.vue"
  - "src/ui/options-page/pages/index.vue"
  - "src/components/ToolGlowsBar.vue"
  - "shipglows_data/technical/design-system-authority.md"
depends_on: []
supersedes:
  - "shipglows_data/workflow/specs/toolglows-design-token-authority.md"
evidence:
  - "2026-09-01 design-token audit graded theme architecture D and found 22 active project-owned drift defects."
  - "2026-09-01 Edge proof showed unavailable commercial CTAs and a dispersed options form without visible save feedback."
next_step: "Chantier closed; reassess only if new interface-theme or settings surfaces are introduced."
---

# ToolGlows Interface Coherence and Trust

## User Story

As a ToolGlows user, I want the extension theme, settings and visible actions to behave consistently, so every control is trustworthy across popup, options and injected toolbar surfaces.

## Outcome Contract

- One canonical interface-theme preference controls every ToolGlows-owned surface.
- The options page reads and writes the maintained extension settings authority and reports save success or failure.
- The popup exposes only routes and actions that exist in the current product.
- Popup, options and toolbar reflow without horizontal clipping at narrow widths and 200% zoom.
- Non-essential motion respects the user's reduced-motion preference.
- Project-owned visual decisions consume canonical semantic design tokens.

## Scope In

- Consolidate the competing light/dark/system theme paths around the maintained settings authority.
- Preserve the Graphite/Custom visited-page appearance contract independently from interface theme.
- Replace local options state and no-op submit behavior with maintained browser-storage-backed settings.
- Remove or replace unavailable Offer and Account/Start journeys; do not invent pricing or authentication.
- Repair the highest-impact popup, options and toolbar responsive/token bypasses.
- Add focused regression tests and update mapped technical documentation.

## Scope Out

- Pricing, accounts, entitlements, subscriptions or authentication.
- New permissions, dependencies, icon-family migration or brand redesign.
- Experimental Gmail, Instagram or social-module redesign.
- Vendor PrimeVue source edits and unrelated third-party page styling.
- Full WCAG certification or store-readiness claims.

## Architecture And Invariants

- `src/assets/design-tokens.css` remains the canonical semantic visual authority.
- `settings.interfaceTheme` remains the canonical persisted interface-theme value unless implementation evidence proves a migration-safe equivalent is required.
- Browser storage remains the persistence boundary; no parallel local-storage theme authority remains active.
- PrimeVue keeps interaction semantics; ToolGlows wrappers own visual composition and semantic design-token consumption.
- Chrome and Firefox behavior remain supported from the shared Vue/TypeScript codebase.
- Existing visited-page dark-mode settings and user custom colors remain intact.
- Unrelated dirty files remain untouched and unstaged.

## Execution Batches

### Batch 1 — Theme and settings authority

- Remove or retire competing runtime theme stores/composables from active consumers.
- Make popup, options and content-script surfaces consume one persisted interface theme.
- Connect the options form to maintained settings and visible save feedback.
- Add focused theme/settings regression tests.

### Batch 2 — Trustworthy actions and responsive shell

- Remove unavailable commercial/account routes from the popup and retain only proven product actions.
- Replace hardcoded popup/toolbar layout values with semantic design tokens or documented platform constants.
- Add narrow-width, zoom-safe and reduced-motion behavior.
- Add focused route and structural regression tests.

### Batch 3 — Verification and documentation

- Run design-system drift evidence and resolve remaining in-scope findings.
- Verify light/dark, narrow width, 200% zoom and reduced motion in isolated Edge with the unpacked extension.
- Run typecheck, tests, Chrome/Firefox builds and Firefox manifest lint.
- Update the design-system authority and mapped technical documentation to match the final architecture.

## Acceptance Criteria

- [x] Exactly one active interface-theme persistence path remains.
- [x] Popup, options and injected UI resolve the same light/dark preference without first-render contradiction.
- [x] Options changes persist through maintained browser storage and expose success/error feedback.
- [x] Popup has no CTA to missing pricing, account or login routes.
- [x] Representative popup, options and toolbar states remain usable at narrow width and 200% zoom.
- [x] Non-essential motion is removed or reduced under `prefers-reduced-motion`.
- [x] In-scope design-token drift defects are eliminated or documented as exact exceptions.
- [x] Focused tests, full tests, typecheck, Chrome/Firefox builds and manifest lint pass.
- [x] Edge rendered proof covers light, dark, narrow and reduced-motion states.
- [x] Technical documentation matches the implemented authority and consumption paths.

## Proof Strategy

- Regression-first for settings persistence, popup routes and theme authority.
- Evidence-first for responsive layout, first-render theme and reduced-motion behavior.
- Broad design-system drift scan after in-scope migrations.
- No accessibility-complete or cross-browser-interaction claim without its dedicated proof.

## Risks And Recovery

- Theme consolidation can invalidate stored legacy values; normalize known values and preserve a safe light fallback.
- Options migration can expose field-shape mismatches; map only governed settings and retain defaults for absent values.
- Content-script scoping can allow host-page CSS to interfere; keep ToolGlows tokens under the maintained extension boundary.
- If Firefox runtime behavior diverges after shared-code proof, stop before closure and open a bounded browser-specific correction.

## Documentation Coherence

- Update the design-system authority with the final theme and persistence path.
- Update technical architecture or developer guidance only where the changed settings flow is mapped.
- Public product copy remains unchanged because unavailable commercial promises are removed rather than replaced.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-01 11:59 UTC | 006-sg-design | Codex | Created the approved successor contract from the design-token and UI audit findings. | ready | Start sequential implementation batches. |
| 2026-09-01 12:25 UTC | sg-development | Codex | Unified active theme persistence, connected options storage feedback, removed unavailable journeys, repaired narrow reflow and added reduced-motion/token mappings. | verified | Persist the milestone and close delivery. |
| 2026-09-01 12:32 UTC | sg-design | Codex | Delivered the verified implementation to `origin/main` in commit `4f130be`. | complete | Chantier closed. |

## Current Chantier Flow

- sg-design: verified
- readiness: ready
- implementation: complete
- verification: passed — 82 tests, typecheck, Chrome/Firefox builds, changed-token scan, manifest lint and isolated Edge proof
- delivery: pushed to `origin/main` — `4f130be`
