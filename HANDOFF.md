# SkyHouse — Agent Handoff

Use this file when moving the project to ChatGPT Work, another agent, or a new chat.

## Identity

- Owner: Sky
- Repository: `onlysky17/SkyHouse`
- Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

- PR #35: notification diagnostic instrumentation
- PR #36: admin freeze fix
- PR #37: runtime acceptance evidence
- current canonical main: `606b1ee323106d8b35866de81658eb036a9f5180`

## Current active task

`ORDER-OPS-RECONNECT-UX-001`

Branch:

`task/order-ops-reconnect-ux-001`

## Runtime evidence

Owner reconnect test proved:

- network loss triggers fetch failures/fallback
- app reconnects after network restoration
- Realtime re-subscribes
- diagnostic trace shows degraded → connecting → connected
- final health returns to `Realtime ổn định`

A stale red fetch-error banner remained after successful recovery.

## Current fix

`src/admin-orders.ts` now clears only the stale `Không tải được đơn hàng: ...` error after a later successful order reload and records recovery in the diagnostic trace.

No DB/schema/order behavior is changed.

## Remaining notification acceptance

- audible sound confirmation from Sky
- real order Realtime arrival
- duplicate suppression on real/new order
- cross-device unread/read synchronization

Do not create synthetic production orders without explicit Owner authorization.

## Merge boundary

Sky controls merge.

After this PR merges, re-test reconnect once to verify the stale error banner disappears after recovery.
