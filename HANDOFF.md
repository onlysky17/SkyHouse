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
- PR #38: reconnect stale-banner UX fix
- current canonical main: `f296da213eddf20a08c62265e4eff58800b9c9c4`

## Runtime evidence

Verified by Owner:

- admin login/dashboard responsive
- order panel responsive
- Realtime stable/connected
- browser notification permission granted
- background notification enabled
- local toast self-test delivered
- browser/system notification visibly delivered
- offline/fallback/reconnect/catch-up behavior works
- after PR #38, stale `Failed to fetch` banner clears automatically after successful recovery
- diagnostic trace shows recovery back to connected state

## Current active task

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

State:

**PARTIAL RUNTIME PASS**

Remaining:

- audible sound confirmation from Sky
- real order Realtime arrival
- duplicate suppression on real/new order
- cross-device unread/read synchronization

Production had no orders during the validation sessions.

Do not create synthetic production orders without explicit Owner authorization.

## Merge boundary

Sky controls merge.

If no real order exists, wait rather than inventing an acceptance result.
