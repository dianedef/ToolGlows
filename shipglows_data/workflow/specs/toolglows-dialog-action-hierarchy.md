---
artifact: spec
metadata_schema_version: '1.0'
artifact_version: '1.0.0'
project: 'toolglows'
created: '2026-09-01'
updated: '2026-09-01'
status: active
source_skill: sg-design
source_model: 'Codex'
scope: 'dialog-action-hierarchy'
owner: 'Diane'
confidence: high
risk_level: low
security_impact: none
docs_impact: yes
linked_systems:
  - 'src/assets/design-tokens.css'
  - 'src/assets/main.css'
  - 'src/components/ToolGlowsDialog.vue'
  - 'src/components/WordCounterPopup.vue'
  - 'shipglows_data/technical/design-system-authority.md'
depends_on:
  - artifact: shipglows_data/workflow/specs/toolglows-dialog-shell-polish.md
    artifact_version: '1.0.0'
    required_status: complete
supersedes: []
evidence:
  - 'Operator approval 2026-09-01: unify modal action width, order, spacing and primary/secondary hierarchy.'
next_step: 'Verify the shared footer hierarchy in rendered light, dark and narrow states.'
---

# ToolGlows Dialog Action Hierarchy

## User Story

As a ToolGlows user, I want modal actions to have a predictable hierarchy, so I can distinguish dismissal from the main action at a glance.

## Outcome Contract

- Secondary actions anchor the start edge and primary actions anchor the end edge.
- Button sizing and spacing remain consistent across tool dialogs.
- Narrow dialogs stack actions without changing their semantic or keyboard order.

## Scope In

- The nine concrete footer instances across six tool components, governed by the shared `ToolGlowsDialog` shell.
- Shared sizing, spacing and responsive composition tokens and rules.
- Promotion of the word-counter copy action to the footer's visual primary action.

## Scope Out

- Button labels, handlers, state transitions, dialog content, internal list actions, permissions or dependencies.

## Acceptance Criteria

- [ ] All concrete dialog footers consume the shared composition without local wrappers.
- [ ] Secondary-first/primary-last DOM and keyboard order remains intact.
- [ ] Actions meet the shared 44px minimum target and a consistent minimum width.
- [ ] Narrow viewports stack actions at full width without overflow.
- [ ] Representative light, dark and narrow rendered proof passes.
- [ ] Focused tests, typecheck, Chrome/Firefox builds, manifest lint and design drift checks pass.
- [ ] Design-system authority and changelog are aligned.

## Proof Strategy

- Source-contract test covering all nine footer instances and the shared CSS rules.
- Rendered geometry and focus-order checks in representative extension dialogs.
- Project validation baseline and changed-path token scan.

## Execution Batches

### Batch 1 — Shared hierarchy

- Add tokenized action sizing and shared desktop/narrow footer composition.
- Remove the sole local footer wrapper that bypasses direct shared ownership.

### Batch 2 — Proof and delivery

- Verify themes, widths and focus order, run project checks, align documentation and deliver to `origin/main`.

## Skill Run History

| Date UTC             | Skill     | Model | Action                                                                                             | Result | Next step                     |
| -------------------- | --------- | ----- | -------------------------------------------------------------------------------------------------- | ------ | ----------------------------- |
| 2026-09-01 14:26 UTC | sg-design | Codex | Formalized the approved dialog-action hierarchy across nine concrete footers and the shared shell. | ready  | Implement shared composition. |
| 2026-09-01 14:34 UTC | sg-development | Codex | Added tokenized footer sizing, desktop separation, narrow stacking and direct word-counter actions. | verified | Complete unpacked-Chrome rendered proof. |

## Current Chantier Flow

- sg-design: active
- readiness: ready
- implementation: complete
- verification: partial — 89 tests, typecheck, Chrome/Firefox builds and manifest lint pass; unpacked-Chrome rendering remains pending because only Edge browser control was exposed
- delivery: pending
