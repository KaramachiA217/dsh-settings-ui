/**
 * dsh-settings-ui minimal unit tests (Node built-in test runner, zero deps).
 *
 * Loads lib/client.js in a browser-like sandbox (window.__ModuleLoader__),
 * stubs the slots service, and exercises the pure-logic surface:
 *   - KIT_VERSION / package.json sync guard
 *   - service surface completeness
 *   - section() / overlay() registration contracts (registrant marker,
 *     .sui-root wrapper, inject composition)
 *   - the General-settings stats-card registration
 *   - createSettingsStore (refresh/commit/run/conflict/busy/saved/subscribe)
 *   - createPanelStore (open/minimize/z/pos/anchor + localStorage persist)
 *   - Rows field-type rendering and onChange wiring
 *   - Banner/Dialog basics
 *
 * Component rendering paths (Panel drag, Dialog focus, hooks) need a real
 * React renderer and stay covered by the two-stage shell verification
 * (see HANDOFF §6). Run with: node --test test/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const src = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
// Real renderer for markup-level assertions (hooks work in SSR; useEffect
// does not run, so focus-trap behavior stays covered by shell verification).
const { renderToString } = createRequire(import.meta.url)('react-dom/server')

// ---------------------------------------------------------------------------
// Loaders / fakes
// ---------------------------------------------------------------------------

function loadBundle() {
  let spec = null
  // 事件桩：bundle 内 `window` 是传入的 win 对象（非全局），必须自带
  // add/removeEventListener——createPanelStore 0.2.19 起会挂 storage 监听。
  const handlers = new Map()
  const win = {
    __ModuleLoader__: { load: (s) => { spec = s } },
    addEventListener: (type, fn) => {
      const arr = handlers.get(type) || []
      arr.push(fn)
      handlers.set(type, arr)
    },
    removeEventListener: (type, fn) => {
      const arr = handlers.get(type) || []
      handlers.set(type, arr.filter((f) => f !== fn))
    },
  }
  // The bundle is a classic browser script (no imports/exports); evaluate it
  // in a sandbox with only `window` and `document` provided.
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', src)(win, undefined)
  assert.ok(spec, 'bundle did not call window.__ModuleLoader__.load')
  const requireStub = (name) => {
    if (name === 'react') return createRequire(import.meta.url)('react')
    throw new Error('unexpected require: ' + name)
  }
  return { plugin: spec.factory(requireStub), handlers }
}

function makeFakeSlots() {
  const entries = []
  let version = 0
  const listeners = new Set()
  return {
    register(opts, render) {
      const entry = {
        options: opts,
        // Emulate the real slots runtime: compose the declared `inject` face
        // into the props handed to the slot render function.
        render: (props) => render({ ...(opts.inject ? opts.inject() : {}), ...(props ?? {}) }),
      }
      entries.push(entry)
      version++
      return entry
    },
    inject(_key, cb) {
      // Real slots.inject defers until the slot exists; tests fire
      // immediately so registrations land in `entries`.
      cb()
      return cb
    },
    entries: () => entries,
    getVersion: () => version,
    subscribe(_key, listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function makeService() {
  const slots = makeFakeSlots()
  let provided = null
  // Official locale service face (dictionary registration is third-party
  // open; installLocale is boot-once and owned by the official plugin).
  const registeredDicts = []
  const locale = { register: (ns, dicts) => { registeredDicts.push({ ns, dicts }) } }
  const loaded = loadBundle()
  const ctx = { provide: (key, value) => { provided = { key, value } }, slots, locale }
  loaded.plugin.apply(ctx)
  assert.equal(provided?.key, 'settingsUi', 'apply must provide settingsUi')
  return { service: provided.value, slots, registeredDicts, winHandlers: loaded.handlers }
}

function makeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

/** Collect every element in a pre-render React tree (elements are plain objects). */
function collect(node, out = []) {
  if (node == null || typeof node !== 'object') return out
  out.push(node)
  const children = node.props?.children
  if (Array.isArray(children)) {
    for (const c of children) collect(c, out)
  } else if (children != null) {
    collect(children, out)
  }
  return out
}

