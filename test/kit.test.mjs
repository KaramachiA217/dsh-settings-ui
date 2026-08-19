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

function makeService(opts = {}) {
  const slots = makeFakeSlots()
  let provided = null
  // Official locale service face (dictionary registration is third-party
  // open; installLocale is boot-once and owned by the official plugin).
  const registeredDicts = []
  const locale = { register: (ns, dicts) => { registeredDicts.push({ ns, dicts }) } }
  const loaded = loadBundle()
  // Fake ctx.get: resolve settingsScope only when a scope service is supplied
  // (pluginCard probes it as an optional service; never inject-hard).
  const scopeSvc = opts.scopeSvc ?? null
  const ctx = {
    provide: (key, value) => { provided = { key, value } },
    slots,
    locale,
    get: (name) => (name === 'settingsScope' ? scopeSvc : undefined),
  }
  loaded.plugin.apply(ctx)
  assert.equal(provided?.key, 'settingsUi', 'apply must provide settingsUi')
  return { service: provided.value, slots, registeredDicts, winHandlers: loaded.handlers, ctx }
}

/**
 * A controlled official-settingsScope look-alike (rc7): snapshot store with
 * { status, value, base, user, revision, writable, mode } + save-as-you-go
 * set/unset. The kit's scope backend consumes exactly this surface and MUST
 * NOT depend on revision-conflict throws (the official scope swallows write
 * failures and recovers itself — calibration note 2).
 */
function makeFakeScope(initial = {}) {
  const listeners = new Set()
  let user = { ...initial }
  let revision = 1
  let status = 'ready'
  const snap = () => ({ status, value: user, base: {}, user, revision, writable: true, mode: 'host' })
  const isConflict = () => revision === 99 // reserved: flip to force unavailable
  return {
    getSnapshot: snap,
    subscribe(l) { listeners.add(l); return () => listeners.delete(l) },
    async load() { return undefined },
    async set(field, value) {
      if (isConflict()) { status = 'unavailable'; for (const l of listeners) l(); return undefined }
      user = { ...user, [field]: value }
      revision += 1
      status = 'ready'
      for (const l of listeners) l()
      return undefined
    },
    async unset(field) {
      const next = { ...user }
      delete next[field]
      user = next
      revision += 1
      status = 'ready'
      for (const l of listeners) l()
      return undefined
    },
    async dispose() { return undefined },
    __user: () => user,
    __revision: () => revision,
  }
}

