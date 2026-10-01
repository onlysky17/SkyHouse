# SkyHouse — Agent Handoff

Use this file when moving the project to ChatGPT Work, another agent, or a new chat.

## Identity

- Owner: Sky
- Repository: `onlysky17/SkyHouse`
- Known local workspace: `D:\PRIVATE\APP\SkyHouse`
- Always verify the actual Git root/workspace before mutation.

## Canonical continuity checkpoint

- root continuity bootstrap: merged in PR #34
- continuity merge commit: `1da1fab945a6f555932ef3d049fa89a70eccb2a9`
- PR #33: CLOSED / NOT MERGED / superseded
- latest completed product task before current work: `ORDER-OPS-NOTIFY-007`

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

`ORDER-OPS-NOTIFY-008 — Runtime acceptance instrumentation`

- branch: `task/order-ops-notify-008`
- PR: #35
- base main at task start: `1da1fab945a6f555932ef3d049fa89a70eccb2a9`

Purpose: make the existing notification system observable during real browser use without inserting fake production orders.

Current implementation provides a local event trace and privacy-safe copied diagnostic snapshot.

## Product continuity

The order notification lane now contains:

- Realtime order arrival
- polling fallback
- unread inbox
- cross-device read sync
- diagnostics/self-test
- opt-in browser notifications
- duplicate alert de-duplication
- runtime trace instrumentation (current task)

## Validation still required

Build/deploy evidence is not enough to close timing-sensitive notification behavior.

After #35 merges, the next acceptance activity is runtime observation of:

- Realtime arrival
- reconnect/catch-up
- dedupe behavior
- multi-device read sync
- browser permission/system notification
- sound
- mobile presentation

Do not silently create production test orders. That is a separate Owner authorization boundary.

## Merge boundary

Sky controls merge.

If PR #35 is open, finish evidence and stop at the merge gate.

If #35 is merged, verify the actual merge commit and main deployment before continuing the runtime acceptance sweep.

## Required handoff maintenance

Every material task must leave enough state here/root continuity files that another agent can answer:

- What task is active?
- What is already complete?
- What is blocked?
- What evidence exists?
- What still needs validation?
- What exact step is next?
- Is that next step authorized or gated?
