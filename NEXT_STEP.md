# SkyHouse — Next Step

## Current active task

`ORDER-PENDING-MERGE-001`

## Implemented

1. Storefront snapshots include product identity.
2. New `submit_storefront_order` RPC can reuse the latest same-phone `new` order.
3. Existing and incoming items are merged with quantity accumulation.
4. Storefront distinguishes a newly created order from `Đã bổ sung vào đơn #...`.
5. Admin subscribes to order UPDATE events and alerts when a customer appends items.
6. A customer append makes the order unread again.
7. Direct checkout falls back to the old RPC until the new DB migration is deployed.

## Next step

1. Verify Vercel preview/build.
2. Review branch diff.
3. Open PR.
4. Stop at Sky merge gate.
5. After merge:
   - apply `20261002_merge_pending_storefront_orders.sql` to production Supabase
   - verify migration is present
   - run one Owner-directed real checkout against an existing `new` order
   - confirm same order ID is reused, items/subtotal update, admin alert fires, and no second order row is created

Do not merge or mutate historical production orders automatically.