/** A settingsScope binder look-alike for ctx.get('settingsScope'). */
function makeScopeService(initial = {}) {
  let last = null
  return {
    bind(spec) {
      const scope = makeFakeScope(initial)
      last = { spec, scope }
      return scope
    },
    __last: () => last,
  }
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
    'Panel', 'createPanelStore', 'usePanel', 'section', 'overlay', 'pluginCard',
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

// ---------------------------------------------------------------------------
// 12. 0.3.0：createSettingsStore settingsScope 后端（rc.7 对齐，校准注 1/2）
// ---------------------------------------------------------------------------

test('scope backend: refresh reads the scope snapshot into doc/revision', async () => {
  const { service } = makeService()
  const scope = makeFakeScope({ enabled: true, timeout: 5 })
  const store = service.createSettingsStore(scope)
  assert.equal(store.get().loaded, false)
  assert.equal(typeof store.setField, 'function', 'scope backend exposes setField')
  assert.equal(typeof store.load, 'function', 'scope backend exposes load')
  await store.refresh()
  const s = store.get()
  assert.equal(s.loaded, true)
  assert.equal(s.revision, 1)
  assert.equal(s.doc.enabled, true)
  assert.equal(s.doc.timeout, 5)
  assert.equal(s.error, '')
})

test('scope backend: setField persists via scope.set and maps into the state machine', async () => {
  const { service } = makeService()
  const scope = makeFakeScope({ enabled: true })
  const store = service.createSettingsStore(scope)
  await store.refresh()
  store.set({ doc: { enabled: true } })
  assert.equal(store.get().dirty, true, 'consumer edit marks dirty')
  const ok = await store.setField('enabled', false)
  assert.equal(ok, true, 'scope-backed commit resolves true')
  assert.deepEqual(scope.__user(), { enabled: false }, 'scope user layer written')
  const s = store.get()
  assert.equal(s.doc.enabled, false)
  assert.equal(s.revision, 2, 'write bumped the namespace revision')
  assert.equal(s.dirty, false, 'successful save clears dirty')
  assert.equal(s.saved, true, 'saved flashes after scope write')
  assert.equal(s.busy, false)
})

test('scope backend: unsetField removes the field back to the composition layer', async () => {
  const { service } = makeService()
  const scope = makeFakeScope({ enabled: true, timeout: 5 })
  const store = service.createSettingsStore(scope)
  await store.refresh()
  const ok = await store.unsetField('timeout')
  assert.equal(ok, true)
  assert.deepEqual(scope.__user(), { enabled: true }, 'field removed from the user layer')
  assert.equal(store.get().doc.timeout, undefined)
})

test('scope backend: host snapshot subscription updates doc without dirty (save-as-you-go)', async () => {
  const { service } = makeService()
  const scope = makeFakeScope({ a: 1 })
  const store = service.createSettingsStore(scope)
  store.set({ doc: { a: 1 } })        // simulate a local edit → dirty
  assert.equal(store.get().dirty, true)
  await scope.set('a', 2)             // host lands a reply (revision bump + notify)
  assert.equal(store.get().doc.a, 2)
  assert.equal(store.get().dirty, false, 'host reply is not a local edit')
  assert.equal(store.get().revision, 2)
})

test('createSettingsStore rejects a transport that is neither fenced api nor scope', () => {
  const { service } = makeService()
  assert.throws(() => service.createSettingsStore({}), /dsh-settings-ui/)
})

// ---------------------------------------------------------------------------
// 13. 0.3.0：settingsUi.pluginCard（rc.7 keyed 卡；key 护栏 / 注册契约 / markup）
// ---------------------------------------------------------------------------

test('pluginCard registers a keyed settings.plugin.item entry with registrant marker', () => {
  const svc = makeScopeService({ enabled: true })
  const { service, slots } = makeService({ scopeSvc: svc })
  const result = service.pluginCard({ key: 'demo', header: { title: 'Demo' } })
  assert.ok(result, 'pluginCard resolves with scope present')
  assert.equal(result.key, 'demo')
  assert.equal(result.showIn, 'official-tab')
  const e = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo')
  assert.ok(e, 'keyed entry registered under settings.plugin.item')
  assert.equal(e.options.registrant, 'dsh-settings-ui', 'registrant marker feeds the stats card')
  assert.equal(e.options.locale, undefined)
})

test('pluginCard forwards a locale namespace to the slot registration', () => {
  const svc = makeScopeService()
  const { service, slots } = makeService({ scopeSvc: svc })
  service.pluginCard({ key: 'demo', locale: 'settings.demo' })
  const e = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo')
  assert.equal(e.options.locale, 'settings.demo')
})

test('pluginCard rejects a key that fails the ^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$ whitelist', () => {
  const warnings = []
  const orig = console.warn
  console.warn = (...a) => warnings.push(a)
  try {
    const svc = makeScopeService()
    const { service, slots } = makeService({ scopeSvc: svc })
    assert.equal(service.pluginCard({ key: 'Bad Key!', header: {} }), null, 'invalid key rejected')
    const e = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'Bad Key!')
    assert.ok(!e, 'no entry registered for an invalid key')
    assert.equal(warnings.length, 1, 'a clear warning is emitted')
    assert.match(String(warnings[0][0]), /非法 key/)
  } finally {
    console.warn = orig
  }
})

