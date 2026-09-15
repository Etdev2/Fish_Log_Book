# Catch environmental enrichment

**Status:** Proposed — highest-value Phase 1 work, no new product surface required
**Date:** 2026-09-15
**Governs:** `condition_snapshot` enrichment, provenance, the enrichment worker, catch-detail provenance display
**Extends:** `docs/architecture/ontology.md` §2.4, §3; `SPEC.md` D8, D9, D16, D24, D25; ADR 004
**Audit:** `00-repository-audit.md` §3.1, §6 G1
**Phase:** 1

---

## 1. Problem statement

`condition_snapshot` was designed for this and is 70 % built. It has the columns, the
`enrichment_status` lifecycle, `snapshot_basis`, `algo_version`, a retry counter and a
schema comment explaining that `unavailable` is terminal.

**And nothing ever fills it in.** `PLAN.md` cut live enrichment from the web prototype;
`conditions.ts` honours that cut by writing sun and moon (computed on device, per D25) and
leaving every marine field null with `enrichment_status = 'pending'`. There is no worker.
There has never been a worker. Every snapshot in the system is pending and always will be.

So the gap is not "design an enrichment system". It is: **build the worker, add the
half-dozen genuinely missing fields, and replace one free-form `provenance` jsonb blob with
per-field provenance strong enough that a fisheries scientist will accept the number.**

The second problem is honesty. The brief is right that a satellite SST composite from a
3-day window, a model hindcast and a buoy reading are three different kinds of claim, and
that calling any of them "real-time" is false. The schema has one `provenance` column and
no vocabulary. This spec supplies the vocabulary.

---

## 2. Users and stakeholders

| Stakeholder | Need |
|---|---|
| Angler | The conditions at the fish, without a single extra tap |
| Angler, later | "Find days like today" (`ROADMAP.md` C1, accepted) needs comparable values |
| `biostat` | Units, timezones, provenance, and the ability to exclude modelled data from a correlation |
| Researcher / agency | Dataset version and resolution on every value, or the data is unusable |
| `cfo` | Per-catch API cost; this is the one feature with a marginal cost per fish |
| `counsel` | Provider licences: several free marine datasets forbid commercial redistribution |

---

## 3. Product goals

1. **Zero added taps.** Enrichment happens after the catch is durable, off the save path.
   The `create.ts` ordering contract is the law: *the catch row is written first and
   everything optional happens around it.*
2. Every enriched value carries provider, dataset version, observation kind, observed and
   retrieved timestamps, resolution, distance to source, units and quality.
3. The angler's own measurements are never overwritten and are never confused with a
   sensor.
4. Offline logging enriches on reconnect, using the **original** time and position.
5. A value we cannot get is null and says why. Never zero, never an interpolated guess
   presented as an observation.

---

## 4. Non-goals

- A bite score, a "good conditions" verdict, or any interpretation. `SPEC.md` D12a keeps
  that in V2+ and requires it to be explainable. This spec stores raw values only.
- A weather app or a forecast surface. The tide viewer already exists and is deliberately
  not a Tide Alert clone.
- Real-time streaming. Enrichment is a background job with a minutes-scale SLA.
- Replacing the on-device astronomy. D25 is right: sun and moon computed locally are
  strictly better than a server round trip.

---

## 5. User stories

1. As an angler, I tap Log, the fish saves instantly with no signal, and when I get back to
   the harbour the catch shows the tide, wind and water temperature it was caught in.
2. As an angler, I tap the water temperature and see: *"18.4 °C · satellite composite ·
   NOAA CoastWatch · 3-day mean to 14 Sep · 1 km grid · not a measurement at your spot."*
3. As an angler, I typed my own water temperature and the app shows **mine**, labelled
   *"your reading"*, with the satellite value beneath it as a second line — never replacing
   it.
4. As an angler fishing a lake, I never see a tide field, because freshwater has no tide
   and a null there would be a question I cannot answer.
5. As `biostat`, I can write a query that excludes every `MODEL_FORECAST` and
   `CLIMATOLOGY` value from a correlation, in SQL, without parsing text.
6. As an angler in a dead zone for three days, my forty catches all enrich correctly when I
   reconnect, at the times and places they happened.
7. As an angler, a catch whose enrichment permanently failed says *"No marine data covers
   this place and date"* — once, quietly — and never retries or nags.

---

## 6. Complete workflow

### 6.1 The two-phase write (already the shape; formalised here)

