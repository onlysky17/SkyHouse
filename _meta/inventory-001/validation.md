# INVENTORY-001 validation — 2026-10-07

Owner: Sky. Repository/runtime evidence is canonical. Implementation and local acceptance are verified; authenticated Admin visual, Owner visual acceptance and production inventory rollout are pending. No merge performed.

## Preflight and boundaries

- Verified original workspace/root `D:\PRIVATE\APP\SkyHouse` / `D:/Private/APP/SkyHouse`, remote `https://github.com/onlysky17/SkyHouse.git`.
- Original branch `task/order-ops-notify-008-runtime-acceptance`, HEAD `af71874517eba99604630ecc2a41b360a022cb1e`. Five pre-existing tracked edits (PROJECT_STATE, TASKS, NEXT_STEP, HANDOFF, OWNER_RULES) and untracked artifacts were preserved.
- Read bootstrap/rules/state/tasks/next/decisions/handoff in repository order, then reconciled against current main.
- GitHub verified PR #53 MERGED, mergedAt `2026-10-07T03:20:04Z`, actual merge commit/current main `e454dbd39722abed413a54876f96534e73065d20`. PR head `df8bd68a56f3c825d7f62c6ea29aab9cbe2af209`. Vercel status SUCCESS for merge main; no open PR at task start.
- Managed worktree `C:\Users\NHAT THIEN\.codex\worktrees\inventory-001\SkyHouse`, branch `task/inventory-001`, based on that verified main. Existing alignment worktree/process left intact.
- No repository AGENTS.md/PROJECT_CONTEXT.md found; Owner-provided instructions applied. No dependencies added or manifest/lockfile changes.
- GitHub connector was unavailable; existing authenticated gh used. Vercel connector project request returned 403, so remote deploy evidence uses GitHub status/deployments. No provider dashboards/login attempts.

## Live production read-only audit

Supabase project `bophfdnkncirvsknvnho`:

- 110 products, 6 orders; 3 order snapshots lack product IDs. Counts only, no customer identities copied.
- `stock_quantity`, `low_stock_threshold`, `inventory_state` and `inventory_movements` do not yet exist. This task did NOT apply its migration or change real stock/order rows.
- PR #52 secure migration `20261002093235 harden_pending_order_merge_key` exists; hash column + seven-argument token-bound checkout RPC exist; phone-only overload absent. Earlier continuity uncertainty about SQL application is superseded.
- Audited products/orders/RLS/grants/tracking/checkout and Realtime. Existing authenticated catalog metadata CRUD retained. Legacy anonymous product INSERT grants are removed by the proposed inventory migration; no anonymous inventory writes are granted.
- Production pending-merge end-to-end acceptance remains separate from schema verification and local acceptance.

## Database design and compatibility

Source: `supabase/migrations/20261007_inventory_management.sql` (one transaction, source-only).

- Stock numeric(14,3), nonnegative, NULL means unmanaged. Threshold numeric(14,3), default 5. No invented initial 0/9999 counts. First actual count records `initial`, previous quantity NULL; recorded count starts physical accounting. Managed product unit cannot silently change.
- Movement ledger stores product/order/type/delta/before/after/reason/time/actor/request UUID. Constraints enforce arithmetic and per-order/product/type uniqueness. Authenticated SELECT only; frontend cannot INSERT/UPDATE/DELETE movements or write stock directly.
- Authenticated status RPC uses the same BEFORE order trigger as direct legacy admin updates. Confirmation locks products in ascending ID order, validates the entire aggregated snapshot first, then deducts and records movements in the transaction. Shortage aborts status + all stock/ledger changes.
- Retry of the same status is a no-op for accounting. Shipping/completed do not deduct. Confirmed/shipping cancellation restores the original ledger deductions exactly once. New cancellation has no restoration; terminal tracked orders cannot reopen. Accounted snapshots cannot be altered.
- Historical non-new orders, invalid/empty snapshots or snapshots missing IDs become `legacy`: preserve status handling without guessing/deducting/restoring. UI warns that manual reconciliation is required. New snapshots need real valid product IDs/positive quantities.
- Adjustment RPC requires authenticated actor, reason, request UUID and expected stock. Retry returns the original movement; conflicting UUID payloads and stale concurrent edits fail. All writes and the movement occur atomically.
- Pending merge remains same normalized phone + same hashed browser secret + status new, now also inventory unprocessed. Merge key is product ID, preserving distinct SKUs with identical names. It validates the final combined snapshot and does not reserve stock; confirmation deducts the final quantities once. Lock order is order row then stable product IDs, avoiding the checkout/confirmation inversion.
- Checkout retry cache reads the cached order status through the existing tracking RPC; only pending orders are reused. Checkout after confirmation creates a fresh order.
- Existing cart remains whole-unit quantities (cap 99); stock supports up to 3 decimals for counting. Fraction below one unit cannot satisfy a one-unit purchase. Product/order deletion with history is restricted; hide/discontinue such products instead.
- Products Realtime publication + visible storefront polling refresh stock. DB validation is final authority even for stale clients. Missing inventory columns/RPCs fall back to existing pre-migration behavior so preview publication cannot make the legacy catalog unavailable.

