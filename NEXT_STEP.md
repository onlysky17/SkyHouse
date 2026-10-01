# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current active task

`ORDER-OPS-RECONNECT-UX-001 — clear stale fetch error after reconnect`

## Why this task exists

Owner reconnect test successfully proved:

- fallback/degraded behavior during network loss
- Realtime reconnection after network restoration
- return to stable connected state

But the UI kept showing:

`Không tải được đơn hàng: TypeError: Failed to fetch`

after recovery.

## Implemented fix

After a successful order reload:

- if the current notice is specifically the stale order-fetch error, clear it
- record a recovery event in notification diagnostics
- do not clear unrelated notices/errors

## Current next step

1. Verify Vercel preview/build for this branch.
2. Open the fix PR.
3. Stop at Sky's merge gate.
4. After merge/deploy, perform a short reconnect re-test to confirm the red stale banner disappears automatically after recovery.

## After that

The remaining notification acceptance cases require a real/new order:

- Realtime arrival
- duplicate-alert suppression
- unread/read sync across devices

If production still has no orders, wait for a natural order unless Sky explicitly authorizes synthetic production test data.

## Audio evidence boundary

The app self-test executed its audio path, but only Sky confirming the sound was audibly heard can mark audio PASS.
