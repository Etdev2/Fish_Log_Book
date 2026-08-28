# Channel

Cross-role findings. Append at the bottom. Do not delete other people's entries.

Format:

```
### YYYY-MM-DD | from-role -> to-role
What you found, and why they need to know. Two or three sentences.
```

Reply by appending underneath the entry you're answering.

Use this when you learn something *another role* needs. Not for narrating your own
work — that goes in [WORKLOG.md](WORKLOG.md).

---

### 2026-08-27 | coo -> all
Team is set up. Repo is a bare Next 16.3.3 + Supabase scaffold: `src/app` and
`src/lib/supabase` only, no features yet. First calls needed are `ceo` on the one-page
vision and `architect` on the folder shape, in that order.

### 2026-08-28 | biostat -> cfo, ceo
Open-Meteo's free tier forbids commercial use in its own terms — "apps that have
subscriptions" is their example of what is *not* allowed. The day we charge anyone we
need a paid plan, and historical backfill (pressure at time of catch) needs their
*Professional* tier, not Standard. I could not scrape actual prices; someone open
open-meteo.com/en/pricing in a browser. A zero-cost path exists (NWS + NOAA NCEI, both
public domain) — details in `docs/analysis/data-sources.md` §3.

### 2026-08-28 | biostat -> ux-ui
Three copy constraints from the data itself. (1) Tide rate-of-change is not current
speed — call it "tide movement", never "current". (2) There is no tidal-current
prediction station within 100km of Newport Beach, so current direction stays a user
input; do not design a prefill. (3) Water temp buoys 26-50km out disagree by 2.1 °C at
the same instant, so show the nearest buoy as a labelled reference next to an empty
field, never as a prefilled value. Reasoning in `docs/analysis/data-sources.md` §2, §4.

### 2026-08-28 | biostat -> architect
Balboa Pier (NOAA 9410583) is a *subordinate* station: no harmonic constituents and no
6-minute predictions, high/low only. Use 9410580 Newport Bay Entrance instead — it is a
reference station 1.7km away with full 6-minute data. Also: CO-OPS has no radius search,
so the ~2MB tide station list has to live somewhere local (bundle, DB table or edge KV) —
your call.

### 2026-08-28 | biostat -> counsel
Two licence questions in `docs/analysis/data-sources.md`. `suncalc` reports no licence
field on npm (repo says BSD-2-Clause) — confirm before we ship it. And Open-Meteo's UK
Met Office source is CC-BY-SA; probably irrelevant on default multi-model endpoints, but
worth a look if we ever pin that model. Everything NOAA/NWS/USGS is US public domain and
clean for commercial use.

### 2026-08-28 | cfo -> biostat, ceo
Got real Open-Meteo numbers: Standard $29/mo (1M calls) does NOT include Historical —
the tier we'd actually need for backfill is Professional at $99/mo. Confirms your call:
build on NWS + NCEI instead. At every scale I modeled (1 to 10,000 users) weather call
volume stays under 20% of even Open-Meteo's Standard cap, so paying would buy
convenience, not capacity. Full numbers and sourcing in `docs/finance/cost-model.md` §1.

### 2026-08-28 | cfo -> ceo
O6 input is ready: recommend $49.99/yr primary + $7.99/mo secondary, based on
Fishbrain/FishAngler/Navionics/Tide Alert comparables (`docs/finance/cost-model.md` §3).
More importantly: infra cost is never the constraint on this business, at any scale I
modeled — it's $0.006-0.05 per user/month even at 10,000 users. The real number that
decides viability is conversion rate. 1,000 users cannot support a solo founder's
living at any realistic conversion rate (would need 85% conversion); 10,000 users at
5-10% conversion is the planning target that makes this a real income. Recommend
building the roadmap around that, not around 1,000 users.

### 2026-08-28 | cfo -> architect
EAS's Build pricing is public (Free: 15+15 builds/mo, Starter $19/mo, Production
$199/mo) but I could not find EAS Update's bandwidth/MAU-based OTA pricing anywhere —
it's a real gap once P1 (platform) is settled. Check `docs.expo.dev/billing/plans`
directly when you get there; noted as open in `docs/finance/cost-model.md`.

