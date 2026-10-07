# SkyHouse — Project State

## Current checkpoint — 2026-10-07

- Live main / origin/main: `b99ce9c7004ddad3d3b77a277de4486670392023`.
- PR #52 is MERGED at that actual merge commit (live GitHub verification).
- Active task: `ADMIN-FORM-ALIGNMENT-AUDIT-001`; branch `task/admin-form-alignment-audit-001`.
- Worktree: `C:\Users\NHAT THIEN\.codex\worktrees\admin-form-alignment-audit-001\SkyHouse`.
- Original `D:\PRIVATE\APP\SkyHouse` checkout and its five unrelated continuity/rule edits are preserved.
- Shared CSS aligns field wrappers at the top, keeps helper text below controls, and equalizes controls within each form context. No business logic or production data changes.
- Local build and TypeScript compile passed. Browser evidence covers source-derived product layout plus actual Cart, Tracking, Login and catalog controls.
- Production authenticated Admin confirms the original misalignment. Authenticated Admin on the changed build and Sky visual acceptance remain pending; this is not a visual PASS for all Admin forms.
- Evidence: `_meta/admin-form-alignment-audit-001/validation.md`.
- PR/check URL will be recorded after creation. Do not merge without Sky's explicit instruction.

## Carried-forward security boundary

PR #52 implementation is merged; its previous merge gate is obsolete. Production application of the secure SQL migration and pending-order runtime acceptance were not reverified in this UI task. Preserve that gap; do not apply migrations or generate orders here.

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
