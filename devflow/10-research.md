# 10-research · rc.2 官方 UI 真值调研

> 阶段：Phase 1（调研）
> 版本：v1
> 日期：2026-08-30
> 调研执行：统筹方（直接取证，未派子代理）
> 产物：`devflow/ref/official-settings-css.css`（官方真值 157 规则）、`devflow/ref/kit-css.css`（kit 现况 145 规则）

---

## 0. 结论先行

1. **`00-charter.md` §3.2 的根因结论被证伪。** 「8 个 `--dsw-*` 令牌在 rc.2 失效 → 静默回退旧调色板」不成立。
   真实情况：rc.2 与 rc.7 的令牌体系**实质等价**（350 / 351 个，唯一差集 `--dsw-hovercard-bg` 且在 rc.2 CSS 中另有定义）。
2. **真正失效的令牌只有 1 个，且从未在任何版本存在过**：`--dsw-alias-state-business-secondary`（kit 自己写错的令牌名，官方只有 `business-primary` 与 `business-tertiary`）。
3. **偏差的真实来源是 kit 手写 CSS 与官方 CSS Modules 产物的逐条差异**——不是令牌失效，而是**按钮语义色体系用错、危险按钮形态完全相反、行高制式不同、Dialog 规格不同、状态覆盖不全、5 处裸值色号、兜底值取暗色**。
4. 依赖面：rc.2 移除的两个包中，`slots` 已并入 `dsh-client-runtime`（**功能无影响**），`primitives` 缺失仅影响 1 个展开箭头。**均非偏差主因**，但 `package.json` 的过时声明需清理。

---

## 1. Q1 令牌映射（原定首要问题）→ 结论：问题本身不成立

### 1.1 真值源坐标纠正

上一版 charter 把 rc.2 的令牌基准取错文件，导致结论失真。正确坐标：

| 版本 | 令牌真值文件 | 唯一令牌数 | 说明 |
|---|---|---|---|
| rc.7 | `E:\DshHarness\rc7\node_modules\@deepseek-ai\dsh-web-frontend\dist\assets\index-CSGf6Qzd.css` | 351 | 静态编译进前端 CSS |
| **rc.2** | `E:\DshHarness\0.1.1-rc.2\node_modules\@deepseek-ai\dsh-client-ui-theme\lib\client.js` | **350** | **运行时由主题包注入** |

> ⚠️ rc.2 的 `dsh-web-frontend/dist/assets/index-C6eRlFa6.css` **不含任何 `:root` 令牌定义**（`:root` 出现 0 次，仅定义 1 个 `--dsw-hovercard-bg`，其余 201 处全为 `var()` 消费）。
> 上一版误将该文件当作 rc.2 令牌基准，从中数出「56 个」—— 那实际是消费次数抽样，不是定义集。

rc.2 主题包的注入方式（已核实）：
- 亮色：`:root{ ... }`
- 暗色：`body[data-ds-dark-theme]{ ... }`
- 通过 `document.head` + `createElement("style")` 注入，**全局作用域**，kit 的 DOM 可正常继承。

### 1.2 差集（正确算法）

```
rc7 唯一令牌  351
rc.2 唯一令牌 350
rc.2 新增      0
rc7 有 / rc.2 无：1  →  --dsw-hovercard-bg
```
而 `--dsw-hovercard-bg` 在 rc.2 的 `index-C6eRlFa6.css` 中**另有定义**，故实质差集为 **0**。

### 1.3 取值比对

350 个同名令牌中，101 处字面值不同，但**全部是记法差异**，语义等价：

| 形式 | rc.7 | rc.2 |
|---|---|---|
| 实色 | `rgb(65, 118, 230)` | `#4176e6` |
| 半透明 | `rgba(0, 0, 0, .24)` | `#0000003d` |
| 透明 | `rgba(0, 0, 0, 0)` | `#0000` |

唯一非记法差异：`--dsw-font-family` 在 rc.2 中为 `\"Segoe UI\"`（JS 字符串内转义），解析后等价。

**结论：rc.7 → rc.2 调色板零变更。**

### 1.4 原「8 个失效令牌」逐个复核

