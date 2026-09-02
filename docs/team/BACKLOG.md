# Backlog

**Now** is capped at 3. If it has four items, nothing is Now.
One line per item, owner named.

**Refreshed 2026-09-02 by `coo`** — supersedes the 2026-08-28 refresh, whose **Now** listed
the calendar and D21–D24 schema work that has since shipped. Two owner rulings reshaped
this list; both are recorded in
`docs/team/meetings/2026-09-02-wednesday-team-meeting.md` §9.

- **D-2026-09-02-A — no hosted database yet.** Local-first by design: JSON + IndexedDB, no
  keys, schema added once the shell tells us what we are storing. This *withdrew* the
  Supabase/auth/flusher critical path and *unblocked* trip effort, which never needed a
  server.
- **D-2026-09-02-B — web first, then native, both shipping.** Not a fork. The web app is the
  first real client, testable one-handed on a phone today.

## Now
- Live NOAA tide fetch + offline cache — the fixture dies **2026-09-04** — `head-dev` + `biostat`
- Trip start/end incl. blank trips — the denominator, unblocked by ruling A — `head-dev` + `biostat`
- CI: `npm run verify` on every PR, then required on `main` — `test-agent`

## Next
- "Backed up" → "Saved on this phone" — permanently true under ruling A — `head-dev`
- Local export/backup to a file — the only backup that will exist under ruling A — `head-dev`
- Legal-snapshot season rollup — reads `catch.regulation_snapshot`, already written on every catch — `ceo` spec → `head-dev`
- Local equivalent of `analytics.trip_effort` — the view is Postgres; effort must compute locally — `biostat`
- `/spots` and `/trip/[id]` are still placeholder pages — spot picking, station search — `ux-ui` + `head-dev`
- `docs/team/STATUS.md` (~40 lines, the one file every session reads first) + `HANDOFF.md` correction — `coo`
- Field-test protocol — now immediately useful, the owner tests on a real phone daily — `ux-ui`
- Commit the browser checks PRs already cite (Playwright) — `test-agent`
- Tackle Box onto the offline store; tackle linked to catch via `catch_gear` — `head-dev`
- Record barometric pressure at write time, display later — the moment is not repeatable — `head-dev`
- Privacy policy + terms drafts into `docs/legal/` — `counsel`
- Species/lure/bait/structure vocabulary red-pen, both ontologies — `ceo`

## Someday
- Native iOS + Watch, after the web client is done (ruling B) — `head-dev`
- Swift-native moon-phase library, licence-checked (O9 only resolved JS/TS) — `counsel` + `head-dev`
- Rig/lure catch report; within-trip tide pattern; "on this day in past years" recall card
- MPA/closed-water check at trip start — counsel-gated — `counsel` + `head-dev`
- Bass vertical slice, native only, once — `ux-ui` + `head-dev`
- Bite score, alerts, condition matching, pooled stats, custom fields, photos (all V2)
- P6 ratification; O6 pricing ratification — `ceo`
- Billing/subscription integration — `cfo`
- Android

## Paused by ruling A — still the plan, not cancelled
Supabase provisioning · auth wiring · retiring `LOCAL_ANGLER_ID` · the outbox flusher ·
end-to-end RLS validation. A database **is** coming; it is deferred until the shell tells us
what we are storing. The twelve written migrations are the head start on it, not discarded
work. What changed is that none of these blocks anything today.

## Anti-features — do not propose (ROADMAP Part 3)
Ads · selling or aggregating location data · paywalling logging · any gamified engagement
mechanic. All four corrupt the denominator or the trust the product is built on.
Plus, named 2026-09-02: gear-legality cross-checking ("is this rig legal here") — a wrong
answer is worse than no feature, and it means expanding the regulations data model.
