---
artifact: developer_guide
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-08-28"
updated: "2026-08-28"
status: reviewed
source_skill: sg-docs
scope: maintainer-workflow
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - package.json
  - ENVIRONMENT.md
  - manifest.config.ts
  - shipglows_data/technical/architecture.md
  - shipglows_data/technical/code-docs-map.md
depends_on:
  - artifact: shipglows_data/technical/architecture.md
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes:
  - "ToolGlows Browser Extension Framework developer guide"
evidence:
  - "package.json pins pnpm 10.33.2 and defines the build, typecheck and manifest-lint commands."
  - "ENVIRONMENT.md defines the local browser-extension loading workflow."
next_review: "2026-11-28"
next_step: "Refresh when the toolchain, validation baseline or browser workflow changes."
---

# ToolGlows Maintainer Guide

## Prerequisites

Use a Node.js version compatible with the declared engine (`^20.19.0 || ^22.13.0 || >=24.0.0`) and pnpm `10.33.2`. The repository already contains its lockfile; do not substitute another package manager.

```bash
corepack enable
pnpm install
```

## Development and loading

Run `pnpm dev` to build Chrome and Firefox development outputs concurrently. For a single target, use `pnpm dev:chrome` or `pnpm dev:firefox`.

Load the generated directory manually in the browser extension manager:

- Chrome: `dist/chrome`
- Firefox: `dist/firefox`

The ShipGlows local-server tooling may open the extension manager and generated directory, but it must not install the extension into a personal browser profile. `ENVIRONMENT.md` is the durable reference for that workflow.

## Commands

| Command | Use |
| --- | --- |
| `pnpm typecheck` | Type-check Vue and TypeScript without emitting files. |
| `pnpm exec vitest run` | Run automated tests. |
| `pnpm build` | Produce Chrome and Firefox production builds. |
| `pnpm lint:manifest` | Lint the built Firefox extension manifest. |
| `pnpm launch` | Build a development Chrome output and open the configured launch flow. |
| `pnpm launch -- --firefox` | Launch the Firefox flow. |
| `pnpm launch:all` | Launch all detected browser targets. |

`pnpm lint` currently fixes files and caches results; do not use it as a read-only proof command in an audit.

## Safe change sequence

1. Identify the browser context and source entrypoint in the code map.
2. For a user-facing tool, change its component/store/composable together with its registry and relevant settings contract.
3. For a privileged action, define a bounded bridge payload, validate it in the receiver, and keep the browser API call in the background worker.
4. Run focused checks, then build both browser targets when shared manifests, extension contexts or packaged assets change.
5. Load the appropriate unpacked build manually for behavior that automated tests cannot prove.
6. Update the canonical documentation when product behavior, permissions, commands or public claims change.

## Store-review baseline

Before any store submission, run the following from a clean, reviewed worktree:

```bash
pnpm typecheck
pnpm exec vitest run
pnpm audit --audit-level high
pnpm build
pnpm lint:manifest
rg -n "cdn\\.jsdelivr|https://cdn" src manifest.config.ts manifest.chrome.config.ts manifest.firefox.config.ts dist/chrome dist/firefox
```

Passing these checks is not store approval. Real-browser proof is still required for each capability, particularly third-party page integrations, and release claims must remain within the claim register.

## Documentation ownership

- `architecture.md` explains runtime boundaries, permissions and validation triggers.
- `code-docs-map.md` routes a code change to its owner docs and proof.
- `README.md` explains the product and local setup to repository readers.
- `shipglows_data/editorial/claim-register.md` controls readiness, compatibility and security claims.

Update the smallest canonical owner; do not duplicate technical truth in tracker entries or generated output.
