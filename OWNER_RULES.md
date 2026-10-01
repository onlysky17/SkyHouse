# SkyHouse — Owner Rules

Owner: **Sky**

## Authority

Sky is the final authority for:

- product direction
- visual acceptance
- roadmap changes
- destructive actions
- production-risk decisions
- merge

A question is not an implementation order unless the wording clearly authorizes action.

## Before any mutation

Verify:

- correct project/workspace
- Git root
- branch
- HEAD
- working tree / unrelated WIP
- current task
- open PRs
- current canonical `main`

If the wrong workspace/project is detected, report:

`SAI PROJECT/WORKSPACE`

and stop.

## Execution

- Keep one narrow active task at a time unless Sky explicitly changes scope.
- Continue routine steps automatically inside an already authorized task.
- Do not repeatedly ask for confirmation on routine continuation.
- Stop only at a real boundary: wrong workspace, destructive action, new external-provider authorization, secret requirement, production-risk gate, or material roadmap decision.
- Do not silently expand scope.
- Preserve unrelated WIP.
- Read the exact failure/root cause before retrying.

## Git

- Base work on the latest verified canonical state.
- Prefer a task branch + PR.
- Do not merge without explicit Sky authorization.
- Do not interpret a green PR, “ok”, or a question as merge authorization.
- Avoid destructive Git operations unless explicitly authorized.

## Evidence

Keep these separate:

- source implemented
- build success
- deploy success
- automated checks
- production/runtime observation
- visual inspection
- Owner visual PASS

Only claim what has actual evidence.

## Production data

- Do not create synthetic production orders merely to test notifications unless Sky explicitly authorizes production test data.
- Do not expose internal `admin_note` on customer/public surfaces.
- Do not commit secrets/tokens.

## Continuity rule

A task is not handoff-complete until the root continuity files reflect:

- what changed
- current task state
- merge/deploy evidence
- unresolved validation gaps
- exact next step
