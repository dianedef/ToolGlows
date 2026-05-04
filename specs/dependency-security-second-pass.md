---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-03"
created_at: "2026-05-03 20:10:08 UTC"
updated: "2026-05-04"
updated_at: "2026-05-04 05:26:25 UTC"
status: shipped
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "operator"
user_story: "As the browser-extension maintainer, I want the remaining dependency security advisories reduced to no critical or high findings without breaking Chrome and Firefox builds, so the extension can move toward a shippable dependency baseline."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "package.json"
  - ".npmrc"
  - "pnpm-lock.yaml"
  - "pnpm audit"
  - "Vite Chrome build"
  - "Vite Firefox build"
  - "manifest.config.ts"
  - "manifest.firefox.config.ts"
  - "Vitest/jsdom test tooling"
  - "web-ext packaging/lint tooling"
  - "README.md"
  - "docs/developer-guide.md"
  - "docs/architecture.md"
  - "docs/technical/code-docs-map.md"
  - "CONTENT_MAP.md"
  - "docs/editorial/README.md"
depends_on:
  - artifact: "package.json"
    artifact_version: "0.0.1"
    required_status: "active"
  - artifact: ".npmrc"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "pnpm-lock.yaml"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "README.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "docs/architecture.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "docs/developer-guide.md"
    artifact_version: "unknown"
    required_status: "unknown"
supersedes: []
evidence:
  - "`pnpm audit --json` after first-pass fixes reports 1 critical, 40 high, 29 moderate, 9 low advisories across 1397 dependencies."
  - "`pnpm audit --prod --json` reports 0 critical, 13 high, 5 moderate, 2 low advisories in production dependency paths."
  - "The first-pass fix removed `vuefire` and updated direct `vue-i18n`, `vite`, and `postcss`; Chrome and Firefox production builds passed afterward."
  - "Remaining critical advisory: `form-data` via `jsdom`."
  - "Remaining production high advisories include `defu`, `tar`, `glob`, `minimatch`, and `picomatch` through `notivue` and `@formkit/themes` dependency paths."
  - "Remaining dev/build advisories include `web-ext/node-forge`, `@playwright/test/playwright`, `sass/immutable`, `vitest -> vite@5.4.14`, `unplugin-turbo-console/h3`, `unplugin-imagemin/svgo`, and `@crxjs/vite-plugin/rollup`."
  - "`pnpm audit --prod --json` after implementation reports 0 critical, 0 high, 0 moderate, 0 low advisories."
  - "`pnpm audit --json` after implementation reports 0 critical, 0 high, 1 moderate, 0 low advisories; the residual path is `web-ext > node-notifier > uuid@8.3.2`."
  - "`pnpm audit --audit-level high`, `pnpm audit --prod --audit-level high`, `pnpm run build`, and `pnpm lint:manifest` pass after implementation."
  - "`pnpm run typecheck` still fails on pre-existing source issues outside the dependency-security changes; the Readability 0.6 type regression was fixed."
next_step: "/sf-start Typecheck Stabilization"
---

# Title

Dependency Security Second Pass

# Status

Shipped. `sf-ready` returned not ready on 2026-05-03, then `sf-build` resolved the blockers on 2026-05-04: major migrations needed for critical/high remediation were approved for this chantier, and `.npmrc` plus minimal ShipFlow governance files were added to the implementation surface. The dependency-security implementation clears critical/high audit gates and preserves Chrome/Firefox builds. The remaining global typecheck failures are tracked as a follow-up outside this chantier. This spec does not authorize audit suppression.

# User Story

As the browser-extension maintainer, I want the remaining dependency security advisories reduced to no critical or high findings without breaking Chrome and Firefox builds, so the extension can move toward a shippable dependency baseline.

# Minimal Behavior Contract

When an operator starts this maintenance chantier, the project must update, remove, migrate, or narrowly override vulnerable dependencies in a way that produces a refreshed lockfile, preserves the existing browser-extension build outputs for Chrome and Firefox, and gives the operator an audit report that clearly separates fixed advisories from residual risk. If a dependency can only be made safe by one of the approved major migrations, the work must keep that migration bounded to the affected package cluster and validate the related build/runtime surface instead of hiding the risk. The easy edge case to miss is that production paths and dev/build paths differ: the build can pass while `pnpm audit --prod` still exposes high-risk transitive dependencies from runtime packages such as `notivue` and `@formkit/themes`.

