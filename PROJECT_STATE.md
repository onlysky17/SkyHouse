# SkyHouse — Project State

## Current checkpoint — 2026-10-07

- Live main / origin/main: `e454dbd39722abed413a54876f96534e73065d20`.
- PR #53 is MERGED at that actual merge commit, mergedAt `2026-10-07T03:20:04Z`; GitHub Vercel status SUCCESS. Its former merge gate is obsolete. Owner visual acceptance is not inferred from merge.
- Active task: `INVENTORY-001`; branch `task/inventory-001`.
- Worktree: `C:\Users\NHAT THIEN\.codex\worktrees\inventory-001\SkyHouse`.
- Original `D:\PRIVATE\APP\SkyHouse` checkout and its five unrelated continuity/rule edits are preserved.
- Implementation: nullable physical stock, low-stock filters, audited Admin adjustments, DB-transaction order accounting with row locks and unique movements, pending-merge product-ID validation, storefront stock limits. Existing form alignment is retained.
- Local PostgreSQL acceptance A-H, role/permission checks, atomic shortage rollback and real concurrent sessions passed. Build, TypeScript and strict checks for the two new TypeScript modules passed. No new dependencies.
- Actual storefront runtime uses 110 real production catalog rows; legacy/unmanaged compatibility and responsive cart were inspected without submitting an order. Sky explicitly accepted `Owner visual acceptance: PASS` on 2026-10-07 for INVENTORY-001 / PR #54. This satisfies the Owner visual gate; it does not establish production inventory runtime acceptance or independently observed authenticated Admin coverage.
- Migration `supabase/migrations/20261007_inventory_management.sql` is source-only, NOT applied to production. Existing products remain NULL/unmanaged until actual Owner counts are entered. No production test/order/stock mutations performed.
- PR #54: https://github.com/onlysky17/SkyHouse/pull/54, Owner visual PASS recorded; ready for review, waiting for explicit Sky merge instruction. Vercel SUCCESS on implementation `422cc2f00c9a23db6a504587f41e919589e37c5e` and pre-acceptance documentation HEAD `fc5986efc3a4ed1e5ab61df942e03be8f51aa442`; preview https://sky-house-ociw854ay-tiansky1917-7468s-projects.vercel.app/admin opens application login directly without provider login; storefront loads 110 real catalog cards. Evidence: `_meta/inventory-001/validation.md`. No merge authorized by visual PASS.

## Carried-forward security boundary

PR #52 implementation is merged. Read-only Supabase verification in INVENTORY-001 confirms migration `20261002093235 harden_pending_order_merge_key`, the hash column and secure seven-argument RPC are deployed; the phone-only RPC is absent. Previous "SQL application unknown" snapshots below are superseded. End-to-end production pending-merge acceptance is not inferred from schema presence or local tests.

## Historical checkpoint (2026-10-02; superseded by live state above)


Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `78c653c133898886b30fbffbd533311ef785eac6`
- PR #51 is merged at that commit.
- No open PR existed when the current security-hardening task started.

## Recent runtime state

- Admin tab-resume jump: CLOSED / RUNTIME VERIFIED.
- Mobile product modal dismissal: CLOSED / RUNTIME VERIFIED.
- `ORDER-OPS-NOTIFY-008`: CLOSED / RUNTIME VERIFIED.
- `ORDER-CHECKOUT-UX-001`: CLOSED / MERGED via PR #50.
- `ORDER-PENDING-MERGE-001`: merged via PR #51, but production runtime acceptance is not complete.

## Production DB state

Migration `merge_pending_storefront_orders` was applied to production after PR #51 merged.

That first implementation matched pending orders using normalized phone only.

Owner selected security rule **A** before runtime acceptance:

- same normalized phone
- same random secret stored only in the customer's browser/device
- latest matching order is still `status = new`
- only then may a later checkout merge into that existing order

A different browser/device using the same phone must create a separate order.

## Current active task

`ORDER-PENDING-MERGE-SEC-001 — bind pending-order merge to same-browser secret`

Branch:

`task/order-pending-merge-sec-001`

Implemented on branch:

- storefront generates a 192-bit random merge token and stores it in localStorage
- token is sent only as RPC input; it is not put in URLs or order text
- DB stores only a SHA-256 hash of the token
- new secure RPC overload requires the token
- phone-only six-argument merge RPC is removed by migration
- legacy orders with no merge-key hash are never silently adopted
- old cached storefront builds safely fall back to create-only checkout when the removed RPC signature is unavailable
- canonical schema includes `customer_merge_key_hash`

## Deployment boundary

The secure migration is committed but **not yet applied to production**.

Do not runtime-test merge behavior until this hardening PR is merged and the migration is applied.
