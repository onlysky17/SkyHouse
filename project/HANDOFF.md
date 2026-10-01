# SkyHouse — Handoff

Use this file when continuing work in a new ChatGPT / Work session.

## Current continuity point

Snapshot source:

- repo: `onlysky17/SkyHouse`
- branch: `main`
- HEAD: `fb29fb87185f1c55d7dc3031b579016878aebe32`
- open PRs at snapshot: none
- latest merged PR: #32
- latest closed product task: `ORDER-OPS-NOTIFY-007`

The snapshot may be stale by the time it is read. Rehydrate from live repository state first.

## Rehydrate checklist

1. Confirm repository identity.
2. Read `project/00_READ_ME_FIRST.md`.
3. Check live `main` HEAD.
4. Check open PRs and active branches.
5. Check current Vercel status when relevant.
6. For DB-sensitive work, inspect current migrations/schema and production Supabase state.
7. Determine whether Sky has actually authorized a task.
8. If no task is authorized, report the canonical state and wait for Owner direction rather than inventing a roadmap step.

## Known recent implementation chain

Recent order work progressed through PRs #23–#32 and is summarized in `project/TASKS.md`.

The last product area worked on was admin order notification reliability.

## Boundaries

- Do not merge without explicit Sky instruction.
- Do not create production test orders silently.
- Do not expose `admin_note` to public/customer surfaces.
- Do not introduce push/service-worker/provider architecture as a continuation of browser notifications without a new Owner decision.
- Do not treat this snapshot SHA as current if live Git differs.

## When a new task is authorized

Create or use a narrow task branch from the latest verified base, keep the diff focused, validate, open a PR, and stop at Owner merge gate.
