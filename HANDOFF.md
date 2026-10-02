# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main:

`0c2922cc55e1c9e33e87170d2c7716fcf487121e`

PR #45 is merged.

## Closed runtime issue

The admin order panel previously jumped when returning from another tab/window.

Final root cause:
- Realtime status transitions still called full `renderPanel()`
- that replaced the entire admin panel DOM even when order data had not changed

PR #45 changed status-only transitions to update only runtime chrome in place.

Owner runtime confirmation: **PASS**.

## Remaining acceptance

`ORDER-OPS-NOTIFY-008` remains partial until a real/new order is available for:
- Realtime arrival
- duplicate suppression
- cross-device unread/read synchronization

Do not create synthetic production orders without explicit Owner authorization.

## Merge boundary

Sky controls merge.
