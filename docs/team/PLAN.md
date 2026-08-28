# Plan — Sequencing Two Products (R11)

**Owner:** `coo` · **Date:** 2026-08-28 · **Fills:** R11 (spec), ROADMAP item 3, HANDOFF item 3.
D18 (build salt and bass together) is settled and not reopened here. This plan is how,
not whether.

**One thing said plainly and then dropped:** D18 doubles design surface on a solo
builder before a single line of client code exists. The mitigation isn't parallel effort
on two products — it's proving the shared skeleton once, on the easier-to-validate
product (salt), then reusing it, so bass is additive work, not a second climb.

---

## 1. V1 is overloaded. Cut list.

Auditing the spec's `[V1]` tags against a solo builder shipping native Swift from zero:

**Cut from V1 → V1.1 (same release train, weeks not months later):**
- Compound multi-field search ("big fast tide near a full moon") → ship species + spot +
  date filters first. The query engine is a UI/query-building problem, not a stats
  problem; it can grow after real users show which filters they actually reach for.
- Moon-chart overlay → tide-chart overlay ships; moon overlay is the same pattern done
  twice for less value. Home screen already shows moon (ux-cold-start §2.1).
- Weather station picker UI → auto-pick nearest NWS station, no browser. Add picker
  only if backfill accuracy complaints show up.

**Correctly scoped, don't cut:** offline-first write, four-verb logging, Watch app,
blank-trip/bad-conditions capture, silent auto-capture, saved spots, favorite lures,
per-location view, needs-details queue, both ontologies.

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

## 2. Phases, named, with exit criteria

**Phase 0 — Foundations** (owner: `architect`, `head-dev`)
Repo/project structure decided (where iOS/Watch code lives relative to this repo).
V1 schema migrated to Supabase (core tables + reference tables seeded from the ontology
draft, minus the `private` custom-field schema — see §1). Xcode project exists, builds,
runs on simulator, auth wired.
*Exit: a `npm`-equivalent for Swift — a documented build/lint/test command — passes on a
clean checkout, and a stub screen reads a row from Supabase.*

**Phase 1 — Salt vertical slice** (owner: `head-dev`, `ux-ui`, `biostat`)
The four verbs (Start Fishing / Log a Catch / Conditions Suck / End Trip), offline
write with sync, silent auto-capture of tide/moon/pressure, End Trip zero-catch prompt.
iPhone only. No Watch, no search, no bass, no paywall.
*Exit: the founder logs one real trip at a real SoCal spot, including one write made in
airplane mode that syncs correctly when signal returns.* This is the first real thing
running — the two-week target in §4.

**Phase 2 — Bass vertical slice** (owner: `ux-ui`, `head-dev`)
`water_class` picker on new Spot (once, per ux-cold-start §3.1). Bass logging reuses the
same four verbs unchanged; adds the optional post-catch chip sheet (water colour,
structure, depth). This is the actual test of D18/R11 — does the shared engine hold.
*Exit: a real lake trip logged end-to-end on the same build that logged the salt trip in
Phase 1, no salt-specific code path touched.*

**Phase 3 — Apple Watch** (owner: `head-dev`)
Three-button Watch UI, WatchConnectivity, and — the real engineering risk here —
write queuing when the phone is unreachable (pocketed, asleep, out of Bluetooth range).
*Exit: a catch logged from a physical Watch with the phone in a pocket, not held, not on
the simulator.*

**Phase 4 — Seeing patterns** (owner: `ux-ui`, `head-dev`)
Catch history overlaid on the tide chart, basic filters (species/spot/date), per-location
view, needs-details queue.
*Exit: the founder can answer "what did I catch at this spot" from the app instead of
memory, for both a salt and a bass spot.*

**Phase 5 — V1 GA prep** (owner: `head-dev`, `counsel`, `ceo`)
D14 means V1 has nothing to bill — no paywall work needed. What's left: privacy policy
(counsel), crash reporting, TestFlight with external beta anglers (not just the
founder), App Store listing.
*Exit: both salt and bass flows have been used by a real external angler who is not the
founder, with no data-loss bug found in a week of use.*

**Everything else** (bite score, alerts, condition matching, pooled/custom-field stats,
photos, billing, Android) is V2+ and does not get scheduled here.

---

## 3. The critical path, corrected

The roadmap's framing — "uphill/downhill blocks the ontology, which blocks the schema,
which blocks most client work" — overstates the blast radius. Checked against the
ontology doc: `current_direction` is **one nullable, salt-only, user-entered column**.
Nothing else depends on it. The real chain:

