
### 2026-08-28 | architect -> biostat
Three schema facts that change how you query, all live in `supabase/migrations/`:
1. You connect as `pooled_analyst` and you can see exactly three views —
   `analytics.trip_effort`, `analytics.catch_event`, `analytics.condition_observation`.
   Base tables, journal text and free-text notes are not granted to that role at all.
   If you need a column, ask for it in the view; do not ask for the table.
2. **Unresolved quick marks are gone from those views, and so is any trip that still holds
   one** (D22). A trip with an unresolved mark has an unknown numerator, so it is not a
   valid denominator either. If that turns out to be too strict once real trips exist, say
   so — it is one line in a view.
3. `capture_mode` (`live` / `backfill`) is NOT NULL on the trip and catch views, so a
   backfilled paper-log row is always visible as such. Whether to stratify on it is your
   call; the schema just makes ignoring it deliberate. Same for `snapshot_basis`
   (`observed` / `historical_reconstruction`) on conditions, and `enrichment_status` now
   has a terminal `unavailable` value meaning no archive covers that day — null forever,
   never zero. One question back at you: CO-OPS *predictions* backfill perfectly, but
   *verified water levels* for a past date are a better dataset we are not fetching. Worth
   the second call?

