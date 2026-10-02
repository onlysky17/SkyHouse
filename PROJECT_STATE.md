# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `d94162bdc80ff630f42bb7770822c4fbaa51e853`
- PR #50 is merged at that commit.
- No open PR existed when the current pending-order merge task started.

## Recent runtime state

- Admin tab-resume jump: CLOSED / RUNTIME VERIFIED.
- Mobile product modal dismissal: CLOSED / RUNTIME VERIFIED.
- `ORDER-OPS-NOTIFY-008`: CLOSED / RUNTIME VERIFIED.
- `ORDER-CHECKOUT-UX-001`: MERGED via PR #50; storefront now has direct `Đặt hàng`.

## Current active task

`ORDER-PENDING-MERGE-001 — merge repeat checkout into the latest still-new order for the same customer phone`

Branch:

`task/order-pending-merge-001`

Owner rule:
- same normalized customer phone
- latest matching order is still `status = new`
- a later checkout is appended into that existing order instead of creating a second order
- once the prior order leaves `new`, the next checkout creates a new order

## Implemented on branch

- new RPC `submit_storefront_order` returns `order_id` + `merged`
- serializes same-phone checkout attempts with an advisory transaction lock
- merges item quantities by normalized product name + unit so legacy snapshots without product IDs remain compatible
- latest storefront product metadata wins while quantity accumulates
- subtotal/contact-price state is recalculated after merge
- customer name, phone, delivery note and updated timestamp refresh to latest submission
- any stale final total is cleared when new items arrive
- prior admin read rows for that order are cleared so the customer update becomes unread again
- storefront confirmation says `Đã bổ sung vào đơn #...` when merged
- admin Realtime now listens for order UPDATE events and alerts `Khách vừa bổ sung đơn`
- cross-device read-state sync treats server read rows as authoritative for current orders
- existing direct checkout remains backward-compatible until the DB migration is applied

## Deployment boundary

The migration file is committed but **must not be applied to production before Owner merges the PR**.