```
repo/project structure (architect, day 1)
        │
        ▼
Xcode project + Supabase schema migration ── PARALLEL ── tide ingestion pipeline
        │                                                  (biostat + head-dev;
        ▼                                                   feeds condition_snapshot,
offline sync design (architect — nobody has                 not required for Phase 1
   designed this yet; see §6 failure modes)                 exit since enrichment_status
        │                                                   = pending is a designed state)
        ▼
Phase 1 salt vertical slice ──► Phase 2 bass vertical slice ──► Phase 3 Watch ──► Phase 4
```

**Genuinely blocking, needs the founder, small and fast to close:**
- uphill/downhill (D10) — blocks only `current_direction`. Ship the schema and Phase 1
  without this field rendered in the UI; add it once answered. Does not block Phase 1
  exit.
- Species/lure/bait/structure red-pen — improves the reference-table seed data, doesn't
  block anything, because these are DB rows, not enums — editable without a redeploy.
  Ship the researched draft now.

**Not on the critical path at all, despite feeling urgent in the docs:**
P6 ratification, O6 pricing, `platform`/`Catch.outcome` yes/no (both additive, nullable,
reversible — proceed on architect's design, don't wait), bundled lake/coastline dataset
research.

**Genuinely under-designed and actually risky, and nobody has flagged it as blocking:**
Offline sync (local store choice, conflict policy). D3 calls it a hard requirement and
Phase 1's exit criterion requires testing it, but no ADR exists yet. This is a bigger
risk to the two-week target than any founder question. See §6.

---

## 4. First two weeks

Two-week target is Phase 0 fully done, Phase 1 in progress toward its exit test. Ordered
by dependency, not calendar days — sessions can compress if a role is available.

**Immediately (today):**
1. `coo` (this session) — close the stalled `-> ceo` threads in CHANNEL: ask
   uphill/downhill as a fast multiple-choice, bless `platform`/`Catch.outcome` as
   proceed-don't-wait, defer O6 and P6 to later gates. See CHANNEL entry appended below.
2. `architect` — decide iOS/Watch project location (separate repo vs. subfolder of this
   one) and write it down. Everything in Phase 0 depends on this existing.

**Days 1–3:**
3. `architect` — write and apply the V1 schema migration: `angler`, `spot`, `trip`,
   `catch`, `condition_snapshot`, reference tables (species/lure_class/bait_type/
   structure_type/cover_type, both `water_class` scopes), RLS. Seed reference tables
   from the ontology draft's `?`-flagged lists — don't wait on the founder red-pen.
   Skip the `private` custom-field schema (§1).
4. `head-dev` — stand up the Xcode project (iOS + Watch targets), wire the Supabase
   Swift client, get a build running on simulator, basic auth screen, CI equivalent of
   `npm run build`/`lint` for Swift.
5. `biostat` + `head-dev` (parallel with 3–4) — tide ingestion: pull NOAA 6-minute
   predictions for station 9410580, difference for `tide_rate_m_per_hr`, land in a
   cached table. Does not block Phase 1's first write (enrichment can be `pending`).

**Days 4–7:**
6. `architect` — write the offline sync design (local store, write queue, conflict
   policy, what "synced" means in the UI) before this gets built ad hoc inside the
   logging screen. This has no owner today; it needs one now.
7. `head-dev` + `ux-ui` — build the four-verb screen from `ux-cold-start.md` §1, wired
   to Supabase, offline write via the design from item 6.

**Days 8–10:**
8. `head-dev` — wire silent auto-capture: tide fields from the cache table, moon phase,
   pressure (phone barometer), NWS weather at log time.
9. `head-dev` + `ux-ui` — End Trip zero-catch prompt (D16/O11) and the local
   retroactive check-in notification (ux-cold-start §1.5).
10. **Exit test** — founder takes the phone to a real spot, logs a real trip, kills
    connectivity partway through, confirms sync on return. This is Phase 1's exit
    criterion. Immediately after: start Phase 2 (bass Spot picker + logging reuse) —
    the whole point is that it should be small, because Phase 1 proved the skeleton.

**One gap flagged for whoever picks up item 8:** O9 (moon-phase library) was resolved
for a JS/TS choice (`astronomy-engine`). The client is Swift. Someone — `counsel` +
`head-dev` — needs to verify a Swift-native equivalent's licence before item 8, or
budget porting the calculation. Not solved here; flagged so it isn't discovered mid-sprint.

