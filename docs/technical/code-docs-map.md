---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: code-docs-map
owner: "operator"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - package.json
  - pnpm-lock.yaml
  - .npmrc
  - vite.config.ts
  - vite.chrome.config.ts
  - vite.firefox.config.ts
  - README.md
  - docs/developer-guide.md
  - docs/architecture.md
depends_on:
  - artifact: "specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: ready
supersedes: []
evidence:
  - "Dependency security work changes package, lockfile, build, and documentation contracts."
next_review: "2026-06-04"
next_step: "/sf-docs technical audit"
---

# Code Docs Map

## Purpose

This map tells implementation and verification agents which documentation surfaces must be considered when code or dependency contracts change.

## Mapped Surfaces

| Code Surface | Primary Docs | Required Validation | Docs Update Trigger |
| --- | --- | --- | --- |
| `package.json`, `pnpm-lock.yaml`, `.npmrc` | `README.md`, `docs/developer-guide.md`, `docs/architecture.md` | `pnpm install --lockfile-only`, `pnpm audit --audit-level high`, `pnpm audit --prod --audit-level high` | Dependency versions, Node/pnpm engines, overrides, or package-manager policy changes |
| `vite.config.ts`, `vite.chrome.config.ts`, `vite.firefox.config.ts` | `docs/architecture.md`, `docs/developer-guide.md` | `pnpm run build:chrome`, `pnpm run build:firefox`, `pnpm run build` | Build plugin, dev server, output, manifest, or zip packaging changes |
| `manifest*.config.ts`, `scripts/launch.ts`, `scripts/getInstalledBrowsers.ts`, `src/assets/icons/*` | `README.md`, `docs/developer-guide.md` | `pnpm run lint:manifest`, targeted launch command inspection | Extension lint, browser launch, manifest, icons, permissions, or packaging command changes |
| `src/background/index.ts`, `src/content-script/**`, `src/stores/darkMode.ts` | `docs/architecture.md`, `docs/developer-guide.md` | `pnpm run typecheck`, `pnpm run build`, `pnpm run lint:manifest` | Content-script bridge behavior, dark-mode injection, or permission model changes |
| `src/ui/options*/**` | `docs/architecture.md`, `docs/developer-guide.md` | `pnpm run build`, `pnpm run typecheck` | Options-page settings behavior or form dependency changes |
| `src/assets/base.scss`, `tailwind.config.cjs`, `postcss.config.cjs` | `docs/architecture.md`, `docs/developer-guide.md` | `pnpm run build` | Tailwind, PostCSS, DaisyUI, or global style pipeline changes |

## Documentation Update Plan Format

```markdown
## Documentation Update Plan

- Code changed: `<paths>`
- Subsystem: `<dependency/build/docs/options-style>`
- Primary technical doc: `<doc path or none>`
- Secondary docs: `<doc paths or none>`
- Required action: `none | review | update | create`
- Priority: `low | medium | high`
- Reason: `<why>`
- Owner role: `executor | integrator`
- Parallel-safe: `yes | no`
- Notes: `<constraints>`
```

## Maintenance Rule

When a mapped code surface changes, update the listed docs or record a no-impact justification in the final implementation report.