## Local acceptance evidence

Actual PostgreSQL 17.6, cached official Supabase image `supabase/postgres:17.6.1.136`, isolated container `skyhouse-inventory-001-db`, label `skyhouse.task=INVENTORY-001`, network none, no published ports. Latest retained evidence DB: `skyhouse_inventory_1791346736686`.

Tests use explicitly isolated local fixtures, not copied production customer data. Storage/auth scaffolding exists only in the acceptance bootstrap; accounting, permissions, triggers, locks and secure checkout are the actual repository SQL. Transaction fixtures roll back; concurrent-session evidence is retained locally. Script refuses containers outside the task label/network boundary and requires PowerShell 7.

| Case | Verified result | Scope |
| --- | --- | --- |
| A legacy | NULL stays unmanaged; old missing-ID/confirmed/invalid/empty snapshots are exempt, no guessed movements | SQL + helper tests; actual 110-row legacy storefront |
| B managed | 10 → new qty3 stays10 → confirmed7 → retry7 → shipping7 → completed7 | PostgreSQL transactions |
| C cancel | confirmed and shipping cancellations restore10; retry remains10; one deduction/restore; new cancel no movement | PostgreSQL transactions |
| D shortage | actual stock2 / required3 fails with named shortage; order remains new, stock2, no partial deduction/ledger for another item | PostgreSQL transactions |
| E sold out | stock0 checkout rejected; helper blocks add/cart limit0; quick-add/modal source guards audited | DB + helper tests; managed browser visual pending |
| F low stock | stock4 threshold5 identified and label includes Sắp hết | DB + helper tests; authenticated visual pending |
| G concurrency | two genuine sessions confirm qty4 against5: exactly one success, one shortage, stock1, one confirmed order/one deduction | PostgreSQL row-lock concurrency |
| H pending merge | same secret/phone append1+2 keeps stock unchanged; confirmation deducts combined qty3; overstock append rolls back; later confirmed checkout creates new ID | Actual secure RPC in local database |

Additional assertions: duplicate product IDs aggregate once, unmanaged items do not create stock movements, distinct IDs with same name/unit do not collapse, snapshots freeze, terminal reopen fails, stale adjustments fail, unit changes fail, authenticated metadata editing works, direct stock INSERT/UPDATE denied, ledger DELETE denied, anonymous adjust/status/history denied, negative quantities rejected.

Final SQL output:

```
PASS: local transaction acceptance A-F,H + legacy/security/idempotency/snapshot/rollback
PASS: case G, concurrent confirmations: one success, one insufficient; stock 1; one deduction.
Evidence database retained in isolated container: skyhouse_inventory_1791346736686
```

Reproduce: `node tests/inventory/stock.test.mjs` and, in PowerShell 7 with the retained isolated container, `./tests/inventory/run-local.ps1`. This creates a fresh local evidence database; never redirect to production.

## Build and type checks

