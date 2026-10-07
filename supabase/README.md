# Supabase setup for SkyHouse

No Supabase secret is stored in this repository.

## One-time setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. In **Authentication → Users**, create the admin account that will be used at `/admin`.
4. In Vercel project `sky-house`, add these environment variables for Production and Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Redeploy once after adding the environment variables.

After that, product changes made in `/admin` are stored in Supabase and do not require a code deployment.

The public storefront reads the Supabase products catalog. INVENTORY-001 read-only verification found 110 real product rows; catalog loading also works before the inventory migration is applied.

## INVENTORY-001 rollout

The inventory source migration is `migrations/20261007_inventory_management.sql`. It must be reviewed/merged before an explicitly authorized production application through the Supabase connector. It has NOT been applied to production by this task. Do not run local acceptance fixtures against production.

- `schema.sql` is the initial bootstrap. Apply repository migrations in chronological order for a fresh project; inventory accounting and its permissions are defined by the inventory migration.
- Existing products get NULL stock (unmanaged), never invented zero/9999. First actual count uses Admin → Điều chỉnh tồn and records an `initial` movement with unknown previous quantity.
- Stock and threshold use the existing product unit, with up to 3 decimal places. The existing cart still purchases whole units; a remainder below one unit cannot satisfy a one-unit purchase.
- Once a real stock count is recorded, the product unit cannot be changed without a separate conversion design. This avoids reinterpreting physical quantities/history silently.
- Only authenticated admins can adjust stock or call the status RPC. Direct stock INSERT/UPDATE and movement INSERT/UPDATE/DELETE are denied to frontend roles. Catalog metadata CRUD remains available to authenticated admins; anonymous product writes are removed.
- Product/order deletion with inventory history is restricted by foreign keys. Keep history by hiding/discontinuing such a product rather than deleting it.
- Historical non-new orders and snapshots lacking product IDs are explicitly inventory-exempt (`legacy`); status handling remains compatible, no guessed stock movement. They are not candidates for future pending merges. Admin shows a manual-reconciliation warning.
- Tracked orders require confirmation before fulfilment, and completed/cancelled orders cannot be reopened. Same-status retry is safe. Items cannot change after accounting. Cancellation restores actual deductions only.
- Realtime products publication is added for stock refresh; frontend also refreshes the storefront every 30 seconds while visible.
- The short checkout retry cache verifies the cached order is still `new` through the existing read-only tracking RPC. A subsequent checkout after confirmation creates a fresh order instead of silently reusing a fulfilled order.
- Before applying, inspect existing status/item/custom integration usage. Migration blocks new snapshots missing product IDs and direct stock writes; cached callers cannot bypass validation.

Local verification: `node tests/inventory/stock.test.mjs`, then `./tests/inventory/run-local.ps1` in PowerShell 7. SQL tests require the isolated `skyhouse-inventory-001-db` container with label `skyhouse.task=INVENTORY-001` and network `none`; the script refuses other containers. It creates separate local test databases and retains evidence. Storage/auth helper scaffolding is test-only; actual accounting/RLS/locks run in PostgreSQL 17.6.
