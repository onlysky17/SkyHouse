# SkyHouse — Decisions

Only stable, already-implemented decisions belong here. Verify source/runtime before relying on implementation details.

## Application architecture

- Frontend uses React + Vite + TypeScript.
- Supabase is the application backend for catalog/admin/order data.
- Vercel is the deployment target.
- GitHub pushes/PRs feed automatic Vercel deployments.

## Order creation and tracking

- Storefront order creation uses a Supabase RPC rather than exposing normal public order reads.
- Customer tracking is separated from authenticated admin order access.
- Ordinary customer lookup uses customer identity fields; direct post-checkout tracking may use the newly created order ID plus the customer's stored phone context.
- Internal `admin_note` must remain admin-only.
- Customer-facing tracking may expose customer delivery/note information, but not internal admin notes.

## Admin notifications

- New-order alerts use Supabase Realtime on `orders`.
- 60-second polling remains a fallback/catch-up path.
- Unread/read is separate from order workflow status.
- Per-admin read state is persisted in `admin_order_reads` and synchronized through Realtime.
- A local device cache remains a resilience layer.
- Notification sound is optional and stored per device.
- Browser system notifications are opt-in and require explicit browser permission.
- Current browser notification implementation is **not** true closed-browser push; the admin page/tab must remain open.
- Realtime / polling overlap is de-duplicated using a recent-notified-order cache so the same order is not repeatedly announced.
- Duplicate-alert suppression must not silently mark an order as read.

## Testing philosophy

- Do not insert fake production orders merely to prove notification UI unless Sky explicitly authorizes production test data.
- Prefer non-mutating self-test paths for toast/audio/system-notification checks.
- Treat browser permission and OS notification rendering as runtime/visual evidence, not compile evidence.
