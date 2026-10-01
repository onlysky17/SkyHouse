# SkyHouse — Roadmap

This file separates **completed work**, **authorized work**, and **ideas**.

## Completed lanes

### Storefront / ordering

- customer cart information capture
- secure storefront order creation path
- post-checkout confirmation
- direct customer tracking
- recent-order tracking by customer identity

### Admin order operations

- order list / detail management
- search
- date/time filtering
- CSV export
- order settlement fields
- status workflow
- customer confirmation copy flow

### Notifications

Completed through `ORDER-OPS-NOTIFY-007`:

1. Realtime new-order alerts
2. notification hardening / fallback
3. unread inbox controls
4. cross-device read-state sync
5. diagnostics + self-test
6. opt-in browser background notifications while tab remains open
7. duplicate-alert suppression / grouping

## Authorized next work

**None at snapshot time.**

Do not infer a new task from this file.

## Candidate backlog — NOT AUTHORIZED

These are only future discussion candidates and must not be implemented without Sky approving them:

- migrate remaining legacy product images to Supabase Storage if still needed
- security review of legacy/public order insert policy versus current RPC-based storefront flow
- true closed-browser push notifications, which would require a service worker / push architecture and a separate Owner decision
- broader order analytics / reporting
- additional admin roles and permissions if more admins are introduced

Candidate != task. Candidate != roadmap approval.
