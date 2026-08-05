---
artifact: product_context
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: "toolglows"
created: "2025-12-16"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: product
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
target_user: "Browser-heavy professionals, independents, researchers, writers and learners"
user_problem: "Frequent browser tasks are fragmented across extensions, menus and external applications, creating repeated context switching."
desired_outcomes: "Complete common reading, capture, search, navigation and focus actions without leaving the current page."
non_goals: "A generic extension framework, a full social media management suite, or a replacement for CommandGlows."
linked_systems:
  - src/components/ToolGlowsBar.vue
  - src/content-script/index.ts
  - src/stores/toolglows.ts
  - manifest.config.ts
depends_on:
  - artifact: shipglows_data/business/project-brief.md
    artifact_version: "2.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "The toolbar registers 18 user-facing modules in the current source."
  - "Chrome and Firefox builds share the same Vue and TypeScript codebase."
next_review: "2026-09-05"
next_step: "Prioritize browser QA by capability family and decide which social modules move to CommunityGlows."
---

# ToolGlows — Product Context

## Product promise

ToolGlows is a configurable browser toolbar that makes useful actions available directly on the page being viewed.

## Capability families

### Reading and capture

- word, character, sentence and reading-time statistics;
- instant OCR with language and clipboard options;
- configurable reader mode;
- rich copy and automatic selection copy.

### Search and navigation

- configurable multi-engine search;
- internal and external link exploration;
- accelerated and infinite scrolling;
- drag-and-drop actions for opening, downloading or copying;
- reload all tabs and configurable quick actions.

### Focus and appearance

- programmable dark mode with per-site exclusions;
- element hiding by site;
- feed blocking with replacement focus content.

### Experimental social modules

- Instagram saved-content organization;
- Gmail interface enhancements;
- social comment analysis and CSV export.

These modules depend on third-party page structures. They are not part of the stable core promise until dedicated browser tests confirm their behavior.

## Core journey

1. The user installs ToolGlows and sees the toolbar on a supported web page.
2. They choose which tools remain active and position the toolbar.
3. They invoke an action without leaving the current page.
4. Their preferences persist across browsing sessions and synchronize where browser storage permits it.

## Scope boundaries

ToolGlows owns universal page-level utilities. CommunityGlows owns multi-account social operations and may consume selected social modules. CommandGlows owns command, voice, keyboard, snippet and broader text-workflow acceleration.

Internal storage keys, CSS selectors and code identifiers use the `toolglows` namespace. No migration layer or compatibility alias is maintained for earlier development builds.

## Delivery state

- Existing: Chrome/Firefox build paths, injected toolbar, settings persistence and 18 registered tools.
- Needs proportional proof: real-browser behavior for every tool and store packaging.
- Experimental: third-party social/Gmail/Instagram DOM integrations.
- Undecided: pricing, accounts, entitlements and ecosystem bundle mechanics.