# Success Behavior

Starting from the current post-first-pass dependency state, implementation succeeds when `package.json` and `pnpm-lock.yaml` express a coherent dependency graph, `pnpm audit --audit-level high` exits successfully for the full dependency set, `pnpm audit --prod --audit-level high` exits successfully for production dependencies, and `pnpm run build` completes both `build:chrome` and `build:firefox`. The operator must be able to inspect the final report and see which advisories were removed, which direct dependencies were updated or removed, which overrides remain, and whether any moderate/low findings are intentionally deferred with a concrete reason. A successful run must not silently ignore critical/high advisories and must not introduce a dependency major upgrade without explicit migration handling.

# Error Behavior

If an update causes install failure, peer dependency conflict, Vite build failure, extension manifest lint failure, or an increase in critical/high audit findings, rollback only the failing package change and retry with the next safer remediation path. If a package has no compatible patch/minor path, use the approved major target only when it is required to clear critical/high advisories and remains bounded to dependency security. If `pnpm audit` returns registry errors, do not mark the chantier secure; rerun once and then report the audit as blocked by registry availability. If `vue-tsc` still fails on pre-existing source errors, do not claim typecheck success; report the baseline as a separate blocker unless a dependency change introduces new type errors.

# Problem

The approved first dependency patch pass reduced risk but did not reach a shippable security baseline. The current full audit still reports `1 critical / 40 high / 29 moderate / 9 low`, and production dependency paths still report `13 high / 5 moderate / 2 low`. These remaining advisories cross dependency hygiene, browser-extension build tooling, test tooling, and runtime transitive packages. The project also lacks package-manager governance fields such as `packageManager` and `engines`, which makes future install/build reproducibility weaker.

# Solution

Run a staged dependency-security remediation focused on critical/high advisories first. Prefer direct patch/minor updates and removal of unused build plugins; use narrowly scoped pnpm overrides when a vulnerable transitive dependency cannot be reached safely through a direct package update. Major migrations are allowed only when needed to remove critical/high advisories and must stay bounded to the package cluster being remediated.

# Scope In

- Refresh the audit baseline with `pnpm audit --json` and `pnpm audit --prod --json`.
- Patch or override the current critical `form-data` advisory through the `jsdom` path.
- Resolve critical/high production advisories from `notivue` and `@formkit/themes` paths, including `defu`, `tar`, `glob`, `minimatch`, and `picomatch`.
- Resolve critical/high dev/build advisories where a patch/minor update, safe removal, or narrow override is available.
- Evaluate and remove unused security-costly tooling where local config shows it is not active or not needed, especially `unplugin-imagemin` and `unplugin-turbo-console`.
- Add package-manager/runtime governance in `package.json`, including `packageManager: "pnpm@10.33.2"` and an explicit Node engine compatible with the documented toolchain.
- Preserve `.npmrc` install-policy settings unless a dependency change proves they are unsafe.
- Allow bounded major migrations needed for critical/high remediation, currently including `vitest`, `web-ext`, `jsdom`, `@formkit/vue`, `@formkit/themes`, and Tailwind-related packages.
- Bootstrap minimal ShipFlow governance files required by `sf-build`: `docs/technical/`, `docs/technical/code-docs-map.md`, `CONTENT_MAP.md`, and `docs/editorial/`.
- Preserve the existing Chrome and Firefox production build commands.
- Update README and technical docs when dependency versions, required Node/pnpm version, or validation commands materially change.

# Scope Out

