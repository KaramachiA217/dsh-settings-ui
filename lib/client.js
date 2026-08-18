/**
 * dsh-settings-ui client half: the unified settings-page UI kit.
 *
 * Provides the `settingsUi` service (inject as `ctx.settingsUi`) so other
 * client plugins can register a settings section with a consistent,
 * better-sidebar-derived look without hand-rolling their own primitives,
 * CSS, or load/save state.
 *
 * Backward compatible: it only ADDS a service. Plugins that register
 * `settings.section` directly (the original approach — e.g. dsh-proxy-manager)
 * keep working unchanged; this kit never takes over or filters that slot.
 *
 * Plain-JS bundle (window.__ModuleLoader__.load), matching the three dsh-XXX
 * plugins it is built to serve.
 */
window.__ModuleLoader__.load({
  id: 'dsh-settings-ui',
  factory: (require) => {
    const React = require('react')

    /** Kit version shown on the General-settings count card. Keep in sync
     *  with package.json's version (no build step, so it is hard-coded). */
    const KIT_VERSION = '0.2.22'

    // 样式容器 id 带版本号：若未来某消费方连带打包了旧版 kit 副本，先注入
    // 的旧 <style> 不会阻止新版样式注入（同名 id 才会被 ensureStyle 跳过）。
    const STYLE_ID = 'dsh-settings-ui-style-v' + KIT_VERSION

    // ===== 共享样式（与 dsh-mcp-manager / dsh-search-manager 同源，--dsw-* 语义 token）=====
    const CSS = [
      '.sui-root{display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-header h3{margin:0;font-size:15px;font-weight:600;}',
      '.sui-desc{color:var(--dsw-alias-label-tertiary,#adb2b8);font-size:12px;margin:2px 0 0;}',
      '.sui-header-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}',
      '.sui-header-row .sui-header{display:flex;flex-direction:row;align-items:center;gap:12px;flex-wrap:wrap;flex:1;min-width:0;}',
      '.sui-header-row .sui-desc{margin:0;}',
      '.sui-actions-end{margin-left:auto;}',
      '.sui-field{display:flex;flex-direction:column;gap:4px;}',
      '.sui-label{font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,#adb2b8);}',
      '.sui-input{box-sizing:border-box;width:100%;border-radius:6px;padding:6px 8px;font-size:12px;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));}',
      '.sui-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#f9fafb);}',
      '.sui-textarea{box-sizing:border-box;width:100%;border-radius:6px;padding:6px 8px;font-size:12px;font-family:var(--ds-font-family-code,ui-monospace,Consolas,monospace);resize:vertical;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));}',
      '.sui-btn{border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));}',
      '.sui-btn:hover{background:var(--dsw-alias-bg-layer-3,#353638);}',
      '.sui-btn:disabled{opacity:0.5;cursor:default;}',
      '.sui-btn-primary{background:var(--dsw-alias-state-business-primary,#679efe);border-color:transparent;color:#fff;}',
      '.sui-btn-primary:hover{background:var(--dsw-alias-button-info-hover,#4176e6);}',
      '.sui-btn-danger{color:#fff;background:var(--dsw-alias-state-error-primary,#ef4444);border-color:transparent;}',
      '.sui-btn-danger:hover{filter:brightness(1.08);}',
      '.sui-toggle{position:relative;width:34px;height:18px;border-radius:999px;cursor:pointer;border:none;background:rgba(128,128,128,0.4);transition:background 0.15s;flex:none;}',
      '.sui-toggle[data-on="true"]{background:#22c55e;}',
      '.sui-toggle::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform 0.15s;}',
      '.sui-toggle[data-on="true"]::after{transform:translateX(16px);}',
      '.sui-card{border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));background:var(--dsw-alias-bg-layer-2,#2c2c2e);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;}',
      '.sui-card-row{flex-direction:row;align-items:center;gap:12px;}',
      '.sui-card-main{flex:1;min-width:0;}',
      '.sui-card-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;}',
      '.sui-card-error{margin-top:4px;font-size:11px;color:#fca5a5;word-break:break-all;}',
      '.sui-status{display:inline-flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}',
      '.sui-badge{font-size:10px;padding:1px 6px;border-radius:999px;white-space:nowrap;background:var(--dsw-alias-bg-layer-3,#353638);color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-badge[data-tone="info"]{color:var(--dsw-alias-state-business-primary,#679efe);background:var(--dsw-alias-state-business-secondary,rgba(103,158,254,0.16));}',
      '.sui-badge[data-tone="success"]{color:var(--dsw-alias-state-success-primary,#4ade80);background:var(--dsw-alias-state-success-secondary,rgba(74,222,128,0.14));}',
      '.sui-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary,#facc15);background:var(--dsw-alias-state-warn-secondary,rgba(250,204,21,0.14));}',
      '.sui-badge[data-tone="error"]{color:var(--dsw-alias-state-error-primary,#f87171);background:var(--dsw-alias-state-error-secondary,rgba(248,113,113,0.14));}',
      '.sui-badge[data-tone="neutral"]{color:var(--dsw-alias-label-secondary,#cfd3d6);background:var(--dsw-alias-bg-layer-3,#353638);}',
      '.sui-badge[data-outline="true"]{background:transparent;border:1px solid currentColor;}',
      '.sui-spinner{display:inline-block;width:14px;height:14px;border:2px solid var(--dsw-alias-label-tertiary,#adb2b8);border-top-color:transparent;border-radius:50%;animation:sui-spin 800ms linear infinite;vertical-align:middle;}',
      '@keyframes sui-spin{to{transform:rotate(360deg);}}',
      '.sui-dialog-backdrop{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,0.5));}',
      '.sui-dialog{display:flex;flex-direction:column;gap:12px;width:min(520px,calc(100vw - 48px));max-height:calc(100vh - 96px);overflow-y:auto;padding:18px;background:var(--dsw-alias-bg-base,#1e1e1f);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.4);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-dialog-head{display:flex;align-items:center;gap:10px;}',
      '.sui-dialog-title{margin:0;flex:1;font-size:15px;font-weight:700;overflow-wrap:anywhere;}',
      '.sui-dialog-body{display:flex;flex-direction:column;gap:12px;overflow-y:auto;}',
      '.sui-dialog-footer{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:4px;}',
      '.sui-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}',
      '.sui-list-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.06));border-radius:8px;flex-wrap:wrap;}',
      '.sui-list-item-meta{font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-columns{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:12px;flex:1;min-height:0;}',
      '.sui-column{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--dsw-alias-bg-layer-2,#2c2c2e);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.06));border-radius:12px;overflow:hidden;}',
      '.sui-tabs{display:flex;align-items:flex-end;gap:22px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));margin-top:2px;}',
      '.sui-tab{position:relative;display:flex;align-items:center;gap:6px;border:0;padding:7px 1px 9px;background:transparent;color:var(--dsw-alias-label-tertiary,#adb2b8);font:inherit;font-size:13px;line-height:20px;cursor:pointer;}',
      '.sui-tab:hover,.sui-tab[data-on="true"]{color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-tab[data-on="true"]::after{position:absolute;right:0;bottom:-1px;left:0;height:2px;border-radius:2px 2px 0 0;background:var(--dsw-alias-label-primary,#f9fafb);content:"";}',
      '.sui-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}',
      '.sui-banner{border-radius:8px;padding:8px 12px;font-size:12px;white-space:pre-wrap;}',
      '.sui-banner-error{border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.12);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-banner-saved{border:1px solid rgba(34,197,94,0.4);background:rgba(34,197,94,0.1);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-banner-warn{border:1px solid rgba(234,179,8,0.4);background:rgba(234,179,8,0.1);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-count{margin:8px 2px 0;font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-empty{color:var(--dsw-alias-label-tertiary,#adb2b8);font-size:13px;padding:16px 0;}',
      '.sui-editor{border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));background:var(--dsw-alias-bg-layer-1,#232324);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px;}',
      '.sui-editor-title{font-size:13px;font-weight:600;}',
      '.sui-test{border-radius:8px;padding:8px 12px;font-size:12px;white-space:pre-wrap;}',
      '.sui-test-ok{border:1px solid rgba(34,197,94,0.4);background:rgba(34,197,94,0.1);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-test-bad{border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.12);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-panel-head{display:flex;align-items:center;gap:8px;}',
      '.sui-panel-title{font-size:14px;font-weight:600;flex:1;}',
      '.sui-panel-desc{font-size:12px;color:var(--dsw-alias-label-secondary,#cfd3d6);margin:0;}',
      '.sui-kit-row{padding:16px 0;}',
      '.sui-kit-head{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;padding:0;cursor:pointer;font:inherit;font-size:14px;line-height:22px;text-align:left;color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-kit-title{flex:1;min-width:0;}',
      '.sui-kit-chevron{flex:none;font-size:12px;color:var(--dsw-alias-label-tertiary,#adb2b8);transition:transform 0.15s;}',
      '.sui-kit-chevron-open{transform:rotate(180deg);}',
      '.sui-kit-list{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));padding-top:8px;}',
      '.sui-kit-item{display:flex;align-items:baseline;gap:8px;font-size:13px;line-height:20px;}',
      '.sui-kit-item-label{color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-kit-item-id{font-size:11px;color:var(--dsw-alias-label-tertiary,#adb2b8);}',
      '.sui-kit-empty{font-size:12px;color:var(--dsw-alias-label-tertiary,#adb2b8);}',
      '.sui-section-title{font-weight:600;margin:10px 0 6px;font-size:13px;color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-card-desc{color:var(--dsw-alias-label-secondary,#cfd3d6);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.sui-card-meta{color:var(--dsw-alias-label-tertiary,#adb2b8);font-size:11px;margin-top:2px;}',
      '.sui-pre{margin:0;max-height:320px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;font-family:var(--ds-font-family-code,ui-monospace,Consolas,monospace);font-size:12px;line-height:1.6;color:var(--dsw-alias-label-primary,#f9fafb);background:var(--dsw-alias-bg-layer-1,#232324);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));border-radius:8px;padding:8px 10px;}',
      '.sui-switch-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-kit-version{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary,#adb2b8);}',
      '.sui-overlay-panel{position:fixed;top:60px;right:calc(16px + var(--dsh-sidebar-width, 0px));width:340px;max-height:min(70vh,640px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary,#f9fafb);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.06));border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.35);pointer-events:auto;z-index:1000;overflow:hidden;}',
      '.sui-overlay-head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.06));}',
      '.sui-overlay-body{padding:10px;overflow-y:auto;flex:1;min-height:0;}',
      '.sui-pill-tabs{display:flex;gap:4px;}',
      '.sui-pill-tab{cursor:pointer;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#cfd3d6);padding:4px 10px;border-radius:6px;font-size:13px;}',
      '.sui-pill-tab-active{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-close-btn{cursor:pointer;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#cfd3d6);font-size:18px;line-height:1;padding:0 4px;}',
      '.sui-close-btn:hover{color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-loading{margin:4px 2px 0;font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-overlay-list{list-style:none;margin:8px 0 0;padding:0;}',
      '.sui-overlay-item{cursor:pointer;border:1px solid transparent;border-radius:8px;padding:8px;margin-bottom:6px;background:var(--dsw-alias-bg-layer-1,#232324);}',
      '.sui-overlay-item:hover{border-color:var(--dsw-alias-border-l2,rgba(255,255,255,0.12));}',
      '.sui-item-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}',
      '.sui-item-kind{font-size:11px;color:var(--dsw-alias-brand-primary,#f9fafb);}',
      '.sui-item-time{font-size:11px;color:var(--dsw-alias-label-secondary,#cfd3d6);}',
      '.sui-item-text{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-primary,#f9fafb);white-space:pre-wrap;word-break:break-word;}',
      '.sui-mark{background:rgba(99,122,241,.28);color:inherit;font-weight:600;border-radius:3px;padding:0 1px;}',
      '.sui-overlay-title{flex:1;min-width:0;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.sui-overlay-drag{cursor:move;user-select:none;}',
      '.sui-overlay-resize{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 50%,var(--dsw-alias-label-tertiary,#adb2b8) 50%);opacity:0.5;}',
      '.sui-overlay-resize:hover{opacity:1;}',
      '.sui-fab{position:fixed;top:42%;left:6px;width:38px;height:38px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,0.12));background:var(--dsw-alias-bg-layer-3,#353638);color:var(--dsw-alias-label-primary,#f9fafb);cursor:pointer;z-index:1000;pointer-events:auto;display:flex;align-items:center;justify-content:center;font-size:17px;opacity:0.85;box-shadow:0 2px 10px rgba(0,0,0,.3);transition:opacity 0.15s;}',
      '.sui-fab:hover{opacity:1;background:var(--dsw-alias-bg-layer-3,#353638);}',
      '.sui-fab-badge{position:absolute;top:-3px;right:-3px;min-width:15px;height:15px;border-radius:999px;background:#22c55e;color:#fff;font-size:10px;line-height:15px;text-align:center;padding:0 3px;font-weight:600;}',
      '.sui-check-row{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary,#f9fafb);cursor:pointer;}',
      '.sui-check{width:14px;height:14px;accent-color:var(--dsw-alias-state-business-primary,#679efe);cursor:pointer;margin:0;}',
      '.sui-check:disabled,.sui-check-row[data-disabled="true"]{cursor:default;}',
      '.sui-toast-host{position:fixed;right:16px;bottom:16px;z-index:1400;display:flex;flex-direction:column;gap:8px;pointer-events:none;}',
      '.sui-toast{border-radius:8px;padding:8px 14px;font-size:12px;max-width:320px;box-shadow:0 6px 24px rgba(0,0,0,.35);border:1px solid rgba(34,197,94,0.4);background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f9fafb);}',
      '.sui-toast-error{border-color:rgba(239,68,68,0.5);}',
      '.sui-toast-warn{border-color:rgba(234,179,8,0.4);}',
    ].join('\n')

    /** Inject the shared stylesheet exactly once (idempotent, fiber-safe). */
    function ensureStyle() {
      if (typeof document === 'undefined') return
      if (document.getElementById(STYLE_ID)) return
      const el = document.createElement('style')
      el.id = STYLE_ID
      el.setAttribute('data-plugin', 'dsh-settings-ui')
      el.textContent = CSS
      document.head.appendChild(el)
    }

    /** React.createElement alias (keeps consumer call sites terse). */
    function h(type, props, ...children) {
      return React.createElement(type, props, ...children)
    }

    // ===== 原子组件 =====

    /** Section heading: title + one-line description. */
    function SectionHeader(props) {
      const { title, desc } = props
      return h('div', { className: 'sui-header' },
        h('h3', {}, title),
        desc ? h('p', { className: 'sui-desc' }, desc) : null,
      )
    }

    /** Label + control + hint column. */
    function Field(props) {
      const { label, hint, children } = props
      return h('div', { className: 'sui-field' },
        h('label', { className: 'sui-label' }, label),
        children,
        hint ? h('div', { className: 'sui-hint' }, hint) : null,
      )
    }

    function TextInput(props) {
      const { value, onChange, placeholder, type, disabled, autoFocus, onKeyDown, min, max } = props
      return h('input', {
        className: 'sui-input',
        type: type ?? 'text',
        value: value ?? '',
        placeholder,
        min,
        max,
        spellCheck: false,
        disabled: disabled === true,
        autoFocus: autoFocus === true,
        onChange: (e) => onChange(e.target.value),
        onKeyDown,
      })
    }

    function TextArea(props) {
      const { value, onChange, placeholder, rows, onKeyDown, disabled } = props
      return h('textarea', {
        className: 'sui-textarea',
        value: value ?? '',
        placeholder,
        rows: rows ?? 4,
        spellCheck: false,
        disabled: disabled === true,
        onChange: (e) => onChange(e.target.value),
        onKeyDown,
      })
    }

    function Select(props) {
      const { value, onChange, children, disabled } = props
      return h('select', {
        className: 'sui-input',
        value: value ?? '',
        disabled: disabled === true,
        onChange: (e) => onChange(e.target.value),
      }, children)
    }

    /** kind: 'primary' | 'secondary' (default) | 'danger'. */
    function Button(props) {
      const { kind, disabled, onClick, children } = props
      return h('button', {
        type: 'button',
        className: 'sui-btn' + (kind ? ' sui-btn-' + kind : ''),
        disabled: disabled === true,
        onClick,
      }, children)
    }

    /** A toggle switch (button element with aria-pressed). */
    function Switch(props) {
      const { checked, onChange, disabled, label, title } = props
      return h('button', {
        type: 'button',
        className: 'sui-toggle',
        'data-on': checked ? 'true' : 'false',
        'aria-pressed': checked === true,
        'aria-label': label,
        title: title ?? label,
        disabled: disabled === true,
        onClick: () => onChange(!checked),
      })
    }

    /** Native checkbox with inline label. */
    function Checkbox(props) {
      const { checked, onChange, disabled, label } = props
      return h('label', {
        className: 'sui-check-row',
        'data-disabled': disabled === true ? 'true' : 'false',
      },
        h('input', {
          type: 'checkbox',
          className: 'sui-check',
          checked: checked === true,
          disabled: disabled === true,
          onChange: (e) => onChange(e.target.checked),
        }),
        label != null ? h('span', {}, label) : null,
      )
    }

    /** Native radio with inline label; onChange receives the value. */
    function Radio(props) {
      const { checked, onChange, disabled, label, name, value } = props
      return h('label', {
        className: 'sui-check-row',
        'data-disabled': disabled === true ? 'true' : 'false',
      },
        h('input', {
          type: 'radio',
          className: 'sui-check',
          name,
          value,
          checked: checked === true,
          disabled: disabled === true,
          onChange: (e) => onChange(e.target.value),
        }),
        label != null ? h('span', {}, label) : null,
      )
    }

    /** Themed card container (layer-2 fill + l2 hairline + 10px radius). */
    function Card(props) {
      const { row, children } = props
      return h('div', { className: 'sui-card' + (row ? ' sui-card-row' : '') }, children)
    }

    /** Colored dot + status text (+ optional extra text). */
    function StatusDot(props) {
      const { color, text, extra } = props
      return h('span', { className: 'sui-status' },
        h('span', { className: 'sui-dot', style: { backgroundColor: color ?? '#9ca3af' } }),
        h('span', {}, text),
        extra ? h('span', {}, extra) : null,
      )
    }

    function Badge(props) {
      const { children, tone, outline } = props
      return h('span', {
        className: 'sui-badge',
        'data-tone': tone ?? 'neutral',
        'data-outline': outline === true ? 'true' : 'false',
      }, children)
    }

    /** Spinning activity indicator (decorative; size via style). */
    function Spinner(props) {
      const { size, style } = props
      return h('span', {
        className: 'sui-spinner',
        'aria-hidden': 'true',
        style: size ? { width: size, height: size, ...(style ?? {}) } : (style ?? {}),
      })
    }

    /** List container (ul) + ListItem (li) for rows of structured content. */
    function List(props) {
      const { children } = props
      return h('ul', { className: 'sui-list' }, children)
    }
    function ListItem(props) {
      const { children, onClick, title } = props
      return h('li', {
        className: 'sui-list-item',
        onClick,
        title,
      }, children)
    }

    /** Underline tab row with WAI-ARIA tabs semantics: role=tablist, tab role
     *  + aria-selected, roving tabindex, Left/Right/Home/End keyboard nav. */
    function Tabs(props) {
      const { items, active, onChange } = props
      const list = items ?? []
      const activeIndex = Math.max(0, list.findIndex((it) => it.id === active))
      const onKeyDown = (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
        e.preventDefault()
        const count = list.length
        if (count === 0) return
        let next = activeIndex
        if (e.key === 'ArrowLeft') next = (activeIndex - 1 + count) % count
        else if (e.key === 'ArrowRight') next = (activeIndex + 1) % count
        else if (e.key === 'Home') next = 0
        else next = count - 1
        if (list[next]) onChange(list[next].id)
      }
      return h('div', { className: 'sui-tabs', role: 'tablist', onKeyDown },
        list.map((it, idx) => {
          const on = active === it.id
          return h('button', {
            key: it.id,
            type: 'button',
            role: 'tab',
            'aria-selected': on ? 'true' : 'false',
            tabIndex: on ? 0 : -1,
            className: 'sui-tab',
            'data-on': on ? 'true' : 'false',
            onClick: () => onChange(it.id),
          },
          it.label,
          it.badge ? h(Badge, null, it.badge) : null,
          )
        }),
      )
    }

    /** kind: 'error' | 'saved' | 'warn'. */
    function Banner(props) {
      const { kind, children } = props
      const cls = kind === 'error' ? 'sui-banner sui-banner-error'
        : kind === 'saved' ? 'sui-banner sui-banner-saved'
        : kind === 'warn' ? 'sui-banner sui-banner-warn'
        : 'sui-banner'
      return h('div', { className: cls, role: kind === 'error' ? 'alert' : undefined }, children)
    }

    /** Empty-state placeholder (the `.sui-empty` class, as an atom). */
    function EmptyState(props) {
      const { text, children } = props
      return h('div', { className: 'sui-empty' }, text != null ? text : children)
    }

    // ===== 一次性通知（toast）=====
    // Zero-dependency bus: `toast(text, opts)` broadcasts to every mounted
    // ToastHost (usually one per plugin root). Each host auto-dismisses.

    const toastListeners = new Set()
    let toastSeq = 0
    const toast = (text, options) => {
      const item = {
        id: ++toastSeq,
        text,
        kind: (options && options.kind) || 'saved',
        ttlMs: options && options.ttlMs != null ? options.ttlMs : 3000,
      }
      for (const l of toastListeners) l(item)
    }

    /** Hook over the toast bus: returns the live toast items of this host. */
    function useToast() {
      const [items, setItems] = React.useState([])
      React.useEffect(() => {
        const timers = new Set()
        const onPush = (item) => {
          setItems((arr) => [...arr, item])
          const timer = setTimeout(() => {
            timers.delete(timer) // D1（0.2.19）：句柄用后即弃，防长会话下 Set 无界增长
            setItems((arr) => arr.filter((x) => x.id !== item.id))
          }, item.ttlMs)
          timers.add(timer)
        }
        toastListeners.add(onPush)
        return () => {
          toastListeners.delete(onPush)
          for (const timer of timers) clearTimeout(timer)
        }
      }, [])
      return items
    }

    /** Fixed bottom-right toast stack. Mount once per plugin root. */
    function ToastHost() {
      const items = useToast()
      return h('div', { className: 'sui-toast-host' },
        items.map((t) => h('div', { key: t.id, className: 'sui-toast' + (t.kind === 'saved' ? '' : ' sui-toast-' + t.kind) }, t.text)),
      )
    }

    /**
     * Modal dialog: backdrop + centered panel with title, body, and footer.
     * props: { open, title, onClose, footer?, children, width? }
     * a11y: role=dialog + aria-modal, initial focus moves inside, Tab/Shift+Tab
     * cycle within the panel, Escape calls onClose, focus restored on unmount.
     * `onClose` also fires when the backdrop is clicked (target === currentTarget).
     * Renders nothing when `open` is false.
     */
    function Dialog(props) {
      const { open, title, onClose, footer, children, width } = props
      const panelRef = React.useRef(null)
      React.useEffect(() => {
        if (open !== true || typeof document === 'undefined') return
        const panel = panelRef.current
        const prevActive = document.activeElement
        const focusables = () => (panel ? Array.from(panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )).filter((el) => !el.disabled) : [])
        if (panel) (focusables()[0] ?? panel).focus()
        const onKeyDown = (e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            if (onClose) onClose()
            return
          }
          if (e.key !== 'Tab') return
          const els = focusables()
          if (els.length === 0) { e.preventDefault(); return }
          const first = els[0]
          const last = els[els.length - 1]
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          document.removeEventListener('keydown', onKeyDown, true)
          if (prevActive && typeof prevActive.focus === 'function') prevActive.focus()
        }
      }, [open, onClose])
      if (open !== true) return null
      return h('div', {
        className: 'sui-dialog-backdrop',
        onMouseDown: (e) => { if (e.target === e.currentTarget && onClose) onClose() },
      },
        h('div', {
          className: 'sui-dialog',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title,
          ref: panelRef,
          tabIndex: -1,
          style: width ? { width: width } : undefined,
        },
          h('div', { className: 'sui-dialog-head' },
            h('h2', { className: 'sui-dialog-title' }, title),
            onClose ? h(Button, {
              kind: 'secondary',
              onClick: onClose,
              title: 'close',
            }, '×') : null,
          ),
          h('div', { className: 'sui-dialog-body' }, children),
          footer ? h('div', { className: 'sui-dialog-footer' }, footer) : null,
        ),
      )
    }

    /**
     * Error boundary: a crash inside `children` renders an error banner
     * (or the `fallback(error)` render prop) instead of blanking the page.
     * Wrap each panel body; keep panel chrome / handles OUTSIDE the boundary
     * (GUIDE §5-8). props: { title?, fallback?, onError?, children }
     */
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error, info) {
        // B（0.2.19）：默认把堆栈打到 console——React 原生行为被重写后曾丢失，
        // 渲染错误只剩 UI 一行文案，排障需全程复盘。onError 回调仍可用。
        try {
          console.error('[dsh-settings-ui] render error:', error,
            info && info.componentStack ? info.componentStack : '')
        } catch {}
        if (this.props.onError) this.props.onError(error, info)
      }

      render() {
        if (this.state.error == null) return this.props.children
        if (this.props.fallback) return this.props.fallback(this.state.error)
        return h('div', { className: 'sui-banner sui-banner-error' },
          h('div', {}, this.props.title ?? '界面渲染出错'),
          h('div', { className: 'sui-hint' }, String((this.state.error && this.state.error.message) || this.state.error)),
        )
      }
    }

    // ===== 声明式行渲染 =====

    /**
     * Render a list of field descriptors against a values object.
     * field: { key, type?, label, hint?, placeholder?, options?, rows?, min?, max?, disabled? }
     * type: 'switch' | 'text' (default) | 'number' | 'textarea' | 'select'
     */
    function Rows(props) {
      const { fields, values, onChange } = props
      const valOf = (key) => (values && typeof values === 'object') ? values[key] : undefined
      return h(React.Fragment, null,
        (fields ?? []).map((f) => {
          const val = valOf(f.key)
          const type = f.type ?? 'text'
          if (type === 'switch') {
            return h(Field, { key: f.key, label: f.label, hint: f.hint },
              h(Switch, { checked: val === true, onChange: (next) => onChange(f.key, next), label: f.label, disabled: f.disabled }),
            )
          }
          if (type === 'checkbox') {
            return h(Field, { key: f.key, label: f.label, hint: f.hint },
              h(Checkbox, { checked: val === true, onChange: (next) => onChange(f.key, next), disabled: f.disabled }),
            )
          }
          if (type === 'textarea') {
            return h(Field, { key: f.key, label: f.label, hint: f.hint },
              h(TextArea, { value: val, onChange: (v) => onChange(f.key, v), placeholder: f.placeholder, rows: f.rows, disabled: f.disabled }),
            )
          }
          if (type === 'select') {
            return h(Field, { key: f.key, label: f.label, hint: f.hint },
              h(Select, { value: val, onChange: (v) => onChange(f.key, v), disabled: f.disabled },
                (f.options ?? []).map((o) => h('option', { key: o.value, value: o.value }, o.label)),
              ),
            )
          }
          return h(Field, { key: f.key, label: f.label, hint: f.hint },
            h(TextInput, { type: type === 'number' ? 'number' : 'text', value: val, onChange: (v) => onChange(f.key, v), placeholder: f.placeholder, min: f.min, max: f.max, disabled: f.disabled }),
          )
        }),
      )
    }

    // ===== 设置 store（加载/保存/busy/error/saved/revision）=====

    /**
     * A minimal settings store over a plugin's read/write API.
     * api: { get: () => Promise<doc>, update: (payload) => Promise<result> }
     * options: { savedTtlMs?: number } — auto-clear time for the `saved`
     * flash (default 3000ms).
     * The store keeps { doc, revision, busy, error, saved, loaded, dirty } and
     * exposes refresh()/commit(payload)/run(fn) + a raw subscribe for React.
     * `dirty` flips true on any doc write via set({doc}) (consumer form edits)
     * and false after refresh() / a successful commit()/run().
     */
    function createSettingsStore(api, options) {
      const savedTtlMs = options && options.savedTtlMs != null ? options.savedTtlMs : 3000
      let state = { doc: null, revision: undefined, busy: false, error: '', saved: false, loaded: false, dirty: false }
      const listeners = new Set()
      let savedTimer = null
      const notify = () => { for (const l of listeners) l() }
      const set = (patch) => {
        state = { ...state, ...patch }
        // Doc writes without an explicit `dirty` verdict mark the form as
        // edited (consumers edit via set({doc: ...})); refresh() clears it.
        if ('doc' in patch && !('dirty' in patch)) state = { ...state, dirty: true }
        notify()
      }

      /** Flash the "saved" banner, auto-cleared after savedTtlMs. */
      const flashSaved = () => {
        if (savedTimer) clearTimeout(savedTimer)
        set({ saved: true })
        savedTimer = setTimeout(() => set({ saved: false }), savedTtlMs)
      }

      async function refresh() {
        try {
          const data = await api.get()
          set({ doc: data, revision: data && typeof data === 'object' ? data.revision : undefined, error: '', loaded: true, dirty: false })
        } catch (err) {
          set({ error: err && err.message ? err.message : String(err), loaded: true })
        }
      }

      /** Write with the busy/saved/error dance, then refresh. Resolves the
       *  update() result (true when it resolves undefined), false on failure. */
      async function commit(payload) {
        set({ busy: true, error: '', saved: false })
        try {
          const result = await api.update(payload)
          await refresh()
          flashSaved()
          return result === undefined ? true : result
        } catch (err) {
          if (err && err.code === 'settings-conflict') await refresh()
          set({ error: err && err.message ? err.message : String(err) })
          return false
        } finally {
          set({ busy: false })
        }
      }

      /** Run an arbitrary action with the busy/error dance, then refresh.
       *  Resolves the action's result (true when it resolves undefined). */
      async function run(fn) {
        set({ busy: true, error: '', saved: false })
        try {
          const result = await fn()
          await refresh()
          return result === undefined ? true : result
        } catch (err) {
          if (err && err.code === 'settings-conflict') await refresh()
          set({ error: err && err.message ? err.message : String(err) })
          return false
        } finally {
          set({ busy: false })
        }
      }

      return {
        get: () => state,
        set,
        subscribe: (l) => { listeners.add(l); return () => { listeners.delete(l) } },
        refresh,
        commit,
        run,
      }
    }

    /** React hook over a createSettingsStore handle (reactive snapshot). */
    function useSettings(store) {
      const [state, setState] = React.useState(() => store.get())
      React.useEffect(() => store.subscribe(() => setState(store.get())), [store])
      return state
    }

    // ===== 浮层（shell.overlay）面板 =====

    // Overlay stack counter (factory scope — Panel reads it at drag time):
    // every panel press raises it one step so the pressed panel tops its
    // siblings.
    let zCounter = 1000
    const zNext = () => ++zCounter

    /**
     * Panel store: open / minimized / drag position / size / z-index, with
     * optional localStorage persistence (position + minimized + size survive
     * reloads). options: { persist?: string, initiallyOpen?: boolean }
     */
    function createPanelStore(options) {
      const key = options && typeof options.persist === 'string' ? options.persist : null
      let saved = { pos: null, anchor: null, minimized: false, size: null }
      if (key && typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(key)
          if (raw) saved = JSON.parse(raw)
        } catch (err) {
          // D3（0.2.19）：损坏的持久化状态不再纯静默——warn 留痕，恢复逻辑照旧跳过
          try { console.warn('[dsh-settings-ui] 恢复面板持久化状态失败: ' + String(err)) } catch {}
        }
      }
      let state = {
        open: options && options.initiallyOpen === true,
        minimized: saved.minimized === true,
        pos: saved.pos && Number.isFinite(saved.pos.x) && Number.isFinite(saved.pos.y) ? saved.pos : null,
        // Anchor mode: the panel docks beside a draggable handle at this
        // viewport center point (set by the consumer's FAB drag).
        anchor: saved.anchor && Number.isFinite(saved.anchor.x) && Number.isFinite(saved.anchor.y) ? saved.anchor : null,
        size: saved.size && Number.isFinite(saved.size.w) && Number.isFinite(saved.size.h) ? saved.size : null,
        z: 1000,
      }
      const listeners = new Set()
      const persist = () => {
        if (!key || typeof localStorage === 'undefined') return
        try {
          localStorage.setItem(key, JSON.stringify({ pos: state.pos, anchor: state.anchor, minimized: state.minimized, size: state.size }))
        } catch (err) {
          // D3（0.2.19）：写入失败（隐私模式/配额）不再纯静默
          try { console.warn('[dsh-settings-ui] 面板状态持久化失败: ' + String(err)) } catch {}
        }
      }
      const notify = () => { for (const l of listeners) l() }
      const set = (patch) => {
        state = { ...state, ...patch }
        if ('pos' in patch || 'anchor' in patch || 'minimized' in patch || 'size' in patch) persist()
        notify()
      }

      // D2（0.2.19）：跨标签页同步——壳窗口 + 浏览器打开 = 同 origin 两页共享
      // localStorage；其它页写入时合并持久化字段（不覆盖 open/z），
      // 合并写回同值不触发本页 storage 事件 → 无循环。
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
      const onStorage = (e) => {
        if (!key || e.key !== key || !e.newValue) return
        let remote
        try { remote = JSON.parse(e.newValue) } catch { return }
        if (!remote || typeof remote !== 'object') return
        const next = {}
        if (remote.pos && Number.isFinite(remote.pos.x) && Number.isFinite(remote.pos.y) && !same(remote.pos, state.pos)) next.pos = remote.pos
        if (remote.anchor && Number.isFinite(remote.anchor.x) && Number.isFinite(remote.anchor.y) && !same(remote.anchor, state.anchor)) next.anchor = remote.anchor
        if (typeof remote.minimized === 'boolean' && remote.minimized !== state.minimized) next.minimized = remote.minimized
        if (remote.size && Number.isFinite(remote.size.w) && Number.isFinite(remote.size.h) && !same(remote.size, state.size)) next.size = remote.size
        if (Object.keys(next).length) set(next)
      }
      if (key && typeof window !== 'undefined') window.addEventListener('storage', onStorage)

      return {
        get: () => state,
        set,
        subscribe: (l) => { listeners.add(l); return () => { listeners.delete(l) } },
        open: () => set({ open: true }),
        close: () => set({ open: false }),
        toggle: () => set({ open: !state.open }),
        toggleMinimized: () => set({ minimized: !state.minimized }),
        move: (pos) => set({ pos }),
        /** Move the dock anchor (anchor mode; viewport center point). */
        setAnchor: (anchor) => set({ anchor }),
        /** Set the custom panel size (drag the bottom-right handle). */
        resize: (size) => set({ size }),
        /** Raise this panel to the top of the overlay stack (transient). */
        setZ: (z) => { state = { ...state, z }; notify() },
        /** D2（0.2.19）：卸载时移除跨标签监听（由创建方管理生命周期；幂等）。 */
        dispose: () => { if (key && typeof window !== 'undefined') window.removeEventListener('storage', onStorage) },
      }
    }

    /** React hook over a createPanelStore handle (reactive snapshot). */
    function usePanel(store) {
      const [state, setState] = React.useState(() => store.get())
      React.useEffect(() => store.subscribe(() => setState(store.get())), [store])
      return state
    }

    /**
     * Floating panel chrome over `.sui-overlay-panel`: title bar with
     * drag-to-move, minimize, close, and a bottom-right resize handle; click
     * raises the panel above its siblings. props: { title, panel, onClose?,
     * style?, children }
     * Anchor mode: when panel.anchor is set the panel docks to the right of
     * that viewport point (e.g. beside a dragged FAB) and the title-bar drag
     * moves the anchor itself. A window resize re-clamps pos/anchor so the
     * panel can never get lost off-screen.
     */
    function Panel(props) {
      const { title, panel, onClose, style, children } = props
      const s = usePanel(panel)
      const clampAnchor = (p, vw = 1200, vh = 800) => ({
        x: Math.min(Math.max(24, p.x), vw - 380),
        y: Math.min(Math.max(24, p.y), vh - 48),
      })
      const clampPos = (p, vw = 1200, vh = 800) => ({
        x: Math.min(Math.max(-(vw - 80), p.x), vw - 80),
        y: Math.min(Math.max(-40, p.y), vh - 80),
      })
      // Window-resize guard: keep the panel on-screen (pos/anchor re-clamped).
      React.useEffect(() => {
        if (!s.open || typeof window === 'undefined') return
        const onWin = () => {
          const st = panel.get()
          if (st.pos) panel.move(clampPos(st.pos, window.innerWidth, window.innerHeight))
          if (st.anchor) panel.setAnchor(clampAnchor(st.anchor, window.innerWidth, window.innerHeight))
        }
        window.addEventListener('resize', onWin)
        return () => window.removeEventListener('resize', onWin)
      }, [panel, s.open])
      if (!s.open) return null
      const anchored = s.anchor && typeof s.anchor.x === 'number'
      const onHeadPointerDown = (e) => {
        if (e.button !== 0) return
        panel.setZ(zNext())
        const startX = e.clientX
        const startY = e.clientY
        const base = anchored ? s.anchor : (s.pos ?? { x: 0, y: 0 })
        const move = (ev) => {
          const next = { x: base.x + (ev.clientX - startX), y: base.y + (ev.clientY - startY) }
          if (anchored) panel.setAnchor(clampAnchor(next))
          else panel.move(next)
        }
        const up = () => {
          document.removeEventListener('pointermove', move)
          document.removeEventListener('pointerup', up)
        }
        document.addEventListener('pointermove', move)
        document.addEventListener('pointerup', up)
      }
      const onResizePointerDown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        panel.setZ(zNext())
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800
        const base = s.size ?? { w: 340, h: Math.min(Math.round(vh * 0.7), 640) }
        const move = (ev) => {
          const w = Math.min(Math.max(280, base.w + (ev.clientX - e.clientX)), Math.min(720, vw - 32))
          const h = Math.min(Math.max(200, base.h + (ev.clientY - e.clientY)), Math.min(vh - 32, 900))
          panel.resize({ w: Math.round(w), h: Math.round(h) })
        }
        const up = () => {
          document.removeEventListener('pointermove', move)
          document.removeEventListener('pointerup', up)
        }
        document.addEventListener('pointermove', move)
        document.addEventListener('pointerup', up)
      }
      let posStyle
      if (anchored) {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800
        const panelW = s.size ? s.size.w : 340
        const top = Math.max(8, Math.min(s.anchor.y - 24, vh - 560))
        // 面板默认靠把手右侧弹出；右侧放不下时翻转到把手左侧，避免越界/盖住把手（右留 16px）。
        let left = s.anchor.x + 40
        if (left + panelW > vw - 16) left = s.anchor.x - 40 - panelW
        left = Math.max(8, left)
        posStyle = { left: `${left}px`, top: `${top}px`, right: 'auto' }
      } else if (s.pos) {
        posStyle = { transform: `translate(${s.pos.x}px, ${s.pos.y}px)` }
      }
      const sizeStyle = s.size ? { width: `${s.size.w}px`, height: `${s.size.h}px`, maxHeight: 'none' } : {}
      return h('div', {
        className: 'sui-overlay-panel',
        role: 'dialog',
        style: { ...(posStyle ?? {}), ...sizeStyle, zIndex: s.z, ...(style ?? {}) },
      },
        h('div', { className: 'sui-overlay-head sui-overlay-drag', onPointerDown: onHeadPointerDown },
          h('span', { className: 'sui-overlay-title' }, title),
          h('button', {
            type: 'button',
            className: 'sui-close-btn',
            title: s.minimized ? '展开' : '最小化',
            onClick: () => panel.toggleMinimized(),
          }, s.minimized ? '▢' : '—'),
          h('button', {
            type: 'button',
            className: 'sui-close-btn',
            title: '关闭',
            onClick: () => { if (onClose) onClose(); panel.close() },
          }, '×'),
        ),
        s.minimized ? null : h('div', { className: 'sui-overlay-body' }, children),
        s.minimized ? null : h('div', {
          className: 'sui-overlay-resize',
          title: '拖拽调整大小',
          onPointerDown: onResizePointerDown,
        }),
      )
    }

    // ===== 通用设置统计卡（kit 自动注册）=====

    /**
     * One card in the General settings section showing how many sections are
     * currently registered through this kit; expanding it lists their nav
     * labels and ids. Reads the live `settings.section` ledger (filtered by
     * the `registrant: 'dsh-settings-ui'` marker that section() sets — the
     * ledger keeps only whitelisted option fields, but `registrant` is one of
     * them), so the count follows registrations and unregistrations with no
     * registry of its own.
     */
    function KitPluginsCard(slots) {
      let version = -1
      let cached = []
      const getSnapshot = () => {
        const v = slots.getVersion('settings.section') + slots.getVersion('shell.overlay')
        if (v !== version) {
          version = v
          const sections = slots.entries('settings.section')
            .filter((e) => e.registrant === 'dsh-settings-ui')
            .map((e) => ({ kind: 'section', id: e.options.id ?? '', label: e.options.label ?? '' }))
          const overlays = slots.entries('shell.overlay')
            .filter((e) => e.registrant === 'dsh-settings-ui')
            .map((e) => ({ kind: 'overlay', id: e.options.id ?? '', label: e.options.label ?? '' }))
          cached = [...sections, ...overlays]
        }
        return cached
      }
      const subscribe = (listener) => {
        const u1 = slots.subscribe('settings.section', listener)
        const u2 = slots.subscribe('shell.overlay', listener)
        return () => { u1(); u2() }
      }
      return function KitPluginsCardComponent(props) {
        const entries = React.useSyncExternalStore(subscribe, getSnapshot)
        const [open, setOpen] = React.useState(false)
        const t = props.t
        const title = t ? t('kitTitle') : '通过 Kit 接入设置页 UI 的插件'
        const emptyText = t ? t('kitEmpty') : '暂无通过 Kit 接入的配置界面'
        const prefix = t ? t('overlayPrefix') : '浮层 '
        return h('div', { className: 'sui-kit-row' },
          h('div', { className: 'sui-card' },
            h('button', {
              type: 'button',
              className: 'sui-kit-head',
              'aria-expanded': open,
              onClick: () => setOpen((v) => !v),
            },
              h('span', { className: 'sui-kit-title' }, title),
              h('span', { className: 'sui-badge' }, `${entries.length} 个`),
              h('span', { className: 'sui-kit-version' }, `v${KIT_VERSION}`),
              h('span', { className: 'sui-kit-chevron' + (open ? ' sui-kit-chevron-open' : '') }, '▾'),
            ),
            open
              ? h('div', { className: 'sui-kit-list' },
                  entries.length === 0
                    ? h('div', { className: 'sui-kit-empty' }, emptyText)
                    : entries.map((e) => h('div', { key: e.kind + ':' + e.id, className: 'sui-kit-item' },
                        h('span', { className: 'sui-kit-item-label' }, typeof e.label === 'function' ? e.label() : (e.label || e.id)),
                        h('span', { className: 'sui-kit-item-id' }, `${e.kind === 'overlay' ? prefix : ''}${e.id}`),
                      )),
                )
              : null,
          ),
        )
      }
    }

    // ===== 插件 =====

    const plugin = {
      name: 'dsh-settings-ui',
      inject: ['slots', 'locale'],
      apply(ctx) {
        ensureStyle()

        const service = {
          h,
          SectionHeader,
          Field,
          TextInput,
          TextArea,
          Select,
          Button,
          Switch,
          Checkbox,
          Radio,
          Card,
          StatusDot,
          Badge,
          Tabs,
          Banner,
          EmptyState,
          toast,
          ToastHost,
          useToast,
          Dialog,
          Spinner,
          List,
          ListItem,
          ErrorBoundary,
          Rows,
          createSettingsStore,
          useSettings,
          Panel,
          createPanelStore,
          usePanel,

          /**
           * Register a floating surface on the frame-wide `shell.overlay`
           * slot (above every column, click-through by default — the panel
           * class opts back into pointer events).
           * config: { id, order?, label?, render, inject?, locale? }
           * render receives the composed slot props; combine with `Panel` +
           * `createPanelStore` for chrome (drag/minimize/close/z-order).
           */
          overlay(config) {
            return ctx.slots.inject('shell.overlay', () => ctx.slots.register(
              {
                name: 'shell.overlay',
                id: config.id,
                ...(config.order !== undefined ? { order: config.order } : {}),
                ...(config.label !== undefined ? { label: config.label } : {}),
                registrant: 'dsh-settings-ui',
                ...(config.locale ? { locale: config.locale } : {}),
                ...(config.inject ? { inject: config.inject } : {}),
              },
              // C（0.2.19）：自动包一层错误边界——消费方忘记包 ErrorBoundary 时，
              // 渲染错误不直达官方 slot（白屏/整页崩），只塌陷为当前浮层错误横幅
              (props) => h(ErrorBoundary, { title: '该浮层渲染出错' },
                config.render ? React.createElement(config.render, props) : null,
              ),
            ))
          },

          /**
           * Register a settings section with the unified root + shared CSS.
           * config: { id, order, label, inject?, render, locale? }
           * render is a React component receiving the composed slot props
           * (runtime share + the injected face); hooks work inside it.
           * `locale` (a dictionary namespace id) is forwarded to the slot
           * registration so the framework synthesizes the `t` seat on the
           * component props. The `registrant: 'dsh-settings-ui'` marker (an
           * explicit value, so the runtime keeps it instead of stamping the
           * caller's fiber name) feeds the kit's General-settings count card
           * (KitPluginsCard).
           */
          section(config) {
            return ctx.slots.inject('settings.section', () => ctx.slots.register(
              {
                name: 'settings.section',
                id: config.id,
                order: config.order,
                label: config.label,
                registrant: 'dsh-settings-ui',
                ...(config.locale ? { locale: config.locale } : {}),
                ...(config.inject ? { inject: config.inject } : {}),
              },
              // C（0.2.19）：su-root 内自动包一层错误边界——消费方忘记包时，
              // 渲染错误只塌陷为当前卡片错误横幅，不影响设置页其它 section
              (props) => h('div', { className: 'sui-root' },
                h(ErrorBoundary, { title: '该设置页渲染出错' },
                  config.render ? React.createElement(config.render, props) : null,
                ),
              ),
            ))
          },
        }

        ctx.provide('settingsUi', service)

        // 统计卡文案跟随官方 locale 服务（字典注册对第三方开放：
        // locale.register(ns, { zh, en })；installLocale 席位被官方
        // locale 插件独占，故只注册命名空间、不装 face）。locale 服务
        // 缺席时静默退回组件内置中文。
        try {
          if (ctx.locale && typeof ctx.locale.register === 'function') {
            ctx.locale.register('dsh-settings-ui', {
              zh: {
                kitTitle: '通过 Kit 接入设置页 UI 的插件',
                kitEmpty: '暂无通过 Kit 接入的配置界面',
                overlayPrefix: '浮层 ',
              },
              en: {
                kitTitle: 'Plugins using the Kit settings UI',
                kitEmpty: 'No Kit-based settings pages',
                overlayPrefix: 'overlay ',
              },
            })
          }
        } catch (err) {
          // D3（0.2.19）：字典已注册或 locale 服务异常不再是纯静默——warn 留痕
          try { console.warn('[dsh-settings-ui] locale 字典注册失败（统计卡回退内置中文）: ' + String(err)) } catch {}
        }

        // 通用设置统计卡：显示通过 kit 接入的插件数量，点击展开查看插件名。
        ctx.slots.inject('settings.general.item', () => ctx.slots.register(
          {
            name: 'settings.general.item',
            id: 'settings-ui-kit-plugins',
            order: 100,
            locale: 'dsh-settings-ui',
          },
          KitPluginsCard(ctx.slots),
        ))
      },
    }

    return plugin
  },
})