```text
 tap ──► catch row written locally (uuidv7, durable)         < 50 ms, no network
     ──► condition_snapshot written locally:
           sun + moon computed on device (D25)
           angler-entered water temp / pressure / wind
           enrichment_status = 'pending', snapshot_basis = 'observed'
     ──► outbox mutation queued (same transaction as the row)
          ...
     ──► sync: rows reach Postgres
     ──► enrichment worker picks up pending snapshots
     ──► environmental_observation rows written per field
     ──► denormalised columns + provenance projection updated
     ──► enrichment_status = 'complete' | 'partial' | 'unavailable'
     ──► client pulls the updated snapshot on next sync
```

### 6.2 Worker selection and ordering

The worker claims snapshots by `(enrichment_status, observed_at)` — the index
`idx_snapshot_enrichment` already exists for exactly this. Order: newest first, because an
angler looking at today's catch is the only person waiting.

For each snapshot it resolves a **fetch plan**: the set of (provider, dataset, field)
triples that can serve this water class, position and time. The plan is data, versioned,
and testable without network.

### 6.3 Per-field acquisition rules

| Field | Source, in preference order | Kind | Honest resolution |
|---|---|---|---|
| Tide height, state, rate, next turn | NOAA CO-OPS predictions (existing `noaa-tides.ts`), nearest suitable station | `MODEL_ANALYSIS` (predictions are harmonic, not observations) | Station-specific; **distance to station recorded**, and beyond 30 km the value is `INTERPOLATED` or refused |
| Verified water level | CO-OPS verified product, for past dates only | `SENSOR` | Better than predictions for backfill; `ontology.md` §8 item 9 already asks whether this second fetch is worth it — **it is, for any catch older than 24 h** |
| Air pressure + 3 h trend | Nearest METAR/NDBC, else reanalysis | `SENSOR` / `MODEL_ANALYSIS` | Trend is the high-signal variable (`ROADMAP.md` B1) |
| Air temp, wind speed/direction | NWS/NDBC point forecast or observation | `SENSOR` / `MODEL_FORECAST` | Forecast vs observation must be distinguished; an "after the fact" fetch should get the observation |
| Sea-surface temperature | NOAA CoastWatch / NASA MUR L4 | `SATELLITE` | **Never real-time.** 1 km at best, composited over 1–5 days, cloud-gapped. The composite window is recorded and displayed. |
| Wave height, period, direction; swell | NDBC buoy if within range, else WaveWatch III | `SENSOR` / `MODEL_ANALYSIS` | Buoy is a point 20 km away, not your spot. Distance recorded. |
| Current speed and direction | Regional HF radar (HFRNet) where covered, else tidal-current model | `SENSOR` / `MODEL_ANALYSIS` | Coverage is patchy and coastal-only. `unavailable` is the common, correct answer. **Distinct from the angler's `current_term` vocabulary (D20), which stays.** |
| Chlorophyll-a / productivity | CoastWatch ocean colour | `SATELLITE` | 4 km, multi-day composite, cloud-gapped. Nice-to-have; last to build. |
| Bathymetry / seafloor depth | GEBCO or NOAA coastal relief, cached | `MODEL_ANALYSIS` | 15 arc-sec ≈ 450 m. **Not a substitute for the sounder reading the angler typed.** |
| Sunrise/sunset/twilight, moon | On device (existing `core/rules/astro`) | `MODEL_ANALYSIS`, deterministic | Exact. Never fetched. |
| Marine zone / regulatory area | Fish Legal packs + agency boundary layers | `MODEL_ANALYSIS` | Already partly present via `boundary-coverage.ts` |
| Water temp (angler) | The angler | `USER_MEASURED` | The only in-situ measurement in the whole list, and therefore the most valuable |

**Rule E1.** A provider is queried with the catch's `geo_cell_1km`, never its exact
coordinates, and the cell is what appears in any log line
(`privacy-consent-and-data-governance.md` §9, `ontology.md` §6 item 4). Marine grids are
coarser than 1 km anyway, so nothing is lost.

**Rule E2.** A response is cached in object storage keyed
`(provider, dataset_version, cell_1km, hour_bucket)`. Ten anglers on the same reef in the
same hour cost one request. This is the single largest cost control available and it is
free to build now.

**Rule E3.** `distance_to_source_m` is recorded for every station- or buoy-derived value,
and beyond a per-field threshold the value is either downgraded to `INTERPOLATED` or
refused. A tide from a station 80 km away on a different side of a headland is not data.

