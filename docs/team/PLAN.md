# Plan — Sequencing Two Products (R11) + Web-First Resequence (D21)

**Owner:** `coo` · **Date:** 2026-08-28 (resequenced same day, second pass) · **Fills:**
R11 (spec), ROADMAP item 3, HANDOFF item 3.
D18 (build salt and bass together) is settled and not reopened here. D21 (web build
first, in this Next.js repo, as prototype and Swift spec) is also settled and not
reopened here. This plan is how, not whether.

**What changed since this morning's version of this document:** the founder wants a
calendar, a day-journal notebook and a one-tap man-overboard mark (D21/D22/D23/D24),
and chose to build them **now, as a mobile web app in this repo**, rather than wait for
an Xcode project that does not exist yet. D15 stands — native iPhone + Watch is still
the shipping V1 client. The web app is a working prototype and the spec the Swift client
gets built from, not a replacement for it. Phase 0 stops being "Xcode project + schema";
see §2.

**Said plainly, once:** this is more scope, arriving all at once, on a V1 already
audited as overloaded (§1), plus a second view layer (browser, then Swift) to maintain.
D21 accepts that cost explicitly — the view layer is allowed to be duplicated, nothing
expensive is. My job is to make sure "nothing expensive" stays true and that the web
prototype's convenience doesn't quietly become the reason the Watch never gets built
(§6, failure mode 7).

**One thing said plainly and then dropped:** D18 doubles design surface on a solo
builder before a single line of client code exists. The mitigation isn't parallel effort
on two products — it's proving the shared skeleton once, on the easier-to-validate
product (salt), then reusing it, so bass is additive work, not a second climb. That
skeleton now gets proven on the web first (§2), which is a bonus, not a change of plan.

---

## 1. V1 is overloaded. It just grew. Cut list, refreshed.

Auditing the spec's `[V1]` tags against a solo builder, now shipping a web prototype
before Swift instead of Swift from zero — and D21–D24 added a calendar, a day journal,
a quick-mark, sticky pre-set attributes and full backfill on top of the original list:

**New cuts, made necessary by D21's added scope:**
- **Bass stays off the web prototype.** The web build ships salt-only. D18 commits the
  *shipping* client to both products; it does not commit the prototype to both. Web
  (2 states) × native (later) × salt+bass would be four logging implementations to keep
  in sync before any of them has a real user. The mechanics D21 actually needs proven —
  calendar, day page, notebook, quick-mark, backfill — are water-type-agnostic; salt
  proves them identically to bass. Bass's own vertical slice still happens once, natively
  (§2, Phase 4) — not duplicated on web first and native second.
- **Live enrichment (tide/moon/pressure/weather auto-capture) is out of the web
  prototype.** Every web write lands with `enrichment_status = pending`, same as a
  no-signal write does today under D22. Building the real ingestion pipeline is real
  work; building it once "to unblock the boat trip" and again "for real" server-side is
  exactly the duplicated-expensive-work D21 warns against paying for. NOAA/NCEI ingestion
  moves to run alongside the native track (§2, Phase 3), not before Phase 1's exit test.
- **The Xcode project no longer opens Phase 0.** It was going to be the first thing
  built; it is now deferred until the web prototype clears its own exit test (§2, Phase
  1 → Phase 2 trigger). Scaffolding native screens for a UI shape still being field-
  validated risks throwaway Swift — D21's whole premise is building Swift from a thing
  that was used, not a doc that was read.

**Held over from the original cut list, still cut, unchanged by D21:**
- Compound multi-field search ("big fast tide near a full moon") → ship species + spot +
  date filters first. The query engine is a UI/query-building problem, not a stats
  problem; it can grow after real users show which filters they actually reach for.
- Moon-chart overlay → tide-chart overlay ships; moon overlay is the same pattern done
  twice for less value. Home screen already shows moon (ux-cold-start §2.1).
- Weather station picker UI → auto-pick nearest NWS station, no browser. Add picker
  only if backfill accuracy complaints show up.

