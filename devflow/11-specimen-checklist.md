# UI 风格核对清单（样本页实现规格）

> status: **v2（已回填官方真值，待决策方确认）**
> author: 方经纬（协调中枢）
> created: 2026-08-30　·　updated: 2026-08-30
> 内核基线：0.1.1-rc.2　·　被核对对象：`dsh-settings-ui` v0.4.1+ `lib/client.js`
> 用途：本清单是样本页的**实现规格**。页面需逐行覆盖；每行 = 页面上一个样本。

---

## 0. v1 → v2 的修订（务必先看）

| # | v1 的说法 | v2 修订 | 依据 |
|---|---|---|---|
| 0.1 | 「8 个 `--dsw-*` 令牌在 rc.2 失效 → 回退旧调色板」 | **已证伪，整条作废**。rc.2 与 rc.7 令牌体系实质等价（350 / 351，唯一差集 `--dsw-hovercard-bg` 且在 rc.2 CSS 中另有定义）；101 处字面差异全是 `rgb()` ↔ `#hex` 记法差异 | `10-research.md` §1 |
| 0.2 | 「真正失效的令牌」 | 只有 **1 个**：`--dsw-alias-state-business-secondary`（kit 自己写错的令牌名，官方只有 `business-primary` / `business-tertiary`）。**R1' 已修** | `10-research.md` §1.4 |
| 0.3 | 「偏差主因 = 令牌失效」 | **已改判**：主因是 kit 手写 CSS 与官方 CSS Modules 产物的逐条差异（按钮语义色 / 危险按钮形态 / 行高制式 / Dialog 规格 / 状态覆盖）+ 5 处裸值 | `10-research.md` §4 |
| 0.4 | 承载方式 = `/ui-specimens` 独立路由 | **做不到，已改判**。dsh 客户端插件无路由能力，只能挂官方槽位。改为**双承载**：`settings.section`（主，铺全量）+ `shell.overlay`（辅，速览） | 契约核查 + 决策方 2026-08-30 拍板 |
| 0.5 | 「样式来源」列大量「待调研」 | 已用 `10-research.md` §3.3 官方规格速查表全部回填 | 本文 |

### 0.6 官方参照坐标（样式来源的出处）

| 用途 | 包 | CSS 模块 / 类名前缀 |
|---|---|---|
| 插件卡 + 配置字段 | `dsh-client-ui-settings-plugins` | `fields.module.css`（`At1oFq_*`）、`card`（`YyYd_a_*`） |
| 常规设置行卡片、按钮全套、输入、Tag、Dialog | `dsh-client-ui-settings-models` | `zGbnIq_*`、Dialog `jLrgrW_*`、`GL8Viq_*` |
| 设置浮层骨架（遮罩/面板/导航） | `dsh-client-ui-settings-general` | `VOzbGW_*` |
| 令牌定义（**rc.2 的唯一真值源**） | `dsh-client-ui-theme` | `lib/client.js`（`:root` + `body[data-ds-dark-theme]`） |

> ⚠️ rc.2 的 `dsh-web-frontend/dist/assets/*.css` **不含任何 `:root` 令牌定义**（`:root` 出现 0 次），不能当令牌基准。

### 0.7 状态列用法

每个样本逐态打勾：✅ 一致 / ❌ 有偏差 / ➖ 该组件无此态。
**悬停 / 聚焦 / 按下**三态无法静态截图，页面上用「强制态」辅助类把样子钉住以便目视（见 §J）。

---

## A. 按钮（按出现位置分组）

