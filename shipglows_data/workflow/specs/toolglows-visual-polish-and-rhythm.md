---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-09-01"
created_at: "2026-09-01 12:37:37 UTC"
updated: "2026-09-01"
updated_at: "2026-09-01 12:46:28 UTC"
status: complete
source_skill: sg-design
source_model: "Codex"
scope: "visual-polish-spacing-radius-controls"
owner: "Diane"
confidence: high
risk_level: low
security_impact: none
docs_impact: yes
linked_systems:
  - "src/assets/design-tokens.css"
  - "src/assets/base.scss"
  - "src/ui/action-popup"
  - "src/ui/options-page"
  - "src/components/ToolGlowsBar.vue"
depends_on:
  - artifact: shipglows_data/workflow/specs/toolglows-interface-coherence-and-trust.md
    artifact_version: "1.0.0"
    required_status: complete
supersedes: []
evidence:
  - "Operator feedback 2026-09-01: interface coherence is present but spacing and rounding need a beauty pass."
  - "The toolbar-size native select renders with a transparent background; the same component family must be checked globally."
next_step: "Chantier closed; use rendered feedback to choose any future visual direction."
---

# ToolGlows Visual Polish and Rhythm

## User Story

As a ToolGlows user, I want settings and controls to feel spacious, structured and consistently rounded, so the extension looks finished without becoming bulky.

## Outcome Contract

- Popup, options and injected toolbar use a coherent spacing and radius rhythm.
- Major option groups read as distinct raised panels.
- Native selects have an explicit readable surface in both interface themes.
- The toolbar remains compact and unobtrusive.
- No navigation, persistence, permission or product behavior changes.

## Scope In

- Canonical spacing, radius and panel tokens.
- Popup and options page shells, sections, actions, alerts and form controls.
- Toolbar settings rows, tool cards and dropdown surface styling.
- Global verification of native select and maintained dropdown backgrounds.
- Responsive, zoom, focus, contrast and reduced-motion preservation.

## Scope Out

- New palette, typography, brand identity or navigation.
- Experimental module redesigns.
- New dependencies, permissions or browser APIs.

## Acceptance Criteria

- [x] Popup and options surfaces have intentional outer and inner spacing.
- [x] Section, control and floating-shell radii follow canonical roles.
- [x] Toolbar-size and interface-theme selects resolve to opaque readable surfaces.
- [x] Other native selects and PrimeVue dropdowns do not retain the same transparent-background defect.
- [x] Narrow width and 200% zoom do not introduce horizontal overflow.
- [x] Light and dark rendered proof passes for representative surfaces.
- [x] Changed-path token scan, focused tests, full tests, typecheck and Chrome/Firefox builds pass.
- [x] Design-system authority and changelog remain aligned.

## Proof Strategy

- Evidence-first rendered comparison in isolated Edge.
- Source-wide selector-family inspection plus resolved-style checks.
- Changed-path token drift scan and project validation baseline.

## Execution Batches

### Batch 1 — Canonical finish

- Add reusable spacing, panel radius, field surface and panel border/shadow roles.
- Apply them to popup, options and toolbar settings surfaces.

### Batch 2 — Proof and delivery

- Verify native select and PrimeVue dropdown backgrounds globally.
- Run rendered, responsive, token and build proofs.
- Align documentation, close, commit and push to `origin/main`.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-01 12:37 UTC | sg-design | Codex | Created the approved visual-polish contract including the global selector-background check. | ready | Implement Batch 1. |
| 2026-09-01 12:46 UTC | sg-development | Codex | Applied canonical spacing, panel radii and selector surfaces; repaired shared-header reflow discovered by zoom proof. | verified | Persist the milestone and close delivery. |
| 2026-09-01 12:46 UTC | sg-design | Codex | Delivered the verified visual-polish milestone to `origin/main` in commit `8e23e62`. | complete | Chantier closed. |

## Current Chantier Flow

- sg-design: complete
- readiness: ready
- implementation: complete
- verification: passed — 82 tests, typecheck, Chrome/Firefox builds, manifest lint, drift scan and isolated Edge proof
- delivery: pushed to `origin/main` — `8e23e62`
