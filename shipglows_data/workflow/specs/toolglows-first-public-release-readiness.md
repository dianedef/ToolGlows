---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.9"
project: "toolglows"
created: "2026-09-23"
created_at: "2026-09-23 01:01:36 UTC"
updated: "2026-09-23"
updated_at: "2026-09-24 01:04:12 UTC"
status: draft
source_skill: "100-sg-spec"
source_model: "GPT-6"
scope: "first-public-release-readiness"
owner: "operator"
confidence: medium
user_story: "As a new ToolGlows user, I want to understand what activates, what data and permissions the extension uses, and what is stable before installation, so I can make an informed choice and get a useful first result."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
  - "src/stores/toolglows.ts"
  - "src/features/cookieConsent/"
  - "src/composables/useDarkMode.ts"
  - "src/ui/common/pages/privacy-policy.vue"
  - "src/ui/common/pages/help.vue"
  - "README.md"
  - "shipglows_data/business/product.md"
  - "shipglows_data/editorial/ROADMAP.md"
  - "shipglows_data/editorial/public-surface-map.md"
  - "shipglows_data/technical/extension-data-and-permissions.md"
  - "shipglows_data/workflow/specs/tool-onboarding-and-cookie-toggle.md"
  - "shipglows_data/workflow/specs/permission-and-store-review-hardening.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/tool-onboarding-and-cookie-toggle.md"
    required_status: "implemented"
  - artifact: "shipglows_data/technical/extension-data-and-permissions.md"
    required_status: "active"
supersedes: []
evidence:
  - "The current store activates every registered tool except Auto Copy when no active-tool preference exists. Operator decision (2026-09-23): fresh installs must start with every tool disabled; cookie automation remains a separate opt-in."
  - "The product context classifies Gmail, Instagram and social analysis as experimental pending dedicated browser proof."
  - "The shared manifest uses <all_urls> for the always-available toolbar and supported page tools; the permission matrix calls this an intentional product invariant."
  - "A geolocation and sunrise-sunset request exists in src/composables/useDarkMode.ts; repository search found no call site for useDarkMode(), so runtime reachability is unverified."
  - "CommandGlows site source contains localized privacy routes (/privacy, /fr/confidentialite) and contact routes (/contact, /fr/contact); live reachability and policy accuracy for the extension remain unverified."
  - "Independent review found the current site privacy copy focuses on site accounts, payments, authentication, and cookies; it does not yet disclose the extension's permissions, data, or network flows."
  - "The bilingual site privacy copy is dated 2024-12-15. Contact source lists privacy@commandglows.com and hello@commandglows.com; its form creates a mailto link, not a server-side support receipt."
  - "Static audit found active dark-mode resource requests and user-triggered external search destinations; geolocation and speed-browsing request paths have no source call sites and need packaged/runtime reachability proof before disclosure claims."
  - "Fresh-install tools-off behavior is implemented; fake-storage hydration tests preserve both empty and non-empty activeTools across store recreation. The focused three-file suite passes 9 tests, and vue-tsc typecheck passes; real-browser packaged proof remains outstanding."
  - "Current branding guidance explicitly names the extension ToolGlows and positions it as an autonomous complementary product. A visible-name change requires confirming whether it remains standalone or becomes part of CommandGlows; technical namespaces/storage keys and store identity should remain unchanged absent a migration need."
  - "Operator direction (2026-09-24): first-use tool discovery should be enabled by default without a welcome-page opt-out; the inline tool explanation should offer a persistent way to stop future explanations; the welcome page should end with a complete tool catalog. No per-tool demo media currently exists in the repository."
  - "Guided discovery/catalog flow implemented: 18 registered tools are grouped once, experimental integrations are labeled, fresh tools-off behavior is unchanged, inline opt-out persists, and confirming the introduction immediately executes the action. Focused Vitest passed 4 files/10 tests; vue-tsc passed; Chrome and Firefox production builds passed. Isolated Chrome Playwright captured the welcome page and confirmed all 18 entries, but later timed out on a settings click intercepted by a dialog overlay; the end-to-end interaction run is not a pass."
  - "Operator approved direct welcome-page activation via luminous catalog icons. Ordinary tools persist through toolglowsSettings.activeTools while Cookie Consent uses its separate local preference. Icons expose accessible pressed state; storage read/write errors leave state truthful and retry the requested operation. Focused Vitest now passes 4 files/14 tests and vue-tsc passes."
  - "Retry now sets the saved desired state rather than toggling again, including uncertain write failures; a focused test covers this. Final focused Vitest passes 4 files/15 tests, vue-tsc passes, and Chrome/Firefox production builds both pass. The ordinary-settings read-modify-write preserves existing fields but is not atomic against simultaneous edits from another extension page; independent review judged that brief first-install welcome race low likelihood, not impossible."
  - "Operator direction (2026-09-23): use CommandGlows public site for privacy/support; renaming the extension to CommandGlows is probable but not yet a final brand/migration decision."
  - "Independent review found that activation changes must remain gated against the existing onboarding contract and that active critical/high bugs need an explicit release gate; both are now covered."
