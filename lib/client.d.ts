/**
 * dsh-settings-ui client typings (lib/client.d.ts).
 *
 * Runtime surface of `ctx.settingsUi` — the browser bundle served at
 * /plugins/dsh-settings-ui/client.js (export "./client"). Mirrors the
 * plain-JS implementation: when they drift, lib/client.js is authoritative
 * and this file must be updated (version sync is asserted by test/).
 */
import type * as React from 'react'

export type ButtonKind = 'primary' | 'secondary' | 'danger'
export type BadgeTone = 'info' | 'success' | 'warn' | 'error' | 'neutral'
export type BannerKind = 'error' | 'saved' | 'warn'

export interface SectionHeaderProps {
  title: React.ReactNode
  desc?: React.ReactNode
}

export interface FieldProps {
  label: React.ReactNode
  hint?: React.ReactNode
  children?: React.ReactNode
}

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  autoFocus?: boolean
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  min?: number | string
  max?: number | string
}

export interface TextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export interface ButtonProps {
  kind?: ButtonKind
  disabled?: boolean
  onClick?: () => void
  title?: string
  children?: React.ReactNode
}

export interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
  title?: string
}

export interface CheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: React.ReactNode
}

export interface RadioProps {
  checked: boolean
  /** Receives the radio's value (native semantics). */
  onChange: (value: string) => void
  disabled?: boolean
  label?: React.ReactNode
  name?: string
  value?: string
}

export interface CardProps {
  row?: boolean
  children?: React.ReactNode
}

export interface StatusDotProps {
  color?: string
  text: React.ReactNode
  extra?: React.ReactNode
}

export interface BadgeProps {
  children?: React.ReactNode
  tone?: BadgeTone
  outline?: boolean
}

export interface SpinnerProps {
  size?: number | string
  style?: React.CSSProperties
}

export interface ListProps {
  children?: React.ReactNode
}

export interface ListItemProps {
  children?: React.ReactNode
  onClick?: () => void
  title?: string
}

export interface TabItem {
  id: string
  label: React.ReactNode
  badge?: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
}

export interface BannerProps {
  kind?: BannerKind
  children?: React.ReactNode
}

export interface EmptyStateProps {
  text?: React.ReactNode
  children?: React.ReactNode
}

export type ToastKind = 'saved' | 'error' | 'warn'

export interface ToastOptions {
  kind?: ToastKind
  /** Auto-dismiss time (ms). Default 3000. */
  ttlMs?: number
}

export interface ToastItem {
  id: number
  text: React.ReactNode
  kind: ToastKind
  ttlMs: number
}

export interface DialogProps {
  open: boolean
  title: React.ReactNode
  onClose?: () => void
  footer?: React.ReactNode
  children?: React.ReactNode
  width?: number | string
}

export interface ErrorBoundaryProps {
  /** Banner heading when a child crashes (default: 界面渲染出错). */
  title?: React.ReactNode
  /** Custom fallback renderer; receives the caught error. */
  fallback?: (error: unknown) => React.ReactNode
  onError?: (error: unknown, info: unknown) => void
  children?: React.ReactNode
}

export interface RowOption {
  value: string
  label: React.ReactNode
}

export interface RowField {
  key: string
  type?: 'switch' | 'checkbox' | 'text' | 'number' | 'textarea' | 'select'
  label?: React.ReactNode
  hint?: React.ReactNode
  placeholder?: string
  options?: RowOption[]
  rows?: number
  /** Forwarded to the atom (TextInput min/max or field disabled). */
  min?: number
  max?: number
  disabled?: boolean
}

export interface RowsProps {
  fields: RowField[]
  values: Record<string, unknown> | null | undefined
  onChange: (key: string, value: string | boolean) => void
}

export interface SettingsApi {
  get: () => Promise<any>
  /** Optional: omit for list/CRUD plugins that only use `run()`. */
  update?: (payload: any) => Promise<any>
}

