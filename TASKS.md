# SkyHouse — Task Ledger

Live Git evidence overrides this file if stale.

| Task | State | PR | Merge commit |
| --- | --- | --- | --- |
| `ORDER-OPS-001` — search / analytics / CSV | CLOSED | #23 | `c10afb9ea038a05ff8da0a5b965b3180737cf266` |
| `ORDER-TRACKING-001` — customer tracking | CLOSED | #24 | `e01b40c3dac56bb5d7ca57917b72070d3e3ceba4` |
| `ORDER-CUSTOMER-FLOW-002` — checkout confirmation + direct tracking | CLOSED | #25 | `271bbcc11379be75ab866925eaf5b2854a6ba59f` |
| `ORDER-OPS-NOTIFY-001` — Realtime alerts | CLOSED | #26 | `aa9821b7fabbffecf49e4b70d57f1adbed9c6b94` |
| `ORDER-OPS-NOTIFY-002` — notification hardening | CLOSED | #27 | `72fe25fc3d458e47a3371e3a178085037f2b9cff` |
| `ORDER-OPS-NOTIFY-003` — unread inbox controls | CLOSED | #28 | `1a2f31c9436cc029a7dd96555317d5b114cef7b9` |
| `ORDER-OPS-NOTIFY-004` — cross-device read sync | CLOSED | #29 | `c3a3572cc8014275798ca66e3d8d29179b78a904` |
| `ORDER-OPS-NOTIFY-005` — diagnostics/self-test | CLOSED | #30 | `4862d49ae9db0789e6be1a9cb43a900113313745` |
| `ORDER-OPS-NOTIFY-006` — optional browser background notification | CLOSED | #31 | `1bde18c509d1e8b232809bcc8d42311a5ba9cb08` |
| `ORDER-OPS-NOTIFY-007` — duplicate-alert lifecycle | CLOSED | #32 | `fb29fb87185f1c55d7dc3031b579016878aebe32` |
| `PROJECT-CONTINUITY-001` — root-level Work/agent continuity | CLOSED | #34 | `1da1fab945a6f555932ef3d049fa89a70eccb2a9` |
| `ORDER-OPS-NOTIFY-008` — runtime acceptance instrumentation | PARTIAL RUNTIME PASS | #35 | `af71874517eba99604630ecc2a41b360a022cb1e` |
| `ADMIN-RUNTIME-FREEZE-001` — admin MutationObserver freeze fix | CLOSED / RUNTIME VERIFIED | #36 | `57d195253473a44a92911cb14d46e297c7fd35a7` |
| `RUNTIME-ACCEPTANCE-EVIDENCE-001` — acceptance continuity update | CLOSED | #37 | `606b1ee323106d8b35866de81658eb036a9f5180` |
| `ORDER-OPS-RECONNECT-UX-001` — clear stale reconnect error banner | ACTIVE / MERGE GATE | pending | pending |

## Reconnect test result

PASS for reconnect/catch-up transport behavior:

- offline period caused expected fetch failures
- app entered fallback/degraded state
- network restoration caused Realtime re-subscribe
- trace showed degraded → connecting → connected
- final state returned to `Realtime ổn định`

## Active task

`ORDER-OPS-RECONNECT-UX-001`

Bug found during reconnect test:

- stale `Failed to fetch` banner remains after recovery

Fix:

- clear only that stale order-fetch notice after a successful reload
- retain all unrelated admin notices

## Remaining ORDER-OPS-NOTIFY-008 validation

- Owner audible-sound confirmation
- real-order Realtime arrival
- dedupe on real/new order
- cross-device unread/read sync

Do not create synthetic production orders unless Sky explicitly authorizes it.
