# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main at task start:

`581a13d3d381511edc54244dd6d8eb3bba72dfd6`

That is PR #42 merge.

## Current active task

`ADMIN-SCROLL-PRESERVE-002`

Branch:

`task/admin-scroll-preserve-002`

PR #42 preserved absolute scroll state but Owner runtime testing showed a remaining jump specifically when returning from another tab while positioned near the bottom.

Refined implementation:
- capture distance from bottom
- restore near-bottom position using that gap
- repeat restore after two animation frames so layout has settled
- cancel stale delayed restores with a render epoch
- disable native scroll anchoring on `.adminOrdersDetail`
- retain list/filter/diagnostic/focused-field state preservation

No DB/schema/auth/order mutation.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains partial until a real/new order is available for arrival/dedupe/cross-device checks.

## Merge boundary

Sky controls merge. Green preview does not equal runtime PASS.
