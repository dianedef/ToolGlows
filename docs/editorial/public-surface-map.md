---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: public-surface-map
owner: "operator"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - docs/
depends_on:
  - artifact: "CONTENT_MAP.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "README and docs are the active public and maintainer-facing content surfaces."
next_review: "2026-06-04"
next_step: "/sf-docs editorial audit"
---

# Public Surface Map

| Surface | Audience | Sensitive Claims | Update Trigger |
| --- | --- | --- | --- |
| `README.md` | Extension users and maintainers | Security and setup reliability claims | Dependency prerequisites, build commands, package-manager policy, or named tool changes |
| `docs/developer-guide.md` | Maintainers | Validation and workflow claims | Node/pnpm, test, build, lint, or launch workflow changes |
| `docs/architecture.md` | Maintainers and technical reviewers | Stack and security posture claims | Build system, package, plugin, or extension architecture changes |
| `docs/project-brief.md` | Product readers | Stack summary claims | Major stack changes only |
| `docs/prd.md` | Product and engineering readers | Requirements and stack claims | Major stack changes only |

## Current No-Impact Areas

No pricing, compliance, privacy policy, store listing, support script, or marketing site surface is present in this repo.
