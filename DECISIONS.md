# SkyHouse — Stable Decisions

Only record decisions already implemented/accepted as project direction. Live code/runtime remains canonical.

## Workspace / continuity

- The SkyHouse repository/workspace itself is the project.
- Continuity files live at repository root.
- Do not create a nested `project/` folder for agent handoff.
- Known Owner local workspace: `D:\PRIVATE\APP\SkyHouse`.
- New agents must verify the actual Git root and state before acting.

## Application

- Frontend: React + Vite + TypeScript.
- Backend/data: Supabase.
- Deployment: Vercel.
- GitHub PRs/branches are used as controlled delivery checkpoints.

## Orders

- Storefront order creation uses a controlled Supabase RPC path.
- Customer tracking is separate from authenticated admin access.
- Internal `admin_note` remains admin-only.
- Order workflow status and admin unread/read state are separate concepts.

## Notification architecture

- Supabase Realtime handles live order arrivals.
- Polling remains fallback/catch-up.
- Read state syncs through `admin_order_reads`.
- Local storage is used as device cache/preferences.
- Sound is optional.
- Browser system notification is opt-in.
- Current browser notification is not closed-browser push; the admin page/tab must remain open.
- Duplicate alert suppression must never silently mark an order as read.
- Production fake orders are not created just to test UI without explicit Owner authorization.

## Evidence

- Build/deploy evidence is not visual acceptance.
- Owner visual PASS must be explicit.
