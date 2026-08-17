> **English**: [README.en.md](./README.en.md) · 完整手册：[GUIDE.zh.md](./GUIDE.zh.md)

# dsh-settings-ui

> **完整使用与开发手册见 [GUIDE.zh.md](./GUIDE.zh.md)**。

DSH Web 插件：**统一设置页 UI kit + 浮层面板 kit**。对外暴露 `ctx.settingsUi` 客户端服务，让其它插件用一套统一样式（对齐 `dsh-better-sidebar` 风格、`--dsw-*` 语义 token）接入设置页与 `shell.overlay` 浮层，**不用再各自手写 UI 组件、CSS 和「加载/保存/busy/错误/已保存/revision 冲突」状态逻辑**。

> 样式 token：所有 `var(--dsw-alias-*, fallback)` 的备用色均按**官方暗色主题实值**对齐（v0.2.6）；在官方壳内这些 fallback 恒被真实 token 覆盖，仅在脱离官方壳时兜底。共享样式类名 `sui-` 前缀，与官方 `--dsw-*` / better-sidebar 的 `--dsh-sidebar-width` 命名空间互不冲突。

## 定位与向后兼容

- 本 kit **只新增一个服务**（`settingsUi`），不接管、不过滤 `settings.section` / `shell.overlay` 槽。
- **原有直连方式完全保留**：插件继续用 `ctx.slots.inject('settings.section', ...)` 也照常工作（无需迁移）。
- 想用新方式的插件，`inject` 里加 `settingsUi`，改用 `ctx.settingsUi.section(...)` / `ctx.settingsUi.overlay(...)` 即可。

## 兼容性声明

- **已验证**：dsh **0.1.0-rc.5**（官方壳全套，desktop / desktop-dev profile 实测，含 framework-only bundles 挂载）。
- **rc.6（2026-08-17 已验证）**：kit 0.2.18 tarball 在 rc.6 双链路实测通过——桌面端（`rc6-min` profile，13648）+ web 端（`rc6-web` profile，3090）bundles 直挂：**源码同 commit 铁证**（上游 master = rc6 npm 构建提交 = rc5 checkout HEAD，`47f9438`）+ 契约面核对一致（React 18.3.1 / `--dsw-alias-*` / slots ledger / `installLocale` / `locale.register`）+ 冷启动零错误 + bundle 实核 + UI 手测通过。rc.6 下 `link:` 开发挂载 ESM 解析失败，必须 tarball。
- 未列出的版本组合未验证，不声明兼容。

## 两级 API 速选（便捷 vs 自由）

kit 是「通用 UI 注册入口」：**同一套原子组件 + `sui-*` 样式 + 状态**，按诉求分两级用——

| 诉求 | 用哪个 | 一句话 |
|---|---|---|
| 在**设置页**加一张配置卡片 | `ui.section(config)`（**便捷**） | 声明 `{ id, order, label, render, inject? }`，自动包 `.sui-root` 根 + 共享样式 + 统计卡计数 |
| 在**窗口最前层级**开自己的浮窗（可拖拽 / 最小化 / 置顶 / 位置持久化） | `ui.overlay(config)` + `ui.Panel` + `ui.createPanelStore`（**自由**） | 注册 `shell.overlay` 浮层；`Panel` 给 chrome；`createPanelStore({ persist })` 管开合/位置/置顶 |

- **便捷** = 设置页卡片，适合「配置类」插件（proxy / mcp / search / skill / task-board 的设置卡）。
- **自由** = 任意浮窗，适合「伴随式」插件（桌面助手 / 会话伴侣 / 搜索面板），位置与最小化可 `persist` 到 localStorage。
- 两级**共享**原子组件（`SectionHeader` / `Field` / `Card` / `Button` / `Switch` / `Rows` …）与 `sui-*` 样式；`h` = `React.createElement`。
- 需要「加载/保存/busy/error/revision」就用 `ui.createSettingsStore` + `ui.useSettings`（见 §3）。

**便捷最小骨架**（设置页卡片）见下方「快速示例（完整插件）」。

**自由最小骨架**（浮窗）：

