# SkyHouse — Task Ledger

Live Git evidence overrides this file if stale.

| Task | State | PR | Merge commit |
| --- | --- | --- | --- |
| `CART-UX-001` | CLOSED / MERGED | #40 | `400d5dc41726fa688828f657fc46631b1e20937e` |
| `ADMIN-ORDER-PACKING-UX-001` | CLOSED / MERGED | #41 | `0396ad59c0f9e0f6959c4e03eb6eee46ab281bdb` |
| `ADMIN-RESUME-HEALTH-ONLY-001` | CLOSED / RUNTIME VERIFIED | #45 | `0c2922cc55e1c9e33e87170d2c7716fcf487121e` |
| `MOBILE-PRODUCT-MODAL-UX-001` | CLOSED / RUNTIME VERIFIED | #47 | `80316bf5f5200e5ed6e7f9de2a6b66f7c9c3953f` |
| `ORDER-OPS-NOTIFY-008` | CLOSED / RUNTIME VERIFIED | #49 closeout | `554fe5d74a5a904483629570e26a1631339f1735` |
| `ORDER-CHECKOUT-UX-001` | CLOSED / MERGED | #50 | `d94162bdc80ff630f42bb7770822c4fbaa51e853` |
| `ORDER-PENDING-MERGE-001` | ACTIVE | pending | pending |

## Active task

`ORDER-PENDING-MERGE-001`

Acceptance target:
- repeat checkout from same normalized phone merges into latest `new` order
- same products add quantities; new products append
- customer receives the existing order number with a merged message
- admin receives one Realtime update alert and the order becomes unread again
- if existing order is already confirmed/shipping/completed/cancelled, a new order is created
- no automatic merge of historical orders is performed
