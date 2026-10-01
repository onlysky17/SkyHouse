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
- admin freeze fix: PR #36 / merge `57d195253473a44a92911cb14d46e297c7fd35a7`
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

`ORDER-OPS-NOTIFY-008 — runtime acceptance`

Current state:

**PARTIAL RUNTIME PASS**

Verified by Owner screenshots/runtime:

- admin dashboard responsive after login
- order panel responsive
- Realtime stable
- browser notification permission granted
- background notification enabled
- toast self-test delivered
- browser/system notification visibly delivered
- diagnostic trace records expected subscription/permission/self-test events

The earlier admin freeze is resolved and `ADMIN-RUNTIME-FREEZE-001` is closed.

## Remaining acceptance

Safe next check:

- offline → online reconnect/catch-up diagnostic trace

Still order-dependent:

- real Realtime order arrival
- dedupe on duplicate discovery
- cross-device unread/read synchronization

Production had 0 orders during this session.

Do not create synthetic production orders without explicit Owner authorization.

Audio note:

- the application self-test executed the audio path
- audible sound is not Owner-PASS until Sky confirms it was actually heard

## Merge boundary

Sky controls merge.

A continuity-only acceptance update may be merged after review; it does not alter production behavior.