// ---------------------------------------------------------------------------
// 1. Version sync guard
// ---------------------------------------------------------------------------

test('KIT_VERSION matches package.json version', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const m = src.match(/const KIT_VERSION = '([^']+)'/)
  assert.ok(m, 'KIT_VERSION constant not found in lib/client.js')
  assert.equal(m[1], pkg.version, 'lib/client.js KIT_VERSION and package.json version drifted')
})

// ---------------------------------------------------------------------------
// 2. Service surface
// ---------------------------------------------------------------------------

test('service exposes the documented surface', () => {
  const { service } = makeService()
  const names = [
    'h', 'SectionHeader', 'Field', 'TextInput', 'TextArea', 'Select', 'Button',
    'Switch', 'Card', 'StatusDot', 'Badge', 'Spinner', 'List', 'ListItem',
    'Tabs', 'Banner', 'EmptyState', 'toast', 'ToastHost', 'useToast', 'Dialog', 'ErrorBoundary', 'Rows', 'createSettingsStore', 'useSettings',
    'Panel', 'createPanelStore', 'usePanel', 'section', 'overlay',
  ]
  for (const n of names) assert.ok(service[n], `service.${n} missing`)
})

// ---------------------------------------------------------------------------
// 3. Registration contracts
// ---------------------------------------------------------------------------

test('section() registers with registrant marker and .sui-root wrapper', () => {
  const { service, slots } = makeService()
  const api = { get: async () => ({}), update: async () => ({}) }
  const MyComp = function MyComp() { return null }
  service.section({
    id: 'demo', order: 300, label: () => '演示',
    inject: () => ({ api }),
    render: MyComp,
  })
  const entries = slots.entries().filter((e) => e.options.name === 'settings.section')
  assert.equal(entries.length, 1)
  const opts = entries[0].options
  assert.equal(opts.registrant, 'dsh-settings-ui')
  assert.equal(opts.id, 'demo')
  assert.equal(opts.order, 300)
  assert.equal(typeof opts.label, 'function')

  const el = entries[0].render({ fromSlot: 1 })
  assert.equal(el.type, 'div')
  assert.equal(el.props.className, 'sui-root')
  const boundary = el.props.children
  assert.equal(boundary.type, service.ErrorBoundary, 'section auto-wraps ErrorBoundary since 0.2.19')
  const inner = boundary.props.children
  assert.equal(inner.type, MyComp)
  assert.equal(inner.props.fromSlot, 1)
  assert.equal(inner.props.api, api, 'inject face must be composed into render props')
})

test('overlay() registers on shell.overlay with registrant marker', () => {
  const { service, slots } = makeService()
  const MyPanel = function MyPanel() { return null }
  service.overlay({
    id: 'ov1', order: 100, label: 'Ov',
    inject: () => ({ face: 42 }),
    render: MyPanel,
  })
  const e = slots.entries().find((x) => x.options.name === 'shell.overlay')
  assert.ok(e, 'overlay entry registered')
  assert.equal(e.options.id, 'ov1')
  assert.equal(e.options.order, 100)
  assert.equal(e.options.registrant, 'dsh-settings-ui')
  const el = e.render({ composed: true })
  assert.equal(el.type, service.ErrorBoundary, 'overlay auto-wraps ErrorBoundary since 0.2.19')
  const inner = el.props.children
  assert.equal(inner.type, MyPanel)
  assert.equal(inner.props.composed, true)
  assert.equal(inner.props.face, 42)
})

