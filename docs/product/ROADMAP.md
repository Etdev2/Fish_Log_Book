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
1. **Define uphill/downhill.** The only hard blocker in the project. Every catch logged
   under the wrong reading is mislabelled and unrecoverable.
2. **Red-pen the controlled vocabularies** in `docs/architecture/ontology.md` — two passes
   now (salt and bass). Gaps push users into custom fields, and custom-field data can never
   be pooled.

### Unblocked, ready to build
3. Sequence the two products — `coo`.
4. Ratify pricing at $49.99/yr + $7.99/mo (O6) — `ceo`.
5. Approve P6, the shared server-side engine — without it the statistics get written once
   per platform.
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
| A2 | **Photo with EXIF stripped** | Already in the spec as V2. The privacy half matters: photos carry GPS, and anglers do not share spots. | S |
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
| C1 | **"Find days like today"** — search history for matching conditions | The honest version of the alerting dream, and it works at any sample size because the angler judges the result, not the app. | M |
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

- **Streaks, badges, gamified logging.** This is the dangerous one. Gamification would
  bias the denominator — people log to protect a streak, and stop logging once it breaks.
  Our entire statistical claim rests on the log being an unbiased record of when someone
  fished. **Rewarding logging corrupts the data we are selling.** If any engagement
  mechanic is ever added, it must reward *confirming a trip honestly*, never reward
  catching or logging more.
- **Social feed, following, public catches.** Anglers do not share spots.
- **Leaderboards.** Same reason as streaks, worse.
- **Fish identification from photos.** Different product, enormous effort, and wrong
  answers are worse than no feature.
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