next_step: "Capture real per-tool demo media; repair and rerun the isolated Chrome onboarding interaction proof; then continue package/privacy/name readiness gates."
---

# Title

Browser Extension First Public Release Readiness

# Status

Draft. The operator has decided that all tools start disabled on fresh installs and wants CommandGlows site pages used for public privacy/support. The extension rename to CommandGlows is the current direction, not yet a final identity decision. Route reachability, policy accuracy, and legacy geolocation reachability need evidence before store-ready claims or submission.

# User Story

As a new browser-extension user, I want to understand what activates, what data and permissions the extension uses, and what is stable before installation, so I can make an informed choice and get a useful first result.

# Minimal Behavior Contract

Before install, the Chrome Web Store listing explains the page-toolbar purpose, `<all_urls>` access, local processing, any external requests, and the experimental status of third-party integrations. On a fresh install, every tool starts disabled while tool discovery explanations are enabled by default; the welcome page has no explanation opt-out. In the grouped welcome catalog, clicking a tool icon toggles its enabled state and gives the icon a clear luminous active treatment. The welcome page briefly explains this interaction and persists ordinary tools in `toolglowsSettings.activeTools`; Cookie Consent uses its separate explicit opt-in preference and remains off by default. The first attempted tool action shows its explanation before running; the user can persistently disable subsequent explanations inline, or confirm the primary action to acknowledge and immediately run that tool. The catalog explains every registered user-facing tool and supports real per-tool demonstration media without auto-playing a page full of clips. Existing installations retain saved tool and explanation preferences. Failure to load or save onboarding preferences leaves the current state unchanged and offers retry. Use CommandGlows site privacy/contact routes as candidate public destinations, after confirming live reachability and that policy content accurately covers the extension. Publicly present the extension as CommandGlows only after the operator confirms the rename; until then, avoid implying a completed identity migration. The extension retains its existing all-compatible-page behavior unless a separate product decision changes that invariant.

# Success Behavior

A first-time user can browse the complete grouped catalog, activate chosen tools directly from their icons, learn about an active tool on first use, disable future explanations inline if desired, and complete one core action on a supported page. All tools remain off by default and cookie automation remains independently opt-in. Existing users retain saved tool and explanation settings. Real demos, when available, are user-triggered and lazy-loaded. The same claims are consistent across in-product explanations, the permission/data matrix, CommandGlows privacy/support destinations, and the Chrome listing. Firefox compatibility remains documented and proven separately; simultaneous publication is not implied.

# Error Behavior

If onboarding storage fails, do not silently change the active set or enable cookie automation; show an actionable retry. If a browser/page/API is unsupported, explain the limitation and leave the page usable. If permission, data-flow, or browser proof differs from published copy, block submission and correct the evidence or claims first.