test('apply registers the General-settings kit stats card', () => {
  const { slots, registeredDicts } = makeService()
  const e = slots.entries().find((x) => x.options.name === 'settings.general.item')
  assert.ok(e, 'stats card registered')
  assert.equal(e.options.id, 'settings-ui-kit-plugins')
  assert.equal(e.options.locale, 'dsh-settings-ui', 'card declares its locale namespace')
  assert.equal(typeof e.render, 'function')
  // Dictionary registered through the official locale service contract.
  assert.equal(registeredDicts.length, 1)
  assert.equal(registeredDicts[0].ns, 'dsh-settings-ui')
  assert.ok(registeredDicts[0].dicts.zh?.kitTitle, 'zh dictionary has kitTitle')
  assert.ok(registeredDicts[0].dicts.en?.kitTitle, 'en dictionary has kitTitle')
})

// ---------------------------------------------------------------------------
// 4. createSettingsStore
// ---------------------------------------------------------------------------

test('refresh loads doc and extracts revision', async () => {
  const { service } = makeService()
  let calls = 0
  const store = service.createSettingsStore({
    get: async () => { calls++; return { revision: 7, enabled: true } },
  })
  assert.equal(store.get().loaded, false)
  await store.refresh()
  assert.equal(calls, 1)
  const s = store.get()
  assert.equal(s.loaded, true)
  assert.equal(s.revision, 7)
  assert.equal(s.doc.enabled, true)
  assert.equal(s.error, '')
})

test('refresh failure sets error', async () => {
  const { service } = makeService()
  const store = service.createSettingsStore({
    get: async () => { throw new Error('boom') },
  })
  await store.refresh()
  assert.equal(store.get().error, 'boom')
  assert.equal(store.get().loaded, true)
})

test('commit: busy during update, update payload, refresh, saved', async () => {
  const { service } = makeService()
  let busySeen = false
  const payloads = []
  const store = service.createSettingsStore({
    get: async () => ({ revision: 1 }),
    update: async (p) => {
      busySeen = store.get().busy
      payloads.push(p)
    },
  }, { savedTtlMs: 150 })
  const ok = await store.commit({ enabled: false })
  assert.equal(ok, true)
  assert.ok(busySeen, 'busy must be true while update is in flight')
  assert.deepEqual(payloads, [{ enabled: false }])
  const s = store.get()
  assert.equal(s.saved, true)
  assert.equal(s.busy, false)
  assert.equal(s.error, '')
})

test('commit failure returns false and reports error', async () => {
  const { service } = makeService()
  const store = service.createSettingsStore({
    get: async () => ({ revision: 1 }),
    update: async () => { throw new Error('nope') },
  })
  const ok = await store.commit({})
  assert.equal(ok, false)
  assert.equal(store.get().error, 'nope')
  assert.equal(store.get().saved, false)
})

test('settings-conflict reloads then reports error', async () => {
  const { service } = makeService()
  let gets = 0
  const store = service.createSettingsStore({
    get: async () => { gets++; return { revision: 'reloaded' } },
    update: async () => {
      const e = new Error('conflict')
      e.code = 'settings-conflict'
      throw e
    },
  })
  const ok = await store.commit({})
  assert.equal(ok, false)
  // commit() does not load first: the only get() call must be the
  // conflict-triggered reload.
  assert.equal(gets, 1, 'conflict must trigger exactly one reload refresh')
  assert.equal(store.get().revision, 'reloaded', 'reload refresh must land the new doc')
  assert.equal(store.get().error, 'conflict')
})

test('run wraps an action and refreshes after success', async () => {
  const { service } = makeService()
  let gets = 0
  let ran = false
  const store = service.createSettingsStore({
    get: async () => { gets++; return { revision: 1 } },
  })
  const ok = await store.run(async () => { ran = true })
  assert.equal(ok, true)
  assert.equal(ran, true)
  assert.equal(gets, 1)
  assert.equal(store.get().busy, false)
})

