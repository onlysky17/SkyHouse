# SkyHouse — Task Ledger

Live Git evidence overrides this file if stale.

| Task | State | PR | Merge commit |
| --- | --- | --- | --- |
| `CART-UX-001` | CLOSED / MERGED | #40 | `400d5dc41726fa688828f657fc46631b1e20937e` |
| `ADMIN-ORDER-PACKING-UX-001` | CLOSED / MERGED | #41 | `0396ad59c0f9e0f6959c4e03eb6eee46ab281bdb` |
| `ADMIN-SCROLL-PRESERVE-001` | MERGED / RUNTIME INCOMPLETE | #42 | `581a13d3d381511edc54244dd6d8eb3bba72dfd6` |
| `ADMIN-SCROLL-PRESERVE-002` | MERGED / RUNTIME INCOMPLETE | #43 | `a5ca9dc0eff9028e40e523a969cb5963a4b75f61` |
| `ADMIN-RESUME-NO-RERENDER-001` | MERGED / RUNTIME INCOMPLETE | #44 | `6d4ec7a4ae585b9d9e5ef14de2e02a68290af1cd` |
| `ADMIN-RESUME-HEALTH-ONLY-001` | ACTIVE | pending | pending |

## Active task

`ADMIN-RESUME-HEALTH-ONLY-001`

Scope:
- remove full-panel render from Realtime state changes
- update only health/diagnostic chrome in place
- keep catch-up and notification behavior intact
- preserve order/cart business logic

`ORDER-OPS-NOTIFY-008` remains partial pending real-order acceptance cases.