| 令牌 | rc.7 | rc.2 | 判定 |
|---|---|---|---|
| `--dsw-alias-bg-layer-3` | ✅ | ✅ `bluish-00` / `bluish-800` | 有效 |
| `--dsw-alias-bg-overlay` | ✅ | ✅ `bluish-150` | 有效 |
| `--dsw-alias-bg-module-platform` | ✅ | ✅ `bluish-60` | 有效（官方 rc.2 代码正在用） |
| `--dsw-alias-state-error-secondary` | ✅ | ✅ `red-400` | 有效 |
| `--dsw-alias-state-success-secondary` | ✅ | ✅ `green-400` | 有效 |
| `--dsw-alias-state-warn-secondary` | ✅ | ✅ `amber-400` | 有效 |
| `--dsw-alias-button-info-hover` | ✅ | ✅ `deepseek-400` | 有效（但 kit 用错场景，见 §4.1） |
| **`--dsw-alias-state-business-secondary`** | ❌ | ❌ | **从未存在，kit 写错名** |

> 佐证：官方 rc.2 的 `dsh-client-ui-settings-plugins` 中 `.At1oFq_badge` 正在使用 `--dsw-alias-bg-module-platform` —— 若该令牌真失效，官方自己的 UI 会先崩。

### 1.5 建议动作

- 修 1 处：`.sui-btn-primary` 的 `--dsw-alias-state-business-secondary` → 见 §4.1 决策点。
- charter §3.2 整节重写（见 §6）。

---

## 2. 依赖面：rc.2 移除的两个包

`dsh-settings-ui@0.4.1` 的 `package.json` 声明：
```json
"client": { "inject": [
  "@deepseek-ai/dsh-client-runtime",
  "@deepseek-ai/dsh-client-ui-slots",      ← rc.2 已移除
  "@deepseek-ai/dsh-client-ui-primitives"  ← rc.2 已移除
]}
"peerDependencies": { "@deepseek-ai/dsh-client-ui-slots": ">=0.1.0-rc.0" }
```

| 包 | rc.7 | rc.2 | 影响 | 定级 |
|---|---|---|---|---|
| `dsh-client-ui-slots` | 有 | **无** | slot 服务已并入 `dsh-client-runtime`（`lib/types/client/slots.d.ts` 有 `SlotMap`）。四个 slot 名（`settings.plugin.item` / `settings.section` / `shell.overlay` / `settings.general.item`）在两侧出现的文件数**完全一致**（11 / 53 / 10 / 17）→ 契约未变 | **P2 声明过时**，功能无影响 |
| `dsh-client-ui-primitives` | 有 | **无** | kit 用 `try { prim = require(...) } catch { prim = null }` 静默降级；仅影响 1 处 `prim.IconChevronDownOutline14`（插件卡展开箭头） | **P1 视觉**：箭头可能不显示 |

**建议动作**：清理 `package.json` 的过时 inject 与 peerDependencies；为展开箭头准备内置 SVG 兜底（官方 CSS 中 chevron 仅依赖 `transform:rotate(180deg)`，改用手写 SVG 即可对齐）。

---

## 3. Q2 官方设置页实现参照（真值已固化）

### 3.1 官方的样式机制

官方设置页包并不手写 CSS，而是 **CSS Modules 编译产物**：
- CSS 以字符串常量内嵌在 `lib/client.js` 中（`const css$2 = "..."`）
- 运行时通过 `<style data-plugin-css="@deepseek-ai/<pkg>/<name>.module.css">` 注入 `document.head`
- 类名经哈希（`At1oFq_field`、`YyYd_a_card`、`zGbnIq_rowCard`、`VOzbGW_trigger`）
- 导出 `{ "field": "At1oFq_field", ... }` 映射表供组件引用

**关键差异**：官方 CSS 中令牌**裸用无兜底**（`var(--dsw-alias-border-l2)`），kit 全部带兜底（`var(--dsw-alias-border-l2, rgba(255,255,255,0.12))`）。

### 3.2 官方参照坐标

