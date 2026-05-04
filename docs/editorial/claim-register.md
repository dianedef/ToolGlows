---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: claim-register
owner: "operator"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - docs/
depends_on:
  - artifact: "docs/editorial/public-surface-map.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Dependency security work may affect security and setup reliability claims."
next_review: "2026-06-04"
next_step: "/sf-docs editorial audit"
---

# Claim Register

## Active Sensitive Claim Areas

| Claim Area | Current Rule |
| --- | --- |
| Dependency security | Only claim high/critical remediation when `pnpm audit --audit-level high` and `pnpm audit --prod --audit-level high` pass. |
| Build reliability | Only claim Chrome and Firefox build health when `pnpm run build` passes and expected zip outputs exist. |
| Type safety | Do not claim typecheck success unless `pnpm run typecheck` passes. If failures are pre-existing, label them as blockers or residual risk. |
| Package-manager reproducibility | Only claim reproducible setup when `packageManager`, `engines.node`, `.npmrc`, and lockfile are aligned. |

## Maintenance Rule

Update this register when README or docs make new claims about security, reliability, compatibility, privacy, compliance, or release readiness.
