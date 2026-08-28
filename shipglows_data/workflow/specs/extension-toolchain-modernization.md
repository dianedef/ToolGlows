---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "toolglows"
created: "2026-08-26"
created_at: "2026-08-26 21:06:58 UTC"
updated: "2026-08-28"
updated_at: "2026-08-28 10:51:21 UTC"
status: active
source_skill: sg-maintenance
source_model: "GPT-5.6"
scope: "extension-toolchain-modernization"
owner: "operator"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - package.json
  - pnpm-lock.yaml
  - manifest.config.ts
  - manifest.chrome.config.ts
  - manifest.firefox.config.ts
  - vite.config.ts
  - scripts/launch.ts
  - scripts/getInstalledBrowsers.ts
  - src/background/index.ts
  - src/bridge/index.ts
  - src/composables/useDragOpen.ts
  - src/composables/useRichCopy.ts
  - src/stores/reloadAllTabs.ts
  - README.md
  - shipglows_data/technical/architecture.md
  - shipglows_data/technical/developer-guide.md
depends_on: []
supersedes: []
next_step: "commit and push the verified ToolGlows modernization to origin/main"
---

# Title

Extension Toolchain Modernization

# Status

Verified — delivery pending. After the initial implementation-only pass, the operator explicitly authorized validation through ShipGlows and ordinary delivery on `main`. Type checking, tests, lint without errors, Chrome and Firefox production builds, dependency installation, and the ShipGlows extension lifecycle now pass. Manual acceptance inside the personal Chrome profile and store publication remain intentionally outside agent control.

# User Story

As the ToolGlows maintainer, I want the extension foundation modernized before ShipGlows learns from it, so ShipGlows does not encode obsolete or internally inconsistent extension conventions.

# Minimal Behavior Contract

The repository keeps its Chrome and Firefox Manifest V3 architecture, existing product surfaces, and current PrimeVue 3 UI behavior while replacing the CRXJS beta and deprecated router integration, correcting manifest permissions and browser-specific sidebar declarations, refreshing compatible dependencies, and making local browser launch orchestration deterministic and path-safe.

# Success And Error Behavior

Success is a coherent dependency and manifest configuration, a regenerated pnpm lockfile, safer launch scripts, aligned maintainer documentation, and a reduced current audit count. If a migration requires visual rework, changes the product permission promise, or cannot be justified without runtime proof, defer it explicitly instead of forcing it. No automated or browser proof is claimed in this run.

# Scope In

- Upgrade CRXJS to stable, Vite/Vue toolchain packages, Pinia, Vue Router, vue-tsc, and web-ext where the migration is bounded.
- Remove unused/deprecated direct packages, including the standalone router plugin, ESLint stub types, and unused PrimeVue 4 packages.
- Keep PrimeVue 3 as the active coherent UI line; document the later PrimeVue 5 migration.
- Add the `bookmarks` permission where the API is used, add Chrome `sidePanel`, map Firefox to `sidebar_action`, and relay privileged content-script operations through the background service worker.
- Remove obsolete browser-specific manifest fields where safe.
- Harden launch target selection, path handling, process cleanup, and browser detection.
- Refresh audit-focused transitive overrides and directly affected documentation.

# Scope Out

- PrimeVue 5, Tailwind 4, TypeScript 7, or Tesseract 7 migrations that require runtime/UI validation.
- Reducing `<all_urls>` or changing the product promise that the toolbar is available across ordinary pages.
- Product redesign, store publication, or deployment.
- Automatic installation into a personal Chrome profile or claiming store/runtime acceptance before the operator's manual browser check.

# Implementation Tasks

1. Modernize the compatible dependency clusters and regenerate the lockfile with pnpm 10.33.2.
2. Migrate file-based routing from deprecated `unplugin-vue-router` to Vue Router 5's built-in Vite plugin.
3. Correct shared and browser-specific manifest permissions/sidebar declarations.
4. Harden launch and installed-browser discovery scripts without changing their user-facing purpose.
5. Align README and canonical technical documentation with the new contract and deferred migrations.
6. Run dependency audits, static checks, builds, and the ShipGlows-managed Chrome extension lifecycle; commit and push exact owned paths to `origin/main`.

# Acceptance Criteria

