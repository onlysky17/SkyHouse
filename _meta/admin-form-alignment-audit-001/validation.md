# ADMIN-FORM-ALIGNMENT-AUDIT-001 — validation (2026-10-07)

## Canonical preflight

- Owner workspace/root: D:\PRIVATE\APP\SkyHouse (verified before changes).
- Remote: https://github.com/onlysky17/SkyHouse.git.
- Original checkout: task/order-ops-notify-008-runtime-acceptance, HEAD af71874517eba99604630ecc2a41b360a022cb1e; five unrelated document/rule modifications preserved.
- Live main / fetched origin/main: b99ce9c7004ddad3d3b77a277de4486670392023; PR #52 genuinely merged at that commit. No open PR at task start or before commit.
- Required continuity read in order; root AGENTS.md and PROJECT_CONTEXT.md absent. User-supplied rules apply.
- Isolated managed worktree/branch: task/admin-form-alignment-audit-001, based on live main. No unrelated source imported.

## Root cause and fix

The outer product grid stretched labels to the tallest field. Labels themselves are implicit-row grids with default align-content: normal. The helper-containing original-price field already uses align-content: start, while adjacent fields stretched their anonymous label/input rows. This moved and inflated the neighboring inputs. Upload helper caused the same effect in the Sort / Image row. This was not an assumed align-items: end issue.

A final shared CSS import uses align-items: start on field grids, intrinsic grid rows and align-content: start on field wrappers. Helpers keep their grid gap below controls without additional duplicate top margins. Contextual input/file heights are 46px, settlement remains 44px, catalog search/filter 48px; multiline controls retain their natural height. File input and narrow columns cannot expand the layout. Toggle/action layouts and correct Tracking/Orders action alignment remain intact.

Application diff: src/main.tsx (import only), src/form-alignment.css. No event handlers, business logic, dependencies, schema/RPC/auth/notification or production records changed.

## Evidence and limits

| Surface | Inspection | Result / limitation |
| --- | --- | --- |
| Admin Products new form | Authenticated production baseline + source-derived changed-layout harness | Production at 1022x884: Price/Unit top 354 vs Original 334 (20px difference), Sort 673.1875 vs File 656 (17.1875px). Changed source harness desktop: both rows 0px difference, inputs/file 46px. |
| Product helper/responsive layout | Source-derived harness at 1440, 901, 768, 390, 320px | Same control tops in desktop rows; one column <=900px; helpers below, no horizontal overflow. Textarea 86px allowed. |
| Product edit, stock/visible/badges, Save/Delete | Source inspection; production existing editor observed without edits | Shared wrappers apply; actual changed authenticated Admin validation still pending. Original-price change autosaves, so it was not edited. No upload/save/delete. |
| Admin Orders status, settlement, note, search/filter/actions | Source inspection; blank settlement harness | Settlement 44px inputs / 72px textarea, top-aligned fields; Orders toolbar has contextual 40/42px controls. Actual Orders panel not opened: selecting an order can persist admin_order_reads and is outside no-production-writes boundary. Settlement harness omits dynamic helper text, so actual helper wrapping remains pending. |
| Cart customer fields, receive method, address, note, CTA/error | Actual local application, real existing Chuoi say tron product, blank personal fields; 1440/768/390/320px | Input/select 46px; desktop name/phone same top; mobile one column; textarea 66/70.375px; no horizontal overflow. One cartBody scroller, fixed CTA visible. Empty form shows required-field error and returns before order RPC; no order submitted. |
| Tracking | Actual local application at 1440/768/320px | Inputs/button 48px, aligned desktop/tablet, stacked mobile; blank-form error below controls. No fabricated identity/order lookup. |
| Login | Actual local application at 1440/768/320px | Inputs 46px, full available width; separate-row button retains 44px. No overflow/auth behavior changes. |
| Storefront catalog search/filter | Actual local application at 1440/768/320px | Both 48px; aligned desktop/tablet, full-width stacked mobile, no overflow. Mobile 46/48px mismatch corrected within this context. |
| Other controls/settings | Source scan | Product image URL, action rows, notification settings/toggles and product modal controls covered in source. No extra settings form or active order-ID input exists; legacy App.tsx catalog is not the main.tsx runtime. No settings/notification permission changes. |

The blank harness is generated from current JSX/injected markup and imported CSS; it has no records, auth, database/RPC or submission handlers. It is a layout reproduction, not a replacement for authenticated Admin runtime acceptance. Reproduce with `node _meta/admin-form-alignment-audit-001/layout-harness.mjs`, then local URL `/_meta/admin-form-alignment-audit-001/layout-harness.html` (add ?before for baseline). Generated HTML intentionally remains local-only/unstaged.

Screenshots: before/after desktop and mobile are explicitly source-harness evidence; Cart/Tracking screenshots are actual application runtime. Measurements contain only layout/control metadata, no customer records or credentials. Production screenshot with account identity is kept local and not included in PR.

## Checks

- npm run build: PASS, Vite 6.4.4, 497 modules; CSS 86.12kB, JS 609.57kB. Existing bundle >500kB warning remains.
- npx --no-install tsc --noEmit --types vite/client: PASS (Vite ambient types provided explicitly; tsconfig unchanged).
- git diff --check: PASS.
- No lint/test scripts in package.json; no dependencies or lockfile changes.
- Vercel connector project lookup returned 403 for known team scope. No dashboard login attempted; GitHub commit statuses will supply available deployment evidence after push.
- GitHub connector unavailable this session; existing gh authentication used for remote/PR evidence. No new provider login.

## Owner gate

Do not claim all-form visual PASS or merge-ready. Authenticated changed-build Admin Product new/edit plus Orders runtime coverage and Sky visual approval remain required. Local /admin on port 5182 is prepared for Owner sign-in; authenticated production session retained. Do not open/select Orders under this scope if it writes read markers, or edit/save/delete products/status/settlement. No synthetic production orders, migrations or merge performed.

## Remote review evidence

- Draft PR #53: https://github.com/onlysky17/SkyHouse/pull/53 (attached to this chat).
- Vercel commit check SUCCESS for d83ae3aaaa48b9a485a9b44df57c0d7149a898b2; GitHub Preview deployment 6900514185 status success.
- Preview runtime: https://sky-house-2xk3qq64e-tiansky1917-7468s-projects.vercel.app/admin loads SkyHouse Admin login directly, with no Vercel account/dashboard login. Authenticated changed-build Admin coverage remains pending.
- No merge. Original authenticated production session and local/preview tabs retained for Owner review.