| 用途 | 包 | CSS 模块 |
|---|---|---|
| 插件卡 + 配置字段（**kit 的主要对齐对象**） | `dsh-client-ui-settings-plugins` | `fields.module.css`（`At1oFq_*`）、`card`（`YyYd_a_*`） |
| 常规设置行卡片、按钮全套、输入、Tag、Dialog | `dsh-client-ui-settings-models` | `zGbnIq_*`、`jLrgrW_*`（Dialog）、`GL8Viq_*` |
| 设置浮层骨架（遮罩 / 面板 / 导航） | `dsh-client-ui-settings-general` | `VOzbGW_*` |
| 令牌定义 | `dsh-client-ui-theme` | `lib/client.js`（`:root` + `body[data-ds-dark-theme]`） |

完整 157 条官方规则已抽取至 **`devflow/ref/official-settings-css.css`**。

### 3.3 官方核心规格速查

```
卡片（rowCard）  border:1px solid border-l2; border-radius:12px; padding:12px 14px; gap:12px
插件卡（card）   border:1px solid border-l2; background:bg-layer-3; border-radius:12px
                 hover → border-color:label-dimmed
                 展开 → background:bg-layer-2 + border-color:label-dimmed
                 transition:border-color .16s, background .16s
插件卡头         padding:14px 16px; gap:12px; border-radius:12px; appearance:none
                 focus-visible → outline:2px solid brand-primary; outline-offset:-2px
卡体             border-top:1px solid border-l2; margin:0 16px; padding-bottom:8px
卡脚             border-top:1px solid border-l2; padding:12px 0 4px; gap:8px; justify-content:flex-end
配置字段         padding:12px 0; gap:6px;  相邻字段 border-top:1px solid border-l2
输入框(插件页)   height:34px; border-radius:8px; padding:0 12px; font-size:13px; line-height:1.5
                 background:bg-layer-3; border:1px solid border-l2; font:inherit
输入框(Models)   height:32px; padding:0 10px; font-size:14px; line-height:22px; background:bg-layer-1
Badge            background:bg-module-platform; color:label-secondary; border-radius:999px
                 padding:1px 8px; font-size:11px; font-weight:500; line-height:17px
主按钮(Models)   height:36px; border-radius:18px; padding:0 14px; font-size:14px; line-height:22px
                 background:button-primary-fill; color:label-primary-foreground
                 hover → button-primary-hover
次按钮           background:0 0; border:1px solid border-l2; color:label-primary
                 hover → background:interactive-bg-hover(-solid)
危险按钮         color:state-error-primary; background:0 0
                 hover → background:interactive-bg-hover-danger
卡内保存/放弃    border-radius:8px; padding:5px 14px; font-size:13px; line-height:1.5
                 save → background:label-primary; color:bg-layer-3  ← 高对比反色，非蓝色
禁用态           opacity:.4; cursor:default
聚焦态           Models: box-shadow:0 0 0 2px border-l3  卡内: outline:2px solid brand-primary
Dialog           width:min(600px,100%); padding:0  内容 padding:28px
                 title 20px/500/28px; body margin-top:20px
遮罩             background:bg-mask-1 + backdrop-filter:mask-blur
行高制式         14→22px  13→20px  12→18px  16→24px  11px(badge)→17px
```

---

## 4. Q3 kit 与官方的逐项差异（偏差真实清单）

对照基准：`devflow/ref/kit-css.css` vs `devflow/ref/official-settings-css.css`

### 4.1 按钮 —— 偏差最严重

