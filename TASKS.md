# SkyHouse — Task Ledger

Live Git evidence overrides this file if stale.

| Task | State | PR | Merge commit |
| --- | --- | --- | --- |
| `CART-UX-001` | CLOSED / MERGED | #40 | `400d5dc41726fa688828f657fc46631b1e20937e` |
| `ADMIN-ORDER-PACKING-UX-001` | CLOSED / MERGED | #41 | `0396ad59c0f9e0f6959c4e03eb6eee46ab281bdb` |
| `ADMIN-SCROLL-PRESERVE-001` | MERGED / RUNTIME INCOMPLETE | #42 | `581a13d3d381511edc54244dd6d8eb3bba72dfd6` |
| `ADMIN-SCROLL-PRESERVE-002` | MERGED / RUNTIME INCOMPLETE | #43 | `a5ca9dc0eff9028e40e523a969cb5963a4b75f61` |
| `ADMIN-RESUME-NO-RERENDER-001` | MERGED / RUNTIME INCOMPLETE | #44 | `6d4ec7a4ae585b9d9e5ef14de2e02a68290af1cd` |
| `ADMIN-RESUME-HEALTH-ONLY-001` | CLOSED / RUNTIME VERIFIED | #45 | `0c2922cc55e1c9e33e87170d2c7716fcf487121e` |
| `ADMIN-RESUME-CLOSE-001` | CLOSED / MERGED | #46 | `0d19680d8abcf2e591b34c92e891d2fc9436bbf4` |
| `MOBILE-PRODUCT-MODAL-UX-001` | ACTIVE | pending | pending |

## Notification acceptance

- Realtime new-order arrival: PASS from a real order.
- Cross-browser/device read-state sync: PASS.
- Duplicate-alert suppression: PENDING explicit runtime confirmation.

## Active task

`MOBILE-PRODUCT-MODAL-UX-001`

Scope:
- keep close control reachable on phones
- 48×48 touch target
- contain modal scrolling and lock background page scroll
- preserve backdrop close and add Escape close
- no product/cart/order business-logic changes
