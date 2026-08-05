---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-05-04"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: editorial-governance-index
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - shipglows_data/editorial/content-map.md
  - shipglows_data/editorial/public-surface-map.md
  - shipglows_data/editorial/claim-register.md
  - shipglows_data/editorial/ROADMAP.md
depends_on:
  - artifact: "shipglows_data/editorial/content-map.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "sf-build governance gate requires applicable project-local editorial governance."
next_review: "2026-09-05"
next_step: "Review store-facing copy after browser QA."
---

# Editorial Governance

## Purpose

This directory tracks public and maintainer-facing content surfaces for ToolGlows.

## Index

| Document | Role |
| --- | --- |
| `shipglows_data/editorial/content-map.md` | Public content routing map |
| `shipglows_data/editorial/public-surface-map.md` | Public surface inventory and update triggers |
| `shipglows_data/editorial/claim-register.md` | Sensitive claim boundaries |
| `shipglows_data/editorial/ROADMAP.md` | Public-content follow-up |

## Current Product Impact

The ToolGlows rename changes the public name and positioning. Pricing, legal, support and store-listing surfaces are not yet declared.

## Maintenance Rule

When visible setup guidance, public promises, or sensitive claims change, update this directory or record a no-editorial-impact justification.
