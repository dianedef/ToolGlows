---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.3.0"
project: "toolglows"
created: "2026-08-31"
created_at: "2026-08-31 21:00:36 UTC"
updated: "2026-08-31"
updated_at: "2026-09-01 10:47:08 UTC"
status: verified
source_skill: sg-development
source_model: "Codex"
scope: "reader-mode-excellence"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "src/components/ReaderModeControl.vue"
  - "src/composables/useReaderMode.ts"
  - "src/stores/readerMode.ts"
  - "src/components/ToolGlowsBar.vue"
  - "src/assets/design-tokens.css"
  - "tests/"
  - "shipglows_data/technical/architecture.md"
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "2.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: active
supersedes: []
evidence:
  - "The Reader Mode settings panel never calls useReaderMode or another page-reading runtime."
  - "The store and composable expose incompatible option models."
  - "The current composable replaces document.body and cannot reliably preserve live page state, event listeners, focus, or accumulated styles."
  - "Edge proof on Wikipedia confirms an opaque centered 800 px surface, 36 px title, theme/content preferences, keyboard exit, host-page preservation and focus restoration."
  - "Unsupported-page Edge proof preserves Example Domain and exposes the accessible extraction error without locking scroll."
  - "Typecheck, 73 tests, Chrome and Firefox production builds pass; Firefox manifest lint reports 0 errors and 0 notices."
next_step: "Deliver the verified exact-scope commit to origin/main."
---

# Reader Mode Excellence

## Status

Verified and ready for delivery.

## User Story

As a ToolGlows user reading an article, I can enter a calm, configurable reading surface and leave it at any time with the original page intact, so I can focus without losing context or trusting a destructive page transformation.

## Minimal Behavior Contract

When the user opens Reader Mode and activates reading on a supported article, ToolGlows extracts and sanitizes the article, displays it in an isolated full-page reading surface, applies the persisted preferences, and exposes an obvious exit action. If no useful article can be extracted, ToolGlows keeps the page unchanged and explains the failure. Repeated entry, preference changes, Escape, toolbar closure, and exit must never accumulate overlays or damage the host page.

## Success Behavior

- The visible article contains its title, byline when present, semantic text, safe links, and images when enabled.
- The user can change font family, text size, line height, content width, theme, image visibility, and displayed link URLs with immediate visible feedback.
- Focus moves into the reader surface on activation and returns to the initiating control on exit when that control still exists.
- The original page DOM, scroll position, focus target, and ToolGlows toolbar remain available after exit.
- Reader state is per-tab runtime state; preferences persist through synchronized extension storage.

## Error Behavior

- Extraction or sanitization failure leaves the host page untouched and presents a concise accessible error in the Reader Mode panel.
- Invalid stored preference values are normalized to safe supported defaults rather than applied to CSS.
- A second activation while parsing is ignored or disabled; it never creates concurrent readers.
- If the host page removes the reader mount unexpectedly, cleanup remains idempotent and the next activation starts cleanly.

## Problem

The current visible panel is disconnected from the reading composable. The dormant implementation uses destructive body replacement, holds two incompatible settings models, contains contradictory image defaults, provides no failure state, and has no focused behavioral proof.

## Solution

Create one store-owned reader lifecycle backed by a pure extraction/sanitization layer and an isolated DOM surface mounted beside the host page. Keep the toolbar and original document in place, suppress host-page presentation reversibly while reading, and restore every ToolGlows-owned mutation on exit. Bind the existing panel to this lifecycle and consume the canonical ToolGlows design tokens.

## Scope In

- Reader extraction, sanitization, isolated rendering, cleanup, focus, and scroll restoration.
- One typed persisted preference contract with validation and migration from the current storage shape.
- Reader panel activation, live settings, progress/error states, and explicit exit.
- Responsive typography and semantic reader styling through existing or narrowly added design tokens.
- Focused automated tests and unpacked Edge proof on representative supported and unsupported pages.
- Chrome and Firefox production builds and Firefox manifest lint.

## Scope Out

- New browser permissions, background messages, remote services, analytics, accounts, paywalls, text-to-speech, annotations, translations, or content export.
- Reproducing native browser Reader View chrome or overriding site authentication/access controls.
- Automatic activation, per-site parsing rules, cross-tab synchronization of active state, or store publication.
- Editing generated `dist/` or vendored PrimeVue assets by hand.