test('set/subscribe notifications and unsubscribe', () => {
  const { service } = makeService()
  const store = service.createSettingsStore({ get: async () => ({}) })
  let n = 0
  const unsub = store.subscribe(() => n++)
  store.set({ busy: true })
  assert.equal(n, 1)
  assert.equal(store.get().busy, true)
  unsub()
  store.set({ busy: false })
  assert.equal(n, 1, 'unsubscribed listener must not fire')
})

// ---------------------------------------------------------------------------
// 5. createPanelStore
// ---------------------------------------------------------------------------

test('panel store: open/minimize/z/pos/anchor without persist', () => {
  const { service } = makeService()
  const p = service.createPanelStore({})
  assert.equal(p.get().open, false)
  p.toggle()
  assert.equal(p.get().open, true)
  p.toggleMinimized()
  assert.equal(p.get().minimized, true)
  p.setZ(1234)
  assert.equal(p.get().z, 1234)
  p.move({ x: 10, y: 20 })
  assert.deepEqual(p.get().pos, { x: 10, y: 20 })
  p.setAnchor({ x: 5, y: 6 })
  assert.deepEqual(p.get().anchor, { x: 5, y: 6 })
})

test('panel store: persist keeps pos/anchor/minimized but never open', () => {
  const storage = makeStorage()
  globalThis.localStorage = storage
  try {
    const { service } = makeService()
    const p = service.createPanelStore({ persist: 't.panel.v1' })
    p.open()
    p.move({ x: 11, y: 22 })
    p.setAnchor({ x: 33, y: 44 })
    p.toggleMinimized()
    assert.equal(storage.getItem('t.panel.v1') != null, true, 'persist key written')

    // Second store over the same key restores persisted fields, stays closed.
    const q = service.createPanelStore({ persist: 't.panel.v1' })
    const s = q.get()
    assert.equal(s.open, false, 'open must not persist')
    assert.equal(s.minimized, true)
    assert.deepEqual(s.pos, { x: 11, y: 22 })
    assert.deepEqual(s.anchor, { x: 33, y: 44 })
  } finally {
    delete globalThis.localStorage
  }
})

// ---------------------------------------------------------------------------
// 6. Rows / atoms
// ---------------------------------------------------------------------------

test('Rows renders each field type through the right atom and wires onChange', () => {
  const { service } = makeService()
  const values = { enabled: true, apiKey: 'k', timeout: 5, transport: 'http', args: 'a\nb' }
  const calls = []
  const el = service.Rows({
    fields: [
      { key: 'enabled', type: 'switch', label: '启用' },
      { key: 'apiKey', type: 'text', label: 'Key' },
      { key: 'timeout', type: 'number', label: '超时' },
      {
        key: 'transport', type: 'select', label: '传输',
        options: [{ value: 'stdio', label: 'stdio' }, { value: 'http', label: 'http' }],
      },
      { key: 'args', type: 'textarea', label: '参数', rows: 4 },
    ],
    values,
    onChange: (k, v) => calls.push([k, v]),
  })
  const nodes = collect(el)

  const switchEl = nodes.find((n) => n?.type?.name === 'Switch')
  assert.ok(switchEl, 'switch field renders Switch')
  assert.equal(switchEl.props.checked, true)
  switchEl.props.onChange(false)
  assert.deepEqual(calls[0], ['enabled', false])

  // Pre-render tree: Rows emits component elements (TextInput/TextArea/Select);
  // the raw DOM nodes ('input' etc.) only exist inside those components'
  // render output, so assert on the component props Rows composes.
  const textInputs = nodes.filter((n) => n?.type?.name === 'TextInput')
  assert.equal(textInputs.length, 2, 'text + number TextInput fields')
  assert.equal(textInputs[0].props.value, 'k')
  assert.equal(textInputs[1].props.type, 'number')
  assert.equal(textInputs[1].props.value, 5)

  const selectEl = nodes.find((n) => n?.type?.name === 'Select')
  assert.equal(selectEl.props.value, 'http')
  assert.equal(selectEl.props.children.length, 2)

  const areaEl = nodes.find((n) => n?.type?.name === 'TextArea')
  assert.equal(areaEl.props.rows, 4)
  assert.equal(areaEl.props.value, 'a\nb')
})

