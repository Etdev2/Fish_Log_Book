# 011 — Long-range tide predictions: hilo for two years, hourly for the near week

**Date:** 2026-10-13 · **Status:** accepted (FL-1, #135) · **Depends on:** 006

## Context
Elliott wants the tide chart to reach 2 years out. NOAA CO-OPS predictions are harmonic, so
they are valid far ahead. For `product=predictions` the documented `datagetter` limits are
High/Low (`interval=hilo`) = 10 years and every other interval (hourly, 6-minute) = 1 year
per request (API docs "Interval → Data Length Limitation"; the general "High / Low data =
1 year" row covers *observed* high/low water levels, not predictions). Verified live
2026-10-14 at 9410660: a 2-year hilo request returned 2,771 turns and a ~10-year one
14,021; a request past 3,655 days is rejected with "Range Limit Exceeded … 3655 days".
This agrees with `docs/analysis/data-sources.md`.

## Decision
- Fetch hourly (`interval=h`) for now −2 d … +7 d, and high/low (`interval=hilo`) for
  now −2 d … +730 d. That is **one** request per interval. Chunking stays as a guard with
  per-interval limits (365 d for `h`, 3,650 d for `hilo`) and only engages past them.
- Merge with `mergeSamples` (a turn wins on collision). Beyond the hourly region the curve is
  the monotone interpolant between published turns (no overshoot; ADR 006 / `height.ts`).
- Cache the merged series in the existing localStorage cache (~80 KB per station).
- The chart renders a 7-day **view window** sliced from the series. A date jump moves the
  window.
- When the source is the fixture or a stale cache, an always-visible banner says so.

## Consequences
Far-future days show a smoother curve than the near week. Pace percentiles are computed over
a one-week baseline centred on the read instant (slid inward at the series' ends), never the
whole two-year series: ranking against ~105k samples on every scrub step would stall the UI.
The baseline mixes hourly and turn-only samples where the week straddles the near-week edge. Offline use beyond the cache still falls back to the
fixture, which is labelled.
