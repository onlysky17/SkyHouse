# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `0d19680d8abcf2e591b34c92e891d2fc9436bbf4`
- PR #46 is merged.
- No open PR existed when the current task started.

## Recent runtime state

- Admin tab-resume jump: CLOSED / RUNTIME VERIFIED after PR #45.
- A real new order arrived while admin was open and triggered the new-order banner/count update.
- Cross-browser read-state behavior is verified from the prior seen-state test and the new unread-state observation.
- Duplicate-alert suppression still needs explicit runtime confirmation.

## Current active task

`MOBILE-PRODUCT-MODAL-UX-001`

Owner symptom:
- on phone, product detail is easy to open but hard to dismiss after scrolling

Implemented on branch `task/mobile-product-modal-ux-001`:
- mobile close control stays fixed to the viewport/safe area
- touch target increased to 48×48
- product modal scroll is contained
- background page scroll is locked while modal is open
- backdrop tap still closes
- Escape closes on desktop
- dialog/close accessibility labels added

No product/cart/order business logic changed.
