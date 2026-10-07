# SkyHouse — Next Step

## Current active task — INVENTORY-001 — 2026-10-07

1. Wait at explicit Owner merge gate for PR #54 (https://github.com/onlysky17/SkyHouse/pull/54). Sky stated `Owner visual acceptance: PASS` on 2026-10-07; record it as accepted and do not request the same visual approval again. PR is ready for review; implementation/local database acceptance and Vercel deployment are verified. Visual PASS is not a merge instruction.
2. Preserve local/preview Admin sessions. Local changed Admin is `http://127.0.0.1:5183/admin`; preview https://sky-house-ociw854ay-tiansky1917-7468s-projects.vercel.app/admin opens the application directly without provider login. Agent's own authenticated Admin inspection was not completed; no new login or tested scenario is inferred from Owner's PASS. Source preserves PR #53 alignment.
3. Production has no inventory columns yet, so local/preview uses the compatible pre-migration fallback. Do not save/delete/upload/adjust stock or change status in production merely to validate UI. Do not alter Giá gốc: its existing handler can autosave. Opening orders may write read markers; avoid that under the current boundary.
4. Managed-stock end-to-end runtime still needs an authorized non-production Supabase environment, or explicit Owner production rollout/test authorization. Local SQL acceptance covers accounting; Owner visual approval does not authorize production writes or establish runtime accounting acceptance.
5. After review and explicit Owner merge instruction, merge remains Owner-controlled. Before a separately authorized production migration, re-audit schema/status/snapshots and counts. Proposed migration adds stock/threshold columns to real products, leaves every stock NULL (no fake counts), backfills inventory_state for existing orders, creates an empty movement table/functions/triggers/permissions and publishes products to Realtime. No synthetic order is needed to apply schema.
6. After authorized migration, Owner enters actual counted stock through audited adjustment. That writes products.stock_quantity + one initial movement per chosen product; list exact product IDs/counts/reasons before any agent-performed production adjustment. Verify real order flow naturally, or stop for explicit test-data authorization listing exact rows/status changes.
7. Retain original checkout WIP and local evidence/container. Update continuity with each new verified runtime/deploy result, then stop at the appropriate Owner gate.

PR #53 is already merged at `e454dbd39722abed413a54876f96534e73065d20`. PR #52 secure SQL is deployed, verified read-only; historical next steps below are not active merge/migration instructions.

## Prior alignment next step (superseded by PR #53 merge; retained validation gaps)

`ADMIN-FORM-ALIGNMENT-AUDIT-001`

1. Review draft PR #53 (https://github.com/onlysky17/SkyHouse/pull/53) and its evidence. Vercel implementation check SUCCESS. Open https://sky-house-2xk3qq64e-tiansky1917-7468s-projects.vercel.app/admin; it is reachable without provider login, but Admin needs Owner sign-in on this preview origin. Authenticated changed-build Admin validation and Sky visual acceptance are still required.
2. Use the existing authenticated production /admin session for read-only baseline inspection. The changed local build is at `http://127.0.0.1:5182/admin`; its separate origin requires Owner sign-in. Keep both sessions.
3. On the changed build inspect Admin → Quản lý sản phẩm → + Thêm, then an existing product: Giá / Giá gốc / Đơn vị and Thứ tự / Ảnh sản phẩm must have matching top edges; helper text stays below. Inspect toggles and action rows at desktop/tablet/mobile.
4. Do not modify original price: its change handler can autosave. Do not save/delete/upload or change order status/settlement.
5. Admin Orders source was audited. Opening/selecting an order can write `admin_order_reads`; do not do that under this task's no-production-writes boundary. Owner visual verification of an already-open panel, or explicit authorization for read markers, is needed for actual order-panel runtime coverage.
6. Inspect remaining Orders status, shipping fee/final total/admin note, toolbar/filter/actions without changing records; record the runtime evidence when permitted.
7. Stop at Sky visual/merge gate. No merge performed or authorized.

PR #52 is already merged at `b99ce9c7004ddad3d3b77a277de4486670392023`. Its SQL application/runtime acceptance is a retained unverified boundary, not work authorized by this UI task.

## Historical next step (2026-10-02; superseded, not an active merge instruction)


## Current active task

`ORDER-PENDING-MERGE-SEC-001`

## Implemented

1. Storefront creates/persists a random browser merge token.
2. Secure checkout sends that token to `submit_storefront_order`.
3. DB stores only SHA-256 of the token.
4. Pending-order lookup requires both normalized phone + token hash.
5. Legacy tokenless orders are not adopted.
6. Phone-only merge RPC signature is dropped.
7. Canonical schema includes the hash column.
8. Vercel branch build/deployment is successful.

## Next step

1. Open PR.
2. Stop at Sky merge gate.
3. After merge:
   - apply `20261002_harden_pending_order_merge_key.sql` to production Supabase
   - verify the old six-argument merge RPC is gone
   - verify the seven-argument secure RPC exists
4. Then run Owner-directed runtime acceptance:
   - first checkout from browser A creates a new token-bound order
   - second checkout from browser A + same phone merges into it
   - browser B + same phone creates a different order
   - once the browser-A order leaves `new`, browser A creates a fresh order next time

Do not retroactively attach legacy orders to a new browser token.
