# SkyHouse — Agent Handoff

Use this file when moving the project to ChatGPT Work, another agent, or a new chat.

## Identity

- Owner: Sky
- Repository: `onlysky17/SkyHouse`
- Known local workspace: `D:\PRIVATE\APP\SkyHouse`

## Canonical checkpoint

- PR #35: notification diagnostic instrumentation
- PR #36: admin freeze fix
- PR #37: runtime acceptance evidence
- PR #38: reconnect stale-banner UX fix
- PR #39: reconnect acceptance continuity, verified merged
- current verified canonical main: `f228de79aa40885e535bd76e216183e1e957eed2`

## Runtime evidence

Verified by Owner:

- admin login/dashboard responsive
- order panel responsive
- Realtime stable/connected
- browser notification permission granted
- background notification enabled
- local toast self-test delivered
- browser/system notification visibly delivered
- offline/fallback/reconnect/catch-up behavior works
- after PR #38, stale `Failed to fetch` banner clears automatically after successful recovery
- diagnostic trace shows recovery back to connected state

## Current active task

`CART-UX-001 — Redesign mobile cart item presentation`

- Branch: `task/cart-ux-001`; base: verified main / PR #39 merge above.
- PR: [#40](https://github.com/onlysky17/SkyHouse/pull/40), OPEN / NOT MERGED.
- Managed checkout: `C:\Users\NHAT THIEN\.codex\worktrees\cart-ux-001\SkyHouse`.
- Original `D:\PRIVATE\APP\SkyHouse` remains on `task/order-ops-notify-008-runtime-acceptance`; its five unrelated continuity WIP files and local build/dependency folders were preserved.
- Changes: larger product cards/images and touch targets, item-scoped removal and totals, explicit unpriced notice, quantity/subtotal summary, one content scroller with pinned checkout CTA.
- Source files: `src/Storefront.tsx`, `src/cart.css`, `src/cart-customer-info.ts` (customer form insertion host only).
- Existing order/cart logic and DOM snapshot contract preserved; no dependencies added.
- `npm run build`, `npx --no-install tsc --noEmit --types vite/client`, and `git diff --check` passed. Existing large-bundle warning remains.
- UI checked with real catalog products at 320×640, 375×667, 390×844, 414×896, 390×500, 1280×800; quantity/removal/unknown subtotal/persistence/form uniqueness checks passed.
- Detailed evidence and screenshots: `_meta/cart-ux-001/validation.md`.
- Local preview: `http://127.0.0.1:5178/`.
- **Next: Sky visual review and explicit merge instruction. Do not merge automatically.**
- Owner visual PASS and post-merge production validation are pending. No synthetic production order or order submission occurred.

## Retained notification acceptance

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

State:

**PARTIAL RUNTIME PASS**

Remaining:

- audible sound confirmation from Sky
- real order Realtime arrival
- duplicate suppression on real/new order
- cross-device unread/read synchronization

Production had no orders during the validation sessions.

Do not create synthetic production orders without explicit Owner authorization.

## Merge boundary

Sky controls merge.

If no real order exists, wait rather than inventing an acceptance result.