```js
function MyWindow(props) {
  const { ui, panel } = props
  return ui.h(ui.Panel, { title: '我的窗口', panel },
    ui.h(ui.Card, {}, '内容……'),
  )
}
const plugin = {
  inject: ['slots', 'settingsUi'],
  apply(ctx) {
    const ui = ctx.settingsUi
    const panel = ui.createPanelStore({ persist: 'my.window.v1' })  // apply 里建一次
    ui.overlay({ id: 'my-window', order: 100, inject: () => ({ ui, panel }), render: MyWindow })
  },
}
```

## 安装（挂进 profile）

与普通客户端插件一致：单包、`cordis.patch.yml` 单行装配、`dsh.client` 声明、提交 `lib/`。

1. 在 profile 的 `package.json` 加依赖（本地开发用 `link:` 指向源码目录或先 `npm pack` 出 tgz 用 `file:` 挂载）。
2. 在 `dsh.profile.bundles` 里加一行 `"dsh-settings-ui"`。
3. `pnpm install`，然后硬刷新页面（client 改动无需重启）。

示例（desktop profile）：

```json
{
  "dependencies": { "dsh-settings-ui": "file:./dsh-settings-ui-<ver>.tgz" },
  "dsh": { "profile": { "bundles": ["dsh-base", "dsh-web-app", "dsh-settings-ui", "..."] } }
}
```

## API 参考

所有能力都挂在 `ctx.settingsUi` 上。消费插件只需 `inject: ['settingsUi']`，然后在 `apply(ctx)` 里取 `const ui = ctx.settingsUi`。

### 1. 原子组件（统一主题，共享样式只注入一次）

| 组件 | 用途 | 主要 props |
|---|---|---|
| `ui.SectionHeader` | 标题 + 一句话描述 | `{ title, desc }` |
| `ui.Field` | 标签 + 控件 + 提示竖排 | `{ label, hint, children }` |
| `ui.TextInput` | 单行输入 | `{ value, onChange, placeholder, type, disabled?, autoFocus?, onKeyDown?, min?, max? }` |
| `ui.TextArea` | 多行输入（等宽字体） | `{ value, onChange, placeholder, rows, onKeyDown?, disabled? }` |
| `ui.Select` | 下拉 | `{ value, onChange, disabled?, children }` |
| `ui.Button` | 按钮 | `{ kind: 'primary'\|'secondary'\|'danger', disabled, onClick, children }` |
| `ui.Switch` | 开关 | `{ checked, onChange, disabled, label, title? }` |
| `ui.Checkbox` | 复选框 | `{ checked, onChange, disabled?, label? }`（原生 input + 内联文案） |
| `ui.Radio` | 单选框 | `{ checked, onChange, disabled?, label?, name?, value? }`（onChange 收 value） |
| `ui.Card` | 卡片容器 | `{ row?, children }`（`row` = 横向行卡） |
| `ui.StatusDot` | 状态点 + 文案 | `{ color, text, extra }` |
| `ui.Badge` | 圆角徽标 | `{ children, tone?, outline? }`（tone: info/success/warn/error/neutral） |
| `ui.Spinner` | 加载旋转圈 | `{ size?, style? }` |
| `ui.List` / `ui.ListItem` | 结构化行列表 | `List { children }`；`ListItem { children, onClick?, title? }` |
| `ui.Dialog` | 模态对话框 | `{ open, title, onClose?, footer?, children, width? }`（ESC 关闭 / Tab 焦点陷阱 / `aria-modal` / 关闭后焦点归还） |
| `ui.ErrorBoundary` | 错误边界 | `{ title?, fallback?, onError?, children }`——子组件崩溃渲染错误横幅，不白屏；把手/入口放边界外 |
| `ui.Tabs` | 下划线标签页 | `{ items: [{id,label,badge?}], active, onChange }`（`role=tablist` + 方向键导航） |
| `ui.Banner` | 横幅 | `{ kind: 'error'\|'saved'\|'warn', children }` |
| `ui.EmptyState` | 空态占位 | `{ text?, children }` |
| `ui.toast` / `ui.ToastHost` / `ui.useToast` | 一次性通知 | `ui.toast(text, { kind?, ttlMs? })` 广播到已挂载的 `ToastHost`（每插件根挂一个） |
| `ui.h` | `React.createElement` 别名 | `(type, props, ...children)` |

### 2. 声明式行渲染 `ui.Rows`