- Product feature work, UI changes, extension behavior changes, and content-script logic changes.
- General TypeScript cleanup unrelated to dependency updates; current `pnpm run typecheck` failures are a separate source-code chantier unless a dependency change creates new failures.
- Unrelated major migrations for PrimeVue, Vite 8, Vue Router 5, TypeScript 6, Tesseract 7, Pinia 3, or broad ESLint stack modernization unless required to clear critical/high advisories in this chantier.
- Deployment, publishing to extension stores, and production release tagging.
- Suppressing audits with `auditConfig.ignore*` unless a residual advisory is demonstrably unreachable, non-executable in this project, and accepted by the operator in a separate security note.

# Constraints

- Do not weaken security controls to quiet audit output.
- Do not use blanket dependency upgrades across the whole graph; group changes by risk and validate after each batch.
- Keep changes primarily to `package.json`, `pnpm-lock.yaml`, and docs. Touch Vite config only when removing or replacing a vulnerable build plugin requires it.
- Preserve `pnpm run build`, `pnpm run build:chrome`, and `pnpm run build:firefox` semantics.
- Preserve the existing `@crxjs/vite-plugin` browser-extension integration unless a specific Rollup advisory cannot be resolved without changing it.
- If an override is added, it must name the advisory or vulnerable path in a nearby comment-equivalent documentation note, because JSON does not allow comments.
- Do not remove `.npmrc` settings `shamefully-hoist=true` or `strict-peer-dependencies=false` during this chantier unless install validation proves a change is required and the final report explains why.
- Generated files such as `src/types/auto-imports.d.ts` and `src/types/.eslintrc-auto-import.json` may change only if package/plugin changes regenerate them as part of validation.

# Dependencies

- Local package manager: pnpm `10.33.2`.
- Local Node observed during first-pass maintenance: Node `v22.22.2`.
- Current direct package anchors:
  - `vite` `^6.4.2`
  - `vue-i18n` `^11.1.10`
  - `postcss` `^8.5.10`
  - `vitest` `^0.34.6`
  - `jsdom` `^22.1.0`
  - `web-ext` `^8.3.0`
  - `@playwright/test` `^1.50.0`
  - `sass` `^1.83.1`
  - `notivue` `^2.4.5`
  - `@formkit/themes` and `@formkit/vue` `^1.6.9`
- Current package-manager config:
  - `.npmrc` has `shamefully-hoist=true` and `strict-peer-dependencies=false`; these settings are part of the install contract and must be preserved unless proven unsafe.
- Approved major-migration targets when needed for zero critical/high:
  - `vitest` `4.1.5`
  - `web-ext` `10.1.0`
  - `jsdom` `29.1.1`
  - `@formkit/vue` and `@formkit/themes` `2.0.0`
  - `tailwindcss` `4.2.4` plus `@tailwindcss/postcss` if Tailwind 4 is required
- Current official docs checked:
  - pnpm docs via Context7 `/websites/pnpm_io`: `pnpm audit` supports JSON output, `--prod`, `--audit-level`, `--fix`, and security overrides; Corepack can pin pnpm through `packageManager`.
  - Vite 6 docs via Context7 `/websites/v6_vite_dev`: `vite build` is the production build command; `server.allowedHosts` and `server.fs.strict` are security-relevant dev-server controls.
  - Vitest docs via Context7 `/vitest-dev/vitest`: current Vitest requires Vite `>=6.0.0` and Node `>=20.0.0`; Vitest 4 migration also requires those prerequisites.
  - Tailwind docs via Context7 `/tailwindlabs/tailwindcss.com`: Tailwind 4 migration requires Node 20+ and uses `@tailwindcss/postcss` for PostCSS.
  - web-ext docs via Context7 `/mozilla/web-ext` and npm metadata: `web-ext@10.1.0` supports `web-ext lint` and requires Node `>=20.0.0`.
  - FormKit docs via Context7 `/websites/formkit` and npm metadata: `@formkit/vue@2.0.0` supports Vue `^3.4.0`; this project uses FormKit only in the two options-page surfaces.
- Fresh external docs verdict: `fresh-docs checked` for pnpm, Vite 6, Vitest 4 prerequisites, Tailwind 4 migration, web-ext 10 CLI usage, and FormKit 2 local usage bounds.

# Invariants

