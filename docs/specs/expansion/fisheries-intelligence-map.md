# Fisheries intelligence map

**Status:** Proposed — Phase 2, hard-blocked by privacy governance and the analytical store
**Date:** 2026-09-15
**Governs:** aggregated catch maps, environmental overlays, time animation, research and agency analytics views
**Extends:** `docs/specs/expansion/privacy-consent-and-data-governance.md`, `data-architecture-expansion.md` §8
**Audit:** `00-repository-audit.md` §6 G4, G8
**Phase:** 2

---

## 1. Problem statement

The only map in the product today is the Fish Legal boundary view: a Leaflet map, loaded
dynamically, showing a simplified regulatory polyline with a plain-English ribbon over it.
It is good at its job and its job is small.

The brief asks for something categorically different — a Google-Earth-like exploration of
catch density, species distribution, depth, migration, environmental overlays and
year-over-year change, for anglers, researchers and agencies.

Two things make this hard, and only one of them is technical.

**The technical one:** there is no aggregate store, no tile pipeline, no clustering, no
time-series index. Rendering a million catches in a browser on a phone is not a matter of
choosing a map library.

**The one that matters more:** *a good fishing map is a description of where fish are, and
where fish are is the thing anglers will not share.* Every rendering decision in this spec
is a privacy decision wearing a cartography costume. A heat map at the wrong resolution is
a spot-finder. A time slider over a sparse dataset is a surveillance tool pointed at three
people. The brief's own instruction — *do not show individual fish icons at exact private
coordinates on public maps* — is necessary and nowhere near sufficient.

---

## 2. Users and stakeholders

| Audience | Question they open the map to answer | Max precision |
|---|---|---|
| Angler, own data | "Where do *I* catch them, and when?" | `EXACT` (their own rows) |
| Angler, community view | "Is this area worth a look this month?" | `CELL_50KM` + delay |
| Tournament host | "Where is the fleet fishing, inside the boundary?" | `CELL_10KM`, event-scoped, event-duration |
| Researcher | "Distribution and size structure by season" | `CELL_10KM` by grant |
| Agency analyst | "Pressure, compliance, stock signal by management area" | Management-area rollup, `CELL_10KM` by grant |
| Conservation org | "Habitat use and change over time" | `CELL_50KM` |
| Adversary | "Where is the bite" | must gain nothing the public tier does not intend |

---

## 3. Product goals

1. The angler's **own** map is the valuable one, and it ships first. It needs no privacy
   machinery, no aggregate store and no consent — it is their data.
2. Any cross-user surface renders only from `agg_*` tables that were already suppressed at
   build time. The map layer cannot see a catch row.
3. Every layer states its resolution, its delay and its sample size, on the layer itself,
   not in a help page.
4. Suppressed and absent are visually different, always.
5. Usable on a phone, on a boat, one-handed, at 320 px, with the map never becoming a
   scroll trap.
6. A non-visual equivalent exists for every map answer (§12).

---

## 4. Non-goals

- A 3-D ocean/seafloor visualisation in Phases 2–3. It is the most expensive item in the
  brief and the least defensible: bathymetry at 450 m resolution rendered in 3-D looks
  authoritative and is not. Phase 5, if ever, and only over licensed high-resolution
  survey data.
- A public global heat map of catches. Not a non-goal forever; a non-goal until there is
  enough data for k-anonymity to mean something, which is a data volume question, not a
  date.
- Real-time fleet tracking. Not asked for, and it is the single feature most likely to end
  the product's relationship with its users.
- Replacing the Fish Legal boundary map. That view stays, owned by Fish Legal.
- Choosing a map provider in this spec. §9 states the evaluation instead.

---

## 5. User stories

1. As an angler, I open **My map** and see my own catches, exactly where they were, with
   filters by species, season and rod — and it works offline for the tiles I have cached.
2. As an angler, I switch to **Community** and see coarse cells with counts, a visible
   "10 km · 30-day delay · 14 anglers" label, and honest gaps where there are not enough
   reports.
3. As an angler, I scrub a time slider across three seasons and watch yellowtail cells move
   north, with the sample size updating as I scrub so I can see when the trend is three
   fish.
