# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `400d5dc41726fa688828f657fc46631b1e20937e`
- PR #40 (`CART-UX-001`) is merged at that commit.
- No open PR existed when the current task started.

## Recent completed work

- `ADMIN-RUNTIME-FREEZE-001` — CLOSED / runtime verified — PR #36
- `ORDER-OPS-RECONNECT-UX-001` — CLOSED / runtime verified — PR #38
- `RUNTIME-ACCEPTANCE-RECONNECT-CLOSE-001` — CLOSED — PR #39
- `CART-UX-001` — MERGED — PR #40

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains **PARTIAL RUNTIME PASS**.

Still waiting for runtime evidence from a real/new order:
- Realtime arrival
- duplicate-alert suppression
- cross-device unread/read sync

Do not create synthetic production orders without explicit Owner authorization.

## Current active task

`ADMIN-ORDER-PACKING-UX-001 — improve packing list clarity`

Branch:

`task/admin-order-packing-ux-001`

Owner observations:
- admin order item list has no product image, which makes packing easier to confuse
- `Tổng chốt với khách` input is vertically misaligned with `Phí giao hàng`

Root causes:
- order snapshots already contain `image_url`, but `admin-orders.ts` did not include/render it
- settlement labels are CSS grids with different child counts; without `align-content:start`, the taller label can distribute vertical track space differently and shift the input

Implemented:
- add `image_url` to admin order item type
- render product thumbnail for each order item, with fallback for old/missing snapshots
- style thumbnails for desktop/mobile packing view
- align settlement label content to the top and give numeric inputs a consistent minimum height

No DB/schema/order mutation is part of this task.