- Chrome and Firefox production builds must continue to generate `dist/chrome`, `dist/firefox`, and matching zip files.
- The dependency graph must remain installable with pnpm without disabling install scripts or audit checks globally.
- `.npmrc` package-manager behavior must remain explicit and must not leak secrets or registry tokens.
- Runtime dependency remediation must be prioritized over dev-only remediation because `pnpm audit --prod` currently reports high findings.
- Critical/high audit findings must not be ignored in configuration.
- The lockfile must be regenerated by pnpm, not hand-edited.
- The final report must name remaining moderate/low advisories if full `pnpm audit` still exits non-zero.

# Links & Consequences

- `package.json` controls all dependency, override, script, package-manager, and Node-engine behavior.
- `.npmrc` controls pnpm install behavior and currently relaxes hoisting and peer dependency strictness for this project.
- `pnpm-lock.yaml` records the actual resolved dependency graph and is the primary proof of transitive remediation.
- `vite.config.ts`, `vite.chrome.config.ts`, and `vite.firefox.config.ts` define the extension build pipeline and plugin stack; removing `unplugin-turbo-console` or `unplugin-imagemin` may touch this surface.
- `@crxjs/vite-plugin` and Vite/Rollup changes can affect manifest generation and browser-specific builds.
- `notivue` and `@formkit/themes` are runtime dependencies; production audit findings through their transitive paths must be treated as user-facing security posture, even if the vulnerable code is not obviously called by product flows.
- FormKit usage is limited to `src/ui/options/pages/index.vue` and `src/ui/options-page/pages/index.vue`; if FormKit 2 is required, migration validation must cover those pages through build output and typecheck.
- `vitest`, `jsdom`, and `@playwright/test` are dev/test dependencies; they affect CI, local validation, and source exposure through dev servers but should not be framed as production runtime exposure.
- `docs/technical/code-docs-map.md`, `CONTENT_MAP.md`, and `docs/editorial/` are governance files required by `sf-build`; keep bootstrap content minimal and factual.
- README and docs currently mention Vite, Vitest, Playwright, pnpm, Notivue, FormKit, and dependency/version expectations; docs must be aligned if required versions or workflows change.

# Documentation Coherence

Update docs only when the dependency contract changes. Required checks:

- `README.md`: update package-manager setup if `packageManager` and Node engine are added; update listed commands only if scripts change.
- `docs/developer-guide.md`: update prerequisites if Node or pnpm version requirements change; keep `pnpm install`, `pnpm build`, and validation instructions aligned.
- `docs/architecture.md`: update dependency/version references for Vite, Vitest, Playwright, and build plugins if any direct versions materially change.
- `docs/project-brief.md` and `docs/prd.md`: update only if major stack positioning changes, such as removing a named tool or moving to a new major framework.
- `docs/technical/code-docs-map.md`, `docs/technical/README.md`, `CONTENT_MAP.md`, and `docs/editorial/README.md`: create or update minimal governance coverage for this dependency-security chantier.
- No public marketing or pricing copy is impacted by this dependency-only chantier.

# Edge Cases

- `pnpm audit --prod` can remain high even after dev tooling is clean because runtime packages pull build-oriented transitive packages.
- `pnpm audit` can remain non-zero for moderate/low findings after all critical/high items are fixed; this must be reported, not hidden.
- `vue-template-compiler` currently appears as an unfixable moderate advisory through `unplugin-icons`; implementation must remove, upgrade, or justify the path rather than adding a blind ignore.
- `vitest@0.34.6` pulls `vite@5.4.14`; fixing the direct Vite 6 dependency does not fix the Vitest transitive Vite 5 chain.
- `web-ext` may require a major upgrade to remove some transitive `node-forge`/`uuid` paths; `web-ext@10.1.0` is approved in this chantier if lint/build validation passes.
- `@formkit/themes` may require FormKit 2 or Tailwind 4 to clear production findings; those migrations are approved in this chantier if scoped to the existing FormKit/Tailwind surfaces and backed by build validation.
- Vite config currently has duplicate `server` keys in an already-dirty `vite.config.ts`; dependency implementation must not claim to fix typecheck unless that separate issue is intentionally handled.
- Removing `unplugin-turbo-console` can affect developer logging ergonomics but should not affect runtime extension behavior; validate builds and generated outputs.
- Removing `unplugin-imagemin` should be safe only if it is unused in active Vite plugins; the current config has `// imagemin({})` commented, but implementation must verify no import or plugin invocation remains.

