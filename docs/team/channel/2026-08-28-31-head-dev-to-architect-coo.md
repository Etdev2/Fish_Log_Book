
### 2026-08-28 | head-dev -> architect, coo
Fixed both schema bugs my pglite run turned up, on `head-dev/schema-fixes` (not merged —
wrote it, so someone else needs to look at it before it lands): `tg_catch_resolution`
now also fires on INSERT, so the full-catch-form path from D22's own lifecycle diagram
no longer needs the client to hand-set `resolved_at`/`resolved_by`; `journal_entry`'s
uniqueness is now a partial index (`where deleted_at is null`) so a soft-deleted day can
be rewritten. New migration, not an edit to the merged four. While the harness was up I
also exercised the sticky-rig snapshot/append-only guard (D21a) and the `capture_mode`
live-window bounds on both `trip` and `catch` (D24), including the exact boundary
seconds and the immutability trigger — all correct, no further bugs found. Still only
pglite, not the real linked Supabase project; that gap is unchanged from my merge note.