## Constraints

- Preserve Chrome and Firefox support and the top-level content-script architecture.
- Never transmit page content or persist extracted article content.
- Never execute scripts, event attributes, unsafe URLs, embedded documents, forms, media players, or active SVG from extracted HTML.
- Preserve unrelated dirty work, particularly the active dark-mode files.
- Visual values resolve through `src/assets/design-tokens.css`; existing dirty token changes must not be overwritten.

## Test Contract

- Surface/profile: unpacked production Chrome build in Microsoft Edge, top-level ordinary web pages.
- Automated: extraction and sanitizer cases, stored preference normalization, lifecycle idempotence, settings binding, page-state restoration, and toolbar integration.
- Browser order: supported Wikipedia article; image/link-rich editorial article; unsupported page; repeated activation/exit; live themes/settings; keyboard/focus; original-page restoration.
- Cross-browser packaging: typecheck, full Vitest, Chrome build, Firefox build, Firefox manifest lint.
- Exception: Firefox rendered behavior is not claimed without a dedicated Firefox browser run; its compatibility claim remains build and shared-code evidence only.

## Dependencies

- `@mozilla/readability` remains the only article-extraction dependency.
- Vue, Pinia, PrimeVue, ToolGlowsDialog, and browser synchronized storage remain existing authorities.
- Edge extension loading remains manual from `dist/chrome` under the project environment contract.

## Invariants

- No new permission or privileged browser API.
- No page content leaves the tab.
- ToolGlows UI remains usable while Reader Mode is active.
- Exit is always visible, keyboard reachable, and idempotent.
- Failure never replaces or hides the host page.
- The page dark-mode runtime and reader theme remain independent.

## Links & Consequences

- Upstream product promise: configurable reader mode within the stable reading utility family.
- Toolbar interaction consequence: Reader Mode remains a panel tool; opening settings is distinct from activating reading.
- Design consequence: reader presentation consumes the canonical extension token authority without styling the host document globally.
- Documentation consequence: architecture must describe the non-destructive lifecycle after implementation; public claims remain unchanged.

## Documentation Coherence

Update `shipglows_data/technical/architecture.md` only if the existing unrelated dirty edit can be preserved safely; otherwise record the documentation update as delivery-pending rather than mixing ownership. Update this spec throughout the lifecycle. README and product positioning require no claim change.

## Edge Cases

- Empty document, tiny content, or Readability returning null.
- One paragraph, many sections, tables, lists, figures, relative links, lazy images, RTL language, and missing metadata.
- Unsafe `javascript:`, `blob:`, non-image data URLs, active SVG, inline handlers, forms, iframes, video, audio, and unknown tags.
- Rapid repeated activation, Escape during parsing, preference change while active, mount removal, navigation, and extension teardown.
- Extremely narrow/wide viewport, zoom, long unbroken strings, oversized images, print, and reduced motion.

## ZOMBIES Coverage

- Z: no extractable article keeps the page visible and reports failure.
- O: one minimal paragraph produces one stable reader surface.
- M: complex article content and repeated lifecycle transitions preserve order and cleanup.
- B: preference values below/at/above supported limits normalize safely; responsive widths remain usable.
- I: component, store, extraction, DOM, storage, and host-page boundaries have one owner each.
- E: parser/storage/DOM failures remain recoverable and non-destructive.
- S: one overlay lifecycle and one preference contract replace the duplicated dormant models.

## OWASP Security Gate

- Categories considered: A05 Injection, A06 Insecure Design, A08 Software or Data Integrity Failures, A10 Mishandling of Exceptional Conditions.
- Trust boundary: arbitrary third-party page DOM enters the local extraction and rendering path; ToolGlows output returns only to the same tab.
- ASVS mapping: not claimed; this client-only extension feature uses focused contextual sanitization and failure tests rather than a broad compliance assertion.
- Proof: allowlisted nodes/attributes/protocols, active-content rejection, no `innerHTML` insertion into the live document, and browser restoration tests.
- Residual gap: browser parsing differences remain bounded by the shared DOM APIs and Chrome/Firefox builds; Firefox visual proof remains separate.

## Implementation Tasks

