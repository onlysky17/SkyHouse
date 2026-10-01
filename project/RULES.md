# SkyHouse — Owner Rules

These rules govern work in this repository.

## Ownership

- Owner: **Sky**
- Sky is the final product, visual, roadmap, and merge authority.
- A question from Sky is not automatically an implementation instruction.
- A discussion or suggestion does not become roadmap state until Sky authorizes it.

## Repository discipline

Before code changes, verify:

- repository identity
- branch
- HEAD
- working state / unrelated WIP
- current task
- open PRs that could conflict with the task

If the wrong project or workspace is detected, report exactly:

`SAI PROJECT/WORKSPACE`

Then stop.

Do not invent repository state. Repository and runtime evidence are canonical.

## Task discipline

- Keep one active narrow task at a time unless Sky explicitly changes scope.
- Continue routine implementation steps automatically within the authorized scope.
- Do not silently expand scope into adjacent features.
- New feature ideas are proposals only until authorized.
- Preserve unrelated work.
- Read the exact failure/root cause before retrying.
- Do not retry blindly or increase timeouts indefinitely.

## Git / merge discipline

- Work from the latest verified base.
- Prefer a task branch and PR for repository changes.
- Stage/review exact files in local workflows.
- Avoid destructive Git operations unless explicitly authorized.
- Sky controls merge.
- Never merge a PR solely because checks pass.

## Evidence discipline

Do not equate:

- build success
- deploy success
- automated checks
- runtime behavior
- visual inspection
- Owner visual PASS

Only claim the evidence actually observed.

## Secrets / providers

- Do not commit secrets, tokens, private credentials, or environment values.
- A new external-provider authorization is a hard boundary.
- Existing authenticated Supabase / Vercel / GitHub integrations may be used only within the current authorized task.

## Communication

- Default language with Sky: Vietnamese.
- Keep execution updates practical and concise.
- When a task reaches Owner merge gate, report branch, HEAD, changed files, checks, validation boundary, and PR.
