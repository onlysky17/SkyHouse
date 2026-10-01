# SkyHouse — Project State

Snapshot date: **2026-10-01**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `57d195253473a44a92911cb14d46e297c7fd35a7`
- PR #36 merged at that commit.
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

Verified on 2026-10-01:

- SkyHouse Supabase project is active/healthy.
- Admin password login succeeds.
- Authenticated `products` and `orders` requests return HTTP 200.
- Production order count was 0 during this acceptance session.

## Runtime acceptance evidence

`ADMIN-RUNTIME-FREEZE-001` is resolved in production by PR #36.

Owner/runtime evidence after deployment:

- admin dashboard renders and remains responsive
- order panel opens
- Realtime status reports stable/connected
- browser notification permission is granted
- background notification setting is enabled
- local self-test produced an in-page toast
- local self-test executed the audio path
- a browser/system notification was visibly delivered
- diagnostic trace recorded:
  - Supabase Realtime subscribed
  - Realtime connecting → connected
  - background notification permission = granted
  - self-test with toast + audio + system notification

No synthetic production order was created.

## Current active task

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

State:

**PARTIAL RUNTIME PASS / ORDER-DEPENDENT CASES PENDING**

Still unverified:

- audible sound actually heard by Owner
- offline → online reconnect/catch-up trace
- real order Realtime arrival
- duplicate suppression on a real/new order
- unread/read synchronization across devices

The order-dependent cases cannot be exercised with the current zero-order production state without either a naturally occurring order or explicit Owner authorization for synthetic production test data.
