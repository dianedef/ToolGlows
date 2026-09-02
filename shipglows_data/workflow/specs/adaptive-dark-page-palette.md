---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "toolglows"
created: "2026-08-29"
updated: "2026-09-01"
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
- Media colors may be attenuated but are never automatically inverted by the dark-mode engine.
- ToolGlows UI, media, SVG and light mode remain outside page-palette remapping.
- Runtime-inserted content receives the same mapping and all markers are removed when dark mode stops.
- Graphite is selectable beside Custom; changing presets is reversible and never discards the last custom colors.
- Dark-mode setting controls persist and apply the value emitted by the interaction rather than a stale previous value.
- Custom text and link colors are never silently replaced. A low-contrast choice displays its measured ratio, offers a nearby readable suggestion, and requires an explicit “keep my color” action before the new value is persisted.
- While that confirmation is pending, the warning says the color is not yet applied and the “Appliquer ma couleur” action receives one short attention pulse; reduced-motion preferences disable the animation.
- People can save up to 20 uniquely named custom color triplets, apply them immediately, rename them and delete them after an explicit confirmation. Saved themes use the existing synchronized preference storage and Graphite remains immutable.
- The palette gallery presents immutable Graphite and light Latte presets beside saved personal themes; selecting Latte applies and persists its cream, plum and blue palette without dark-only surface or site overrides.
- Dark-mode startup uses a persistent packaged root prepaint before host DOM display, then starts the actual engine from cached state at `document_start`; it never adds an opaque interstitial or waits for page-load heuristics. It remains generic across sites and preserves exclusions, schedules and system-preference behavior.
- Disabling or removing Dark Mode from the loaded-tool list persists `darkModeActive=false`, retires the bootstrap canvas and removes all page markers.
- PrimeVue CSS is scoped to ToolGlows-owned containers, so host fields with classes such as `.p-inputtext` or `.p-dropdown` remain untouched while page dark mode is off.

## Scope In

