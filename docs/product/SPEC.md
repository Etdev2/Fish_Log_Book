# Fish Log Book — Product Spec

**Status:** draft, in progress. Written during a grilling session on 2026-08-28.
**Owner:** `ceo` (scope). Changes to Settled decisions need an explicit call from the founder.

## How to read this

Three states. Do not treat a proposal as a decision.

| Tag | Meaning |
|---|---|
| **SETTLED** | Decided by the founder. Build on it. |
| **PROPOSED** | Recommended, awaiting the founder's yes/no. Do not build yet. |
| **OPEN** | Nobody has answered it. Blocking something. |

Feature tags: `[V1]` first shippable version · `[V2]` after V1 has real users ·
`[LATER]` acknowledged, deliberately not scheduled · `[BLOCKED]` waiting on an OPEN item.

---

## 1. What this is

A fishing logbook for iPhone that makes it effortless to record a catch — and, just as
importantly, a trip where you caught nothing — then automatically attaches the
environmental conditions at that exact moment: tide state, tide speed, moon, barometric
pressure, weather, location.

Over time it lets an angler see and search their own patterns ("show me every halibut I
caught on a fast outgoing tide"), and eventually tells them when today's conditions
resemble their best days.

**The differentiator is tide correlation.** Not logging. Not charts. Plenty of apps show
tides; plenty log catches. Almost none connect the two with real data, and none collect
the blank trips that make the connection meaningful.

---

## 2. Settled decisions

**D1 — This is a real product, sold by subscription.** SETTLED
Not a personal tool. The founder is user #1 and knows the domain, but the app is built
for paying anglers from the start.

**D2 — Blank trips are first-class data.** SETTLED
"All data is good data." A trip where nothing was caught is recorded with the same
rigour as a catch. This is the denominator that makes every rate claim meaningful, and
it is the thing competitors do not have.

**D3 — Offline logging is mandatory.** SETTLED
No Wi-Fi, no cell signal, no problem. A catch is written locally and syncs later. This
is a hard requirement, not a nice-to-have — it constrains the platform choice and the
data layer.

**D4 — Map-based logging.** SETTLED
The user can tap a map to place or correct a catch location.

**D5 — Users can add their own parameters.** SETTLED
Anglers track idiosyncratic things. The app must let them add fields that matter to
them. *(How this coexists with cross-user statistics is P2 — unresolved.)*

**D6 — The tide model must be richer than a chart.** SETTLED
Not just height. The app needs:
- tide **state** — incoming, outgoing, slack
- tide **percentage** — how far through the cycle
- tide **speed** — the rate of change (mathematically, the derivative of the tide curve).
  This is the thing that separates a dead tide from a running one, and it is the founder's
  core hypothesis about why fish bite.
- the **rule of twelfths** as an angler-facing way to express the above
*(Exact math approach is O1 — blocked on `biostat`.)*

**D7 — Saltwater first, Southern California first.** SETTLED
Lakes are wanted eventually. *(How and when is P4.)*

**D8 — Water temperature is manual entry.** SETTLED
No sensor required. Garmin integration is `[LATER]`, not a V1 concern.

**D9 — Everything derivable is captured automatically.** SETTLED
The user should never type something the phone or an API already knows. Time, GPS,
tide, moon, and pressure are captured silently at the moment of logging.

**D10 — Current direction vocabulary.** SETTLED
"Uphill" and "downhill" describe the direction the current is running. "Inshore" and
"offshore" are the other two vectors. Four directions total. This is a canonical field.

**D11 — Canonical core ontology + non-poolable custom fields.** SETTLED *(was P2)*
A shared, well-designed canonical vocabulary (species, tide state, current direction,
lure class, bait, structure, water clarity, …) that is poolable across users — plus
custom fields that power a user's own filtering and search but are **excluded from
cross-user inference and labelled as such in the UI**.
Later: a promotion path — when many users independently invent the same field, it
graduates into the canonical schema.
The ontology itself is owned by `architect` + a domain-modeling session (O5).

**D12 — Ship the query app first; earn the alerting app with data.** SETTLED *(was P3)*
V1: the user asks, the app shows. Overlays, filters, search over their own log.
Statistics arrive as descriptions **with sample size attached**, never bare claims.
Alerts unlock per species per location once the evidence threshold (O4) is met.
**Founder's addition — the "bite score":** a 1–10 heat index for current conditions is
the eventual goal, and the emotional core of the product. See D12a and R8.

**D12a — The bite score is a V2+ feature and it must be explainable.** SETTLED
A single number is the most seductive and most dangerous form of R1: it launders
uncertainty into something that looks authoritative. Rules it must obey:
- It always displays **what it is based on** — "47 of your trips at this spot"
- It is **decomposable** — tap it and see which factors drove it and by how much
- It **refuses to render** below the evidence threshold rather than showing a shrug-score
- V1 ships **no score at all**

**D12b — Machine learning is a pooled-data feature, not a per-user one.** SETTLED
Honest constraint: at 50–100 catches per user against a dozen-plus variables, ML will
overfit and find noise with confidence. What works at that scale is interpretable models
with strong priors and partial pooling across users — not a learned black box.
Sequence: transparent weighted rules → per-user descriptive statistics → hierarchical
models pooling across users → genuine ML, once the cross-user dataset justifies it.
Owner: `biostat`.

**D13 — Lakes are a bass-fishing mode, not a tideless copy of the salt app.** SETTLED
*(revises P4)* Bass anglers track their own variables: water colour/clarity, moon phase,
time of year, water temp, structure, cover, depth. Tide is simply absent. This is a
second ontology sharing one engine, not a feature flag.
Sequencing unchanged: schema-ready in V1 (nullable tide, water-body type on Location),
zero bass-specific feature work until the saltwater product has real users.
Note the `biostat` finding: on a lake the automatic dataset is **pressure and moon only**
— so bass mode leans much harder on user input, and its logging UX is a different design
problem from the salt app's.

**D14 — Free logging forever; charge for interpretation.** SETTLED *(was P5)*
Free: unlimited logging, own history, basic overlays. Paid: correlation engine, condition
matching, alerts, bite score, forecast overlays, multi-location, export.
Rationale: paywalling logging starves the app of the data that makes it worth paying for.
Annual pricing likely fits the season better than monthly (O6).

---

## 3. Proposed — awaiting the founder's call

**P1 — Platform.** PROPOSED, and the recommendation has changed.
**Now recommending Expo / React Native in a monorepo with this Next.js repo**, not
native Swift. Correcting an earlier argument: the barometer objection killed the *PWA*,
but Expo has full barometer, GPS, background location, SQLite and StoreKit access — every
hard requirement in D3 and D9 is met.
The deciding factor is **the correlation engine**. The tide maths, moon offsets,
condition matching and the D12a scoring are pure logic with no UI. In a TypeScript
monorepo that is written **once** and runs in the phone app, a web dashboard, and
server-side alert jobs. Native means writing it twice, in two languages, and watching
them drift.
Cost is near-identical either way: ~$99/yr Apple + Supabase. The real cost of Swift is
months of learning tax on top of an ontology problem, a statistics problem and offline
sync.
**Blocked on O7 (Android) and O10 (Apple Watch).**

---

## 4. Open questions

**O1 — Tide math. RESOLVED by `biostat` (2026-08-28).**
Do **not** reconstruct a curve from harmonic constituents. NOAA publishes amplitude and
phase but not the nodal factors or equilibrium argument, so reconstruction is real work
with no guarantee it matches NOAA's own numbers. Instead: pull the **6-minute prediction
series and difference it** — measured max flood 0.390 m/hr, max ebb -0.450 m/hr at
Newport. That is a better derivative than anything we would rebuild.
**Trap:** Balboa Pier (9410583) is a *subordinate* station — no constituents, no 6-minute
data, high/low only, and its error message blames the datum, which is misleading. Use
**9410580 Newport Bay Entrance**, a reference station 1.7 km away.
Rule of twelfths stays as an angler-facing *presentation* of the real curve, not as the
maths underneath it.

**O2 — Predicted current direction. RESOLVED: not possible. D10 stays manual.**
Zero NOAA current-prediction stations within 25 km of Balboa Pier. Exactly one within
100 km (Queens Gate, 29.7 km, a dredged harbour channel), then nothing until San Diego
Bay at 117 km. Auto-filling from Queens Gate would be inventing a number.
Do not design a prefill for current direction.

**O3 — Automatic water temperature. RESOLVED: D8 was right, keep manual entry.**
Six NDBC buoys within 50 km, sampled at the same instant, disagreed by **2.1 °C**
(23.4–25.5 °C) — and all are offshore while the angler is in the surf. CO-OPS has no
water temp at Newport or LA; nearest is La Jolla at 100.9 km.
Design rule: show the nearest buoy as a **labelled reference** beside an empty field.
Never prefill it.

**O4 — What is the evidence threshold that unlocks an alert?**
P3 says alerts unlock "once there is enough data." Enough is a number, and it must be
computed, not picked round. Owner: `biostat`.

**O5 — The canonical ontology itself.** IN PROGRESS — `architect` drafting.
Two ontologies now, per D13: saltwater and bass. Needs a domain-modeling session with
the founder to validate against real angler vocabulary.

**O6 — Pricing.** Owner: `cfo` + `ceo`. Blocked on P5.

**O7 — Does Android matter within 12 months?** Blocks the final form of P1.

**O10 — Does Apple Watch matter in year one?**
One-tap logging from the wrist, hands wet, holding a fish, is the single best UX this
product could have. Expo does not do watchOS; bolting on a native watch target is
genuinely painful. If the watch is central rather than someday, P1 flips to Swift.
**This is the last thing blocking the platform decision.**

**O8 — Weather data licensing. NEW, and it has teeth.**
Open-Meteo's free tier **forbids commercial use** — their own example of what is not
allowed is "apps that have subscriptions", which is exactly D1. Historical backfill
(pressure at the moment of a catch) needs their *Professional* tier, not Standard.
A verified zero-cost path exists: **NWS api.weather.gov** for live and forecast (public
domain, free for any purpose, and its `/points` response hands us the location's IANA
timezone) plus **NOAA NCEI Global Hourly** for backfill. NWS cannot backfill — its
observation window is under two days.
Decision needed: pay Open-Meteo for convenience, or build on NWS + NCEI for free.
Owner: `cfo` (real prices) + `ceo` (the call). Prices could not be scraped; someone has
to open the pricing page in a browser.

**O9 — `suncalc` has no licence field on npm.** Use `astronomy-engine` (MIT, verified)
unless `counsel` clears it. Everything NOAA/NWS/USGS is US public domain and clean.

---

## 5. Feature list

### Logging
- `[V1]` One-tap catch log — writes timestamp + GPS instantly, no forms, no blocking
- `[V1]` Silent auto-capture at log time: tide state, tide %, tide speed, moon, pressure
- `[V1]` Offline-first write; syncs when signal returns
- `[V1]` Trip start/stop, with blank trips recorded as first-class records
- `[V1]` "Needs details" queue — enrich a catch later, at leisure
- `[V1]` Enrichment fields: species, lure, bait, water temp, current direction, notes
- `[V1]` Map view: tap to place or correct a catch location
- `[V1]` Saved locations / fishing spots
- `[V1]` Favourite lures list, for fast repeat entry
- `[V2]` User-defined custom parameters (per D11)
- `[V2]` Photo attached to a catch
- `[LATER]` Garmin / sensor integration for automatic water temp

### Conditions engine
- `[V1]` Tide height curve for a chosen station
- `[V1]` Tide state — incoming / outgoing / slack
- `[V1]` Tide percentage through cycle
- `[V1]` Tide movement — rate of change, from differencing the 6-minute series (O1)
- `[V1]` Rule of twelfths, as presentation over the real curve (O1)
- `[V1]` Moon phase as a continuous value. Store `moon_phase_angle_deg`, **not**
  illumination fraction — illumination is symmetric (waxing and waning gibbous both read
  0.8) and would merge two different conditions. Plus a *signed* `days_from_full`, so
  "three days before the full moon" is -3 and is distinguishable from +3
- `[V1]` Barometric pressure — from the phone at log time, from an API historically
- `[V1]` Weather: air temp, wind. User selects their nearest station
- ~~Predicted current direction~~ — **impossible, see O2.** User input only
- ~~Automatic water temperature~~ — **too inaccurate, see O3.** Nearest buoy shown as a labelled reference only

### Seeing patterns
- `[V1]` Catch history overlaid on the tide chart — see at a glance where your fish sit
- `[V1]` Overlay on the moon chart
- `[V1]` Search and filter: by species, location, tide state, tide size, tide speed,
  moon phase, lure, pressure — "what did I catch on big fast tides near the full moon"
- `[V1]` Per-location view: what works at this spot
- `[V2]` Descriptive statistics with sample size and confidence shown on every claim
- `[V2]` Condition matching — how today compares to your history
- `[V2]` Species × condition breakdowns
- `[V2 / gated]` Alerts when conditions match your productive days (per D12, O4)
- `[V2 / gated]` **Bite score** — 1–10 heat index for current conditions. Explainable and
  decomposable; refuses to render below threshold (D12a)
- `[LATER]` Machine-learned correlations, on pooled cross-user data only (D12b)
- `[LATER]` Cross-user pooled patterns (per D11)

### Tide viewer
- `[V1]` Today/tomorrow tide summary on the home screen
- Deliberately **not** a Tide Alert clone. No swell charts, wind charts, chart
  comparison, or monthly tables. See section 6.

### Business
- `[V1]` Free tier: unlimited logging (per D14)
- `[V2]` Paid tier: interpretation, alerts, forecasting, export
- `[V2]` Subscription billing
- `[LATER]` Web dashboard for deep analysis

---

## 6. Explicitly out of scope

Recorded so nobody rebuilds them by accident:

- **A full Tide Alert clone.** It exists, it is mature, and it is good. Re-creating its
  swell/wind/comparison charts is months of work for a worse version of an app the
  founder already owns. The app needs tide *data*, not a competing tide *viewer*.
- **Social features.** Anglers do not share spots. Feed, following, public catches — no.
- **Android**, pending O7.
- **Bass / lake mode features**, pending D13. Schema-ready only in V1.
- **Hardware/sensors**, pending Garmin `[LATER]`.
- **Fish identification from photos.**

---

## 7. Known risks

**R1 — Small samples produce confident nonsense.** One angler logs perhaps 50–100
catches a season against a dozen-plus variables. That is a regime that reliably produces
patterns which are pure noise. Every mitigation in this spec — blank trips (D2), the
canonical ontology (P2), sample size on every claim (P3), a computed threshold (O4) —
exists because of this. It is the central technical risk of the product.

**R2 — The blank trip depends on human discipline.** D2 only works if people press
"start" on days they catch nothing. If they do not, the denominator is biased and
everything downstream is wrong. Automatic trip detection is the eventual answer.

**R3 — Custom fields could fragment the data.** See P2.

**R4 — Seasonality.** Engagement and revenue will swing hard with the fishing season.

**R5 — The canonical ontology is a single point of failure.** Get it wrong and users
route around it into custom fields, taking their data out of the poolable set with them.

**R6 — Third-party data terms are a live commercial risk.** The moment the app charges
money, the free tier of the obvious weather provider stops being legal for us (O8). Any
data source picked before its terms are read is a liability. `counsel` reviews every
source before it ships.

**R7 — "Tide movement" is not "current".** The derivative of the tide curve is a rate of
water-level change, not a current speed. They correlate but are not the same physical
quantity, and there is no current station near Newport to calibrate against. Copy must
never call it current, or we are making a claim the data does not support.

**R8 — The bite score is where R1 does the most damage.** A 1–10 number is the most
persuasive thing the app can say and the easiest thing to get wrong. Users will trust it
far past what the data supports, and a wrong score on a wasted Saturday costs more trust
than ten wrong list items. D12a's constraints are not decoration — they are what makes
the feature shippable at all.
