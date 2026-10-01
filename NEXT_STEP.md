# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current authorized work

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

## Completed runtime evidence

After PR #38 deployed:

- authenticated admin dashboard is responsive
- order panel opens normally
- Realtime reports stable
- browser notification permission is granted
- background notifications are enabled
- local self-test shows toast
- browser/system notification is visibly delivered
- reconnect/fallback/catch-up is verified
- stale `Failed to fetch` banner now disappears automatically after successful recovery
- diagnostic trace records the successful recovery event

No synthetic production order was created.

## Current next step

The remaining transport/UI checks are complete.

Remaining acceptance depends on a real/new order:

1. observe Realtime arrival
2. verify duplicate-alert suppression
3. verify unread/read synchronization across two devices

If production still has no orders, wait for a naturally occurring order unless Sky explicitly authorizes synthetic production test data.

## Audio evidence boundary

The app self-test executed its audio path.

Only Sky confirming that the sound was actually heard can mark audible-output PASS.

## Continuity rule

If no real order is available, do not invent a replacement validation path and do not create production test data without Owner authorization.