/** Official `ctx.settingsScope.bind({ namespace })` snapshot (rc7). */
export interface SettingsScopeSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  value: any
  base: unknown
  user: unknown
  /** Namespace revision fencing the next write. */
  revision: number | undefined
  writable: boolean
  mode: 'host' | 'memory'
}

/**
 * A settingsScope handle bound via `ctx.settingsScope.bind({ namespace })`.
 * Save-as-you-go: `set`/`unset` persist immediately with revision fencing
 * owned by the official scope (the kit never re-implements it).
 */
export interface SettingsScope {
  getSnapshot(): SettingsScopeSnapshot
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  set(field: string, value: unknown): Promise<void>
  unset(field: string): Promise<void>
}

export interface SettingsStoreOptions {
  /** Auto-clear time (ms) for the `saved` flash. Default 3000. */
  savedTtlMs?: number
}

export interface SettingsState {
  doc: any
  revision: unknown
  busy: boolean
  error: string
  /** True right after a successful save; auto-clears after savedTtlMs. */
  saved: boolean
  loaded: boolean
  /** True when the form has local edits not yet saved (set via set({doc})). */
  dirty: boolean
}

export interface SettingsStore {
  get(): SettingsState
  set(patch: Partial<SettingsState>): void
  subscribe(listener: () => void): () => void
  refresh(): Promise<void>
  /** Resolves the update() result (true when undefined), false on failure. */
  commit(payload: any): Promise<any>
  /** Resolves the action's result (true when undefined), false on failure. */
  run(fn: () => Promise<unknown>): Promise<any>
  /** Scope backend only: queue a Host refresh on the official scope. */
  load?(): Promise<void>
  /** Scope backend only: persist one field immediately (save-as-you-go). */
  setField?(field: string, value: unknown): Promise<any>
  /** Scope backend only: clear one field back to the composition layer. */
  unsetField?(field: string): Promise<any>
}

export interface PanelStoreOptions {
  /** localStorage key: pos/anchor/minimized/size survive reloads (open does not). */
  persist?: string
  initiallyOpen?: boolean
}

export interface PanelPos {
  x: number
  y: number
}

export interface PanelSize {
  w: number
  h: number
}

export interface PanelState {
  open: boolean
  minimized: boolean
  pos: PanelPos | null
  /** Anchor mode: dock point beside a draggable handle (e.g. `.sui-fab`). */
  anchor: PanelPos | null
  /** Custom size from the bottom-right resize handle (null = CSS default). */
  size: PanelSize | null
  z: number
}

export interface PanelStore {
  get(): PanelState
  set(patch: Partial<PanelState>): void
  subscribe(listener: () => void): () => void
  open(): void
  close(): void
  toggle(): void
  toggleMinimized(): void
  move(pos: PanelPos): void
  setAnchor(anchor: PanelPos): void
  resize(size: PanelSize): void
  setZ(z: number): void
}

export interface PanelProps {
  title: React.ReactNode
  panel: PanelStore
  onClose?: () => void
  style?: React.CSSProperties
  children?: React.ReactNode
}

export interface SectionConfig {
  id: string
  order: number
  /** Nav label; string or function following the shell locale. */
  label: string | (() => React.ReactNode)
  /** Dictionary namespace id forwarded to the slot registration. */
  locale?: string
  /** Business face composed into the component props. */
  inject?: () => Record<string, unknown>
  /** React component; must return a Fragment, not a bare div (see GUIDE §5). */
  render: React.ComponentType<any>
}

export interface OverlayConfig {
  id: string
  order?: number
  label?: string
  locale?: string
  inject?: () => Record<string, unknown>
  render: React.ComponentType<any>
}

export interface PluginCardHeader {
  title: React.ReactNode
  desc?: React.ReactNode
  meta?: React.ReactNode
}

/** Content ctx handed to `content` / the card renderer. */
export interface PluginCardContext {
  ui: SettingsUi
  store: SettingsStore
  scope: SettingsScope | null
  key: string
}

