# 立项纪要 · kit 视觉对齐与后续演进

> status: DRAFT（待 G0 放行）
> author: 方经纬（协调中枢）
> created: 2026-08-30
> 内核基线：0.1.1-rc.2

---

## 1. 目标

1. **主目标**：定位并修复 `kit`（`dsh-settings-ui` v0.4.1）的 UI 实现与 dsh 原版 UI 的视觉差异，覆盖布局栅格、间距内边距、配色层级、字体字号行高、图标与圆角边框、组件各状态（hover/选中/禁用/空态/加载）、响应式七个维度。
2. **新增交付物 · UI 风格核对页**（决策方 2026-08-30 追加）：在 kit 中新增独立路由 `/ui-specimens` 的样式样本页，按组件类型分组展示官方示例，覆盖主要状态（默认/悬停/聚焦/按下/禁用/加载）与主要规格（尺寸、语义色、图标+文字、纯图标），每个样本标注样式来源（组件名 / 类名 / 设计 token），供逐项人工打勾核对。**仅在开发环境或指定开关下可访问，不污染生产代码。**
3. **治本目标**：建立 kit 自己的样式变量层与基础组件，使后续 bm 及其它消费方不再重复出现同类偏差；并使 token 失效能被样本页自动暴露。
4. **演进目标**：kit 视觉问题解决后，继续推进 kit 与 bm（`dsh-bundle-manager` v0.5.6）的后续开发，全程保持与 dsh 原版 UI 一致。

## 2. 非目标（本次明确不做）

- ❌ 不改动任何业务逻辑（仅调样式与结构）
- ❌ 不改动 `cordis.patch.yml` 的服务注册契约
- ❌ 不升级内核（保持 0.1.1-rc.2 基线）
- ❌ 不改动官方包（`@deepseek-ai/*`）任何文件
- ❌ 本次不处理 bm 的视觉问题（待 kit 收敛成基础组件后另开 EPIC）

## 3. 现状勘察结论（Phase 0 实测）

### 3.1 关键主体

| 主体 | 路径 | 版本 / 形态 |
|---|---|---|
| **kit UI 实现** | `E:\DshProject\PluginsDev\dsh-settings-ui\lib\client.js` | 1510 行，**手写、无 src/、无构建步骤** |
| 运行内核 | `E:\DshHarness\current` → `0.1.1-rc.2` | npm 安装（编译产物） |
| 源码 checkout | `E:\DeepSeek Harness` | **0.1.2-alpha.1（比运行内核新）** |
| bm | `E:\DshProject\PluginsDev\dsh-bundle-manager\` | 0.5.6 |

### 3.2 决定性诊断（偏差根源）

> ⚠️ **第二次诊断修订（2026-08-30，调研后推翻）**：前两版结论**均已作废**。
> - 初版误判「样式层脱离 token 体系」——源于两次正则失真。
> - 修订版误判「8 个令牌在 rc.2 失效」——**源于取错真值文件**：把 rc.2 的 `dsh-web-frontend/dist/assets/index-C6eRlFa6.css` 当作令牌定义源，而该文件 `:root` 出现 **0 次**、仅定义 1 个令牌，其余 201 处全是 `var()` 消费。从中数出的「56 种」是消费抽样，不是定义集。
> - **rc.2 的令牌真值源是 `dsh-client-ui-theme/lib/client.js`（运行时注入，350 个）**。据此重算，结论如下。完整取证见 `devflow/10-research.md`。

#### 已证伪：令牌失效不是偏差原因

| 指标 | 实测值 | 判定 |
|---|---|---|
| rc.7 令牌定义数（前端 CSS） | 351 | — |
| rc.2 令牌定义数（主题包） | **350** | — |
| rc.7 有 / rc.2 无 | **1**（`--dsw-hovercard-bg`，且 rc.2 CSS 中另有定义）→ 实质差集 **0** | ✅ |
| 同名令牌取值差异 | 101 处，**全为记法差异**（`rgb(65,118,230)`↔`#4176e6`、`rgba(0,0,0,.24)`↔`#0000003d`） | ✅ 语义等价 |
| **真正不存在的令牌** | **仅 1 个：`--dsw-alias-state-business-secondary`**（rc.7 与 rc.2 均无，官方只有 `business-primary` / `business-tertiary`）—— kit 自己写错名 | ⚠️ 1 处笔误 |
| rc.2 主题注入作用域 | `:root{...}` + `body[data-ds-dark-theme]{...}`，`document.head` 全局注入 | ✅ kit DOM 正常继承 |

