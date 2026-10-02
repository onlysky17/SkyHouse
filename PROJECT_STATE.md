# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `581a13d3d381511edc54244dd6d8eb3bba72dfd6`
- PR #42 is merged at that commit.
- No open PR existed when this task started.

## Recent completed work

- `CART-UX-001` — CLOSED / MERGED — PR #40
- `ADMIN-ORDER-PACKING-UX-001` — CLOSED / MERGED — PR #41
- `ADMIN-SCROLL-PRESERVE-001` — MERGED / runtime still failed at bottom-position preservation — PR #42

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains **PARTIAL RUNTIME PASS**.

Still waiting for runtime evidence from a real/new order:
- Realtime arrival
- duplicate-alert suppression
- cross-device unread/read sync

Do not create synthetic production orders without explicit Owner authorization.

## Current active task

`ADMIN-SCROLL-PRESERVE-002 — keep exact admin detail position after tab resume`

Branch:

`task/admin-scroll-preserve-002`

Owner runtime evidence after PR #42:
- scroll to the bottom area of an order
- switch to another tab/window
- return to SkyHouse
- detail still jumps upward even though absolute `scrollTop` was restored

Refined root cause:
- tab resume causes a silent refresh and full panel DOM replacement
- PR #42 restored the old absolute `scrollTop` immediately
- the new detail layout can settle/expand after that immediate restore
- absolute pixel restoration therefore no longer guarantees the same distance from the bottom
- browser scroll anchoring can also interfere while the new DOM settles

Implemented in this task:
- capture the exact distance from the bottom
- if Owner was near the bottom, restore by bottom-gap instead of absolute scrollTop
- restore immediately and again after two animation frames when layout has settled
- use a render epoch so an old delayed restore cannot overwrite a newer render
- disable native scroll anchoring on the order detail
- retain PR #42 protections for list/filter/trace/focused settlement field state

No DB/schema/order mutation is part of this task.
