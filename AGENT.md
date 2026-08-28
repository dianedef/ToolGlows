# ToolGlows — Agent Guide

## Product boundary

ToolGlows is a Manifest V3 browser extension for Chrome and Firefox. It places a configurable toolbar in web pages so people can complete reading, capture, navigation and focus actions without switching applications.

The stable core is page-level browser utility. Gmail, Instagram and social-analysis modules depend on third-party DOM structures and remain experimental until dedicated browser proof exists. Do not present the extension as store-ready, universally compatible or privacy-reviewed without current evidence.

## Source of truth

- Product, positioning and scope: `shipglows_data/business/`.
- Architecture, code navigation and maintainer workflow: `shipglows_data/technical/`.
- Public claims and content surfaces: `shipglows_data/editorial/`.
- Active work, audits and specifications: `shipglows_data/workflow/`.
- `README.md` is the repository-facing installation and product overview; it must agree with the canonical corpus.

## Working rules

- Preserve Chrome and Firefox support. Browser-specific manifest changes belong in the corresponding manifest configuration.
- Treat manifest permissions and cross-context messages as security-sensitive. Justify any new permission, privileged browser API or message shape and add focused proof.
- Keep privileged tab, window, reload and bookmark actions in the background context. Content scripts communicate through the maintained bridge and validate bounded payloads before privileged actions occur.
- Keep the injected toolbar unobtrusive: per-site behavior must not unexpectedly change page content, navigation or data.
- Do not change generated `dist/` or vendored `src/assets/primevue/` files by hand unless the task explicitly concerns those artifacts.
- Keep documentation aligned whenever behavior, manifests, permissions, builds, tool registration or public claims change.

## Local workflow

Use pnpm as pinned by `package.json`. The focused baseline is:

```bash
pnpm typecheck
pnpm exec vitest run
pnpm build
pnpm lint:manifest
```

The extension is loaded manually from `dist/chrome` or `dist/firefox`; do not install it into a personal browser profile automatically. See `ENVIRONMENT.md` for the local extension workflow.