1. Replace the dormant dual-model composable with testable extraction, sanitization, preference normalization, and lifecycle modules; validate with focused Vitest cases.
2. Make the Pinia store the single owner of preferences, parsing state, active state, error state, activation, live updates, and cleanup; validate state transitions and storage behavior.
3. Rebuild ReaderModeControl around explicit preview/exit actions, accessible status, labelled controls, live preference updates, and focus-safe behavior; validate with component/integration tests.
4. Integrate the isolated reader surface without destructive body replacement and consume canonical tokens; validate DOM restoration and design-drift scans.
5. Run the full automated baseline, rebuild both browsers, reload the unpacked Edge extension manually, and record representative browser evidence.
6. Align canonical technical documentation, update lifecycle evidence, and deliver only owned paths through an exact-scope commit and ordinary push.

## Acceptance Criteria

- Reader Mode can be activated from its panel on a supported article and visibly displays sanitized content.
- Unsupported content shows an accessible error without changing host-page DOM or visibility.
- Exit via the visible action and Escape restores host visibility, scroll position, and focus without duplicate mounts or styles.
- Every exposed preference is persisted, validated, and reflected live in the active reader.
- Unsafe active content and URL schemes never reach the live reader DOM.
- The toolbar remains present and usable while reading.
- Focus order, accessible names, visible focus, themes, responsive widths, and reduced-motion behavior pass Edge inspection.
- Typecheck, focused and full tests, both builds, manifest lint, design-system scan, and exact-scope Git checks pass.

## Test Strategy

- Unit-test pure preference validation and sanitization with hostile and representative markup.
- Test store lifecycle with mocked storage and DOM mounting.
- Test the panel's activation, error, live-setting, and exit contracts.
- Use Edge for end-to-end visual and interaction proof after the production Chrome build is manually reloaded.
- Run the repository baseline last to catch shared regressions.

## Risks

- Readability quality varies by site; failure must be honest rather than displaying misleading fragments.
- Host CSS can leak into ordinary DOM overlays; isolation and scoped resets must be verified on contrasting sites.
- The already-dirty token and architecture files can create ownership conflicts; preserve them byte-for-byte unless a safe non-overlapping patch is demonstrable.
- Page navigation or teardown can occur while parsing; cleanup must tolerate detached nodes.

## Execution Notes

- Topology: main-only. The implementation is one cohesive lifecycle and overlapping file ownership would cost more than delegation.
- First-read files: `src/composables/useReaderMode.ts`, `src/stores/readerMode.ts`, `src/components/ReaderModeControl.vue`, `src/components/ToolGlowsBar.vue`, and `src/assets/design-tokens.css`.
- Validation commands: focused Vitest files, `pnpm typecheck`, `pnpm exec vitest run`, `pnpm build`, `pnpm lint:manifest`, and the ShipGlows design-system drift scan.
- Do not edit or stage current dark-mode changes.
- Do not hand-edit `dist/`; production builds may regenerate it, but generated outputs remain outside the commit unless repository policy explicitly tracks them.
- Browser proof uses Edge only, as explicitly requested and configured by `ENVIRONMENT.md`.
- Stop if reader work requires a new permission, privileged message, remote service, destructive host-page mutation, or overlap with an unrelated dirty hunk that cannot be preserved exactly.

## Open Questions

None. The operator approved the complete refactor, Edge proof, exact-scope commits, and ordinary push in the validated plan.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-31 21:00 UTC | sg-development | Codex | Audited the disconnected and destructive reader implementation and authored the approved complete refactor contract. | reviewed | Validate readiness. |
| 2026-08-31 21:02 UTC | sg-development | Codex | Reviewed behavior, scope, security, design authority, edge cases, proof, and dirty-work boundaries. | ready | Implement the reader lifecycle. |
| 2026-08-31 21:26 UTC | sg-development | Codex | Implemented the isolated reader lifecycle, unified preferences, strict sanitizer, accessible controls, tokenized themes, focused tests and technical documentation. Typecheck, 72 tests, Chrome/Firefox builds and manifest lint pass. | implemented — Edge proof pending | Reload ToolGlows in Edge, then run the accepted browser scenarios. |
| 2026-09-01 10:47 UTC | sg-development | Codex | Verified the production Chrome build in Edge on supported and unsupported pages, including visual isolation, preferences, keyboard cleanup and focus restoration; reran the complete automated baseline. | verified | Deliver the exact-scope commit to origin/main. |

## Current Chantier Flow

- specification: ready
- readiness: ready
- implementation: complete
- verification: complete — Edge rendered proof and automated baseline passed
- delivery: pending
