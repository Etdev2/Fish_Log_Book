# 013 — A real chart under the boundaries, and official boundary geometry

**Date:** 2026-10-18 · **Status:** proposed — needs Et's acceptance before any code ·
**Supersedes:** ADR 007 §5 "Raster tile packs: no, not in V1" (the rest of ADR 007 stands)

## Context

Et reviewed the Legal map on an iPhone on 2026-10-18 and asked for "a real map with real
boundaries … like Navionics, maps people can rely on." Today the map is an ocean-blue
panel with hand-simplified lines labelled "(simplified)" (`boundary-leaflet.tsx`).

ADR 007 §5 ruled out a basemap for V1 and wrote down the trigger for revisiting it: "if
real use on the water shows anglers cannot orient without imagery." The founder's review
is that trigger. ADR 007 also says the map may not get a tile layer without a superseding
ADR. This is that ADR.

Two separate problems are bundled in the request, and they get separate answers:

1. **Orientation.** No coastline detail, depth or harbour names, so nobody can tell where
   they are. A chart layer fixes this.
2. **Trust in the lines.** The RCA line, Cowcod areas and MPA are drawn from a few
   hand-entered waypoints. Official geometry fixes this, with or without a chart.

## Decision (proposed)

### 1. The basemap is NOAA's nautical chart, online, under the vectors

- Source: NOAA Office of Coast Survey's ENC-derived chart display service (the public
  "NOAA Chart Display" map service). It is US-government work, free, with soundings,
  depth contours, aids to navigation and harbour detail: the public equivalent of a
  Navionics chart for US waters.
- Navionics itself is a licensed Garmin product. Using it needs a commercial agreement,
  so it is out of scope unless Et wants to price one (`cfo`).
- The chart is a Leaflet tile or WMS layer in `boundary-leaflet.tsx`, the one file that
  may import Leaflet. Attribution reads "Chart: NOAA Office of Coast Survey".
- Outside US waters (the Baja packs) no chart is drawn. The map says so instead of
  borrowing a different vendor's tiles.

### 2. Offline, the map still works, and says what is missing

- With no signal the chart is absent, and the map shows a one-line notice ("Chart needs
  signal. The boundaries and your position below still work."). The boundary vectors,
  position and legal answer come from the offline package exactly as ADR 007 requires.
- A downloadable one-region chart pack is the next step, under ADR 007's own conditions:
  size shown before download, `navigator.storage.estimate()` first, and the rules package
  never evictable behind it. That is a follow-up ADR when the online chart has proved
  itself.

### 3. Boundaries come from the agency, with the simplification recorded

| Layer | Official source | Notes |
| --- | --- | --- |
| California MPAs | CDFW `ds582` (cartographic) and `ds3207` (from CCR §632) | ds582 carries CDFW's "not intended for navigational use or defining legal boundaries" disclaimer, rendered verbatim (ADR 007 §3) |
| 50-fm RCA lines | 50 CFR §660.72(a) (Subpart C waypoint tables) | Waypoints are published as coordinates; import them, do not trace them |
| Current recreational closed areas | 50 CFR §660.70(t) | Import the current recreational closures with their stated applicability. Older Cowcod Conservation Area geometry must not be turned into a current restriction |
| Groundfish management areas | 50 CFR 660 / CDFW | Same |

Citations corrected 2026-10-18 from Codex's review and #174; the importing session confirms
each against the live eCFR before use. Each imported layer records source URL, retrieval
date, and `simplify_tolerance_m` in
`RuleProvenance`. The resolver widens its ambiguity band by that tolerance (ADR 007 §3).
`scripts/` gets a refresh script per source, like `refresh-enso.mjs` (ADR 012), so an
update is a reviewed diff, not a hand edit.

### 4. When the chart and the lines disagree, the lines win

The legal answer is computed only from the vectors. The vectors draw above the chart.
The map footer says: "The chart is for finding your way. The legal answer uses the
official boundary lines drawn on top."

## Consequences

- The map can show a chart and a line that disagree by tens of metres where NOAA's chart
  and the agency's line were made at different times. Section 4 decides which one counts.
  ADR 007 named this risk, and it is the price of orientation.
- The NOAA service has no uptime promise to us. When it fails, the map falls back to the
  offline view in section 2, which is today's map with official lines.
- Agent sessions need network access to these hosts to build and verify this. The
  2026-10-18 cloud session was denied all of them (see that day's worklog).

## Before any code

1. Et accepts or amends this ADR.
2. A session with network access verifies the exact NOAA service endpoint, its terms and
   attribution wording, and downloads the boundary sources. No endpoint or coordinate in
   this repo may come from memory.
3. `counsel` reads the disclaimer wording before the first release that draws ds582
   geometry.
