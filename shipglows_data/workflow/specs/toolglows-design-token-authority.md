---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "toolglows"
created: "2026-08-28"
created_at: "2026-08-28 18:56:00 UTC"
updated: "2026-08-28"
updated_at: "2026-08-28 18:56:00 UTC"
status: superseded
source_skill: sg-design
source_model: "Codex"
scope: "design-system-token-migration"
owner: "Diane"
confidence: high
user_story: "As a ToolGlows user, I want light and dark interface states to use coherent theme roles, so selected, hovered, focused and element-picking states remain legible and unsurprising."
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "content-script UI"
  - "PrimeVue light and dark themes"
  - "component and composable styles"
  - "Edge unpacked extension"
depends_on: []
supersedes: []
superseded_by:
  - "shipglows_data/workflow/specs/toolglows-interface-coherence-and-trust.md"
evidence:
  - "Design-system audit found 578 hardcoded visual-value findings and no declared project token authority."
  - "Edge inspection showed selected checkbox styling overridden by global styles."
  - "Element picker uses red/orange highlight values independent of the active theme."
next_step: "Continue remaining theme, persistence and interface-trust work in the successor chantier."
---

# ToolGlows Design Token Authority

## User Story

As a ToolGlows user, I want light and dark interface states to use coherent theme roles, so selected, hovered, focused and element-picking states remain legible and unsurprising.

## Behavior Contract

- Light theme uses light surfaces for hover and selection with readable foregrounds; it never presents a dark-looking highlight merely because a component has a custom style.
- Dark theme resolves the same semantic roles from its own theme values.
- Element selection uses semantic hover and selection overlays, not fixed red/orange colors.
- Existing tool behavior, permissions, and stored settings remain unchanged.

## Scope In

- Declare the canonical token source and semantic light/dark interaction roles.
- Migrate content-script root styles and active/hover/focus/selection states.
- Replace direct element-picker highlight colors with theme-derived roles.
- Migrate remaining project-owned visual literals in coherent component/composable batches.
- Add a project-owned drift configuration for deliberate platform/vendor exceptions.
- Verify in Edge plus typecheck, tests, Chrome/Firefox builds and drift scan.

## Scope Out

- Vendor PrimeVue theme source files.
- New branding, palette selection, icons, dependencies, permissions, and tool behavior.
- Third-party page styles outside ToolGlows-owned overlays.

## Authority And Invariants

- `src/assets/design-tokens.css` is the canonical CSS token authority for extension UI; its semantic custom properties are consumed by `main.css`, content-script UI and components.
- Theme files supply base PrimeVue values; ToolGlows owns only semantic aliases and overrides.
- No new component or composable visual literal is permitted outside the canonical token source unless registered as a deliberate exception.
- Focus visibility, keyboard behavior, contrast and readable selected state are preserved in both themes.

## Implementation Tasks

- [x] Create the design-system authority record and semantic token aliases.
- [x] Repair global style precedence and migrate hover, selected, focus and scrollbar roles.
- [x] Migrate the element selector and other runtime-injected visual styles.
- [ ] Migrate component/composable style literals in coherent batches.
- [ ] Add targeted configuration/tests and run visual, build and drift proof.

## Acceptance Criteria

- [ ] The project has one declared token authority and a documented consumption path.
- [ ] Edge renders selected, hover, focus and element-picker states coherently in light and dark theme contexts.
- [ ] Project-owned drift findings are eliminated or documented as intentional exceptions.
- [ ] Typecheck, tests, Chrome and Firefox builds pass.

## Risks And Edge Cases

- Global content-script selectors can override PrimeVue theme states; specificity must be reduced or semantic overrides kept exact.
- External pages can define their own CSS variables, so ToolGlows tokens must be scoped to the extension root.
- Programmatic element highlighting must restore the page's original inline styles on exit.

## Documentation Coherence

Update the design-system authority record and this spec. No public copy is changed.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-28 18:56 UTC | sg-design | Codex | Created from the accepted full token-remediation direction. | active | Establish authority and migrate visible interaction states. |
| 2026-08-28 19:16 UTC | sg-design | Codex | Established semantic token authority, repaired active-state precedence and migrated the element selector. | implemented — first batch | Continue component and composable migration. |
| 2026-08-28 19:35 UTC | sg-design | Codex | Replaced stale content-script overrides and migrated Auto Copy, OCR and Drag Open runtime highlights to semantic tokens. | implemented — runtime batch | Verify in Edge, then migrate components and remaining composables. |
| 2026-08-28 20:29 UTC | sg-design | Codex | Added the persisted ToolGlows light/dark interface switch and tested the change in Edge. | implemented — interface theme switch | Resolve remaining drift findings. |
| 2026-08-29 10:04 UTC | 006-sg-design | Codex | Started the approved shared-dialog system: canonical modal layering, stacked overlays and toolbar-matched shell radius. | in progress | Implement the shared wrapper, migrate dialogs and collect automated plus rendered proof. |
| 2026-08-29 15:29 UTC | 006-sg-design | Codex | Migrated all 28 product dialog instances to one wrapper, restored automatic modal stacking above the toolbar and centralized the shared shell radius. | implemented — rendered proof pending | Reload the unpacked Edge extension, then verify stacked dialogs in light and dark modes. |
| 2026-08-29 15:34 UTC | 006-sg-design | Codex | Verified two stacked dialogs above the toolbar in Edge, with identical 48px shell radii in light and dark themes; restored the original dark and unpinned preferences afterward. | validated — shared dialog system | Continue the remaining pre-existing token-drift remediation separately. |
| 2026-09-01 11:59 UTC | 006-sg-design | Codex | Audited design-token and interface coherence; identified split theme authority, active drift and trust-breaking interface paths. | superseded by expanded ready contract | Continue in ToolGlows Interface Coherence and Trust. |

## Current Chantier Flow

- sg-design: superseded
- readiness: ready
- implementation: shared-dialog migration complete
- verification: shared-dialog system validated in stacked light/dark Edge states; 31 tests, typecheck, Chrome/Firefox builds and manifest lint pass; drift scan still reports pre-existing project findings
- delivery: succeeded by the interface-coherence chantier
