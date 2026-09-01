---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.9.0"
project: "toolglows"
created: "2026-09-01"
created_at: "2026-09-01 12:55:59 UTC"
updated: "2026-09-01"
updated_at: "2026-09-01 13:06:00 UTC"
status: verified
source_skill: sg-design
source_model: "Codex"
scope: "shared-dialog-shell-and-tool-settings"
owner: "Diane"
confidence: high
risk_level: low
security_impact: none
docs_impact: yes
linked_systems:
  - "src/components/ToolGlowsDialog.vue"
  - "src/assets/main.css"
  - "src/assets/design-tokens.css"
depends_on:
  - artifact: shipglows_data/workflow/specs/toolglows-visual-polish-and-rhythm.md
    artifact_version: "1.0.0"
    required_status: complete
supersedes: []
evidence:
  - "Operator feedback 2026-09-01: the main settings modal and each managed-tool modal still lack margins and radii."
  - "All maintained tool dialogs consume the shared ToolGlowsDialog wrapper, whose global styling currently defines only an outer radius."
next_step: "Persist the verified dialog-shell milestone and close delivery."
---

# ToolGlows Dialog Shell Polish

## User Story

As a ToolGlows user, I want every settings dialog to have a structured shell and readable groups, so tool configuration feels as finished as the rest of the extension.

## Outcome Contract

- One shared shell owns dialog border, radius, elevation, header, content and footer spacing.
- Common tool-setting groups receive consistent raised-section treatment.
- Specialized dialog sizes and all PrimeVue focus, close and stacking behavior remain intact.
- Nested dialogs retain clear visual hierarchy.

## Scope In

- Shared ToolGlows dialog shell and representative setting-group selectors.
- Main toolbar settings plus dark mode, reader, OCR and quick-action proof states.
- Light/dark, narrow, zoom, focus, close and stacking proof.

## Scope Out

- Tool behavior, persistence, navigation or field semantics.
- Dialog-size redesign and experimental feature redesign.
- PrimeVue source changes.

## Acceptance Criteria

- [x] Every shared dialog has visible outer radius, border and elevation.
- [x] Header, content and footer have intentional spacing and separation.
- [x] Common settings groups have internal spacing, border and section radius.
- [x] Main and representative tool dialogs remain usable in light and dark themes.
- [x] Narrow width and 200% zoom do not create horizontal clipping.
- [x] Escape, close button, focus and nested stacking remain operational.
- [x] Token scan, tests, typecheck and Chrome/Firefox builds pass.
- [x] Technical authority and changelog are aligned.

## Proof Strategy

- Rendered Edge inspection of the shared shell and representative tool dialogs.
- Focused contract test for shared styling ownership.
- Changed-path token scan and project validation baseline.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-01 12:55 UTC | sg-design | Codex | Created the approved shared-dialog finish contract from operator feedback and wrapper evidence. | ready | Implement the shared shell. |
| 2026-09-01 13:06 UTC | sg-development | Codex | Added shared shell spacing and finish, first-level setting panels, and a root-style safeguard against positioned-dialog flattening. | verified | Persist the milestone and close delivery. |

## Current Chantier Flow

- sg-design: verified
- readiness: ready
- implementation: complete
- verification: passed — 84 tests, typecheck, Chrome/Firefox builds, drift scan and isolated Edge dialog proof
- delivery: pending
