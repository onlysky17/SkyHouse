# SkyHouse — Next Step

## Current active task

`ADMIN-RESUME-HEALTH-ONLY-001`

## Exact remaining cause

PR #44 removed the full render from unchanged `loadOrders(true)`.

But `setRealtimeState()` still called `renderPanel()`.

A resume/reconnect can emit connecting/degraded/connected transitions, so that separate path still rebuilt the entire admin panel and caused the visible jump.

## Implemented

1. `setRealtimeState()` now updates runtime chrome only.
2. Health/last-sync is patched in place.
3. Open diagnostic trace is refreshed in place.
4. Order detail DOM is not replaced for Realtime status-only changes.

## Next step

- verify Vercel preview
- open PR
- stop at Sky merge gate
- after merge, repeat the same tab-switch test once

No synthetic production order is authorized.
