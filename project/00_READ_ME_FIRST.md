# SkyHouse — Read Me First

Owner: **Sky**

This folder is the canonical project-continuity entry point for humans and ChatGPT Work.

## Bootstrap order

Before doing any product or repository work:

1. Verify the repository is `onlysky17/SkyHouse`.
2. Verify the live Git root / repository, branch, HEAD, working state, and open pull requests.
3. Treat live repository/runtime evidence as stronger than this snapshot.
4. Read, in order:
   - `project/RULES.md`
   - `project/PROJECT_STATE.md`
   - `project/TASKS.md`
   - `project/ROADMAP.md`
   - `project/DECISIONS.md`
   - `project/HANDOFF.md`
   - newest file under `project/checkpoints/`
5. Only then continue an authorized task.

## Truth priority

Use this order when facts conflict:

1. Runtime / production evidence
2. Live Git state and repository source
3. `project/` continuity files
4. Legacy `_meta/` implementation notes
5. Chat history / remembered context

`_meta/` is retained as historical implementation evidence. It is **not** the primary project memory surface.

## Important Owner rules

- QUESTION != INSTRUCTION.
- QUESTION != ROADMAP_CHANGE.
- Do not invent missing state, capability, files, commits, test results, or Owner approval.
- Do not claim PASS / complete / ready without evidence.
- Build, deploy, test, screenshot, and visual Owner approval are different evidence classes.
- Preserve unrelated WIP.
- One narrow active task at a time unless Sky explicitly changes scope.
- Sky controls merge.
- Do not merge merely because a PR is green or mergeable.
- For routine continuation inside an already authorized task, continue without repeatedly asking.
- Stop only at a real boundary such as wrong project/workspace, destructive action, new provider authorization, secret/credential requirement, or material product/roadmap decision.

## Starting Work

For a ready-made Work bootstrap prompt, open:

`project/WORK_BOOTSTRAP.md`
