# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main at task start:

`554fe5d74a5a904483629570e26a1631339f1735`

PR #49 is merged and notification runtime acceptance is closed.

## Current active task

`ORDER-CHECKOUT-UX-001`

Branch:

`task/order-checkout-ux-001`

Owner direction:
- customers should place orders directly in SkyHouse
- remove copy-to-clipboard / automatic Zalo checkout because the app already sends the order and customer information to admin

Implementation:
- cart primary CTA is a direct `Đặt hàng` button
- uses existing `create_storefront_order` RPC
- retains customer validation, order confirmation, tracking link and duplicate-submit guard
- removes `Sao chép danh sách`
- keeps optional phone contact
- no DB/schema changes

## Merge boundary

Sky controls merge.
