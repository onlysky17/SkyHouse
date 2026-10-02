# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `554fe5d74a5a904483629570e26a1631339f1735`
- PR #49 is merged at that commit.
- No open PR existed when the current checkout task started.

## Recent runtime state

- Admin tab-resume jump: CLOSED / RUNTIME VERIFIED.
- Mobile product modal dismissal: CLOSED / RUNTIME VERIFIED.
- `ORDER-OPS-NOTIFY-008`: CLOSED / RUNTIME VERIFIED.
- Real order arrival, cross-browser read-state sync and dedupe are all PASS.

## Current active task

`ORDER-CHECKOUT-UX-001 — replace copy/Zalo checkout with direct order placement`

Branch:

`task/order-checkout-ux-001`

Owner direction:
- storefront already sends order/items/customer information to SkyHouse admin
- primary checkout should therefore be a normal `Đặt hàng` action
- remove the copy-order workflow
- do not force users through Zalo after submitting

Implemented:
- primary checkout CTA is now a button: `Đặt hàng`
- checkout submits directly through the existing `create_storefront_order` RPC
- customer validation remains unchanged
- order confirmation + direct tracking link remain
- duplicate-submit reuse protection remains
- removed the secondary `Sao chép danh sách` action
- retained `Gọi Sky` as an optional secondary contact action
- updated checkout copy to explain that Sky receives the order directly

No DB/schema change is part of this task.
