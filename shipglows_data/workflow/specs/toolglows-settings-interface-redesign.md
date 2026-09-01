---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "toolglows"
created: "2026-09-01"
updated: "2026-09-01"
status: partial
source_skill: sg-design
source_model: "Codex"
scope: "settings-interface-redesign"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "src/assets/design-tokens.css"
  - "src/assets/main.css"
  - "src/components/ToolGlowsDialog.vue"
  - "src/components/ToolGlowsBar.vue"
  - "src/components/*Control.vue"
  - "src/ui/options-page/pages/index.vue"
  - "src/ui/options/pages/index.vue"
  - "shipglows_data/technical/design-system-authority.md"
depends_on:
  - artifact: shipglows_data/workflow/specs/toolglows-settings-control-rhythm.md
    artifact_version: "1.0.0"
    required_status: complete
supersedes: []
evidence:
  - "Operator approval 2026-09-01: replace piecemeal settings fixes with a precise, structured redesign across settings surfaces."
  - "UI audit 2026-09-01: 20 dialog consumers, 23 legacy-theme consumers, duplicated options implementations and blanket field cardification."
  - "Edge observation 2026-09-01: circular compatibility aliases invalidated teleported dialog surface tokens and made modal backgrounds transparent."
next_step: "Collect operator-rendered light, dark and narrow proof in the loaded Edge extension after the modal-boundary repair."
---

# ToolGlows Settings Interface Redesign

## User Story

As a ToolGlows user, I want every settings surface to follow one calm and predictable visual hierarchy, so I can understand and change preferences without fighting nested cards, heavy borders or inconsistent controls.

## Outcome Contract

- Settings use one composition grammar: shell, section, row, control and state.
- A border and raised surface identify a meaningful section or selectable item, not every field.
- Teleported product dialogs receive ToolGlows semantic roles directly while the scoped PrimeVue provider supplies their underlying light or dark palette.
- The injected quick-settings dialog and full options page remain purposefully different in scope but visually related.
- Existing state, persistence, permissions and tool behavior remain unchanged.

## Scope In

- Shared dialog composition and semantic compatibility boundary for all 20 dialog consumers.
- Main injected settings hierarchy, tool activation grid and destructive action placement.
- Both options-page implementations and their native control styling.
- Shared hover, focus, border, spacing, radius and responsive rules.
- Representative light, dark and narrow visual proof plus keyboard review.

## Scope Out

- Tool business logic, settings storage schema, permissions, manifests, new dependencies or vendor source edits.
- Public positioning, onboarding copy or a new brand direction.

## Acceptance Criteria

- [x] Simple fields no longer receive an automatic nested card surface.
- [x] Meaningful groups and selectable tool cards retain one clear surface each.
- [x] Teleported settings dialogs receive semantic ToolGlows tokens without circular provider aliases.
- [x] Checkbox, select, slider, numeric and action rows share consistent sizing and focus treatment.
- [x] Quick settings expose clear General, Site and Tools sections with the destructive action visually separated.
- [x] Both options implementations use the same section, row and control grammar.
- [x] Labels and accessible control relationships are valid; DOM/keyboard order remains logical.
- [x] Normal and narrow layouts use a tokenized bounded dialog and responsive row reflow.
- [x] Focused contracts, full tests, typecheck, Chrome/Firefox builds, manifest lint and drift checks pass.
- [ ] Rendered light/dark/narrow proof is collected or the remaining manual proof is reported explicitly.
- [x] Design-system authority and changelog are aligned.

## Proof Strategy

- Evidence-first UI implementation backed by source-contract tests over all dialog consumers.
- Full design-system drift scan and automated project baseline.
- Rendered browser geometry, theme, hover and focus inspection when the unpacked extension target is callable.
- Rendered Edge validation remains the explicit final proof after the modal-boundary regression repair.

## Execution Batches

### Batch 1 — Shared hierarchy

- Expose semantic tokens directly on dialog-local teleport boundaries and keep provider variables one-way.
- Remove blanket field cardification while retaining meaningful grouped sections.

### Batch 2 — Primary settings surfaces

- Restructure the injected quick settings into semantic sections.
- Align both options implementations with the same composition classes and control sizing.

### Batch 3 — Proof and delivery

- Add exhaustive source contracts, run project and design checks, align documentation and deliver exact owned paths to `origin/main`.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-01 15:40 UTC | sg-design | Codex | Audited the settings system and identified competing surfaces, duplicate options grammars and legacy theme leakage. | ready | Execute the approved redesign. |
| 2026-09-01 15:42 UTC | sg-development | Codex | Opened the approved implementation with an evidence-first UI proof path. | in progress | Implement shared hierarchy. |
| 2026-09-01 16:12 UTC | sg-design + sg-development | Codex | Migrated shared and primary settings surfaces, added source contracts and completed automated validation. | partial | Collect operator-rendered proof in Chrome. |
| 2026-09-01 16:32 UTC | sg-bug | Codex | Removed circular modal aliases, exposed tokens directly on teleported boundaries and added a scoped-CSS regression contract. | partial | Collect operator-rendered proof in Edge. |

## Current Chantier Flow

- sg-design: partial
- readiness: ready
- implementation: complete
- verification: partial — rendered Edge proof after the modal-boundary repair remains pending
- delivery: in progress
