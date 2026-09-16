# Fish Legal — agency integration and regulatory authority

**Status:** Proposed — extends a shipped feature; the data-supply problem is the real work
**Date:** 2026-09-15
**Governs:** regulation packs, freshness, agency authorship, catch regulation snapshots, boundary alerts, bag tracking
**Extends:** `docs/specs/fish-legal-expansion.md`, `docs/specs/regulations-architecture.md`, `docs/specs/regulations-data-model.md`
**Audit:** `00-repository-audit.md` §3.3
**Phase:** 1 (freshness, bag tracking, honesty) → 4 (agency authorship)

---

## 1. Problem statement

Fish Legal is the most complete feature in the product and the brief under-describes it.
There are ~50 region packs shipped as TypeScript, `reg_pack` / `reg_area` / `reg_group` /
`reg_rule` tables with their own RLS, a verdict engine with a citation-or-nothing stance, a
rockfish identification wizard, boundary alerts with a fold-across-bundle state machine,
offline storage, and `regulation-snapshot.ts` writing the applicable rule onto **every
catch** with pack version and evaluated date.

The brief's asks — region awareness, versioned snapshots, source links, offline, boundary
alerts, "clear labelling when a dataset only covers California" — are, with one exception,
already met.

The exception, and the real problem, is **provenance of the regulations themselves.** Every
pack in the repository is second-hand: carefully researched, well cited, honestly dated,
and written by us. A state agency will not accept a compliance product built on somebody
else's reading of their own rules, and an angler holding a fish should not either. The
existing code knows this — the SoCal spec's whole stance is "citation or nothing" — but
knowing it is not the same as having an agency-authored feed.

Three concrete gaps:

1. **No freshness SLA.** `source_verified_at` exists per rule; nothing measures staleness,
   nothing degrades a stale verdict, nothing tells the angler the pack has not been checked
   since March.
2. **No agency authorship or review path.** No way for CDFW to say "this is ours".
3. **No bag-limit tracking against actual catches.** The limits are displayed; the fish in
   the box are not counted against them, even though every catch already carries species,
   date and disposition.

---

## 2. Users and stakeholders

Angler holding a fish and deciding in 15 seconds; enforcement officer at a ramp (never a
user of this app, but the person whose verdict actually counts); CDFW and equivalent
agencies; `counsel` (liability for a wrong or stale rule); tournament directors (whose
rules sit *on top* of law); the researcher consuming regulation snapshots as context.

---

## 3. Product goals

1. **Preserve exactly what works.** Active region display, orange emphasis on the active
   region and Change Region control, plain English first, citation behind it, offline,
   snapshot-on-catch, "we don't know" as a first-class answer.
2. Make staleness visible and consequential.
3. Make bag and possession limits count real fish.
4. Create a path by which an agency can author, review or endorse a pack.
5. Never claim to be the law, an officer, or legal advice — on any screen, in any state.

---

## 4. Non-goals

- Replacing the regulation engine. It works.
- Auto-scraping agency websites into packs. A parsed PDF that is wrong in one cell is worse
  than no pack, and it also breaks the citation stance.
- Enforcement. The product never reports an angler to anybody. Ever. This is a hard
  product boundary, and `government-fisheries-partnership.md` §4 repeats it.
- Merging tournament rules into Fish Legal. The three-layer separation is load-bearing
  (§6.1).

---

## 5. User stories

1. As an angler with a fish in my hand, I see **KEEP / RELEASE / CHECK** in one line, the
   size and limit under it, and the citation one tap away — as today.
2. As an angler, a pack whose sources have not been re-verified in 120 days shows *"Last
   checked 12 June — rules may have changed"* on the card, not buried.
3. As an angler, my third rockfish today shows *"3 of 5 in your daily bag"*, counted from
   my own logged catches, and I can correct it.
4. As an angler outside a covered region, I see *"No verified rules for this area"* — never
   a neighbouring state's numbers.
5. As an angler crossing into an RCA, the boundary alert fires once, says what changed, and
   does not fire again for the same crossing.
6. As `counsel`, every verdict the app has ever rendered is reconstructible from the stored
   pack version and rule id.
7. As a CDFW regulations officer, I can review a pack and mark it *Agency reviewed*, and
   anglers see that badge with the reviewer and date.
8. As a tournament director, my rules are clearly a separate layer, and a fish that is
   legal but non-qualifying reads as exactly that.

---

## 6. Complete workflow