# Implementation Tasks

- [x] Task 1: Establish a fresh audit and graph baseline
  - File: `package.json`, `pnpm-lock.yaml`
  - Action: Run `pnpm audit --json`, `pnpm audit --prod --json`, `pnpm outdated --format json`, and targeted `pnpm why` commands for the vulnerable modules. Save summarized counts and vulnerable paths in the implementation report, not in tracker files.
  - User story link: Confirms the maintainer is fixing the actual current advisory set.
  - Depends on: None
  - Validate with: Baseline report lists full and prod counts plus direct/transitive package paths.
  - Notes: Do not edit `TASKS.md` or `AUDIT_LOG.md` from this spec.

- [x] Task 2: Add dependency governance
  - File: `package.json`
  - Action: Add `packageManager: "pnpm@10.33.2"` and `engines.node` set to `^20.19.0 || ^22.13.0 || >=24.0.0`, compatible with current tooling and approved dependency targets. Preserve existing scripts and current package metadata.
  - User story link: Makes the dependency baseline reproducible for maintainers and CI.
  - Depends on: Task 1
  - Validate with: `node -e "const p=require('./package.json'); console.log(p.packageManager, p.engines)"` and `pnpm install --lockfile-only` or equivalent pnpm lockfile refresh.
  - Notes: If CI or deployment docs specify another Node version, stop and reconcile before changing `engines`. Preserve `.npmrc` settings unless install validation proves they must change.

- [x] Task 3: Resolve the critical `form-data` path
  - File: `package.json`, `pnpm-lock.yaml`
  - Action: Prefer a safe direct `jsdom` patch/minor update if available; otherwise add a narrow pnpm override that resolves `form-data` to `4.0.4` or newer without changing runtime code.
  - User story link: Removes the remaining critical audit finding.
  - Depends on: Task 2
  - Validate with: `pnpm audit --json` no longer lists `form-data` as critical, and `pnpm why form-data` shows a patched version.
  - Notes: `jsdom@29.1.1` is approved if patch/minor cannot clear `form-data`.

- [x] Task 4: Resolve production high advisories
  - File: `package.json`, `pnpm-lock.yaml`
  - Action: Remediate production paths from `notivue` and `@formkit/themes` first: `defu >=6.1.5`, `tar >=7.5.11`, `glob >=10.5.0`, `minimatch >=9.0.7` for v9 paths, and `picomatch >=4.0.4` for v4 paths. Prefer direct package updates where available; otherwise use narrow pnpm overrides.
  - User story link: Ensures the shipped extension dependency graph has no critical/high production advisories.
  - Depends on: Task 3
  - Validate with: `pnpm audit --prod --audit-level high` exits 0.
  - Notes: If `@formkit/themes` requires FormKit 2 or Tailwind 4 to clear production high findings, keep the migration in this chantier and validate both options-page FormKit surfaces through the browser-extension builds.

- [x] Task 5: Remove or upgrade unused vulnerable build plugins
  - File: `vite.config.ts`, `package.json`, `pnpm-lock.yaml`
  - Action: Remove `unplugin-imagemin` if it remains unused; remove or upgrade `unplugin-turbo-console` if it is not needed in production builds or if its `h3` path cannot be safely overridden. Keep Vite plugin order stable for required plugins.
  - User story link: Reduces dev/build attack surface without changing extension behavior.
  - Depends on: Task 4
  - Validate with: `pnpm run build:chrome` and `pnpm run build:firefox`.
  - Notes: If removing `TurboConsole()` changes generated output or developer workflow materially, document the tradeoff and reroute for operator approval.

