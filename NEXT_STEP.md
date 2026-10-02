# SkyHouse — Next Step

## Current active task

`ORDER-CHECKOUT-UX-001 — direct storefront order placement`

## Implemented

1. Primary cart CTA is `Đặt hàng`.
2. Clicking it validates customer information and directly saves the order through the existing storefront RPC.
3. No clipboard copy is required.
4. Zalo is no longer opened automatically by checkout.
5. `Sao chép danh sách` is removed.
6. `Gọi Sky` remains optional.
7. Success still shows order number and direct tracking link.
8. Existing duplicate-submit reuse protection remains.

## Next step

1. Verify branch diff.
2. Wait for Vercel preview/build success.
3. Open PR.
4. Stop at Owner merge gate.
5. After merge, run one storefront checkout validation using a normal order flow and confirm:
   - button reads `Đặt hàng`
   - no Zalo/clipboard step appears
   - order reaches admin
   - confirmation + tracking link appear

Do not create synthetic production orders outside an explicit Owner-directed runtime test.