```js
ui.Rows({
  fields: [
    { key: 'enabled', type: 'switch', label: '启用' },
    { key: 'apiKey', type: 'text', label: 'API Key', placeholder: 'sk-...', hint: '已设置则留空保持不变' },
    { key: 'timeoutMs', type: 'number', label: '超时(ms)' },
    { key: 'transport', type: 'select', label: '传输方式', options: [{ value: 'stdio', label: 'stdio' }, { value: 'http', label: 'http' }] },
    { key: 'args', type: 'textarea', label: '参数', rows: 4 },
  ],
  values: doc,                      // 当前表单对象
  onChange: (key, value) => patchDoc({ [key]: value }),
})
```

`type` 缺省为 `text`；`switch` 走 `Switch`，`textarea` 走 `TextArea`，`select` 走 `Select`，其余走 `TextInput`。

### 3. 设置状态 `ui.createSettingsStore` + `ui.useSettings`

统一「加载/保存/busy/error/saved/revision 冲突」：

```js
const store = ui.createSettingsStore({ get: () => call('get'), update: (p) => call('update', p) }, { savedTtlMs: 3000 })
// store.refresh() / store.commit(payload) / store.run(asyncFn) / store.get()/subscribe()

function MySection(props) {
  const s = ui.useSettings(store)   // { doc, revision, busy, error, saved, loaded, dirty }
  // s.doc 表单、s.error 错误、s.busy 禁用按钮、s.dirty 未保存更改、store.commit(...) 保存
}
```

- `refresh()`：调 `get()` 载入 `doc`（若返回对象含 `revision`，自动提取）；成功清 `dirty`。
- `commit(payload)`：`busy` 期间调 `update(payload)`，成功后 `refresh()` 并闪现 `saved`（`savedTtlMs` 后自清，默认 3000ms）；**返回 `update()` 结果**（undefined → `true`，兼容旧布尔用法）；`settings-conflict` 会自动重载后报错。
- `run(fn)`：对「增/删/启停」这类动作做同样包裹（`busy` + 错误 + 成功后刷新）；**返回 `fn()` 结果**（undefined → `true`）。
- `dirty`：任何 `set({ doc })` 表单编辑置 `true`，`refresh()`/成功写入后归 `false`——离开确认/未保存提示直接读 `s.dirty`。

### 4. 注册 `ui.section(config)`

```js
ui.section({
  id: 'my-plugin',                 // settings.section 的 id（导航键）
  order: 200,                      // 导航位置
  label: () => '我的设置',          // 导航文案（字符串或函数）
  inject: () => ({ api: { get: () => call('get'), update: (p) => call('update', p) } }),
  render: MySection,               // React 组件，接收 compose 后的 props（含 inject 返回的 face）
})
```

`render` 是**组件**（内部可调 `ui.useSettings` 等 hook），`section()` 会包上统一的 `.sui-root` 根并注入共享样式。

### 5. 通用设置统计卡（自动）

> ⚠ **侧栏入口局限**：官方侧栏只有 `sidebar.footer.action` 一个**可叠加**槽（`sidebar.workspaces` / `sidebar.settings` 都是单例槽），所以插件想在侧栏加「独立图标席位 / 平行工作位 / 额外设置入口」当前做不到，只能往底部动作区追加（task-board 入口即走此槽）。设置页内容（`settings.section`）与浮层（`shell.overlay`）则完全可自由叠加。详见 [GUIDE.zh.md §4b](./GUIDE.zh.md)「官方槽位边界与已知局限」。

kit 会在「设置 → 通用设置」自动注册一张卡片：显示当前通过 `ui.section()` **与 `ui.overlay()`** 接入的配置界面总数，**点击卡片展开**可查看具体插件名（导航文案 + id，浮层带「浮层」前缀）与 kit 版本号。计数实时跟随注册/卸载（`section()`/`overlay()` 注册时以 `registrant: 'dsh-settings-ui'` 标记 ledger 条目，统计卡按该标记过滤——ledger 只保留白名单字段，`registrant` 是其中之一）。**卡片文案跟随官方 locale 服务**（kit 注册 `dsh-settings-ui` 字典命名空间，zh/en；locale 缺席时退回内置中文），消费方无需做任何事。

### 6. 浮层面板（v0.2）：`ui.overlay` + `ui.Panel` + `ui.createPanelStore`

