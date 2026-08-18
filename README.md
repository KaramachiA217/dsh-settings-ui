# dsh-settings-ui

English | [中文](README.zh.md)

[![npm](https://img.shields.io/npm/v/dsh-settings-ui)](https://www.npmjs.com/package/dsh-settings-ui)
[![stars](https://img.shields.io/github/stars/KaramachiA217/dsh-settings-ui?style=flat)](https://github.com/KaramachiA217/dsh-settings-ui)

A unified settings-page UI kit + floating-panel kit for DeepSeek Harness plugins. Exposes the `ctx.settingsUi` service so other plugins build settings sections and overlay panels with one consistent style (aligned with `dsh-better-sidebar`, `--dsw-*` semantic tokens) — no hand-rolled components, CSS, or load/save/busy/error/saved/revision-conflict state logic.

## Install

```sh
npm i dsh-settings-ui
```

Add it to the profile bundles (the host provides the peers — consumers do **not** declare it as a peer dependency while it is host-provided):

```json
{
  "dependencies": { "dsh-settings-ui": "npm:dsh-settings-ui" },
  "dsh": { "profile": { "bundles": ["dsh-base", "dsh-web-app", "dsh-settings-ui", "..."] } }
}
```

## What you get

- **Two API levels** — `ui.section()` for convenient settings-page cards; `ui.overlay()` / `ui.Panel` / `createPanelStore` for free-form floating panels (drag / minimize / z-order / position persistence, cross-tab synced via `storage` events)
- **Atomic component family** — `SectionHeader` / `Field` / `TextInput` / `TextArea` / `Select` / `Button` / `Switch` / `Checkbox` / `Radio` / `Card` / `StatusDot` / `Badge` / `Spinner` / `Tabs` / `Banner` / `EmptyState` / `List` / `Dialog` / `ErrorBoundary` / `toast`
- **Declarative forms** — `Rows` renders field descriptors; `createSettingsStore` + `useSettings` handle load / save / busy / error / saved-flash / revision conflict
- **Backward compatible** — only *adds* a service; direct `ctx.slots.inject('settings.section', ...)` keeps working unchanged
- **Self-healing** — `section()` / `overlay()` auto-wrap an error boundary: a render crash collapses only that card, never the whole settings page

## Compatibility

- Verified on dsh **0.1.0-rc.5** (official desktop shell, full profile test).
- **rc.6 verified (2026-08-17)**: rc.5 and rc.6 share the same upstream commit (`47f9438`, npm bump only) — zero adaptation. Known difference: `link:` dev mounts fail ESM resolution on rc.6, use `file:` tarballs.

## Development

```bash
pnpm install            # dev deps: react / react-dom (tests only)
npm run ci              # 5-step gate: syntax + unit tests + secret scan + sanitization + pack whitelist
npm test                # node:test unit tests (31)
```

## Roadmap

- **1.0.0**: `ui.describeForm` — consume the official `settings.describe` schemastery schema to auto-render forms, with user-override annotations, `redactSecrets` write-only inputs and revision-conflict handling; plus a built-in `settingsScope` bridge (default `createSettingsStore` binding to the official settings API).
- **Engineering**: automated `.d.ts` ↔ implementation drift checks.
- **Out of scope (official contract limits)**: parallel sidebar seats (`sidebar.workspaces` / `sidebar.settings` are singletons); light theme.
- **Known limitation**: multiple `ToastHost` instances in one page show the same toast — mount one host per page.
- **Maintenance commitment**: re-run the contract-diff methodology on upstream rc drift; feedback via GitHub discussions.

## License

MIT — see [LICENSE](./LICENSE). · Full manual (Chinese): [GUIDE.zh.md](./GUIDE.zh.md)
