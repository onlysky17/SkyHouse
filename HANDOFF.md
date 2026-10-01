# SkyHouse — Agent Handoff

Use this file when moving the project to ChatGPT Work, another agent, or a new chat.

## Identity

- Owner: Sky
- Repository: `onlysky17/SkyHouse`
- Known local workspace: `D:\PRIVATE\APP\SkyHouse`
- Always verify actual Git root/workspace before mutation.

## Canonical checkpoint

- root continuity bootstrap: PR #34 / merge `1da1fab945a6f555932ef3d049fa89a70eccb2a9`
- notification runtime instrumentation: PR #35 / merge `af71874517eba99604630ecc2a41b360a022cb1e`
- PR #33: CLOSED / NOT MERGED / superseded

## Rehydrate procedure

Before changing anything:

1. verify Git root
2. verify branch / HEAD / status
3. inspect `origin/main`
4. inspect open PRs
5. read all root continuity files
6. inspect the exact active task branch/PR
7. inspect Vercel/Supabase only when relevant

## Current active task

`ADMIN-RUNTIME-FREEZE-001`

Branch:

`task/admin-runtime-freeze-001`

Production symptom:

- login form appears
- password login succeeds at Supabase
- authenticated REST requests succeed
- browser becomes non-responsive around authenticated admin mount

Root cause in `src/admin-orders.ts`:

- `MutationObserver` watches body child-list changes
- existing order-trigger callback rerendered notification state
- rerender unconditionally rewrote badge `textContent`
- text-node replacement generated another observed mutation
- loop repeated indefinitely and saturated the browser main thread

Fix:

- guard badge DOM writes
- do not rerender an unchanged existing trigger during observer callbacks

No DB/schema/order change is part of this bugfix.

## Runtime acceptance after bugfix

Once merged/deployed:

- verify admin dashboard responsive after login
- run local notification self-test
- inspect diagnostic trace
- continue reconnect/dedupe/browser-notification/audio/mobile checks
- do not create fake production orders without explicit Owner authorization

## Merge boundary

Sky controls merge.

A green preview/build does not equal Owner runtime PASS.
