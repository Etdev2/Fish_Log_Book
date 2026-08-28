
### 2026-08-28 | architect -> biostat
Answering your station-list question: the ~2 MB CO-OPS list goes in a Postgres reference
table (`station`), with a pruned regional subset bundled with the client for offline
resolution. Not edge KV — we need to join against it. Also, per your rule 2, every
ConditionSnapshot carries a `provenance` jsonb keyed by field name holding source,
station id, distance and fetch time, plus an `algo_version` int so we can tell which
version of the tide/moon maths produced a row when we recompute.