# Problem

The extension's broad capability set is difficult to assess at first use. Existing code activates all registered tools except Auto Copy when no preference exists; the new operator decision is to make all tools disabled on fresh installs. The separate cookie preference is off. Stable reading/navigation/focus tools coexist with Gmail, Instagram, and social-analysis integrations whose third-party DOMs can change. CommandGlows has candidate public privacy and contact pages, but their live status and extension-specific accuracy are not yet proven. A legacy geolocation/network path has not been shown unreachable.

# Solution

Prepare one evidence-backed Chrome-first release contract covering intentional first tool activation, stable/experimental boundaries, permission and data explanations, public privacy/support destinations, listing materials, and browser proof. Keep Firefox as a compatibility target with its own manifest, disclosure, and runtime proof. This spec does not authorize publication or change permissions, store dashboards, hosting, versions, or public policy.

# Scope In

- Fresh-install default of all tools disabled, direct per-tool activation from welcome catalog icons, preservation of existing user settings, and a separate Cookie Consent opt-in.
- First-use explanations enabled by default, removed explanation-choice controls from welcome, persistent inline opt-out, and a complete grouped tool catalog whose icons toggle activation with a clear active glow.
- Data-driven per-tool demonstration-media support with accessible user-triggered playback and no fabricated preview assets; actual clips must match shipped behavior.
- Stable core versus experimental third-party integration labels and claim boundaries.
- Current `<all_urls>` explanation and justification as an existing invariant.
- Reconciliation of declared data, storage, outbound requests, geolocation use, and Chrome/Firefox disclosures.
- CommandGlows public privacy and support destinations, store listing content/assets, and release evidence.
- Provisional public-name direction toward CommandGlows, with final naming confirmation and identity-migration scope explicitly separated from technical product IDs.
- Release-candidate version and non-placeholder user-facing release notes, finalized against the packaged build.
- Real-browser proof on Chrome and Firefox, recorded separately.

# Scope Out

- Removing or narrowing `<all_urls>` or changing page coverage.
- Implementing new tools, telemetry, accounts, pricing, entitlements, or cross-product packaging.
- Publishing policies, creating public web surfaces, editing store dashboards, submitting either listing, or claiming simultaneous launches.
- Changing the extension version or changelog while drafting this contract; release metadata is prepared only for an approved candidate.

# Constraints

- Preserve local-only preference semantics, versioned onboarding keys, existing user choices, and the separate cookie opt-in; on a fresh install default every tool to disabled, and never clear extension storage on install.
- Default first-use explanations to enabled only for users without a saved opt-out; do not overwrite existing onboarding choices. The welcome page does not present an explanation-choice fork.
- Catalog every registered user-facing tool exactly once, distinguish experimental integrations, keep activation state accurate and accessible, and keep demonstrations lazy/user-triggered; a missing clip uses the existing tool icon and factual description rather than an empty/fake media frame.
- Do not describe local processing as “no data collected” without reconciling the store definitions and the complete network inventory.
- `<all_urls>` remains an intentional product invariant for this chantier. Explain user impact and justify each use; permission redesign requires a separate approved product decision.
- No public claim that Gmail, Instagram, social analysis, cookie acceptance, legal compliance, or store approval is universal or guaranteed.
- Chrome Web Store is the provisional primary target; Firefox remains supported and must pass its own proof. Release timing across stores remains undecided.
- Use the project design tokens and existing onboarding/settings patterns for any later UI work.

# Test Contract

Prove source and packaged behavior in isolated Chrome and Firefox profiles on supported public test pages, with no personal accounts or private browsing data. Automated checks cover onboarding persistence/failure, cookie default-off, manifest/disclosure consistency, and outbound-flow inventory. Manual checks cover the permission prompt, voluntary activation of a tool, its explanation's immediate action and persistent inline opt-out, catalog coverage against the registered tool list, one stable action, unsupported-page recovery, and store asset rendering. A build, manifest lint, or unit test alone is not browser or publication proof. Do not install into the operator's personal profile.

