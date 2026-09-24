# Tool onboarding and cookie toggle

Status: implemented and verified locally; user approved 2026-09-07.
Owner: sg-experience. Source model: GPT-6. Created/updated: 2026-09-07.

## User story and first success
Users can activate cookie acceptance from the toolbar and understand each tool before its first action. Success is a recognized test banner accepted after deliberate activation, not merely opening settings or finishing a tour.

## Contract and scope
- Cookie left click toggles the existing persisted enabled preference; right click only opens settings. Preserve host exceptions. Icon reflects the real global enabled state and explains an excluded current site.
- First use opens a short tool-specific explanation with a primary action, defer, and skip-all. Closing/defer never runs the tool. Dismissed explanations are remembered only on explicit acknowledgement; close/defer may show again.
- Once acknowledged, clicks retain existing tool-specific behavior. Already enabled toggles can always be disabled directly.
- Install welcome does not ask whether to enable contextual explanations. On a true fresh install, explanations are enabled by default while every tool remains disabled. The first tool action shows its explanation before running; that inline explanation can persistently disable future explanations. Updates must render the update surface, not a fresh installation welcome.
- On a true fresh install, every registered tool is disabled, including Dark Mode and Cookie Consent. Registering tools never mutates `activeTools`; an empty saved list is a valid deliberate preference and remains empty across reloads/updates. Existing saved `activeTools` are preserved. Cookie auto-acceptance remains independently opt-in and defaults off in its separate preference store.
- A settings help directory revisits explanations and can re-enable contextual introductions. Inline opt-out does not activate anything, including cookies.
- Persist independent versioned keys for skip preference and each acknowledged tool in local browser storage; no account, tracking, permission or bridge change. Synchronize storage events across pages.
- Storage failures leave state truthful, show an error and allow retry. Prevent repeated clicks while saving. Keyboard activation and Shift+F10 open action/settings respectively. Shared dialog provides focus and Escape behavior.

## Design and documentation
Use src/assets/design-tokens.css and ToolGlowsDialog; responsive wrapping, no new visual system. Update README and toolbar interaction contract. Existing experimental tools remain experimental; no store-ready claim. No homepage/provider changes.

## Implementation and proof
1. Storage-backed onboarding state and complete tool explanation catalog.
2. Cookie preference adapter and toolbar interception/settings help.
3. Installation welcome on the actual setup entry point.
4. Unit tests for persistence/errors and rendered isolated Chromium extension proof for first use, repeat click, right click, skip-all, recovery, exclusion, keyboard and restart. Run typecheck, Vitest, both builds and manifest lint.

## Edge cases / ZOMBIES / OWASP Security Gate
Zero preferences defaults to explanations on, all tools off, and cookies off. Welcome has no discovery choice; inline opt-out persists, and settings can re-enable discovery. Independent keys preserve concurrent acknowledgements of different tools. The install page's grouped catalog lists every registered tool once, with experimental labels; demo media is optional, real, user-triggered and lazy-loaded (never fabricated or autoplayed). Excluded host remains excluded during global toggles. Failed reads do not silently activate cookies. Repeated action is disabled while busy. No new privileged API, external account, telemetry or sensitive logs. Existing cookie acceptance disclosure includes advertising and does not imply revocation when disabled. DOM compatibility remains bounded by the existing engine.

## Constraints and risks
Preserve unrelated dirty work and existing preferences. Do not install into a personal browser profile. Chrome isolated fixture proof is not Firefox interactive or universal banner proof. No commit/push included in this approval.

## Readiness / execution notes
2026-09-07: source confirmed cookie tool incorrectly classified as panel; setup app uses query type while background opens hash routes. Scope and decision complete. No open product questions. Current flow: implement -> verify -> document. Skill run history: sg-experience diagnosis, spec/readiness review.

## Verification record — 2026-09-07
- TypeScript passed; 54 Vitest files / 283 tests passed (four workers).
- Chrome and Firefox production builds passed.
- Packaged Chromium isolated-profile proof passed: optional welcome, first cookie introduction/defer, deliberate activation accepts the recognized fixture banner, repeated clicks toggle real state, right click and Shift+F10 open settings without activation, host exception survives toggles/reload, skip-all does not run pending actions, settings help reopens an introduction, narrow layout fits, preferences survive full browser restart.
- Desktop and narrow screenshots inspected under .playwright-mcp/onboarding/. Fixture proof does not claim universal CMP or real Firefox interaction coverage.
- Restart proof exposed an unconditional storage clear on install; removed it and persisted welcomeShown to avoid repeating welcome on unpacked reload. Existing data remains intact.
- Automated page clicks no longer dismiss the toolbar. All existing dirty work remains outside this delivery's ownership; no commit or push performed.
- Documentation updated in README, product description, cookie automation notes and toolbar interaction contract.
- Current Chantier Flow: implementation complete -> local verification complete -> manual reload in user's browser. Remaining limitation: interactive Firefox proof.
- Final Firefox manifest lint: zero errors, eleven existing bundle warnings. No interactive Firefox claim.

## Verification record — 2026-09-23
- Fresh install now keeps every tool disabled; registering tools does not mutate the activation preference. Saved non-empty preferences survive actual settings hydration and tool registration; an empty preference persists through store recreation.
- Cookie auto-acceptance remains independently opt-in and off by default.
- Focused Vitest passed: 3 files / 9 tests. `vue-tsc --noEmit` passed.
- Independent review found no remaining issue in the store change, hydration coverage, or install guidance.
- Packaged Chrome/Firefox and interactive browser verification remain outstanding for this change.
