/**
 * dsh-settings-ui host half: intentionally empty.
 *
 * The kit is a pure client service (`ctx.settingsUi`) — the host side exists
 * only so the package mounts as a bundle row. All UI, the service, and the
 * settings store live in lib/client.js (served at
 * /plugins/dsh-settings-ui/client.js).
 */

export const name = 'dsh-settings-ui'

export function apply(ctx) {}