# Dependencies

- Product and onboarding contracts must encode the operator-decided all-tools-disabled fresh-install default while preserving saved settings.
- A source-to-runtime audit determines whether the geolocation/sunrise-sunset code is reachable and enumerates every active outbound request, including page-resource fetches and link preloading.
- Verify `https://www.commandglows.com/fr/confidentialite` and `https://www.commandglows.com/fr/contact` (English routes `/privacy` and `/contact`) are live and maintained; verify privacy content covers the extension's actual data flows before store submission. Current site privacy copy is website/account/payment-focused and cannot yet serve as the extension disclosure without authorized revision.
- Confirm the owner-approved support address/contact path; current source candidates are `privacy@commandglows.com` and `hello@commandglows.com`, and the contact form invokes the user's mail client rather than documenting server-side receipt.
- Operator must confirm whether CommandGlows becomes the final public extension name before any listing, package branding, or public copy is changed; technical IDs are not renamed by this spec.
- Chrome and Firefox isolated-browser environments, current store requirements, final listing assets, accurate declarations, and current critical/high bug records must be available before release readiness.
- Any disclosure-affecting code change requires updating the data/permission matrix, privacy copy, both store declarations, and focused policy checks.

# Invariants

- Cookie auto-acceptance remains off until the user opts in; disabling it does not revoke consent already recorded by a site.
- Existing onboarding choices and per-site exclusions survive update/reload.
- `<all_urls>` is justified by the always-available toolbar and supported page actions; this spec does not reduce that coverage.
- Stable and experimental claims match the product context and direct browser evidence.
- Chrome and Firefox results are independent; no simultaneous publication claim until the operator decides it.

# Links & Consequences

Business outcome: reduce browser context switching (`shipglows_data/business/product.md`). Journey: install → informed first-use choice → first useful page action → repeat use. This spec governs that journey; the onboarding contract remains the source for existing interaction/storage semantics, and the permission/data matrix remains the source for technical declarations. Downstream consumers are the README, public-surface map, privacy/support surfaces, Chrome listing, Firefox listing, manifests, and release proof. Revalidate all affected disclosures after any network, permission, onboarding, or capability change. No stable decision/Atlas ID is present in the inspected product artifacts; this spec is the first durable contract for the release-readiness gap.

# Documentation Coherence

Before any listing is ready, reconcile `README.md`, `shipglows_data/business/product.md`, `shipglows_data/editorial/ROADMAP.md`, `shipglows_data/editorial/public-surface-map.md`, `shipglows_data/technical/extension-data-and-permissions.md`, the in-extension privacy/support pages, and this spec. The public-surface map currently conflicts with the existence of an in-extension privacy page; distinguish an internal page from a canonical public URL. Replace placeholder support contact only after an owner-approved real destination exists.

# Edge Cases

- Existing installation has saved active tools: onboarding must preserve them; do not reapply fresh-install defaults.
- Fresh install selects no profile or storage is unavailable: show the approved choice/retry without enabling cookie automation.
- User skips explanations: tools retain their approved activation state; skip does not opt into cookies.
- Page is unsupported or a tool's third-party DOM changed: explain the limitation without breaking other toolbar actions.
- A source contains an outbound request but has no discovered call site: classify reachability as unverified until bundle/runtime tracing proves dead or active; do not make a privacy promise from search absence alone.
- Chrome passes and Firefox fails, or vice versa: record the results independently and block claims for the failing target.

# ZOMBIES Coverage

- Zero: fresh preferences, all tools off, cookie preference missing/off.
- One: smallest valid active-tool set and one stable action.
- Many: all registered tools and disclosure entries stay classified and understandable.
- Boundaries: unsupported schemes/pages, browser API floors, third-party DOM drift, blocked network, and storage failure.
- Invalid: stale tool IDs or malformed stored preferences do not activate unknown tools or cookies.
- Errors: failed preference read/write and failed page action preserve state and offer recovery.
- Security: no new host permission, telemetry, account, publisher relay, sensitive logging, or automatic cookie opt-in.

