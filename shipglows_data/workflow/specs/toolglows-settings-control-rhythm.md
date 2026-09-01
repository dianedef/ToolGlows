---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-09-01"
updated: "2026-09-01"
status: complete
source_skill: sg-design
source_model: "Codex"
scope: "settings-control-rhythm"
owner: "Diane"
confidence: high
risk_level: low
security_impact: none
docs_impact: yes
linked_systems:
  - "src/assets/main.css"
  - "src/components/"
  - "shipglows_data/technical/design-system-authority.md"
depends_on:
  - artifact: shipglows_data/workflow/specs/toolglows-visual-polish-and-rhythm.md
    artifact_version: "1.0.0"
    required_status: complete
supersedes: []
evidence:
  - "Operator approval 2026-09-01: harmonize numeric fields, sliders and toggles across all 19 settings surfaces."
next_step: "Chantier closed; use rendered feedback to select the next bounded visual improvement."
---

# ToolGlows Settings Control Rhythm

## User Story

As a ToolGlows user, I want settings controls to follow one predictable rhythm, so every tool dialog is easy to scan and adjust.

## Outcome Contract

- Toggle labels align on the left and their maintained controls align on the right.
- Sliders keep a readable label/value header and a full-width adjustment track.
- Numeric settings align their label and input without changing stored values or behavior.
- The system remains compact, responsive and consistent in light and dark themes.

## Scope In

- The 19 component surfaces containing PrimeVue checkboxes, sliders or numeric controls.
- Shared tokenized dialog composition rules and removal of conflicting local layout declarations where required.
- Representative normal-width, narrow-width, light-theme and dark-theme browser proof.

## Scope Out

- Control replacement, new dependencies, persistence changes, permissions or business behavior.
- Palette, typography, navigation or non-settings redesign.

## Acceptance Criteria

- [x] Toggle rows use a consistent full-width label-left/control-right composition.
- [x] Slider rows expose a consistent label/value header and full-width track where markup provides those elements.
- [x] Numeric rows remain readable and aligned without overflow.
- [x] Maintained PrimeVue semantics, focus behavior and 44px control targets remain intact.
- [x] Representative light, dark and narrow rendered proof passes.
- [x] Focused tests, typecheck, Chrome/Firefox builds, manifest lint and design drift checks pass.
- [x] Design-system authority and changelog are aligned.

## Proof Strategy

- Source inventory covering every component with a checkbox, slider or numeric control.
- Rendered geometry and screenshots from representative extension settings/dialog states.
- Changed-path token scan and the project validation baseline.

## Execution Batches

### Batch 1 — Shared composition

- Add shared toggle, slider and numeric-row composition through the canonical stylesheet.
- Resolve only local cascade conflicts that prevent shared consumption.

### Batch 2 — Proof and delivery

- Verify representative themes and widths, run project checks, align documentation and deliver to `origin/main`.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-01 13:56 UTC | sg-design | Codex | Formalized the approved 19-surface settings-control rhythm contract. | ready | Implement shared composition. |
| 2026-09-01 14:17 UTC | sg-development | Codex | Added shared CSS-first toggle, slider and numeric composition and corrected the teleported-dialog cascade through rendered proof. | verified | Persist and close delivery. |
| 2026-09-01 14:17 UTC | sg-design | Codex | Verified the approved settings-control rhythm across representative themes and widths. | complete | Deliver to `origin/main`. |

## Current Chantier Flow

- sg-design: complete
- readiness: ready
- implementation: complete
- verification: passed — 87 tests, typecheck, Chrome/Firefox builds, manifest lint, drift scan and injected-dialog proof
- delivery: pending
