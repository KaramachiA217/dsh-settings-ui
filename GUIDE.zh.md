# dsh-settings-ui kit — 使用与开发手册（v0.2.22）

> 面向「用 kit 给 DSH Web/桌面端开发 UI」的完整手册。API 以本仓库 `lib/client.js` 为准；本文与代码不一致时以代码为准，并请更新本文。

## 1. 定位与架构

- kit 是**纯客户端 Cordis 服务**：对外暴露 `ctx.settingsUi`（消费方 `inject: ['slots', 'settingsUi']`）；kit 自身注入面 `inject: ['slots', 'locale']`（`locale` = 官方 locale 插件服务，统计卡字典注册用；官方壳必带，缺席环境 kit 不激活）。
- 一句话：**一套 `--dsw-*` token 统一样式 + 原子组件 + 设置状态机 + 两类注册入口（设置页卡片 / 自由浮层窗口）**，插件不再手写 CSS 与加载/保存状态。
- 结构：`lib/index.js`（host 空壳）+ `lib/client.js`（全部能力，`window.__ModuleLoader__.load` CJS 工厂，无构建步骤，改完 `node --check`）；TypeScript 消费方用 `lib/client.d.ts`（export `./client` types 条件）。
- 单测：`node --test test/`（沙箱内用 `node test/kit.test.mjs`，见 HANDOFF §6）；29 项。
- 版本：`package.json.version` 与 `lib/client.js` 内 `KIT_VERSION` 常量**必须同步**；统计卡显示该版本号供核对。
- 样式注入：`ensureStyle()` 幂等注入一次（id **带版本号** `dsh-settings-ui-style-v<ver>`，0.2.18 起——旧版 kit 副本先注入的样式不会阻塞新版），全部类名 `sui-` 前缀，不污染其它插件。

## 2. 快速上手

```js
window.__ModuleLoader__.load({
  id: 'my-plugin',
  factory: (require) => {
    const React = require('react')
    const plugin = {
      name: 'my-plugin',
      inject: ['slots', 'settingsUi'],
      apply(ctx) {
        const ui = ctx.settingsUi
        const store = ui.createSettingsStore({ get: () => call('get'), update: (p) => call('update', p) })
        ui.section({
          id: 'my-plugin', order: 300, label: () => '我的设置',
          inject: () => ({ ui, store }),
          render: MySection,
        })
      },
    }
    return plugin
  },
})
```

## 3. API 参考

### 3.1 原子组件（全部挂在 `ui.*`，样式共享注入一次）

| 组件 | 用途 | props |
|---|---|---|
| `ui.h` | `React.createElement` 别名 | `(type, props, ...children)` |
| `ui.SectionHeader` | 标题 + 描述 | `{ title, desc? }` |
| `ui.Field` | 标签+控件+提示竖排 | `{ label, hint?, children }` |
| `ui.TextInput` | 单行输入 | `{ value, onChange, placeholder?, type?, disabled?, autoFocus?, onKeyDown?, min?, max? }` |
| `ui.TextArea` | 多行（等宽） | `{ value, onChange, placeholder?, rows?, disabled?, onKeyDown? }` |
| `ui.Select` | 下拉 | `{ value, onChange, disabled?, children }`（children 为 `<option>`） |
| `ui.Button` | 按钮 | `{ kind?: 'primary'|'secondary'|'danger', disabled?, onClick?, children }` |
| `ui.Switch` | 开关 | `{ checked, onChange, disabled?, label?, title? }` |
| `ui.Checkbox` | 复选框（原生 + 内联文案） | `{ checked, onChange, disabled?, label? }` |
| `ui.Radio` | 单选框（原生 + 内联文案） | `{ checked, onChange, disabled?, label?, name?, value? }`（onChange 收 value） |
| `ui.Card` | 卡片 | `{ row?: boolean, children }`（row=横向行卡） |
| `ui.StatusDot` | 状态点+文案 | `{ color, text, extra? }` |
| `ui.Badge` | 圆角徽标 | `{ children, tone?: 'info'|'success'|'warn'|'error'|'neutral', outline?: boolean }` |
| `ui.Spinner` | 加载旋转圈 | `{ size?, style? }`（装饰性，`aria-hidden`） |
| `ui.List` / `ui.ListItem` | 结构化行列表 | List: `{ children }`；ListItem: `{ children, onClick?, title? }` |
| `ui.Dialog` | 模态对话框 | `{ open, title, onClose?, footer?, children, width? }`；a11y：`role=dialog`+`aria-modal`、打开时焦点入内、Tab/Shift+Tab 循环、ESC 调 `onClose`、关闭后焦点归还 |
| `ui.ErrorBoundary` | 错误边界 | `{ title?, fallback?, onError?, children }`——子组件崩溃渲染错误横幅（或 `fallback(error)`），不白屏；把手/入口放边界外（见 §5-8） |
| `ui.Tabs` | 下划线标签页 | `{ items: [{id,label,badge?}], active, onChange }`；a11y：`role=tablist`/`role=tab`/`aria-selected` + roving tabindex + 左右/Home/End 方向键 |
| `ui.Banner` | 横幅 | `{ kind: 'error'|'saved'|'warn', children }` |
| `ui.EmptyState` | 空态占位 | `{ text?, children }`（`.sui-empty` 类的原子形态） |
| `ui.toast` / `ui.ToastHost` / `ui.useToast` | 一次性通知 | `ui.toast(text, { kind?, ttlMs? })` 广播到所有已挂载 `ToastHost`（每个插件根挂一个）；`useToast()` 返回本宿主当前条目 |
| `ui.Panel` | 浮层 chrome | 见 3.5 |