### 6.1 The three layers, kept separate (preserve)

```text
1  FISH LEGAL     is this fish legal to take, here, today?        -> law
2  TOURNAMENT     does this legal fish score in this event?       -> contract
3  VERIFICATION   is the evidence for this claim sufficient?      -> evidence
```

**Rule L1.** A tournament rule can only ever be *more* restrictive than law. The UI states
both verdicts separately and never merges them into one badge. A fish that is legal and
non-qualifying says so in two lines.

**Rule L2.** Fish Legal never blocks logging. A fish that was caught was caught; the log
records reality, not permission. The verdict is advisory on the catch and stored as a
snapshot.

### 6.2 Freshness

Each `reg_rule` already carries `source_verified_at`. Add a per-pack freshness policy:

| Age since oldest `source_verified_at` in the pack | State | Presentation |
|---|---|---|
| ≤ 60 days | `current` | normal |
| 61–120 days | `aging` | quiet line: *"Last checked 12 June."* |
| 121–365 days | `stale` | prominent amber line on the card **and** on the verdict: *"These rules have not been checked since June. Confirm with {agency}."* with a deep link |
| > 365 days | `expired` | verdict downgraded to **CHECK**; numbers still shown, but as *"what we last recorded"*, never as a current limit |

**Rule L3.** Staleness downgrades a verdict; it never fabricates one. An expired pack
showing "LEGAL" is the single worst failure mode this feature has.

The snapshot written onto a catch records the freshness state **at catch time**, so a 2026
catch keeps the knowledge quality it was logged with.

### 6.3 Bag and possession tracking

Everything needed already exists: `catch.species_id`, `catch.disposition`,
`catch.local_date`, `regulation_snapshot.bag_daily` / `possession_limit`.

```text
count = catches where species in rule group
        and disposition = 'kept'
        and local_date = today (local, not UTC — D23)
        and resolution_state = 'confirmed'
```

Displayed on the species card and on the limit banner (`limit-banner.tsx` exists). Rules:

- Counts are **from the angler's own log only**. No inference, no crew aggregation
  (a boat limit needs a crew model that does not exist — §13).
- The angler can correct the count; a correction writes a `catch_amendment`, it does not
  edit a counter.
- Unresolved marks (D22) are **not** counted, and the banner says *"2 kept, 1 unresolved"*
  rather than silently choosing.
- Possession limits span days and require a "still in possession" concept the schema does
  not have. **Phase 1 tracks daily bag only**, and the possession limit is displayed as a
  number without a count. Claiming a possession count we cannot compute would be a false
  compliance claim.

### 6.4 Agency authorship ladder

```text
LEVEL 0  Researched by Fish Log Book, cited            <- every pack today
LEVEL 1  Agency-reviewed: a named officer checked it
LEVEL 2  Agency-authored: the agency supplies the data
LEVEL 3  Agency-integrated: machine feed with an SLA
```

Each level is a column on `reg_pack` plus a visible badge. **Level 0 is not a failure
state** and must not be presented as one — it is the honest description of a well-researched
pack, and the citation is the evidence. But an agency partnership's first deliverable is
Level 1 for one pack, not a dashboard.

### 6.5 Boundary and zone alerts (preserve, extend)

Existing: `boundary-alerts.ts`, `boundary-coverage.ts`, `geospatial.ts`
(point-in-ring, distance-to-line, side-of-line), the RCA 50-fm polyline, WA subareas, CA
GMAs, and a ribbon that says the consequence out loud.

Extend with: MPA layers where an agency publishes them, depth-based restriction warnings
using `bottom_depth_m` when the angler has entered it, and a *"you are within 500 m of a
boundary"* proximity state — because the existing binary inside/outside is the wrong shape
near a line drawn by coordinates in federal law.

**Rule L4.** A simplified polyline is always labelled as simplified, with the agency's own
interactive map linked. The existing boundary map already does this and it is the correct
precedent.

---

## 7. Screen and component requirements

Preserve, unchanged: the Fish Legal home with the active-region chip in **signal-orange**
and the Change Region control; the species browser; the species rules page; the rockfish
wizard; the offline page; the limits page; the boundary map with its plain-English ribbon.

Additions:

- **Freshness line** on `regulation-card.tsx` and on the verdict, using the §6.2 states.
  Amber (`amber-flag` token) for `stale`, and text, never colour alone.