- Canonical semantic tokens for third-party dark-page adaptation.
- Graphite/Custom preset selection and non-destructive legacy preference migration.
- Role-based RGB range mapping for neutral, cool, warm and success surfaces.
- Button and control borders, elevation, hover and focus states.
- One global glare-reduction treatment for host-page images, plus Oscaro deterministic selectors for filters, conditions and compatibility.
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
- [x] Low-contrast custom text and link colors expose a warning and accessible suggestion while preserving the exact chosen color after explicit confirmation.
- [x] Named custom themes survive reload and support create, apply, rename and confirmed deletion.
- [x] Graphite, Latte and saved personal themes share one palette gallery, and Latte survives reload as a light nuanced page palette.
- [x] Tests, typecheck, Chrome/Firefox builds, manifest lint and token drift checks pass or have explained warnings.
- [x] ToolGlows interface dark theme cannot recolor host-page PrimeVue fields.
- [x] Removing Dark Mode from loaded tools disables persisted and current page state.
- [ ] A browser-compatible pre-paint strategy prevents bright host skeletons without adding an intermediate loading stage.

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
| 2026-08-31 | sg-bug | Codex | Replaced the Oscaro-only product-image filter with one glare-reduction rule for all host-page images; ToolGlows media remains excluded. | implemented — rendered proof pending | Reload the unpacked extension and verify Cdiscount plus one neutral image-heavy page. |
| 2026-08-31 | sg-bug | Codex | Retested the rebuilt extension on Cdiscount and a neutral Wikipedia article after correcting the host-page token boundary. | rendered proof passed — user acceptance pending | Confirm that the global 82% brightness treatment is the desired intensity. |
| 2026-08-31 | sg-bug | Codex | Strengthened global media glare reduction, softened the Graphite text tone and covered CSS-background logos exposed as `role="img"`; operator accepted the final Cdiscount rendering. | verified | Preserve the global rule and monitor unrelated image-heavy pages for regressions. |
| 2026-08-31 | sg-bug | Codex | Neutralized DarkReader's inline-SVG inversion marker globally and retested Docker after rebuilding the extension. | rendered proof passed | Preserve original media color relationships; attenuation may remain, inversion must stay at zero. |
| 2026-08-31 | sg-bug | Codex | Added a generic preparation screen tied to DarkReader's initial stylesheet-completion signal, eager theme startup and a two-second failure release. | automated proof passed — operator visual acceptance failed | Remove the interstitial; preserve only the eager startup improvement. |
| 2026-08-31 | sg-bug | Codex | Retested the rebuilt extension during live reloads on Docker and Example Domain. Automated samples saw no uncovered interval, but the operator still saw white skeleton, dark cover and final theme over roughly two seconds. | rejected | Treat human visual evidence as authoritative and return to a true pre-paint design. |
| 2026-08-31 | sg-bug | Codex | Removed the rejected readiness interstitial and its timeout while retaining dark-state loading independent from toolbar mounting. | automated proof passed | Reload the unpacked extension and confirm that the artificial middle stage is gone. |
| 2026-08-31 | sg-bug | Codex | Assessed a generic declarative pre-paint for Chrome and Firefox. A persistent dynamically registered CSS content script can run before host DOM display, but requires `scripting`, explicit host permission and a fixed packaged fallback palette; exact schedule-boundary updates may additionally require `alarms`. | design ready — permission approval required | Choose the permitted automation scope before changing either manifest. |
| 2026-08-31 | sg-bug | Codex | Implemented the approved persistent prepaint with packaged manual/system CSS, exact-domain exclusions, schedule alarms, readiness retirement and explicit cross-browser permissions. | automated proof passed — rendered proof pending | Reload the unpacked extension, accept its updated permissions if prompted, then visually retest Docker. |
| 2026-09-01 | sg-bug | Codex | Removed the rejected DOM overlay and visual-readiness wait; the independent document-start entry now starts the actual engine from cached state while the Vue toolbar remains at document-end. | Docker reload accepted — delayed SVG preservation pending | Move the existing media-color preservation rule into the early engine path so marked SVGs never change color after first paint. |
| 2026-09-01 | sg-bug | Codex | Moved generic media attenuation and inline-SVG no-inversion ownership into the shared document-start style, removed the duplicate document-end rule and retained full cleanup on disable. | rendered proof passed | Preserve one media-color authority across reload and manual activation. |
| 2026-09-02 | sg-bug | Codex | Reproduced custom-palette startup in isolated Edge, normalized reactive storage payloads recursively, restored legacy indexed collections on synchronization, and moved custom link styling into the early backdrop. | implemented — automated and isolated Edge proof passed | Reload the rebuilt unpacked extension in the operator's Edge profile and confirm the chosen palette on a representative page. |
| 2026-09-02 | sg-bug | Codex | Removed silent contrast substitution, added inline contrast disclosure with an accessible suggestion and an explicit override for custom text and link colors. | isolated Edge proof passed — operator acceptance pending | Reload the rebuilt extension and confirm the interaction in the operator profile. |
| 2026-09-02 | sg-design | Codex | Clarified the pending low-contrast state and emphasized “Appliquer ma couleur” with a single reduced-motion-aware attention pulse. | implemented — rendered proof pending | Verify the confirmation affordance in isolated Edge. |
| 2026-09-02 | sg-development | Codex | Started the approved named-theme library with synchronized persistence, a 20-theme limit and guarded management actions. | implementation running | Complete automated and isolated browser proof. |
| 2026-09-02 | sg-development | Codex | Completed the named custom-theme library and exercised create, apply, reload persistence, rename and confirmed deletion in an isolated Edge profile. | automated and rendered interaction proof passed | Ask the operator to assess the compact theme-management layout after reloading the unpacked extension. |
| 2026-09-02 | sg-bug | Codex | Reworked the broken 350 px theme manager into stacked cards with text actions and added a reliable ToolGlows UI boundary to prevent page-color contamination. | isolated Edge layout proof passed — operator acceptance pending | Reload the extension and confirm the repaired light and dark rendering. |
| 2026-09-02 | sg-design | Codex | Unified built-in and saved themes in one responsive gallery and added the light, colorful Latte preset with dedicated runtime behavior. | automated and isolated MV3 load proof passed — operator visual acceptance pending | Reload the unpacked extension and inspect Graphite, Latte and a saved theme in the gallery. |

## Current Chantier Flow