### 3.2 声明式表单 `ui.Rows`

```js
ui.Rows({
  fields: [
    { key: 'enabled', type: 'switch', label: '启用' },
    { key: 'apiKey', type: 'text', label: 'API Key', hint: '已设置则留空保持不变' },
    { key: 'timeoutMs', type: 'number', label: '超时(ms)' },
    { key: 'transport', type: 'select', label: '传输', options: [{ value: 'stdio', label: 'stdio' }] },
    { key: 'args', type: 'textarea', label: '参数', rows: 4 },
  ],
  values: doc,                       // 当前表单对象
  onChange: (key, value) => patchDoc({ [key]: value }),
})
```

`type` 缺省 `text`；`switch`→Switch、`textarea`→TextArea、`select`→Select、其余→TextInput。

### 3.3 设置状态机 `ui.createSettingsStore` + `ui.useSettings`

```js
const store = ui.createSettingsStore({ get: () => call('get'), update: (p) => call('update', p) }, { savedTtlMs: 3000 })
// store: { get, set, subscribe, refresh, commit, run }
const s = ui.useSettings(store)   // { doc, revision, busy, error, saved, loaded, dirty }
```

- `refresh()`：调 `get()` 载入 `doc`；返回对象含 `revision` 自动提取；失败置 `error`。成功同时清 `dirty`。
- `commit(payload)`：busy→`update(payload)`→refresh→`saved` 闪现（`savedTtlMs` 后自清，默认 3000ms）；**`settings-conflict` 错误码自动 refresh 后报错**（消费方无需处理）。**成功返回 `update()` 的结果**（结果为 undefined 时返回 `true`，兼容旧布尔用法），失败返回 `false`。
- `run(fn)`：对增/删/启停等动作做 busy/错误/成功后刷新包裹（无整体 doc 保存时用这个；此时可只传 `{ get }`）。**成功返回 `fn()` 的结果**（undefined → `true`）。
- `dirty`：任何 `set({ doc })`（表单本地编辑）置 true，`refresh`/成功 `commit`/`run` 后归 false——做「未保存更改」提示/离开确认直接读 `s.dirty`。
- 语义对照：单一「保存一份 doc」用 `commit`；列表 CRUD/tab 动作用 `run`。

### 3.4 设置页注册 `ui.section(config)`

```js
ui.section({
  id: 'my-plugin',                 // settings.section 导航键（必填）
  order: 200,                      // 导航排序
  label: () => '我的设置',          // 字符串或函数（跟随 locale）
  locale: 'my-ns',                 // 可选：透传给 slot 注册 → 组件 props 获得框架合成 t
  inject: () => ({ api, ui, store }),  // 业务 face（组件 props）
  render: MySection,               // React 组件，自动包 .sui-root 根 + 共享样式
})
```

- `render` 内部可调 hooks；**返回 `React.Fragment`（多个元素），不要包一层裸 `<div>`**（会隔断 `.sui-root` 的 gap）。
- 注册项自动打 `registrant: 'dsh-settings-ui'` → 通用设置统计卡按此计数。

### 3.5 浮层窗口 `ui.overlay` + `ui.Panel` + `ui.createPanelStore`

**注册**（官方 `shell.overlay` 槽，frame 级最顶层、click-through 层）：

```js
ui.overlay({ id: 'my-assistant', order: 100, label: '我的面板',
  inject: () => ({ ui, panel }), render: MyOverlay })
```

**面板 chrome**（`ui.Panel`，`.sui-overlay-panel`）：