- **Bag counter** on `limit-banner.tsx`: `3 of 5 kept today` with the unresolved caveat.
- **Authorship badge** beside the jurisdiction chip: *Researched · cited* / *Agency
  reviewed* / *Agency data*, each linking to what the level means.
- **Coverage honesty** on the region picker: a region with no pack says so *in the picker*,
  before the angler navigates. The brief's "clear labelling when a dataset only covers
  California" generalises to: a region shows what it has, and shows what it lacks.
- **Disclaimer**, on every verdict surface, one line, never a modal, never dismissible:
  *"Guidance, not the law. Check {agency} before you keep a fish."* `legal-notice.tsx`
  already exists for this.

---

## 8. Data requirements

```sql
alter table reg_pack
  add column authorship_level integer not null default 0
      check (authorship_level between 0 and 3),
  add column agency_org_id uuid references government_organization(id),
  add column reviewed_by_name text,
  add column reviewed_at date,
  add column freshness_policy_days integer not null default 60,
  add column supersedes_pack_id text,
  add column effective_from date,
  add column effective_to date;

alter table reg_rule
  add column confidence text not null default 'verified'
      check (confidence in ('verified','inferred','unknown'));
```

`regulation_snapshot` (the jsonb already written on every catch) gains:
`freshness_state`, `authorship_level`, `rule_ids[]`, `source_verified_at_oldest`. Existing
fields are unchanged — a snapshot format change must be additive, because historic catches
carry the old shape and rewriting them would falsify the record.

**Rule L5.** The regulation snapshot on a catch is immutable
(`data-architecture-expansion.md` §11). A rule correction writes a new pack version;
historic catches keep what was known.

---

## 9. API and service requirements

- Pack distribution stays as today: compiled packs shipped with the client, plus server
  tables. Offline is non-negotiable (`SPEC.md` D3).
- Add a pack **manifest** endpoint returning `(pack_id, version, freshness_state,
  authorship_level, effective_from)` so a client can tell it is stale without downloading.
- Pack updates are versioned bundles, downloaded opportunistically, applied atomically.
  A partially applied pack is a wrong verdict.
- `/api/v1/regulations/verdict` for agency and partner integrations (Phase 4). Read-only,
  returns the verdict **plus** the full provenance block; a consumer that cannot see the
  provenance must not get the verdict.
- The engine stays pure in `src/features/fish-legal/reg-engine.ts`. No server round trip in
  the angler path.

---

## 10. Offline behaviour

Already correct and must stay: packs are local, the engine is pure, verdicts render with no
network, the offline page exists.

Additions:
- Freshness is computed from the **pack's own dates and the device clock**, so it works
  offline. A device with a badly wrong clock is an edge case (§13), not a reason to require
  the network.
- Bag counts come from the local catch store, so they work offline — which is precisely
  when they are needed.
- A pack update that cannot download leaves the previous pack in place with its freshness
  state, and says so.

---

## 11. Privacy and security requirements

- Regulation lookups are local; no query leaves the device saying what species an angler is
  holding. **Do not add server-side verdict logging for anglers.** It would create a
  record of intent to retain, which is a record we must never hold.
- The Phase-4 agency API serves verdicts, never angler-linked queries.
- Bag counts read the local store only.
- Region preference is a local setting and is not a location disclosure.
- Pack bundles are signed or checksummed; a tampered pack producing a "LEGAL" verdict is
  the highest-severity integrity risk in the product.

---

## 12. Accessibility requirements

- The verdict is a word, always: KEEP / RELEASE / CHECK. Colour is reinforcement
  (`01-foundations.md` §1.3).
- Freshness and authorship are text; the amber state is announced, not just coloured.
- Bag counter is `aria-live="polite"` and reads *"3 of 5 kept today"*.
- The boundary map has a text alternative: the same verdict and distance in words
  ("Inside the open area. 1.2 km from the 50-fathom line."), because the map is unusable to
  a screen reader and the answer must not be.
- The disclaimer is in the accessible name path of the verdict region, not a visually
  adjacent sibling a screen reader may skip.
