# Backlog

**Now** is capped at 3. If it has four items, nothing is Now.
One line per item, owner named.

**Refreshed 2026-08-28 by `coo`** — D21–D24 (web-first prototype: calendar, notebook,
quick-mark, backfill) resequenced the plan. Xcode/Watch work is no longer Now; it starts
when Phase 1's web exit test passes. See `docs/team/PLAN.md` for the full sequence and
what got cut to make room.

## Now
- Offline store/sync ADR (browser + native, one policy) + web/native boundary ADR — `architect`
- Schema migration incl. D21–D24 additions (resolution_state, sticky rig, day_journal_entry, backfill flags) — `architect` + `head-dev`
- Web prototype: calendar → day page (four verbs + quick-mark today, backfill on past days) + notebook, salt-only, no live enrichment — `head-dev` + `ux-ui`

## Next
- Xcode/Watch project kickoff, triggered by Phase 1's web exit test, ported from the proven web flow — `head-dev`
- NOAA/NCEI tide + historical-conditions ingestion (deferred out of the web prototype) — `biostat` + `head-dev`
- Native salt vertical slice + Watch (WatchConnectivity, background write queue) — `head-dev`
- Bass vertical slice, native only, once (not built on web) — `ux-ui` + `head-dev`
- Swift-native moon-phase library, licence-checked (O9 only resolved JS/TS so far) — `counsel` + `head-dev`
- Bass current-direction field (dam/creek current) — moot until bass's native slice — `ceo`
- Species/lure/bait/structure vocabulary red-pen, both ontologies — `ceo`

## Someday
- Basic search/filter + tide-chart overlay, then compound multi-field search
- P6 ratification — doesn't block V1, decide before V2 statistics work starts — `ceo`
- O6 pricing ratification — nothing paid exists before GA prep (D14) — `ceo`
- Bite score, alerts, condition matching, pooled stats, custom fields, photos (all V2)
- Billing/subscription integration — `cfo`
- Android