```js
ui.h(ui.Panel, { title, panel, onClose?, style? }, /* body children */)
```

- 标题栏**拖拽移动**、最小化（`—`/`▢`）、关闭（`×`）、**点击置顶**（kit 全局 z 计数器，多浮层点谁谁在上）。
- **右下角拖拽 resize**（`.sui-overlay-resize`，宽 280–720 / 高 200–900，随视口收缩）；**窗口缩放时自动重新 clamp** pos/anchor，面板不会丢出屏外。
- 右侧默认定位；**锚定模式**：`panel.setAnchor({x,y})` 设置停靠锚点后，面板贴锚点右侧弹出（`left = anchor.x + 40`），拖标题栏 = 移动锚点。典型用法：把手（`.sui-fab`）拖动更新 anchor → 面板跟随。

**面板状态** `ui.createPanelStore({ persist?, initiallyOpen? })` + `ui.usePanel(store)`：

- state：`{ open, minimized, pos, anchor, size, z }`；方法：`open/close/toggle/toggleMinimized/move/setAnchor/resize/setZ/subscribe/get/set`。
- `persist` 传 localStorage key 时 **pos/anchor/minimized/size 跨刷新保留**。

### 3.6 通用设置统计卡（自动）

kit 自动在「设置 → 通用设置」注册卡片：显示经 `ui.section()` **与 `ui.overlay()`** 接入的插件总数（实时跟随注册/卸载，ledger `registrant` 标记过滤）+ kit 版本号；点击展开插件名（浮层带「浮层」前缀）。**0.2.17 起卡片文案跟随官方 locale 服务**（kit 经 `ctx.locale.register('dsh-settings-ui', {zh,en})` 注册字典命名空间；locale 服务缺席时退回内置中文）。消费方零成本。

### 3.7 CSS 类速查（全部 `sui-` 前缀）

| 类 | 用途 |
|---|---|
| `sui-root` | 设置页根（section 自动包） |
| `sui-header / -desc / -header-row / -actions-end` | 标题、描述、横排头、右对齐动作 |
| `sui-field / -label / -hint` | 表单字段三件套 |
| `sui-input / -textarea` | 输入框（focus 高亮） |
| `sui-btn / -primary / -danger` | 按钮 |
| `sui-toggle` | 开关 |
| `sui-card / -row / -main / -title / -desc / -meta / -error` | 卡片及内部行 |
| `sui-status / -dot` | 状态点 |
| `sui-badge` | 徽标（`data-tone` 五色变体：info/success/warn/error/neutral；`data-outline` 描边） |
| `sui-spinner` | 加载旋转圈 |
| `sui-tabs / -tab` | 下划线标签页 |
| `sui-pill-tabs / -pill-tab(-active)` | 药丸标签页 |
| `sui-banner(-error/saved/warn)` | 横幅 |
| `sui-check-row / -check` | 复选/单选行（原生 input，accent-color 主题色） |
| `sui-toast-host / -toast(-error/warn)` | 一次性通知栈 |
| `sui-actions` | 按钮行 |
| `sui-empty / -loading / -count` | 空态/加载/计数 |
| `sui-editor / -editor-title` | 编辑器面板 |
| `sui-test(-ok/bad)` | 测试结果块 |
| `sui-pre` | 等宽滚动代码块 |
| `sui-section-title` | 小节标题 |
| `sui-switch-row` | 开关+文案行 |
| `sui-overlay-panel / -head / -body / -title / -drag` | 浮层面板 chrome |
| `sui-overlay-resize` | 右下角 resize 把手 |
| `sui-close-btn` | 浮层关闭/最小化按钮 |
| `sui-overlay-list / -item` | 浮层列表/可点行 |
| `sui-item-meta / -kind / -time / -text` | 列表行元信息 |
| `sui-mark` | 搜索高亮 |
| `sui-fab / -fab-badge` | 呼出把手 + 角标 |
| `sui-dialog-backdrop / -dialog / -dialog-head / -dialog-title / -dialog-body / -dialog-footer` | 模态对话框 chrome |
| `sui-list / -list-item / -list-item-meta` | 结构化行列表 |
| `sui-columns / -column` | 多列（kanban）网格布局 |
| `sui-kit-*` | 统计卡专用 |

## 4. 便捷路径 vs 自由路径（kit 的定位）

| | 便捷路径 | 自由路径 |
|---|---|---|
| 场景 | 配置/设置页卡片 | 任意悬浮窗口、助手、面板 |
| 入口 | `ui.section(...)` | `ui.overlay(...)` + `ui.Panel` |
| 状态 | `createSettingsStore`（加载/保存/冲突内建） | `createPanelStore`（开合/位置/锚点/置顶） |
| 表单 | `ui.Rows` 声明式 | 原子组件自由组合 |
| 代码量 | 数十行 | 数百行、完全可控 |

