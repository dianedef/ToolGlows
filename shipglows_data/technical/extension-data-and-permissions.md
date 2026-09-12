---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "ToolGlows"
created: "2026-09-04"
updated: "2026-09-04"
status: active
source_skill: "sg-engineering"
scope: "extension-data-permissions-and-store-disclosures"
owner: "ToolGlows"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
next_step: "Keep store declarations synchronized with this matrix before publication."
---

# Extension data and permissions

This document is the maintainer source for Chrome Web Store and Firefox Add-ons
privacy declarations. ToolGlows intentionally runs its toolbar on every
compatible URL; `<all_urls>` is a product invariant, not unused future access.

## Data handling matrix

| Data or capability | Trigger and purpose | Storage | Transmission |
|---|---|---|---|
| Current URL and domain | Select per-site settings and execute user-requested page tools | Domain may be stored with per-site settings | Not sent to the publisher |
| Page selection and visible text | Copy, count, search, reader, and analysis actions initiated by the user | Temporary in page memory unless the user copies it | Not sent to the publisher |
| Tab URL and title | Tab navigation, drag-open, and reload actions | Not retained as browsing history | Not sent to the publisher |
| Bookmarks | User-requested bookmark actions | Stored by the browser bookmark service | Not sent to the publisher |
| Preferences and hidden-element selectors | Persist configuration and per-site behavior | Browser extension storage | Not sent to the publisher |
| Recognized cookie banner DOM and automatic-acceptance choice | Explicit opt-in to click accept-all controls, including advertising cookies | Local-only preference and exact-host exclusions; banner text is not persisted | No publisher transmission; the clicked site's own consent processing and tracking may follow |
| Page CSS/image resource URLs and bytes | Let the active dark-mode engine transform existing external page styles and analyze background images | Temporary extension memory; no persistent resource cache | Anonymous GET to the resource host; no cookies or referrer, no publisher relay |

## Permission justification

| Permission | Current responsibility |
|---|---|
| `<all_urls>` | Inject the always-available toolbar, dark-mode prepaint, frame copy support, and user-requested page tools on compatible pages; fetch eligible page CSS/images for active dark mode when normal page CORS access fails |
| `storage` | Persist preferences, active tools, themes, shortcuts, and per-site hidden-element selectors |
| `tabs` | Enumerate, open, arrange, and reload tabs for explicit navigation tools |
| `bookmarks` | Create bookmark folders and entries requested by the user |
| `alarms` | Maintain scheduled dark-mode state across service-worker suspension |
| `scripting` | Register and update the document-start dark-mode prepaint script |
| `sidePanel` (Chrome) | Expose the declared Chrome side panel |

## Store disclosure invariants

The dark-mode resource path reuses existing host grants. Only the internal
content-script bridge can request the bounded anonymous CSS/image fetch; returned
bytes are not exposed through a page-world API. MIME, URL, redirect, size, timeout
and concurrency restrictions are described in the architecture document. This
implementation note is not a completed privacy or store review; the network-flow
change must be reconciled with public/store disclosures before release.

- The extension has one disclosed purpose: an always-available page utility toolbar.
- The toolbar's all-site access is stated before installation and in the privacy policy.
- No browsing-history analytics, advertising profile, account, or publisher telemetry is implemented.
- The incomplete OCR prototype is not part of the shipped product or dependency graph.
- Local processing is still disclosed as data handling.
- Firefox `data_collection_permissions.required: ["none"]` remains valid only
  while no extension or user data is transmitted outside the add-on/browser.
- Any new network request, telemetry, account, remote service, or permission
  requires updating this matrix, the privacy policy, both store declarations,
  and focused policy tests before release.
