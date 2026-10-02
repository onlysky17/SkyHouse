# SkyHouse — Next Step

## Current active task

`ADMIN-SCROLL-PRESERVE-002 — keep exact admin detail position after tab resume`

Branch:

`task/admin-scroll-preserve-002`

## Implemented

1. Capture both absolute detail scrollTop and distance from bottom.
2. Detect when the Owner is near the bottom.
3. Restore near-bottom views by bottom-gap rather than absolute pixels.
4. Restore once immediately and again after two animation frames.
5. Guard delayed restore with a render epoch.
6. Disable browser `overflow-anchor` on the order detail.
7. Preserve all PR #42 list/filter/trace/focused-field protections.

## Next step

1. Verify branch diff.
2. Wait for Vercel preview/build success.
3. Open PR.
4. Stop at Owner merge gate.
5. After merge: scroll to the bottom → switch tab/window → return → confirm the exact bottom-area position remains stable.

No synthetic production order is authorized.
