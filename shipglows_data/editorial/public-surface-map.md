---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-05-04"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: public-surface-map
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - shipglows_data/business/
  - shipglows_data/technical/
depends_on:
  - artifact: "shipglows_data/editorial/content-map.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "README and docs are the active public and maintainer-facing content surfaces."
next_review: "2026-09-05"
next_step: "Add store listing, privacy and support surfaces when declared."
---

# Public Surface Map

| Surface | Audience | Sensitive Claims | Update Trigger |
| --- | --- | --- | --- |
| `README.md` | Extension users and maintainers | Security and setup reliability claims | Dependency prerequisites, build commands, package-manager policy, or named tool changes |
| `shipglows_data/technical/developer-guide.md` | Maintainers | Validation and workflow claims | Node/pnpm, test, build, lint, or launch workflow changes |
| `shipglows_data/technical/architecture.md` | Maintainers and technical reviewers | Stack and security posture claims | Build system, package, plugin, or extension architecture changes |
| `shipglows_data/business/project-brief.md` | Product readers | Stack summary claims | Major stack changes only |
| `shipglows_data/business/product.md` | Product and engineering readers | Requirements and stack claims | Major stack changes only |

## Current No-Impact Areas

No pricing, compliance, privacy policy, store listing, support script, or marketing site surface is present in this repo.
