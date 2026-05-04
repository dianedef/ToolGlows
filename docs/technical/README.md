---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "ext---toolflowz"
created: "2026-05-04"
updated: "2026-05-04"
status: draft
source_skill: sf-build
scope: technical-docs-index
owner: "operator"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - docs/technical/code-docs-map.md
  - package.json
  - pnpm-lock.yaml
  - vite.config.ts
depends_on:
  - artifact: "specs/dependency-security-second-pass.md"
    artifact_version: "0.1.0"
    required_status: ready
supersedes: []
evidence:
  - "sf-build governance gate requires a project-local technical docs index."
next_review: "2026-06-04"
next_step: "/sf-docs technical audit"
---

# Technical Docs

## Purpose

This directory contains internal, code-proximate technical documentation for ToolFlowz.

## Index

| Document | Role |
| --- | --- |
| `docs/technical/code-docs-map.md` | Maps code surfaces to docs and validation triggers |

## Current Coverage

Coverage is intentionally minimal for the dependency security chantier. Expand this layer with subsystem docs when future code work changes runtime behavior, extension architecture, storage, permissions, or browser integrations.

## Maintenance Rule

Update the map when code changes alter dependency contracts, build tooling, extension manifests, scripts, or validation commands.
