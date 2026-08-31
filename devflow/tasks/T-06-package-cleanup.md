# T-06 · R6' 依赖声明清理 + 箭头兜底 + 修 npm test 脚本

> 状态：待办 ｜ 优先级：中（含一个**当前 CI 不可用**的修复）｜ 预估：小

## 1. 现状与前置条件

### 三项内容

**(a) `package.json` 过时依赖声明**

`E:\DshProject\PluginsDev\dsh-settings-ui\package.json` 当前：

```json
"dsh": { "client": { "inject": [
  "@deepseek-ai/dsh-client-runtime",
  "@deepseek-ai/dsh-client-ui-slots",      ← rc.2 已移除该包
  "@deepseek-ai/dsh-client-ui-primitives"  ← rc.2 已移除该包
] } },
"peerDependencies": { "@deepseek-ai/dsh-client-ui-slots": ">=0.1.0-rc.0" }
```

已核实（`10-research.md` §2）：
- `dsh-client-ui-slots` 的 slot 服务**已并入 `dsh-client-runtime`**（`lib/types/client/slots.d.ts` 含 `SlotMap`）；四个 slot 名（`settings.plugin.item` / `settings.section` / `shell.overlay` / `settings.general.item`）在 rc.7 与 rc.2 出现的文件数完全一致（11 / 53 / 10 / 17）→ **功能无影响**，属声明过时
- `dsh-client-ui-primitives` 缺失 → kit 的 `try { prim = require(...) } catch { prim = null }` 静默降级，仅影响 1 处展开箭头

**(b) 展开箭头兜底**

`lib/client.js` 中：
```js
try { prim = require('@deepseek-ai/dsh-client-ui-primitives') } catch (err) { prim = null }
// 使用点：const Chevron = (prim && prim.IconChevronDownOutline14) || null
```
primitives 在 rc.2 不存在 → `Chevron` 恒为 null → **插件卡展开箭头可能不显示**。
官方 CSS 中箭头只依赖 `transform:rotate(180deg)`（`.YyYd_a_chevron` / `.YyYd_a_chevronOpen`），故用内置 SVG 即可对齐。

**(c) ~~修 `npm test` 脚本~~ → **撤销，不要修**（2026-08-30 更正）**

初判为「既有脚本缺陷」，**该判断有误**。kit 局部 HANDOFF（`PluginsDev\_internal-docs\kit\HANDOFF.md` §6）已明确：

> 沙箱内：`node --test` 会 spawn 子进程、撞沙箱命名管道 EPERM（全局 HANDOFF §5）——沙箱内用 `npm run ci`（内部全部 `stdio:'inherit'`）或直接 `node test/kit.test.mjs`

实测（Windows + Node 22.22.2，Git Bash 与 PowerShell 均失败）：

| 命令 | 结果 |
|---|---|
| `npm test`（= `node --test test/`） | ❌ `Error: Cannot find module 'E:\...\dsh-settings-ui\test'` |
| `node --test test` | ❌ 同上 |
| `node test/kit.test.mjs` | ✅ 48/48 通过 |
| `npm run ci` | ✅ 全绿（CI 门禁五步） |

**处置**：这是**环境已知限制**，不是脚本缺陷，**禁止修改 `package.json` 的 test 脚本**（可能破坏 CI）。
本单只需在 `20-plan.md` 与回执中记录「验证走 `npm run ci` / `node test/kit.test.mjs`」即可。

## 2. 目标

1. 移除对两个已移除包的 `inject` 声明与 `peerDependencies` 条目
2. 为展开箭头提供不依赖 primitives 的兜底
3. ~~让 `npm test` 在本机可正常执行~~ → **撤销**（环境已知限制，见 §1(c)）；改为在本单回执中记录验证方式

> ⚠️ 本单**不含**「把改动装进运行壳」——该环节独立为 **T-08**（见 `T-08-deploy-to-dev.md`）。

## 3. 禁止事项

- ❌ **不得**因为要修 (c) 就修改任何测试内容或放宽断言
- ❌ **不得**改动 `dsh.bundle.patch`、`cordis.patch.yml`、服务注册契约
- ❌ **不得**删除 `inject` 里的 `@deepseek-ai/dsh-client-runtime`（仍需）
- ❌ 不得新增对 rc.2 不存在包的依赖
- ❌ 改 `package.json` 后不得触发版本号变更（版本另议）
- 🔁 有更好的改法：记进回执 §6

## 4. 验证要求（必跑）

```bash
node --check lib/client.js
node --test "test/kit.test.mjs"     # 须 48/48
npm test                            # (c) 修复后须同样通过
node scripts/ci.mjs 或 npm run ci   # 若存在，须通过
```
另需确认 `lib/client.js` 中不再有 `@deepseek-ai/dsh-client-ui-primitives` 的**硬依赖**（try/catch 可保留为兼容路径，但必须有等效兜底）。

## 5. 回滚点

- git：`dsh-settings-ui` HEAD
- 文件：`cp package.json devflow/backup/pre-T06/package.json` + `cp lib/client.js devflow/backup/pre-T06/client.js`

## 6. 回执格式（写 `T-06.result.md`）

1. `package.json` 改了哪几行（前后对照）
2. 箭头兜底的实现方式与渲染验证方式（如何确认箭头出现、展开时旋转 180°）
3. `npm test` 修复后的命令与原始输出
4. 是否影响 6 个消费插件的装载（slot 服务来源变更的回归判断）
5. 人工核对点
6. 改进建议
