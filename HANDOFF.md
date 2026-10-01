# SkyHouse — Agent Handoff

Use this file when moving the project to ChatGPT Work, another agent, or a new chat.

## Identity

- Owner: Sky
- Repository: `onlysky17/SkyHouse`
- Known local workspace: `D:\PRIVATE\APP\SkyHouse`
- The local path must be verified; never assume it is the active Git root.

## Last verified product checkpoint

- latest completed product task: `ORDER-OPS-NOTIFY-007`
- latest completed product PR: #32
- merge commit: `fb29fb87185f1c55d7dc3031b579016878aebe32`

## Important correction

PR #33 was a mistaken continuity implementation:

- it created a nested `project/` directory
- it was closed without merge
- do not resurrect that layout

The correct model is root-level continuity files in the existing SkyHouse workspace.

## Rehydrate procedure

Before changing anything:

1. verify Git root
2. verify branch/HEAD/status
3. inspect `origin/main`
4. inspect open PRs
5. read all root continuity files
6. inspect the exact active task branch/PR if one exists
7. inspect Vercel/Supabase only when relevant to the task

## Current task at handoff creation

`PROJECT-CONTINUITY-001`

This is infrastructure/documentation work only.

It does not authorize a new product feature.

## Product continuity

The last development lane focused on admin order notification reliability:

- Realtime order arrival
- polling fallback
- unread inbox
- cross-device read sync
- diagnostics/self-test
- opt-in browser notifications
- duplicate alert de-duplication

Known remaining evidence gap: full runtime/visual acceptance across browser permission, background tab, audio, multi-device and reconnect timing.

## Merge boundary

Sky controls merge.

If the current continuity PR is still open, finish verification and stop at the merge gate.

If it is already merged, verify the actual merge commit, update local `main`, then continue only the next Owner-authorized task.

## Required handoff maintenance

Every material task must leave enough state in these root files that another agent can answer:

- What task is active?
- What is already complete?
- What is blocked?
- What evidence exists?
- What still needs validation?
- What exact step is next?
- Is that next step authorized or only a candidate?
