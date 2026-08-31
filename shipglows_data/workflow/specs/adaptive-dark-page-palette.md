---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "toolglows"
created: "2026-08-29"
updated: "2026-08-30"
status: active
source_skill: sg-design
source_model: "Codex"
scope: "adaptive-dark-page-palette"
owner: "Diane"
confidence: high
user_story: "As a ToolGlows user, I want adapted web pages to remain harmonious and structurally legible in dark mode, so bright surfaces are softened without erasing buttons, hierarchy or semantic states."
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "content-script dark-mode engine"
  - "semantic design tokens"
  - "Chrome and Firefox page adaptation"
depends_on: []
supersedes: []
evidence:
  - "Oscaro retained white filter and product-image surfaces after DarkReader activation."
  - "Blind near-white remapping removed button affordance and missed pale-green Compatible states."
next_step: "Implement the approved graphite semantic palette and verify representative pages."
---

# Adaptive Dark Page Palette

## User Story

As a ToolGlows user, I want adapted web pages to remain harmonious and structurally legible in dark mode, so bright surfaces are softened without erasing buttons, hierarchy or semantic states.

## Behavior Contract

- Adapted pages use one restrained graphite hierarchy for canvas, surfaces and raised controls.
- Remapped interactive elements retain a visible border, subtle elevation, hover and focus affordance.
- Pale semantic colors preserve their meaning: green remains success-compatible, warm colors remain warnings and neutral whites remain neutral surfaces.
- Images receive glare reduction separately from UI surface mapping.
- ToolGlows UI, media, SVG and light mode remain outside page-palette remapping.
- Runtime-inserted content receives the same mapping and all markers are removed when dark mode stops.
- Graphite is selectable beside Custom; changing presets is reversible and never discards the last custom colors.
- Dark-mode setting controls persist and apply the value emitted by the interaction rather than a stale previous value.
- Disabling or removing Dark Mode from the loaded-tool list persists `darkModeActive=false`, retires the bootstrap canvas and removes all page markers.
- PrimeVue CSS is scoped to ToolGlows-owned containers, so host fields with classes such as `.p-inputtext` or `.p-dropdown` remain untouched while page dark mode is off.

## Scope In

- Canonical semantic tokens for third-party dark-page adaptation.
- Graphite/Custom preset selection and non-destructive legacy preference migration.
- Role-based RGB range mapping for neutral, cool, warm and success surfaces.
- Button and control borders, elevation, hover and focus states.
- Oscaro deterministic selectors for filters, conditions, compatibility and product images.
- Rendered proof on Oscaro, Aroma-Zone and a neutral reference page.

## Scope Out

- Redesigning ToolGlows-owned dialogs or toolbar UI.
- Modifying third-party page content, layout, navigation or business semantics.
- Editing vendor PrimeVue or generated distribution sources by hand.
- Claiming universal compatibility across all websites.

## Design Authority And Tokens

- `src/assets/design-tokens.css` remains the canonical source and gains a separate `--tg-page-dark-*` namespace.
- Page adaptation consumes semantic roles rather than raw local color values.
- Graphite is the neutral foundation, desaturated blue is the action role and dark sage is the success role.

## Acceptance Criteria

- [x] White and near-white eligible surfaces map to layered graphite roles.
- [x] Remapped buttons receive distinct rest, hover and keyboard-focus styling.
- [x] Pale-green Compatible controls map to the success role with readable text and border.
- [x] Oscaro filter, conditions button and product images form one coherent palette.
- [ ] Aroma-Zone and a neutral page show no obvious palette regression.
- [x] Legacy custom colors migrate without loss and Graphite becomes the active preset.
- [x] Switching Graphite → Custom restores the saved custom triplet.
- [x] Tests, typecheck, Chrome/Firefox builds, manifest lint and token drift checks pass or have explained warnings.
- [x] ToolGlows interface dark theme cannot recolor host-page PrimeVue fields.
- [x] Removing Dark Mode from loaded tools disables persisted and current page state.

## Proof Path

- Automated mapping and lifecycle tests.
- Browser screenshots and computed-style inspection at representative states.
- Contrast inspection for neutral, action and success roles.
- Design-token drift scan plus project baseline checks.

## Documentation Coherence

Update the design-system authority and dark-mode architecture. No public claims or editorial copy change.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-29 | sg-design | Codex | Created from the approved graphite direction and current rendered evidence. | ready | Implement semantic palette and collect rendered proof. |
| 2026-08-29 | sg-design | Codex | Centralized graphite page tokens, replaced flat color mapping with semantic roles and restored control affordances. | implemented — visual proof pending | Reload the unpacked extension and verify representative pages. |
| 2026-08-29 | sg-design | Codex | Verified Oscaro controls and images plus Aroma-Zone and neutral-page safety after extension reload. Found the saved custom purple canvas overrides the approved graphite direction; the Compatible state was absent from the available page state. | partial rendered proof | Decide how graphite and custom palette preferences coexist, then verify Compatible. |
| 2026-08-29 | sg-design | Codex | Added the approved Graphite/Custom model, non-destructive legacy migration, atomic setting updates and a page-adaptation boundary for the teleported settings dialog. | implemented — proof running | Build, reload and verify both presets in Edge. |
| 2026-08-29 | sg-design | Codex | Repaired stale-value setting handlers, completed automated palette tests and rebuilt Chrome/Firefox successfully. | implemented — rendered proof pending | Reload the unpacked extension and verify preset controls plus reference pages. |
| 2026-08-29 | sg-design | Codex | Verified the rendered Graphite → Custom → Graphite round trip, preservation of the legacy custom triplet, Graphite persistence through a full reload, and Oscaro's bordered conditions control. The available Oscaro state still exposes no Compatible control without a selected vehicle. | validated on available states | Capture the Compatible state when a vehicle-scoped result is available. |
| 2026-08-29 | sg-design | Codex | Corrected the Compatible-state classifier after user evidence showed those controls on the live page: semantic success now wins even when DarkReader has already changed the computed background. Added a focused regression test and rebuilt both targets. | implemented — rendered proof pending | Reload the unpacked extension and inspect a visible Compatible control in the user's vehicle-scoped state. |

## Current Chantier Flow

2026-08-30 regression fix attempt: bundled PrimeVue selectors are constrained to ToolGlows-owned containers, and removing Dark Mode from loaded tools persists deactivation before removal and cleans the runtime DOM. Automated proof passes (41 tests, typecheck, both builds and manifest lint); status remains implemented with browser proof pending.

2026-08-30 browser retest: after the unpacked extension and target page were reloaded, the ToolGlows interface remained dark while page dark mode stayed off; PrimeVue field selectors were scoped, Oscaro fields remained light, and no DarkReader, bootstrap, override or soft marker remained. Status advances to fixed-pending-verify.

2026-08-31 Mondial Relay regression: the prior proof was incomplete because `toolglows-main-styles` still leaked DaisyUI and design-token `:root` rules into the host document. PrimeIcons, main CSS and content CSS are now scoped alongside PrimeVue, with a regression test that rejects unscoped `:root` and `body` selectors while preserving existing ToolGlows ownership. Focused tests, typecheck and both builds pass; rendered proof is pending after extension reload.

- sg-design: active
- readiness: ready
- implementation: complete
- verification: focused Compatible regression suite (8 tests), typecheck, Chrome/Firefox builds and manifest lint pass; the corrected Compatible state awaits rendered proof after extension reload
- delivery: local only
