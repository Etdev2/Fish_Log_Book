# Backlog

**Now** is capped at 3. If it has four items, nothing is Now.
One line per item, owner named.

**Refreshed 2026-08-28 by `coo`** — the previous version predated every decision in
`docs/product/SPEC.md`, D15 (native Swift, not web), and D18 (bass and salt built
together). See `docs/team/PLAN.md` for the full phased plan this backlog tracks.

## Now
- iOS/Watch project location + schema migration applied from `docs/architecture/ontology.md` (Phase 0) — `architect` + `head-dev`
- Offline sync design (local store, write queue, conflict policy) — nobody owns this yet and Phase 1 needs it — `architect`
- Salt vertical-slice logging (four verbs, offline write, silent auto-capture) toward a real logged trip — `head-dev` + `ux-ui`

## Next
- NOAA tide ingestion + differencing pipeline (station 9410580, cached, not required to block Phase 1) — `biostat` + `head-dev`
- Bass vertical slice: water_class picker + reused logging + optional post-catch sheet — `ux-ui` + `head-dev`
- Apple Watch app: four-verb UI, WatchConnectivity, background write queue — `head-dev`
- uphill/downhill definition (D10) — one sentence, blocks only `current_direction` — `ceo`
- Swift-native moon-phase library, licence-checked (O9 only resolved JS/TS so far) — `counsel` + `head-dev`
- Species/lure/bait/structure vocabulary red-pen, both ontologies — `ceo`

## Someday
- Basic search/filter + tide-chart overlay (Phase 4), then compound multi-field search
- P6 ratification — doesn't block V1, decide before V2 statistics work starts — `ceo`
- O6 pricing ratification — nothing paid exists before Phase 5 (D14) — `ceo`
- Bite score, alerts, condition matching, pooled stats, custom fields, photos (all V2)
- Billing/subscription integration — `cfo`
- Android
