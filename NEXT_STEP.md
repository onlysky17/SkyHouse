# SkyHouse — Next Step

## Current active task

`ADMIN-SCROLL-PRESERVE-001 — preserve admin order position across tab switches`

Branch:

`task/admin-scroll-preserve-001`

## Implemented

1. Capture order-detail and order-list scroll positions before a panel rerender.
2. Preserve filter horizontal position.
3. Preserve diagnostic trace open state and trace scroll position.
4. Restore detail scroll only if the same order is still selected.
5. Preserve the active settlement field value/focus/selection without scrolling it into view.
6. Keep normal behavior when the Owner deliberately selects a different order.

## Next step

1. Verify branch diff only contains this admin UI-state fix + continuity.
2. Wait for Vercel preview/build success.
3. Open PR.
4. Stop at Owner merge gate.
5. After merge, production-test: scroll down in an order → switch browser tab → return → verify the same position is retained.

No synthetic production order is authorized.
