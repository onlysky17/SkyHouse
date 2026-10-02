# SkyHouse — Project State

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
