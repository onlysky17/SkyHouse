# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current authorized work

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

## Completed runtime evidence

After PR #36 deployed:

- authenticated admin dashboard is responsive
- order panel opens normally
- Realtime reports stable
- browser notification permission is granted
- background notifications are enabled
- local self-test shows toast
- browser/system notification is visibly delivered
- diagnostic trace records subscription, connected state, granted permission and self-test execution

No synthetic production order was created.

## Current next step

The next safe, non-order-mutating check is reconnect behavior:

1. keep the admin order panel open
2. temporarily take the browser/network offline
3. confirm status changes to offline and the trace records it
4. restore network
5. confirm catch-up/reconnect returns to stable/connected
6. inspect the diagnostic trace

After that, the remaining cases require a real/new order:

- Realtime arrival
- duplicate-alert suppression
- unread/read synchronization across devices

With production currently at 0 orders, wait for a naturally occurring order unless Sky explicitly authorizes synthetic production test data.

## Evidence boundary

The self-test proves the application executed its audio path, but only Owner hearing the sound confirms audible-output PASS.

Do not mark the remaining order-dependent cases PASS without runtime evidence.
