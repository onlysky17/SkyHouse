# SkyHouse — Agent Handoff

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