**Correctly scoped, don't cut:** offline-first write, four-verb logging, the calendar/
notebook/quick-mark themselves (they're the ask), backfill with after-the-fact flagging,
sticky rig (D21a), the Watch app (later, not smaller), blank-trip/bad-conditions capture,
saved spots, favorite lures, per-location view, needs-details queue, both ontologies.

**Not actually V1 at all, despite living in the V1 section of the schema doc:**
`custom_field_definition`/`custom_field_value` tables. Feature list already tags custom
fields `[V2]`. Skip building the `private`-schema isolation in the first migration —
it's real work (separate schema, revoked grants) for a feature with zero V1 callers.
Add it when V2 custom fields are scheduled, not before.

**The corrective the roadmap gets wrong:** ROADMAP frames P6 (server-side engine) as
"unblocked, ready to build" alongside schema and Xcode setup. Re-read what P6 actually
gates: correlation engine, condition matching, evidence thresholds, bite score, pooled
analysis — every one of those is `[V2]` or `[V2/gated]`. **V1 has no feature that needs
it.** Tide differencing is an ETL/ingestion job (NOAA → cache table), not "the engine."
P6 is a real decision but it does not block Phase 0–4 below. Get a yes/no from `ceo`
before V2 statistics work starts, not this week.

---

## 2. Phases, named, with exit criteria (resequenced for D21)

Phase 0 is no longer "Xcode project + schema." It is schema + the two ADRs the web
prototype cannot safely be built without. The Xcode project moves to Phase 2, triggered
by Phase 1's exit test — not by a calendar date, and not skipped because the web app
feels good enough. `architect` is writing both Phase-0-gating ADRs in parallel right now.

**Phase 0 — Shared foundations for a web-first build** (owner: `architect`, `head-dev`)
- V1 schema migrated to Supabase: core tables + reference tables, **plus** what D21–D24
  add — `catch.resolution_state` (unresolved/confirmed/corrected/dismissed, D22),
  a sticky per-trip rig/attribute-set table each mark snapshots from (D21a), a
  `day_journal_entry` table, one row per angler per calendar day (D23), and an
  `entered_after_the_fact` + `entered_at` pair on trip/catch/journal rows (D24). Minus
  the `private` custom-field schema — see §1.
- **Offline store/sync ADR** (`architect`, in progress) — must cover the browser
  (IndexedDB/localStorage write queue) *and* the future native store with one conflict
  policy and one definition of "synced," per D21's "sync rules are written once."
- **Web/native boundary ADR** (`architect`, in progress) — draws the line between what's
  shared (schema, Supabase calls, sync protocol, enrichment) and what's allowed to be
  duplicated (the view layer only), so Phase 2 isn't relitigating this later.
- Next.js app shell: routing for month calendar → day page, auth.
*Exit: schema migrated, both ADRs merged, and a stub calendar page in the browser reads
real days from Supabase.*

**Phase 1 — Web prototype: salt-only, four verbs + mark + notebook + backfill**
(owner: `head-dev`, `ux-ui`)
Mobile web, no native code. Salt only — see §1 cut. Every write goes through the
offline queue from Phase 0's ADR; enrichment lands as `pending` and is backfilled later
(§1 cut) — no live tide/moon/pressure/weather capture in this phase.
- Month calendar (D23).
- Day page: **today** offers Start Fishing and the four-verb live logging surface
  (Start Fishing / Log a Catch / Conditions Suck / End Trip) plus the one-tap quick mark
  (D22, unresolved-by-default, excluded from every rate until confirmed); **past days**
  open in read/write history mode with full backfill (D24), each backfilled row flagged.
- One freeform journal entry per day (D23), never parsed for stats.
- Sticky rig (D21a): set once, inherited by every mark until changed, snapshotted per
  mark so later edits don't rewrite history.
*Exit — same spirit as the original Phase 1, now on web: the founder carries a phone to
a real SoCal spot, logs a real trip through the four verbs, fires at least one quick
mark with no signal that syncs correctly on return, and backfills one real past paper-log
day with the entry correctly flagged as after-the-fact.* This is the two-week target
(§4) and the trigger for Phase 2 below.

**Phase 2 — Native kickoff, built from a used thing, not a read one**
(owner: `head-dev`) — **triggered by Phase 1's exit test passing, not by a date.**
Repo/project structure for iOS + Watch decided (where that code lives relative to this
repo — the decision Phase 0 used to gate on). Xcode project exists, builds, runs on
simulator, auth wired, Supabase Swift client in. The native four-verb + quick-mark screen
reproduces what Phase 1 proved on web — this is the entire point of building web first,
so treat any divergence from the web flow as a finding, not a fresh design.
*Exit: a documented Swift build/lint/test command passes on a clean checkout, a stub
screen reads a Supabase row, and the native four-verb flow is side-by-side comparable to
Phase 1's web flow.*
**If Phase 1's exit test has not passed within 3 weeks of this plan, `coo` escalates to
`ceo` before Phase 2 slips further — see §6, failure mode 7.**

**Phase 3 — Native salt vertical slice + live enrichment + Watch**
(owner: `head-dev`, `biostat`)
Merges the old "salt vertical slice" and "Watch" phases: salt logging itself is now
de-risked by Phase 1, so what's left is porting the proven flow to Swift, wiring the
NOAA/NCEI tide-and-historical-conditions pipeline that Phase 1 deliberately skipped
(§1 cut), and the Watch build — three-button UI, WatchConnectivity, write-queuing when
the phone is unreachable (pocketed, asleep, out of range).
*Exit: a real trip logged end-to-end on iPhone matching Phase 1's web exit test, with
live enrichment attached, **and** a catch logged from a physical Watch with the phone in
a pocket — not held, not on the simulator.*

**Phase 4 — Bass vertical slice (native, once)** (owner: `ux-ui`, `head-dev`)
`water_class` picker on new Spot (once, per ux-cold-start §3.1). Bass logging reuses the
same four verbs unchanged; adds the optional post-catch chip sheet (water colour,
structure, depth). Built natively and only once — see §1, bass was deliberately kept off
the web prototype. This is the actual test of D18/R11 — does the shared engine hold.
*Exit: a real lake trip logged end-to-end on the same native build that logged the salt
trip in Phase 3, no salt-specific code path touched.*

**Phase 5 — Seeing patterns** (owner: `ux-ui`, `head-dev`)
Catch history overlaid on the tide chart, basic filters (species/spot/date), per-location
view, needs-details queue.
*Exit: the founder can answer "what did I catch at this spot" from the app instead of
memory, for both a salt and a bass spot.*

**Phase 6 — V1 GA prep** (owner: `head-dev`, `counsel`, `ceo`)
D14 means V1 has nothing to bill — no paywall work needed. What's left: privacy policy
(counsel), crash reporting, TestFlight with external beta anglers (not just the
founder), App Store listing.
*Exit: both salt and bass flows have been used by a real external angler who is not the
founder, with no data-loss bug found in a week of use.*

**Everything else** (bite score, alerts, condition matching, pooled/custom-field stats,
photos, billing, Android) is V2+ and does not get scheduled here.

---

## 3. The critical path, corrected for web-first

`current_direction` (D10/D20) is answered (architect closed it same day) and doesn't
gate anything below regardless. The chain that matters now:

```
Supabase schema migration, D21–D24 tables included (architect)
        │
        ├── PARALLEL ── offline store/sync ADR — browser + native, one policy (architect)
        │
        └── PARALLEL ── web/native boundary ADR — what's shared vs. duplicable (architect)
        │
        ▼
Next.js app shell (calendar route, day route, auth)
        │
        ▼
Phase 1 — web prototype (calendar, notebook, quick-mark, four verbs, backfill)
        │
        ▼  (trigger: Phase 1 exit test passes)
Phase 2 — Xcode/Watch project scaffolding, ported from the proven web flow
        │
        ▼
Phase 3 — native salt vertical slice + live enrichment + Watch
        │
        ▼
Phase 4 bass vertical slice (native, once) ──► Phase 5 (patterns) ──► Phase 6 (GA)
```

The two ADRs are the actual gate on Phase 1, not schema alone — a web logging screen
built before the sync policy exists gets built ad hoc, which is exactly failure mode 1
below. Both are in progress with `architect` right now, in parallel worktrees.

**Not on the critical path at all, despite feeling urgent in the docs:**
P6 ratification, O6 pricing, `platform`/`Catch.outcome` yes/no (both additive, nullable,
reversible — proceed on architect's design, don't wait), the bass-current-field question
architect raised for `ceo` (moot for now — bass isn't being built until Phase 4, native),
bundled lake/coastline dataset research.

**Genuinely under-designed and actually risky, still — this hasn't changed, it's just
arriving sooner:** offline sync. The good news in D21: since the web app ships first,
this risk surfaces during Phase 1 instead of staying invisible until a native beta. The
bad news: the ADR now has to get the browser-side design right *and* keep it portable to
native, or Phase 2 relitigates it. See §6.

---

## 4. First two weeks

Two-week target: Phase 0 done, Phase 1 in progress toward its exit test. Ordered by
dependency, not calendar days.

**Immediately (today):**
1. `architect` — finish the offline store/sync ADR and the web/native boundary ADR
   (both in progress). These, not the schema alone, are what unblocks real logging-screen
   work — see §3.
2. `architect` — extend the schema migration draft with the D21–D24 additions named in
   §2, Phase 0 (`resolution_state`, sticky-rig table, `day_journal_entry`,
   `entered_after_the_fact`/`entered_at`). Seed reference tables from the ontology
   draft's `?`-flagged lists — don't wait on the founder red-pen.

**Days 1–3:**
3. `head-dev` — apply the schema migration to Supabase; stand up the Next.js app shell
   (calendar route → day route, auth). Skip the `private` custom-field schema (§1).
4. `ux-ui` — day-page layout for the two modes D23 requires: today (Start Fishing +
   four verbs + quick mark) vs. past (read/write history + backfill entry, D24).

**Days 4–7:**
5. `head-dev` + `ux-ui` — build the four-verb screen and the quick mark (D22), wired to
   Supabase, offline write via the Phase 0 ADR. No live enrichment (§1 cut) —
   `enrichment_status = pending` on every write.
6. `head-dev` — sticky rig (D21a): set-once-per-trip attributes, inherited by marks,
   snapshotted per mark.
7. `head-dev` + `ux-ui` — the day-journal entry (D23) and full backfill flow (D24),
   including the after-the-fact flag on backfilled rows.

**Days 8–10:**
8. **Exit test** — founder takes a phone (mobile web) to a real spot, logs a real trip
   through the four verbs, fires a quick mark with no signal that syncs on return, and
   backfills one real past paper-log day, correctly flagged. This is Phase 1's exit
   criterion **and the trigger for Phase 2** (§2) — Xcode/Watch scaffolding starts here,
   not before, and not later without a reason on record (§6, failure mode 7).

**One gap carried over, unresolved:** O9 (moon-phase library) was resolved for JS/TS
(`astronomy-engine`) — fine for the web prototype. The native client will need a
Swift-native equivalent licence-checked before Phase 3; not solved here, flagged so it
isn't discovered mid-sprint.

---

## 5. How salt and bass interleave (updated: bass no longer touches the web prototype)

**Same codebase, same release train, staggered real-world validation.** D18's actual
requirement is architectural: one engine, one schema, divergence in nullability and
vocabulary. It does not require the app to prove itself on both fronts at once, and it
does not require the prototype to prove itself on both fronts either — see §1.

Salt goes first, now through the *web* Phase 1, because the founder can dogfood it —
he's a SoCal saltwater angler (D7) — and because salt is the *easier* UX problem per
R11's own finding. Bass no longer rides the web prototype at all: it waits for Phase 4,
after native salt (Phase 3) is proven, and it is built exactly once, natively. This is a
tighter bass timeline than the previous version of this plan, not a looser one — worth
saying plainly since D18 committed to both products and this plan just pushed bass's
first line of code further out in calendar time (even though it's less duplicated work
overall). See failure mode 2 below, which gets more dangerous, not less, under this
version.

**Shared, unconditionally:** the four verbs, the schema and engine, offline write/sync,
condition-snapshot capture, the Watch app (identical UI regardless of mode — ux-cold-start
§3.5), End Trip flow, needs-details queue mechanics, calendar/notebook/quick-mark.

**Diverges:** vocabulary (species/lure/structure/cover lists), the one optional
post-catch chip sheet on bass only, the one-time water_class prompt on Spot creation,
home-screen conditions card content (no tide line on a lake).

---

## 6. Where this plan fails

**7. The web prototype becomes the product by accident, and D15's whole justification
quietly evaporates.** This is the new, largest risk D21 creates, and it deserves to be
named first. The web app will work. It will be on the founder's phone, in his hand, days
from now. Every week it's the thing he actually uses is a week of gravity pulling toward
"just add search to the web app," "just add photos to the web app," "the Watch can wait,
web is fine for now" — and D15's entire case (wet hands, fish in the other hand, a
browser cannot serve the Watch) never gets un-true, it just stops being acted on. Nobody
will decide this out loud; it will happen by nobody deciding anything.
*Early warning:* any of — (a) Phase 2 (Xcode kickoff) has not started within 3 weeks of
Phase 1's exit test passing with no reason on record; (b) a web feature ships that was
not in D21–D24 (search, sharing, export, photos) while Phase 2 has not started; (c)
anyone — including the founder — refers to the web app as "the app" rather than "the
prototype" in CHANNEL or WORKLOG without a correction. `coo` owns watching for this and
raising it in CHANNEL the day it's first true, not the week after.

**1. Offline sync is under-designed, and now it has to work twice.** The ADR (in
progress, `architect`) must cover a browser write queue *and* stay portable to native —
D21 requires the sync rules to be written once. If the browser-side design bakes in
assumptions (IndexedDB specifics, service-worker lifecycle) that don't survive the trip
to Swift, Phase 2 silently reopens this instead of porting it.
*Early warning:* Phase 1 UI work starts before the ADR merges, or Phase 2 begins without
explicitly checking the ADR still holds.

**2. Bass becomes the afterthought D18 was meant to prevent — worse now, not better.**
Bass no longer has a web slice at all; its first line of code is Phase 4, after native
salt. The founder's expertise and motivation are saltwater; nothing stops "one more web
feature" or "one more salt polish pass" from pushing Phase 4 out indefinitely.
*Early warning:* Phase 4 hasn't started within ~2 weeks of Phase 3's exit test, or starts
but no real lake trip gets logged on it.

**3. The founder becomes a synchronous bottleneck.** Several `-> ceo` threads sat
unanswered same-day earlier this week; D21–D24 closed the loudest ones, but the
bass-current-field question is still open in CHANNEL (moot until Phase 4, not urgent).
*Early warning:* a thread the founder needs to close sits unanswered while it's actually
blocking a phase already underway — not one deferred by this plan.

**4. Scope creep re-inflates V1 one small field at a time — and this time it's sanctioned
from the top, in one large motion instead of many small ones.** D21–D24 already are the
large version of this failure mode arriving all at once; the risk now is the *next* one,
arriving the same way, before Phase 1 even ships.
*Early warning:* a second founder-directed scope addition arrives before Phase 1's exit
test passes.

**5. Watch complexity balloons because it's the feature D15 was justified by, so there's
pressure to gold-plate it rather than ship a rough version — and it's now further away in
time, which raises the temptation to skip it (see failure mode 7).** Background
write-queuing across WatchConnectivity is genuinely fiddly, and simulator testing hides
connectivity bugs that only appear with a phone in a pocket.
*Early warning:* Phase 3 running two weeks with no test on a physical, unheld Watch.

**6. No quality bar exists yet for the Swift codebase.** HOUSE-RULES' definition of
done (`npm run build`/`lint`) is Next.js-specific. If `head-dev` doesn't define and
apply an equivalent before Phase 2 closes, the newer, higher-risk codebase gets a lower
bar than the one nobody's shipping to a store.
*Early warning:* a Swift PR merges with no stated build/test/device-check step.

---

## 7. Stalls closed this session

**Previous session's stalls, status:** uphill/downhill (D10) was answered by the founder
same day and architect built the storage design for it — closed. O6 pricing and the
bundled-dataset question remain correctly deferred (Phase 6, Someday respectively) —
unchanged, not stalled, just not due yet.

**This session:**
- **`Trip.platform` / `Catch.outcome`:** architect flagged these as still awaiting a
  founder yes/no in CHANNEL after this plan's previous version already said "proceed,
  don't wait" — that guidance stands and is repeated here so it isn't asked a third time.
  Both fields are additive and nullable; architect should build them un-gated.
- **Bass current-direction field (dam/creek current, raised by architect for `ceo`):**
  no longer time-sensitive. Bass isn't being built at all until Phase 4 (native), which
  is several phases out. This can wait for that gate instead of needing an answer now —
  moved to Backlog "Next," not "Now."
- **The real new stall this session closes by resequencing, not by asking anyone
  anything:** the web-vs-native scope question the founder's own message could have left
  ambiguous — "does D21 mean bass on web too?" — is answered here as no (§1, §5). Nobody
  needs to ask the founder this; it follows from D18's requirement being architectural,
  not delivery-surface.
