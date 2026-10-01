# SkyHouse — Project State

Snapshot date: **2026-10-01**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `af71874517eba99604630ecc2a41b360a022cb1e`
- PR #35 is merged at that commit.
- PR #33 remains CLOSED / NOT MERGED / superseded.
- Root continuity files are part of `main`.

## Stack

- React 18
- Vite 6
- TypeScript
- Supabase
- Vercel
- GitHub → Vercel deployment integration

Known package scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`

No dedicated automated test script was present in the last verified `package.json`.

## Main product surfaces

- storefront/catalog
- cart/customer information
- storefront order creation
- post-checkout confirmation
- customer order tracking
- authenticated admin
- admin order management
- order search/date filters/CSV export
- settlement/admin-note handling
- Realtime new-order notifications
- unread order inbox
- cross-device read-state sync
- notification diagnostics/self-test
- optional browser background notifications while admin tab remains open
- duplicate-alert suppression
- local notification diagnostic trace / safe copy-out instrumentation

## Supabase / order state

Repository contains migrations for:

- order management
- customer tracking RPCs
- order settlement fields
- orders Realtime publication
- `admin_order_reads`

Verified on 2026-10-01 during runtime investigation:

- SkyHouse Supabase project is active/healthy.
- Admin auth account exists and password login succeeded.
- Authenticated requests to `products` and `orders` returned HTTP 200.
- Current production order count was 0 at the time of validation.

## Current active task

`ADMIN-RUNTIME-FREEZE-001 — stop admin page MutationObserver loop`

Base:

`af71874517eba99604630ecc2a41b360a022cb1e`

Branch:

`task/admin-runtime-freeze-001`

Observed production symptom:

- admin login succeeds at Supabase
- browser then becomes unresponsive / input cannot be used
- Chrome shows “Trang không phản hồi”

Root cause identified in `src/admin-orders.ts`:

- a body-wide `MutationObserver` calls `ensureTrigger`
- when the admin order trigger already exists, `ensureTrigger` called `renderNotificationState`
- `renderTrigger` unconditionally rewrote badge `textContent`
- rewriting the text node emits another child-list mutation
- the observer immediately runs again, creating a self-sustaining main-thread mutation loop after the authenticated admin toolbar appears

Current fix guards DOM writes and avoids re-rendering the existing trigger on every observed mutation.

## Validation boundary

The source-level root cause is identified and patched on the task branch.

Still required before task closure:

- Vercel preview/build success
- browser confirmation that admin login no longer freezes
- then resume notification runtime acceptance

No synthetic production order is authorized.
