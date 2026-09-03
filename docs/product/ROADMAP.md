# Roadmap and Feature Candidates

**Status:** Part 1 is work already decided and sequenced. **Part 2 is a menu, not a plan** —
candidates for the founder to accept or kill. Nothing in Part 2 is committed. Part 3 is
things we should deliberately NOT build, with reasons.

Written 2026-08-28. Companion to `SPEC.md`, which remains the source of truth for what is
actually settled.

---

## Part 1 — Work already decided

Ordered. See `docs/team/HANDOFF.md` for the version written for someone with no context.

### Blocked on the founder
1. ~~**Define uphill/downhill.**~~ **ANSWERED 2026-08-28 — see SPEC.md D20.** Uphill =
   current running up-coast (northwest); downhill = down-coast. Inshore/offshore is the
   perpendicular axis. Anchored to the coastline, not the tide; the compass bearing is
   stored underneath the angler's words.
   **Correction, from `coo`:** this item was described as blocking the ontology, the
   schema, and most client work. On inspection that was overstated — `current_direction`
   is one nullable, salt-only column. Schema, Xcode setup and Phase 1 could all have
   proceeded without it. It was worth getting right, but it was never the critical path.
2. **Red-pen the controlled vocabularies** in `docs/architecture/ontology.md` — two passes
   now (salt and bass). Gaps push users into custom fields, and custom-field data can never
   be pooled. **This is now the top founder-blocked item.**

### Unblocked, ready to build
*Sequenced properly in `docs/team/PLAN.md` — read that first.*
3. Sequence the two products — `coo`.
4. Ratify pricing at $49.99/yr + $7.99/mo (O6) — `ceo`.
5. Approve P6, the shared server-side engine — without it the statistics get written once
   per platform. **`coo` correction: not urgent.** Everything P6 gates (correlation engine,
   condition matching, bite score, pooled analysis) is V2. No V1 feature needs it. Decide
   before V2 statistics work starts, not this week.
6. Compute the evidence threshold (O4) — `biostat`.
7. Clear the `suncalc` licence question (O9) — `counsel`.
8. Supabase schema and migrations from the ontology — `architect`. *Blocked by item 1.*
9. Tide engine: fetch NOAA 6-minute predictions from station 9410580, difference them for
   movement, cache for offline.
10. Native iOS project setup. Nothing exists yet.

---

## Part 2 — Feature candidates

**Each needs a yes / no / later from the founder.** They are grouped by what they serve.
Rough effort: **S** = days, **M** = weeks, **L** = a month or more.

### A. Make the log richer without slowing the tap

| # | Feature | Why it might matter | Effort |
|---|---|---|---|
| A1 | **Voice note on a catch** — one tap to record, transcribed later | Hands wet, fish flapping, no time to type. Probably the single best fit for the actual moment of a catch. | M |
| A2 | **Photo with EXIF stripped** | Already in the spec as V2. The privacy half matters: photos carry GPS, and anglers do not share spots. **❌ NOT NOW — 2026-09-03, founder, on cost.** No media table is scheduled; storage, EXIF stripping, size limits, offline upload and moderation are not being bought for a badge. This also removes verification levels 1–2 from Phase 2 of the passport spec — see its §45.2. Revisit as its own spec, not as a rider on another feature. | S |
| A3 | **Length / weight** | Standard logbook data, and needed for any personal-best feature. | S |
| A4 | **Fight time** | One tap start/stop. Anecdotally correlates with size; would be a genuinely novel variable. | S |
| A5 | **Gear loadout** — rod, reel, line, leader | Ties to the two-level tackle model already designed. Bass anglers care a lot; surf anglers less. | M |
| A6 | **Multi-angler trip** — who else was on the boat | Changes the denominator: three anglers fishing four hours is not one angler fishing four hours. Statistically this matters more than it looks. | M |

### B. Conditions we are not yet capturing

| # | Feature | Why it might matter | Effort |
|---|---|---|---|
| B1 | **Barometric *trend*, not just pressure** | Fishing lore is unanimous that the *change* matters more than the value. We have the phone barometer and historical backfill — this is cheap and probably high-signal. **My pick of this whole table.** | S |
| B2 | **Sunrise / sunset / civil twilight** | The dawn and dusk bite is the oldest pattern in fishing. Pure computation, no API, near-zero cost. | S |
| B3 | **Wind speed and direction at time of catch** | Free from NWS. Wind direction relative to shore is a real driver in the surf. | S |
| B4 | **Solunar major/minor periods** | Classic angler concept, computed from moon position. Cheap. Worth logging even if we stay agnostic about whether it works — we would finally have data to test it. | M |
| B5 | **Swell height and period** | The Tide Alert app charts it. Coverage in SoCal is good. Matters enormously for surf fishing. | M |

### C. Seeing patterns

