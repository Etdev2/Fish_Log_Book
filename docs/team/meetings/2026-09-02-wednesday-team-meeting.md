# Fish Logbook — Wednesday Morning Team Meeting

**Date:** 2026-09-02 · **Facilitator:** `coo` · **Compared against:**
[2026-09-01 September staff meeting](2026-09-01-september-staff-meeting.md) ·
**Record type:** permanent, reviewable

**Ground rule, unchanged from yesterday:** every claim below was checked against the
working tree at commit `87ea99d` this morning. Where a check was run, its output is
quoted. Where something is unverified, it says so. Yesterday's meeting is treated as a
scorecard to be marked, not a document to be re-agreed with.

---

## 1. The 24-hour scorecard — yesterday's plan vs. what happened

Yesterday's meeting closed with five September priorities and a "Now — this week" table of
three items. Here is that table, marked honestly.

| Yesterday's **Now** (top 3) | State this morning |
|---|---|
| 1. Provision hosted Supabase, apply migrations, wire auth, retire `LOCAL_ANGLER_ID` | **Not started.** `LOCAL_ANGLER_ID` still hard-coded at `src/features/catches/store.ts:214`, used across four files. No provisioning evidence. |
| 2. Outbox flusher (push/pull/conflict); fix the "Backed up" string in the same lane | **Not started.** `src/core/sync/store.ts` still does not exist. `readBackupState()` still returns `{ kind: "settled" }` unconditionally, so every screen still says **"Backed up"** and it is still false. |
| 3. Live NOAA CO-OPS fetch — **before 2026-09-04** | **Not started.** `tide-fixture.ts` still in place, window still ends 2026-09-04 23:00 UTC. **Two days.** |

Zero of three. And yet this was not an idle 24 hours — it was one of the most productive
on record. That contradiction is the meeting.

### What *did* ship (27 commits, PRs #18, #20, #21, #22, #23, #24, #25 merged)

