# SkyHouse — Agent Handoff

## Current handoff — INVENTORY-001 — 2026-10-07

- Owner Sky; repo `onlysky17/SkyHouse`; verified original workspace `D:\PRIVATE\APP\SkyHouse`. Original branch/HEAD `task/order-ops-notify-008-runtime-acceptance` / `af71874517eba99604630ecc2a41b360a022cb1e`, with five unrelated tracked document edits, preserved.
- Actual main/origin/main `e454dbd39722abed413a54876f96534e73065d20`: PR #53 merged, Vercel SUCCESS. No open PR at task start. Prior alignment merge gate is obsolete; visual acceptance is not inferred from merge.
- Isolated managed worktree `C:\Users\NHAT THIEN\.codex\worktrees\inventory-001\SkyHouse`, branch `task/inventory-001`. Stage exact task paths only, exclude dist/node_modules and all original/other-task WIP.
- Implemented nullable physical stock and thresholds, authenticated audited adjustments/history/filters, stable product locks + unique per-order/product movements, final pending-snapshot accounting, legacy exemption, storefront limits and stale checkout cache status verification. Managed units are immutable; preserve history by hiding products with ledger records rather than deleting them.
- Build and TypeScript passed, including strict standalone compile of new InventoryEditor/inventory helpers. Local PostgreSQL 17.6 acceptance A-H + security/retry/atomic rollback/concurrent confirmations passed. No package/test/lint scripts added; existing bundle-size warning remains.
- Latest isolated SQL evidence database: `skyhouse_inventory_1791346736686`, container `skyhouse-inventory-001-db`, label `skyhouse.task=INVENTORY-001`, network none, no exposed ports. Run local SQL with PowerShell 7 `./tests/inventory/run-local.ps1`; it rejects other containers. Test-only fixtures never touched production. Retain container/databases for review.
- Read-only live Supabase: project `bophfdnkncirvsknvnho`, 110 products, 6 orders, 3 order snapshots missing product IDs. Secure pending merge migration is applied; only seven-argument token RPC exists. Inventory columns/movements absent. Inventory source migration NOT applied to production.
- Actual local storefront loaded 110 real catalog products. Cart of real public product #51 at 1440/768/320 widths retained its controls/CTA without horizontal overflow. No checkout submitted; no product/order/status/read-marker/stock production writes.
- Local task-owned headless Vite session 46005: `http://127.0.0.1:5183/admin` (Owner login pending). Existing alignment port 5182/process/session and previous production sessions left intact. Public connector configuration supplied only to process environment; no .env/secrets read or changed.
- Authenticated changed-build Admin and managed-stock visual/runtime remain unverified; do not mark Owner visual PASS. Owner login requested once, no credentials requested. Browser Admin tab retained for handoff; storefront tab retained with actual cart evidence.
- GitHub connector unavailable; authenticated gh used for remote evidence/publication. Vercel connector returned 403; GitHub Vercel commit/deployment evidence used without provider dashboard login.
- Draft PR #54: https://github.com/onlysky17/SkyHouse/pull/54, OPEN/unmerged. Implementation `422cc2f00c9a23db6a504587f41e919589e37c5e`: Vercel SUCCESS, Preview deployment 6901625462. Actual preview https://sky-house-ociw854ay-tiansky1917-7468s-projects.vercel.app/admin opens application login; storefront loads 110 real cards, no error/overflow. Authenticated Admin still pending.
- Evidence and matrix: `_meta/inventory-001/validation.md`, actual cart screenshot/measurements. Implementation + evidence/tests are committed; later continuity-only publication evidence does not change application code.
- Next: Owner draft review and authenticated UI/visual coverage. Merge only on explicit Sky instruction. Production schema/stock/test-data changes require separate authorization; exact proposed changes are in NEXT_STEP.md. No automatic migration or synthetic production orders.

## Prior alignment handoff (superseded by PR #53 merge; validation gaps retained)

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
- Remaining: authenticated changed-build Admin + permitted Orders runtime inspection, then Sky visual acceptance. Draft PR #53: https://github.com/onlysky17/SkyHouse/pull/53. Vercel SUCCESS on d83ae3aaaa48b9a485a9b44df57c0d7149a898b2; preview https://sky-house-2xk3qq64e-tiansky1917-7468s-projects.vercel.app/admin opens the app Admin login directly. No merge.
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