test('Banner: error kind gets role=alert, saved does not', () => {
  const { service } = makeService()
  const err = service.Banner({ kind: 'error' }, '坏了')
  assert.equal(err.props.role, 'alert')
  const saved = service.Banner({ kind: 'saved' }, '好了')
  assert.equal(saved.props.role, undefined)
})

test('Dialog: closed renders nothing; open renders a11y modal markup', () => {
  const { service } = makeService()
  assert.equal(renderToString(service.h(service.Dialog, { open: false, title: 'x' })), '')
  const html = renderToString(service.h(service.Dialog, { open: true, title: '确认' }))
  assert.match(html, /sui-dialog-backdrop/)
  assert.match(html, /role="dialog"/)
  assert.match(html, /aria-modal="true"/)
  assert.match(html, /tabindex="-1"/)
  assert.match(html, /确认/)
})

// ---------------------------------------------------------------------------
// 8. P2 atoms: Rows min/max/disabled passthrough + ErrorBoundary
// ---------------------------------------------------------------------------

test('Rows forwards min/max/disabled to the atoms', () => {
  const { service } = makeService()
  const el = service.Rows({
    fields: [
      { key: 'port', type: 'number', label: '端口', min: 1, max: 65535, disabled: true },
      { key: 'on', type: 'switch', label: '启用', disabled: true },
      { key: 'args', type: 'textarea', label: '参数', disabled: true },
      { key: 'sel', type: 'select', label: '选择', options: [{ value: 'a', label: 'A' }], disabled: true },
    ],
    values: { port: 80, on: true, args: 'x', sel: 'a' },
    onChange: () => {},
  })
  const nodes = collect(el)
  const input = nodes.find((n) => n?.type?.name === 'TextInput')
  assert.equal(input.props.min, 1)
  assert.equal(input.props.max, 65535)
  assert.equal(input.props.disabled, true)
  const sw = nodes.find((n) => n?.type?.name === 'Switch')
  assert.equal(sw.props.disabled, true)
  const area = nodes.find((n) => n?.type?.name === 'TextArea')
  assert.equal(area.props.disabled, true)
  const sel = nodes.find((n) => n?.type?.name === 'Select')
  assert.equal(sel.props.disabled, true)
})

test('ErrorBoundary: renders children; getDerivedStateFromError contract', () => {
  const { service } = makeService()
  const html = renderToString(service.h(service.ErrorBoundary, null, '正常内容'))
  assert.match(html, /正常内容/)
  // react-dom/server's legacy renderer does not catch render errors (React
  // SSR limitation), so the crash path is asserted via the static contract;
  // the banner rendering is covered by shell verification (client renderer).
  const next = service.ErrorBoundary.getDerivedStateFromError(new Error('kaboom'))
  assert.ok(next && next.error instanceof Error)
  assert.equal(next.error.message, 'kaboom')
})

// ---------------------------------------------------------------------------
// 9. Checkbox / Radio / EmptyState / Toast
// ---------------------------------------------------------------------------

test('Checkbox and Radio render native inputs and wire onChange', () => {
  const { service } = makeService()
  const calls = []
  const box = service.Checkbox({ checked: true, onChange: (v) => calls.push(['box', v]), disabled: true, label: '启用' })
  assert.equal(box.type, 'label')
  const boxInput = box.props.children[0]
  assert.equal(boxInput.type, 'input')
  assert.equal(boxInput.props.type, 'checkbox')
  assert.equal(boxInput.props.checked, true)
  assert.equal(boxInput.props.disabled, true)
  boxInput.props.onChange({ target: { checked: false } })
  assert.deepEqual(calls[0], ['box', false])

  const radio = service.Radio({ checked: false, onChange: (v) => calls.push(['radio', v]), name: 'g', value: 'http', label: 'HTTP' })
  const radioInput = radio.props.children[0]
  assert.equal(radioInput.props.type, 'radio')
  assert.equal(radioInput.props.name, 'g')
  assert.equal(radioInput.props.value, 'http')
  radioInput.props.onChange({ target: { value: 'http' } })
  assert.deepEqual(calls[1], ['radio', 'http'])
})

