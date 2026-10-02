# SkyHouse — Project State

Snapshot date: **2026-10-02**

Live repository/runtime evidence overrides this snapshot.

## Repository

- Repository: `onlysky17/SkyHouse`
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`
- Current canonical `main`: `a5ca9dc0eff9028e40e523a969cb5963a4b75f61`
- PR #43 is merged at that commit.
- No open PR existed when this task started.

## Recent completed work

- `CART-UX-001` — CLOSED / MERGED — PR #40
- `ADMIN-ORDER-PACKING-UX-001` — CLOSED / MERGED — PR #41
- `ADMIN-SCROLL-PRESERVE-001` — MERGED / runtime incomplete — PR #42
- `ADMIN-SCROLL-PRESERVE-002` — MERGED / runtime still showed a visible resume jump — PR #43

## Current active task

`ADMIN-RESUME-NO-RERENDER-001 — avoid rebuilding unchanged admin panel on tab resume`

Branch:

`task/admin-resume-no-rerender-001`

## Runtime evidence

Owner video `2026-10-02 13-45-35.mp4` confirms the remaining issue:

- order detail is positioned near the lower settlement/status area
- Owner switches to ChatGPT
- returning to SkyHouse visibly redraws/jumps the admin panel
- the "Đồng bộ gần nhất" timestamp advances from the pre-switch time to the return time

This ties the jump to the resume refresh path rather than to manual scrolling.

## Root cause

`visibilitychange` intentionally calls `loadOrders(true)` when the admin tab becomes visible.

Even when:
- orders did not change
- unread state did not change
- notices did not change

the old path still called `renderPanel()`, which replaces the entire panel DOM via `innerHTML`.

PR #42/#43 attempted to restore scroll after that destructive rerender, but the user can still see the DOM replacement itself as a visual jump.

## Current fix

For silent/background order refreshes:

- compare previous vs fetched order data
- compare previous vs refreshed unread state
- compare notice state
- if nothing UI-relevant changed, do **not** rebuild the panel
- update only the small Realtime/last-sync health block in place
- still perform a full render when order/unread/notice data actually changed or the refresh was explicitly requested by the admin

This removes the unnecessary destructive rerender instead of trying to hide it afterward.

No DB/schema/order mutation is part of this task.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains **PARTIAL RUNTIME PASS** pending real-order arrival/dedupe/cross-device evidence.

Do not create synthetic production orders without explicit Owner authorization.