# Implementation Tasks

1. Keep all tools disabled on fresh installs while making tool discovery default-on; remove the install-page choice, add persistent inline opt-out, and present a complete grouped catalog with real, accessible demo media when supplied. Validate fresh install, update, opt-out persistence, failed storage, and repeat launch.
2. Trace every declared permission and outbound request from source through packaged entrypoints; resolve `useDarkMode.ts` geolocation reachability with call-graph and runtime evidence. Update the data/permission matrix only after evidence. Validate with focused policy tests and packaged network observation.
3. Verify packaged/runtime data flows, then adapt the CommandGlows privacy/contact surfaces through the authorized site work; align in-extension content, README, public-surface map, Chrome/Firefox declarations, and factual listing copy. Validate every destination and cross-surface claim before submission.
4. Confirm the CommandGlows public-name decision and whether the extension remains autonomous or becomes part of the CommandGlows offer; define a bounded branding migration plan before changing extension-facing names. Preserve technical namespaces, storage keys, and store identities unless a separately approved migration requires changes.
5. Prepare Chrome listing assets/text first, then Firefox-compatible materials without implying synchronized launch. Verify asset dimensions, rendered screenshots, permission reasons, and declarations against the packaged builds.
6. Review all active critical/high bugs; close each with its required verification evidence or keep release readiness blocked. Risk acceptance requires an explicit operator decision and a named residual risk.
7. Capture separate Chrome and Firefox real-browser proof for install/permission comprehension, all-tools-off fresh install, intentional activation, one stable action, cookie default-off, persistence, unsupported-page recovery, and disclosure/network consistency. Record browser versions, build identity, steps, results, and limitations.
8. Set the candidate version and write non-placeholder release notes that match the final packaged behavior.

# Acceptance Criteria

- A first-time install has zero active tools and the onboarding makes intentional activation clear; cookie automation remains separately opt-in. Existing installs retain saved preferences.
- A fresh install shows tool explanations by default, and the welcome page contains no global explanation choice; an inline action in the first-use explanation persistently disables future explanations and can be reversed in settings.
- The welcome page catalogs every available tool exactly once with an accurate name, short explanation, category, and experimental label where applicable; each supplied demo plays only on explicit user action and has an accessible poster/transcript or equivalent.
- Fresh-install all-tools-off behavior and recovery match the operator decision recorded in product and onboarding docs, with tests for fresh install, update, and failed storage.
- Every shipped permission, stored data class, and outbound request has a trigger, purpose, destination, and matching disclosure; geolocation is either proven unreachable in the shipped package or fully disclosed with its trigger and recipient.
- `<all_urls>` purpose and user impact appear accurately in the pre-install explanation and listing; manifest behavior remains unchanged under this spec.
- Stable/experimental labels are consistent in-product and in both listing drafts; claims for experimental modules are bounded to tested sites/states.
- CommandGlows privacy and contact routes resolve to maintained content; the privacy page accurately covers extension behavior, and the support path/recipient is owner-approved. Source-only network analysis is insufficient to finalize these disclosures.
- The extension's public name is confirmed before name-bearing listing/package/public-copy changes; unresolved branding is not represented as a completed rename.
- Chrome proof passes all required first-use and disclosure scenarios. Firefox proof is recorded independently and passes its compatibility scenarios before a Firefox listing is called ready.
- No active critical/high bug remains without required verification or explicit operator-accepted risk; accepted risks are named in the readiness decision.
- Listing text/assets and each store declaration match the exact packaged build; neither publication nor same-day/simultaneous launch is claimed without separate operator authorization and evidence.
- The candidate version and release notes match the exact packaged build and contain no template/example content.

