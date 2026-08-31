# T-08 · 把 R1'/R3'/R5' 改动落地到 dev 壳

> 状态：待办（**阻塞视觉验收**）｜ 优先级：**最高** ｜ 预估：小
> 前置：R1' / R3' / R5' 已 commit，CI 全绿

## 0. 为什么单独成单

截至本单创建时，R1'/R3'/R5' **只存在于源码与 git 中，运行壳里跑的仍是旧副本**：

| 检查项 | 结果 |
|---|---|
| `~/.dsh/profiles/dev/node_modules/dsh-settings-ui` 版本 | `0.4.1` |
| 副本 `lib/client.js` 时间 | Aug 19 22:24 |
| 副本中 `button-primary-fill`（R1' 标志）出现次数 | **0** |

即：所有样式对齐对运行时**零生效**。本单是让改动被看见的唯一途径。

## 1. 前置必读（强制，不得跳过）

| 文件 | 位置 | 关键内容 |
|---|---|---|
| 全局 HANDOFF | `E:\DshProject\HANDOFF.md` | 「插件挂载方式」段落（更新 runtime-mounted 插件的正确做法）、§5 纪律 ⑥⑦、§7 开发节奏、§9 流程 A |
| kit 局部 HANDOFF | `E:\DshProject\PluginsDev\_internal-docs\kit\HANDOFF.md` | §6 测试与发布（版本号四处同步）、§4 发布卫生 |
| 本项目计划 | `devflow\20-plan.md` | §4 M1–M6 人工核对点（本单落地后需逐项目视） |

> ⚠️ **本单起草时曾漏读这两份 HANDOFF，导致给出过错误的生效流程（漏 bump 版本）。执行前务必亲自复读原文，不要只信本单摘要。**

## 2. 两条路径（二选一，先 A 后 B）

### 路径 A · 临时快速验证（推荐先做）

全局 HANDOFF 明确允许：「本地快速验证可临时覆盖 `node_modules/<pkg>/lib/` + 重启 dsh」。

1. 备份现有副本：`cp -r ~/.dsh/profiles/dev/node_modules/dsh-settings-ui/lib devflow/backup/pre-T08/lib`
2. 用源码 `lib/client.js` 覆盖副本
3. 重启 dev 壳
4. 目视核对 M1–M6

**优点**：分钟级、不碰 profile 依赖、可秒回滚。**缺点**：下次 `pnpm install` 会被冲掉。

### 路径 B · 正式落地（确认效果后再做）

严格按全局 HANDOFF 的顺序，**顺序不可颠倒**：

1. **bump patch 版本** `0.4.1 → 0.4.2`
   - ⚠️ **pnpm 同版本 `file:` 缓存会吞掉重打的 tgz** —— 不 bump 则装出来仍是旧代码，症状是「改了但没生效」
2. **同步四处**（kit HANDOFF §6，缺一则 CI 挂或文档失真）：
   - `package.json` 的 `version`
   - `lib/client.js:29` 的 `const KIT_VERSION = '0.4.2'` —— **测试有同步断言**，且 `STYLE_ID` 带版本号（防旧样式缓存）
   - `GUIDE.zh.md` 头部版本
   - `CHANGELOG.md` 追加条目（kit HANDOFF §4 发布卫生）
3. 打 tgz：`npm pack`
4. 手改 **dev** profile `package.json` 的 `dependencies`：
   `"dsh-settings-ui": "0.4.1"` → `"dsh-settings-ui": "file:E:/DshProject/PluginsDev/dsh-settings-ui/dsh-settings-ui-0.4.2.tgz"`
5. `pnpm install --no-frozen-lockfile`（**必须带 `--no-frozen-lockfile`**）
6. 重启 dev 壳

## 3. 禁止事项（每条都对应一个已发生过的坑）

- ❌ **不得用 `dsh plugin add`** 更新 runtime-mounted 插件 —— CLI 的 `reconcilePlugins` 会把「声明了 `dsh.bundle.patch` 的依赖」自动加回 `dsh.profile.bundles`（`apps/cli/src/plugin.ts:66-69`），**破坏 framework-only**
- ❌ **不得跳过版本 bump 直接重打 tgz** —— pnpm 缓存按版本命中，装出来是旧的
- ❌ **`pnpm install` 前不得有运行中的 dsh 实例** —— install 会换共享 `profiles\node_modules`，把运行实例连带杀死；反复崩溃可能导致壳主进程退出（§5 纪律 ⑦）
- ❌ **不得与 bm registry 迁移并行**（§5 纪律 ⑥）
- ❌ **本轮不得同步 stable** —— §7 决策：开发节奏 = dev 单边，stable 只在 dev 完全稳定后批量同步；§9 铁律：开发中的插件只装 dev
- ❌ 不得改 `npm test` 脚本（沙箱已知限制，见 T-06 §1(c)）
- 🔁 有更好的改法：记进回执 §6

## 4. 验证

落地后按 §9 流程 A：

1. **dev 壳**：dev profile 正常启动、设置页无控制台报错
2. **浏览器复验**（流程 A ②）：托盘「在默认浏览器打开」—— 跑同一份 client，等价真实浏览器
3. **逐项目视 M1–M6**（`20-plan.md` §4），重点是：
   - M1 `.sui-toggle` 开关形态（官方无参照，只做了裸值→令牌）
   - M3 error 提示条底色（官方缺 error-tertiary，用 `interactive-bg-hover-danger` 顶替）
   - M5 主按钮两套并存（D6 决策）的观感
4. 回归：`npm run ci`（沙箱内不要用 `npm test`，见 T-06）

## 5. 回滚点

- 路径 A：`devflow/backup/pre-T08/lib/`（覆盖回原副本 + 重启）
- 路径 B：dev profile `package.json` 改回 `"dsh-settings-ui": "0.4.1"` + `pnpm install --no-frozen-lockfile`；源码侧回退到 R5' 之后的 commit
- 源码：`dsh-settings-ui` git HEAD（R5' 提交后）

## 6. 回执格式（写 `T-08.result.md`）

1. 走了哪条路径、为什么
2. 版本号四处同步的核对结果（逐项列出实际值）
3. dev profile `package.json` 改动前后对照
4. 验证结果：启动 / 控制台 / 浏览器复验的原始输出
5. **M1–M6 逐项目视结论**（✅ 可接受 / ❌ 需再调 / ⏸ 无法判定 + 原因）
6. 改进建议（位置 / 改法 / 理由 / 预估影响面）
