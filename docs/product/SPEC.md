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

**D10 — Current direction vocabulary.** SETTLED, and fully defined by D20.
"Uphill" and "downhill" describe the direction the current is running. "Inshore" and
"offshore" are the other two vectors. Four directions total. This is a canonical field.

**D20 — What uphill and downhill actually mean. SETTLED 2026-08-28. Was the project's
one hard blocker.**
Two perpendicular axes, four directions:
- **Along-shore axis:** **uphill = the current running UP-COAST**, i.e. toward the
  northwest (Long Beach, Malibu, Santa Barbara). **Downhill = down-coast**, toward the
  southeast (Dana Point, San Diego).
- **Cross-shore axis:** **inshore** = toward the beach, **offshore** = away from it.

Anchored to the **coastline, not the tide.** A flooding tide can run either way along the
coast, so current direction and tide state are independent variables — which is precisely
what makes recording both worthwhile.

**Storage rule, and it is not optional:** the angler always sees and taps their own words
(uphill / downhill / inshore / offshore). Underneath, the app stores the **actual compass
bearing for that spot**, derived from the spot's own coastline orientation. The words are
a display layer over a physical direction.
*Why:* a global compass mapping breaks the moment a spot's coastline runs a different way
— a bay, a jetty, a harbour mouth, the East Coast — and a label with no physical anchor
cannot be pooled across users or corrected later. Storing the bearing means the vocabulary
can change, spread to new coastlines, or be re-labelled entirely without invalidating a
single catch already logged.

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

**D15 — Native Apple first, native Android second.** SETTLED *(overrides P1)*
Founder's call, made after the Expo case was argued: build native Swift/SwiftUI for
iOS **and Apple Watch**, then native Android later. Rationale: Apple Watch matters, and
one-tap logging from the wrist — wet hands, fish in the other hand — is the best
expression of this product. Expo does not do watchOS.
Accepted costs, stated plainly: a Swift learning curve on top of an ontology problem and
a statistics problem; two codebases eventually; the existing Next.js repo becomes backend
and admin rather than product. See P6 for how the correlation engine survives this.
**Apple Watch is now a V1 target, not a someday** — it is the reason for the decision.

**D16 — Bad conditions are logged explicitly, not left blank.** SETTLED
Founder: *"you wanna click 'these conditions suck'."* A trip that produced nothing gets a
positive, expressive record rather than an absence. This is a better answer than a neutral
blank trip: it is faster, it is emotionally satisfying to tap when you are irritated, and
it captures the angler's own read of the conditions as data.
Implication for R2: the denominator is collected through a button people *want* to press.
*(The capture mechanism — manual vs a retroactive "how'd it go?" prompt — is O11.)*

**D17 — The bite score describes conditions, not species.** SETTLED *(Q14 = option d)*
The score reads the conditions themselves — "big fast outgoing tide near a full moon" —
and the angler decides what that means for their target. It does **not** claim to know
what a halibut wants.
Founder also gated it: the feature ships **after there is enough data**, not in V1.
Later evolution is per-species pooled across similar locations (Q14 option c), which is
where the real magic lives, once pooling makes the sample size honest.

**D18 — Two products, built together: saltwater and bass.** SETTLED *(overrides D13's sequencing)*
Founder's call, made after the focus concern was raised: bass is likely the bigger market
and both matter, so both get built rather than salt-first-bass-later.
Architecture is unchanged and already supports it — two vocabularies, one engine,
divergence living in nullability and `water_class`-scoped vocabulary tables (see
`docs/architecture/ontology.md`). What changes is **scope and sequencing**, not structure.
**Consequence:** P6 (shared server-side engine) is no longer optional. Two products across
iOS + Watch, with Android later, is up to six client implementations. One person cannot
maintain the statistics six times.
See R11 for the risk this carries.

**D19 — Empty-state and below-threshold UX delegated to `ux-ui`.** SETTLED *(Q16)*
Founder's call: the designer decides. Constraints that stand regardless — the bite score
refuses to render below threshold (D12a), and generic fishing advice not derived from the
user's own data is out of scope (it competes with every blog on the internet and trades
away the differentiator).

**D21 — A web build comes first, as the working prototype and as the spec for Swift.** SETTLED 2026-08-28
Founder's call. The calendar, notebook and quick-mark get built now in this Next.js repo as
a mobile web app the founder can carry on a boat this week. **This does not overturn D15.**
Native Swift/SwiftUI for iPhone + Apple Watch remains the shipping V1 client; the Watch is
still the reason for that decision and a browser cannot serve it.
What the web build is for: getting the four verbs, the calendar and the notebook in front of
a real angler on real water in days instead of weeks, so the Swift version is built from a
thing that was used rather than from a markdown document that was read.
*Accepted cost, stated plainly:* the logging and calendar UI gets written twice. That is the
price of field feedback before the expensive client exists. The schema, the Supabase backend,
the tide/moon enrichment and the sync rules are written **once** and shared — only the view
layer is duplicated. Anything that would be expensive to write twice belongs on the server.