# Test Strategy

1. Static source/config audit: manifest permission map, storage defaults, complete outbound request inventory, privacy/support links, and claim matrix.
2. Automated: typecheck, focused unit/policy tests for all-tools-off fresh install, discovery default-on, inline opt-out persistence/re-enable, complete catalog coverage, saved-preference preservation and failed storage, Chrome and Firefox production builds, manifest lint, and packaged artifact inspection under the repository's release environment.
3. Chrome isolated profile: install prompt, all-tools-off/discovery-on first-use path, inline opt-out and settings re-enable, catalog completeness, intentional activation, settings persistence/update, cookie opt-in default, stable tool action, unsupported page, observed network destinations, and listing screenshots.
4. Firefox isolated profile: repeat the relevant install, discovery, inline opt-out, catalog, activation, stable action, storage, unsupported page, network, manifest declaration, and screenshot checks against the Firefox package.
5. Human review: compare each listing and privacy declaration to captured behavior; readiness review is separate from implementation and submission.

# Risks

- Overbroad or inaccurate disclosures can cause store rejection and undermine trust; public claims require package-level evidence.
- Starting with every tool disabled can leave users with no immediate result if activation guidance is unclear; test discoverability and first-action completion.
- A long all-tools catalog can overwhelm the welcome page; group it, keep the list scannable, and defer detail/media playback until the user asks.
- Autoplaying many clips can slow setup and create noise; use posters and explicit, lazy playback, and test reduced-motion/accessibility behavior.
- A critical/high bug left at `fixed-pending-verify` can invalidate store readiness even when its implementation retest passed; verify or explicitly accept the remaining risk.
- The uncalled geolocation composable may still be bundled or become reachable indirectly; source search alone cannot establish runtime behavior.
- External page-resource requests and speed preloading may contact site/resource hosts even when the publisher receives no data; describe destinations and triggers accurately.
- Inaccessible CommandGlows privacy/contact routes or privacy copy that does not cover the extension block submission; adding or changing site pages is a separate authorized delivery.
- Third-party DOM drift can invalidate experimental feature screenshots and claims after proof.

## OWASP Security Gate

Threat boundary: extension code and declared store copy versus arbitrary host pages, third-party resource hosts, and users making permission/consent choices. Preserve least data use within the accepted all-site product invariant, anonymous bounded resource fetch behavior, local preference storage, and explicit cookie opt-in. Verify outbound destination/trigger, no publisher telemetry, no page-world data bridge, no sensitive logs, and truthful external-service disclosure. Any new remote service, data transfer, permission, or telemetry blocks this release contract until the matrix and both store declarations are reviewed. Residual risk: host-page structures and remote resource behavior can change after testing. Applicable areas: OWASP Top 10 A01 (access control boundary), A04 (design/data-flow decisions), A05 (security configuration/permissions), A08 (integrity of packaged build/disclosure); verify through manifest, source, package, and isolated-browser evidence.

# Execution Notes

Chrome is the provisional first store. Firefox remains a compatibility target; separate proof does not decide publication timing. The operator chose all tools disabled on fresh installs and designated the CommandGlows public site for privacy/support; its localized route candidates are `/fr/confidentialite`, `/fr/contact`, `/privacy`, and `/contact`. Final extension naming remains to be confirmed. No source, manifest, policy, listing, dashboard, hosting, release version, changelog, tracker, or Git mutation is authorized by this spec-writing task.

# Open Questions

