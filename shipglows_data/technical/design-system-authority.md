---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-09-01"
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
  - "2026-09-01: Popup, options and injected toolbar proof confirmed one persisted interface-theme authority, narrow reflow and reduced-motion behavior."
next_step: "Resolve the remaining documented project-owned drift findings."
---

# ToolGlows Design-System Authority

`src/assets/design-tokens.css` is the single canonical source for ToolGlows semantic visual tokens. `src/assets/main.css` imports that authority and remains the shared stylesheet entry point.

PrimeVue theme files provide the underlying light or dark palette. ToolGlows components and runtime overlays consume semantic `--tg-*` roles rather than selecting their own colors, surfaces, interaction states, radii, shadows or motion values.

Extension pages also load the same semantic entry point. The authority maps its roles to PrimeVue variables in injected UI and to DaisyUI variables in popup/options surfaces; those providers supply palette primitives but never become separate ToolGlows semantic authorities. Tokens are exposed on the extension-page `#app` boundary and the injected `#toolglows-root` boundary.

Third-party page adaptation uses the separate `--tg-page-dark-*` namespace in the same canonical source. These roles define graphite surface hierarchy, action and success states, borders, focus, elevation and media glare treatment without allowing visited pages to become a competing token authority.

The dark-mode settings expose Graphite and Custom presets. Graphite consumes the canonical page roles; Custom preserves user-provided canvas, text and link colors while the semantic surface hierarchy remains centralized. Teleported ToolGlows dialogs carry an explicit UI boundary so page adaptation never remaps their controls.

All product dialogs consume the shared `ToolGlowsDialog` wrapper. PrimeVue remains responsible for dialog semantics, focus management and automatic opening-order stacking; the wrapper owns the ToolGlows modal boundary, body teleportation, canonical overlay base and shared floating-shell radius. The toolbar consumes the same floating-shell radius token and stays on the lower extension layer.

The shared wrapper also owns the visible dialog shell: tokenized border, elevation and floating-shell radius, plus canonical header, content and footer spacing. Its root shell values are applied through the maintained wrapper style binding so PrimeVue's positioned-dialog rules cannot flatten right-aligned tool panels after cascade resolution. Common first-level settings groups consume the section radius, muted surface and shared spacing scale; specialized dialogs retain their own widths and interaction behavior.

## Theme switching

The `toolglowsSettings.interfaceTheme` value in browser sync storage is the only active persisted ToolGlows interface mode and accepts `light` or `dark`. Popup, options and injected surfaces load it through the maintained settings store. The content script replaces its injected PrimeVue palette in place, while extension pages apply the matching DaisyUI theme; neither path affects the visited page.

Legacy theme modules may remain as unreferenced migration evidence, but they must not be mounted, persist another theme key or provide a second runtime authority. The options page waits for settings hydration before mounting its form and reports storage success or failure after saving.

## Required consumption

- Use `--tg-surface-*`, `--tg-text-*`, `--tg-border-*` and `--tg-action*` for component surfaces and text.
- Use the canonical control, section and panel radius roles to preserve a deliberate rounded hierarchy rather than assigning local radii.
- Use the shared spacing scale for page gutters, raised sections, form rhythm and compact toolbar rows.
- Native selects and PrimeVue dropdowns consume `--tg-surface-field`; transparent control backgrounds are not an accepted theme state.
- Use `--tg-interaction-*` for hover, selected and focus states.
- Use `--tg-element-*` for page-element selection overlays.
- Add new reusable visual values only to the canonical token source.
- Use `--tg-page-dark-*` roles for visited-page adaptation; range classifiers return semantic roles rather than raw replacement colors.
- Use the shared dialog wrapper for every product modal; do not apply a fixed global dialog `z-index` that disables PrimeVue stacking.
- Keep dialog-shell finish on the shared wrapper and stylesheet; tool components may define content layout but must not replace the outer border, elevation or radius.
- Load `src/assets/main.css` in each extension-page entrypoint that consumes semantic ToolGlows tokens.
- Respect `prefers-reduced-motion` for non-essential transforms and transitions on extension-owned UI.
- Vendor theme sources are external palette providers and are not edited locally.

## Validation

- Run the project design-system drift check after UI changes.
- Verify light and dark interaction states in the unpacked Edge extension.