| Shipped | Was it on yesterday's list? |
|---|---|
| Month calendar home, day pages, catch markers on the tide curve (#20) | **Yes** — "High / Calendar + day page (D23)". The spine's front half. |
| Historical catch slices: backfill entry, conditions capture, Catch Detail pages, tide snapshots (#21/#22) | **Yes** — "Medium / backfill with the after-the-fact flag (D24)". |
| Expansion foundations: regions, freshwater types, vocabulary parity, region-driven species (#18) | Partly — vocabulary work was an owner item. |
| Tackle taps-only quick inventory | No. |
| **Fish Legal** — 8 routes (`/fish-legal` + species, limits, alerts, offline, rockfish, boundaries), CA SoCal/NorCal/freshwater packs, Florida, jurisdiction chips, CDFW photos, Leaflet boundary map (#23, #24, #25) | **No.** Not in D21–D25, not on any Now list. Six new migrations underneath it. |

So: the calendar and the backfill — two genuine spine items — landed. Good work, and the
part of yesterday's plan that moved is the part that mattered second-most.

### Routes: real vs. still a stub *(checked file by file this morning)*

- **Real:** `/` (renders `MonthCalendar`), `/day/[date]` (renders `DayView`),
  `/catch/[id]` (renders `CatchDetailClient`), `/log`, `/tides`, `/tackle`, `/setup`,
  `/settings`, and all 8 `/fish-legal` routes.
- **Still placeholder text:** `/trip/[id]` (12 lines), `/spots` (12 lines),
  `/spots/[id]`.

That second list matters more than it looks. **`/trip/[id]` being a stub means trip
start/end still does not exist, which means `analytics.trip_effort` still has no rows
under it.** `biostat`'s single loudest point yesterday — *"we are recording numerators
with no denominator; every catch we log is statistically inert"* — is unchanged this
morning. The product's stated differentiator is still the one thing not built.

---

## 2. The one genuinely new fact: `main` is red

This was not true yesterday and nobody knows it yet.

```
$ npm run verify
tripwires: 10 problem(s)
```

All ten are in one file, `src/features/fish-legal/components/boundary-leaflet.tsx`: raw
colour literals in a component, which ADR 005 §2 forbids (`#0b2a3a`, `#7dd3fc`, `#f59e0b`,
`#ef4444`, `#a78bfa`, `#111827`, `#fb923c`). The rest of the suite is healthy —
**412 tests passing across 37 files, `tsc --noEmit` clean, lint 3 warnings / 0 errors** —
which is precisely why this slipped through: the tests were never the gap.

Two things follow, and they are the whole argument for today.

1. **The project's own definition of done is failing on `main`, and it failed silently for
   a day.** Vercel builds every PR, so a broken build would have been caught. Tokens and
   tripwires run on nobody's machine.
2. **This is the bill for shipping a large surface at full speed with no gate.** Not lost
   design hours — an undetected red `main`, in exactly the newest code. `test-agent` and
   `head-dev` both asked for CI yesterday and were sequenced behind other work. Twenty-four
   hours later the predicted failure arrived, in the predicted place.

Also still missing from yesterday's own workflow fixes: **`docs/team/STATUS.md` was never
created** (two meetings running), `.github/workflows/` still does not exist, `docs/legal/`
still does not exist, no Playwright, and `docs/team/BACKLOG.md` is stale — refreshed
2026-08-28, its **Now** still lists the calendar work that shipped yesterday.

---

## 3. `coo` — the direction, stated plainly

**Failure mode 7(b) tripped a second time, in the same week it was first flagged.** A
founder-directed surface (Fish Legal, ~8 routes, 3 PRs, 6 migrations) arrived and shipped
fast and well, while none of the three durability priorities moved. Scope is the owner's
call and this is not a request to reverse it — Fish Legal is real, useful work. But the
pattern is now the pattern twice, and yesterday it cost design hours where today it cost a
red `main`.

**Today's direction: stop adding surfaces and make the thing durable.** Nothing in today's
list is a new feature. The fish-legal work does not re-sequence the product thesis — it
added surface area to a foundation that still leaks data, still has no safety net, and
still cannot record the denominator.

The tide fixture decides the ordering. It expires **2026-09-04 23:00 UTC**. Today is the
last day with a full buffer day behind it.

---

## 4. Today's to-do

| # | Item | Owner | Tier | Dependency | Why it is today |
|---|---|---|---|---|---|
| 1 | ~~Fix the 10 tripwire violations in `boundary-leaflet.tsx` — tokens per ADR 005 §2~~ **DONE in this session** | `head-dev` | LOW | none | `main` was red; every merge on top of it was an undetectable regression |
| 2 | `.github/workflows/verify.yml` — `npm run verify` on every PR, then required on `main` | `test-agent` | LOW | merge after #1 | The exact gap that let #1 happen silently. Not a background item any more |
| 3 | Live NOAA CO-OPS fetch replacing the fixture | `head-dev` + `biostat` | MEDIUM | none — single swap point, `tide-series.ts` (ADR 006 §2) | Fixture dies 2026-09-04. Must be in a near-mergeable PR by end of day |
| 4 | `readBackupState()` — stop asserting "Backed up"; say "Saved on this device" | `head-dev` | LOW | none | Flagged as the most serious defect in the repo two meetings running. Four lines |
| 5 | Close or re-scope PR #26 (regulations, design-only) | `git-integrator` | LOW | diff vs. #23/#24/#25 | Almost certainly superseded by the code that already merged |
| 6 | Close PR #17, folded into #4's fresh fix | `git-integrator` | LOW | #4 merged | Open since 2026-09-01 19:41Z; don't resurrect a day-stale branch |

**Explicitly waiting — do not start today:** Supabase provisioning, auth wiring, the
flusher, trip start/end, day journal, spot picking, tackle-on-offline-store,
tackle-linked-to-catch, pressure capture, Playwright, privacy policy, `HANDOFF.md`
correction. All still Next. None moot.

**First in line tomorrow:** `docs/team/STATUS.md` (`coo`, ~40 lines) and a `BACKLOG.md`
refresh — both are now two meetings overdue and both exist to stop precisely the drift
this meeting is documenting.

### Process change, effective now

1. **CI lands today**, not as a "running alongside" item.
2. **Once green, `verify` — not `test` — is the required check on `main`.** No exceptions
   for "it's just a new surface, the tests still pass." The tests did still pass. That was
   the problem.

---

## 5. `ceo` — thinking outside the box: features that add real value

Constraint applied throughout: the parking lot already holds the obvious ideas (bite score,
alerts, photos, export, widget, heat map, personal bests, solunar, swell). None are
re-served here unless materially reframed. The bias is **compound an asset we already own
rather than add a noun** — four of the five below are joins on things already built.

> **The finding underneath this section:** two of these are not new features at all. They
> are read surfaces for write-side work that already shipped and currently has **zero**
> payoff.

### #1 — "The season, by the numbers the law would ask for" · **build this first** · FREE
*"How many keepers this season, how many I had to release by size, and was anything out of
season — without me looking it up."*

Fish Legal answers one question at a time, at the moment of the catch. Nobody has asked it
the question anglers actually carry: *am I generally clean, and did I mess up?* That is
unanswerable today **even though the app has been recording the answer since yesterday.**

Verified this morning: `src/features/fish-legal/regulation-snapshot.ts` stamps a frozen
legal verdict — pack id/version, verdict, size and bag numbers, `evaluated_date` — onto
every catch at log time (`src/features/catches/create.ts:409`), into the
`catch.regulation_snapshot jsonb` column live since migration `20260902090000`. **Pure
write-side cost, no read side.** This is a `GROUP BY` over rows that already exist, in a
panel inside an existing screen — not a new route, not a nav item, no new data collection.

- **Cost:** small. **Risk:** the wording must stay strictly *"what the record shows"* and
  never *"proof of compliance"* — the snapshot design is "what did we know then," not
  "what is true now." Counsel signs off on wording; it computes nothing new, so the
  liability surface is narrower than the regulations feature already shipped.

### #2 — "What's actually working" — rig/lure catch report · FREE (rate version: see below)
*"The Tady 45 has produced 4 fish this trip; the dropper loop none."*

Yesterday's #3 join (tackle ↔ catch), sharpened: **do not build a gear-picker at all.**
`trip_rig` / `trip_rig_gear` (core schema, append-only per D21a) already model gear as a
standing configuration a catch *inherits*. Zero extra taps with wet hands, which beats any
report screen. Only the read side is missing.

- **Cost:** medium. Raw counts are cheap today; a **rate** (fish per hour) needs
  `analytics.trip_effort` populated, which needs trip start/end — the item that keeps not
  getting built. **Risk:** shipping the counts version as a fourth screen repeats this
  week's mistake. It is a panel, not a surface.

### #3 — "On this day, in past years" — calendar recall card · FREE
*"Last September 2nd you caught yellowtail at West End on an incoming tide. This year,
nothing yet."*

A deliberate collapse of two parking-lot items — "find days like today" (C1) and
"season calendar across years" (C3) — with none of their cost or risk. C1 needs the
correlation engine (V2, gated on P6 and the O4 evidence threshold) because it searches
*similar conditions*. A same-calendar-day lookup **makes no statistical claim at all**: it
is a join on month-day across years, shown as a memory, not a prediction. Anglers already
think this way; the product cannot currently answer even that.

- **Cost:** small, and near-zero marginally now the calendar exists. **Risk:** it is one
  scope-creep step from becoming C1. Keep it literally date-based or it silently turns into
  the paid feature it was designed to avoid.

### #4 — Within-trip tide/catch pattern (not cross-trip correlation) · **free/paid unresolved**
*"All three fish today came within 40 minutes of the tide turning"* — shown only for trips
that happened, never predicted forward.

Bite score is V2 and gated on O4 precisely because cross-trip correlation at small n is
easy to get honestly wrong. A **within-one-trip** statement sidesteps that: n = this trip's
own catches against this trip's own tide curve (`condition_snapshot_tide_curve`, already
schema'd), verifiable by the angler on the spot, no aggregation, no confidence interval to
misrepresent.

- **Cost:** medium; needs a trip boundary, so it sequences *behind* trip start/end.
- **Flagged, not resolved:** this is `ceo`'s own reframe of an explicitly parked idea, and
  reframes of parked ideas deserve suspicion. **`biostat` owns whether the within-trip
  framing is honestly different, and D14 free/paid here is a founder call.**

### #5 — MPA / closed-water check at *trip start*, not just at the catch · FREE if built
*"You're inside a marine protected area — nothing you catch here can be kept."*

Fish Legal only fires when a species is picked at catch time. **A blank trip fished
entirely inside a closed zone is invisible to the app** — the denominator blind spot,
applied to legal risk. Repoints the Leaflet boundary map from decorating a spot page to
gating a trip.

- **Cost:** medium-high — needs trip start UI, point-in-polygon against boundaries whose
  authority nobody has verified for this purpose, and counsel review before the app claims
  "you are in a closed zone." A false negative is worse here than for size/bag, because
  presence is not something the angler chose to log. **Later, counsel-gated.**

### Trap, named so nobody proposes it in month two

**Gear-legality cross-checking** — "is this rig legal here": barbless-only zones,
hook-count limits, treble bans. It is the obvious next step from #1 + `catch_gear`, and it
is a trap. The packs are modelled around species/size/bag; a wrong *"your rig is legal
here"* is worse than no claim, exactly as ROADMAP Part 3 warns for fish ID. It would also
mean expanding the regulations data model itself. **Not without a dedicated `counsel` +
pack-authoring pass.**

### Free vs. paid (D14)

Free: #1, #3, #5, and #2 in its raw-count form. Unresolved and needing the founder: **#2 as
a rate** and **#4** — both edge toward "condition matching" under D14's letter while staying
"your own history" under its spirit. #5 should never be paywalled on principle.

---

## 6. Decisions needed from the owner

Trimmed from yesterday's eight — three are moot or overtaken.

> **Answered in the meeting — see §9.** Items 2 and 3 below were ruled on by the owner and
> are recorded as D-2026-09-02-A (no hosted database yet; local-first JSON + IndexedDB) and
> D-2026-09-02-B (web first, then native — both, sequentially). They are left in place here
> so the question and its answer sit together. **§9's rulings win.** Item 1 was clarified
> and is still open; items 4 and 5 are still open.

1. **Scope freeze: yes or no, in writing.** Asked for yesterday, understood, and two
   surfaces shipped anyway. Recommendation: freeze new top-level surfaces until the flusher
   and trip start/end are both done. *"Understood" is what happened yesterday.*
2. **Provision Supabase, or authorise `head-dev` to create it and hand back keys.** Still
   the single biggest unblock. Not today's task; decide this week so tomorrow is not spent
   waiting.
3. **The D15 fork** — (a) hold native-only, or (b) reposition the web app as an installable
   beta. Unchanged, still open, still drifting.
4. **New:** free/paid boundary for the rig **rate** report and the within-trip tide pattern
   (§5 #2, #4).
5. **New:** greenlight the legal-snapshot rollup (§5 #1) as the next feature after the
   durability work — it is the one idea that needs none of the blocked spine.

**Now moot / dropped from active tracking:** Quick Mark 88px vs 68px (PR #14 merged);
Apple Developer Program (no Phase 2 code exists — revisit at Phase 2); ontology vocabulary
red-pen (real, but a standing LOW item, not a decision).

---

## 7. Carried forward unchanged, and worth saying once

- **The denominator is still not built.** `/trip/[id]` is placeholder text.
  `analytics.trip_effort` has no rows. Every catch logged so far is still statistically
  inert.
- **Nothing has ever left the device.** No sync store, no auth, no server round-trip.
- **Nothing has ever been held in a hand.** Zero real-phone testing, on anything, still.
- **Evidence in PR bodies is still not reproducible.** No Playwright harness committed.

---

---

## 8. Done during this meeting — item 1, with reproducible evidence

`main` is green again.

Seven design tokens were added to `src/core/design/tokens.json`, named for what they mean
on the map rather than for their hex value — `map-ocean`, `map-boundary-gma`,
`map-boundary-rca`, `map-area-closed`, `map-area-protected`, `map-position-stroke`,
`map-position-fill` — and `boundary-leaflet.tsx` now draws from them. Rendered appearance
is unchanged: every substitution is the identical colour, and no weight, opacity or
`dashArray` was touched.

```
$ npm run verify   →  exit code 0
tripwires: clean.
lint: 3 warnings, 0 errors (all pre-existing)
tsc --noEmit: clean
Test Files 37 passed (37) · Tests 412 passed (412)
```

**One thing was checked rather than assumed, which is the point of §2.** The first version
of this fix passed `var(--color-…)` straight into Leaflet's path options. Leaflet styles
paths with `setAttribute('stroke', …)`, i.e. SVG *presentation attributes*, and whether
`var()` resolves there is not obvious. It was tested in the repo's Chromium rather than
argued about:

```
path stroke   = rgb(125, 211, 252)   (--color-map-boundary-gma  = #7dd3fc)  ✓
circle fill   = rgb(251, 146, 60)    (--color-map-position-fill = #fb923c)  ✓
control fill  = rgb(251, 146, 60)    (literal #fb923c, for comparison)      ✓
```

It works in Chromium. **It was still changed**, because Chromium is not the engine this
product is aimed at and WebKit could not be tested here. Leaflet path colours now go
through a small `tokenColor()` helper that resolves the custom property with
`getComputedStyle` before Leaflet ever sees it — engine-independent, `tokens.json` still
the single source of truth. Plain CSS properties (`style.background`) keep `var()`, which
is safe everywhere.

**Still not verified, and stated plainly per the rule from §2:** nobody has looked at this
map in a browser. The colours are proven to resolve; the map has not been seen. That check
belongs with the field protocol and Playwright work, not to an assertion in this document.

---

## 9. Owner decisions — given in the meeting, 2026-09-02

These are the owner's words, recorded as rulings. They supersede the corresponding items in
§6 and re-sequence §4.

### D-2026-09-02-A · No hosted database yet. Local-first, on purpose.

> *"I decided not to implement a database right now because it's a little too much overhead
> and I don't want to overcomplicate things right now… once we got the shell kind of in
> place then we could add the schema and we could know what we're working with, so we won't
> use any of the keys, and a big part of this app is meant to be used locally without
> internet so I'd like to use JSON and IndexedDB as much as we can."*

**Ruling:** Supabase is not provisioned **right now**. No keys. Storage stays JSON +
IndexedDB. The schema is added once the shell exists and we know what we are actually
storing.

> **Clarified by the owner after this was first written:** *"I'm not saying we're not gonna
> implement a database. I'm just saying we're not gonna implement a database right now."*
> An earlier draft of this section said the server path was "withdrawn, not deferred." That
> was too strong and is corrected here: **a database is still the plan — it is deferred
> until the shell tells us what we are storing.** Everything below stands, except that the
> server work is *paused*, not cancelled, and the twelve migrations are the head start on it.

**Consequences — this is the largest re-sequence since the project started:**

1. **Nothing is blocked any more.** Yesterday's entire critical path — provision Supabase →
   wire auth → write the flusher — is **paused, and no longer blocking anything**. The three
   items that carried "Blocked" in yesterday's action table were all blocked on a server
   that is now deliberately not coming.
2. **Trip start/end — the denominator — is unblocked and becomes the top feature item.** It
   never needed a server; it is pure local work. `biostat`'s standing objection (*"we record
   numerators with no denominator"*) can be answered now instead of after an integration
   project. `/trip/[id]` is still placeholder text.
3. **The "Backed up" string moves from important to non-negotiable.** It was a temporary lie
   pending the flusher. With no server by design it is a *permanent* lie. Every screen must
   read **"Saved on this phone."** No user-facing string may claim a state the code cannot
   observe (proposed house rule, yesterday §4).
4. **Export becomes the durability story, not a nicety.** With no server, clearing site data
   destroys every record the product has. Export-to-file is now the only backup that exists.
   It was parked as *"export as a trust feature, free"*; it is promoted to real work.
5. **The twelve migrations already written stay as design artifacts**, unapplied. They are
   not wasted — they are the schema we adopt when the shell tells us what we are storing.
   `LOCAL_ANGLER_ID` is correct for now and is no longer a defect to retire.
6. **RLS remains unexercised, and that is now fine** — there is no session to exercise it
   with. It stops being a live concern and becomes a Phase-2 concern.
7. **`analytics.trip_effort` is a Postgres view, so trip effort needs a local equivalent.**
   Computing effort from local trip rows is `biostat`'s to specify before the UI lands.

### D-2026-09-02-B · Web first, then native. Not a fork.

> *"Right now we're just getting our work on web app and then after we're done with that
> we're gonna move over to native so we're gonna have native and web. I'm just doing web
> right now cause it's easy for me to test on my phone without having my computer or Xcode."*

**Ruling:** The D15 "fork" of §6 was a false choice. It is not (a) *or* (b) — it is (b)
**then** (a), sequentially, and both ship. The web app is not a throwaway prototype and not
a repositioning; it is the first client, chosen because the owner can test it one-handed on
a real phone today without a Mac or Xcode.

**Consequences:** the web app's quality bar rises — it is a shipping client, not a spec —
and the "deciding by drift" warning is void, because a decision was made. The Watch remains
the dominant unknown, unchanged. **Real-phone testing is now available every day**, which
retires the standing complaint that *nothing has ever been held in a hand* — `ux-ui`'s field
protocol becomes immediately useful rather than aspirational.

### D-2026-09-02-C · Scope freeze — clarified, awaiting the owner's word

The owner asked what a freeze is. Recorded plainly: it is an *ordering* rule, not a ban on
ideas — do not start a new top-level area until the half-built ones work. The two surfaces
in question were **Tackle Box** (pre-meeting, the trigger) and **Fish Legal** (post-meeting,
8 routes). Both are good work; only the ordering was ever in question. **Still open.**

### Revised order of work, after these rulings

| # | Work | Owner | Note |
|---|---|---|---|
| 1 | ~~Unbreak `main`~~ | `head-dev` | **Done** — §8 |
| 2 | CI: `npm run verify` on every PR, then required | `test-agent` | Unchanged. More important now the web app is a shipping client |
| 3 | Live NOAA tide fetch + offline cache | `head-dev` + `biostat` | Fixture dies **2026-09-04**. Must cache — the app is offline-first by ruling A |
| 4 | "Backed up" → "Saved on this phone" | `head-dev` | Promoted. Permanently true under ruling A |
| 5 | **Trip start/end, incl. blank trips — the denominator** | `head-dev` + `biostat` | **Unblocked by ruling A.** Top feature item |
| 6 | Local export / backup to a file | `head-dev` | Promoted by ruling A — the only backup that will exist |
| 7 | Legal-snapshot season rollup | `ceo` spec → `head-dev` | Needs no server; buildable now |

**Paused by ruling A — still the plan, just not now:** Supabase provisioning, auth wiring,
retiring `LOCAL_ANGLER_ID`, the outbox flusher, end-to-end RLS validation. These resume when
the shell has settled and we know what we are storing; the twelve migrations are the head
start. What changed is that none of them blocks anything today.

---

**Meeting closed.** Next review: end of day today on items 2–4, or at Phase 1's exit test.
