# SkyHouse — Project State

Snapshot date: **2026-10-01**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main` at task start: `1da1fab945a6f555932ef3d049fa89a70eccb2a9`
- That commit is the merge of PR #34.
- PR #33 remains CLOSED / NOT MERGED / superseded.
- Root continuity files are now part of `main`.

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
- local notification diagnostic trace / safe copy-out instrumentation (current task)

## Supabase / order state

Repository contains migrations for:

- order management
- customer tracking RPCs
- order settlement fields
- orders Realtime publication
- `admin_order_reads`

Previously verified production evidence during the notification chain included:

- `orders` in Supabase Realtime
- `admin_order_reads` table present
- authenticated read/insert access under RLS
- `admin_order_reads` in Realtime

Re-verify before DB-sensitive claims or changes.

## Current active task

`ORDER-OPS-NOTIFY-008 — Runtime acceptance instrumentation`

Branch:

`task/order-ops-notify-008`

PR:

**#35 — Add notification diagnostic trace**

Current implementation adds a local, privacy-safe event trace for the notification path so timing-sensitive behavior can be observed without creating synthetic production orders.

## Validation boundary

Source/build/deploy evidence does not equal browser/runtime or Owner visual PASS.

The remaining acceptance surface includes:

- live Realtime arrival
- polling/reconnect catch-up
- duplicate-alert suppression timing
- unread/read sync across devices
- browser permission flow
- background-tab system notification
- audio behavior
- mobile visual layout

The instrumentation intentionally does not create or mutate production orders.