4. As a researcher, I filter to one species, one depth band and one SST range, and export
   the visible selection with a manifest stating precision, delay, k and the grant.
5. As an agency analyst, I see catch and effort by management area with CPUE shown only
   where effort is `MEASURED`, and a plain note everywhere else.
6. As a host, I see my fleet's catches inside my boundary during my event, and the layer
   disappears when the event closes.
7. As a screen-reader user, I open the same view as a ranked table of cells and read the
   same numbers.

---

## 6. Complete workflow

### 6.1 Three maps, not one

```text
MY MAP          own rows, EXACT, offline-capable, no consent needed      Phase 2a
COMMUNITY       agg_* only, CELL_50KM default, delayed, k-gated          Phase 2b
ANALYTICS       agg_* at granted precision, grant-scoped, audited        Phase 2c
```

They share components and share nothing else. **A single map with a "privacy mode" toggle
is the wrong design**: one bug in a toggle leaks every spot in the system. Three surfaces
with three data sources cannot leak into each other by accident.

### 6.2 Layer model

Each layer declares, as data:

```ts
interface MapLayer {
  id: string;
  source: 'own' | 'aggregate' | 'environmental' | 'regulatory';
  minPrecision: PrecisionLevel;     // coarsest it may ever render
  temporalDelayDays: number;
  requiresGrant: boolean;
  kGate: boolean;
  legend: LegendSpec;               // units, scale, and what "no data" looks like
  attribution: string;              // provider licence text, mandatory
}
```

A layer with `source: 'aggregate'` cannot be constructed with a data URL that points at a
catch table. Enforced by types and by a test.

### 6.3 Rendering strategy by zoom

| Zoom | Own map | Community / analytics |
|---|---|---|
| World – region (z0–6) | clustered counts | `CELL_50KM` choropleth |
| Area (z7–10) | clustered counts | `CELL_50KM`, or `CELL_10KM` **if** granted and k passes |
| Local (z11–13) | individual pins | **stops coarsening down** — cells stay at their granted level and simply get larger on screen |
| Spot (z14+) | pins + accuracy circles | no aggregate rendering at all; the layer greys out with *"Too close in for shared data"* |

**Rule M1.** Zoom never increases precision on a shared layer. This is the single most
important interaction rule in the spec, because it is the one a user will instinctively try
to defeat.

**Rule M2.** Cells are drawn as cells — square, edge-to-edge, obviously a grid. Never as
smoothed heat blobs. A gaussian blur over coarse cells *implies* sub-cell structure that
does not exist, which is both a privacy leak by suggestion and a false scientific claim.

### 6.4 Time animation

A slider over `period_grain`. Rules:

- The sample size renders **beside the slider**, updating as it moves. A cell with 3 fish
  and a cell with 300 must never look alike.
- Below the k threshold the cell renders as "suppressed" hatching, not as empty.
- Playback is opt-in, respects `prefers-reduced-motion` (stepping instead of animating),
  and has a visible step control — motion is never the only way to traverse time
  (baseline §4).
- The default window is a **season**, not a day. Daily granularity on a sparse dataset is
  where differencing attacks live.

### 6.5 Depth visualisation

Two distinct facts the brief conflates:

- **Fish depth** (`catch.depth_fished_m`) — where the fish was. Sparse, angler-entered.
- **Water depth** (`catch.bottom_depth_m` from the sounder, or modelled
  `seafloor_depth_m`). Different provenance, different confidence.

They render as separate layers with separate legends, never as one "depth". A depth-band
filter operates on fish depth; a bathymetric basemap operates on water depth and carries
its resolution in the legend (GEBCO ≈ 450 m).

---

## 7. Screen and component requirements

### 7.1 Navigation

