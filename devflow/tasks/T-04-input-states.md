# T-04 · R2' 输入框状态补全

> 状态：待办 ｜ 优先级：中 ｜ 预估：小（4–6 条 CSS + 可能 1 处 JS 分支）

## 1. 现状与前置条件

必读文件（绝对路径 + 关键位置 + 摘录）：

| 文件 | 位置 | 摘录 |
|---|---|---|
| kit 实现 | `E:\DshProject\PluginsDev\dsh-settings-ui\lib\client.js` | 约 L47–49 `.sui-input` / `.sui-input:focus` / `.sui-textarea`；约 L197–199 `.sui-pfield-input` / `:focus-visible` / `:disabled` |
| 官方真值 | `E:\DshProject\PluginsDev\dsh-settings-ui\devflow\ref\official-settings-css.css` | `At1oFq_input` 段（插件页规格）、`zGbnIq_input` 段（Models 页规格） |
| 令牌定义 | `E:\DshHarness\0.1.1-rc.2\node_modules\@deepseek-ai\dsh-client-ui-theme\lib\client.js` | 本单用到的令牌见 §3 |
| 调研结论 | `devflow\10-research.md` §4.2 | 输入类偏差 B1–B5 |

当前缺口（对照官方）：

- `.sui-input` 用 `:focus` 而非 `:focus-visible` → **鼠标点击也出聚焦环**（官方仅键盘聚焦时出现）
- 缺 `::placeholder{color:var(--dsw-alias-label-dimmed)}`
- `.sui-input` 缺 `:disabled`（`.sui-pfield-input` 已有）
- 缺 invalid 态：`.sui-input-invalid`（边框）+ 错误文案色
- `.sui-input` 缺 `font:inherit`

## 2. 目标

把 kit 的两套输入框（`.sui-input` 通用 / `.sui-pfield-input` 插件卡字段）补齐到官方状态覆盖。

## 3. 官方真值（直接抄，勿自行发挥）

```css
/* 插件页规格（.sui-input / .sui-pfield-input 跟这套） */
.At1oFq_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);
              height:34px;font:inherit;color:var(--dsw-alias-label-primary);
              border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.At1oFq_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.At1oFq_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.At1oFq_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}

/* Models 页规格（仅供参照，本单不改） */
.zGbnIq_input::placeholder{color:var(--dsw-alias-label-dimmed)}
.zGbnIq_input:disabled{opacity:.6;cursor:default}
```

⚠️ **不要照抄 `.At1oFq_inputInvalid{border-color:var(--dsw-alias-label-error)}`** —— `--dsw-alias-label-error` 在 rc.7 与 rc.2 **均从未定义**（官方自身缺陷 O1，见 `20-plan.md` §5）。
invalid 态改用 **`var(--dsw-alias-state-error-primary)`**。

## 4. 禁止事项

- ❌ 不改业务逻辑、不新增/删除组件、不改 `Button` / `Switch` 等其它组件
- ❌ 不修改测试文件（`test/kit.test.mjs`）
- ❌ 不动 `.sui-pcard-save` / `.sui-pcard-discard`（已在 R1' 对齐，保持官方反色第二套）
- ❌ 不改输入框的尺寸规格（34px / 圆角 8 / padding 0 12px / 13px·20px 已正确）
- ❌ 不使用任何裸值色号（V1 已达成，禁止回退）
- 🔁 **有更好的改法：记下来回传给统筹方（写进回执 §6），不得私自实施**

## 5. 回滚点

- git：`E:\DshProject\PluginsDev\dsh-settings-ui` 当前 HEAD（R5' 提交后）
- 文件：`cp lib/client.js devflow/backup/pre-T04/client.js`

## 6. 回执格式（完成后写 `T-04.result.md`）

1. **改了什么**：逐条列出（选择器 / 属性 / 改前 → 改后）
2. **未改什么 & 原因**
3. **验证结果**：`node --check lib/client.js` 与 `node --test "test/kit.test.mjs"` 的原始输出（48 项须全绿）
4. **人工核对点**：哪些改动无法自动证伪
5. **风险**：对 6 个消费插件（`mcp-manager` / `search-manager` / `bundle-manager` / `plugin-manager` / `skill-manager` / `proxy-manager`）的影响判断
6. **改进建议**：你认为更好但本单未要求做的（位置 / 改法 / 理由 / 预估影响面）
