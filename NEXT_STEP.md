# SkyHouse — Next Step

## Current active task

`ADMIN-RESUME-NO-RERENDER-001 — avoid full panel rebuild on unchanged tab resume`

Branch:

`task/admin-resume-no-rerender-001`

## Why the direction changed

Owner video proves PR #42/#43 scroll restoration is not enough: the full DOM replacement is itself visible as a jump.

The cleaner fix is to stop rebuilding the panel when a resume refresh returns the same UI-relevant data.

## Implemented

1. Capture a signature of current orders before a silent refresh.
2. Compare it with the fetched order payload.
3. Compare unread state before/after remote seen sync.
4. Compare notice state.
5. If all are unchanged, skip `renderPanel()`.
6. Update only Realtime health / last-sync text in place.
7. Preserve full rendering for explicit refreshes or actual data changes.

## Next step

1. Verify branch diff.
2. Wait for Vercel preview/build success.
3. Open PR.
4. Stop at Owner merge gate.
5. After merge, runtime-test the same video sequence:
   - scroll near the bottom of an order
   - switch to ChatGPT
   - return to SkyHouse
   - confirm there is no visible redraw/jump while the sync time still updates

No synthetic production order is authorized.
