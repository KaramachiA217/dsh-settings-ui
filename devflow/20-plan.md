# 20-plan · kit 视觉对齐实施计划

> 阶段：Phase 2（计划编制）
> 版本：v1
> 日期：2026-08-30
> 依据：`10-research.md`（调研）、`00-charter.md`（立项，已修订）
> 状态：**执行中** —— R1' / R2' / R3' / R4' / R5' / R7' / R9 已完成并验证，R6' 待办

---

## 1. 决策记录（G0/G1 已拍板）

| # | 决策点 | 结论 | 落地情况 |
|---|---|---|---|
| **D6** | 主按钮跟哪套（官方自身有两套） | **跟官方一样保留两套**：插件卡内保存=官方反色（`label-primary` 底 / `bg-layer-3` 字）；其余场景=Models 页蓝底（`button-primary-fill` / `label-primary-foreground`） | ✅ R1' 已落地：`.sui-pcard-save` 保持反色不动；通用 `.sui-btn-primary` 改蓝底 |
| **D5** | 样本页与修复的顺序 | **改判为「先修后建」**：样本页放最后作回归基线 | 见 §3 排期 |
| **D7** | 样本页承载方式 | **改判为「双承载」**：dsh 客户端插件**无路由能力**（路由归官方 `dsh-web-app`），原定 `/ui-specimens` 独立 URL 做不到。改为 `settings.section`（主，铺全量；官方 `SettingsRoot` 一次只渲染 active section，体感即独立页）+ `shell.overlay`（辅，FAB 把手 + 可拖动/最小化面板），二者同受一个 localStorage 开关控制 | ✅ R7' 已落地 |
| 推进顺序 | — | R1'(按钮) → R3'(行高) → R2'/R4'/R5'/R6' → R7'(样本页) | 实际执行：R1' → R3' → **R5' 提前**（裸值是亮色主题硬伤且已具备完整令牌映射） |

---

## 2. 已完成批次

### R1' 按钮对齐官方 Models 页模型 ✅（commit `3b27c19`）

| 项 | 改前 | 改后（官方真值） |
|---|---|---|
| 基准 | `border-radius:8px; padding:5px 14px; font-size:13px; background:bg-layer-2` | `height:36px; border-radius:18px; font:inherit; font-size:14px; line-height:22px; padding:0 14px; inline-flex 居中; background:0 0` |
| primary | `business-primary` 蓝 + `button-info-hover` | `button-primary-fill` / `label-primary-foreground` / `button-primary-hover` |
| danger | **红底白字实心块** + `filter:brightness` | **红字透明底** + `interactive-bg-hover-danger`（原形态与官方完全相反） |
| 聚焦态 | 无 | `:focus-visible{box-shadow:0 0 0 2px border-l3}` |
| hover 守卫 | `.sui-btn:hover` | `:hover:not(:disabled)` |

**影响面**：kit 内部按钮全部汇聚在 `lib/client.js` 单一出口（`Button` 组件，className 模板）；外部仅 `dsh-bundle-manager` 使用 `sui-btn`，其余 4 个插件（`mcp-manager` / `search-manager` / `plugin-manager` / `skill-manager` / `proxy-manager`）不使用按钮类。

### R3' 行高改官方 px 制 ✅

官方制式：11→17 / 12→18 / 13→20 / 14→22 / 15→1.4 / 16→24 / 20→28（px）。

- 13px×1.5→**20px**（6 条规则，+0.5px）
- `.sui-pre` 12px×1.6→**18px**（-1.2px）
- 12px×1.5→**18px**（4 条，计算值相同，属制式统一，无视觉变化）
- 补官方有而 kit 缺的显式行高：`.sui-card-title` / `.sui-panel-title`（14px→22px）

> ⚠️ **诚实复评**：R3' 的实际视觉增量**明显小于调研阶段的估计**（原估「全页累积成整体紧一点」，实测仅 13px 文本 +0.5px、`.sui-pre` -1.2px、两个标题 +1px）。原因是 kit 大部分文本规则**未显式声明行高**（继承宿主），真正用倍数制的只有 12 条。R3' 的价值主要在**制式统一**（可维护性），而非视觉纠偏。

### R5' 裸值色号清零 ✅（commit 最新，**V1 达成**）

扫描口径：先剥离 `var(token, fallback)` 再统计（避免重蹈初版误诊）。结果 **CSS 158 条规则 + JS 侧 = 0 处裸值**。

| 位置 | 改后 |
|---|---|
| `.sui-toggle` 轨道/开启/滑块 | `--dsw-static-neutral-400` / `--dsw-alias-state-success-primary` / `--dsw-static-neutral-bluish-00` |
| `.sui-banner-*` `.sui-test-*` | 官方提示卡模式：border=`state-*-secondary` / bg=`state-*-tertiary` / color=`state-*-primary` |
| `.sui-card-error` `.sui-fab-badge` `.sui-mark` `.sui-toast*` `.sui-dot` | 对应官方语义令牌 |
| 阴影 3 处 | `--dsw-shadow-lv3`（dialog / overlay-panel / toast）、`--dsw-shadow-lv1`（fab） |