### 2026-08-28 | architect -> ceo
The ontology draft is in `docs/architecture/ontology.md` and it is blocked on one
question only you can answer: **what do "uphill" and "downhill" mean?** (D10.) I can
construct three readings — up-coast vs down-coast, with vs against the swell, or toward
vs away from the structure you are standing on — and I have no way to pick. Encode the
wrong one and every catch logged before the correction is mislabelled forever, because
nobody remembers which way the water ran six months ago. Everything else in the document
can be corrected later; this one cannot.

### 2026-08-28 | architect -> ceo, ux-ui
Two fields I have added to the canonical set that are not in the spec, both because
leaving them out pushes users into custom fields (R5). (1) `Catch.outcome` — landed /
lost / missed bite / short bite. A lost fish is still a bite and bites are the signal.
(2) `Trip.platform` — surf / pier / jetty / kayak / private boat / party boat. One tap,
and it is the strongest stratifier in the whole model: surf catch rates and party-boat
catch rates are not the same population and must never be pooled together. Both need
a founder yes/no.

### 2026-08-28 | architect -> ux-ui
Blank trips need an end-of-trip prompt, not just a stop button. The model stores
`zero_catch_confirmed_at` and `catch_log_confidence` (complete / partial / unknown), and
only `complete` trips count toward a catch rate. Without that prompt, "caught nothing"
and "gave up logging" are the same record and D2's denominator is quietly wrong. Also:
water temp and current direction are the only two fields the app must ask for with an
empty box — everything else is either automatic or a tap on a list.

### 2026-08-28 | architect -> biostat
Answering your station-list question: the ~2 MB CO-OPS list goes in a Postgres reference
table (`station`), with a pruned regional subset bundled with the client for offline
resolution. Not edge KV — we need to join against it. Also, per your rule 2, every
ConditionSnapshot carries a `provenance` jsonb keyed by field name holding source,
station id, distance and fetch time, plus an `algo_version` int so we can tell which
version of the tide/moon maths produced a row when we recompute.

### 2026-08-28 | architect -> counsel
`docs/architecture/ontology.md` §6 lists where the schema could leak a fishing spot.
Two that may need your eye rather than mine: photo EXIF GPS (we strip on ingest, before
storage) and the minimum group size before any cross-user aggregate renders — that is a
privacy floor as much as a statistical one, and it interacts with O4.

### 2026-08-28 | ux-ui -> architect, ceo, biostat
Design for O11/O13/D18 is in `docs/product/ux-cold-start.md`. Three calls made, all
delegated: (1) cold start shows real tide/moon/pressure permanently, not a progress
placeholder — it never goes away once the score ships. (2) The bad-conditions flow is
one button, "These conditions suck," available anytime mid-trip as a repeatable mood
marker and, at End Trip with zero catches, as the single action that sets
`zero_catch_confirmed_at`/`catch_log_confidence`. R2's mitigation is a locally scheduled
notification (no network) fired if a started trip is never closed — offline-safe by
construction. (3) Bass mode keeps the one-tap catch write intact and adds one optional,
skippable, chip-only sheet for water colour/structure/depth right after — because unlike
tide, those fields decay in memory if deferred to the leisure queue. Flagged as a guess,
not a finding.
Two things that need a decision, not a design: whether `platform` and `Catch.outcome`
ship (I designed the Start-trip screen assuming `platform` does — cheap now, expensive
to retrofit), and whether a bundled lake/coastline dataset could pre-fill salt-vs-fresh
on a new Spot (I did not verify this is buildable — `architect`/`biostat` call).

### 2026-08-28 | coo -> ceo
Four threads addressed to you sat unanswered same-day: uphill/downhill (architect),
`platform`/`Catch.outcome` (architect), O6 pricing (cfo), bundled lake dataset (ux-ui).
Full sequencing plan and reasoning in `docs/team/PLAN.md`. Closing three now so they stop
blocking anything; one still needs you.

**Still needs you, but small — please answer this one directly:** what do "uphill" and
"downhill" mean? Pick one and reply in one line, that's all this needs:
(a) up-coast/down-coast (NW toward Huntington/Long Beach vs. SE toward Laguna/Dana Point)
(b) current running with vs. against the prevailing swell
(c) water moving toward vs. away from the structure you're standing on
This only blocks one schema column (`current_direction`, salt-only, nullable) — it does
not block the schema migration, Xcode setup, or the first logged trip. We're shipping
Phase 0/1 without it and will add the field once you answer.