2026-09-02 unified palette gallery: Graphite, the new light Latte preset and saved personal themes now share the same responsive card gallery. Selecting a saved card restores its exact triplet; selecting Latte persists a cream `#eff1f5` canvas, plum `#4c4f69` text and blue `#1e66f5` links, skips dark surface softening and site-specific dark overrides, and suppresses graphite prepaint on reload. Automated proof passes with 157 tests, typecheck, Chrome/Firefox builds and isolated MV3 loading; operator-profile visual acceptance remains pending.

2026-09-02 named custom themes: Custom mode now exposes a synchronized library of up to 20 uniquely named palettes with three-color previews. The current applied triplet can be saved, each theme can be applied atomically, names can be edited, and deletion requires a second explicit click. Hydration discards invalid, duplicate and over-limit records while Graphite remains immutable. Automated coverage reaches 154 tests, typecheck and targeted lint pass, Chrome/Firefox builds succeed, manifest lint reports no errors, and an isolated Edge profile completed save, apply, full reload, rename and confirmed deletion with storage returning to an empty collection.

2026-09-02 saved-theme layout repair: operator screenshots exposed horizontal clipping, missing PrimeIcon glyphs and page custom colors leaking into the teleported settings content. The manager now uses a one-column editor and cards, explicit text actions, wrapped names and a concrete `data-toolglows-ui` boundary on the inner dialog content. Isolated Edge measured a 316 px content width with zero overflowing controls, exposed readable Renommer/Supprimer actions and found no missing glyph; human acceptance in the operator profile remains pending.

2026-08-30 regression fix attempt: bundled PrimeVue selectors are constrained to ToolGlows-owned containers, and removing Dark Mode from loaded tools persists deactivation before removal and cleans the runtime DOM. Automated proof passes (41 tests, typecheck, both builds and manifest lint); status remains implemented with browser proof pending.

2026-08-30 browser retest: after the unpacked extension and target page were reloaded, the ToolGlows interface remained dark while page dark mode stayed off; PrimeVue field selectors were scoped, Oscaro fields remained light, and no DarkReader, bootstrap, override or soft marker remained. Status advances to fixed-pending-verify.

2026-08-31 Mondial Relay regression: the prior proof was incomplete because `toolglows-main-styles` still leaked DaisyUI and design-token `:root` rules into the host document. PrimeIcons, main CSS and content CSS are now scoped alongside PrimeVue, with a regression test that rejects unscoped `:root` and `body` selectors while preserving existing ToolGlows ownership. Focused tests, typecheck and both builds pass; rendered proof is pending after extension reload.

2026-08-31 global media glare retest: Cdiscount product and recommendation images plus 44 images on a neutral Wikipedia article all receive the same `brightness(0.82) contrast(0.96) saturate(0.94)` filter with DarkReader active. The white product canvases render as light gray rather than pure white; the code and browser proof pass, with final visual intensity acceptance pending from the operator.

2026-08-31 intensity adjustment: operator review found the first global treatment too light and residual pure-white logos or menu content too prominent. The approved stronger baseline is `brightness(0.68) contrast(0.92) saturate(0.92)` for images plus the global Graphite text tone `#cfd4da`; rebuilt browser proof remains pending.

2026-08-31 residual logo diagnosis: Cdiscount's white mark is an inline SVG data URL rendered as a CSS background on `role="img"`, not an `<img>`. The global media selector now covers both representations while preserving ToolGlows-owned media exclusions.

2026-08-31 media-color contract: Docker exposed DarkReader automatically applying `invert(1) hue-rotate(180deg)` to an inline SVG. Image analysis is now globally disabled for media and image roles; ToolGlows retains glare reduction without chromatic inversion.

2026-08-31 SVG inversion retest: image-analysis exclusions alone did not stop DarkReader's separate inline-SVG inversion path. Media selectors are now excluded from both image and inline-style analysis so original colors remain authoritative.

2026-08-31 operator validation: the rebuilt Cdiscount rendering with stronger image attenuation, softened Graphite text and `role="img"` coverage was accepted as visually successful. The global media-glare correction is verified on the reported page.