The map is a top-level destination in `destinations.ts` under **Your fishing** ("Map — where
you catch them"). It is not buried in Settings; `destinations.ts` already records what
happened the last time something was.

**But** the bottom bar holds six and cannot hold more (measured: 97 px and two rows at
320 px — `ui-ux-critic-loop.md` R1-A). Adding the map means removing something from the bar
or fixing the bar. That is a decision `ux-ui` owns and this spec must not pre-empt.

### 7.2 Map screen layout (320 px first)

```text
┌──────────────────────────────┐
│ ‹ Back      Map      [Layers]│  44 px
├──────────────────────────────┤
│                              │
│         map canvas           │  flex, min 320 px
│                              │
│  ┌────────────────────────┐  │
│  │ 10 km · 30-day delay   │  │  persistent provenance chip,
│  │ 14 anglers · 212 fish  │  │  bottom-left, never dismissible
│  └────────────────────────┘  │
├──────────────────────────────┤
│ [Species ▾][Season ▾][More ▾]│  48 px filter bar
├──────────────────────────────┤
│ ◀━━━━━●━━━━━▶  Summer 2026   │  time slider, 68 px with label
└──────────────────────────────┘
```

- The map canvas **must not capture page scroll**. One-finger drag pans the map only after
  an explicit "activate map" tap, or the map is height-constrained with page scroll
  outside it. A full-bleed map inside a scrolling app is the classic mobile trap.
- Filters open as sheets, reusing the existing sheet pattern, not as dropdown menus.
- The provenance chip is part of the map, not a legend the user must find.

### 7.3 Empty, loading, offline, error, suppressed — all five, distinct

| State | Copy |
|---|---|
| Loading | Skeleton grid, no spinner over a map (it reads as the map being wrong) |
| Empty — no data anywhere | *"No reports here yet."* |
| Empty — filtered out | *"No reports match these filters."* + Clear filters |
| Suppressed | Hatched cells + *"Not enough independent reports here yet."* **Never a zero.** |
| Offline, own map | Cached tiles + own catches; banner *"Offline — showing your saved map."* |
| Offline, community | Layer unavailable; *"Shared data needs a connection."* No stale aggregates. |
| Error | *"The map did not load. Everything else still works."* + Retry — matching the existing tournament `ErrorScreen` pattern |

### 7.4 Legend

Always visible, never a modal. States units, scale, resolution and what "no data" looks
like. Colour scales are colour-blind-safe and are never the only encoding (pattern or
value label carries the same information) — `docs/design/01-foundations.md` §1.3.

---

## 8. Data requirements

Reads exclusively from `agg_catch_cell_period`, `agg_effort_cell_period`,
`agg_species_cell_period` (`data-architecture-expansion.md` §8) for shared layers, and from
the local IndexedDB catch store for **My map**.

Suppressed rows are present with nulled counts (Rule D4). The map renders hatching from the
row's existence, which is why they must not be filtered out at build time.

Environmental overlays (SST, chlorophyll, bathymetry) are served as **pre-rendered raster
tiles from the provider or a cache**, never assembled client-side. Attribution is mandatory
per layer.

---

## 9. API, service and provider requirements

### 9.1 Provider evaluation, not provider choice

The brief says do not assume a provider until licensing, cost and feasibility are
evaluated. Agreed. The evaluation, to be run by `cfo` + `architect` before Phase 2b:

| Candidate | Licence risk | Cost shape | Offline | Verdict to test |
|---|---|---|---|---|
| **Leaflet + OSM raster** (already in the build) | Permissive; attribution required | Tile hosting or a free tier with usage limits | Cacheable | Cheapest path; bad at 3-D and at large vector loads |
| MapLibre GL + open vector tiles | Permissive | Self-host or vendor | Cacheable | Best balance for vector cells, time animation and styling |
| Mapbox | Commercial, per-load | Scales with MAU | Limited by terms | Fast to build, expensive to grow, terms restrict offline |
| Google Maps / Earth | Commercial, strict | Per-load, higher | Prohibited caching | The brief's visual reference; the licence is the problem, and *"Google-Earth-like"* is a look we can approach without their tiles |
| Marine charts (NOAA ENC) | Public domain (US) | Free | Cacheable | Genuinely useful and free for US waters; the single highest-value niche layer |

**Recommendation:** stay on Leaflet for Phase 2a (My map), evaluate MapLibre GL for 2b/2c,
and treat NOAA ENC charts as the differentiating layer rather than photorealistic terrain.
`cfo` holds the decision; this spec holds the criteria.

### 9.2 Endpoints

```text
GET /api/v1/aggregates/cells?level&grain&from&to&species&bbox   grant-gated, k-gated
GET /api/v1/aggregates/timeseries?cell&species&grain            same
POST /api/v1/exports                                            async, manifested
```

- Server computes and serves the granted precision. The client cannot request finer.
- Responses carry the provenance block (level, delay, k, anglers, catches, build version)
  in the payload, so the chip in §7.2 cannot disagree with the data.
- `bbox` is snapped to cell boundaries server-side; an unsnapped bbox is a differencing
  primitive.
- Cursor pagination; hard cap on cells per response.

### 9.3 Export manifest

Every export ships a manifest, in the file, stating: grant id, purpose, precision level,
temporal delay, k threshold and dominance cap, species policy versions applied, suppressed
cell count, build version, provider attributions, redistribution permission, and the
sentence *"Coordinates in this file are cell centroids, not catch locations."*

---

## 10. Offline behaviour

- **My map** works offline: local catches plus whatever tiles are cached. Tile
  pre-download for saved spots is `ROADMAP.md` D4 and belongs here.
- **Community and analytics do not work offline.** No stale aggregates are shown, because
  a stale aggregate with a fresh-looking timestamp is worse than a missing layer.
- Filters, species lists and the legend are cached and render offline so the screen is not
  blank.
- Nothing about the map enters the outbox. It is read-only.

---

## 11. Privacy and security requirements

Everything in `privacy-consent-and-data-governance.md` applies. Map-specific additions:

1. **Rule M1** (zoom never refines) and **Rule M2** (cells look like cells).
2. The shared map service has no database grant on `catch`. It physically cannot read a
   catch row. This is enforced by role, not by code review.
3. `bbox` snapping and a minimum bbox size, to defeat "shrink the window until one angler
   remains".
4. Per-session query-shape auditing: repeated near-identical bboxes differing by one cell
   are a differencing signature and are rate-limited and logged.
5. Species with `protected`/`suppressed` policy are excluded from community layers
   entirely, not merely coarsened. A hatched cell that appears only for a rare species is
   itself a disclosure.
6. Screenshots cannot be prevented; therefore nothing may be rendered that would be harmful
   in a screenshot. This is the design constraint, not a warning to users.
7. Tournament fleet layers are event-scoped and expire with the event. A host does not keep
   a map of where their entrants fish.

---

## 12. Accessibility requirements

A map is the least accessible component a product can ship, so the non-visual path is a
requirement, not an alternative.

- **Table view**, toggled from the map, same data, same filters: cell name (nearest
  named place + cell id), count, anglers, and the suppression state. It is a real
  `<table>` with headers, sortable, and it is the surface a screen reader gets by default.
- All map controls are keyboard-reachable; pan and zoom have button equivalents (baseline
  §3: nothing important is gesture-only).
- The time slider is a real `<input type="range">` with a text label, arrow-key steppable,
  and its value announced on change (`aria-live="polite"`).
- Colour scales are colour-blind-safe and carry a second encoding.
- Focus is never lost into the map canvas; the canvas is a single focus stop with a
  described summary, and detail lives in the table.
- Reduced motion disables animated playback and pan easing.
- Text in the legend and provenance chip is at body scale, not caption scale. At 320 px
  this is the hardest constraint in the layout and it is not negotiable.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| One angler contributes 90 % of a cell | Dominance cap fails → suppressed, even if angler count ≥ k |
| Cell spans a jurisdiction boundary | Rendered as its own cell; management-area rollups assign by centroid and say so |
| Species renamed/split mid-period | Aggregates rebuilt under both labels with a mapping note (`data-architecture-expansion.md` §13) |
| Very high density (a tournament bay) | Cell counts saturate the colour scale; use a perceptual scale with a stated cap and say "500+" rather than blowing the ramp |
| All cells suppressed | The honest empty state, plus *"This view needs more independent reports before it can show anything."* |
| Zoom to a single cell | Renders one large square. It does not decompose. (Rule M1) |
| Offline mid-scrub | Time slider keeps the last loaded frames, greys the rest, and says so |
| Antimeridian / polar | Cells are invalid there (`data-architecture-expansion.md` §12); the layer refuses rather than renders wrong |
| Two overlapping grants at different precision | Coarsest wins (privacy §13) |

---

## 14. Failure states

- Aggregate service down → layer error state, own map unaffected (separate failure
  domains, by design).
- Tile provider down → basemap falls back to a plain graticule with cells still drawn. A
  map with no basemap is degraded; a map with no cells is broken.
- k-gate computation failure → suppress everything. Fail closed.
- Grant expired mid-session → layer disappears with an explicit message, not a silent
  empty map.
- Export job failure → no partial file (privacy §14).

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Own-map weekly use among anglers with ≥ 20 catches | > 40 % |
| Community-layer sessions ending with a filter change | > 50 % (a map nobody filters is a poster) |
| Suppressed-cell ratio | Reported. Falling is only good if angler density is rising. |
| Differencing-signature rate limits triggered | Reported and investigated; target is not zero, it is *investigated* |
| p95 cell-query latency | < 400 ms |
| Table-view usage | Reported — it is also used by sighted users and that is a success, not a fallback |
| Exports delivered with a complete manifest | 100 % |

---

## 16. Acceptance criteria

1. The shared map service's database role has no select privilege on `catch`, proven by a
   test that attempts it and expects failure.
2. Zooming to z18 on a community layer never returns a finer cell than the grant (Rule M1),
   proven by a test over the full zoom range.
3. Suppressed cells render as hatching with the "not enough reports" copy and are
   distinguishable from absent cells, at 320 px, verified by a screenshot test.
4. `bbox` is snapped server-side; an unsnapped request is rejected, proven by a test.
5. The table view presents identical numbers to the map for the same filters, proven by a
   test comparing both renders.
6. The time slider is operable by keyboard alone and announces its value.
7. The map does not capture page scroll at 320 px.
8. Every layer renders its attribution; a layer with a missing attribution string fails a
   test.
9. Own map works fully with the network disabled.
10. `npm run verify` passes.

---

## 17. Dependencies

- **Hard:** `privacy-consent-and-data-governance.md` (ladder, k-gate, grants),
  `data-architecture-expansion.md` §8 (analytical store, `agg_*`).
- **Hard:** enough data for k ≥ 5 to leave anything visible. At current scale the community
  map would be blank. **This is the real gate, and it is not an engineering one.**
- `biostat`: k threshold, dominance cap, colour-scale binning, and the CPUE publication
  rule (D5).
- `cfo` + `architect`: the §9.1 provider evaluation.
- `ux-ui`: the bottom-bar decision in §7.1.

---

## 18. Risks and unanswered questions

1. **The community map may be unbuildable for a year.** k = 5 over 10 km cells needs a real
   user base in one region. Building the surface before the data exists produces a blank
   map that teaches users the feature is worthless. *Recommendation: build My map in Phase
   2a, and gate the community map on a measured cell-coverage threshold rather than a
   date.*
2. **Aggregates leak over time** through repeated queries (privacy §18.4). Rate limiting and
   delay are mitigations, not solutions.
3. **A beautiful map is a trust liability.** The better it looks, the more authoritative a
   3-fish cell appears. Sample size beside every rendering is the mitigation and it will be
   the first thing a designer asks to remove.
4. **CPUE is the thing agencies want and the thing we can least defend.** D5 restricts it
   to `MEASURED` effort; expect that to be a small fraction of the dataset. Publishing a
   weak CPUE would do more damage to the scientific relationship than publishing none.
5. **Map licensing is a real cost with a real cliff.** A free tier that ends at 50 k loads
   is a product outage. `cfo` owns the ceiling before 2b starts.
6. **3-D is a trap.** It is the most requested and least defensible item in the brief.
   Stated as a non-goal in §4; expect to have to defend that.
7. *Open:* who is allowed to see a **tournament** fleet layer, and for how long after the
   event? The compliance boundary says results are public; where the fleet fished is not a
   result.