**开发者选择规则**：进设置页的配置 → 便捷路径；要常驻/悬浮/自定义交互 → 自由路径。两条路径共享全部原子与样式类，可混用（如助手同时注册设置卡 + 浮层）。

## 4b. 官方槽位边界与已知局限（契约层）

kit 的定位是「契约对齐官方、视觉自由」：**槽位映射、token、状态语义对齐官方；视觉与 Panel 交互是 kit 自己的自由度**。因此有一部分能力受官方槽位契约约束，kit **无法替你突破**，请在设计插件入口时先认清：

| 官方槽 | 类型 | 对第三方插件的含义 |
|---|---|---|
| `sidebar.workspaces` | **单例**（single） | 工作区切换入口只有官方一个，插件**不能叠加**扩展第二个 |
| `sidebar.settings` | **单例**（single） | 侧栏「设置」入口只有官方一个，插件**不能叠加** |
| `sidebar.footer.action` | **列表**（list，唯一附加槽） | 侧栏底部动作区**可叠加**，task-board 的入口就走这里（折叠动画、`[data-rail]` 圆形态） |
| `settings.section` / `settings.general.item` | 列表（list） | 设置页内容可自由叠加（kit 的 `section()` 就映射到这里） |
| `shell.overlay` | 列表（list） | 窗口最前层级浮层可自由叠加（kit 的 `overlay()` 映射到这里） |

**由此带来的已知局限**：

1. **侧栏入口只有「底部动作区」一个可扩展位**：想在侧栏加「独立图标入口 / 切换工作区图标 / 额外设置齿轮」这类与官方并列的席位，**当前官方槽位契约不支持**——`sidebar.workspaces`/`sidebar.settings` 是单例槽，第三方只能往 `sidebar.footer.action` 追加，无法在「工作区位 / 设置位」平行插一个自己的席位。
2. **插件自带图标 / 三席位速选模型被搁置**：因为「图标选择」「在侧栏各席位自由选位」依赖官方开放对应槽位或给 `footer.action` 增加图形化席位能力；在官方更新之前，kit 不内置此类接口（不做 `ui.icons` + 多席位速选），避免登记一个随时会被官方契约束缚或与未来能力冲突的半成品 API。
3. **遇官方槽位变化以官方为准**：以上槽位名/类型来自当前 dsh rc.5 官方 shell；官方升级可能新增开放槽或调整 `footer.action` 的能力。接入新入口前，先查官方 `ui-slots` 的 Slot 注册表确认类型，再回来对表，别按旧结论硬写。

> 结论：设置页内容与浮层窗口 kit 完全放得开；**侧栏入口的「席位多样性」目前受官方限制，只能用一个底部动作区**，这是契约边界而非 kit 缺陷。

## 5. 铁律与踩坑

1. **store 只在 `apply` 创建一次**，经 `inject` 传入组件——**绝不能在渲染函数里 `createSettingsStore/createPanelStore`**（每次渲染新建 → `useSettings/usePanel` 依赖变化 → 无限重渲染卡死页面）。
2. `render` 返回 `React.Fragment`，不包裸 div。
3. 状态订阅优先走 kit store；需要会话/列表快照时：**`ctx.sessions.list`（getSnapshot/subscribe 直连）** 或 **`ctx.sessions.binding(id).session`（SessionFace）**——`scoped.get('conversation')` 是 assembler、**没有 getSnapshot**（曾因此崩溃）。运行中的编译产物可能没有 root 槽 `useSessions` 标准 props，别依赖。
4. `settings-conflict`（revision 冲突）由 store 内建，消费方不必处理。
5. 注册项 `registrant` 标记别删（统计卡计数依赖）。
6. 部署与更新链（tgz 重打、profile 换装、硬链接断链、重启壳）等**本机工作流见 `HANDOFF.md` §5/§6**——手册只承载 API 契约与通用踩坑。
7. 消费方崩溃诊断：把手/入口等**放在错误边界外**，主体包 `ui.ErrorBoundary`（`{ title?, fallback?, onError? }`，0.2.13 起 kit 内置，无需再手抄 assistant 的 `AssistantBoundary` 模板）。

## 6. 版本历史

→ 用户向变更记录见 [CHANGELOG.md](./CHANGELOG.md)（开发上下文/进度见 HANDOFF 与 DEVBOARD）。