2026-08-31 Docker verification: DarkReader still marks 15 inline SVGs for inversion, so analysis exclusions alone are not authoritative. The host-page override now explicitly neutralizes `[data-darkreader-inline-invert]`; browser proof after extension reload reports 0 computed `invert()` or `hue-rotate()` filters across 86 media elements. Docker's logo retains its original color relationship with only the shared glare-reduction filter.

2026-08-31 atomic-start implementation: when cached state says dark mode is active, a document-start preparation screen now covers incremental host rendering and disables initial transitions. Dark-mode loading starts independently from toolbar mounting. The screen is removed when DarkReader clears its fallback style after completing the first stylesheet pass, or after two seconds if readiness cannot be established. The implementation is domain-agnostic; 64 tests, typecheck and Chrome/Firefox builds pass, while Firefox manifest lint reports 0 errors and its 10 known generated-bundle warnings. Rendered proof awaits an unpacked-extension reload.

2026-08-31 atomic-start rendered retest: during a live Docker reload, three consecutive 50 ms samples retained the opaque preparation screen while DarkReader had not started; the next sample simultaneously showed the screen removed, `data-darkreader-mode="dynamic"` and an empty fallback style. No unprotected intermediate state was observed across the remaining samples. Example Domain retained the screen for only the first 25 ms sample and reached the same ready state on the next one, demonstrating that lightweight pages are not held for the safety timeout.

2026-08-31 operator visual retest invalidated the automated atomic-start conclusion. Docker visibly rendered a white host skeleton, then the ToolGlows dark cover, then the final DarkReader theme over roughly two seconds. The cover was therefore rejected and removed. Eager dark-state loading remains; a true pre-paint design and any permission impact remain under analysis.

2026-08-31 pre-paint conclusion: static manifest CSS can precede host DOM display, but cannot safely follow ToolGlows' runtime active, schedule, system-preference and exclusion state. Chrome and Firefox both expose persistent dynamic content-script registration for this conditional case; their documented contract requires the security-sensitive `scripting` permission plus host permission for each target. Exact registration changes at schedule boundaries can also require the `alarms` API when no extension context is awake. The proposed layer is a fixed packaged dark canvas registered only while effective dark mode is active, with exclusions reflected in its match rules, and retired once DarkReader owns the page. No permission or implementation change was made in this analysis step.

2026-08-31 approved pre-paint implementation: the background now persistently registers one of two packaged CSS layers before navigation—unconditional graphite for manual/scheduled activation or a `prefers-color-scheme` variant for system synchronization. Exact excluded hostnames become dynamic `excludeMatches`; a single named alarm resynchronizes at the next schedule boundary. The document-start bootstrap corrects stale state and the page layer retires through a marker only when DarkReader's initial stylesheet pass is ready, with a bounded failure release. The manifest now explicitly declares `scripting`, `alarms` and `<all_urls>` host access for this path. Rendered human proof remains required.

2026-08-31 first operator prepaint retest: initial glare improved, but Docker's main-content background still appeared white during hydration and was recolored roughly one second later. The prior automated post-load measurement missed this transient state. Prepaint retirement now waits for a bounded DOM-settling window after DarkReader readiness so generic late hydration remains protected; rebuilt rendered proof is pending.

2026-08-31 settling-window retest: the operator found the root background better but the central white content slower, exposing that the wildcard prepaint itself changed every descendant's computed background before DarkReader analysis. A viewport pseudo-element then proved unreliable on repeated Docker reloads. The bootstrap now injects a stable fixed DOM overlay at `document_start`; it leaves host computed styles authoritative underneath and releases only after the existing visual readiness check or its failsafe. Rebuilt proof is pending.

2026-09-01 early-engine correction: operator comparison showed manual activation was immediate while reload remained about one second slower, proving the overlay and readiness wait extended the visible startup path without accelerating the engine. The overlay, large-surface polling, load gate and 15-second failsafe are removed. The cached document-start path now invokes the same normalized engine configuration used by manual activation, retires the declarative root prepaint immediately and leaves only a non-blocking root/body backdrop. Schedules, system preference and exact-domain exclusions remain unchanged; rendered human proof is pending.