export type PluginCardShowIn = 'official-tab' | 'settings-page' | 'both'
export type PluginCardChrome = 'full' | 'minimal'

export interface PluginCardConfig {
  /** Required = settings namespace = the official tab dispatch key. */
  key: string
  /** Aggregation-layer sort (keyed slots declare no order of their own). */
  order?: number
  /** Dictionary namespace id forwarded to the slot registration. */
  locale?: string
  /** Kit-rendered card head. */
  header?: PluginCardHeader
  /** Kit Rows form (recommended). */
  fields?: RowField[]
  /** Free content exit; receives { ui, store, scope, key }. */
  content?: (ctx: PluginCardContext) => React.ReactNode
  /** Where the card lands. Default 'official-tab'. */
  showIn?: PluginCardShowIn
  /** 'minimal' drops the kit card shell. Default 'full'. */
  chrome?: PluginCardChrome
  /** Optional fenced fallback transport for 'settings-page' without scope. */
  api?: SettingsApi
}

export interface PluginCardResult {
  key: string
  store: SettingsStore
  scope: SettingsScope | null
  showIn: PluginCardShowIn
}

export interface SettingsUi {
  /** React.createElement alias. */
  h: typeof React.createElement
  SectionHeader: React.ComponentType<SectionHeaderProps>
  Field: React.ComponentType<FieldProps>
  TextInput: React.ComponentType<TextInputProps>
  TextArea: React.ComponentType<TextAreaProps>
  Select: React.ComponentType<SelectProps>
  Button: React.ComponentType<ButtonProps>
  Switch: React.ComponentType<SwitchProps>
  Checkbox: React.ComponentType<CheckboxProps>
  Radio: React.ComponentType<RadioProps>
  Card: React.ComponentType<CardProps>
  StatusDot: React.ComponentType<StatusDotProps>
  Badge: React.ComponentType<BadgeProps>
  Spinner: React.ComponentType<SpinnerProps>
  List: React.ComponentType<ListProps>
  ListItem: React.ComponentType<ListItemProps>
  Tabs: React.ComponentType<TabsProps>
  Banner: React.ComponentType<BannerProps>
  EmptyState: React.ComponentType<EmptyStateProps>
  /** Broadcast a toast to every mounted ToastHost. */
  toast: (text: React.ReactNode, options?: ToastOptions) => void
  /** Fixed bottom-right toast stack; mount once per plugin root. */
  ToastHost: React.ComponentType<Record<string, never>>
  /** Hook over the toast bus; returns this host's live items. */
  useToast: () => ToastItem[]
  Dialog: React.ComponentType<DialogProps>
  ErrorBoundary: React.ComponentType<ErrorBoundaryProps>
  Rows: React.ComponentType<RowsProps>
  /** api = fenced `{ get, update }` OR a bound settingsScope handle (scope backend, rc7). */
  createSettingsStore(api: SettingsApi | SettingsScope, options?: SettingsStoreOptions): SettingsStore
  useSettings(store: SettingsStore): SettingsState
  Panel: React.ComponentType<PanelProps>
  createPanelStore(options?: PanelStoreOptions): PanelStore
  usePanel(store: PanelStore): PanelState
  /** Register a settings-page section (convenience path). */
  section(config: SectionConfig): unknown
  /** Register a floating surface on the frame-wide `shell.overlay` slot (freedom path). */
  overlay(config: OverlayConfig): unknown
  /**
   * Register a rc7 official "plugin configuration" card (keyed
   * `settings.plugin.item` by the settings namespace), persisted via the
   * official `ctx.settingsScope` (save-as-you-go, revision-fenced). The store
   * is the settingsScope backend of `createSettingsStore`. Returns null when
   * the key is invalid/duplicate or settingsScope is unavailable for the
   * official-tab path.
   */
  pluginCard(config: PluginCardConfig): PluginCardResult | null
}

declare const settingsUi: SettingsUi
export default settingsUi
