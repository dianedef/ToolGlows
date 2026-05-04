---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: public-content-governance
owner: "operator"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - docs/
  - docs/editorial/
depends_on:
  - artifact: "specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: ready
supersedes: []
evidence:
  - "sf-build governance gate requires a project-local content map before implementation."
next_review: "2026-06-04"
next_step: "/sf-docs editorial audit"
---

# Content Map

## Purpose

This file routes public and maintainer-facing content updates for ToolFlowz.

## Public Surfaces

| Surface | Role | Update Trigger |
| --- | --- | --- |
| `README.md` | Primary public setup and usage guide | Dependency prerequisites, commands, build workflow, or named tool changes |
| `docs/developer-guide.md` | Maintainer workflow guide | Node/pnpm requirements, validation commands, or testing/build workflow changes |
| `docs/architecture.md` | Technical architecture overview | Direct dependency, build plugin, or extension pipeline changes |
| `docs/project-brief.md` | Product and stack summary | Major stack positioning changes |
| `docs/prd.md` | Product requirements and stack summary | Major stack positioning changes |

## Current Chantier Impact

The permission and store-review hardening chantier may update README, developer, architecture, and technical docs for manifest permissions, icon packaging, no-CDN bundle checks, and options-page dependency removal. No pricing, marketing, legal, or support copy is in scope.

## Maintenance Rule

When a dependency, build, or public setup contract changes, update this map or record why no public content surface changed.