**结论：rc.7 → rc.2 调色板零变更，令牌体系实质等价。偏差与令牌失效无关。**
（反证：官方 rc.2 代码自身正在使用 `--dsw-alias-bg-module-platform`——若真失效，官方 UI 会先崩。）

#### 真实主因：手写 CSS 与官方 CSS Modules 产物的逐条差异

官方设置页不手写 CSS，而是 **CSS Modules 编译产物**（类名哈希如 `YyYd_a_card`、运行时 `<style data-plugin-css>` 注入），且令牌**裸用无兜底**。kit 是手写 145 条 `.sui-*` 规则并全部带兜底，两侧在以下维度存在实质偏差（详见 `10-research.md` §4）：

| # | 维度 | 偏差要点 | 量级 |
|---|---|---|---|
| 1 | **按钮语义色** | 次级按钮官方 `background:0 0`（透明描边），kit 填充 `bg-layer-2`；卡内保存官方为**高对比反色**（`label-primary` 底），kit 用蓝色 `state-business-primary`；主按钮 hover 用错 `button-info-hover` 族 | **大** |
| 2 | **危险按钮形态** | 官方 = 红字透明底 + `interactive-bg-hover-danger`；kit = 红色实心块 + `filter:brightness` | **完全相反** |
| 3 | **行高制式** | 官方 px 制（14→22 / 13→20 / 12→18 / 16→24）；kit 倍数制（1.5 / 1.4）。13px 差 0.5px、14px 差 1px，**全页累积**形成「整体紧一点」的观感 | **中（累积显著）** |
| 4 | **Dialog 规格** | 官方 `min(600px)` + 内容 `padding:28px` + 标题 `20px/500/28px` + 遮罩毛玻璃；kit `min(520px)` / `18px` / `15px/700` / 无 blur | **中** |
| 5 | **状态覆盖** | 官方覆盖 `hover` / `:focus-visible` / `:disabled` / `:hover:not(:disabled)` / invalid；kit 多数只有 hover + disabled，且用 `:focus` 而非 `:focus-visible`（鼠标点击也出聚焦环） | **中** |
| 6 | **裸值色号 5 处** | `.sui-toggle` 灰、`.sui-fab-badge` 绿、`.sui-card-error` 红、`.sui-banner*/toast*` 的 rgba、`.sui-mark` 蓝 —— 亮色主题下必然失真 | **中** |
| 7 | **兜底值取暗色（潜伏）** | kit 的 `var(--dsw-*, #xxx)` 兜底全取**暗色主题**值（如 `label-primary` 兜底 `#f9fafb`，亮色真值应为 `#0f1115`）。令牌正常解析时无影响；一旦主题包未加载即在亮色下渲染成暗色 | **低（现症）/ 高（风险）** |
| 8 | **卡片 gap** | `.sui-card` gap `10px` vs 官方 `rowCard` `12px` | **小** |

> ✅ **已对齐部分**：插件卡全套 `.sui-pcard*` 与官方 `YyYd_a_*` **1:1 一致**（v0.4.0 的成果），字段 `.sui-pfield*` 与 `At1oFq_*` 基本一致（缺 badge / invalid 两态）。

#### 次要成因（依赖面，非偏差主因）

