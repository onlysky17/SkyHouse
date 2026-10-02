# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `6d4ec7a4ae585b9d9e5ef14de2e02a68290af1cd`
- PR #44 is merged at that commit.
- No open PR existed when this task started.

## Recent scroll-resume work

- PR #42 — absolute scroll preservation — runtime incomplete
- PR #43 — bottom-gap/delayed restoration — runtime incomplete
- PR #44 — skip full render after unchanged silent order refresh — merged, but Owner runtime still shows a jump

## Current active task

`ADMIN-RESUME-HEALTH-ONLY-001 — stop Realtime state transitions from rebuilding the order panel`

Branch:

`task/admin-resume-health-only-001`

## Remaining root cause

After PR #44, `loadOrders(true)` can skip `renderPanel()` when nothing changed.

However, the Realtime lifecycle still calls:

`setRealtimeState(connecting/degraded/connected/offline)`

and `setRealtimeState()` itself was still calling `renderPanel()`.

Therefore a tab-resume/reconnect can still destroy and rebuild the full order DOM even when the order data is unchanged.

## Current fix

- Realtime state transitions no longer rebuild the full panel.
- They update only the health/last-sync block.
- If diagnostic trace is open, only its count/list are refreshed in place.
- Order/detail DOM is left untouched, so its scroll position cannot jump from a Realtime status transition.

No DB/schema/auth/order mutation.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains partial pending real-order arrival/dedupe/cross-device evidence.
