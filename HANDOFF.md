# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main at task start:

`0396ad59c0f9e0f6959c4e03eb6eee46ab281bdb`

That is PR #41 merge (`ADMIN-ORDER-PACKING-UX-001`).

## Current active task

`ADMIN-SCROLL-PRESERVE-001`

Branch:

`task/admin-scroll-preserve-001`

Owner symptom:
- switching away from the admin tab and returning makes the open order detail jump away from its previous scroll position

Cause:
- tab resume triggers silent `loadOrders(true)`
- panel rerender replaces DOM and loses UI state

Implementation in `src/admin-orders.ts`:
- capture/restore order detail and list scroll
- preserve filter scroller position
- preserve diagnostic trace open/scroll state
- preserve focused settlement field draft/focus/selection
- only restore order-detail scroll when the same order remains selected

No DB/schema/auth/order mutation.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains partial until a real/new order is available for arrival/dedupe/cross-device checks.

## Merge boundary

Sky controls merge. A green preview is not production/runtime PASS.