- rc.2 移除 `dsh-client-ui-slots`：slot 服务**已并入 `dsh-client-runtime`**（含 `SlotMap`），四个 slot 名在两侧出现文件数完全一致（11/53/10/17）→ **功能无影响**，但 `package.json` 的 inject 与 peerDependencies 声明已过时，需清理。
- rc.2 移除 `dsh-client-ui-primitives`：kit `try/catch` 静默降级，仅影响 1 处展开箭头 `IconChevronDownOutline14`。

> **修复方向随之改变**：不是「查令牌替代名」（问题不存在），而是**把手写 `.sui-*` 逐条对齐到官方 CSS Modules 真值**，并把裸值、行高制式、状态覆盖、兜底策略一并收敛。官方真值已固化至 `devflow/ref/official-settings-css.css`（157 条），kit 现况见 `devflow/ref/kit-css.css`（145 条）。

### 3.3 可比对参照物

| 参照 | 路径 | 用途 |
|---|---|---|
| 官方设置 UI | `@deepseek-ai/dsh-client-ui-settings` | 卡片/字段原语的官方实现 |
| 官方插件页 | `@deepseek-ai/dsh-client-ui-settings-plugins` | kit 声明要对齐的页面 |
| **设计令牌定义源（rc.2 唯一真值）** | `@deepseek-ai/dsh-client-ui-theme\lib\client.js` | **350 个 `--dsw-*` 令牌的真值**（`:root` 亮色 + `body[data-ds-dark-theme]` 暗色，运行时注入 `document.head`） |
| ⚠️ 反例（**不可**作令牌基准） | `dsh-web-frontend\dist\assets\index-C6eRlFa6.css` | 该文件 `:root` 出现 0 次，只有 1 个令牌定义，其余 201 处为 `var()` 消费 |
| **官方样式真值（已抽取）** | `devflow\ref\official-settings-css.css` | 157 条官方 CSS Modules 规则（`At1oFq_*` / `YyYd_a_*` / `zGbnIq_*` / `VOzbGW_*` / `jLrgrW_*`） |
| kit 样式现况（已抽取） | `devflow\ref\kit-css.css` | 145 条 `.sui-*` 规则，供逐条比对 |
| 官方插件卡 + 字段 | `@deepseek-ai/dsh-client-ui-settings-plugins` | `fields.module.css` + card 模块（kit 主要对齐对象） |
| 官方行卡片 / 按钮全套 / Dialog | `@deepseek-ai/dsh-client-ui-settings-models` | `zGbnIq_*` / `jLrgrW_*` |
| 官方设置浮层骨架 | `@deepseek-ai/dsh-client-ui-settings-general` | `VOzbGW_*`（遮罩 / 面板 / 导航） |

> 令牌示例：`--dsw-alias-bg-layer-1/2/3`、`--dsw-alias-border-l1~l4`、`--dsw-alias-label-primary/secondary/tertiary/dimmed/error`、`--dsw-alias-button-primary-fill/-hover`、`--dsw-alias-interactive-bg-hover/-active/-hover-danger`、`--dsw-alias-bg-module-platform`、`--dsw-shadow-lv3`、`--dsw-mask-blur`
>
> ⚠️ 官方 CSS 中令牌**裸用无兜底**（`var(--dsw-alias-border-l2)`）；kit 全部带兜底且兜底取暗色值——收敛时应与官方一致（见 §3.2 第 7 项）。

## 4. 约束

1. **只改样式与结构，不动业务逻辑**——每个改动需可回退到文件级。
2. **优先用官方令牌，其次用 kit 自研变量兜底**，禁止新增裸值。
3. 回滚点：`dsh-settings-ui` 是 git 仓，改前 `git commit`；同时备份 `lib/client.js` 到 `devflow/backup/pre-<任务号>/`（工作区根非 git 仓，双保险）。
4. 验收命令由**协调中枢亲自执行**（铁律：不采信执行方自述）。
5. 无法自动判定的视觉差异，必须**显式列入人工核对清单**，不得自行断言"已修复"。

## 5. 验收标准（DoD）

