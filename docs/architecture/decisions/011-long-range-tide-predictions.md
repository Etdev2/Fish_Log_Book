# 011 — Long-range tide predictions: hilo for two years, hourly for the near week

**Date:** 2026-10-13 · **Status:** accepted (FL-1, #135) · **Depends on:** 006

## Context
Elliott wants the tide chart to reach 2 years out. NOAA CO-OPS predictions are harmonic, so
they are valid far ahead. The documented `datagetter` limits are 6-minute = 1 month,
hourly = 1 year, and High/Low = 1 year per request (verified 2026-10-13).

## Decision
- Fetch hourly (`interval=h`) for now −2 d … +7 d, and high/low (`interval=hilo`) for
  now −2 d … +730 d. Requests are chunked at ≤ 365 days each and run one after another.
- Merge with `mergeSamples` (a turn wins on collision). Beyond the hourly region the curve is
  the monotone interpolant between published turns (no overshoot; ADR 006 / `height.ts`).
- Cache the merged series in the existing localStorage cache (~80 KB per station).
- The chart renders a 7-day **view window** sliced from the series. A date jump moves the
  window.
- When the source is the fixture or a stale cache, an always-visible banner says so.

## Consequences
Far-future days show a smoother curve than the near week. Pace percentiles are computed over
the mix of hourly and turn-only samples. Offline use beyond the cache still falls back to the
fixture, which is labelled.
