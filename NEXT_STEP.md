# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current authorized work

`ADMIN-RUNTIME-FREEZE-001 — stop admin page MutationObserver loop`

Branch:

`task/admin-runtime-freeze-001`

## Evidence

Production investigation on 2026-10-01 established:

- admin password auth succeeded in Supabase
- authenticated product/order requests returned HTTP 200
- browser still became unresponsive
- therefore the blocker is frontend runtime behavior, not invalid credentials or RLS

Source inspection identified a deterministic feedback loop in `src/admin-orders.ts`:

1. body-wide MutationObserver invokes `ensureTrigger`
2. existing trigger path invokes `renderNotificationState`
3. `renderTrigger` rewrites badge `textContent`
4. that creates another child-list mutation
5. observer repeats indefinitely

## Implemented fix

- only update badge text/hidden state when the value actually changes
- if an existing trigger is already the current trigger, return without rendering it again

## Current next step

1. Verify Vercel preview/build for the fix branch.
2. Open the fix PR.
3. Stop at Sky's merge gate.
4. After merge/deploy, retest `/admin` login.
5. Confirm the authenticated dashboard is responsive.
6. Run `✦ Thử cảnh báo` and inspect notification diagnostics.
7. Resume remaining runtime acceptance checks.

## Hard boundary

Do **not** create a synthetic production order merely to exercise notification flow unless Sky explicitly authorizes production test data.

## Continuity protocol

Before each material PR is presented as ready for merge, keep:

- `PROJECT_STATE.md`
- `TASKS.md`
- `NEXT_STEP.md`
- `HANDOFF.md`

aligned with live Git/runtime evidence.