| # | 标准 | 判定方式 |
|---|---|---|
| V1 | `lib/client.js` 中裸值色号与裸值间距清零，全部改为令牌/变量引用 | 静态扫描：十六进制色值 0 处、裸 px 间距 0 处 |
| V2 | 抽取的样式变量层覆盖七个维度（布局/间距/配色/字号/圆角/状态/响应式） | 变量清单可枚举 |
| V3 | 现有测试全绿（`node --test test/`），且**未修改测试来迁就实现** | 中枢亲跑 |
| V4 | 语法与构建检查通过（`node --check lib/client.js`、`npm run ci`） | 中枢亲跑 |
| V5 | 逐项偏差说明：成因 + 修改内容 + 是否需人工复核 | 交付文档可逐条对照 |
| V6 | 冷启动冒烟：设置页渲染无控制台报错 | 中枢亲跑（需可启动环境） |
| **V7** | **令牌引用合规**：kit 引用的令牌集合中，不存在「rc.2 未定义」的项（当前仅 `--dsw-alias-state-business-secondary` 一项违规）；且兜底策略与官方一致 | 差集脚本复核（基准须为 `dsh-client-ui-theme/lib/client.js`，**不得**用前端 CSS）；差集为空 + 兜底值扫描 |
| **V8** | **核对清单先行**：`devflow/11-specimen-checklist.md` 产出分组核对清单（组件×状态×规格矩阵），经决策方确认后再生成页面 | 清单文件存在且已确认 |
| **V9** | **样本页可用且隔离**：`/ui-specimens` 在开发开关下可访问、生产构建不可达 | 开关关闭时路由不可达（自动化验证） |
| **V10** | 每个样本标注样式来源（组件名 / 类名 / token），且页面上**能直观看出 token 是否失效**（失效项高亮） | 目视 + 失效检测脚本 |

## 6. 风险登记

| 级别 | 风险 | 处置方案 |
|---|---|---|
| **P0** | 参照源版本不一致：运行内核 rc.2，源码 checkout 是 alpha.1。若误用 alpha.1 源码作参照，会产生"对齐了一个跑不起来的版本"的偏差 | **强制以 rc.2 的编译产物为唯一真值**；源码仅用于可读性辅助，且比对前记录 commit |
| **P0** | 视觉差异本质是主观判定，自动化无法证伪 | 建立「人工核对清单」，凡不能自动判定的一律列入，由决策方目视确认；**禁止我单方面标记"已修复"** |
| ~~P0~~ → **已解除** | ~~8 个 kit 依赖令牌在 rc.2 已失效~~ | **调研已证伪**（`10-research.md` §1）：rc.2 令牌 350 个，与 rc.7 实质等价，差集为 0；调色板零变更。**该风险不再存在，原「必须先做令牌映射」的前置条件撤销。** |
| **P1** | 真实偏差分散在 145 条手写 CSS 中（按钮语义色 / 危险按钮形态 / 行高制式 / Dialog 规格 / 状态覆盖 / 5 处裸值 / 兜底取暗色），**无单一根因，易漏改** | 以 `devflow/ref/` 双侧 CSS 真值为基准**逐条比对**；每批改动单独任务单 + 独立回滚点；禁止一次性大改 |
| **P1** | 官方存在**双规格**：主按钮在插件卡内为反色（`label-primary`）而在 Models 页为蓝色（`button-primary-fill`）；输入框 34px（插件页）vs 32px（Models 页）。盲从其一会产生新偏差 | 逐场景确认跟随哪一套；无法判定的列入人工核对清单（见 `10-research.md` §5） |
| **P1** | kit 兜底值取**暗色主题**值，令牌若失效即在亮色下渲染成暗色 | 收敛兜底策略：与官方一致改「裸用无兜底」，或兜底取亮色值 |
| **P1** | kit 无构建步骤、手写 1510 行，重构样式层引入回归的风险高 | 分批改、每批一任务单、每批独立回滚点；禁止一次性大改 |
| **P1** | 样本页若误入生产包，会污染产物并暴露内部实现 | 路由与组件均置于开发开关后；V9 强制验证生产构建不可达 |
| **P2** | bm 的"后续开发"需求未定义，若并入本次会导致范围失控 | 本次 EPIC 不含 bm；kit 收敛后另开 EPIC 立项 |
| **P2** | 官方 rc.2 未提供 specimen/gallery 现成页面（初查未见），样本页需自建 | 调研中枢确认；自建则以官方组件真实渲染，不手写仿制品 |

