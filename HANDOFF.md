# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main at task start:

`d94162bdc80ff630f42bb7770822c4fbaa51e853`

PR #50 is merged.

## Current active task

`ORDER-PENDING-MERGE-001`

Branch:

`task/order-pending-merge-001`

## Owner intent

If the same customer places more items while their latest order is still `new`, append those items to that pending order rather than creating another order.

Once the prior order is no longer `new`, the next checkout must create a fresh order.

## Implementation

- new DB RPC: `submit_storefront_order`
- same-phone pending lookup uses normalized digits
- concurrent same-phone checkout is serialized
- items merge by normalized name + unit for legacy compatibility
- quantities accumulate and current product metadata wins
- subtotal is recalculated
- final total is invalidated after customer changes
- customer append resets read state for that order
- storefront shows merged-order confirmation
- admin Realtime handles order UPDATE and announces customer append
- DB migration is committed but not yet applied to production

## Production safety

Do not retroactively merge existing orders #2/#3.
Do not apply the production migration before Owner merge.

## Merge boundary

Sky controls merge.
