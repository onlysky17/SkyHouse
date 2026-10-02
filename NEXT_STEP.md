# SkyHouse — Next Step

## Current active task

`ORDER-PENDING-MERGE-SEC-001`

## Implemented

1. Storefront creates/persists a random browser merge token.
2. Secure checkout sends that token to `submit_storefront_order`.
3. DB stores only SHA-256 of the token.
4. Pending-order lookup requires both normalized phone + token hash.
5. Legacy tokenless orders are not adopted.
6. Phone-only merge RPC signature is dropped.
7. Canonical schema includes the hash column.
8. Vercel branch build/deployment is successful.

## Next step

1. Open PR.
2. Stop at Sky merge gate.
3. After merge:
   - apply `20261002_harden_pending_order_merge_key.sql` to production Supabase
   - verify the old six-argument merge RPC is gone
   - verify the seven-argument secure RPC exists
4. Then run Owner-directed runtime acceptance:
   - first checkout from browser A creates a new token-bound order
   - second checkout from browser A + same phone merges into it
   - browser B + same phone creates a different order
   - once the browser-A order leaves `new`, browser A creates a fresh order next time

Do not retroactively attach legacy orders to a new browser token.
