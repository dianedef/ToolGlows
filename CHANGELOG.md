# Change Log

## [2026-09-01]

### Fixed
- Unified interface theme persistence across the toolbar, popup and options page.
- Made options saves truthful with visible success or error feedback.
- Removed unavailable pricing and account actions from extension interfaces.
- Improved narrow-screen layout, semantic design-token coverage and reduced-motion behavior.
- Refined interface spacing and rounded surfaces, and restored opaque selector backgrounds in both themes.

## [2026-05-04]

### Security
- Cleared critical/high pnpm audit findings for production and full dependency graphs, leaving one documented moderate dev-only `uuid` advisory through `web-ext > node-notifier`.
- Removed unused vulnerable build tooling (`unplugin-imagemin`, `unplugin-turbo-console`) and added narrow pnpm overrides for unresolved transitive advisory paths.

### Changed
- Added explicit Node and pnpm package-manager requirements in `package.json`, README, and the developer guide.
- Updated extension build and test tooling including `jsdom`, `vitest`, `web-ext`, `@playwright/test`, `sass`, `tsx`, and `unplugin-icons`.

### Fixed
- Adapted reader mode parsing to `@mozilla/readability@0.6.0` built-in types.
- Pointed manifest linting at the built Firefox extension and fixed manifest fields required by `web-ext lint`.
- Cleared global TypeScript validation failures across background message payloads, stores, composables, options pages, and stale declaration files.

### Added
- Added minimal technical and editorial governance maps for dependency/security documentation tracking.

## Example update

- Update README.md
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies aliquam, nunc nisl ultricies nunc, vitae ultricies.

- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies aliquam, nunc nisl ultricies nunc, vitae ultricies.

- [x] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies aliquam, nunc nisl ultricies nunc, vitae ultricies.

- [ ] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget ultricies aliquam, nunc nisl ultricies nunc, vitae ultricies.

| Left columns | Right columns | Center Align |
| ------------ | ------------: | :----------: |
| left foo     |     right foo |  center foo  |
| left bar     |     right bar |  center bar  |
| left baz     |     right baz |  center baz  |
