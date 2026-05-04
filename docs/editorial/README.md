---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: editorial-governance-index
owner: "operator"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - CONTENT_MAP.md
  - docs/editorial/public-surface-map.md
  - docs/editorial/claim-register.md
depends_on:
  - artifact: "CONTENT_MAP.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "sf-build governance gate requires applicable project-local editorial governance."
next_review: "2026-06-04"
next_step: "/sf-docs editorial audit"
---

# Editorial Governance

## Purpose

This directory tracks public and maintainer-facing content surfaces for ToolFlowz.

## Index

| Document | Role |
| --- | --- |
| `CONTENT_MAP.md` | Public content routing map |
| `docs/editorial/public-surface-map.md` | Public surface inventory and update triggers |
| `docs/editorial/claim-register.md` | Sensitive claim boundaries |

## Current Chantier Impact

The dependency security chantier may update setup, dependency, and validation guidance. It does not change product positioning, pricing, legal text, or marketing claims.

## Maintenance Rule

When visible setup guidance, public promises, or sensitive claims change, update this directory or record a no-editorial-impact justification.