### 6.4 Terminal states

| Status | Meaning | Retry? |
|---|---|---|
| `pending` | not yet attempted, or backing off | yes |
| `partial` | some fields resolved, some refused | yes, for the refused ones only, up to 10 attempts |
| `complete` | every field in the plan resolved or legitimately not applicable | no |
| `failed` | repeated transport failure | weekly sweep, not the hot loop |
| `unavailable` | **terminal**: no source covers this place and date | **no, ever** — the existing schema comment already mandates this |

### 6.5 Backfill and `snapshot_basis`

A catch logged for a past day (D24 `capture_mode = 'backfill'`) enriches with
`snapshot_basis = 'historical_reconstruction'`. Tide predictions backfill perfectly;
verified water levels backfill *better*; satellite SST backfills to the composite that
covered the date; forecasts do not backfill at all and are replaced by reanalysis or
refused. The distinction is already in the schema and must be preserved end to end.

---

## 7. Screen and component requirements

**No new screen.** Three changes to existing ones.

### 7.1 Catch detail — the provenance line

`src/features/conditions/components/sourced-value.tsx` already exists and is the right
component. Extend it so every enriched value shows, on tap:

```text
18.4 °C
Satellite composite · NOAA CoastWatch · MUR L4 v4.1
3-day mean ending 14 Sep · 1 km grid
Retrieved 15 Sep 07:12 · not a measurement at your spot
```

Rules: the kind is stated in **plain words** before the provider name. "Satellite
composite", "Buoy 22 km away", "Model estimate", "Your reading", "Tide prediction". Never
a bare provider logo, never "live".

### 7.2 Conditions block — user value first

Where both exist, the angler's own reading is the primary value and the derived one is a
second line beneath it, smaller, labelled. Never the other way around, and never merged.

### 7.3 Enrichment status

One quiet line at the bottom of the conditions block:

- pending → *"Conditions will fill in when you are back in signal."*
- partial → *"Some conditions are still coming."* (no spinner; this is not a load)
- unavailable → *"No marine data covers this place and date."* — final, no retry affordance
- failed → *"Could not fetch conditions. We will try again."*

No badge, no banner, no toast. Enrichment is not something the angler is doing.

### 7.4 Nothing on the quick-log path

`quick-log-sheet.tsx` gains nothing. The brief is explicit and the founder's whole design
rests on it.

---

## 8. Data requirements

Per `data-architecture-expansion.md` §7.1: `environmental_provider` and
`environmental_observation`, with the existing `condition_snapshot` columns becoming a
rebuildable projection.

New columns on `condition_snapshot`:

```sql
sst_c                     numeric(5,2),
current_speed_ms          numeric(5,2),   -- distinct from current_term (D20)
current_speed_dir_deg     integer check (current_speed_dir_deg between 0 and 359),
wave_height_m             numeric(5,2),   -- sea state, distinct from swell_*
wave_period_s             numeric(5,2),
wave_dir_deg              integer check (wave_dir_deg between 0 and 359),
chlorophyll_mg_m3         numeric(7,3),
seafloor_depth_m          numeric(7,2),   -- modelled; NOT the angler's bottom_depth_m
minutes_to_next_tide_turn integer,        -- signed: negative = turn has passed
next_tide_turn_kind       text check (next_tide_turn_kind in ('high','low','slack')),
marine_zone_id            text,
regulatory_area_id        text,
tide_station_id           text,           -- LOCATION-BEARING. never in cross-user output.
buoy_id                   text            -- same
```

All salt-only fields join the existing `snapshot_salt_only_fields` constraint.
`tide_station_id` and `buoy_id` carry a schema comment naming them as location-bearing per
`ontology.md` §6 item 2, so the next person to write an export sees the warning in `\d`.

Units are canonical SI throughout, per `src/core/units.ts`. Display conversion happens at
the edge only.

---

## 9. API and service requirements

```text
src/core/enrichment/plan.ts        pure: (waterClass, cell, instant) -> FetchPlan
src/core/enrichment/merge.ts       pure: (observations[]) -> projection + status
src/core/enrichment/thresholds.ts  pure: per-field distance and staleness limits
server/enrichment/worker.ts        impure: claims, fetches, caches, writes
server/enrichment/providers/*.ts   one adapter per provider, each returning
                                   a typed Observation with mandatory provenance
```

Plan and merge are pure and vector-tested, so the Swift client and the server agree about
what "partial" means.

