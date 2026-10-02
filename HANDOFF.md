# SkyHouse — Agent Handoff

Owner: Sky

Repository: `onlysky17/SkyHouse`

Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

Current main at task start:

`a5ca9dc0eff9028e40e523a969cb5963a4b75f61`

That is PR #43 merge.

## Current active task

`ADMIN-RESUME-NO-RERENDER-001`

Branch:

`task/admin-resume-no-rerender-001`

## Runtime evidence

Owner supplied `2026-10-02 13-45-35.mp4`.

The video shows the remaining jump happens on returning from ChatGPT to the SkyHouse admin tab. The last-sync timestamp updates at the same return, confirming the resume refresh path is active.

## Root cause and fix

The app was rebuilding the entire panel after every successful silent `loadOrders(true)`, even when no order/unread/notice data changed.

Current fix:
- compare UI-relevant state around the silent refresh
- unchanged state → update only the health/last-sync block
- changed state or explicit refresh → normal full render

This intentionally replaces the previous strategy of repeatedly restoring scroll after an unnecessary DOM rebuild.

No DB/schema/auth/order mutation.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008` remains partial until a real/new order is available for arrival/dedupe/cross-device checks.

## Merge boundary

Sky controls merge. Green preview does not equal production runtime PASS.