### R2' 输入框状态对齐官方 `.At1oFq_input` ✅（commit `c5e0a85`）

| 项 | 改后 |
|---|---|
| 字体 | 补 `font:inherit` |
| 聚焦选择器 | `:focus` → **`:focus-visible`**（官方仅键盘聚焦出环，鼠标点击不出） |
| 占位符 | 补 `::placeholder{color:--dsw-alias-label-dimmed}` |
| 禁用 | 补 `:disabled{color:label-tertiary;cursor:default}` |
| 同类同步 | `.sui-textarea` / `.sui-pfield-input` 一并补齐 |

> ⚠️ **未完成项**：原计划含 invalid 态（`.sui-input-invalid` + 错误文案），**本批未做**——因官方 `--dsw-alias-label-error` 自身未定义（缺陷 O1）。已登记进清单 C7，作 R10 候选。

### R4' Dialog 规格对齐官方 `.jLrgrW_*` ✅（commit `c02a519`）

| 项 | 改前 | 改后 |
|---|---|---|
| 宽度 | `min(520px, …)` | **`min(600px, 100%)`** |
| 内边距 | `18px` | **`28px`**（窄屏 `@media (width<=560px)` → `24px`） |
| 标题 | `15px / 700` | **`20px / 500 / 28px`** |
| 遮罩 | 仅 `bg-mask-1` | 补 **`backdrop-filter:var(--dsw-mask-blur)`** |

### R9 卡片行模式 ✅（commit `7fbf3db`）

解决 `dsh-bundle-manager` 「挂载插件项不要卡片盒子」的诉求：`.sui-card-row` 此前只改 flex 方向，border / background / 圆角 / padding 全继承自 `.sui-card`。改为 `border:0 / background:transparent / border-radius:0 / padding:6px 8px`，相邻行 `border-top:1px border-l1`。

### R7' UI 风格核对样本页 ✅（commit `3751a8c` + `a2e47eb`）

**承载（D7 双承载）**：

| 承载 | 槽位 | id | 说明 |
|---|---|---|---|
| 主 | `settings.section` | `dsh-settings-ui.ui-specimens`，order 9000 | 官方 `SettingsRoot` 用 `renderSlot(..., {only:active})`，**一次只渲染当前分区** → 点进去内容区只剩本页，体感即独立页（800px 模态面板） |
| 辅 | `shell.overlay` | `dsh-settings-ui.ui-specimens.overlay` | `.sui-fab` 把手 + `Panel`（可拖动 / 最小化 / 记住位置 / 可调大小） |

**开关**：`localStorage['dsh-settings-ui:specimen'] === '1'`，**默认关闭**；关闭时两个槽位都不注册（DoD V9）。开关入口在 kit 统计卡展开区（勾选后提示「刷新后生效」——注册发生在 apply 期）。

**内容**：按 `11-specimen-checklist.md` v2 的 A–K 组平铺，每个样本下方标注样式来源（类名 + token）；顶部 `TokenProbe` 运行时解析 40 个关注令牌、与预期不符的高亮（DoD V10）。

**kit 未提供的组件**（Popover / Tooltip / Dropdown / Drawer / Skeleton / 输入错误态）一律**如实标注占位**，不伪造官方样本。

**回归测试**：4 项（默认不可达 / 开关生效 / 分组与 token 标注 / 不计入统计），52/52 全绿。

---

## 3. 待办批次与排期

| 批次 | 内容 | 参照真值 | 预估量级 | 状态 |
|---|---|---|---|---|
| **R2'** | 输入框状态补全：`:focus`→`:focus-visible`、补 `::placeholder{color:label-dimmed}`、`:disabled` | `At1oFq_input*` | 小 | ✅ 已完成（**invalid 态未做，转 R10 候选**） |
| **R4'** | Dialog 规格：`min(520px)`→`min(600px)`、`padding:18px`→28px、标题 `15px/700`→`20px/500/28px`、遮罩补 `backdrop-filter:mask-blur` | `jLrgrW_*` + `VOzbGW_mask` | 中 | ✅ 已完成 |
| **R6'** | ① `package.json` 清理过时 `inject`（`dsh-client-ui-slots` / `-primitives`）与 `peerDependencies`；② 展开箭头内置 SVG 兜底（primitives 移除后 `IconChevronDownOutline14` 为 null） | — | 小 | ⏸ **待办** |
| **R7'** | 样本页：按组件分组 + 状态矩阵 + 样式来源标注 + 令牌体检高亮；**双承载 + 开发开关** | 对齐后的 kit 自身 | 大 | ✅ 已完成 |
| **R8'** | 抽取共享变量层（可选，视 R7' 后的重复度决定） | — | — | 可选 |