- Long species names must not truncate the verdict. Tested at 320 px with
  "California scorpionfish (sculpin)".

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Species not in the pack | *"No verified rule for this species here."* Never a neighbouring rule. |
| Angler crosses a state line mid-trip | Region is a preference, not a GPS inference. Prompt to change; never switch silently. A silent switch would change a verdict without the angler asking. |
| Catch at the boundary of two GMAs | Show both with distance to the line; the app does not pick. |
| Rule changes mid-day (an emergency closure) | Pack update applies from download; the snapshot on an earlier catch keeps the earlier rule. Both are correct. |
| Device clock wrong by a year | Freshness would read `expired`. Correct failure direction — degrade, never upgrade. |
| Unresolved marks and the bag count | Counted separately and named (§6.3). |
| Boat limit vs personal limit | Not supported. Say so: *"This counts your fish only."* Inventing a boat limit without a crew model would be a compliance claim we cannot back. |
| Two anglers on one account | Same answer; the count is per account and the copy says so. |
| Tournament rule stricter than law | Both shown, separately (Rule L1). |
| Pack covers only part of a region | Coverage map + explicit uncovered statement, following the existing `boundary-coverage.ts` precedent. |

---

## 14. Failure states

- Pack download fails → keep the previous pack, show freshness, never fall back to an
  adjacent region.
- Pack corrupt / checksum fails → refuse to load it, keep the previous, alert.
- Species id missing from the taxonomy → verdict `unknown`, logged for curation.
- Boundary geometry unavailable → the boundary layer says "unavailable"; the verdict does
  not silently ignore a depth or area restriction. It escalates to CHECK.
- Clock unavailable → CHECK, with *"Cannot determine today's date."*

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Packs in `current` freshness | > 80 % at all times |
| Packs `expired` | 0 — an expired pack is an operational failure |
| Verdicts rendered with no verified rule (the honest "we don't know") | Reported, not minimised |
| Median time from opening Fish Legal to a verdict | < 8 s |
| Anglers using the bag counter who correct it | Reported — a high rate means the count is wrong, not that users are fussy |
| Agency-reviewed packs | 1 by end of the pilot. Not 50. |
| Incidents of a wrong verdict reported by users | Tracked as severity-1 with a root-cause note in the pack's history |

---

## 16. Acceptance criteria

1. Freshness states compute purely from pack dates, are vector-tested, and an `expired`
   pack downgrades every verdict to CHECK (Rule L3), proven by a test.
2. The regulation snapshot on a catch remains immutable and additive; a test asserts old
   snapshot shapes still parse.
3. Bag counts exclude unresolved marks and name them separately, proven by a test.
4. A region with no pack never renders another region's numbers, proven by a test across
   all ~50 regions (the existing parity tests are the pattern).
5. The disclaimer is present on every verdict surface, proven by a coverage test in the
   style of `chrome-coverage.test.ts`.
6. Every verdict path works with the network disabled.
7. Pack bundles are checksummed and a tampered bundle is refused.
8. At 320 px, the verdict, freshness line, bag counter and disclaimer all render without
   overflow for the longest species name in the taxonomy.
9. `npm run verify` passes.

---

## 17. Dependencies

- `counsel`: the disclaimer wording, the liability position on a stale verdict, and whether
  an authorship badge creates an implied warranty.
- Agency relationship (`government-fisheries-partnership.md`) for levels 1–3.
- `species_taxon` (`data-architecture-expansion.md` §7.2) for reliable species matching
  across synonyms.
- `government_organization` table for `agency_org_id`.
- Existing: everything in `src/features/fish-legal/`. This spec adds; it does not rewrite.

---

## 18. Risks and unanswered questions

1. **Liability is the whole feature's shadow.** `ROADMAP.md` E1 already flagged that
   publishing regulations carries liability if wrong or stale. Freshness downgrade (Rule
   L3) is the main mitigation; `counsel` must confirm it is enough, and must rule on
   whether an "Agency reviewed" badge increases exposure rather than reducing it.
2. **~50 packs is ~50 maintenance commitments.** Nothing currently funds re-verification.
   A pack nobody re-checks becomes `expired` and useless within a year. *Open: is the
   honest move to shrink coverage to the regions we can actually maintain?* This spec's
   position: **yes**, and expired packs should be visibly retired rather than quietly rot.
3. **Agency authorship may never happen.** Agencies have no obligation and no budget to
   author data for a private app. Level 1 (a named officer reviewed it) is far more
   achievable than Level 3 and should be the pilot's target.
4. **Possession limits are not computable** without a possession model. Stated, not
   promised.
5. **Boat limits are not computable** without a crew model. Same.
6. *Open:* should Fish Legal warn *before* a fish is kept (a pre-retention check) rather
   than after logging? It is the more useful moment and the more dangerous one — a wrong
   pre-retention "yes" is the failure mode with an actual citation attached.
