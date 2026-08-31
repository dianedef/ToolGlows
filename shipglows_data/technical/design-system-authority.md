---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-08-28"
status: active
owner: "Diane"
scope: "extension-ui"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "src/assets/design-tokens.css"
  - "src/assets/main.css"
  - "PrimeVue themes"
  - "content-script UI"
depends_on: []
supersedes: []
evidence:
  - "Established after a design-system audit found no declared authority and 578 visual-value findings."
next_step: "Resolve the remaining documented project-owned drift findings."
---

# ToolGlows Design-System Authority

`src/assets/design-tokens.css` is the single canonical source for ToolGlows semantic visual tokens. `src/assets/main.css` imports that authority and remains the shared stylesheet entry point.

PrimeVue theme files provide the underlying light or dark palette. ToolGlows components and runtime overlays consume semantic `--tg-*` roles rather than selecting their own colors, surfaces, interaction states, radii, shadows or motion values.

Third-party page adaptation uses the separate `--tg-page-dark-*` namespace in the same canonical source. These roles define graphite surface hierarchy, action and success states, borders, focus, elevation and media glare treatment without allowing visited pages to become a competing token authority.

The dark-mode settings expose Graphite and Custom presets. Graphite consumes the canonical page roles; Custom preserves user-provided canvas, text and link colors while the semantic surface hierarchy remains centralized. Teleported ToolGlows dialogs carry an explicit UI boundary so page adaptation never remaps their controls.

All product dialogs consume the shared `ToolGlowsDialog` wrapper. PrimeVue remains responsible for dialog semantics, focus management and automatic opening-order stacking; the wrapper owns the ToolGlows modal boundary, body teleportation, canonical overlay base and shared floating-shell radius. The toolbar consumes the same floating-shell radius token and stays on the lower extension layer.

## Theme switching

The settings control `interfaceTheme` persists the ToolGlows interface mode as `light` or `dark`. The content script replaces its injected PrimeVue palette in place, so the toolbar and its dialogs switch without affecting the visited page.

## Required consumption

- Use `--tg-surface-*`, `--tg-text-*`, `--tg-border-*` and `--tg-action*` for component surfaces and text.
- Use `--tg-interaction-*` for hover, selected and focus states.
- Use `--tg-element-*` for page-element selection overlays.
- Add new reusable visual values only to the canonical token source.
- Use `--tg-page-dark-*` roles for visited-page adaptation; range classifiers return semantic roles rather than raw replacement colors.
- Use the shared dialog wrapper for every product modal; do not apply a fixed global dialog `z-index` that disables PrimeVue stacking.
- Vendor theme sources are external palette providers and are not edited locally.

## Validation

- Run the project design-system drift check after UI changes.
- Verify light and dark interaction states in the unpacked Edge extension.