- [x] Task 6: Patch remaining dev/test/packaging high advisories without broad major churn
  - File: `package.json`, `pnpm-lock.yaml`
  - Action: Apply safe patch/minor updates or narrow overrides for `cross-spawn`, `flatted`, `image-size`, `immutable`, `node-forge`, `playwright`, `rollup`, `svgo`, `@babel/*`, `ajv`, `brace-expansion`, `esbuild`, `js-yaml`, `lodash`, `picomatch`, `uuid`, `vite@5` through `vitest`, and `yaml`.
  - User story link: Brings the whole project dependency baseline below critical/high risk.
  - Depends on: Task 5
  - Validate with: `pnpm audit --audit-level high` exits 0.
  - Notes: `@playwright/test` may move to at least `1.55.1` if no test API breaks. `sass` can move to a 1.x patch/minor that carries `immutable >=5.1.5`. `vitest@4.1.5` is approved if required to remove the transitive Vite 5 chain.

- [x] Task 7: Handle moderate/low residuals explicitly
  - File: `package.json`, `pnpm-lock.yaml`, implementation report
  - Action: Run full `pnpm audit` after high remediation. Remove or update easy moderate/low paths, especially unfixable `vue-template-compiler` through `unplugin-icons`, but record any accepted residuals with module, path, severity, and rationale.
  - User story link: Gives the maintainer a trustworthy residual-risk picture.
  - Depends on: Task 6
  - Validate with: Full `pnpm audit --json` summary included in final report.
  - Notes: Do not add audit ignores for unfixable findings unless the operator explicitly accepts the risk.

- [x] Task 8: Update documentation for changed dependency contract
  - File: `README.md`, `docs/developer-guide.md`, `docs/architecture.md`, optionally `docs/project-brief.md` and `docs/prd.md`
  - Action: Update prerequisites, package-manager notes, dependency version references, and validation commands only where the implementation changed them.
  - User story link: Keeps future maintainers aligned with the secured dependency baseline.
  - Depends on: Tasks 2-7
  - Validate with: `rg -n "Vitest|Playwright|Vite|pnpm|Node|dependencies|unplugin-turbo-console|unplugin-imagemin" README.md docs/*.md`
  - Notes: Avoid broad docs rewriting; keep changes factual and tied to package changes.

- [x] Task 9: Run final validation and report ship gate
  - File: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, docs changed by Task 8
  - Action: Run final commands and prepare a concise report with changed packages, audit deltas, build results, residual risk, and ship blockers.
  - User story link: Proves the maintainer can decide whether the dependency baseline is shippable.
  - Depends on: Tasks 1-8
  - Validate with: `pnpm audit --audit-level high`, `pnpm audit --prod --audit-level high`, `pnpm run build`, `pnpm run lint:manifest`, and `pnpm run typecheck`.
  - Notes: If `pnpm run typecheck` still fails only on pre-existing source issues, report it as a separate blocker and do not mark typecheck passed.

# Acceptance Criteria

- [x] CA 1: Given the current post-first-pass dependency state, when Task 3 is complete, then `pnpm audit --json` no longer reports critical `form-data`.
- [x] CA 2: Given production dependencies are audited, when production remediation is complete, then `pnpm audit --prod --audit-level high` exits 0.
- [x] CA 3: Given all approved remediation batches are applied, when the full dependency graph is audited, then `pnpm audit --audit-level high` exits 0.
- [x] CA 4: Given Chrome extension build config, when `pnpm run build:chrome` runs, then Vite builds `dist/chrome` and creates `dist/chrome-0.0.1.zip`.
- [x] CA 5: Given Firefox extension build config, when `pnpm run build:firefox` runs, then Vite builds `dist/firefox` and creates `dist/firefox-0.0.1.zip`.
- [x] CA 6: Given package-manager governance is added, when a maintainer inspects `package.json`, then `packageManager` and `engines.node` are explicit and compatible with the selected dependency versions.
- [x] CA 7: Given a vulnerable package can only be fixed through an approved major upgrade, when implementation reaches that package, then the migration stays bounded to the package cluster, uses current official docs, and validates the affected extension build surface instead of silently broadening scope.
- [x] CA 8: Given `unplugin-imagemin` or `unplugin-turbo-console` is removed or upgraded, when builds complete, then required extension pages, manifest generation, and zip packaging remain intact.
- [x] CA 9: Given docs mention package prerequisites or dependency versions, when the dependency contract changes, then README/developer docs/architecture docs are updated consistently.
- [x] CA 10: Given `pnpm run typecheck` currently fails on unrelated source issues, when final validation runs, then the report distinguishes pre-existing type failures from dependency-induced failures.

