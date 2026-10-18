# 011 — Long-range tide predictions: hilo for ±two years, hourly where you are looking

**Date:** 2026-10-13 · **Amended:** 2026-10-18 · **Status:** accepted (FL-1, #135) · **Depends on:** 006

## Context
Elliott wants the tide chart to reach 2 years out, and 2 years back, scrolling continuously.
NOAA CO-OPS predictions are harmonic, so they are valid far ahead. For `product=predictions`
the documented `datagetter` limits are High/Low (`interval=hilo`) = 10 years and every other
interval (hourly, 6-minute) = 1 year per request (API docs "Interval → Data Length
Limitation"; the general "High / Low data = 1 year" row covers *observed* high/low water
levels, not predictions). Verified live 2026-10-14 at 9410660: a 2-year hilo request returned
2,771 turns and a ~10-year one 14,021; a request past 3,655 days is rejected with "Range Limit
Exceeded … 3655 days". This agrees with `docs/analysis/data-sources.md`.

## Decision
- Fetch high/low (`interval=hilo`) for now −730 d … +730 d: **one** request (1,461 days, under
  the 3,650-day guard). Fetch hourly (`interval=h`) for now −2 d … +7 d up front.
- Hourly detail for anywhere else loads **lazily**, in 28-day blocks aligned to the Unix epoch,
  for the blocks the drawn slice touches (`hourly-blocks.ts`, `use-hourly-blocks.ts`). Each
  block is one request (≤ 365 d), saved on the device on arrival, and read back from there
  next time. Chunking stays as a guard with per-interval limits (365 d for `h`, 3,650 d for
  `hilo`).
- Merge with `mergeSamples` (a turn wins on collision). Where no hourly block is loaded the
  curve is the monotone interpolant between published turns (no overshoot; ADR 006).
- The base series (turns plus the near-week hourly points) is cached in localStorage
  (~100 KB per station). A cached series that does not reach both ends of the wanted window
  is treated as stale (`coversWindow`) and refetched.
- The chart's scroll track is the whole range wide; only a ~9-day slice around the read-head
  is rendered (`tide-view-window.ts`), moving in 2-day steps. The height scale is fixed for
  the whole range so the curve does not rescale as the slice moves.
- 6-minute data is not used: subordinate stations do not publish it, it is 10× the volume,
  and hourly plus the exact turns is within a few centimetres of it.
- When the source is the fixture or a stale cache, an always-visible banner says so.

## Labels
`heightAt` / `rateAt` say what an "Interpolated" value was drawn between: *NOAA hourly
prediction samples* (bracketing samples ≤ 65 min apart) or *NOAA high/low turns only* (wider).

## Consequences
Pace percentiles are computed over a one-week baseline centred on the read instant (slid
inward at the series' ends), never the whole four years: ranking against ~35k samples on
every scrub step would stall the UI. The baseline mixes hourly and turn-only samples where the
week straddles the edge of loaded hourly detail. Offline use beyond the cache still falls back
to the fixture, which is labelled.
