# T-05 · R4' Dialog 规格对齐

> 状态：待办 ｜ 优先级：中高 ｜ 预估：中（含结构微调）

## 1. 现状与前置条件

必读文件：

| 文件 | 位置 | 摘录 |
|---|---|---|
| kit 实现 | `E:\DshProject\PluginsDev\dsh-settings-ui\lib\client.js` | `.sui-dialog-backdrop` / `.sui-dialog` / `.sui-dialog-head` / `.sui-dialog-title` / `.sui-dialog-body` / `.sui-dialog-footer` |
| 官方真值 | `devflow\ref\official-settings-css.css` | `jLrgrW_*` 段（Dialog 本体）、`VOzbGW_mask` 段（遮罩） |
| 调研结论 | `devflow\10-research.md` §4.5 | Dialog 偏差 D1–D5 |

当前 vs 官方：

| 项 | kit 现状 | 官方 | 差 |
|---|---|---|---|
| 宽度 | `min(520px,calc(100vw - 48px))` | `min(600px,100%)` | 窄 80px |
| 内边距 | `padding:18px`（本体） | 本体 `padding:0` + `.jLrgrW_content{padding:28px}` | 紧 10px 且层级不同 |
| 标题 | `15px / 700` | `20px / 500 / 28px` | 字号字重各差一档 |
| 正文间距 | `gap:12px` | `.jLrgrW_body{margin-top:20px}` | — |
| 遮罩 | `background:bg-mask-1` | `background:bg-mask-1` + `backdrop-filter:var(--dsw-mask-blur)` | 缺毛玻璃 |
| 圆角 | `14px` | 官方由已移除的 primitives 提供 | **无参照，需人工核对** |

## 2. 目标

把 kit 的 Dialog 收敛到官方 `jLrgrW_*` 规格；遮罩补官方毛玻璃。

## 3. 官方真值

```css
.VOzbGW_mask{background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);position:absolute;inset:0}
.jLrgrW_dialog{width:min(600px,100%);padding:0}
.jLrgrW_content{box-sizing:border-box;flex-direction:column;max-height:calc(100vh - 48px);
                padding:28px;display:flex;overflow-y:auto}
.jLrgrW_title{color:var(--dsw-alias-label-primary);outline:none;margin:0;
              font-size:20px;font-weight:500;line-height:28px}
.jLrgrW_body{margin-top:20px}
@media (width<=560px){.jLrgrW_content{padding:24px}}
```

**执行前必须先验证** `--dsw-mask-blur` 在 rc.2 是否存在：

```bash
grep -o -- '--dsw-mask-blur:[^;}]*' "E:/DshHarness/0.1.1-rc.2/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js"
```
若不存在，改用官方 `VOzbGW_mask` 的实际写法前先回报统筹方，**不要自行发明模糊值**。

## 4. 禁止事项

- ❌ 不改 Dialog 的业务行为（开合逻辑、a11y 属性、`Escape` 处理、焦点陷阱）
- ❌ 不改测试（现有用例 `Dialog: closed renders nothing; open renders a11y modal markup` 必须继续绿）
- ❌ 不动 `.sui-dialog-footer` 的按钮排布（属 R1' 已对齐范围）
- ❌ 不使用裸值；阴影已改 `--dsw-shadow-lv3`，勿回退
- ❌ 圆角 `14px` 在拿到人工核对结论前**保持不动**（官方无参照源，见 M2）
- 🔁 有更好的改法：记进回执 §6，不得私自实施

## 5. 回滚点

- git：`dsh-settings-ui` HEAD（R5' 提交后）
- 文件：`cp lib/client.js devflow/backup/pre-T05/client.js`

## 6. 回执格式（写 `T-05.result.md`）

1. 改了什么（选择器 / 属性 / 改前 → 改后）
2. `--dsw-mask-blur` 验证结果（存在 → 取值；不存在 → 如何处置）
3. 验证结果：`node --check` + `node --test "test/kit.test.mjs"` 原始输出
4. 人工核对点（圆角、窄屏 560px 断点的表现）
5. 风险：Dialog 被哪些消费方使用、改动的外溢面
6. 改进建议（位置 / 改法 / 理由 / 预估影响面）
