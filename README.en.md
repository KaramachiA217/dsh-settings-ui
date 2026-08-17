# dsh-settings-ui (English)

> Full usage & development manual (Chinese): [`GUIDE.zh.md`](./GUIDE.zh.md) · 中文 README：[`README.md`](./README.md)

DSH web plugin: a **unified settings-page UI kit + floating-panel kit**. It exposes the `ctx.settingsUi` client service so other plugins build settings sections and overlay panels with one consistent style (aligned with `dsh-better-sidebar`, `--dsw-*` semantic tokens) — no hand-rolled UI components, CSS, or load/save/busy/error/saved/revision-conflict state logic.

**Backward compatible**: it only *adds* a service. Plugins that keep using `ctx.slots.inject('settings.section', ...)` directly keep working unchanged.

## Install

Standard bundle (declares `dsh.bundle.patch`). **Preferred: the official CLI** — pack a tarball and `add` it; the command installs the dependency and appends the bundle to `dsh.profile.bundles` in one step:

```bash
npm pack                                   # -> dsh-settings-ui-<ver>.tgz (prebuilt lib/, no build permission needed)
dsh plugin --profile <name> add ./dsh-settings-ui-<ver>.tgz
```

Equivalent manual profile edit (same end state, either path):

1. Add the dependency to the profile's `package.json` (`file:` tarball; `link:` dev mounts fail ESM resolution on rc.6 — always use a tarball).
2. Add `"dsh-settings-ui"` to `dsh.profile.bundles`.
3. `pnpm install`, then hard-refresh the page (client changes need no restart).

Host provides the peers; consumers do **not** declare it as a peer dependency while it is host-provided:

```json
{
  "dependencies": { "dsh-settings-ui": "file:./dsh-settings-ui-<ver>.tgz" },
  "dsh": { "profile": { "bundles": ["dsh-base", "dsh-web-app", "dsh-settings-ui", "..."] } }
}
```

## Quick start

Consuming plugins inject the service and register a section:

```js
export const inject = ['slots', 'settingsUi']
export function apply(ctx) {
  const store = ctx.settingsUi.createSettingsStore({ get: () => call('list') })
  ctx.settingsUi.section({
    id: 'my-plugin',
    order: 300,
    label: () => 'My Settings',
    inject: () => ({ api, ui: ctx.settingsUi, store }),
    render: MySection,
  })
}
```

Two API levels (see `GUIDE.zh.md` for the full reference):

| Level | Entry points | Use case |
|---|---|---|
| Convenient | `ui.section()` / `ui.Rows` / `ui.createSettingsStore` / `ui.useSettings` | Settings cards on the official settings page |
| Free | `ui.overlay()` / `ui.Panel` / `ui.createPanelStore` / `ui.usePanel` | Floating companion panels (search, assistants), with drag / minimize / z-order / localStorage persistence |

Atoms: `SectionHeader`, `Field`, `TextInput`, `TextArea`, `Select`, `Button`, `Switch`, `Checkbox`, `Radio`, `Card`, `StatusDot`, `Badge`, `Spinner`, `Tabs`, `Banner`, `EmptyState`, `List/ListItem`, `Dialog`, `ErrorBoundary`, `toast/ToastHost/useToast`.

State: `createSettingsStore` handles load / save / busy / error / saved-flash / revision conflict; `createPanelStore` handles open / position / size / minimized with optional `persist` (cross-tab synced via `storage` events).

## Compatibility

- **Verified on dsh 0.1.0-rc.5** (official desktop shell, full profile test).
- **rc.6 verified (2026-08-17)**: rc.5 and rc.6 share the same upstream commit (`47f9438`, npm bump only) — zero adaptation needed. Known difference: `link:` dev mounts fail ESM resolution on rc.6, use `file:` tarballs.

## Development

```bash
pnpm install            # dev deps: react / react-dom (tests only)
npm run ci              # 5-step gate: syntax + unit tests + secret scan + sanitization + pack whitelist
npm test                # node:test unit tests (31)
```

## License

MIT — see [LICENSE](./LICENSE).