# Test Strategy

- Run `pnpm install --lockfile-only` or a normal pnpm install after dependency edits to ensure the lockfile is generated by pnpm.
- Run `pnpm audit --prod --audit-level high` after production remediation.
- Run `pnpm audit --audit-level high` after all critical/high remediation.
- Run full `pnpm audit --json` to capture residual moderate/low advisories.
- Run `pnpm run build:chrome` after build-tool changes.
- Run `pnpm run build:firefox` after build-tool changes.
- Run `pnpm run build` as the final combined build command.
- Run `pnpm run lint:manifest` to verify extension manifests if `web-ext` or browser manifest build output changes.
- Run `pnpm run typecheck` and classify failures as pre-existing or newly introduced.
- Inspect `git diff -- package.json pnpm-lock.yaml vite.config.ts README.md docs/architecture.md docs/developer-guide.md` before final report.
- Inspect `git diff -- .npmrc docs/technical CONTENT_MAP.md docs/editorial` before final report when governance or package-manager surfaces are touched.

# Risks

- Overriding transitive dependencies can bypass upstream package compatibility testing. Mitigation: use the narrowest possible override and validate builds after each group.
- Runtime packages pull transitive build/config packages that still show in production audit. Mitigation: prioritize `pnpm audit --prod --audit-level high`, not only the full dev audit.
- Vitest, web-ext, FormKit, or Tailwind high findings may require major upgrades. Mitigation: keep these migrations bounded to the approved targets and validate builds after the batch.
- Vite plugin removal can change build output. Mitigation: compare build success, manifest output, and zip generation for both browsers.
- Existing dirty files include `vite.config.ts` and generated type files. Mitigation: read diffs before editing and preserve unrelated user changes.
- Typecheck already fails across source files. Mitigation: treat typecheck as a blocker for ship, but not as proof that dependency remediation failed unless errors change due to package edits.

# Execution Notes

- Read first:
  - `package.json`
  - `pnpm-lock.yaml`
  - `vite.config.ts`
  - `vite.chrome.config.ts`
  - `vite.firefox.config.ts`
  - `.npmrc`
  - `README.md`
  - `docs/developer-guide.md`
  - `docs/architecture.md`
  - `docs/technical/code-docs-map.md` if present after bootstrap
  - `CONTENT_MAP.md` if present after bootstrap
- Implementation order:
  1. Capture fresh audit/why/outdated evidence.
  2. Add governance fields.
  3. Fix critical and production high advisories.
  4. Remove unused vulnerable build plugins.
  5. Patch dev/build/test advisories.
  6. Update docs.
  7. Run verification matrix.
- Package strategy:
  - Prefer direct patch/minor updates.
  - Prefer removing unused packages over overriding them.
  - Use pnpm overrides only for vulnerable transitive packages when direct updates are unavailable or require major migrations.
  - Do not use global audit ignores as a shortcut.
- Fresh docs:
  - `fresh-docs checked`: pnpm audit/overrides/packageManager, Vite 6 build/server security options, and Vitest current prerequisites.
  - `fresh-docs checked`: web-ext 10 CLI usage, FormKit 2 local usage bounds, and Tailwind 4 PostCSS migration.
- Stop conditions:
  - Any package requires a major upgrade outside the approved targets or broadens scope beyond dependency security.
  - `pnpm audit --prod --audit-level high` cannot be made clean without removing or migrating a runtime dependency.
  - Chrome or Firefox build fails after a dependency batch.
  - A dependency update mutates unrelated generated files without a clear cause.
  - Suspected secrets or registry tokens appear in package-manager config.

# Open Questions

None.

# Implementation Report

Implemented on 2026-05-04.