test('EmptyState renders the .sui-empty placeholder', () => {
  const { service } = makeService()
  const el = service.EmptyState({ text: '暂无数据' })
  assert.equal(el.type, 'div')
  assert.equal(el.props.className, 'sui-empty')
  assert.equal(el.props.children, '暂无数据')
})

test('Rows renders a checkbox field through Checkbox', () => {
  const { service } = makeService()
  const calls = []
  const el = service.Rows({
    fields: [{ key: 'auto', type: 'checkbox', label: '自动' }],
    values: { auto: true },
    onChange: (k, v) => calls.push([k, v]),
  })
  const nodes = collect(el)
  const box = nodes.find((n) => n?.type?.name === 'Checkbox')
  assert.ok(box, 'checkbox field renders Checkbox')
  assert.equal(box.props.checked, true)
  box.props.onChange(false)
  assert.deepEqual(calls[0], ['auto', false])
})

test('ToastHost renders the host stack (bus interactions verified in shell)', () => {
  const { service } = makeService()
  const html = renderToString(service.h(service.ToastHost))
  assert.match(html, /sui-toast-host/)
})

// ---------------------------------------------------------------------------
// 10. 0.2.16: Tabs a11y / Panel resize
// ---------------------------------------------------------------------------

test('Tabs carries WAI-ARIA roles and roving tabindex', () => {
  const { service } = makeService()
  const html = renderToString(service.h(service.Tabs, {
    items: [{ id: 'a', label: '甲' }, { id: 'b', label: '乙' }],
    active: 'a',
    onChange: () => {},
  }))
  assert.match(html, /role="tablist"/)
  assert.match(html, /role="tab"/)
  assert.match(html, /aria-selected="true"/)
  assert.match(html, /aria-selected="false"/)
  assert.match(html, /tabindex="0"/)
  assert.match(html, /tabindex="-1"/)
})

test('panel store: resize sets size and persists', () => {
  globalThis.localStorage = makeStorage()
  try {
    const { service } = makeService()
    const p = service.createPanelStore({ persist: 't.resize.v1' })
    p.resize({ w: 500, h: 420 })
    assert.deepEqual(p.get().size, { w: 500, h: 420 })
    const q = service.createPanelStore({ persist: 't.resize.v1' })
    assert.deepEqual(q.get().size, { w: 500, h: 420 })
  } finally {
    delete globalThis.localStorage
  }
})

test('Panel renders the resize handle and applies a custom size', () => {
  const { service } = makeService()
  const panel = service.createPanelStore({ initiallyOpen: true })
  panel.resize({ w: 512, h: 400 })
  const html = renderToString(service.h(service.Panel, { title: 'T', panel }))
  assert.match(html, /sui-overlay-resize/)
  assert.match(html, /width:512px/)
  assert.match(html, /height:400px/)
})

// ---------------------------------------------------------------------------
// 7. P1 store semantics (dirty / saved auto-clear / result passthrough)
// ---------------------------------------------------------------------------

test('dirty: set({doc}) marks edits, refresh and commit clear it', async () => {
  const { service } = makeService()
  const store = service.createSettingsStore({
    get: async () => ({ revision: 1, enabled: true }),
    update: async (p) => p,
  }, { savedTtlMs: 150 })
  assert.equal(store.get().dirty, false, 'starts clean')
  store.set({ doc: { enabled: false } })
  assert.equal(store.get().dirty, true, 'consumer doc edit marks dirty')
  await store.refresh()
  assert.equal(store.get().dirty, false, 'refresh clears dirty')
  store.set({ doc: { enabled: false } })
  await store.commit({ enabled: false })
  assert.equal(store.get().dirty, false, 'successful commit clears dirty')
})

