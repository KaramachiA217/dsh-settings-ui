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

- **Three API levels** — `ui.pluginCard()` for rc7 official "plugin configuration" tab cards (persisted via the official `ctx.settingsScope`); `ui.section()` for classic settings-page cards; `ui.overlay()` / `ui.Panel` / `createPanelStore` for free-form floating panels (drag / minimize / z-order / position persistence, cross-tab synced via `storage` events)
- **Atomic component family** — `SectionHeader` / `Field` / `TextInput` / `TextArea` / `Select` / `Button` / `Switch` / `Checkbox` / `Radio` / `Card` / `StatusDot` / `Badge` / `Spinner` / `Tabs` / `Banner` / `EmptyState` / `List` / `Dialog` / `ErrorBoundary` / `toast`
- **Declarative forms** — `Rows` renders field descriptors; `createSettingsStore` + `useSettings` handle load / save / busy / error / saved-flash / revision conflict — over a **fenced route** *or* the official **settingsScope** backend
- **Backward compatible** — only *adds* a service; direct `ctx.slots.inject('settings.section', ...)` keeps working unchanged
- **Self-healing** — `section()` / `overlay()` / `pluginCard()` auto-wrap an error boundary: a render crash collapses only that card, never the whole settings page

## Compatibility

- Verified on dsh **0.1.0-rc.5** (official desktop shell, full profile test).
- **rc.6 verified (2026-08-17)**: rc.5 and rc.6 share the same upstream commit (`47f9438`, npm bump only) — zero adaptation. Known difference: `link:` dev mounts fail ESM resolution on rc.6, use `file:` tarballs.
- **rc.7 (0.3.0, 2026-08-20)**: `pluginCard()` targets the rc7 keyed `settings.plugin.item` slot + the official `ctx.settingsScope` (save-as-you-go, revision-fenced). The classic surface (`settings.section` / `settings.general.item` / `shell.overlay`) is unchanged on rc.7, so `section()`/`overlay()` keep working. `pluginCard()` is the rc7-era path; use it for new settings cards.

## The rc7 path: `pluginCard()`

With rc7, the official recipe for plugin settings is the **Plugins tab card** (keyed `settings.plugin.item` by the settings namespace), persisted through the official `ctx.settingsScope`. `pluginCard()` gives you a kit-chromed card over that contract without hand-rolling the scope binding or state:

```js
const card = ctx.settingsUi.pluginCard({
  key: 'my-plugin',                 // required = settings namespace = tab key
  header: { title: '我的插件', desc: '一句话说明' },
  fields: [
    { key: 'enabled', type: 'switch', label: '启用' },
    { key: 'endpoint', type: 'text', label: '服务地址' },
  ],
})
// card.store.setField('enabled', true)   // save-as-you-go via the scope
```

That's it — the store (`createSettingsStore`'s settingsScope backend) calls `ctx.settingsScope.bind({ namespace: key })`; each edit persists immediately with the official revision fence. Use `content: (ctx) => ...` for a fully custom body, `showIn: 'both'`/`'settings-page'` to also surface a classic settings-page section, and `chrome: 'minimal'` to drop the kit card shell.

**Single-track note (family)** — prefer `pluginCard()` (official tab) for new settings cards so the family doesn't fragment into "half on the settings page, half on the Plugins tab". `section()` remains fully supported for existing consumers and rc6/headless environments; you do not need to migrate anything already on it.

Read both the card shell and transport are aligned to the official contract (alignment principles): the kit only ever registers through official slots/services (`settings.plugin.item` / `settings.section` / `shell.overlay` / `settingsScope` / `locale`), resolves `.sui-*` from `--dsw-*` tokens, and never imports the official card chrome (value-import purity gate) — it renders its own, token-aligned shell and owns its own form/state/a11y.

## Development

```bash
pnpm install            # dev deps: react / react-dom (tests only)
npm run ci              # 5-step gate: syntax + unit tests + secret scan + sanitization + pack whitelist
npm test                # node:test unit tests (45)
```

## Roadmap

- **1.0.0**: `ui.describeForm` — consume the official `settings.describe` schemastery schema to auto-render forms, with user-override annotations, `redactSecrets` write-only inputs and revision-conflict handling on top of the now-shipped `settingsScope` backend.
- **Engineering**: automated `.d.ts` ↔ implementation drift checks.
- **Out of scope (official contract limits)**: parallel sidebar seats (`sidebar.workspaces` / `sidebar.settings` are singletons); light theme.
- **Known limitation**: multiple `ToastHost` instances in one page show the same toast — mount one host per page.
- **Maintenance commitment**: re-run the contract-diff methodology on upstream rc drift; feedback via GitHub discussions.

## License

MIT — see [LICENSE](./LICENSE). · Full manual (Chinese): [GUIDE.zh.md](./GUIDE.zh.md)
