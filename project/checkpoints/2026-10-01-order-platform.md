# Checkpoint — 2026-10-01 — Order Platform / Notifications

This checkpoint summarizes the repository state after the recent order-notification chain.

## Source state

- `main`: `fb29fb87185f1c55d7dc3031b579016878aebe32`
- PR #32 merged
- no open PRs observed at checkpoint creation
- latest product task: `ORDER-OPS-NOTIFY-007` CLOSED

## Recent merged sequence

- PR #23 — order search / analytics / CSV export
- PR #24 — customer order tracking page
- PR #25 — post-checkout confirmation + direct tracking
- PR #26 — Realtime admin new-order alerts
- PR #27 — notification hardening
- PR #28 — unread inbox controls
- PR #29 — cross-device unread synchronization
- PR #30 — notification diagnostics + local self-test
- PR #31 — opt-in browser background notifications
- PR #32 — duplicate-alert suppression / grouping

## Notification behavior at this checkpoint

- authenticated admin receives new-order data through Supabase Realtime
- polling provides fallback/catch-up
- unread state is tracked independently of order status
- read state syncs across devices through `admin_order_reads`
- optional sound remains device-local
- browser system notification permission is opt-in
- system notifications work while the admin tab/page remains open; this is not service-worker push
- duplicate alert delivery is suppressed across Realtime / fallback overlap using a local recent-notified cache
- suppressing an alert does not mark an order as read
- self-test can exercise local toast/audio/system notification paths without creating a fake order

## Evidence boundary

The chain was merged through GitHub and deployed through Vercel. Production schema changes used for Realtime/read sync were verified during implementation.

Do not convert that into a blanket Owner visual PASS. Browser permission, audio, background-tab, multi-device, and reconnect timing still require runtime observation when those behaviors matter.