test('pluginCard rejects a duplicate key with a self-protection warning', () => {
  const warnings = []
  const orig = console.warn
  console.warn = (...a) => warnings.push(a)
  try {
    const svc = makeScopeService()
    const { service, slots } = makeService({ scopeSvc: svc })
    service.pluginCard({ key: 'dup' })
    const before = slots.entries().filter((x) => x.options.name === 'settings.plugin.item').length
    assert.equal(service.pluginCard({ key: 'dup' }), null, 'duplicate key rejected')
    const after = slots.entries().filter((x) => x.options.name === 'settings.plugin.item').length
    assert.equal(after, before, 'no second entry for a duplicate key')
    assert.equal(warnings.length, 1)
    assert.match(String(warnings[0][0]), /已在 settings.plugin.item 占位/)
  } finally {
    console.warn = orig
  }
})

test('pluginCard official-tab path bails with a diagnostic when settingsScope is absent', () => {
  const errors = []
  const orig = console.error
  console.error = (...a) => errors.push(a)
  try {
    // No scopeSvc supplied → ctx.get('settingsScope') resolves undefined.
    const { service, slots } = makeService()
    assert.equal(service.pluginCard({ key: 'headless' }), null)
    const e = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'headless')
    assert.ok(!e, 'no official-tab card registered without settingsScope')
    assert.equal(errors.length, 1, 'a diagnostic error is emitted')
    assert.match(String(errors[0][0]), /settingsScope 服务缺席/)
    assert.match(String(errors[0][0]), /无法经官方设置面持久化/, 'says what is missing and the consequence')
  } finally {
    console.error = orig
  }
})

test('pluginCard showIn=settings-page registers settings.section instead (compat path)', () => {
  const svc = makeScopeService()
  const { service, slots } = makeService({ scopeSvc: svc })
  const result = service.pluginCard({ key: 'demo', showIn: 'settings-page', order: 7, header: { title: 'Demo' } })
  assert.ok(result)
  const s = slots.entries().find((x) => x.options.name === 'settings.section' && x.options.id === 'demo')
  assert.ok(s, 'settings-page lands on settings.section')
  assert.equal(s.options.order, 7)
  assert.equal(s.options.registrant, 'dsh-settings-ui')
  const k = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo')
  assert.ok(!k, 'settings-page must not also register the keyed card')
})

test('pluginCard showIn=both registers both the keyed card and a section', () => {
  const svc = makeScopeService()
  const { service, slots } = makeService({ scopeSvc: svc })
  assert.ok(service.pluginCard({ key: 'demo', showIn: 'both' }))
  assert.ok(slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo'))
  assert.ok(slots.entries().find((x) => x.options.name === 'settings.section' && x.options.id === 'demo'))
})

test('pluginCard full chrome renders the kit shell with header + body (markup)', () => {
  const svc = makeScopeService({ enabled: true })
  const { service, slots } = makeService({ scopeSvc: svc })
  service.pluginCard({
    key: 'demo',
    header: { title: 'Demo 卡', desc: '一句话说明' },
    fields: [{ key: 'enabled', type: 'switch', label: '启用' }],
  })
  const entry = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo')
  const html = renderToString(service.h(entry.render))
  assert.match(html, /sui-plugincard/, 'kit card shell rendered')
  assert.match(html, /sui-plugincard-body/, 'content body rendered')
  assert.match(html, /Demo 卡/, 'header title rendered')
  assert.match(html, /一句话说明/, 'header desc rendered')
})

test('pluginCard content free exit takes precedence over fields', () => {
  const svc = makeScopeService()
  const { service, slots } = makeService({ scopeSvc: svc })
  service.pluginCard({
    key: 'demo',
    fields: [{ key: 'a', type: 'switch', label: '忽略我' }],
    content: () => service.h('div', { className: 'custom-exit' }, '自定义内容'),
  })
  const entry = slots.entries().find((x) => x.options.name === 'settings.plugin.item' && x.options.key === 'demo')
  const html = renderToString(service.h(entry.render))
  assert.match(html, /custom-exit/, 'content free exit rendered')
  assert.match(html, /自定义内容/)
})