## 7. 待决事项（需 G0 拍板）

| # | 待决点 | 选项 | 推荐 |
|---|---|---|---|
| **D1** | 参照源版本 | A. 仅用 rc.2 编译产物 / B. 用 alpha.1 源码 / C. 两者交叉 | **A**（运行什么对齐什么） |
| **D2** | 本次范围 | A. kit 视觉对齐 + 样本页 / B. 再加 kit 功能演进 / C. 再加 bm | **A**（bm 待 kit 基础组件收敛后另开 EPIC；样本页已按你要求纳入） |
| **D3** | 重构力度 | A. 保守：逐条对齐官方 CSS 真值 + 补少量变量 / B. 激进：抽取基础组件层，重构卡片/字段原语 | **A**（根因已确认为「手写 CSS 与官方产物逐条偏差」，非「无变量层」；先按官方真值逐条对齐，再评估是否需 B；避免过度工程） |
| **D4** | 人工核对方式 | A. 纯文档清单你目视 / **B. 建 `/ui-specimens` 样本页逐项打勾** / C. 两者都要 | **B**（你已指定；且样本页能让 token 失效自动暴露） |
| **D5** | 样本页与视觉修复的顺序 | A. 先修视觉再建样本页 / ~~B. 先建样本页作为核对基线，再修~~ | **改判为 A**（2026-08-30 决策方拍板）：先按官方真值逐项修复，样本页放在最后作为**回归基线**固化成果。理由：R1'–R5' 的参照物是官方 CSS 真值（已抽取），不依赖样本页即可对照；样本页先建反而要在未对齐的状态下反复返工 |
| **D6** | 主按钮跟哪套（官方自身有两套） | A. 统一成一套 / **B. 跟官方一样保留两套** | **B**（2026-08-30 决策方拍板）：**插件卡内**保存按钮用官方反色（`background:label-primary` / `color:bg-layer-3`）；**其余场景**（页面顶栏/表单底/表格操作列/悬浮区）用 Models 页蓝底（`button-primary-fill` / `label-primary-foreground`）。已随 R1' 落地：`.sui-pcard-save` 保持反色不动，通用 `.sui-btn-primary` 改蓝底 |

## 8. 后续阶段（G0 放行后）

- Phase 1：**已完成**（2026-08-30）。产出 `devflow/10-research.md`：
  - 证伪原根因（令牌体系等价，rc.7→rc.2 调色板零变更）；
  - 确认唯一违规令牌 `--dsw-alias-state-business-secondary`（从未存在）；
  - 抽取官方 CSS 真值 157 条 → `devflow/ref/official-settings-css.css`，kit 现况 145 条 → `devflow/ref/kit-css.css`；
  - 输出 8 类实质偏差清单 + 6 项需人工核对点。
  - 待办：据调研结果回填 `11-specimen-checklist.md` 的「待调研」列，升级 v2 后交决策方确认。
- Phase 2：我编制《实施计划》与任务卡
- Phase 3：`dev-audit-hub` 计划复核
- **G1**：计划批准
- Phase 4：`dev-engineering-hub` 工程设计
- Phase 5：`dev-audit-hub` 设计复核
- **G2**：设计批准（**deepseek 独立设计审查**在此闸门之前）
- Phase 6：任务派发与并行执行（zcode / worker）
- Phase 7：`dev-audit-hub` 交付复核
- Phase 8：汇总验收 → **G3**