| # | 项 | 官方 | kit `.sui-btn*` | 影响 |
|---|---|---|---|---|
| A1 | 次级按钮底色 | `background:0 0`（透明，仅描边） | `background:var(--dsw-alias-bg-layer-2)` | **多一层填充底色** |
| A2 | 主按钮语义 | 卡内 `background:label-primary; color:bg-layer-3`（反色）；Models 页 `button-primary-fill` / `label-primary-foreground` | `background:var(--dsw-alias-state-business-primary,#679efe); color:#fff`（蓝色实心） | **语义色体系用错** |
| A3 | 主按钮 hover | `--dsw-alias-button-primary-hover` | `--dsw-alias-button-info-hover` | hover 令牌族错误 |
| A4 | 危险按钮 | `color:error-primary; background:0 0`；hover `interactive-bg-hover-danger` | `background:error-primary; color:#fff`；hover `filter:brightness(1.08)` | **形态完全相反**：官方红字透明底，kit 红色实心块 |
| A5 | 字体继承 | `font:inherit` | 缺失 | 退回系统默认字体 |
| A6 | 聚焦态 | `:focus-visible` + `box-shadow:0 0 0 2px border-l3` / `outline:2px solid brand-primary` | 无 | 键盘可达态缺失 |
| A7 | appearance | `appearance:none` | 缺失 | 可能残留原生控件外观 |
| A8 | 尺寸 | 主/次/危险 `height:36px; border-radius:18px`；行内 `28px/14px` | 仅 `padding:5px 14px; border-radius:8px`，无高度 | 与官方 36/28 两档不符 |
| A9 | 主按钮色值 | — | `--dsw-alias-state-business-secondary`（**该令牌不存在**） | 实际走兜底 `#679efe` |

> 注：插件卡内的 `.sui-pcard-discard` / `.sui-pcard-save` 已与官方 `YyYd_a_discard/save` **1:1 对齐** ✅，问题集中在通用 `.sui-btn*`。

### 4.2 输入框

| # | 项 | 官方 | kit | 影响 |
|---|---|---|---|---|
| B1 | 聚焦选择器 | `:focus-visible` | `:focus` | **鼠标点击也出聚焦环**，官方仅键盘聚焦时出 |
| B2 | 字体 | `font:inherit` | 缺失 | 字体不一致 |
| B3 | 占位符 | `::placeholder{color:label-dimmed}` | 缺失 | 占位符取浏览器默认 |
| B4 | 校验态 | `.inputInvalid{border-color:label-error}` + `.invalid{color:label-error}` | 缺失 | 无错误态样式 |
| B5 | 尺寸 | 34px / 8 / 0 12px / 13px / 1.5 | 一致 | ✅ |

### 4.3 卡片

| # | 项 | 官方 `rowCard` | kit `.sui-card` | 影响 |
|---|---|---|---|---|
| C1 | gap | `12px` | `10px` | **2px 偏差** |
| C2 | 其余 | `padding:12px 14px; radius:12px; border:1px border-l2` | 一致 | ✅ |
| C3 | 插件卡全套 | `YyYd_a_*` | `.sui-pcard*` | **已 1:1 对齐** ✅ |

### 4.4 行高（全局性、累积性偏差）

官方用 **px 制式**，kit 用**倍数**：

| 字号 | 官方行高 | kit 行高 | 实际计算 | 差 |
|---|---|---|---|---|
| 14px | 22px | 1.5 | 21px | -1px |
| 13px | 20px | 1.5 | 19.5px | -0.5px |
| 12px | 18px | 1.5 | 18px | ✅ |
| 15px | 1.4 | 1.4 | 21px | ✅ |

逐项只有 0.5–1px，但**全页累积**形成「kit 比官方紧一点」的整体观感 —— 这很可能就是用户感知到的「始终存在偏差」的主要来源之一。

### 4.5 浮窗 Dialog

| # | 项 | 官方 `jLrgrW_*` | kit `.sui-dialog*` | 影响 |
|---|---|---|---|---|
| D1 | 宽度 | `min(600px,100%)` | `min(520px, ...)` | 窄 80px |
| D2 | 内边距 | 外层 `padding:0` + content `28px` | `18px` | 紧 10px |
| D3 | 标题 | `20px / 500 / 28px` | `15px / 700` | **字号字重差一档** |
| D4 | 遮罩 | `bg-mask-1` + `backdrop-filter:mask-blur` | 仅 `bg-mask-1` | 缺毛玻璃 |
| D5 | 圆角 | 由 primitives 提供 | `14px` | 待人工核对 |

### 4.6 裸值色号（不随主题变化）

共 5 处，在**亮色主题**下必然失真：

| 位置 | 裸值 |
|---|---|
| `.sui-toggle` 底色 | `rgba(128,128,128,0.4)` |
| `.sui-fab-badge` | `#22c55e` / `#fff` |
| `.sui-card-error` | `#fca5a5` |
| `.sui-banner-*` / `.sui-toast*` / `.sui-test-*` | 多组 `rgba(239,68,68,.5)`、`rgba(34,197,94,.4)`、`rgba(234,179,8,.4)` |
| `.sui-mark` | `rgba(99,122,241,.28)` |

