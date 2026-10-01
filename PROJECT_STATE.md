# SkyHouse — Project State

Snapshot date: **2026-10-01**

This file is a continuity snapshot. Live repository/runtime evidence overrides it.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Last verified product baseline `main`: `fb29fb87185f1c55d7dc3031b579016878aebe32`
- That commit is the merge of PR #32.
- PR #33 was closed **without merge** because it used the wrong nested-`project/` approach.
- Correct continuity work is being placed directly in the repository root.

## Stack

- React 18
- Vite 6
- TypeScript
- Supabase
- Vercel
- GitHub → Vercel deployment integration

Current package scripts known from repository:

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

Re-verify before making DB-sensitive claims or changes.

## Current product task

**None authorized after `ORDER-OPS-NOTIFY-007` at this snapshot.**

Current repository-infrastructure work:

`PROJECT-CONTINUITY-001 — root-level agent/Work continuity files`

This infrastructure task does not authorize a new product feature.

## Validation gaps carried forward

Notification implementation has strong Git/build/deploy/schema evidence, but browser permission, background-tab behavior, audio policy, multi-device timing, reconnect timing, and final visual UX are not automatically Owner visual PASS.
