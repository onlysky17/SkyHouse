# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `0396ad59c0f9e0f6959c4e03eb6eee46ab281bdb`
- PR #41 (`ADMIN-ORDER-PACKING-UX-001`) is merged at that commit.
- No open PR existed when the current task started.

## Recent completed work

- `CART-UX-001` — CLOSED / MERGED — PR #40
- `ADMIN-ORDER-PACKING-UX-001` — CLOSED / MERGED — PR #41

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains **PARTIAL RUNTIME PASS**.

Still waiting for runtime evidence from a real/new order:
- Realtime arrival
- duplicate-alert suppression
- cross-device unread/read sync

Do not create synthetic production orders without explicit Owner authorization.

## Current active task

`ADMIN-SCROLL-PRESERVE-001 — preserve admin order position across tab switches/background refresh`

Branch:

`task/admin-scroll-preserve-001`

Owner symptom:
- scroll down inside an order detail
- switch to another browser tab to paste/share a screenshot
- return to SkyHouse admin
- order detail jumps away from the previous position

Root cause:
- `visibilitychange` intentionally triggers a silent order refresh when the admin tab becomes visible
- a successful refresh calls `renderPanel()`
- `renderPanel()` replaces the whole admin panel DOM with `innerHTML`
- replacing the detail DOM discards scroll position, trace state and focused settlement field state

Implemented:
- capture list/detail scroll positions before panel rerender
- preserve horizontal filter position and diagnostic trace open/scroll state
- restore detail scroll only when the same order remains selected
- preserve the currently focused settlement field value/focus/selection using `focus({ preventScroll: true })`
- deliberate order selection still opens the newly selected order normally

No DB/schema/order mutation is part of this task.
