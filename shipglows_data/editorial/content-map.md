---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-05-04"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: public-content-governance
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - shipglows_data/business/
  - shipglows_data/technical/
  - shipglows_data/editorial/
content_surfaces:
  - README.md
  - shipglows_data/business/project-brief.md
  - shipglows_data/business/product.md
  - shipglows_data/technical/developer-guide.md
  - shipglows_data/technical/architecture.md
depends_on:
  - artifact: "shipglows_data/workflow/specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: ready
supersedes: []
evidence:
  - "Operator decision 2026-08-05 renamed the public product to ToolGlows and confirmed standalone positioning."
  - "README.md is the current public product and setup surface."
next_review: "2026-09-05"
next_step: "Add store-listing surfaces when publication work starts."
---

# Content Map

## Purpose

This file routes public and maintainer-facing content updates for ToolGlows.

## Public Surfaces

| Surface | Role | Update Trigger |
| --- | --- | --- |
| `README.md` | Primary public setup and usage guide | Dependency prerequisites, commands, build workflow, or named tool changes |
| `shipglows_data/technical/developer-guide.md` | Maintainer workflow guide | Node/pnpm requirements, validation commands, or testing/build workflow changes |
| `shipglows_data/technical/architecture.md` | Technical architecture overview | Direct dependency, build plugin, or extension pipeline changes |
| `shipglows_data/business/project-brief.md` | Product and stack summary | Major stack positioning changes |
| `shipglows_data/business/product.md` | Product requirements and stack summary | Major stack positioning changes |

## Current Product Impact

ToolGlows is the only name used in the README, manifests, package metadata, business/product context, source identifiers and future store listings.

## Maintenance Rule

When a dependency, build, or public setup contract changes, update this map or record why no public content surface changed.