**D22 — The quick mark is a fish by default, resolvable later, and an unresolved mark does
not count.** SETTLED 2026-08-28
Founder's framing: it works like the **man-overboard button on a boat**. One tap, no
questions, the position is saved. Details are added later, or set in advance (D21a below).
- A mark is created as a Catch with `species_id` null and a resolution state of `unresolved`.
- It can later be confirmed, corrected to a lost fish / missed bite, or dismissed as a
  mis-tap or a non-fish waypoint.
- **Unresolved marks are excluded from every catch rate and every pooled statistic** until a
  human confirms them. An accidental tap must never become a phantom fish in the denominator.
  This is R1's discipline applied to the fastest button in the app.
- The mark is never blocked by a missing GPS fix, a missing network, or a missing species.
  It writes locally with whatever accuracy it has and enriches later (`enrichment_status`).

**D21a — Attributes can be set before, not just after.** SETTLED 2026-08-28
The angler can set a rig once — spot, platform, lure, bait, depth, target species — and every
subsequent quick mark inherits it until it is changed. This is what makes a one-tap mark carry
real data instead of an empty row. Sticky per trip, editable mid-trip, and each mark stores the
values it inherited so that changing the rig later never rewrites history.

**D23 — The calendar is the history surface, and the notebook is a day-level journal.**
SETTLED 2026-08-28
The app opens onto a month calendar. Tapping a day opens that day's page.
- **One freeform journal entry per calendar day** — the notebook page. A day can hold two
  trips, or none, and still have something written on it.
- Individual catches keep their own short notes. Trip notes stay as the ontology has them.
- **If the day is today, the day page offers Start Fishing** and the live logging surface.
  Past days open in read/write history mode (D24).
- Journal text is for the angler's own memory and search. Per the ontology it is **never
  parsed for statistics** and never pooled across users. If a pattern in the prose turns out
  to matter, it graduates into a canonical field — it does not get mined out of free text.

**D24 — Any past day can be written to, and backfilled rows are flagged as such.**
SETTLED 2026-08-28
Full backfill: trips, catches and journal entries can be added to any past date, so paper
logs can be typed in. Two rules that make this safe rather than corrosive:
- Every backfilled row records that it was entered after the fact, and when. A row the app
  witnessed live and a row typed in from memory are **different facts** and must be
  distinguishable forever.
- Conditions for a backfilled day come from historical sources, not live capture. NWS
  `api.weather.gov` cannot reach back past roughly two days — NOAA NCEI covers the rest, and
  where nothing covers it the fields stay **null, never zero** (biostat rule 1).

---

## 3. Proposed — awaiting the founder's call

**P6 — If we go native (D15), the correlation engine must live server-side.** PROPOSED
D15 costs us the write-once TypeScript engine that motivated the Expo recommendation.
There is a clean way to get it back: **thin native clients, one shared engine on the
server**, written in TypeScript in this repo alongside Supabase.
- **Server-side (write once, TS):** correlation engine, condition matching, evidence
  thresholds (O4), bite-score computation (D12a/D17), pooled cross-user analysis (D11).
  This is the hard, valuable, frequently-changed code. It must never be written twice.
- **On-device (per platform):** UI, offline capture, local cache, moon maths (pure
  computation, trivially portable), and rendering cached tide curves.
- **The offline constraint (D3) bites here.** Logging must work with no signal, so the
  client caches tide predictions and computes basic state locally. Anything requiring the
  engine degrades gracefully to "will update when you're back in signal."
Without this split, D15 means writing the statistics twice — Swift now, Kotlin later —
and watching them drift. That is the single biggest risk the native decision introduces.

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

**O5 — The canonical ontology itself.** Drafted; being finalised now that D20 unblocks it.
Two ontologies now, per D13: saltwater and bass. Needs a domain-modeling session with
the founder to validate against real angler vocabulary.

**O6 — Pricing. `cfo` recommendation in (2026-08-28); `ceo` to ratify.**
Comparables (FishAngler, Fishbrain, Tide Alert verified from the App Store; Navionics and
ANGLR partly third-party-sourced) cluster at **$40–80/yr effective**.
Recommendation: **$49.99/yr + $7.99/mo**, annual pushed hard given seasonality.
**The finding that matters more than the price:** infrastructure cost is never the binding
constraint — conversion rate is. See R9.

