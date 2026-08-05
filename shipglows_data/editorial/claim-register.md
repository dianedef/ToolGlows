---
artifact: editorial_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-05-04"
updated: "2026-08-05"
status: reviewed
source_skill: sg-docs
scope: claim-register
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - README.md
  - shipglows_data/business/product.md
  - shipglows_data/editorial/public-surface-map.md
depends_on:
  - artifact: "shipglows_data/editorial/public-surface-map.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Dependency security work may affect security and setup reliability claims."
next_review: "2026-09-05"
next_step: "Re-evaluate claims after full browser QA and store packaging."
---

# Claim Register

## Active Sensitive Claim Areas

| Claim Area | Current Rule |
| --- | --- |
| Dependency security | Only claim high/critical remediation when `pnpm audit --audit-level high` and `pnpm audit --prod --audit-level high` pass. |
| Build reliability | Only claim Chrome and Firefox build health when `pnpm run build` passes and expected zip outputs exist. |
| Type safety | Do not claim typecheck success unless `pnpm run typecheck` passes. If failures are pre-existing, label them as blockers or residual risk. |
| Package-manager reproducibility | Only claim reproducible setup when `packageManager`, `engines.node`, `.npmrc`, and lockfile are aligned. |
| Product readiness | Describe ToolGlows as in active development until proportional real-browser and store-package proof exists. |
| Third-party integrations | Label Gmail, Instagram and social-analysis modules experimental until dedicated browser tests cover the supported platform state. |
| Ecosystem relationship | ToolGlows is standalone and complementary to CommandGlows; no bundle, shared account or entitlement claim is valid until implemented. |

## Maintenance Rule

Update this register when README or docs make new claims about security, reliability, compatibility, privacy, compliance, or release readiness.