---

## 4. ⚠️ 需人工目视核对（不得单方面断言已修复）

| # | 项 | 原因 |
|---|---|---|
| M1 | **`.sui-toggle` 开关形态** | rc.2 官方无 pill 开关 CSS 参照（前端 CSS 的 `._toggle_1ye18_5` 是文字型切换按钮，非开关）。仅做了裸值→令牌，形态保留原设计 |
| M2 | **Dialog 圆角与整体观感** | 官方 Dialog 圆角由已移除的 primitives 提供，rc.2 无参照源 |
| M3 | **`.sui-banner` / `.sui-toast` 的 error 色** | 官方缺 `--dsw-alias-state-error-tertiary`，改用 `interactive-bg-hover-danger`（亮 `#ec13130d` / 暗 `#f25a5a26`），饱和度与 success/warn 的 tertiary 不同，需目视确认三者是否协调 |
| M4 | **`.sui-mark` 高亮底色** | 官方无 translucent 高亮令牌，改用 `business-tertiary`（亮 `deepseek-100` / 暗 `deepseek-800`），需确认深色下与正文对比度 |
| M5 | **主按钮两套并存的观感** | 决策已定（D6），但插件卡内反色 vs 其它处蓝底是否协调，需实际页面目视 |
| M6 | 行高改 px 后的整体松紧 | 增量很小（≤1.2px），是否可辨需并排截图 |

---

## 5. 🔴 发现的官方自身缺陷（kit 未照抄，已规避）

| # | 缺陷 | 证据 |
|---|---|---|
| O1 | **`--dsw-alias-label-error` 从未定义** | rc.7 与 rc.2 的令牌定义源中均无；但 `@deepseek-ai/dsh-client-ui-settings-plugins` 两版都在用（`.At1oFq_inputInvalid{border-color:var(--dsw-alias-label-error)}`、`.At1oFq_invalid{color:...}`）→ 官方插件表单的校验失败态实际拿不到颜色。**kit 改用存在的 `--dsw-alias-state-error-primary`** |
| O2 | **`--dsw-alias-state-error-tertiary` 不存在** | success / warn / business 的 tertiary 均有且主题自适应，唯独 error 缺失。**kit 改用 `--dsw-alias-interactive-bg-hover-danger`** |
| O3 | **`--dsw-alias-state-business-secondary` 不存在** | kit 原有 1 处引用（`.sui-badge[data-tone=info]`），长期走裸值兜底。已修（R1' 同批） |

> 这三条说明：**不能盲从官方代码**。官方包里也存在悬空令牌引用，照抄会把缺陷带进 kit。
> 校验方法（已写入工作区长期记忆）：声称「X 不存在」时反向验证——搜 X 的**使用方**是否也崩。

### 5b. 🔴 kit 自身缺陷（R7' 期间由新增测试暴露，已修）

| # | 缺陷 | 证据 | 处置 |
|---|---|---|---|
| **K1** | **`KitPluginsCard` 统计恒为「0 个」** | 代码按扁平 `entry.registrant` 读取，但官方 `slots.entries()` 返回 **`{ options, render }`** 嵌套结构——官方 `dsh-client-ui-renderer` 即按 `entry.options.id` / `.key` / `.order` 读取；kit 同文件却又用 `e.options.id`，两种读法自相矛盾 | 改为兼容读取 `optOf(e) = e.options ?? e`；fake slots 的 `entries(key)` 也补上按槽名过滤。⚠️ **该修复不完整**——官方条目实为**混层形状**，`registrant` 挂在 entry 顶层而非 `options` 内，此读法命中 options 层后不再看顶层，`registrant` 仍读不到。缺陷延续为 **K4** |
| **K2** | **统计卡无法服务端渲染** | `useSyncExternalStore(subscribe, getSnapshot)` 缺第三参数 `getServerSnapshot`，`react-dom/server` 渲染时抛 `Missing getServerSnapshot` | 补 `getServerSnapshot`（同 `getSnapshot`），客户端行为不变 |
| **K3** | **样本页开关显示死锁（2026-08-31 用户实测反馈）** | `SpecimenToggle` 挂在 `entries.map(...).concat([...])` 之后 ⇒ **仅当 `entries.length > 0` 时开关才渲染**；而默认「0 个插件通过 kit 接入」时开关不出现 ⇒ 用户永远无法从关闭态打开样本页。用户原话：「我没找到 UI 风格核对页（样本页）的选项」 | 把开关移出三元表达式，**无条件渲染**，并加 `.sui-kit-specimen` 分隔条（它不是插件，避免与条目混淆）。同时给 `KitPluginsCard` 加 `defaultOpen` prop（仅供 SSR 断言展开区，官方渲染不传、默认折叠），新增 2 项回归测试锁死（测试 53/54，共 54/54 全绿） |
| **K4** | **统计卡仍恒为「0 个」（2026-08-31 用户实测反驳，K1 修复未生效）** | 官方 `SlotCore.register()`（`@deepseek-ai/dsh-client-ui-slots`）产出的条目是**混层**形状：`entry.options` **只装** `{ key, id, order, label, priority }` 五项，而 `registrant` / `locale` / `inject` / `store` / `select` / `children` 挂在 **entry 顶层**。kit 的 `optOf(e) = e.options ?? e` 一旦命中 options 层就停在那里，`registrant` 恒 `undefined` ⇒ 过滤恒 false ⇒ 计数恒 0 | 改为**两层都查**的 `fieldOf(e, name)`（先 `e.options` 再 `e` 顶层）。同时把 fake slots 改造成**与官方同形的混层桩**（`makeSlotEntry`），新增测试 55 显式锁定该契约。**反向验证**：临时退回旧读法后测试 52/54/55 立即失败，确认测试真的抓得住该缺陷 |