- Audit delta: full audit moved from `1 critical / 40 high / 29 moderate / 9 low` to `0 critical / 0 high / 1 moderate / 0 low`; production audit moved from `0 critical / 13 high / 5 moderate / 2 low` to `0 / 0 / 0 / 0`.
- Direct dependency changes in this pass: `@mozilla/readability` updated to `^0.6.0`; `@types/mozilla-readability`, `unplugin-imagemin`, and `unplugin-turbo-console` removed; `@playwright/test`, `jsdom`, `sass`, `vitest`, `web-ext`, `tsx`, and `unplugin-icons` updated.
- Governance: `packageManager`, `engines.node`, `securityOverrideNotes`, and narrow `pnpm.overrides` were added in `package.json`; `.npmrc` settings were preserved.
- Build pipeline: removed unused vulnerable Vite plugin references, fixed the Firefox manifest lint target, kept Chrome/Firefox build outputs and zip packaging intact, and adjusted MV3 manifest fields needed by `web-ext` lint.
- Runtime fix: adapted `src/composables/useReaderMode.ts` to the `@mozilla/readability@0.6.0` built-in types and parser option contract.
- Docs: updated README, developer guide, architecture docs, and minimal technical/editorial governance maps for the changed dependency contract.
- Residual advisory: one moderate dev-only `uuid@8.3.2` advisory remains through `web-ext@10.1.0 > node-notifier@10.0.1`; forcing `uuid@14` through that CommonJS path is deferred because it risks a compatibility break and no critical/high gate depends on it.
- Ship blocker outside this chantier: `pnpm run typecheck` still fails on existing source/type issues in background, components, stores, generated duplicate declarations, and options shortcuts. No remaining error points to `@mozilla/readability` after the compatibility fix.

Validation:

- `pnpm audit --audit-level high`: pass; reports only the residual moderate advisory.
- `pnpm audit --prod --audit-level high`: pass; no known vulnerabilities.
- `pnpm audit --json`: `0 critical / 0 high / 1 moderate / 0 low`.
- `pnpm audit --prod --json`: `0 critical / 0 high / 0 moderate / 0 low`.
- `pnpm run build`: pass for Chrome and Firefox; emits `dist/chrome-0.0.1.zip` and `dist/firefox-0.0.1.zip`.
- `pnpm lint:manifest`: pass with warnings for missing Firefox data collection permissions, icon dimensions, and unsafe `innerHTML` warnings in built output.
- `pnpm run typecheck`: fail on pre-existing source issues; not marked as passed.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-03 | sf-spec | GPT-5 Codex | Created dependency security second-pass spec from `sf-maintain deps` follow-up evidence. | Draft saved. | `/sf-ready Dependency Security Second Pass` |
| 2026-05-03 | sf-ready | GPT-5 Codex | Reviewed dependency security second-pass readiness against scope, freshness, adversarial, and security gates. | Not ready: unresolved major-migration approval and package-manager config surface gap. | `/sf-spec Dependency Security Second Pass` |
| 2026-05-04 | sf-build | GPT-5 Codex | Resolved readiness blockers from user decision, approved bounded major migrations, and added package-manager/governance scope. | Ready for implementation. | `/sf-start Dependency Security Second Pass` |
| 2026-05-04 | sf-build | GPT-5 Codex | Implemented dependency security second pass, updated docs/governance, and ran final audit/build/manifest/typecheck validation. | implemented | `/sf-end Dependency Security Second Pass` |
| 2026-05-04 | sf-end | GPT-5 Codex | Closed dependency-security chantier with tracker and changelog updates; kept typecheck failures as separate follow-up work. | closed | `/sf-ship Dependency Security Second Pass` |
| 2026-05-04 | sf-ship | GPT-5 Codex | Shipped the bounded dependency-security changes after high/prod audit, build, and manifest validation; typecheck remains a separate follow-up. | shipped | `/sf-start Typecheck Stabilization` |

# Current Chantier Flow

- sf-spec: done
- sf-ready: ready
- sf-start: done
- sf-verify: done for dependency-security gates; typecheck source blockers remain outside this chantier
- sf-end: closed
- sf-ship: shipped

Next command: `/sf-start Typecheck Stabilization`
