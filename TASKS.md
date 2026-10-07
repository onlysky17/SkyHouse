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
| `ORDER-PENDING-MERGE-001` | MERGED / SECURITY HARDENING REQUIRED | #51 | `78c653c133898886b30fbffbd533311ef785eac6` |
| `ORDER-PENDING-MERGE-SEC-001` | MERGED / RUNTIME ACCEPTANCE NOT REVERIFIED | #52 | `b99ce9c7004ddad3d3b77a277de4486670392023` |
| `ADMIN-FORM-ALIGNMENT-AUDIT-001` | IMPLEMENTED / ADMIN RUNTIME + OWNER VISUAL PENDING | #53 (draft) | not merged |

## Active task — 2026-10-07

`ADMIN-FORM-ALIGNMENT-AUDIT-001`. Build/TypeScript and public runtime verified; source-derived layout evidence is recorded in `_meta/admin-form-alignment-audit-001/validation.md`. Authenticated changed-build Admin/Orders and Sky visual acceptance remain pending. Stop before merge.

## Prior security task context (preserved history)

`ORDER-PENDING-MERGE-SEC-001`

Owner security rule A:
- same phone alone is insufficient
- merge requires the same browser/device secret
- secret is random and never stored server-side in plaintext
- different browser/device with the same phone must not modify an existing pending order

Runtime merge acceptance waits for this hardening to be deployed.
