# SkyHouse — Project State

Snapshot date: **2026-10-02**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current verified canonical `main`: `f228de79aa40885e535bd76e216183e1e957eed2`
- PR #39 merged at that commit; PR #38 remains merged at `f296da213eddf20a08c62265e4eff58800b9c9c4`.
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
- reconnect behavior:
  - network loss caused expected fetch failures
  - app entered fallback/degraded state
  - network restoration caused Realtime to re-subscribe
  - trace recorded degraded → connecting → connected
  - final status returned to `Realtime ổn định`
- reconnect stale-banner regression after PR #38:
  - red `Failed to fetch` notice appeared during network loss
  - after recovery and successful reload, the red notice automatically disappeared
  - trace recorded `Tải đơn thành công sau lỗi mạng; đã xóa cảnh báo lỗi cũ.`

No synthetic production order was created.

## Closed runtime bugfixes

`ADMIN-RUNTIME-FREEZE-001`

- CLOSED / runtime verified
- PR #36
- merge `57d195253473a44a92911cb14d46e297c7fd35a7`

`ORDER-OPS-RECONNECT-UX-001`

- CLOSED / runtime verified
- PR #38
- merge `f296da213eddf20a08c62265e4eff58800b9c9c4`

## Current active task

`CART-UX-001 — Redesign mobile cart item presentation`

- Owner explicitly authorized this task on 2026-10-02.
- Branch: `task/cart-ux-001`, based on verified PR #39 merge.
- PR: [#40](https://github.com/onlysky17/SkyHouse/pull/40), OPEN / NOT MERGED.
- Implementation and local validation complete; **OWNER VISUAL REVIEW / MERGE GATE**.
- Cart cards show 88–96px images, name/category/unit/price, larger quantity controls, item-specific removal and item totals.
- Unpriced items carry the exact Owner-requested notice; the summary separates known-price subtotal from final confirmation and shows quantity/product count.
- Items and customer information share one scroller; summary and `Sao chép đơn & mở Zalo` stay visible.
- Existing cart persistence, quantity cap, order snapshot, customer validation and submission behavior are preserved.
- Build and TypeScript check passed. Real-catalog UI checks passed at 320×640, 375×667, 390×844, 414×896, 390×500 and 1280×800.
- Evidence and screenshots: `_meta/cart-ux-001/validation.md`.
- No production order was submitted. No merge or production deployment performed; Owner visual PASS is pending.
- Original checkout's unrelated notification-continuity WIP is preserved; this task uses a separate managed worktree.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

State:

**PARTIAL RUNTIME PASS / ORDER-DEPENDENT CASES PENDING**

Still unverified:

- audible sound actually heard by Owner
- real order Realtime arrival
- duplicate suppression on a real/new order
- unread/read synchronization across devices

The remaining order-dependent cases require a naturally occurring order or explicit Owner authorization for synthetic production test data.