| # | 位置 | 规格变体 | 默认 | 悬停 | 聚焦 | 按下 | 禁用 | 加载 | 样式来源（组件 / 类名 / token） |
|---|---|---|---|---|---|---|---|---|---|
| A1 | 页面顶部工具栏 | 主按钮·文字 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | kit `.sui-btn.sui-btn-primary`；官方 `zGbnIq_primaryButton`。`h36 / r18 / pad 0 14 / fs14 / lh22`；底 `button-primary-fill`，字 `label-primary-foreground`，hover `button-primary-hover` |
| A2 | 页面顶部工具栏 | 次按钮·文字 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | kit `.sui-btn`；官方 `zGbnIq_secondaryButton`。底 `0 0`（透明），边 `1px border-l2`，字 `label-primary`，hover `interactive-bg-hover-solid` |
| A3 | 卡片内 | 次按钮·文字 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 同上（`.sui-btn` 通用，无单独卡内档） |
| A4 | 卡片内 | 危险按钮·文字 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | kit `.sui-btn.sui-btn-danger`；官方 `zGbnIq_dangerButton`。字 `state-error-primary`，底 `0 0`，hover `interactive-bg-hover-danger` |
| A5 | 表单底部 | 主按钮（保存） | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 见 **A5′**：官方有**两套**主按钮，决策方已定 kit 两套并存 |
| A5′ | 表单底部·Models 页型 | 主按钮·蓝底 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | `.sui-btn-primary` → `button-primary-fill` / `label-primary-foreground` / hover `button-primary-hover`（官方 Models 页） |
| A5″ | 表单底部·插件卡内型 | 主按钮·反色 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | `.sui-pcard-save` → 底 `label-primary`，字 `bg-layer-3`（**高对比反色，非蓝色**），`r8 / pad 5px 14 / fs13 / lh20` |
| A6 | 表单底部 | 次按钮（放弃） | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | `.sui-pcard-discard`（卡内）→ 边 `border-l2`、底 `none`、字 `label-secondary`；hover → 字 `label-primary` + 边 `label-dimmed` |
| A7 | 表格操作列 | 纯图标·小尺寸 ×N | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **kit 无图标按钮档**。官方仅 36/28 两档高度；kit 只有 36px 一档（M2 人工核对点） |
| A8 | 悬浮操作区（FAB） | 圆形·图标（含 badge） | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | kit `.sui-fab`（`38×38 / r50% / 边 border-l2 / 底 bg-layer-3`）+ `.sui-fab-badge`（`r999 / fs10 / 底 state-success-primary / 字 static-neutral-bluish-00`）。裸值已在 R5' 清零 |
| A9 | （通用）尺寸档 | S / M / L 三档并排 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **官方只有两档**：36px（通用）与 28px（行内）。kit 现仅 36px，无 28px 档 → 待补（R10 候选） |
| A10 | （通用）语义色 | 主 / 次 / 危险 三色并排 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | `.sui-btn-primary` / `.sui-btn` / `.sui-btn-danger`，token 见 A1/A2/A4 |
| A11 | （通用）禁用态 | 三类按钮并排 | ☐ | ➖ | ➖ | ➖ | ☐ | ➖ | `.sui-btn:disabled{opacity:.4;cursor:default}`（官方 `opacity:.4`） |
| A12 | （通用）键盘聚焦态 | 三类按钮并排 | ➖ | ➖ | ☐ | ➖ | ➖ | ➖ | `.sui-btn:focus-visible{box-shadow:0 0 0 2px border-l3;outline:none}`（Models 型）；卡内型为 `outline:2px brand-primary`（`.sui-pcard-save:focus-visible`） |
| A13 | （通用）加载态 | 按钮内 Spinner | ☐ | ➖ | ➖ | ➖ | ➖ | ☐ | kit 无内置「按钮加载态」组合；`Spinner` 需消费方自排（`.sui-spinner`：`14×14 / 边 2px label-tertiary / 顶边透明 / spin 800ms`） |

## B. 浮窗类

