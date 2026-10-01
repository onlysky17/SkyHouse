# SkyHouse — Project State

Snapshot date: **2026-10-01**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `606b1ee323106d8b35866de81658eb036a9f5180`
- PR #37 merged at that commit.
- PR #33 remains CLOSED / NOT MERGED / superseded.
- Root continuity files are part of `main`.

## Runtime acceptance evidence

Verified by Owner/runtime on 2026-10-01:

- admin dashboard remains responsive after login
- order panel opens normally
- Realtime reports stable/connected
- browser notification permission is granted
- background notifications are enabled
- local self-test produced in-page toast
- browser/system notification visibly delivered
- reconnect test:
  - network loss caused order fetch failures as expected
  - UI entered fallback/degraded state
  - after network returned, Realtime re-subscribed
  - trace recorded degraded → connecting and connecting → connected
  - final status returned to `Realtime ổn định`

No synthetic production order was created.

## Reconnect UX issue discovered

During the successful reconnect test, the red banner:

`Không tải được đơn hàng: TypeError: Failed to fetch`

remained visible even after Realtime had recovered and a later order load succeeded.

Root cause:

- `loadOrders()` records the fetch error in `noticeText`
- a later successful silent reload does not clear that stale fetch-error notice

Current fix on branch `task/order-ops-reconnect-ux-001`:

- clear only the stale order-fetch error after a successful order load
- add a diagnostic trace entry confirming recovery
- do not clear unrelated admin notices

## Current active task

`ORDER-OPS-RECONNECT-UX-001 — clear stale fetch error after reconnect`

## Acceptance state

`ORDER-OPS-NOTIFY-008` is now **PARTIAL RUNTIME PASS** with reconnect verified.

Still unverified:

- audible sound actually heard by Owner
- real order Realtime arrival
- duplicate suppression on a real/new order
- unread/read synchronization across devices

Order-dependent cases still require a naturally occurring order or explicit Owner authorization for synthetic production test data.