### 4.7 兜底值取暗色（潜伏风险，非现症）

kit 全部 `var(--dsw-*, #xxx)` 的兜底取的是**暗色主题**取值：

| 令牌 | 亮色真值 | 暗色真值 | kit 兜底 | 兜底所属 |
|---|---|---|---|---|
| `--dsw-alias-label-primary` | `#0f1115`（近黑） | `#f9fafb`（近白） | `#f9fafb` | **暗色** |
| `--dsw-alias-bg-layer-3` | `#ffffff` | `#353638` | `#353638` | **暗色** |

令牌正常解析时无影响（主题包为 `:root` 全局注入，已核实）。但一旦 `dsh-client-ui-theme` 未加载（加载顺序、插件独立渲染、SSR 快照等场景），kit 会在亮色主题下渲染成暗色配色。**建议改造为「无兜底裸用」或「兜底取亮色值」，与官方一致。**

### 4.8 状态覆盖缺口

官方每个交互件覆盖 `hover` / `:focus-visible` / `:disabled` / `:hover:not(:disabled)`；
kit 多数仅覆盖 `hover` + `disabled`，缺 `focus-visible` 与 `invalid`。

---

## 5. 需人工目视核对的点（无法自动证伪）

| # | 项 | 原因 |
|---|---|---|
| M1 | Dialog 圆角（官方由已移除的 primitives 提供） | rc.2 无参照源，需截图比对 |
| M2 | 官方「主按钮」在**插件卡内**用反色（`label-primary` 底）而在 **Models 页**用蓝色（`button-primary-fill`） | 两套并存，需确认 kit 各场景该跟哪一套 |
| M3 | 输入框 34px（插件页）vs 32px（Models 页） | 同上，官方双规格 |
| M4 | 展开箭头（primitives 缺失后）实际渲染形态 | 需运行截图确认 |
| M5 | 行高 0.5–1px 的差异是否肉眼可辨 | 主观，需并排截图 |
| M6 | Toast / Banner 的语义色强度 | 官方设置页无对应样本，只有 rgba 裸值 |

---

## 6. 对 `00-charter.md` 的修订建议

| 章节 | 现状 | 修订 |
|---|---|---|
| §3.2 偏差主因 | 「8 个令牌失效 → 回退旧调色板」 | **整节作废**，替换为：① 令牌体系等价，偏差与令牌失效无关；② 真实主因是手写 CSS 与官方 CSS Modules 产物的逐条差异（按钮语义色/危险按钮形态/行高制式/Dialog 规格/状态覆盖）+ 5 处裸值 + 兜底取暗色 |
| 风险表 P0×3 | 含「令牌失效」相关项 | 降级/删除；新增 P1：`--dsw-alias-state-business-secondary` 令牌不存在、primitives 移除致箭头缺失 |
| 待决 D1–D5 | 基于旧根因 | D1（令牌映射）已解决，改为「按钮语义色对齐策略」；其余保留 |
| 参照物坐标 | rc.2 令牌基准文件错误 | 更正为 `dsh-client-ui-theme/lib/client.js`，并补充 4 个官方 CSS 模块坐标 |

---

## 7. 后续依赖链（更新后）

```
调研 ✅（本文档）
  → 修订 00-charter.md §3.2 / 风险 / 待决
  → R1' 按钮语义色体系对齐（A1–A9，最高优先）
  → R2' 输入/聚焦/校验态（B1–B4）
  → R3' 行高制式改 px（C系列全局）
  → R4' Dialog 规格（D1–D4）
  → R5' 裸值令牌化（5 处）+ 兜底改亮色
  → R6' package.json 过时声明清理 + 箭头内置 SVG
  → R7' 样本页 /ui-specimens（对齐后作为回归基线）
  → R8' 抽取共享变量层（可选）
```

> 优先级说明：R1'（按钮）与 R3'（行高）是用户最易感知的两项，建议先做；
> R7' 样本页的价值在于**对齐后固化基线**，防止后续回退。
