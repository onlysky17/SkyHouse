# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `0c2922cc55e1c9e33e87170d2c7716fcf487121e`
- PR #45 is merged at that commit.
- No open PR existed when this continuity closeout started.

## Recent admin UX work

- PR #40 — `CART-UX-001` — merged
- PR #41 — admin packing thumbnails/alignment — merged
- PR #42/#43/#44 — intermediate scroll/resume fixes — merged but runtime incomplete
- PR #45 — remove full-panel render on Realtime state-only transitions — merged and Owner runtime verified

## Runtime result

Owner confirmed the tab-switch jump is resolved after PR #45.

Verified behavior:
- scroll inside an open admin order
- switch to another tab/window
- return to SkyHouse
- order detail remains stable instead of visibly jumping/rebuilding

The final root cause was a separate full-panel render path in `setRealtimeState()`, not only the silent order refresh path.

## Task state

`ADMIN-RESUME-HEALTH-ONLY-001` — **CLOSED / RUNTIME VERIFIED**

## Remaining notification acceptance

`ORDER-OPS-NOTIFY-008` remains **PARTIAL RUNTIME PASS** pending real-order evidence for:
- Realtime arrival
- duplicate-alert suppression
- cross-device unread/read sync

Do not create synthetic production orders without explicit Owner authorization.
