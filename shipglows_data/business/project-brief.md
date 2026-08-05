---
artifact: business_context
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: "toolglows"
created: "2025-12-16"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: business
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
target_audience: "Browser-heavy professionals, independents, researchers, writers and learners."
value_proposition: "A configurable toolbar that brings reading, capture, search, navigation and focus actions directly into the current page."
business_model: "Standalone digital product with a possible CommandGlows ecosystem bundle; pricing and entitlements remain undecided."
market: "Browser productivity tools and contextual web utilities."
linked_systems:
  - README.md
  - shipglows_data/business/product.md
  - manifest.config.ts
depends_on: []
supersedes:
  - "ToolGlows template positioning"
evidence:
  - "Operator decision 2026-08-05: rename ToolGlows to ToolGlows and keep it as a standalone Glows product."
  - "The content-script toolbar and tool registry expose the implemented browser toolkit."
next_review: "2026-09-05"
next_step: "Validate the store-facing product copy after browser QA."
---

# ToolGlows — Business Context

## Mission

ToolGlows reduces friction inside the browser by placing useful reading, capture, navigation and focus tools directly on the current web page.

## Product role

ToolGlows is a standalone product in the Glows ecosystem:

- it complements CommandGlows, whose primary role is voice, command and text-workflow acceleration;
- it may share selected social modules with CommunityGlows;
- it does not become a generic extension-development template or a CommunityGlows subfeature.

## Priority users

- professionals and independents who spend much of their day in a browser;
- researchers, writers and learners who repeatedly read, capture and transform web content;
- users who want lightweight page-level tools without switching applications.

## Value proposition

One configurable toolbar brings essential actions to every page: read more comfortably, capture text, search faster, control distractions and automate small browser tasks.

## Business model direction

ToolGlows may be distributed independently and included in an ecosystem bundle with CommandGlows. Pricing, entitlements and bundle terms remain undecided and must not be presented as shipped behavior.

## Positioning guardrails

- Lead with browser utility and contextual actions, not the underlying Vue extension framework.
- Keep universal browser tools at the center of the promise.
- Treat Gmail, Instagram and social analysis as experimental or shared social modules until they receive dedicated browser proof.
- Do not claim production readiness, store availability or universal compatibility without matching evidence.
