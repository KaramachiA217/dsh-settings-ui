# Changelog

本项目的所有值得注意的变更都会记录在本文件中。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

> 维护规则：改代码 bump 版本时**同步追加本文件条目**（开发信息/踩坑 → HANDOFF；进度 → DEVBOARD；用户向变更史 → 本文件）。

## [Unreleased]

- （暂无）

## [0.2.21] - 2026-08-17

### Docs

- README（中/英）新增 **Roadmap** 小节：1.0.0 计划（`ui.describeForm` schema 驱动表单 + `settingsScope` 桥）、`.d.ts` 自动校验、能力边界（侧栏单例槽/浅色主题不做）、已知限制（ToastHost 多实例同显）、维护承诺。

## [0.2.20] - 2026-08-17

### Docs

- README 安装章节修订（中英同步）：官方 `dsh plugin --profile <name> add ./<tgz>` 列为首选，手写 profile 为等价备选；移除 rc.5 时代的 `link:` 与未发布的 `npm:` 安装建议（rc.6 起 `link:` ESM 解析失败，一律 `file:` tgz）。

## [0.2.19] - 2026-08-17

### Fixed

- `ui.ErrorBoundary` 崩溃时默认 `console.error` 输出错误与组件栈（此前被重写吞掉，渲染错误只剩 UI 一行文案，排障需全程复盘）
- `ui.section()` / `ui.overlay()` 自动包裹 `ui.ErrorBoundary`——消费方忘记自包边界时，渲染错误只塌陷为当前卡片/浮层错误横幅，不直达官方 slot（白屏/整页崩）
- `createPanelStore` 跨标签页同步：监听 `storage` 事件合并其它页写入的 pos/anchor/minimized/size（壳窗口 + 浏览器同 origin 双开不再互相覆写且不同步）；新增 `dispose()` 移除监听
- `useToast` 定时器句柄用后即弃（防长会话下 Set 无界增长）
- 面板持久化恢复/写入失败、locale 字典注册异常不再纯静默（`console.warn` 留痕）

### Docs

- 家族第二轮审理（kit）：HANDOFF/DEVBOARD 内 desktop profile 部署版本修正为 0.2.18（此前记 0.2.11 系滞后）；ToastHost 多实例同显已知限制入 GUIDE；`.d.ts` 自动校验入 backlog

## [0.2.18] - 2026-08-17

### Fixed

- 样式注入 id 带版本号（`dsh-settings-ui-style-v<ver>`）：旧版 kit 副本先注入的样式不再阻止新版样式生效（审查 P3-2）
- `useToast` 的自动消隐定时器随宿主卸载清理（审查 P3-3）
- `createPanelStore` 从 localStorage 恢复 pos/anchor/size 时改用 `Number.isFinite` 校验（审查 P3-4）

### Docs

- 审查报告与差距分析纠偏：公开发布 = 未来目标（现阶段不启动），非"已定决策"；差距分析 §2.3 增补第三策略（消费方不列 kit peer、宿主提供）并统一判罚尺度

## [0.2.17] - 2026-08-17

### Added

- 通用设置统计卡文案 locale 化：kit 经官方 locale 服务契约（`ctx.locale.register('dsh-settings-ui', {zh, en})`）注册字典命名空间，卡片随活跃语言渲染（zh/en）；locale 服务缺席时退回内置中文
- README 兼容性声明（已验证 rc.5；rc.6 已知差异：`link:` 开发挂载 ESM 解析失败须 tarball）

## [0.2.16] - 2026-08-16

### Added

- `ui.Tabs` 可访问性：`role=tablist`/`role=tab`/`aria-selected` + roving tabindex + 左右/Home/End 方向键切换
- `ui.Panel` 右下角拖拽 resize（宽 280–720 / 高 200–900，随视口收缩），`createPanelStore` 增 `size` 状态与 `resize()`（persist 一并保留尺寸）
- `ui.Panel` 窗口缩放时自动重新 clamp pos/anchor（面板不会丢出屏外）
- 通用设置统计卡同时统计 `ui.overlay()` 注册数（列表带「浮层」前缀）

### Changed

- 单测自包含：react/react-dom 进 devDependencies（kit 自己的 node_modules + `auto-install-peers=false`），不再依赖工作区共享 junction（测试稳定性）

## [0.2.15] - 2026-08-16

### Added

- 本地 CI 门禁（零依赖）：`npm run ci` = 语法检查 + 单测 + 凭据扫描 + 发布物脱敏回归 + npm files 白名单校验；`.githooks/pre-commit` 提交前自动执行（`npm run hooks` 启用）

## [0.2.14] - 2026-08-16

### Changed

- 发布卫生：补 `LICENSE`（MIT）与 `CHANGELOG.md`，并加入 npm `files` 白名单（随包分发）
- 文档脱敏：README/GUIDE 剥离本机专属路径与内部迁移任务存档；`GUIDE.zh.md` 随包分发（README 手册链接在包内有效）

## [0.2.13] - 2026-08-16