**O7 — Does Android matter within 12 months?** Blocks the final form of P1.

**O11 — How is a bad-conditions trip actually captured?**
D16 settles *what* is recorded. Not settled: whether the angler taps it in the moment, or
answers a retroactive prompt on the drive home ("you were at Balboa 6–10am, how'd it
go?"). R2 says human discipline is unreliable — the retroactive prompt is the mitigation.
Likely the most-designed screen in the app. Owner: `ux-ui`.

**O12 — When does bass mode get built? RESOLVED: alongside salt, see D18.**

**O10 — Apple Watch. RESOLVED: yes, it matters. See D15.**
*Original question retained:*
One-tap logging from the wrist, hands wet, holding a fish, is the single best UX this
product could have. Expo does not do watchOS; bolting on a native watch target is
genuinely painful. If the watch is central rather than someday, P1 flips to Swift.
**This is the last thing blocking the platform decision.**

**O8 — Weather data licensing. RESOLVED by `cfo` (2026-08-28): build on the free path.**
Real prices, cross-checked against two sources: Open-Meteo **Standard $29/mo** (1M calls)
**excludes the Historical API**; **Professional $99/mo** is the tier we would actually
need for backfill. Verdict: build on **NWS + NOAA NCEI** (free, public domain). Call
volume never approaches even Standard's cap at 10,000 users, so we would be paying $99/mo
purely for convenience. The free path costs ~3–5 dev-days once. Revisit only if the
product goes international, or if NCEI's data quirks burn more engineer-time than $99/mo
buys back.

*Original finding, retained for context:*
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
- `[V1]` **Apple Watch one-tap logging** — the reason for D15. Wet hands, fish in hand
- `[V1]` **"Conditions suck" quick-log** (D16) — one tap records a bad session
- `[V1]` Silent auto-capture at log time: tide state, tide %, tide speed, moon, pressure
- `[V1]` Offline-first write; syncs when signal returns
- `[V1]` Trip start/stop, with blank trips recorded as first-class records
- `[V1]` "Needs details" queue — enrich a catch later, at leisure
- `[V1]` Enrichment fields: species, lure, bait, water temp, current direction, notes
- `[V1]` Map view: tap to place or correct a catch location
- `[V1]` Saved locations / fishing spots
- `[V1]` Favourite lures list, for fast repeat entry
- `[V2]` User-defined custom parameters (per D11)
- `[V1]` Bass/freshwater logging flow — its own vocabulary and its own UX (D18)
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
- `[V2 / gated]` **Bite score** — 1–10 heat index describing *conditions*, not species
  (D17). Explainable and decomposable; refuses to render below threshold (D12a)
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
- **Android** — planned as a *native* app after iOS ships (D15), not in V1.
- ~~Bass / lake mode deferral~~ — **reversed by D18.** Bass is now a V1 product.
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

**R9 — This is a 10,000-user product or it is a hobby.** `cfo`'s modelling: infrastructure
runs $9–10/mo at one user, $33–52/mo at 1,000, $60–260/mo at 10,000 — i.e. $0.006–0.05 per
user per month. Infra will never be what kills this. But 1,000 users would need an
implausible **85% conversion** to fund a living; the realistic planning target is
**10,000 users at 5–10% conversion**. Every product decision should be read against
whether it plausibly reaches ten thousand anglers. This is also the strongest argument yet
for D11's poolable canonical ontology — at 10,000 users, pooled data is a real dataset.

**R10 — Photo storage is the one cost line that scales badly.** It is cumulative and never
deleted. Compressing before upload is roughly a 10x lever; client-side caching is the
biggest lever on egress. Worth designing in from the first photo, not retrofitting.

**R11 — Two products at once is the founder's accepted risk.** D18 doubles every design
surface: two controlled vocabularies to validate with real anglers, two logging flows, two
empty states, two onboarding paths, two sets of species and tackle lists. The classic
failure mode is two half-products that neither saltwater nor bass anglers find good enough.
It is sharpened by an asymmetry: **bass is the harder UX problem.** Saltwater auto-fills
tide state, tide movement and station data; on a lake the automatic set is barometric
pressure and moon phase only, so bass leans hard on manual entry — water colour, clarity,
cover, structure, depth — which is exactly the friction the one-tap promise (D9) exists to
avoid. Mitigation: the shared engine (P6), and a genuinely sequenced plan from `coo` rather
than building both in parallel by feel.
