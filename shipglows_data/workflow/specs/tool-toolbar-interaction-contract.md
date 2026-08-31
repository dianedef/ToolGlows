# Tool toolbar interaction contract

## User story

As a ToolGlows user, I can understand and control every configured tool from the toolbar without an icon disappearing when I deactivate it.

## Contract

- Every registered tool remains visible in the expanded toolbar.
- Left click invokes the tool's real primary activation/deactivation API and never merely toggles toolbar membership.
- Right click opens the tool's related control/settings surface and never changes its enabled state.
- Enabled buttons expose `aria-pressed="true"` and retain their normal icon treatment.
- Disabled buttons expose `aria-pressed="false"` and use the shared desaturated treatment while remaining legible and interactive.
- A tool control may be mounted while its settings are visible even when the tool itself is disabled.
- Dragging beyond the toolbar threshold moves the whole toolbar and suppresses the generated click.

## Interaction classes

| Class | Left click | State source | Tools |
|---|---|---|---|
| Toggle | Enable or disable the real page mode | Owning feature store/runtime | Dark Mode, Auto Copy, Hide Element |
| Command | Execute once; no `aria-pressed` | Command execution lifecycle | Links Explorer, Social Analysis, Reload All Tabs |
| Panel | Open or close the tool's working surface | Panel visibility | Word Count, OCR, Speed Browsing, Infinite Scroll, Feed Eradicator, Reader Mode, Search Jumper, Drag Open, Instagram Saved, Rich Copy, Better Gmail, Quick Actions |

`activeTools` controls whether a tool implementation is loaded in the page. It is not the canonical runtime state for toggles and is not presented as such by toolbar buttons.

## Source of truth

- Tool availability and enabled state: `src/stores/toolglows.ts`.
- Toolbar interaction orchestration: `src/components/ToolGlowsBar.vue`.
- Interaction regression proof: `src/components/__tests__/ToolGlowsBar.test.ts`.

## Verification

- Focused toolbar interaction tests cover left click, right click, inactive visibility and drag/click separation.
- Full Vitest, typecheck, Chrome/Firefox builds and Firefox manifest lint must pass.
- Rendered browser proof requires reloading the unpacked extension after each production build.

## Validation record

- 2026-08-29: Edge proof confirmed only the toolbar-membership interaction and visual treatment. This was incorrectly reported as functional activation proof; the distinction was caught during user acceptance.
- 2026-08-30: Dark Mode was connected to `darkModeStore.setActive`, with toolbar membership synchronized secondarily. Functional adapters for the remaining tools are pending an explicit tool-by-tool implementation pass.