---

## 5. How salt and bass interleave (answering the question directly)

**Same codebase, same release train, staggered real-world validation — not a same-day
simultaneous ship, and not a separate later phase either.** D18's actual requirement is
architectural: one engine, one schema, divergence in nullability and vocabulary. It does
not require the app to prove itself on both fronts at once.

Salt goes first through Phase 1 because the founder can dogfood it — he's a SoCal
saltwater angler (D7) — and because salt is the *easier* UX problem per R11's own
finding (rich auto-capture masks logging-flow bugs less than bass's thin auto-capture
does). Salt is the forcing function that proves the shared four-verb skeleton, the
offline write, and the schema actually work end to end with a real trip. Bass then rides
those same rails in Phase 2, typically 1–2 weeks behind, adding vocabulary and one
optional sheet — not rebuilding logging.

**Shared, unconditionally:** the four verbs, the schema and engine, offline write/sync,
condition-snapshot capture, the Watch app (identical UI regardless of mode — ux-cold-start
§3.5), End Trip flow, needs-details queue mechanics.

**Diverges:** vocabulary (species/lure/structure/cover lists), the one optional
post-catch chip sheet on bass only, the one-time water_class prompt on Spot creation,
home-screen conditions card content (no tide line on a lake).

If this schedule slips, the failure mode to watch for is bass *never* getting its Phase 2
slot because salt's Phase 4 (search/filters) feels more urgent once salt has real users —
see failure mode 2 below. Phase 2 is scheduled immediately after Phase 1's exit test for
exactly this reason: bass's window is right after the skeleton is proven, before salt's
own backlog of polish absorbs all available attention.

---

## 6. Where this plan fails

**1. Offline sync is under-designed and it's invisible until it breaks in the field.**
D3 calls it a hard requirement; nobody has written the design yet (see §3). This is the
single riskiest unbuilt piece precisely because a demo on Wi-Fi will look fine.
*Early warning:* Phase 1 starts UI work before item 6 (§4) produces a written design.

**2. Bass becomes the afterthought D18 was meant to prevent, just one layer down.**
The founder's expertise and motivation are saltwater; nothing stops "one more salt
feature" from eating Phase 2's slot indefinitely.
*Early warning:* Phase 2 hasn't started within ~2 weeks of Phase 1's exit test, or starts
but no real lake trip gets logged on it.

**3. The founder becomes a synchronous bottleneck.** Four `-> ceo` threads in CHANNEL
already sat unanswered same-day before this session (uphill/downhill, `platform`/
`outcome`, O6 pricing, bundled-dataset feasibility). A solo founder running the business
cannot also be a fast synchronous API for a team of agents.
*Early warning:* this has already happened once (today); watch whether it recurs after
this session's escalation.

**4. Scope creep re-inflates V1 one small field at a time.** Individually cheap
additions (a chip here, a field there) compound; each is defensible alone.
*Early warning:* Phase 1's exit test slips past ~3 weeks with no real trip logged.

**5. Watch complexity balloons because it's the feature D15 was justified by, so there's
pressure to gold-plate it rather than ship a rough version.** Background write-queuing
across WatchConnectivity is genuinely fiddly, and simulator testing hides connectivity
bugs that only appear with a phone in a pocket.
*Early warning:* Phase 3 running two weeks with no test on a physical, unheld Watch.

**6. No quality bar exists yet for the Swift codebase.** HOUSE-RULES' definition of
done (`npm run build`/`lint`) is Next.js-specific. If `head-dev` doesn't define and
apply an equivalent before Phase 0 closes, the newer, higher-risk codebase gets a lower
bar than the one nobody's shipping to a store.
*Early warning:* a Swift PR merges with no stated build/test/device-check step.

---

## 7. Stalls closed this session

Four `-> ceo` threads sat unanswered in CHANNEL as of this session. Per §1 and §3, none
of them block Phase 0/1 except the first, and that one only blocks a single field:

- **uphill/downhill (D10):** still needs the founder, one sentence, asked as fast
  multiple-choice in CHANNEL below. Not blocking schema or Phase 1.
- **`platform` / `Catch.outcome` fields:** proceeding on architect's design — both
  nullable and additive, cheaper to have and not use than to retrofit.
- **O6 pricing ratification:** deferred to before Phase 5 (nothing paid exists before
  then per D14).
- **Bundled lake/coastline auto-detect dataset:** deferred to Someday; not required,
  the one-time manual prompt (ux-cold-start §3.1) is sufficient for V1.
