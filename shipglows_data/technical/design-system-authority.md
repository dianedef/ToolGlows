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
next_step: "Migrate project-owned visual literals to the declared semantic roles."
---

# ToolGlows Design-System Authority

`src/assets/design-tokens.css` is the single canonical source for ToolGlows semantic visual tokens. `src/assets/main.css` imports that authority and remains the shared stylesheet entry point.

PrimeVue theme files provide the underlying light or dark palette. ToolGlows components and runtime overlays consume semantic `--tg-*` roles rather than selecting their own colors, surfaces, interaction states, radii, shadows or motion values.

## Required consumption

- Use `--tg-surface-*`, `--tg-text-*`, `--tg-border-*` and `--tg-action*` for component surfaces and text.
- Use `--tg-interaction-*` for hover, selected and focus states.
- Use `--tg-element-*` for page-element selection overlays.
- Add new reusable visual values only to the canonical token source.
- Vendor theme sources are external palette providers and are not edited locally.

## Validation

- Run the project design-system drift check after UI changes.
- Verify light and dark interaction states in the unpacked Edge extension.
