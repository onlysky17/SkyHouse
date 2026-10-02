# SkyHouse — Next Step

## Current active task

`ADMIN-ORDER-PACKING-UX-001 — improve packing list clarity`

Branch:

`task/admin-order-packing-ux-001`

## Implemented

1. Admin order items now render the snapshot's `image_url`.
2. Old/missing-image snapshots receive a neutral fallback.
3. Desktop/mobile thumbnail sizing is defined for packing readability.
4. Settlement field labels use `align-content:start`.
5. Numeric settlement inputs have a consistent minimum height.

## Next step

1. Verify branch diff is only the intended admin UI + continuity changes.
2. Wait for Vercel preview/build success.
3. Open PR.
4. Stop at Owner visual/merge gate.
5. After merge, verify production admin with a real order that contains product images.

No synthetic production order is authorized.