> **为什么此前没暴露（K4 的方法论教训，重要）**：三轮修复（扁平读法 → `optOf` → `fieldOf`）全都「测试通过」，却两次在用户真机上是坏的。根因是**测试桩与真实实现不同形**——旧桩把 opts 整包塞进 `options`，kit 的任何读法在桩上都能命中，缺陷完全隐身。
> **定论**：测试桩必须与被测依赖**同形**，否则「测试全绿」不构成任何证据。凡涉及第三方运行时返回结构的桩，都要先去读真实实现源码再写桩，并做**反向验证**（把修复退回去，确认测试会红）。

> **为什么 K1/K2/K3 此前没暴露**：既有 48 项测试只验证了统计卡「已注册」与字典内容，**从未断言过计数与列表**，且 fake slots 的 `entries()` 忽略槽名参数。K1/K2 都是补样本页回归测试时才浮出水面；K3 则是「开关本身在空态下不可见」——SSR 快照默认折叠根本覆盖不到展开区，属于**纯交互态缺陷**，只能靠人工在壳里点开才可能发现。

> ⚠️ **排查「用户说找不到某个 UI」时的第一怀疑点**：先确认 UI 是否挂在「列表非空」之类的前置条件后面，形成自锁；再确认用户看的那个壳装的是不是最新版（本次同时存在「stable 装的是 v0.4.1 旧版、样本页只在 dev 副本」的情况，两个原因叠加）。

---

## 6. 验证方式（每批必跑）

```bash
cd E:/DshProject/PluginsDev/dsh-settings-ui
node --check lib/client.js                 # 语法
node --test "test/kit.test.mjs"            # 单测 48 项（npm test 脚本当前在 Windows 下不可用，见 R6'-③）
```
提交时 `.githooks` 会自动跑完整 CI（语法 / 单测 / 凭据扫描 / 发布物脱敏 / npm 打包白名单）。

**回滚点**：每批一个 commit（R1'=`3b27c19`，R3'、R5' 各一个），文件级备份在 `devflow/backup/pre-R1-R3/`。

---

## 7. 与 DoD 的对照（更新）

| DoD | 状态 |
|---|---|
| V1 裸值清零 | ✅ **达成**（CSS 158 规则 + JS 侧 = 0） |
| V2 变量层覆盖七维度 | ⏸ 待 R8'（可选） |
| V3 现有测试全绿且未改测试迁就实现 | ✅ **52/52**（新增 4 项样本页回归测试）。注：为让统计卡可被断言，修了 K1/K2 两个**被测代码的真实缺陷**，未放宽任何断言 |
| V4 语法与构建检查通过 | ✅ 每批 CI 通过 |
| V5 逐项偏差说明（成因+修改+是否需人工复核） | 🟡 已随各批 commit message 记录；样本页已把「样式来源」落到页面上，最终汇总待决策方目视后出 |
| V6 冷启动冒烟（设置页无控制台报错） | ⏸ 待决策方在 dev 壳目视（dev 副本已同步，rev `56169694212f`） |
| V7 令牌引用合规（V7 已改写） | ✅ 唯一违规 `--dsw-alias-state-business-secondary` 已修 |
| V8 核对清单经决策方确认 | 🟡 `11-specimen-checklist.md` **已升 v2**（样式来源全部回填），待决策方确认 |
| V9 样本页生产不可达 | ✅ 默认不注册任何槽位，有自动化测试断言 |
| V10 样本页标注样式来源 + 失效令牌高亮 | ✅ 每个样本标注类名 + token；`TokenProbe` 运行时解析 40 个令牌并高亮异常 |