1. Will the extension be renamed publicly to CommandGlows, and will it remain a standalone extension or become an integrated CommandGlows product? Current direction is probable, not yet a final identity/positioning decision; no technical ID migration is implied.
2. Do the CommandGlows privacy/contact pages work in production and accurately represent this extension's data flows and support path? The current policy is website-focused and dated 2024-12-15; routes exist in source, but production status and extension disclosure need authorized revision and runtime evidence.
3. Is the geolocation/sunrise-sunset flow unreachable in the shipped Chrome and Firefox packages, or can a user action activate it? Prove before choosing remove-and-document-dead or disclose-trigger-and-recipient.
4. Will Chrome and Firefox publish together or at different times? Until decided, prepare and report them as separate release targets.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-23 | 100-sg-spec | GPT-6 | Audited current product contracts and drafted first-release readiness spec | Draft persisted; material activation and public-surface decisions remain open | Independent review, then operator decisions and readiness review |
| 2026-09-23 01:07 UTC | 100-sg-spec | GPT-6 | Integrated independent review findings on onboarding compatibility and high-severity bug gating | Draft corrected; awaiting independent re-review | Independent re-review, then operator decisions and readiness review |
| 2026-09-23 09:07 UTC | 100-sg-spec | GPT-6 | Recorded operator decisions: all tools off on fresh install; CommandGlows site for public privacy/support; probable extension rename | Draft updated; route source paths exist but live reachability and privacy-content fit remain unverified | Independent review, confirm public naming, and request readiness review |
| 2026-09-23 09:09 UTC | 100-sg-spec | GPT-6 | Independent re-review against operator decisions and CommandGlows route/policy source | Coherent with decisions; not ready: align onboarding contract, adapt privacy disclosure, verify live routes, confirm public rename | Resolve readiness gates before implementation/submission |
| 2026-09-23 09:31 UTC | 100-sg-spec | GPT-6 | Added source-audit findings for CommandGlows privacy/contact and extension network/storage paths | Privacy source is site-focused; active and unverified network flows distinguished; no public policy edited | Validate packaged flows, then authorized site policy/support revision |
| 2026-09-23 09:36 UTC | 100-sg-spec | GPT-6 | Recorded all-tools-off implementation, hydration tests, independent review, and typecheck evidence | 9 focused tests and typecheck pass; browser/package proof remains open | Prove packaged runtime, finalize privacy flows, confirm public rename |
| 2026-09-23 09:38 UTC | 100-sg-spec | GPT-6 | Added read-only CommandGlows rename-impact audit | Existing docs say ToolGlows is autonomous; visible-name scope is broad; technical identifiers risk store/update compatibility | Confirm public name and product relationship before branding edits |
| 2026-09-24 00:03 UTC | 008-sg-customer | GPT-6 | Recorded operator direction for default-on discovery, inline opt-out, complete catalog, and per-tool demos | No demo media exists in source; real assets must be captured or supplied | Implement discovery/catalog behavior; record or supply accurate demos before claiming complete media coverage |
| 2026-09-24 00:17 UTC | 008-sg-customer | GPT-6 | Implemented grouped 18-tool welcome catalog, default-on discovery, and inline persistent opt-out; independently reviewed and built Chrome/Firefox | Focused tests/typecheck/builds pass; isolated Playwright reached welcome but later interaction timed out behind a dialog overlay; no demo media assets exist | Repair browser interaction proof, capture real media, continue privacy/name/store readiness |
| 2026-09-24 00:59 UTC | 008-sg-customer | GPT-6 | Added accessible icon toggles to activate tools directly in the welcome catalog, with separate cookie opt-in and retry handling | Focused 14-test suite and typecheck pass; final Chrome/Firefox build in progress; interactive browser proof remains incomplete | Finish builds and return testable packages; repair isolated interaction proof and capture demo media |
| 2026-09-24 01:04 UTC | 008-sg-customer | GPT-6 | Made tool and cookie retries idempotent and documented the settings-storage concurrency boundary | 15 focused tests, typecheck, Chrome and Firefox production builds pass; earlier isolated browser run failed later in an existing dialog interaction | Capture real demo media and repair full Chrome interaction proof |

# Current Chantier Flow

Draft → operator decisions recorded → independent adversarial review → confirm public naming and validate public routes/content → readiness review → bounded implementation → Chrome and Firefox proof → separate publication decision.