- `npm run build`: PASS, Vite 6.4.4, 500 modules. CSS 87.31 kB / gzip 16.75; JS 617.60 kB / gzip 182.37. Existing >500 kB bundle warning remains.
- `npx --no-install tsc --noEmit --types vite/client`: PASS.
- New modules strict check: PASS with `--strict --skipLibCheck --types vite/client --module ESNext --moduleResolution Bundler --target ES2020 --lib ES2020,DOM --jsx react-jsx --allowSyntheticDefaultImports src/InventoryEditor.tsx src/lib/inventory.ts`. Existing global tsconfig strict=false was not rewritten; no new any.
- `node tests/inventory/stock.test.mjs`: PASS.
- `git diff --check`: PASS. No package test/lint scripts exist; no claim of an unavailable lint suite.
- Last changes after frontend build were SQL migration robustness/local acceptance assertions and documentation, not application source.

## Actual browser evidence and remaining gaps

Changed local app `http://127.0.0.1:5183/` reads actual public Supabase catalog (110 cards). Inspected real product #51 Chuối sấy tròn, 145,000đ/kg. Added qty1 using normal UI and opened cart. Personal fields remained blank; did not submit checkout or call an order mutation.

Actual cart inspected at 1440×900, 768×1024, 320×700. Controls/selects remained 46px high; desktop/tablet name/phone top edges matched; mobile used one column; CTA visible/enabled; no horizontal overflow. Product51 stock metadata reflects unmanaged fallback. Evidence: `inventory-legacy-cart-mobile.jpg`, `inventory-ui-measurements.json`.

Admin `http://127.0.0.1:5183/admin` is visibly at login; Owner sign-in requested once and pending. No logout/data clearing. Existing PR #53 field grid remains unchanged in source; new inventory fields use their own consistent grid. Authenticated add/edit/filters/history, managed zero/low-stock browser states, and Owner visual PASS are NOT claimed. Opening order details may persist read markers; avoided under the no-production-write boundary.

## Production rollout / Owner gates

1. Owner reviews draft/visual evidence; finish authenticated UI verification on an authorized environment. Explicit Sky instruction required to merge.
2. Production migration is NOT applied. Before an authorized application, re-audit live schema/orders and exact row counts. Proposed schema changes add NULL stock + default threshold5 to current products, inventory_state/backfill to current orders, empty ledger + functions/triggers/grants/Realtime publication. Do not enter synthetic counts or orders.
3. Real initial stock must come from Owner counts via audited adjustment; exact IDs/counts/reasons require authorization before any agent-performed production change.
4. Runtime inventory validation should use natural real order flow or a separately authorized test plan specifying every product/order/status write. Local SQL results do not prove production runtime acceptance.

## Changed paths

- UI/integration: `src/Admin.tsx`, `src/InventoryEditor.tsx`, `src/inventory.css`, `src/lib/inventory.ts`, `src/Storefront.tsx`, `src/quick-shop.ts`, `src/cart-customer-info.ts`, `src/admin-orders.ts`, `src/main.tsx`.
- Database/docs: inventory SQL migration, `supabase/README.md`.
- Local acceptance: five files under `tests/inventory/`.
- Continuity/evidence: PROJECT_STATE/TASKS/NEXT_STEP/HANDOFF and this scoped evidence directory. Dist/node_modules/other task files are excluded.

## Publication evidence

- Implementation commit: `422cc2f00c9a23db6a504587f41e919589e37c5e`, pushed to `task/inventory-001`. Committed tree contains the new modules, migration, tests and evidence; no dependency on unstaged application files.
- Draft PR #54: https://github.com/onlysky17/SkyHouse/pull/54, OPEN/unmerged, mergeable at verification. Attached to this Codex task.
- GitHub Vercel status SUCCESS + Preview Comments SUCCESS on that commit. Preview deployment ID 6901625462, status success at `2026-10-07T04:23:07Z`.
- Preview https://sky-house-ociw854ay-tiansky1917-7468s-projects.vercel.app/admin was actually opened: application Admin login, no provider login. Navigated through the visible storefront link; rendered 110 real catalog cards, no catalog error or horizontal overflow. Did not submit forms or alter records. Authenticated preview Admin remains pending.
- Subsequent publication/handoff documentation commit changes no application/SQL/test source. Main remains at PR #53 merge. No inventory production application or merge.