Worker contract:

- Claims with `for update skip locked`, batch of 50.
- Per-provider rate limit and circuit breaker; one dead provider degrades that field to
  pending, never the whole batch.
- **Column allow-list** (`data-architecture-expansion.md` D6): the worker may write only
  the fields in the list. A test fails if the list intersects the device-written set.
- Writes observations and projection in one transaction.
- Idempotent on `(snapshot_id, field, provider, dataset_version)`.

Endpoints: none public. `/api/enrichment/requeue` is service-role, for operations.

---

## 10. Offline behaviour

- Catch and snapshot are durable locally before anything else. Unchanged.
- Sun and moon compute on device, offline, from the instant and position (D25).
- The angler's manual water temp / pressure / wind are captured offline and are
  `USER_MEASURED` observations — they never enter the queue, because they are already
  facts.
- The outbox carries the snapshot; the worker enriches whenever it arrives, using
  `observed_at`, **not** the sync time. A fish logged Tuesday and synced Friday gets
  Tuesday's conditions.
- Nothing about enrichment blocks, retries or displays on the device. The device does not
  know providers exist.
- A tide series already cached for the trip (existing `tide-cache.ts`) may fill tide fields
  locally as `MODEL_ANALYSIS` with the cached dataset version, because it is the same NOAA
  prediction the server would fetch. This is the one permitted device-side enrichment and
  it is worth it: it makes the tide visible on the boat.

---

## 11. Privacy and security requirements

1. Outbound requests and all log lines use `geo_cell_1km` (Rule E1). Enforced by a test
   that fails if a provider adapter receives a raw latitude.
2. The worker is `actor_kind = 'SERVICE'` and names itself in
   `location_access_audit.actor_service` when it touches a coordinate at better than
   `CELL_10KM`.
3. `tide_station_id` and `buoy_id` are excluded from every cross-user projection by the
   field allow-list, not by reviewer memory.
4. Cached provider responses are keyed by cell, contain no angler identifier, and are
   readable only by the worker's role.
5. Provider licences are checked before a provider is added, recorded in
   `environmental_provider.licence` / `commercial_use_permitted` /
   `redistribution_permitted`, and `counsel` signs off. **Several free marine datasets
   permit research use and forbid commercial redistribution**; an export that reships them
   is a licensing breach, and the export manifest must be able to say what may be
   redistributed.
6. Attribution strings required by providers are rendered in the app's Notices screen and
   in every export manifest.

---

## 12. Accessibility requirements

- Provenance is text, not a tooltip and not an icon. It is reachable by keyboard and read
  by a screen reader in the same words a sighted user sees (baseline §5).
- Units are announced ("eighteen point four degrees Celsius"), not rendered as a bare
  glyph.
- The enrichment status line is `aria-live="polite"` and fires once per state change, not
  per poll.
- Directional values state the compass direction in words alongside any arrow; no
  rotation-only conveyance (baseline §4, and an arrow at 320 px is 12 px of ambiguity).
- Distinguishing measured from modelled must not rely on colour (baseline §1.3, existing
  rule).

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| No GPS on the catch | Region-level enrichment only, `INTERPOLATED`, or `unavailable`. **Never** silently substitute the trip's spot. |
| GPS accuracy 500 m | Enrich anyway; record `gps_accuracy_m` in the observation so a later analysis can filter. Do not refuse — the catch is real. |
| Freshwater | Tide/swell/current fields are absent (existing constraint), not null-and-pending. Lake surface temp from satellite only where the waterbody is large enough to resolve — below ~1 km² it is refused. |
| Catch at 03:00 local, backfilled a year later | `historical_reconstruction`; predictions and reanalysis only; forecasts refused. |
| Two catches in the same minute, same cell | One provider fetch, two observation sets from the cache. |
| Provider retires a dataset version | Old observations keep their version. New fetches use the new version. No rewriting. |
| Angler edits `caught_at` after enrichment | Existing observations are invalidated (not deleted), status returns to `pending`, and an amendment row is written. The old values remain queryable as what we believed. |
| Catch inside a marine protected area | `regulatory_area_id` populated; Fish Legal's boundary alert is a **separate** concern and stays in its own feature. Enrichment records geography; it does not judge legality. |
| Antimeridian or polar catch | Cell keys break (`data-architecture-expansion.md` §12). Refuse with `unavailable` and log it as a known limitation rather than producing a wrong cell. |
| Provider disagrees with the angler by 6 °C | Both stored. No reconciliation, no flag. A disagreement is data; `biostat` may later use it as a quality signal. |

