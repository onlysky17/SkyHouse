# SkyHouse — Project State

Snapshot date: **2026-10-01**

This is a continuity snapshot, not a substitute for live Git/runtime verification.

## Repository

- Repository: `onlysky17/SkyHouse`
- Snapshot source branch: `main`
- Snapshot source HEAD: `fb29fb87185f1c55d7dc3031b579016878aebe32`
- At snapshot time: **no open PRs**
- Last merged product task: `ORDER-OPS-NOTIFY-007`
- Last merged PR: **#32 — Deduplicate admin order alerts**

Always re-check live `main`, open PRs, deployment status, and production DB before continuing.

## Stack

- React 18
- Vite 6
- TypeScript
- Supabase
- Vercel
- GitHub → Vercel automatic deployments

Package scripts currently include:

- `npm run dev`
- `npm run build`
- `npm run preview`

No dedicated automated test script is currently declared in `package.json`.

## Main product surfaces

- Storefront
- Cart / customer information flow
- Order creation
- Customer order tracking
- Authenticated admin product/order management
- Order search / date filtering / CSV export
- Realtime new-order alerts
- Admin unread inbox
- Cross-device admin read-state sync
- Notification diagnostics / self-test
- Optional browser background notifications while the admin tab remains open
- Duplicate-alert suppression across Realtime / fallback overlap

## Supabase order-related state

Repository migrations include:

- order management fields
- order tracking RPCs
- orders Realtime publication
- `admin_order_reads` for per-admin read state

Known production evidence from the completed notification work:

- `orders` is published to Supabase Realtime
- `admin_order_reads` exists
- authenticated users have the intended SELECT / INSERT privileges on `admin_order_reads`
- per-user RLS policies exist
- `admin_order_reads` is published to Realtime

Do not assume these remain unchanged; verify before DB-sensitive work.

## Deployment

Vercel is the deployment target and GitHub branches/PRs receive Vercel deployment checks.

A green Vercel deployment is build/deploy evidence only. It is not automatic visual or Owner PASS.

## Current authorization state

At this snapshot, there is **no active authorized product task after ORDER-OPS-NOTIFY-007**.

The creation of the `project/` continuity folder is repository/project-infrastructure work, not a product-roadmap change.