test('saved auto-clears after savedTtlMs', async () => {
  const { service } = makeService()
  const store = service.createSettingsStore({
    get: async () => ({ revision: 1 }),
    update: async () => undefined,
  }, { savedTtlMs: 20 })
  const ok = await store.commit({})
  assert.equal(ok, true)
  assert.equal(store.get().saved, true, 'saved flashes right after commit')
  await new Promise((r) => setTimeout(r, 80))
  assert.equal(store.get().saved, false, 'saved auto-clears after the ttl')
})

test('commit resolves the update result; run resolves the action result', async () => {
  const { service } = makeService()
  const store = service.createSettingsStore({
    get: async () => ({ revision: 1 }),
    update: async () => ({ ok: 'from-update' }),
  }, { savedTtlMs: 150 })
  const commitResult = await store.commit({})
  assert.deepEqual(commitResult, { ok: 'from-update' }, 'commit passes the update result through')
  const runResult = await store.run(async () => ({ ok: 'from-action' }))
  assert.deepEqual(runResult, { ok: 'from-action' }, 'run passes the action result through')
  // Backward compatibility: undefined results still resolve to true.
  const store2 = service.createSettingsStore({
    get: async () => ({ revision: 1 }),
    update: async () => undefined,
  }, { savedTtlMs: 150 })
  assert.equal(await store2.commit({}), true)
  assert.equal(await store2.run(async () => undefined), true)
})

// ---------------------------------------------------------------------------
// 11. 0.2.19 审查修复：跨标签同步 + ErrorBoundary 默认 console.error
// ---------------------------------------------------------------------------

test('panel store: storage event merges remote persisted fields (cross-tab, 0.2.19)', () => {
  const storage = makeStorage()
  globalThis.localStorage = storage
  try {
    const { service, winHandlers } = makeService()
    const p = service.createPanelStore({ persist: 't.x.tab' })
    p.move({ x: 1, y: 2 })
    const handlers = winHandlers.get('storage') || []
    assert.equal(handlers.length, 1, 'storage listener registered when persist key present')
    // Simulate another tab persisting { pos, size }.
    handlers[0]({ key: 't.x.tab', newValue: JSON.stringify({ pos: { x: 100, y: 200 }, anchor: null, minimized: false, size: { w: 500, h: 400 } }) })
    assert.deepEqual(p.get().pos, { x: 100, y: 200 }, 'remote pos merged')
    assert.deepEqual(p.get().size, { w: 500, h: 400 }, 'remote size merged')
    assert.equal(p.get().open, false, 'open untouched by storage merge')
    // dispose removes the listener (idempotent).
    p.dispose()
    p.dispose()
    assert.equal(winHandlers.get('storage').length, 0, 'dispose removes storage listener')
  } finally {
    delete globalThis.localStorage
  }
})

test('ErrorBoundary: componentDidCatch logs stack to console by default (0.2.19)', () => {
  const { service } = makeService()
  const calls = []
  const orig = console.error
  console.error = (...args) => calls.push(args)
  try {
    const inst = new service.ErrorBoundary({ children: null })
    inst.componentDidCatch(new Error('kaboom'), { componentStack: 'at X' })
    assert.equal(calls.length, 1, 'console.error called once')
    assert.match(String(calls[0][0]), /dsh-settings-ui/)
    assert.match(String(calls[0][1]), /kaboom/)
    assert.match(String(calls[0][2]), /at X/, 'component stack forwarded')
    // onError callback still fires alongside the default logging.
    let captured = null
    const inst2 = new service.ErrorBoundary({ children: null, onError: (e) => { captured = e } })
    inst2.componentDidCatch(new Error('cb'), {})
    assert.equal(captured && captured.message, 'cb')
  } finally {
    console.error = orig
  }
})
