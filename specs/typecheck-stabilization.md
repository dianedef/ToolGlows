---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
created_at: "2026-05-04 05:30:29 UTC"
updated: "2026-05-04"
updated_at: "2026-05-04 05:33:59 UTC"
status: shipped
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "bug"
owner: "operator"
user_story: "As the browser-extension maintainer, I want `pnpm run typecheck` to pass without weakening runtime behavior, so dependency-security closure is not blocked by stale TypeScript errors."
risk_level: "medium"
security_impact: "none"
docs_impact: "none"
linked_systems:
  - "pnpm run typecheck"
  - "src/background/index.ts"
  - "src/components"
  - "src/composables"
  - "src/stores"
  - "src/types"
depends_on:
  - artifact: "specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: "shipped"
supersedes: []
evidence:
  - "`pnpm run typecheck` fails after dependency-security ship on background message payload typing, component/store mismatches, duplicate vite env declarations, and stale Vue template bindings."
  - "`pnpm run typecheck` exits 0 after the stabilization pass."
  - "`pnpm run build` exits 0 for Chrome and Firefox after the stabilization pass."
next_step: "none"
---

# Title

Typecheck Stabilization

# Status

Shipped. The failure was broad enough to track as a separate chantier, but the fixes stayed mechanical: TypeScript/runtime-safety alignment rather than product behavior changes.

# User Story

As the browser-extension maintainer, I want `pnpm run typecheck` to pass without weakening runtime behavior, so dependency-security closure is not blocked by stale TypeScript errors.

# Minimal Behavior Contract

The project should typecheck cleanly while preserving the current extension behavior. Fixes may add missing types, defaults, guards, and safe casts where the code already assumes a shape. The easy edge case to miss is hiding real runtime uncertainty with `any`; use narrow guards or explicit defaults when values come from browser storage, DOM, or template slot data.

# Success Behavior

`pnpm run typecheck` exits 0. Existing build and high-audit gates remain unaffected by the type-only corrections.

# Error Behavior

If a type error exposes ambiguous product behavior, stop and leave it as a documented follow-up instead of inventing behavior. If a change requires UI/feature semantics beyond type stabilization, update this spec before continuing.

# Problem

The dependency-security chantier is shipped, but global TypeScript validation still fails across multiple source areas. These failures reduce confidence in future dependency and build work.

# Solution

Apply targeted, mechanical TypeScript corrections: initialize optional state used by templates, align component controls with composable/store contracts, add safe guards for unknown browser-storage payloads and unknown caught errors, remove duplicate declaration files, and fix stale Composition API usage.

# Scope In

- Background message payload guards for dark-mode style injection.
- Component/template fixes for advanced search, drag-open, links explorer, minimal Twitter, social analysis, and shortcuts.
- Store/composable fixes for browser storage usage, settings shape, links explorer, rich copy, social analysis, Better Gmail, and feed eradicator.
- Remove duplicate `src/types/vite-env.d copy.ts`.
- Run `pnpm run typecheck` after each meaningful batch.

# Scope Out

- Feature redesigns.
- PrimeVue migration.
- Dependency upgrades.
- Audit/security remediation unrelated to typecheck.
- Manual browser QA beyond build/typecheck sanity.

# Constraints

- Prefer precise types and guards over blanket `any`.
- Preserve current UI labels and existing behavior where intent is clear.
- Do not stage unrelated pre-existing generated type changes unless a command regenerates them as part of this chantier.

# Dependencies

- Vue 3 Composition API.
- Pinia stores.
- Chrome extension APIs and DOM APIs.
- Fresh external docs not needed; the fixes use local TypeScript and code contracts.

# Invariants

- `pnpm run build` must still pass after typecheck corrections.
- Browser storage defaults must remain JSON-serializable.
- Generated declaration duplication must not remain in the TypeScript program.

# Links & Consequences

- Type changes in stores affect components that read settings/options via refs.
- Removing duplicate declaration files affects global build constants only by eliminating redeclaration, not by changing the canonical declarations.
- DOM element casts must stay local to known elements before using `.style`.

# Documentation Coherence

No user-facing documentation changes are expected. If validation commands or workflow claims change, update `docs/developer-guide.md` and `docs/technical/code-docs-map.md`.

# Edge Cases

- Template slot data is typed loosely by Vue/PrimeVue and may require typed records for label maps.
- `catch (error)` is `unknown` and needs explicit narrowing before reading `.message`.
- Optional settings loaded from storage may be absent on first run and must have defaults before template binding.

# Implementation Tasks

- [x] Fix storage and background payload typing.
- [x] Align component templates with their store/composable contracts.
- [x] Remove duplicate global declarations.
- [x] Rerun `pnpm run typecheck` and handle remaining mechanical errors.
- [x] Run `pnpm run build` if typecheck passes.

# Acceptance Criteria

- [x] `pnpm run typecheck` exits 0.
- [x] No broad `any` casts are introduced where a narrow type or guard is practical.
- [x] `pnpm run build` still exits 0 after code changes.
- [x] Remaining unrelated dirty files are not included in this chantier unless intentionally changed.

# Test Strategy

- `pnpm run typecheck`
- `pnpm run build`
- Optional targeted `git diff --check`

# Risks

- Some current type errors may represent unfinished features rather than stale types.
- Fixing template/store mismatches can accidentally change defaults if done carelessly.

# Execution Notes

- Start from the exact errors emitted by `pnpm run typecheck` on 2026-05-04.
- Batch fixes by file group and rerun typecheck after each broad pass.

# Open Questions

None.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-04 | sf-spec | GPT-5 Codex | Created typecheck stabilization chantier after dependency-security ship left broad source type errors. | ready | `/sf-start Typecheck Stabilization` |
| 2026-05-04 | sf-start | GPT-5 Codex | Applied mechanical TypeScript fixes across background, components, composables, stores, and duplicate declarations. | implemented | `/sf-end Typecheck Stabilization` |
| 2026-05-04 | sf-end | GPT-5 Codex | Closed the typecheck stabilization chantier after typecheck and build passed. | closed | `/sf-ship Typecheck Stabilization` |
| 2026-05-04 | sf-ship | GPT-5 Codex | Shipped the typecheck stabilization changes. | shipped | `none` |

# Current Chantier Flow

- sf-spec: done
- sf-ready: ready
- sf-start: done
- sf-verify: done
- sf-end: closed
- sf-ship: shipped

Next command: none
