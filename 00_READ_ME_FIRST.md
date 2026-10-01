# SkyHouse — READ THIS FIRST

Owner: **Sky**

This repository root is the SkyHouse project workspace. Do **not** create a nested `project/` workspace.

Known local workspace used by Owner:
`D:\PRIVATE\APP\SkyHouse`

The path is a continuity hint only. Always verify the actual workspace before changing files.

## Bootstrap order for any new agent / ChatGPT Work session

1. Verify this is repository `onlysky17/SkyHouse`.
2. Verify the local workspace / Git root / branch / HEAD / status.
3. Check live `origin/main` and open pull requests.
4. Read, in this order:
   - `OWNER_RULES.md`
   - `PROJECT_STATE.md`
   - `TASKS.md`
   - `NEXT_STEP.md`
   - `DECISIONS.md`
   - `HANDOFF.md`
5. Compare the snapshot files with live repository/runtime evidence.
6. Continue the active Owner-authorized task if one exists.
7. If there is no active authorized product task, do not invent one.

## Truth priority

When information conflicts, use:

1. Runtime / production evidence
2. Live Git state and repository source
3. These root continuity files
4. Legacy `_meta/` notes
5. Chat history / memory

## Hard rules

- QUESTION != INSTRUCTION.
- QUESTION != ROADMAP_CHANGE.
- Do not claim PASS / complete / ready without evidence.
- Build/deploy success != runtime PASS != Owner visual PASS.
- Preserve unrelated WIP.
- Sky controls merge.
- Wrong workspace/project => report exactly `SAI PROJECT/WORKSPACE` and stop.

## Continuity maintenance

Every future task that materially changes project state must update at least:

- `PROJECT_STATE.md`
- `TASKS.md`
- `NEXT_STEP.md`

before that task is considered ready for Owner merge.

This is what lets another agent continue without reconstructing the project from chat history.