---

## 14. Failure states

- Provider timeout → `pending`, backoff (1 m, 5 m, 30 m, 2 h, 12 h…), max 10, then `failed`.
- Provider 404 for the cell/date → `unavailable` for that field. If every field is
  unavailable, the snapshot is `unavailable`, terminal.
- Cache corrupt → treat as miss.
- Worker crash mid-batch → claims expire; another worker picks them up. No partial writes,
  because observations and projection go in one transaction.
- Queue depth > 10,000 or oldest pending > 6 h → alert. This is the metric that would have
  caught "there is no worker" on day one.

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Catches enriched to `complete`/`partial` within 15 min of sync | > 95 % |
| Snapshots `pending` > 24 h | < 1 % |
| Median added latency to the logging tap | **0 ms** (enrichment is never on the path) |
| Provider cache hit rate | > 70 % within one season |
| Cost per enriched catch | tracked by `cfo`; alert above the agreed ceiling |
| Fields with `observation_kind = 'INTERPOLATED'` shown without a distance | 0 |
| Anglers who open a provenance line at least once | reported, not targeted — it tells us whether honesty is legible |

---

## 16. Acceptance criteria

1. A catch logged in airplane mode, synced 48 h later, enriches to the conditions at its
   original `observed_at` and position — proven by an integration test with a frozen clock.
2. The logging tap's p95 latency is unchanged, measured before and after.
3. Every enriched value has an `environmental_observation` row; a test asserts no
   projection column is non-null without one.
4. A provider adapter receiving a raw latitude fails a test.
5. `unavailable` snapshots are never re-queued, proven by a test that runs the worker twice.
6. The angler's `USER_MEASURED` water temperature is never overwritten, proven by a test
   that enriches a snapshot that already has one.
7. Salt-only fields remain absent on freshwater snapshots (existing constraint still
   passes).
8. The catch-detail provenance line renders at 320 px without horizontal overflow and
   without truncating the dataset version.
9. `npm run verify` passes.

---

## 17. Dependencies

- `data-architecture-expansion.md` §7.1 (provider and observation tables).
- `privacy-consent-and-data-governance.md` §9 (cell rounding, service actor, audit).
- Sync must be live for the personal log — currently deferred by founder ruling
  (audit §5). **This is the gating dependency, and it is a product decision, not an
  engineering one.**
- `counsel`: provider licence review before each provider is added.
- `cfo`: per-catch cost ceiling and the cache hit-rate target.
- `biostat`: distance thresholds per field, and which kinds may enter a correlation.

---

## 18. Risks and unanswered questions

1. **Cost scales with catches, not users.** A tournament with 400 anglers in one bay for
   one day is thousands of catches in the same cells and hours. Rule E2's cache is what
   makes that affordable; without it this feature has an unbounded bill.
2. **Free marine data is mostly US.** Mexico, and any international expansion, has thinner
   coverage. `unavailable` will be the honest common answer outside US waters, and the
   product must not look broken when it is.
3. **HF-radar currents are coastal and patchy.** The brief lists "current speed" as if it
   were routinely available. It is not. Expect `unavailable` for most catches.
4. **SST is the field anglers care about most and the one we can serve worst.** A 1 km
   3-day composite is not the temperature at the fish. The provenance line is the only
   defence, and it must not be dismissible.
5. **Distance thresholds are unset.** §6.3 asserts they exist; `biostat` must supply the
   numbers per field. *Open.*
6. **Is verified water level worth the second fetch for backfill?** `ontology.md` §8 item 9
   asks this and it is still open. This spec's position: yes for anything older than 24 h,
   no for live. `biostat` to confirm.
7. **Re-enrichment policy.** When a provider improves a dataset, do we re-enrich historic
   catches? Storing observations makes it possible. *Open: default no, opt-in per research
   project, because silently changing a 2026 catch's conditions in 2029 is exactly what the
   regulation-snapshot rule forbids for law.*

---

## 19. Recommended implementation phase

**Phase 1**, and it should be the first feature built after the §5 reconciliation and the
privacy rules, because it needs no new screen, no new consent, and it is the difference
between a logbook and a dataset.

Order within the phase: worker skeleton + cache → tide (reuse `noaa-tides.ts`) → pressure
and wind → SST → waves/swell → bathymetry and zones → chlorophyll → currents (last, lowest
coverage).
