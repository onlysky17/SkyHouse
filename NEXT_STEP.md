# SkyHouse — Next Step

This file exists so a new agent does not have to guess what happens next.

## Current authorized work

`PROJECT-CONTINUITY-001 — root-level agent / ChatGPT Work continuity`

Current intent:

- continuity files belong directly in the SkyHouse repository root
- the SkyHouse workspace itself is the project
- do not create a nested `project/` folder
- PR #33 is superseded and must remain unmerged

## What the current agent must do

1. Finish the root continuity files.
2. Verify the branch is based on the latest canonical `main`.
3. Verify no unrelated files changed.
4. Verify Vercel/check status if the repository integration runs for docs-only changes.
5. Open a PR.
6. Stop at Sky's merge gate.
7. After Sky merges, verify the actual merge commit and new `main`.

## What a new agent should do if it receives the folder later

1. Read `00_READ_ME_FIRST.md`.
2. Verify local Git root/branch/HEAD/status.
3. Fetch/compare `origin/main`.
4. Check open PRs.
5. Determine whether `PROJECT-CONTINUITY-001` is still open or already merged.
6. If already merged, treat continuity bootstrap as CLOSED.
7. Continue the currently Owner-authorized product task recorded here/TASKS/HANDOFF.
8. If no product task is authorized, do not invent one.

## Recommended next product validation — NOT AUTHORIZED

Before expanding the notification feature set further, the logical validation candidate is a runtime acceptance sweep of the existing notification chain:

- Realtime arrival
- polling/reconnect catch-up
- duplicate-alert suppression
- unread/read sync across two devices
- browser permission flow
- background-tab notification
- sound behavior
- mobile visual layout

This is a **candidate validation step**, not permission to create production test orders or start a new task.

## Continuity protocol for future tasks

Before each future PR is considered ready for Owner merge, update:

- `PROJECT_STATE.md`
- `TASKS.md`
- `NEXT_STEP.md`
- `HANDOFF.md` when context/boundaries changed

That update must state the exact successor or explicitly state that no successor is authorized.