### Added

- `createSettingsStore` 增 `dirty`（`set({doc})` 置位、refresh/成功写后归零）与 `saved` 自清（`savedTtlMs`，默认 3000ms）
- `ui.ErrorBoundary` 错误边界（`title/fallback/onError`，收编消费方各自手抄的模板）
- `ui.Checkbox` / `ui.Radio`（原生 input + 内联文案）；`Rows` 增 `checkbox` 字段类型
- `ui.EmptyState`（`.sui-empty` 类的原子形态）
- `ui.toast` / `ui.ToastHost` / `ui.useToast` 零依赖广播式一次性通知

### Changed

- `commit`/`run` 成功时透传结果 payload（undefined → `true`，向后兼容旧布尔用法）
- `ui.Dialog` 补 ESC 关闭、Tab 焦点陷阱、`aria-modal`、关闭后焦点归还
- `Rows` 字段描述符 `min`/`max`/`disabled` 正式透传（`TextInput` 补 `min`/`max`；`TextArea`/`Select`/`Switch` 补 `disabled`）

## [0.2.12] - 2026-08-16

### Added

- `node --test` 单测（store/panelStore/注册契约/Rows/版本校验，零依赖）
- `lib/client.d.ts` / `lib/index.d.ts` TypeScript 类型声明（exports `./client` types 条件）
- `package.json` 加 `scripts.test` 与 `types`；KIT_VERSION ↔ package.json 同步由测试断言兜底

## [0.2.11] - 2026-08-16

### Added

- 自由路径组件族：`ui.Badge` 加 `tone`/`outline`（五色语义变体）、`ui.Spinner`、`ui.Dialog`、`ui.List`/`ui.ListItem`，及 `.sui-columns`/`.sui-column` 多列布局与对应样式类
- `ui.TextInput`/`ui.TextArea` 补 `onKeyDown` 透传

### Changed

- `ui.Button` 的 `danger` 从「透明底红字」改为「红色实心」

## [0.2.10] - 2026-08-16

### Changed

- 通用设置统计卡标题措辞调整

## [0.2.9] - 2026-08-16

### Changed

- 通用设置统计卡标题措辞调整

## [0.2.8] - 2026-08-16

### Fixed

- 等宽字体 token 统一为官方 `--ds-font-family-code`（原 `.sui-pre`/`.sui-textarea` 引用了不存在的 token / 裸值）

## [0.2.7] - 2026-08-16

### Fixed

- `ui.Panel` 锚定模式右侧放不下时翻转到把手左侧，防止越界/盖住把手

## [0.2.6] - 2026-08-15

### Changed

- 按官方 UI token 对齐全部 `var(--dsw-alias-*, fallback)` 备用色（暗色主题实值）

### Fixed

- `.sui-btn-primary:hover` 引用不存在的 `--dsw-alias-state-business-primary-hover` → 改用官方 `--dsw-alias-button-info-hover`

## [0.2.5] - 2026-08-15

### Changed

- 浮层族细节打磨（`ui.overlay` 注册 + `ui.Panel` chrome + `createPanelStore`/`usePanel` 持久化，0.2.x 系列渐次落地）

## [0.2.4] - 2026-08-15

### Changed

- 浮层族细节打磨（同上）

## [0.2.3] - 2026-08-15

### Changed

- 浮层族细节打磨（同上）

## [0.2.2] - 2026-08-15

### Changed

- 浮层族细节打磨（同上）

## [0.2.1] - 2026-08-15

### Added

- `.sui-fab` 呼出把手类

## [0.2.0] - 2026-08-15

### Added

- 浮层（自由路径）：`ui.overlay` 注册 `shell.overlay`、`ui.Panel` 浮层 chrome（拖拽/最小化/关闭/点击置顶）、`createPanelStore({ persist })` + `usePanel`（开合/位置/最小化，localStorage 持久化）、锚定模式、`.sui-overlay-*`/`.sui-pill-tabs`/`.sui-item-*`/`.sui-mark` 样式类

## [0.1.3] - 2026-08-15

### Added

- `ui.TextInput` `autoFocus`、浮层/列表样式类（消费方 conversation-search 迁移需求）

## [0.1.2] - 2026-08-15

### Changed

- 布局类补齐

## [0.1.1] - 2026-08-15

### Added

- `section()` locale 透传、`TextInput` `disabled`、`.sui-pre` / `.sui-section-title` 布局类

### Fixed

- 统计卡 ledger `registrant` 标记修复（自定义字段被白名单丢弃的 bug）

## [0.1.0] - 2026-08-14

### Added

- 首个版本：`ctx.settingsUi` 服务——原子组件（SectionHeader/Field/TextInput/TextArea/Select/Button/Switch/Card/StatusDot/Badge/Tabs/Banner + `h`）、`Rows` 声明式行渲染、`createSettingsStore`/`useSettings`（加载/保存/busy/error/saved/revision 冲突）、`section()` 注册（`.sui-root` 包裹 + 共享样式注入）、通用设置统计卡