- No CRXJS beta or deprecated direct package remains in `package.json`.
- Active PrimeVue source dependencies are consistently v3-era; unused v4 packages are removed.
- Chrome declares `sidePanel`; both browser manifests receive `bookmarks`; Firefox uses `sidebar_action` rather than Chrome's `side_panel`; content scripts no longer call privileged tab/window/bookmark APIs directly.
- Launcher starts only requested build targets, validates config paths, waits for a fresh manifest, and tears down child processes.
- Audit before/after counts and deferred major migrations are documented without a security-complete claim.
- `ENVIRONMENT.md` records the ShipGlows browser-extension workflow, durable port, unpacked directory, and personal-profile safety boundary.

# Risks And ZOMBIES Coverage

- Zero/empty: no selected browser falls back to Chrome explicitly.
- One/many: one target starts one build; `--all` shares the Chromium build for Chrome/Edge and starts Firefox separately.
- Boundaries: custom Vite config paths must resolve inside the project and exist.
- Invalid/adversarial: command arguments are passed without shell interpolation; absent browsers are not reported as installed.
- Expired/stale: a pre-existing manifest does not satisfy readiness unless its modification time is fresh for this launch.
- Slow/partial: launch times out or fails when a build process exits before producing its manifest.
- Concurrent: shutdown terminates all spawned Vite processes and the browser runner.
- Security: requested extension permissions match direct API usage; broad host coverage remains a documented product constraint.

# Documentation Coherence

Update the README permission and command descriptions, the architecture dependency/plugin and manifest sections, and the developer guide launch, permission, and deferred-validation guidance. Public marketing claims do not change.

# Audit Evidence

- Before: 3 critical, 38 high, 14 moderate, and 5 low advisories across the full dependency graph; the production-filtered audit also reported findings.
- After: 0 critical, 2 high, 0 moderate, and 0 low advisories in the full graph; 0 findings in the production-filtered graph.
- Residual: two high advisories identify `image-size@2.0.2` through `web-ext > addons-linter`; the registry reports no patched `image-size` release, so removing them would currently require removing the maintained Firefox lint/browser-launch toolchain.
- `pnpm install --frozen-lockfile`, `pnpm typecheck`, and 4 Vitest tests pass; ESLint reports 0 errors and 138 historical warnings.
- Chrome and Firefox production builds complete and produce their unpacked directories and zip archives. Both report one non-blocking large-chunk warning for the 869.68 kB main bundle.
- `pnpm audit --prod --audit-level high` reports no known production vulnerability. The full graph retains the two documented `image-size@2.0.2` advisories through the maintained `web-ext > addons-linter` development path, with no patched registry version.
- Generated auto-import, component, and typed-router declarations are deterministic across repeated ShipGlows starts and are retained as versioned generated sources.
- `s start`, `s status`, `s open`, and `s stop` recognize ToolGlows as a Chrome Manifest V3 extension on HMR port 3002, open `chrome://extensions` plus `dist\chrome`, and release the port on stop.
- Direct execution of the exact Vite development command is warning-free. ShipGlows can nevertheless surface an old Vite HMR warning from `stderr.log` after a clean restart because redirected logs are not reliably truncated; this is a ShipGlows DevServer defect to repair in the separate CLI chantier, not a ToolGlows runtime failure.
- Manual remaining proof: choose **Load unpacked** in the user's Chrome profile and exercise extension features; ShipGlows intentionally does not automate that privileged profile mutation.

# Current Chantier Flow

| Phase | Status | Evidence | Next |
|-------|--------|----------|------|
| sg-spec | done | Approved modernization captured as an autonomous contract | sg-ready |
| sg-ready | done | Scope, risk boundary, deferred proof, and documentation obligations are explicit | sg-maintenance |
| sg-maintenance | done | Toolchain, manifests, privileged bridge, launcher, pnpm 10 policy, generated types, and docs modernized | sg-verify |
| sg-verify | done | Install, typecheck, tests, lint, Chrome/Firefox builds, audits, and ShipGlows start/status/open/stop pass | sg-ship |
| sg-ship | pending | Exact owned diff is ready for an ordinary `main` push | push `origin/main` |

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-26 | sg-maintenance | GPT-5.6 | Captured and readied the approved modernization contract | ready | implement without runtime validation |
| 2026-08-26 | sg-maintenance | GPT-5.6 | Modernized the approved scope and reduced dependency audit findings | implemented — unverified | operator build/browser validation |
| 2026-08-28 | sg-maintenance | GPT-5.6 | Stabilized generated types and pnpm policy, repaired type/lint/test findings, built both targets, and exercised the ShipGlows extension lifecycle | verified — delivery pending | push exact owned diff to origin/main |