| # | Feature | Why it might matter | Effort |
|---|---|---|---|
| C1 | **"Find days like today"** — search history for matching conditions | The honest version of the alerting dream, and it works at any sample size because the angler judges the result, not the app. **✅ ACCEPTED 2026-09-03** (founder delegated the call to `coo`) → Phase 2 of `docs/specs/fishing-passport-wildlife-boat-games.md`, ahead of photo verification. It is the only accepted work that answers "should I go tomorrow" — see that spec's §47.1 and §47.4. | M |
| C2 | **Catch heat map on the spot map** | Immediately legible, zero statistics required. | M |
| C3 | **Season calendar** — what you caught this week, across years | Anglers think in seasons. Becomes valuable in year two and compounds. | M |
| C4 | **Personal bests** | Cheap, and it is the thing people screenshot. | S |
| C5 | **CSV / GPX export** | Paid tier. Also a trust feature: people commit data more readily when they can get it out. | S |

### D. Being useful before you open the app

| # | Feature | Why it might matter | Effort |
|---|---|---|---|
| D1 | **Home screen widget** — today's tide, one-tap log | The app's value is proportional to logging friction. A widget removes an entire launch. | M |
| D2 | **Watch complication** — tide state at a glance | Cheap once the Watch app exists, and it is the reason for choosing native. | S |
| D3 | **Tide alarms** — "tell me 1h before slack at Balboa" | The one Tide Alert feature genuinely worth having. Drives daily opens. | M |
| D4 | **Offline map tiles for saved spots** | Downloaded in advance. Without this the map is blank exactly where it is needed. | M |

### E. Real-world utility

| # | Feature | Why it might matter | Effort |
|---|---|---|---|
| E1 | **Legal size and bag limits by species** (CA DFW) | Genuinely useful, genuinely used, and a strong reason to open the app while holding a fish. **Needs `counsel`** — publishing regulations carries liability if wrong or stale. | L |
| E2 | **Spot fuzzing when sharing** | If sharing ever exists, coordinates must degrade deliberately. Design it before it is needed. | S |
| E3 | **Licence expiry reminder** | Trivial, and every angler forgets. | S |

---

## Part 3 — Deliberately NOT building

Recorded so nobody proposes them again without reading why.

> **Partly reversed 2026-09-03 by the founder.** `docs/specs/fishing-passport-wildlife-boat-games.md`
> proposes badges, a species collection, wildlife sighting logs, photo-assisted
> identification, and private boat games. It is the newer founder document, so it stands;
> the reasoning below is kept because the spec must keep answering it. That spec's §46
> records which objections it answers and which one is still open. The bullets it touches
> are marked below.

- **Streaks, badges, gamified logging.** *(Revisited — passport spec §12–§14, §46. Streaks
  stay dead by the founder's own choice; achievement badges are now in scope.)* This is the
  dangerous one. Gamification would bias the denominator — people log to protect a streak,
  and stop logging once it breaks. Our entire statistical claim rests on the log being an unbiased record of when someone
  fished. **Rewarding logging corrupts the data we are selling.** If any engagement
  mechanic is ever added, it must reward *confirming a trip honestly*, never reward
  catching or logging more.
- **Social feed, following, public catches.** Anglers do not share spots. *(Still true.
  The passport spec keeps games private and non-wagering, lists a public feed under its own
  §41 non-goals, and gates public anything behind moderation and privacy controls — §30.)*
- **Leaderboards.** Same reason as streaks, worse. *(Global leaderboards remain out —
  passport spec §41. Private per-boat scoreboards inside one trip are Phase 4 and are not
  the same thing.)*
- **Fish identification from photos.** Different product, enormous effort, and wrong
  answers are worse than no feature. *(Revisited — passport spec §15–§17 keeps AI as a
  ranked suggestion that never sets verification status or a legal conclusion. Phase 2+,
  and it needs a media table that does not exist yet — see that spec's §45.2.)*
- **A full Tide Alert clone.** Already in `SPEC.md` §6. We need tide *data*, not a
  competing tide *viewer*.
- **Generic fishing advice.** Competes with every blog on the internet and trades away the
  only differentiator we have.

---

## What I would pick, if forced to choose five

Cheap, high-signal, and none of them blocked by the open ontology question:

1. **B1 barometric trend** — likely the highest signal-per-hour in the whole table
2. **B2 sun times** — free, and dawn/dusk is the oldest known pattern
3. **A1 voice note** — the best fit for what the moment of a catch is actually like
4. **C1 "find days like today"** — the alerting dream, made honest
5. **D1 widget** — logging friction is the product's real constraint

**A6 (multi-angler) deserves a mention it will not get from its position on the list:** it
is not a nice-to-have, it is a correctness issue. Three anglers fishing for four hours is
not the same denominator as one angler fishing for four hours, and if we ever pool data
across users without knowing this, the rates will be wrong in a way nothing downstream can
detect.

---

## Part 4 — The risk nobody owned

Added by `coo`, 2026-08-28, and it is a better candidate for "the thing most likely to
hurt us" than any open founder question:

**Offline sync has no design and no owner.** D3 makes offline logging a hard requirement,
Phase 1's exit criterion depends on a write made in airplane mode syncing correctly, and
nobody has designed the local store, the sync protocol, or the conflict rules. It is now
assigned to `architect`. Every open question in this file is smaller than this one.
