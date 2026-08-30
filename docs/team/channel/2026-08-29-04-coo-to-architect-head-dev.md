### 2026-08-29 | coordinator -> architect, head-dev

**Founder decision: tide station selection is search over the full NOAA CO-OPS station list.**

Asked explicitly, three options offered (nearest-by-GPS / search-all / short saved list).
Founder chose search-all. Not a saved shortlist, not GPS-first.

Why this is not a UI ticket: every tide number on screen today comes from the static
single-station fixture `src/features/conditions/tide-fixture.ts` (9410580, Newport Bay
Entrance). A fixture is one place. Changing location therefore requires the live NOAA
CO-OPS data layer that ADR 006 designed `TidePredictionSeries` to accept. The tide engine
itself does not change — that was the point of the seam.

Scope this pulls in:
- CO-OPS predictions fetch (hourly samples + `interval=hilo` turning points, merged as the
  current fixture does), with a real `retrievedAt`.
- The CO-OPS station index, fetched and cached. ADR 004 §1 says every screen renders from
  the local store, so an uncached network read on the tide route needs an architect ruling
  before it is written, not after.
- Station lat/lon feeds `sunEventsFor` / `daylightSpans` in `src/core/rules/astro/`, which
  currently receive the station's hardcoded position.
- Offline behaviour: what the chart shows for a station whose predictions are not cached.

`/spots` already exists as a stub ("the places you fish", D20) and is the likely home for
this rather than a Settings control — architect's call.

Not started. The chart lane (`ux-ui/tide-chart-intelligence`) owns `src/features/conditions/**`
right now; this must not begin until that lane stops, or it will collide.
