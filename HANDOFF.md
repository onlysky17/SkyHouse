# SkyHouse — Agent Handoff

## Current handoff — 2026-10-07

- Active task: `ADMIN-FORM-ALIGNMENT-AUDIT-001`.
- Branch: `task/admin-form-alignment-audit-001`, based on live main `b99ce9c7004ddad3d3b77a277de4486670392023` (PR #52 actual merge commit).
- Managed worktree: `C:\Users\NHAT THIEN\.codex\worktrees\admin-form-alignment-audit-001\SkyHouse`.
- Preserve the original checkout's unrelated WIP. Only exact reviewed paths may be staged.
- Implementation: final-import shared CSS for top-aligned field grids, intrinsic label rows, consistent contextual control heights and helper placement. No dependencies/business logic/schema/auth/notification changes.
- Build and TypeScript compile passed. No test/lint scripts exist. Existing bundle-size warning remains.
- Actual public runtime inspected: Cart, Tracking, Login, storefront search/filter across desktop/tablet/mobile. Cart empty-form validation stopped before RPC; no orders submitted.
- Authenticated production Admin reproduced the bug. Changed-build product layout verified with a blank source-derived harness; do not confuse it with authenticated Admin runtime acceptance.
- Production Admin session is retained. Changed local /admin needs separate Owner sign-in. Headless local Vite runs on port 5182 (task-owned session 12536); public connection settings supplied only to process environment, no .env read/change.
- Admin Orders viewing may persist read markers; avoid it under no-production-writes scope. No status/settlement/product data mutation was performed.
- Evidence/reproduction generator: `_meta/admin-form-alignment-audit-001/`; generated HTML is local-only and intentionally unstaged.
- Remaining: authenticated changed-build Admin + permitted Orders runtime inspection, then Sky visual acceptance. PR/check links will be recorded after creation. No merge.
- Prior secure merge implementation: PR #52 MERGED; SQL application/runtime acceptance not reverified here.

## Historical handoff (2026-10-02; superseded by the current checkpoint)


Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main:

`78c653c133898886b30fbffbd533311ef785eac6`

PR #51 is merged.

Production migration `merge_pending_storefront_orders` was applied after merge, but Owner stopped runtime acceptance and selected stronger security rule A.

## Current active task

`ORDER-PENDING-MERGE-SEC-001`

Branch:

`task/order-pending-merge-sec-001`

## Security decision

Pending-order merge requires:

- same normalized customer phone
- same random browser/device merge token
- existing order still `new`

The token is generated client-side and persisted locally. Production stores only SHA-256.

A different device/browser using the same phone must create a new order.

Legacy orders without a merge hash are intentionally not claimed by the new browser secret.

## Deployment state

- branch Vercel: SUCCESS
- secure DB migration: committed, NOT yet applied to production
- current production still has the earlier phone-only RPC until this PR is merged and migration is applied

## Merge boundary

Sky controls merge.
