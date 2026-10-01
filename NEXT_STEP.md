# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current authorized work

`ORDER-OPS-NOTIFY-008 — Runtime acceptance instrumentation`

Branch:

`task/order-ops-notify-008`

PR:

**#35 — Add notification diagnostic trace**

## What has been implemented

- local diagnostic event trace in the admin order panel
- Realtime state transition logging
- reconnect/fallback logging
- duplicate-alert suppression logging
- notification delivery-path logging
- browser notification permission/toggle logging
- manual refresh and network online/offline logging
- self-test logging
- privacy-safe diagnostic snapshot copy
- local trace cleanup

The trace intentionally avoids customer name, phone, customer note and admin note.

## Current next step

1. Verify PR #35 is mergeable and Vercel is green.
2. Stop at Sky's merge gate.
3. After Sky merges #35, verify the actual merge commit and `main`.
4. Run a runtime acceptance sweep with the new trace:
   - Realtime arrival
   - reconnect/polling catch-up
   - duplicate suppression
   - unread/read synchronization across devices
   - browser permission flow
   - background-tab notification
   - sound
   - mobile layout
5. Capture diagnostic output when behavior is unclear.

## Hard boundary

Do **not** create a synthetic production order merely to exercise notification flow unless Sky explicitly authorizes production test data.

A real naturally occurring order may be observed read-only without that additional authorization.

## Continuity protocol

Before each material PR is presented as ready for merge, update:

- `PROJECT_STATE.md`
- `TASKS.md`
- `NEXT_STEP.md`
- `HANDOFF.md` when context/boundaries changed

The files must state the exact successor or clearly state that no successor is authorized.