| # | 组件 | 关键核对点 | 默认 | 悬停 | 聚焦 | 按下 | 禁用 | 加载 | 样式来源 |
|---|---|---|---|---|---|---|---|---|---|
| B1 | Dialog / Modal | 遮罩、圆角、内边距、标题层级、底部按钮区 | ☐ | ➖ | ☐ | ➖ | ➖ | ➖ | kit `.sui-dialog*`（R4' 后）：`width:min(600px,100%)`、`padding:28px`、标题 `20px/500/28px`、遮罩 `bg-mask-1` + `backdrop-filter:mask-blur`；`@media (width<=560px){padding:24px}`。基准官方 `jLrgrW_*` |
| B2 | Popover | 箭头、阴影层级、与触发器间距 | ☐ | ☐ | ☐ | ☐ | ➖ | ➖ | **kit 未提供此组件**（服务出口无 Popover）。官方参照 `--dsw-hovercard-bg` + `dsh-client-ui-settings-models`。页面上标注占位 |
| B3 | Tooltip | 深色底、字号、出现延迟 | ☐ | ☐ | ➖ | ➖ | ➖ | ➖ | **kit 未提供**。官方 `--dsw-alias-tooltip-bg`（若存在，需运行时体检确认）→ 占位 |
| B4 | Dropdown | 菜单项高度、选中态、分隔线、键盘导航高亮 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | **kit 未提供独立 Dropdown**；仅有原生 `Select`（`.sui-input` + 原生下拉面板，样式由浏览器绘制，**无法与官方对齐**）→ 占位 + 说明 |
| B5 | Toast | 成功/警告/错误 三语义、位置、自动消失 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-toast-host`（`fixed / right16 / bottom16 / z1400 / 列 flex / gap8 / pointer-events:none`）+ `.sui-toast`（`r8 / pad 8px 14 / fs12 / lh18 / max-w320 / 阴影 shadow-lv3`）＋ `.sui-toast-error` / `-warn` / 默认 saved。语义色 R5' 已令牌化 |
| B6 | Drawer | 抽屉方向、宽度、遮罩、滑入动效 | ☐ | ☐ | ☐ | ☐ | ➖ | ➖ | **kit 未提供**。官方设置页亦无 Drawer 样本（M6）→ 占位 |
| B7 | Overlay 浮层面板 | 圆角、阴影、头部、拖拽/最小化 | ☐ | ☐ | ☐ | ☐ | ➖ | ➖ | kit `.sui-overlay-panel`（`fixed / top60 / right calc(16px + sidebar-width) / w340 / max-h min(70vh,640px) / 底 bg-overlay / 边 border-l1 / r10 / 阴影 shadow-lv3 / z1000`）+ `.sui-overlay-head` / `-body` / `-resize` |

## C. 输入类

| # | 组件 | 关键核对点 | 默认 | 悬停 | 聚焦 | 按下 | 禁用 | 加载 | 样式来源 |
|---|---|---|---|---|---|---|---|---|---|
| C1 | Input | 高度、圆角、边框、占位符色 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit `.sui-input`（R2' 后）：`h34 / r8 / pad 0 12 / fs13 / lh20 / 底 bg-layer-3 / 边 1px border-l2 / font:inherit`；`:focus-visible{border-color:brand-primary}`；`::placeholder{color:label-dimmed}`；`:disabled{color:label-tertiary;cursor:default}`。基准官方 `At1oFq_input` |
| C1′ | Input（Models 页型） | 官方双规格 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | 官方 Models 页：`h32 / pad 0 10 / fs14 / lh22 / 底 bg-layer-1`。**与插件页 34px 并存**（M3 人工核对点） |
| C2 | Textarea | 最小高度、resize、边框同步 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit `.sui-textarea`：`r8 / pad 8px 12 / fs13 / lh20 / 字体 ds-font-family-code / resize:vertical`；聚焦与禁用态同步 C1 |
| C3 | Select | 高度同步 Input、下拉箭头 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit 复用 `.sui-input` 于原生 `<select>`，**无自定义箭头**。官方箭头原依赖 `primitives`（rc.2 已移除）→ R6' 待补内置 SVG |
| C4 | Checkbox | 勾选态、与标签间距 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit `.sui-check-row` + `.sui-check`（原生控件）；禁用态由 `data-disabled="true"` 驱动 |
| C5 | Radio | 选中态、分组间距 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | 同 C4（共用 `.sui-check-row` / `.sui-check`） |
| C6 | Switch | 开/关色、滑块尺寸、动效 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit `.sui-toggle`（`data-on=true|false`）。R5' 后裸值已清零，改 `static-neutral-*` / 语义 token |
| C7 | 错误态 | 错误边框色、错误文案色 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | 官方：`.inputInvalid{border-color:label-error}` + `.invalid{color:label-error}`。**kit 仍缺此态**（R2' 未覆盖）→ 待补（R10 候选）。注意 `--dsw-alias-label-error` 官方从未定义（官方自身缺陷 O1） |
| C8 | 占位符色 | 与官方一致 | ☐ | ➖ | ➖ | ➖ | ☐ | ➖ | `::placeholder{color:--dsw-alias-label-dimmed}`（R2' 已修） |

## D. 展示类

| # | 组件 | 关键核对点 | 默认 | 悬停 | 聚焦 | 按下 | 禁用 | 加载 | 样式来源 |
|---|---|---|---|---|---|---|---|---|---|
| D1 | Badge | 语义色 ×5、圆角、可关闭态 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-badge`（`fs10 / pad 1px 6 / r999`）+ `data-tone`：`neutral`（底 `bg-layer-3` / 字 `label-secondary`）、`info`（字 `business-primary` / 底 `interactive-bg-hover`）、`success`/`warn`/`error`（字 `state-*-primary` / 底 `state-*-secondary`）；`data-outline="true"` → 透明底 + `1px currentColor`。**官方规格为 `fs11 / pad 1px 8 / fw500 / lh17`（Badge 档），kit 为 fs10 / pad 1px 6 → 差一档**（待人工核对） |
| D2 | Banner | 三语义、图标、可关闭 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-banner`（`r8 / pad 8px 12 / fs12 / lh18 / 边 1px transparent`）+ `-error`（边 `state-error-secondary` / 底 `interactive-bg-hover-danger` / 字 `state-error-primary`）、`-saved`（`success-*` 三档）、`-warn`（`warn-*` 三档）。**无 info 档**（官方亦缺） |
| D3 | 空态 | 文案层级、CTA | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-empty`（atom 类） |
| D4 | 加载态 | Spinner / Skeleton | ☐ | ➖ | ➖ | ➖ | ➖ | ☐ | kit 仅 `Spinner`（`.sui-spinner`，规格见 A13）。**无 Skeleton** → 占位 |
| D5 | 状态点 Dot | 语义色圆点 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-dot`（`8×8 / r50%`，色由 `StatusDot` 的 `color` prop 内联传入，默认 `label-dimmed`）。R5' 后默认色不再用裸值 |
| D6 | Tabs | 下划线、激活态、键盘导航 | ☐ | ☐ | ☐ | ☐ | ☐ | ➖ | kit `.sui-tabs`（`flex / gap22 / 下边 border-l2`）+ `.sui-tab`（`pad 7px 1px 9px / fs13 / lh20 / 字 label-tertiary`；`:hover` 与 `[data-on=true]` → 字 `label-primary`；激活 `::after` 下划 `2px / r2 / 底 label-primary`） |
| D7 | List / ListItem | 行高、悬停、分隔 | ☐ | ☐ | ☐ | ☐ | ➖ | ➖ | kit `.sui-list` / `.sui-list-item` |
| D8 | 状态徽标（插件卡） | pending 标记 | ☐ | ➖ | ➖ | ➖ | ➖ | ➖ | kit `.sui-pcard-pending`（`r999 / pad 1px 8 / fs11 / lh17 / fw500 / 底 bg-module-platform / 字 label-secondary`）→ **与官方 Badge 档一致** |

## E. 布局与栅格

| # | 核对项 | 官方期望 | kit 现状 | 结论 |
|---|---|---|---|---|
| E1 | 页面容器最大宽度与左右留白 | 官方设置页为 **800px 模态面板**，内容区 `padding:0 24px 24px` | kit 填满所在 section，无最大宽度约束 | ☐ |
| E2 | Section 之间的垂直节奏 | — | `.sui-root{gap:12px}` | ☐ |
| E3 | 卡片内边距 | `padding:12px 14px / gap:12px / r12 / 边 border-l2` | `.sui-card` 同（R9 后新增 `.sui-card-row` 行模式：`border:0 / 底透明 / r0 / pad 6px 8px / gap12`，相邻 `border-top:1px border-l1`） | ☐ |
| E4 | 字段行：标签与控件对齐 | 列式（`flex-direction:column / gap:6px`） | `.sui-field{column / gap:4px}`；官方 `padding:12px 0 / gap:6px` → **gap 差 2px** | ☐ |
| E5 | 字段之间的分隔线 | 相邻字段 `border-top:1px border-l2` | `.sui-pfield + .sui-pfield{border-top:1px border-l2}` ✅ | ☐ |
| E6 | 多列栅格的列间距与断点 | 官方无多列栅格（单列） | kit 亦单列 | ☐ |

## F. 配色与层级

> 以下「rc.2 是否定义」已由 `10-research.md` §1.4 复核，**原 v1 标注的失效全部推翻**。

| # | 核对项 | 官方令牌 | rc.2 是否定义 | 结论 |
|---|---|---|---|---|
| F1 | 卡片折叠态背景 | `--dsw-alias-bg-layer-3` | ✅（`bluish-00` / `bluish-800`） | ☐ |
| F2 | 卡片展开态背景 | `--dsw-alias-bg-layer-2` | ✅ | ☐ |
| F3 | 遮罩层 | `--dsw-alias-bg-overlay` | ✅（`bluish-150`） | ☐ |
| F4 | 平台模块背景 | `--dsw-alias-bg-module-platform` | ✅（`bluish-60`；官方 `At1oFq_badge` 正在用） | ☐ |
| F5 | 边框层级 l1/l2/l3 | `--dsw-alias-border-l1` / `-l2` / `-l3` | ✅ | ☐ |
| F6 | 语义色次级态 ×3 | `--dsw-alias-state-{error,success,warn}-secondary` | ✅ | ☐ |
| F7 | ~~按钮 info 悬停~~ | `--dsw-alias-button-info-hover` | ✅（`deepseek-400`），但**kit 用错场景**，R1' 已改为 `button-primary-hover` | ✅ 已修 |
| F8 | ~~业务次级色~~ | `--dsw-alias-state-business-secondary` | ❌ **从未存在**（kit 写错名）→ R1' 已改用 `button-primary-fill` | ✅ 已修 |
| F9 | 文字层级 | `--dsw-alias-label-primary/secondary/tertiary/dimmed` | ✅ | ☐ |
| F10 | 交互底色 | `--dsw-alias-interactive-bg-hover` / `-solid` / `-danger` | ✅ | ☐ |
| F11 | 品牌主色 | `--dsw-alias-brand-primary` | ✅ | ☐ |
| F12 | 阴影层级 | `--dsw-shadow-lv1` / `-lv3` | ✅ | ☐ |
| F13 | 遮罩模糊 | `--dsw-mask-blur` | ✅（R4' 已接入 Dialog） | ✅ 已修 |

> **O1 官方自身缺陷**（kit 未照抄）：`--dsw-alias-label-error` 官方从未定义，但官方两版 CSS 都在用 → kit 不跟随，错误文案改用 `state-error-primary`。

## G. 字体 / 字号 / 行高

| # | 核对项 | 官方规格 | kit 现状（R3' 后） | 结论 |
|---|---|---|---|---|
| G1 | 字体族 | `--dsw-font-family` | 组件均带 `font:inherit`；代码块用 `--ds-font-family-code` | ☐ |
| G2 | 行高制式 | **px 制**：`14→22`、`13→20`、`12→18`、`16→24`、`11→17` | 已改 px 制（R3'：11→17 / 12→18 / 13→20 / 14→22 / 15→1.4） | ☐ |
| G3 | 标题层级 | Dialog 标题 `20px/500/28px`；section 标题 `15px/600` | `.sui-header h3{15px/600}`；Dialog 已对齐 20/500/28 | ☐ |
| G4 | 正文基准 | `13px/20px`（插件页）、`14px/22px`（Models 页） | 同 | ☐ |
| G5 | 辅助/说明文字 | `12px/18px`（hint）、`11px/17px`（badge 档） | `.sui-hint{11px}`、`.sui-desc{12px}` → **hint 与官方 12px 差一档** | ☐ |

## H. 图标与圆角边框

| # | 核对项 | 官方期望 | kit 现状 | 结论 |
|---|---|---|---|---|
| H1 | 图标尺寸档 | 16 / 20 / 24 | kit 无图标体系，仅用字符（`▾` `×` `—` `▢`） | ☐ |
| H2 | 图标来源 | `dsh-client-ui-primitives`（**rc.2 已移除**） | `prim` 为 `null`；Select 展开箭头受影响 → R6' 待补内置 SVG | ⚠️ 待修 |
| H3 | 圆角：卡片 / 按钮 / 输入框 / 标签 | `12 / 18(通用按钮)·8(卡内按钮) / 8 / 999` | 同 | ☐ |
| H4 | 边框宽度与颜色层级 | `1px` + `border-l1`（浮层）/`border-l2`（通用） | 同 | ☐ |

## I. 响应式

| # | 断点 | 核对点 | kit 现状 | 结论 |
|---|---|---|---|---|
| I1 | 窄屏（≤560px） | Dialog 内边距收窄 | `@media (width<=560px){.sui-dialog{padding:24px}}` | ☐ |
| I2 | 中等屏 | 单列（官方无多列） | 无多列 | ☐ |
| I3 | 宽屏 | 官方 800px 面板约束 | kit 无最大宽度 | ☐ |

## J. 强制态辅助（页面实现要求）

静态截图无法呈现悬停/聚焦/按下，页面需给每个可交互样本提供**强制态**变体，把样子钉住：

| 强制态 | 实现 | 备注 |
|---|---|---|
| 悬停 | 复制该 token 到行内样式（如 `background:var(--dsw-alias-interactive-bg-hover-solid)`） | 与真实 `:hover` 等价 |
| 聚焦 | 行内 `box-shadow:0 0 0 2px var(--dsw-alias-border-l3)` | 与 `:focus-visible` 等价 |
| 按下 | 官方**未定义** `:active` → 页面标注「官方无 :active 态」 | 不打勾 |
| 禁用 | 直接给 `disabled` 属性（真实态） | — |
| 加载 | 行内置入 `<Spinner/>` | — |

## K. 令牌体检（DoD V10）

页面顶部列出关注令牌的**运行时解析值**，`getComputedStyle(document.documentElement).getPropertyValue(t)` 为空即判失效并高亮。
关注清单 = F1–F13 + G1 + 下列新增：

- `--dsw-alias-button-primary-fill`、`--dsw-alias-button-primary-hover`
- `--dsw-alias-state-{success,warn,error}-tertiary`
- `--dsw-alias-interactive-bg-hover-danger`
- `--dsw-static-neutral-bluish-00`
- `--dsw-font-family`、`--ds-font-family-code`
- `--dsw-alias-label-error`（**预期未定义** —— 官方缺陷 O1，用于自证检测有效）

---

## 已知待补（不影响本页核对，登记进 R10 候选）

1. **kit 未提供的 4 个浮窗组件**：Popover / Tooltip / Dropdown / Drawer —— 页面标注占位。
2. **C7 输入错误态**：官方有 `.inputInvalid` / `.invalid`，kit 未实现。
3. **A9 按钮 28px 行内档**：官方两档，kit 仅 36px。
4. **D1 Badge 档差**：官方 `fs11/pad 1px 8`，kit `fs10/pad 1px 6`。
5. **G5 hint 字号**：官方 `12px`，kit `11px`。
6. **H1/H2 图标体系**：kit 无图标，rc.2 已无 primitives 可依赖。