2026-09-01 rendered reload acceptance: the operator judged the Docker page background and central content startup visually successful. The remaining Docker logo transition is separately diagnosed: the early engine can mark its inline SVG with `data-darkreader-inline-invert`, while ToolGlows' authoritative no-inversion/media attenuation CSS is still installed by the document-end bundle. The SVG therefore changes once when that later rule takes ownership; this remains open and does not invalidate the accepted page-surface startup.

2026-09-01 early media-color guard: the generic attenuation and `[data-darkreader-inline-invert]` neutralization now live in the shared document-start bootstrap style before the engine starts. The rule remains effective for media inserted during hydration, ToolGlows-owned media stays excluded, the document-end override no longer duplicates it, and Dark Mode disable removes the early style with the rest of the bootstrap layer. Fourteen focused tests, typecheck and Chrome/Firefox builds pass; the operator confirmed Docker's logo remains visually stable throughout reload.

2026-09-02 custom-palette startup repair: isolated Edge proof showed nested Vue arrays being persisted as index-keyed objects, which emptied the normalized active-tool list, triggered repeated `hiddenElements.map` errors and reset `darkModeActive` after a transient page theme. Storage writes now recursively convert reactive state to plain JSON-compatible data, storage-change hydration restores legacy indexed collections through the default schema, and custom link styling is available in the document-start backdrop before the late override. Focused tests, typecheck and both browser builds pass; isolated Edge retains active state and array shapes, applies the custom link color and no longer reverts the page. Operator-profile visual acceptance remains pending.

2026-09-02 contrast-choice correction: WCAG-oriented thresholds remain advisory (4.5:1 for normal text and 3:1 for links), but no longer mutate the requested palette. A newly selected low-contrast color is staged in the control with its measured ratio, a minimally shifted readable suggestion and two explicit outcomes. Choosing “Garder ma couleur” persists and applies the exact hex value; choosing the suggestion persists the suggested value. Existing low-contrast preferences remain authoritative and display the same warning.

2026-09-02 isolated Edge contrast proof: on Example Domain, `#404040` text over `#202124` produced a visible 1.55:1 warning while storage retained the prior text color. “Garder ma couleur” then persisted `#404040` and the page heading computed to `rgb(64, 64, 64)`. The same path persisted `#303030` for links and the page link computed to `rgb(48, 48, 48)`. ToolGlows-owned UI remained outside the page-color selectors. Automated proof passes with 145 tests, typecheck, Chrome/Firefox builds, manifest lint (0 errors, 12 known warnings), design-drift scan (0 defects), and isolated MV3 content scripts without errors. Human operator-profile acceptance remains pending.

2026-09-02 exact-color follow-up: operator validation showed the warning interaction was correct but the page text did not visibly follow the chosen color. Isolated Edge reproduced the cause: DarkReader remapped accepted `#ff9ed2` to `rgb(255, 108, 187)` across ordinary text owners. Custom mode now applies accepted text and link colors directly to actual text owners, observes dynamically inserted content, excludes ToolGlows UI/media and restores prior inline colors on disable. Edge computed `rgb(255, 158, 210)` for div, paragraph, span, button, strong, small and dynamic text, and `rgb(255, 128, 200)` for the requested `#ff80c8` link. A synthetic insertion of 2,000 text owners completed in 141 ms in isolated Edge; this path is disabled for Graphite. Automated coverage advances to 147 tests with typecheck passing; operator-profile retest remains pending.

2026-09-02 reload-persistence correction: isolated Edge confirmed storage retained the Custom preset and exact color triplet, but the exact-color owner previously started only with the document-end toolbar bundle. A reload therefore exposed DarkReader's remapped colors at 100 ms and reached exact colors around 300 ms; host hydration could subsequently overwrite an existing inline color. Exact Custom ownership now starts from cached preferences in the independent document-start bundle and observes bounded style rewrites without looping. After rebuild, a full Edge reload computed exact `#ff9ed2` text and `#ff80c8` links by the 100 ms sample and retained them through 3 seconds; focused regression coverage also proves reassertion after a host inline-style rewrite.

- sg-design: active
- readiness: ready
- implementation: early-engine correction implemented
- verification: 14 focused early-start, lifecycle and prepaint tests, typecheck and Chrome/Firefox builds pass; human Docker page-surface reload and early SVG color preservation proofs passed
- delivery: local only
