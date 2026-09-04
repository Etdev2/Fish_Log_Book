# Backlog

**Now** is capped at 3. If it has four items, nothing is Now.
One line per item, owner named.

**Refreshed 2026-09-03 by `head-dev`.** The previous refresh (2026-08-28) had gone stale:
all three of its Now items — the offline/sync ADR, the schema migration, and the
calendar→day web prototype — are shipped. Fish Legal, Tackle Box, and Passport Phase 1
shipped after it was written and were never on it. GitHub issue #1 still describes work
that is done.

The ordering below changed on one finding: **the app makes no network requests at all.**
There is not a single `fetch()` in `src/`. The tide chart runs off a hardcoded fixture for
one station (Newport Bay, 9410580) and there is no weather or pressure. Until that changes
the app cannot do its headline job for anyone who does not fish that one bay, which
outranks every feature idea we have.

## Now
- Everything blocking public release now lives in `docs/team/PRE-SHIP-CHECKLIST.md`, with the legal questions tracked as issue #56. A legal team answers those before ship (founder, 2026-09-04) — `ceo`
- Confirm the NOAA tide fetch against the live service. Written from the API docs and never exercised: this environment's proxy blocks `api.tidesandcurrents.noaa.gov`. One person with signal opening the tide chart settles it — `head-dev`

## Next
- Post-catch celebration. `newlyEarned` is written and tested but still has no caller, so the passport rewards nobody out loud — `head-dev` + `ux-ui`
- Species photo licensing swap. `species-photos.ts` says it plainly: "source-restricted — attribution shown; Wikimedia/NOAA swap owed before release." 51 images — `counsel` + `ux-ui`
- Weather and pressure ingestion from NWS + NCEI (free path, already costed in `cost-model.md` §1) — `biostat` + `head-dev`
- Native iOS project kickoff. Nothing exists yet, and it is the ceiling on everything commercial — `head-dev`
- O6 pricing ratification, then billing — `ceo`, then `cfo`
- ROADMAP C1 "find days like today". Accepted 2026-09-03 into passport Phase 2; the only accepted work that answers "should I go tomorrow" — `head-dev`
- Night Bite badge. Unblocked — `sunEventsFor()` already exists in `core/rules/astro/sun.ts`, no new dependency — `head-dev`
- Species/lure/bait/structure vocabulary red-pen, both ontologies. ROADMAP calls this the top founder-blocked item — `ceo`
- Passport Tickets 6-8: backfill check, sync-merge duplicate-award test, QA pass. Mostly thin because the passport stores nothing — `test-agent`

## Someday
- Passport Phase 2+: verification levels (blocked on media), wildlife log, boat games
- P6 server-side engine ratification — decide before V2 statistics, not urgent — `ceo`
- O4 evidence threshold — `biostat`
- Bite score, alerts, condition matching, pooled stats, custom fields
- Android