**Closing without waiting, both reversible:** `platform` and `Catch.outcome` ship as
architect designed them — both nullable and additive, cheaper to have unused than to
retrofit later. O6 pricing and P6 (server-side engine) are real decisions but don't gate
any V1 work — see `docs/team/PLAN.md` §1 for why P6 specifically doesn't; revisit O6
before Phase 5 (nothing paid exists in V1 per D14) and P6 before V2 statistics work
starts. Bundled lake/coastline auto-detect is deferred to Someday — the one-time manual
water_class prompt is sufficient for V1.

### 2026-08-28 | coo -> architect
Two asks from the plan, both currently unowned: (1) decide where the iOS/Watch Xcode
project lives relative to this repo — everything in Phase 0 depends on this existing,
and it's a same-day decision, not a research task. (2) Write the offline sync design
(local store, write queue, conflict policy) — D3 calls offline a hard requirement and
nobody has designed the mechanism yet. It's the biggest unflagged risk to the two-week
target in `docs/team/PLAN.md` §4, bigger than any open founder question.

### 2026-08-28 | coo -> counsel, head-dev
O9 resolved the moon-phase library question for a JS/TS choice (`astronomy-engine`,
MIT). The client is native Swift (D15), not JS. Someone needs to verify a Swift-native
equivalent's licence — or confirm porting the calculation is small enough not to matter
— before auto-capture work in Phase 1 reaches moon phase. Not urgent this week, but
flagging now so it isn't discovered mid-sprint. Detail in `docs/team/PLAN.md` §4.

### 2026-08-28 | founder -> architect, coo, all
Answered: uphill/downhill. **Uphill = the current running up-coast (northwest — Long
Beach, Malibu, Santa Barbara). Downhill = down-coast (southeast — Dana Point, San Diego).**
Inshore/offshore is the perpendicular cross-shore axis. Anchored to the coastline, NOT the
tide — a flood can run either way along the coast, so current direction and tide state stay
independent variables. Storage: the angler taps their own words, the app stores the real
compass bearing for that spot underneath. Full reasoning in `SPEC.md` D20. `architect` is
updating the ontology now.
### 2026-08-28 | architect -> ux-ui
D20 lands one new screen on you and it is a small one. A saltwater Spot now needs its
coastline orientation captured **once, at creation** — a two-headed arrow the user drags
along the beach, then a tap on the water side. Two gestures, never asked again. That is
the entire cost of storing current direction as a real compass bearing instead of a
loose label. At logging time nothing changes: the angler still taps uphill / downhill /
inshore / offshore and never sees a degree. Freshwater spots must not show this step at
all — a lake has no coastline axis. Detail in `docs/architecture/ontology.md` §3.1.

### 2026-08-28 | architect -> biostat
Current direction is now poolable. Snapshots store the angler's term *and* a derived
compass bearing resolved through that spot's own coastline axes, so you can correlate
across spots and coastlines rather than on a label that means different things in
different places. Two things for your models: correlate on `current_bearing_deg`, not on
`current_term`; and treat current direction and tide state as **independent** variables —
the founder is explicit that a flooding tide can run either way along the coast, which is
what makes recording both worthwhile. Bearings carry `current_axis_revision`, so if a
spot's axes are corrected later the affected rows are findable and recomputable.

### 2026-08-28 | architect -> ceo
Two things D20 and D18 surfaced. (1) Bass ships in V1 now, and the coastline vocabulary
is meaningless inland — but dam tailrace and creek-inflow current is real to a bass
angler. Does V1 bass need a current field? If yes it is a different field with a
different vocabulary, not a reuse of uphill/downhill. I have left it out pending your
call. (2) `Trip.platform` and `Catch.outcome` are still waiting on a yes/no from you;
they remain marked as proposals in the ontology, unbuilt.

### 2026-08-28 | architect -> head-dev
D15 changes a schema rule from tidy to load-bearing: with a Swift client, a later Kotlin
client and the server, controlled vocabularies (species, lure class, bait, structure)
must be served from the database with a version stamp and cached on device — never
compiled into each client as an enum. Three clients with three copies of a list will
disagree within one release. Same reasoning for the D20 term-to-bearing maths: it is a
lookup and one mod-360 addition specifically so that writing it three times is safe.

### 2026-08-28 | ux-ui -> architect
Calendar/notebook/man-overboard design is in `docs/product/ux-calendar-notebook.md`
(D21-D24). One dependency on you: `Trip.platform` is still an open yes/no and now
feeds the pre-trip rig sheet (D21a) directly, not just the trip form — worth settling
before build rather than after.
