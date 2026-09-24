---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "toolglows"
created: "2026-09-24"
created_at: "2026-09-24"
updated: "2026-09-24"
updated_at: "2026-09-24"
status: draft
source_skill: "sg-experience"
scope: "toolbar-interaction-layout"
owner: "operator"
confidence: medium
risk_level: "medium"
security_impact: "no"
docs_impact: "yes"
linked_systems:
  - "src/components/ToolGlowsBar.vue"
  - "src/types/tools.ts"
  - "src/data/toolCatalog.ts"
  - "src/stores/toolglows.ts"
  - "shipglows_data/workflow/specs/tool-toolbar-interaction-contract.md"
depends_on: []
supersedes: []
---

# Toolbar Interaction and Layout

## Status

Implementation is in the working tree. Typecheck passes. Chrome/Firefox package builds and rendered browser proof are pending a Doppler project configuration for ToolGlows.

## User Story

As a ToolGlows user, I can tell whether a toolbar tool will launch an action, open a workspace, or enable a behavior, and I can find my selected tools without scanning one undifferentiated row of icons.

## Product Decision

Organize selected toolbar tools by their primary first-click behavior, independently from their subject-matter category:

| Toolbar group | Primary behavior | Candidate tools |
|---|---|---|
| **Lancer** | Starts a one-shot action immediately | Links Explorer, Social Analysis, Reload All Tabs |
| **Ouvrir** | Opens a panel where the user can inspect, configure, or choose an action | Word Count, Speed Browsing, Infinite Scroll, Feed Eradicator, Search Jumper, Drag Open, Instagram Saved, Rich Copy, Better Gmail, Quick Actions |
| **Activer** | Turns a tool behavior or interaction mode on or off | Dark Mode, Reader Mode, Auto Copy, Cookie Consent, Hide Element |

These are interaction groups, not thematic categories. A tool can configure ongoing or automatic behavior inside its panel; it belongs in **Ouvrir** when the toolbar click opens that panel. Cookie Consent remains an explicit opt-in. Hide Element belongs in **Activer** because its toolbar action enters or leaves a temporary page-element selection mode. Reader Mode toggles the reading surface directly; its appearance settings remain accessible separately. Rich Copy opens its panel of copy actions.

## Layout

- All registered tools remain visible, including inactive tools, so users can turn a toggle back on from the toolbar.
- With six or fewer registered tools and enough horizontal room, render one horizontal toolbar row with three visually separated sections in the order **Lancer**, **Ouvrir**, **Activer**.
- With more than six registered tools, render three stacked rows in that same order, one interaction group per row. Viewports at or below 640 px also stack the groups.
- Do not make layout depend on runtime toggle state. Every registered tool remains visible in its group.
- Do not leave empty section headings or separators when a group has no selected tools. Settings remains reachable in either layout.
- In the stacked layout, each row has a concise visible group label when space permits; in the compact layout, separators and accessible group names identify the sections without adding persistent text that crowds the icons.
- Group ordering and each group's internal order are stable. Expanding, pinning, dragging, resizing, or changing the viewport must not reorder tools.

The precise density threshold is an implementation detail to choose from rendered measurements across supported toolbar sizes and narrow viewports. A fixed count alone is insufficient if the toolbar size or viewport changes the fit.

## Interaction Contract

- Each tool's primary behavior is explicit metadata; visual grouping must not infer behavior from its subject category or current enabled state.
- Existing left-click behavior remains authoritative: launch tools launch, panel tools open, and toggle tools toggle their real state.
- Icon brightness reflects whether the tool is selected in the saved tool configuration; a separate inset indicator and `aria-pressed` reflect whether a mode is running or a panel is open. A selected tool is not presented as already running.
- Right click and Shift+F10 continue to open the tool's settings/control surface. No long-press gesture is introduced by this change.
- Tooltips, accessible names, pressed state, and first-use explanations describe the same action as the group in which the tool appears.
- If a tool's left-click behavior changes, its metadata, onboarding copy, and interaction contract change together.
- Toolbar visibility is independent of runtime enabled state: every registered tool remains in its interaction group, and its visual state communicates whether it is active.

## Inventory Questions Before Implementation

- Confirm the visual label and status wording for Hide Element's temporary selection mode.
- Review the six-tool and 640 px breakpoints against rendered fit at every toolbar size and narrow viewport.

## Success Criteria

- A user can predict the first result of each visible tool from its group, icon tooltip, or accessible name.
- The toolbar has three distinct interaction groups and retains every selected tool at every supported size and viewport.
- Compact layout uses one horizontal row with three sections; dense layout uses three stacked rows.
- Users can still enable an off toggle and reach settings when a group is empty.
- Interaction remains usable with mouse, keyboard, and touch-capable pointer input; group layout does not interfere with toolbar dragging.
- Existing saved tool selections and runtime behaviors are preserved.

## Verification Plan

- Review all 18 registered tools against their actual first-click behavior and update the interaction contract.
- Verify compact and stacked layouts at every toolbar size and at narrow and wide viewports, including empty and uneven groups.
- Verify toggle on/off state, command execution, panel opening, right click, Shift+F10, first-use explanations, and drag suppression after the layout change.
- Run focused toolbar interaction coverage, typecheck, and Chrome/Firefox package builds through the project's Doppler workflow; perform rendered browser proof with the unpacked Chrome extension.

## Constraints

- Preserve current preferences and active-tool persistence.
- Do not add long press, new permissions, telemetry, or background automation as part of the layout change.
- This spec does not claim store readiness or universal site compatibility.