插件在**窗口最前层级**（官方 `shell.overlay` 槽，frame 级、click-through 层）创建自己的悬浮页面：

```js
function AssistantPanel(props) {
  const { ui, panel } = props
  return ui.h(ui.Panel, { title: '桌面助手', panel, onClose: () => {} },
    // body 内容（复用全部原子组件与 sui-* 类）
    ui.h(ui.Card, {}, '……'),
  )
}

const plugin = {
  inject: ['slots', 'settingsUi'],
  apply(ctx) {
    const ui = ctx.settingsUi
    // store 在 apply 里创建一次（与 settings store 同铁律）
    const panel = ui.createPanelStore({ persist: 'my-assistant.panel.v1', initiallyOpen: false })
    ui.overlay({
      id: 'my-assistant-overlay', order: 100,
      inject: () => ({ ui, panel }),
      render: AssistantPanel,
    })
  },
}
```

- `ui.overlay(config)`：注册 `shell.overlay` 浮层；`config: { id, order?, label?, render, inject?, locale? }`，带 `registrant` 标记。
- `ui.Panel`：浮层 chrome（`.sui-overlay-panel`）——标题栏**拖拽移动**、**右下角拖拽 resize**、最小化（`—`/`▢`）、关闭（`×`）、**点击置顶**（kit 全局 z 计数器，多浮层点谁谁在上）、**窗口缩放自动 re-clamp**。props：`{ title, panel, onClose?, style?, children }`。
- `ui.createPanelStore({ persist?, initiallyOpen? })`：状态 `{ open, minimized, pos, anchor, size, z }`；`open/close/toggle/toggleMinimized/move/setAnchor/resize/setZ`；`persist` 传 localStorage key 时**位置/锚点/最小化/尺寸跨刷新保留**。
- `ui.usePanel(store)`：React 快照 hook。
- 浮层样式类（`.sui-overlay-panel/-head/-body/-title`、`.sui-pill-tabs`、`.sui-overlay-item/-list`、`.sui-mark` 等）随共享样式自动注入；面板默认靠右上、右侧停靠自动补偿 `--dsh-sidebar-width`（该变量由 `dsh-better-sidebar` 发布为**右侧面板**宽度，拖动时逐帧更新、收起时被移除；变量缺失回退 `0px`，与官方 `--dsw-*` token 无关）。

## 快速示例（完整插件）

```js
window.__ModuleLoader__.load({
  id: 'my-settings-plugin',
  factory: (require) => {
    const React = require('react')
    async function call(method, payload = {}) { /* 同源 fetch，返回 json.value */ }

    function MySection(props) {
      const { ui, store } = props   // store 来自 inject（在 apply 里创建一次，不能在渲染里建）
      const s = ui.useSettings(store)
      React.useEffect(() => { void store.refresh() }, [store])
      return ui.h(React.Fragment, null,
        ui.SectionHeader({ title: '我的设置', desc: '一句话说明' }),
        ui.Card({},
          ui.Rows({
            fields: [{ key: 'enabled', type: 'switch', label: '启用' }],
            values: s.doc ?? {},
            onChange: (k, v) => store.set({ doc: { ...(s.doc ?? {}), [k]: v } }),
          }),
        ),
        s.error ? ui.Banner({ kind: 'error' }, s.error) : null,
        s.saved ? ui.Banner({ kind: 'saved' }, '已保存并生效') : null,
        ui.h('div', { className: 'sui-actions' },
          ui.Button({ kind: 'primary', disabled: s.busy, onClick: () => store.commit(s.doc) }, '保存'),
        ),
      )
    }

    const plugin = {
      name: 'my-settings-plugin',
      inject: ['slots', 'settingsUi'],
      apply(ctx) {
        // 关键：store 在 apply 里创建一次，通过 inject 传进组件；
        // 不要在组件渲染函数里 createSettingsStore（每次渲染新建 store → useSettings 依赖变化 → 死循环卡死页面）。
        const store = ctx.settingsUi.createSettingsStore({ get: () => call('get'), update: (p) => call('update', p) })
        ctx.settingsUi.section({
          id: 'my-settings-plugin', order: 300, label: () => '我的设置',
          inject: () => ({ ui: ctx.settingsUi, store }),
          render: MySection,
        })
      },
    }
    return plugin
  },
})
```
