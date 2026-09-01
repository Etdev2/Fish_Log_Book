# Fish Logbook — September 1 Beginning-of-Month AI Staff Meeting

**Date:** 2026-09-01 · **Facilitator:** `coo` · **Attending:** the thirteen roles in
`docs/team/README.md` · **Record type:** permanent, reviewable

**Ground rule for this record:** every claim below is checked against the repository at
commit `0da2add` plus open PR #14. Where something is unverified, it says so. Nobody in
this meeting invented a problem to look useful, and nobody agreed with the facilitator to
be agreeable.

---

## 1. COO — Opening: where we actually are

### What we have built

Three real surfaces, all phone-first, all built against a design system that is now cheap
to build against:

- **Tide screen** (`/tides`) — a single-screen instrument: scrubbing timeline, honest
  provenance markers, four detail sheets, sun/moon overlays. Real NOAA numbers, four
  rounds of design and one production-readiness pass.
- **Tackle Box** (`/tackle`, `/tackle/[category]`) — 13 gear categories with
  category-specific fields, quantities, low-stock flags, search, per-category pages.
- **Fish Log** (`/log`) — local-first catch logging on IndexedDB. Basic catch 225 ms,
  repeat 47 ms, quick mark 46 ms, 83 ms with the network off, measured at 10,000 catches.
- **Underneath:** six Supabase migrations verified against a real PostgreSQL 16 including
  RLS, six ADRs, a normative sync protocol, a token/tripwire system, 281 tests.

That is a genuinely strong six days of work and the docs are better than most funded
teams manage.

### What is not built

- **`/` — the calendar.** D23 says the calendar *is* the history surface. The first tab of
  the primary nav renders a paragraph saying the month grid lands next.
- **`/day/[date]`, `/trip/[id]`, `/spots`, `/spots/[id]`, `/catch/[id]`** — all stubs.
- **The outbox flusher.** The envelope, retry schedule and conflict rules exist and are
  tested. The code that pushes a row to a server does not. Nothing this product has ever
  recorded has left the device it was recorded on.
- **Live tide data.** The chart reads a cached fixture whose window ends **2026-09-04**.
- **Weather, pressure, live enrichment.** Not captured.
- **Day journal (D23), backfill (D24), trip start/end, spot picking, auth wired to the
  log** (`LOCAL_ANGLER_ID` is hard-coded).

### The thing I have to say first, because PLAN.md told me to say it the day it became true

`PLAN.md` §6 named two failure modes with explicit early warnings. Both tripped this week.

- **Failure mode 7(b)** — *"a web feature ships that was not in D21–D24 while Phase 2 has
  not started."* The Tackle Box shipped. It is founder-directed, not agent-invented, and
  it is good work — but it is not in D21–D25 and Phase 2 has not started.
- **Failure mode 4** — *"a second founder-directed scope addition arrives before Phase 1's
  exit test passes."* Tackle Box, then the Tackle Box revision, then the Fish Log spec.

`PLAN.md` says `coo` raises this the day it is first true, not the week after. This is not
a complaint about the owner's priorities — scope is the owner's call. It is the tripwire
firing exactly as designed, and the owner should now decide consciously what it means.

### The honest summary

**We have three polished tools and not yet a logbook.** Every record the product has ever
created lives in one browser's local storage, on one device, and can be destroyed by
clearing site data. The screen that is supposed to be the spine of the product is a
placeholder. Phase 1's exit test — *log a real trip, fire a quick mark with no signal that
syncs on return, backfill a paper-log day* — **cannot pass today**, and not because of one
missing piece: the sync, the calendar, the journal and the backfill are all absent.

### What I am putting at the top of the month

Three, because the backlog rule is three:

1. **Make data real** — provision Supabase, wire auth to the log, write the flusher.
2. **Build the spine** — calendar → day page → trip → journal → backfill.
3. **Make the tide screen survive Friday** — live NOAA fetch before the fixture expires.

Everything else waits. Reports, please.

---

## 2. Individual reports

### `ceo` — scope and direction

**Status.** Holding scope. No new decisions ratified since D27.

**Assessment.** The engineering is ahead of the product thesis. Look at what a stranger
would see opening this app today: a tide viewer, a tackle inventory, and a list of fish.
All three exist in competing apps. **The one thing nobody else does — recording the trips
where you caught nothing, and attaching conditions to the moment — is the part that is
still unbuilt.** We are six days in and we have built the commodity half.

**Concern.** I want to be precise, because this is easy to hear as criticism of good work
and it is not. The tide screen is excellent. But `SPEC.md` §6 explicitly says *"we need
tide data, not a competing tide viewer,"* and we have now spent four design rounds on the
viewer while the denominator — effort, blank trips — has no UI at all. That is the exact
drift Part 3 of the roadmap was written to prevent, arriving through the front door
instead of the back.

**Recommendation.** Freeze new surfaces until the calendar and sync land. Not because the
ideas are bad — because a fourth good screen makes the product less coherent, not more,
while the first three cannot keep a record overnight.

**New idea.** `README.md` is one line. Before the marketing team arrives, the repo should
contain one owner-ratified sentence saying what this is. My draft, for the owner to
accept, edit, or reject: *"A fishing logbook that remembers the conditions for you —
including the days you caught nothing — so your own history tells you when to go."*
Positioning written after the marketers arrive is positioning written by marketers.

---

### `architect` — structure

**Status.** ADRs 001–006 plus the normative sync protocol are merged and holding. The
seams have already paid: `queries/tide-series.ts` is a single swap point for live NOAA,
and `features/tackle/session-store.ts` is a single swap point for real persistence.

**Assessment.** The structure is in better shape than the product. ADR 003's tripwires and
ADR 006's tide seam did their jobs. I have no architectural regrets to report, which is
not something I expected to say this month.

**Concerns — three, in order of severity.**

1. **`readBackupState()` returns `{ kind: "settled" }` unconditionally, and
   `describeBackupState` renders that as a green dot and the words "Backed up."** Every
   screen in the app tells the angler their data is backed up. No row has ever reached a
   server. ADR 004 §6 fixed that vocabulary deliberately — "Saved" means the outbox,
   "Backed up" means the server — and the implementation says the wrong one of the two.
   This is the most serious defect in the repository, and it is four lines to fix.
2. **Two persistence models in one app.** The Fish Log writes through `commit` to
   IndexedDB per ADR 004 §1. The Tackle Box writes to a module-level session store that
   dies on refresh. It is honestly labelled, and it was the right call at prototype speed.
   But three rounds of UI have now been built on top of it, and every round makes the swap
   more expensive.
3. **`LOCAL_ANGLER_ID`.** RLS is written and verified against real Postgres, but no client
   has ever presented a real JWT. RLS that has never been exercised by a real session is a
   claim, not a control.

**Recommendation.** The flusher is mine to specify and `head-dev`'s to write, and it needs
a live Supabase project before a line of it can be written honestly. That provisioning is
the single highest-leverage unblock available this week.

**New idea.** When the flusher lands, honour the trap already written into ADR 004 §5 —
rows committed in one transaction share a timestamp, so an `updated_at` cursor that uses
`>` silently drops rows. It is documented. It will still be got wrong if nobody says it
out loud at implementation time. Consider it said.

---

### `head-dev` — implementation

**Status.** Fish Log MVP landed 2026-09-01 (`catch_gear` migration, local-first write path,
quick mark wired). PR #14 open, `mergeable_state: clean`, awaiting the owner's call on one
question inside it.

**Assessment.** Build quality is good and measured rather than asserted. Two real bugs
were caught by measuring instead of reading — a four-second GPS await at save time, and a
`RepeatSeed`/`CatchDraft` shape mismatch that type-checked and silently dropped every
field. Both are the kind that only show up in a browser.

**Concerns.**

1. **There is no test CI.** `.github/workflows/` does not exist. Vercel does build and
   deploy a preview on every PR, so a broken build or a type error is caught — credit
   where it is due. What never runs is `npm run verify`: lint, tokens, tripwires and all
   281 tests execute only when somebody remembers. A stated definition of done that is
   half-automated is a definition of hope for the other half, and we are about to add a
   Swift codebase that will inherit that same absence (`PLAN.md` §6.6 predicted this).
2. **The tide fixture window ends 2026-09-04.** In three days the flagship screen has no
   data. It fails honestly — the empty state exists — but it fails.
3. **I cannot write the flusher.** It cannot be written honestly without a live backend to
   round-trip against, and a sync layer that has never synced is worse than none because it
   looks finished. I am blocked on provisioning, and I will not fake my way past it.

**Recommendation.** In this order: CI workflow (half a day, and `test-agent` can own it) →
Supabase project provisioned → flusher → calendar. CI first because everything after it is
integration work, which is exactly the class of change a unit suite catches late.

**New idea.** A committed seed dataset — one realistic angler, a season of trips and
blanks — so the calendar, the history views and eventually the correlations can be built
and demoed against something that looks like a real year instead of a fixture. It also
gives the marketing team screenshots that are not empty states.

---

### `ux-ui` — screens

**Status.** Tide instrument, Tackle Box (three rounds), quick-mark relocation in PR #14.

**Assessment.** The design system is the quiet win of the month. Tokens, the touch floor,
the two alignment lines, one chip spec — building a new screen is now measurably cheaper
than building the first one was. The tide screen's readout height is pinned at 184.5px
across 67 scrub positions and three phone sizes, measured rather than eyeballed.

**Concerns — and the first one is about my own work.**

1. **The Tackle Box got three polish rounds while its data evaporates on refresh.** Icons,
   chip specs, equal-height cards, "1 items" grammar. All correct, all measured, and all
   spent on a screen that cannot remember anything. That is my judgment to answer for as
   much as anyone's. Polish belongs after persistence, not before it.
2. **Nothing has been held in a hand.** Every worklog I have written this week ends with
   "not checked on a real phone." The entire design premise of this product is wet hands,
   sunlight and one-handed operation, and we have zero evidence about any of the three.
   Headless Chromium at 390×844 is not a boat.
3. **The calendar is a paragraph.** D23 makes it the home surface. Every launch of this app
   lands on placeholder text.

**Recommendation.** My next lane is the calendar and the day page. Not more tackle, not
more tide. I would like that confirmed rather than assumed.

**New idea.** A written ten-minute field protocol — the same checks in the same order,
outdoors, in sunlight, with wet hands, one-handed — so "tested on a real phone" becomes a
repeatable artifact rather than a vibe. It costs an hour to write and it converts our
single biggest untested assumption into evidence.

---

### `biostat` — numbers and outside data

**Status.** Tide engine (differenced predictions, not reconstructed harmonics), astro
(sun/moon), units, measurement rules — all vector-tested.

**Assessment.** The maths is in good shape and the honesty rules are holding: interpolated
readings are marked as interpolated, water temperature is never prefilled, "tide movement"
is never called "current."

**Concern — and it is the one that matters most in this meeting.**

**We are recording numerators with no denominator.** There is no trip UI. Nothing records
that the angler fished for four hours, or that a trip caught nothing. `D2` says blank
trips are first-class data; `analytics.trip_effort` exists as a view in the migrations,
with no way to put a row underneath it. **Every catch logged today is, statistically,
un-analyzable** — a catch count without effort is not a rate, and every claim this product
intends to sell is a rate. Trip start/end is not a V2 convenience. It is the denominator,
and it belongs beside the calendar in this month's work.

**Two smaller ones.**

- The tide fixture expires 2026-09-04. My data, my problem, flagging it early.
- No pressure or weather is captured at write time. This is **recoverable** — NOAA NCEI
  Global Hourly can backfill historical pressure given accurate time and position, and we
  store both — but the backfill job has to exist before anyone analyzes anything. It is
  not an emergency; it is a debt with a due date.

**Recommendation.** Trip effort with the calendar. Then the NCEI backfill job. O4 (the
evidence threshold) is still uncomputed and still gates nothing in V1 — leave it alone,
it is a V2 cost.

**New idea.** Barometric *trend* (ROADMAP B1) remains the highest signal-per-hour variable
on the whole candidate list, and the trend is only obtainable if pressure is recorded at
the moment. Record it now even if nothing displays it for six months. Storage is free;
the moment is not repeatable.

---

### `cfo` — cost

**Status.** `COSTS.md` current as of 2026-08-28. Infra spend to date: **$0**, because
nothing is provisioned.

**Assessment.** Unchanged and worth repeating: **infrastructure is not the constraint on
this business at any modeled scale.** ~$0.03–0.05 per user per month at 1,000 users. The
constraint is conversion, and after that it is builder-hours.

**Concern.** The most expensive line item in this project is not on my table. It is
**repeated polish rounds on unpersisted screens** — four on the tide chart, three on the
Tackle Box, inside five days, all before either screen could keep a record. That is the
real burn rate, and it is a MEDIUM-tier agent cost incurred against work that a persistence
lane will partly redo anyway.

**Recommendation.**

- Cap design rounds per surface at two before persistence; escalate a third to `coo`.
- Provision Supabase now. Free tier, $0, and we are currently paying nothing and getting
  nothing.
- **Apple Developer Program, $99/yr — `COSTS.md` lists it, nobody has recorded buying it.**
  Enrollment is not instant. If it is not purchased, buy it when Phase 2 starts, not when
  TestFlight is blocked on it.
- Pricing ratification (O6, $49.99/yr + $7.99/mo) still is not urgent — D14 means V1 has
  nothing to bill. Do not spend meeting time on it.

**New idea.** Track cost against **exit criteria met**, not PRs merged. By PR count this
was an outstanding week. By exit criteria it was a zero.

---

### `counsel` — legal risk *(drafts and flags; this is not legal advice)*

**Status.** Nothing merged. `docs/legal/` is referenced in `docs/team/README.md` and **does
not exist**.

**Assessment.** No exposure today — there are no users and no data leaves the device. That
changes the moment sync works and the first external tester signs in.

**Concerns.**

1. **No privacy policy.** TestFlight external testing requires one. App Store submission
   requires one plus privacy nutrition labels. Both have lead time, and both are currently
   sitting behind a Phase 6 label as if they were paperwork rather than a dependency.
2. **We already process personal data.** Magic-link sign-in means email addresses, today,
   with no policy and no stated retention.
3. **Location is the sensitive category here.** House rules already forbid committing real
   coordinates. What does not exist is the *user-facing* commitment — anglers do not share
   spots, and a written promise about spot data is a trust feature as much as a legal one.
4. **O9 is only half closed.** `astronomy-engine` (MIT) is cleared for JS/TS. No Swift
   moon-phase library has been licence-checked, and Phase 3 needs one.

**Recommendation.** Let me draft the privacy policy and terms into `docs/legal/` this month
as attorney-ready drafts. It is cheap, it is off the critical path, and it removes a
dependency that will otherwise surface as a surprise the week beta is meant to start.

**New idea.** Write the spot-privacy commitment as a *product* promise, not a legal one —
"your spots never leave your account, and shared coordinates are deliberately degraded"
(ROADMAP E2). It is the single most credible trust claim this product can make to anglers,
and it costs nothing to commit to before the code exists.

---

### `code-reviewer` — review

**Status.** No review commissioned this cycle. What follows is from reading the tree, with
file evidence.

**Findings.**

1. **`src/features/shell/queries/backup-state.ts:21` — `readBackupState()` returns
   `{ kind: "settled" }` unconditionally**, which `describeBackupState` renders as
   **"Backed up"** beside a green dot on every screen. Nothing has ever been backed up.
   The file's own TODO admits the real count is unavailable. Reporting an unobservable
   success state is worse than reporting nothing: it is the state an angler would rely on
   before wiping a phone. **Recommended fix: say "Saved on this device" until the flusher
   round-trips.** Four lines.
2. **`src/features/tackle/session-store.ts` — a second persistence model**, contradicting
   ADR 004 §1's "every screen renders from the local store." Honestly labelled, correctly
   flagged as the swap point, and accumulating UI on top of it.
3. **`LOCAL_ANGLER_ID`** — RLS verified server-side, never exercised by a real session.

**Recommendation — a permanent project rule.** *No user-facing status string may assert a
state the code cannot observe.* Finding 1 is not carelessness; it is what happens when a
vocabulary is specified before the mechanism exists. A rule catches the next one.

---

### `test-agent` — verification

**Status.** 281 tests, `npm run verify` chains tokens, tripwires, lint, `tsc --noEmit` and
vitest. Coverage of the pure core — tide, astro, units, search, outbox envelope, geometry,
formatting — is genuinely good.

**Concerns.**

1. **No test CI.** Vercel builds and deploys every PR, which catches a broken build and
   type errors — that is real coverage and I should say so. But no test, lint, token or
   tripwire check runs on a PR. Green means "green on the machine of whoever last ran it,"
   which for a solo-owner project with rotating agents is close to meaningless.
2. **The browser checks cited as evidence are not in the repository.** PR #14 cites 37
   browser checks; the tackle work cites 46 plus a 14-check keyboard pass; the Fish Log
   cites 32 plus 19 harder ones. There is no Playwright or Puppeteer dependency and no
   committed harness. **Those checks were real when they ran and nobody can re-run a single
   one of them.** That is the largest gap between claimed and reproducible evidence in this
   project.
3. **No test proves a write survives a reload** — which is, right now, the product's only
   durability guarantee.

**Recommendation.** In order: (1) `.github/workflows/verify.yml` running `npm run verify` on
every PR — half a day, LOW-tier work; (2) add Playwright and commit the checks that PRs
already claim; (3) one persistence test that writes, reloads and reads back. Until (1)
lands, PRs should stop citing browser evidence that reviewers cannot reproduce.

---

### `git-integrator` — integration

**Status.** PR #14 open against `main`, `mergeable_state: clean`, 12 files, +650/−137, one
comment. Issue #1 (Phase 1) open since 2026-08-28. History is clean, merge order has held,
no lane collisions — the channel warning about `src/features/conditions/**` worked exactly
as intended and two lanes stayed off each other.

**Concerns.**

1. **Branch naming has drifted off house rules.** `HOUSE-RULES` §3 says `<role>/<slug>`.
   Recent branches: `claude/merge-open-prs-main-vslm29`,
   `claude/link-access-question-e7m9l8`, `claude/fish-logbook-sept-meeting-7yw8zd`. These
   are runtime-generated names. The consequence is not cosmetic — **the branch no longer
   says which role owns the lane**, which is the mechanism house rules use to prevent two
   agents writing the same files.
2. **PR #14's branch is named `merge-open-prs` and its content is a UX feature.** Anyone
   reading the branch list is misled about what is in flight.
3. **No required status check on `main`.** Vercel reports two deployment statuses per PR,
   but a successful deploy is not a passing test suite and should never be read as one.
   Once `verify` runs in Actions, make it required.

**Recommendation.** Accept that runtimes generate branch names, and adapt the rule rather
than lose it: **the PR title and first commit must carry the role prefix** (`ux-ui:`,
`head-dev:`), and `coo` records the lane owner in the assignment. That preserves what the
convention was actually for.

---

### `repo-scout` — change surfaces *(LOW)*

Located the surfaces for this month's three priorities so nobody re-derives them:

- **Flusher** — `src/core/sync/outbox.ts` (envelope and retry, done), `src/lib/offline/db.ts`
  (`commit`, `allMutations`), **`src/core/sync/store.ts` does not exist** and is referenced
  by the TODO in `backup-state.ts:12`. Normative spec: `docs/architecture/sync-protocol.md`
  §4 (push) and §5 (pull).
- **Calendar / day** — `src/app/(app)/page.tsx` and `src/app/(app)/day/[date]/page.tsx`
  (both stubs), read model in `src/features/catches/store.ts`, day bucketing already
  written in `src/core/rules/catch/rules.ts` (`localDateOf`) and `src/core/ontology/timeline.ts`.
- **Live tide** — `src/features/conditions/queries/tide-series.ts` is the *only* file that
  needs to change; `src/features/conditions/tide-fixture.ts` is the only file to delete.
  Nothing above the query layer is affected (ADR 006 §2). The station search the founder
  chose (channel, 2026-08-29) needs the CO-OPS station index cached — architect's ruling
  first, per that entry.
- **Stale doc** — `docs/team/HANDOFF.md:8` still reads *"No application code written yet.
  The Next.js app in `src/` is an unmodified starter skeleton."* Four days stale and
  actively wrong. It is the file we hand to newcomers.

---

### `diagram-agent` — diagrams *(LOW)*

Nothing queued and nothing invented. Two diagrams would pay for themselves when the Swift
client starts, and I will draw either on approval, from the approved spec only:

1. The push/pull sequence in ADR 004 §3–§5, as a sequence diagram — the piece most likely
   to be re-derived incorrectly by whoever writes the Swift side.
2. Calendar → day → trip → catch → condition-snapshot as an ER/flow pair — the navigation
   model that currently exists only as prose across three documents.

---

## 3. Agent-to-agent

| From | To | Item |
|---|---|---|
| `head-dev` | owner, `architect` | **Blocked.** No hosted Supabase project. The flusher cannot be written honestly without one. This is the week's top unblock. |
| `architect` | `ux-ui` | Move the Tackle Box onto the offline store before the next tackle UI round. Each round raises the swap cost. |
| `code-reviewer` | `head-dev`, `ux-ui` | "Backed up" is asserted on every screen and is false. Four-line fix; do it inside the sync lane, not as a separate PR. |
| `biostat` | `head-dev` | Record barometric pressure at write time now, even unused. The moment is not repeatable; display can wait six months. |
| `biostat` | `coo`, `ceo` | Trip effort is the denominator. Without it, every catch we log is statistically inert. It belongs in this month, beside the calendar. |
| `test-agent` | all | Stop citing browser checks in PR bodies until they are committed and re-runnable. Cite `npm run verify` and say the rest was manual. |
| `counsel` | `ceo`, `coo` | Privacy policy has lead time and gates beta. Let me draft it this month, off the critical path. |
| `cfo` | all | Two design rounds per surface before persistence. A third escalates. |
| `git-integrator` | all | Role prefix moves to the PR title and first commit, since runtimes now name branches. |
| `ux-ui` | `coo` | Confirm my next lane is calendar + day page, explicitly, before I start. |
| `repo-scout` | `coo` | `HANDOFF.md` is wrong about the project's basic state. It is the newcomer document. |

### Disagreements on the record

**1. `ux-ui` vs. the touch spec — the 88px quick mark.** Raised inside PR #14, unresolved.
`03-touch-and-interaction.md` sizes this control at 88px *because it is meant to be used by
feel, not sight*. The owner's revision asked for something that does not dominate. `ux-ui`
kept 88px and made the control opt-in and off by default, which addresses "dominate"
without breaking the property the size exists for. **`ux-ui`'s position is right and should
stand unless the owner says otherwise** — but it is the owner's control and the owner's
call, so it goes on the decisions list rather than being closed here.

**2. `ceo` and `coo` vs. the last week's direction.** Both of us think breadth outran
depth. Sequencing is mine to decide and I am deciding it — the freeze below is mine, not a
request. But the scope additions came from the owner, and reversing an owner's priority is
not a COO call, so the freeze is a recommendation the owner can overturn in one sentence.

---

## 4. Workflow review

**Working well.** The channel prevented a real lane collision on `src/features/conditions/**`.
Worklogs are plain-English and honest — every one of them says what is still broken, which
is rarer than it sounds. The ADRs are load-bearing and have been cited correctly by roles
that did not write them. The token/tripwire scripts catch drift automatically.

**Not working.**

1. **No test CI.** The single biggest workflow gap. Vercel covers the build; nothing
   covers the tests, and every other process depends on "somebody ran it."
2. **Evidence is not reproducible.** See `test-agent`. PRs cite dozens of browser checks
   that exist nowhere.
3. **The newcomer document is wrong.** `HANDOFF.md` describes a repo with no application
   code.
4. **Branch names no longer identify lanes.**
5. **Context is re-derived every session.** `SPEC.md` is 532 lines, `PLAN.md` is long, and
   every session reads several large documents to learn the same handful of current facts.
   That is a per-session tax paid on every turn.
6. **Rounds of polish are unbudgeted.** Nothing stops a fourth round; nothing counts them.

**Changes, effective now.**

- **Add CI** (`test-agent`, LOW): `npm run verify` on every PR, then required on `main`.
- **Add `docs/team/STATUS.md`** (`coo`, ~40 lines, rewritten weekly): what is built, what is
  stubbed, what is blocked, what is Now. Every session reads that one file first and
  reaches for `SPEC.md`/`PLAN.md` only when it needs to. This is the cheapest token saving
  available and it also fixes the stale-handoff problem.
- **Fix `HANDOFF.md`** (LOW) — one paragraph.
- **Role prefix moves to the PR title and first commit.**
- **Two polish rounds per surface before persistence; a third escalates to `coo`.**

**New permanent rules** (candidates for `HOUSE-RULES`, owner to approve):

1. *No user-facing status string may assert a state the code cannot observe.*
2. *A prototype store must declare, in its own file header, which lane replaces it and what
   the user is told meanwhile.* (`session-store.ts` already does this well — make it the
   rule.)
3. *Evidence cited in a PR must be re-runnable from the repository, or must be labelled
   "manual, not reproducible."*

**Delegation.** Real waste found: CI setup, doc-staleness fixes, worklog hygiene, the
`HANDOFF` correction and browser-check harnessing are all LOW-tier work currently landing
on MEDIUM agents. Route them down.

**New agents.** **No.** The gap this month is not a missing role, it is missing CI and
missing persistence — neither of which a new agent fixes. The thirteen roles cover the
work. The one genuinely new role is the Marketing Engineer the owner is adding, and §7
covers what they will need.

---

## 5. Product direction — are we building a product or a pile?

**Honest answer: a pile, so far, but a recoverable one.** Three good tools that do not yet
talk to each other. The good news is that the connective tissue is small, mostly designed,
and partly already in the schema.

The product's spine is one sentence: **trip (effort) → catch (event) → condition snapshot
(context) → calendar (history) → pattern (payoff).** We have built catch, and conditions on
a fixture. Everything else in that chain is missing, and the chain is the product.

**Four joins that turn the pile into the product, in value order:**

1. **Trip ↔ catch — the denominator.** Start Fishing / End Trip, blank trips included.
   Without it nothing downstream is a rate. `analytics.trip_effort` is already waiting for
   rows. *This is the highest-value missing piece in the entire repository.*
2. **Calendar ↔ everything.** D23's history surface and D24's backfill surface are the same
   screen. It is also the only screen where a year of data looks like anything.
3. **Tackle ↔ catch.** The `catch_gear` migration already exists with a snapshot label and
   `ON DELETE SET NULL`. Making the Tackle Box the pick-list for what was tied on converts
   an inventory into an analysis dimension — "what did I actually catch on the Tady 45" —
   and retroactively justifies the tackle work.
4. **Spot ↔ tide station.** D20's stored coastline bearing and the owner's search-all
   station decision meet at `/spots`, which is a stub. Spots is the missing hub that makes
   tide data follow the angler instead of being pinned to Newport.

**Recommendation:** the next three builds are connective tissue, not new nouns. No new
top-level surface enters this app until the calendar, trips and sync exist.

---

## 6. COO — Roadmap

Dates are given only where the engineering supports them. Where it does not, the milestone
is named instead.

### Now — this week

| # | Work | Owner |
|---|---|---|
| 1 | Provision hosted Supabase, apply the six migrations, wire auth to the log (retire `LOCAL_ANGLER_ID`) | owner + `head-dev` |
| 2 | Outbox flusher: push, pull cursor, conflict policy per `sync-protocol.md`; fix the "Backed up" string in the same lane | `head-dev` + `architect` |
| 3 | Live NOAA CO-OPS fetch replacing the fixture — **before 2026-09-04** | `head-dev` + `biostat` |

Running alongside, LOW-tier, not competing for the top three: CI workflow (`test-agent`),
`HANDOFF.md` correction and `STATUS.md` (`coo`), privacy-policy draft (`counsel`).

### Next — before this prototype is worth putting in front of anyone

Calendar + day page · trip start/end including blank trips · day journal (D23) · backfill
with the after-the-fact flag (D24) · Tackle Box moved onto the offline store · tackle
linked to catch via `catch_gear` · spot picking and station search · Playwright checks
committed.

**Milestone: Phase 1's exit test passes** — a real trip, at a real SoCal spot, on a real
phone, with a no-signal quick mark that syncs on return and a backfilled paper-log day
correctly flagged. That test is the gate to everything below it, and `PLAN.md` §6 asks me
to escalate to `ceo` if it has not passed by **2026-09-18**.

### MVP — the first genuinely usable release

Everything in Next, plus: sync that has round-tripped in the field · quick-mark resolution
queue · live tide for a searched station with offline cache · units and settings · privacy
policy published · one real angler's season of data surviving a week without loss.

### Beta

Real-phone validation against the field protocol · 3–5 external anglers who are not the
owner · crash reporting · an in-app feedback path writing to the same Supabase project ·
one week of external use with no data-loss bug. (`PLAN.md` Phase 6's exit criterion,
unchanged.)

### Production — public launch

Native iOS + Watch per D15 (Phases 2–3, **zero lines written today**) · live enrichment via
NWS + NCEI · App Store listing, screenshots, privacy nutrition labels · terms and privacy
reviewed by a real attorney · Apple Developer Program active · a support path that is not
the owner's personal inbox.

### Post-launch

Bass vertical slice (Phase 4 — and `PLAN.md` §6.2 warns this is the promise most likely to
slip) · correlation engine and bite score (V2, gated on P6) · photos · alerts and tide
alarms · CSV/GPX export · home-screen widget · Android.

### Launch window — honestly

**The web prototype reaching its Phase 1 exit test: realistically 1–2 weeks of focused
work**, if Supabase is provisioned this week and no new scope arrives. That estimate is
grounded — the team has been landing a substantial surface every one to two days. It is
also the *optimistic* read, because the remaining work is integration work (sync, auth,
enrichment), which is slower and harder to verify than UI on a fixture, and this team has
never done any of it.

**A public App Store launch is not estimable from here, and I will not invent a date.** No
Swift exists, no Swift quality bar is defined, the Watch app is the hardest piece and the
least specified, and nobody has ever tested this product on a physical device. The earliest
credible public launch is measured in **months, not weeks**, and the Watch is the dominant
unknown.

**Which surfaces a fork the owner should decide deliberately** — it is `PLAN.md` failure
mode 7 arriving on schedule:

- **(a) Hold D15.** Native iPhone + Watch is V1. The web app stays a prototype and a spec.
  Launch is months out. The Watch — the reason native was chosen — actually gets built.
- **(b) Reposition the web app as an installable beta.** Real anglers use it within weeks.
  D15 slips, the Watch recedes, and the reason for choosing native quietly stops being
  acted on.

Both are legitimate. Only one thing is not: **choosing (b) by drift, one convenient week at
a time, without anyone deciding it.** That is the failure mode by name.

---

## 7. Preparing for Marketing & Monetization

What the Marketing Engineer will need from us, what exists, and what we should prepare now.

| Need | State today | Action |
|---|---|---|
| **Positioning** | `README.md` is one line | `ceo` drafts one sentence; **owner ratifies** |
| **Target user** | Implicit in D7: SoCal saltwater angler who already keeps a paper log. Bass is Phase 4 | Write it down; it is the beachhead, not a demographic |
| **Value proposition** | Strong and defensible: blank trips + condition snapshot at the moment | Say it in the product, not just the docs |
| **Differentiators** | Real: the denominator, tide correlation, no-gamification honesty | Do not let a screenshot-driven redesign trade these away |
| **Analytics** | **None. Zero instrumentation.** | Define ~8 events *before* marketing arrives — see below |
| **Acquisition tracking** | None | App Store Connect + one landing page. Do not build attribution infra |
| **Onboarding** | `docs/product/ux-cold-start.md` is designed; `/learn` exists and is deliberately unlinked | Relink and finish it deliberately; do not rebuild it |
| **Subscription infra** | Nothing. D14 means V1 has nothing to bill | Do not build. But see the paywall-boundary note below |
| **Premium features** | Interpretation, per D14 | Keep the free/paid line explicit in the feature map from now on |
| **App Store prep** | Apple Developer Program listed in `COSTS.md`, no purchase recorded | Confirm; buy at Phase 2, not at TestFlight |
| **Landing page** | None | Needs positioning + 3 screenshots. Build after the app it advertises, not before |
| **Screenshots / demo** | Tide screen and Fish Log are screenshot-worthy today; the calendar will be the third | The seed dataset `head-dev` proposed is what makes screenshots look like a real season |
| **Beta feedback** | None | One in-app "tell us," writing to the same Supabase project |

**On analytics — a warning marketing will need to hear on day one.** This product's entire
statistical claim rests on the log being an *unbiased record of when someone fished*
(`ROADMAP.md` Part 3). Any metric that rewards logging — streaks, engagement targets,
notification pressure to log — corrupts the data we intend to sell. Analytics here must
measure whether the product works, never nudge the user into logging more. Recommended
minimum event set, defined by product and disclosed in the privacy policy: install,
sign-in, first trip started, first catch logged, **first blank trip logged**, first
backfill, seven-day return, subscription screen viewed. Eight events, no per-catch
telemetry, no location in analytics, ever.

**One thing to do now that is nearly free and expensive to retrofit:** keep the **free/paid
boundary explicit in the feature map from today** — logging, tides, calendar, tackle and
data export are free forever; correlation, condition matching, "find days like today,"
multi-year season views and bite score are paid. If that line is not maintained as features
land, the eventual paywall will fall across features users already had, and that reads as
a takeaway rather than an upgrade.

**Realistic monetization that does not damage the product:**

1. **Subscription for interpretation** (D14, settled). Annual-first given seasonality —
   `cfo`'s $49.99/yr + $7.99/mo, still awaiting ratification and still not urgent.
2. **Export as a trust feature, free.** People commit data more readily when they can take
   it out. It costs a weekend and it makes the subscription feel like a choice.
3. **A funding tier, if the first year needs it** — a one-time lifetime price, offered once
   to early beta anglers. It converts goodwill into runway without touching the product.
4. **Later, counsel-gated:** the regulations/limits pack (ROADMAP E1). Genuinely useful,
   genuinely used, and carries real liability if wrong or stale. Not before an attorney.

**What would damage the product, recorded so nobody proposes it in month two:** ads;
selling or aggregating location data (fatal with anglers — spots are the one thing they do
not share); paywalling logging (starves the data the subscription is built on); and any
gamified engagement mechanic (corrupts the denominator). All four are already anti-features
in `ROADMAP.md` Part 3. They will each look like an obvious win to someone arriving fresh.

---

## 8. Open floor

- **`architect`:** the "Backed up" string is four lines and it is the only defect here that
  could cost the owner real data. Fix it this week regardless of what else slips.
- **`biostat`:** if only one thing from my report survives triage, make it trip effort.
  Everything statistical this product promises is a rate, and we are not recording the
  bottom half of one.
- **`ux-ui`:** the field protocol is one hour of work and it converts our largest untested
  assumption into evidence. I will write it if nobody objects.
- **`test-agent`:** CI is half a day and it protects everything the rest of the month
  produces. Doing it after the sync lane is doing it backwards.
- **`counsel`:** privacy policy has a lead time nobody has started counting. Beta will
  discover this, not plan for it.
- **`cfo`:** the burn is agent-hours on polish, not dollars on infra. Do not let the $0
  infra bill read as efficiency.
- **`git-integrator`:** PR #14 is clean and has been sitting since this morning on one
  owner question. It should not wait on the rest of this meeting.
- **`ceo`:** we are one calendar screen away from this being a coherent product and three
  more good screens away from it being an incoherent one.
- **`head-dev`:** I would rather ship an ugly calendar that persists than a fourth
  beautiful screen that forgets.
- **`repo-scout` / `diagram-agent`:** available and idle. Route the doc fixes and the CI
  workflow down to us.

---

## COO — Final Meeting Summary

### September priorities

1. **Make data real.** Supabase provisioned, auth wired, the outbox flusher round-tripping,
   and the "Backed up" claim made true or made honest.
2. **Build the spine.** Calendar → day page → trip start/end (including blank trips) →
   journal → backfill. This is the product; the rest is tools.
3. **Pass Phase 1's exit test on a real phone, at a real spot, before 2026-09-18.**
4. **Stop the fixture expiring.** Live NOAA fetch before 2026-09-04.
5. **Put a floor under the process.** CI, a `STATUS.md`, a corrected `HANDOFF.md`, and a
   privacy-policy draft — all LOW-tier, none competing with the top three.

### Immediate action items

| Priority | Action item | Owner | Dependency | Status |
|---|---|---|---|---|
| **High** | Provision hosted Supabase project; apply the six migrations | owner → `head-dev` | Owner decision #1 | Not started |
| **High** | Outbox flusher (push/pull/conflict) per `sync-protocol.md` §4–§5 | `head-dev` + `architect` | Live Supabase | Blocked |
| **High** | Fix `readBackupState()` — stop claiming "Backed up" | `head-dev` | None — do now | Not started |
| **High** | Live NOAA CO-OPS fetch replacing the fixture | `head-dev` + `biostat` | Architect ruling on caching the station index | Not started — **expires 2026-09-04** |
| **High** | Wire auth session to the log; retire `LOCAL_ANGLER_ID` | `head-dev` | Live Supabase | Blocked |
| **High** | Calendar + day page (D23) | `ux-ui` + `head-dev` | Lane confirmation | Not started |
| **High** | Trip start/end incl. blank trips — the denominator | `head-dev` + `biostat` | Calendar shell | Not started |
| **Medium** | `.github/workflows/verify.yml` on every PR | `test-agent` | None | Not started |
| **Medium** | Commit the browser checks PRs already cite (Playwright) | `test-agent` | CI | Not started |
| **Medium** | Day journal (D23) + backfill with after-the-fact flag (D24) | `head-dev` + `ux-ui` | Calendar, day page | Not started |
| **Medium** | Move Tackle Box onto the offline store | `head-dev` | Offline store lane | Not started |
| **Medium** | Link tackle to catch via existing `catch_gear` | `head-dev` | Tackle persistence | Not started |
| **Medium** | Record barometric pressure at write time (display later) | `head-dev` | Write path | Not started |
| **Medium** | Privacy policy + terms drafts into `docs/legal/` | `counsel` | Owner decision #5 (analytics) | Not started |
| **Medium** | `docs/team/STATUS.md`; correct `HANDOFF.md:8` | `coo` | None | Not started |
| **Low** | Field-test protocol for real-phone checks | `ux-ui` | None | Proposed |
| **Low** | Seed dataset — one angler, one season | `head-dev` | Persistence | Proposed |
| **Low** | Sync sequence + navigation-model diagrams | `diagram-agent` | Approval | Proposed |

### Blockers

1. **No hosted Supabase project.** Blocks the flusher, auth, RLS validation end-to-end,
   and therefore Phase 1's exit test. **Everything important this month sits behind this.**
2. **Tide fixture expires 2026-09-04.** Three days.
3. **No test CI** — Vercel catches a broken build, nothing catches a broken test — so
   every other quality claim rests on memory.
4. **PR #14** waits on one owner decision (below).
5. **No real-phone testing has ever occurred**, on anything.

### Decisions needed from the owner

1. **Provision the Supabase project** — or authorise `head-dev` to create it and hand back
   the keys. *This is the one that unblocks the month.*
2. **Scope freeze: yes or no.** No new top-level surfaces — including further Tackle Box
   work — until Phase 1's exit test passes. Sequencing is my call; reversing an owner's
   priorities is not, so this needs your word.
3. **Quick Mark touch target: 88px or 68px** (PR #14). `ux-ui` recommends keeping 88px —
   the size exists so the control can be hit by feel, and "off by default" already answers
   "does not dominate." Your control, your call, and PR #14 merges either way once decided.
4. **The D15 fork: (a) hold native-only, or (b) ship the web app to real anglers as an
   interim beta.** Both defensible. Deciding by drift is not.
5. **Analytics: what, if any, telemetry is acceptable?** Affects the privacy policy, App
   Store nutrition labels and what marketing can measure on arrival. Recommendation: eight
   events, no per-catch telemetry, no location, ever.
6. **Ratify the positioning sentence** (§2, `ceo`) before the Marketing Engineer arrives.
7. **Apple Developer Program** — confirm whether it is purchased; if not, buy at Phase 2.
8. **The vocabulary red-pen** (species, lure classes, bait, structure, clarity) in
   `docs/architecture/ontology.md`. This has been the oldest open owner item since
   2026-08-27, it is a ~20-minute pass for an experienced angler, and anything missing
   pushes users into custom fields whose data can never be pooled.

### Agent coordination

`head-dev` ↔ `architect` on the flusher, sharing the sync lane. `ux-ui` → `head-dev` handoff
on calendar and day page, with `ux-ui` leading. `biostat` → `head-dev` on capturing pressure
at write time and on the NCEI backfill job. `counsel` works independently, off the critical
path. `test-agent`, `repo-scout` and `diagram-agent` take the LOW-tier work currently
landing on MEDIUM agents. `git-integrator` holds merge order: PR #14 first, then the sync
lane, then the calendar lane — they do not share files.

### Workflow changes

CI on every PR, then required on `main` · `docs/team/STATUS.md` as the one file every
session reads first · `HANDOFF.md` corrected · role prefix moves from the branch name to the
PR title and first commit · two design rounds per surface before persistence, a third
escalates · three new house rules proposed (unobservable status strings, prototype-store
declarations, reproducible PR evidence) · **no new agent roles** — the gap is CI and
persistence, not headcount.

### Product / feature recommendations

Strongest ideas from this meeting, in value order: **trip effort as the denominator**
(`biostat`) · **tackle linked to catch via the `catch_gear` table that already exists**
(`architect`) · **capture barometric pressure now, display it later** (`biostat`) · **the
seed dataset** (`head-dev`) · **the field-test protocol** (`ux-ui`) · **the spot-privacy
promise as a product commitment, not just a legal one** (`counsel`).

### Launch roadmap

**Development → MVP:** 1–2 weeks of focused work to Phase 1's exit test, contingent on
Supabase this week and no new scope. **MVP → beta:** real-phone validation plus 3–5 external
anglers, gated on the privacy policy and crash reporting. **Beta → production:** not
estimable from here — Phases 2–3 (Swift + Watch) have zero lines written and no defined
quality bar. **Months, not weeks, and the Watch is the dominant unknown.** I will give a
production date when Swift exists and the Watch has been scoped, and not before.

### Marketing preparation

Ready before the Marketing Engineer arrives: an owner-ratified positioning sentence, a
written target user, the free/paid boundary maintained in the feature map, a defined
eight-event analytics set with the anti-gamification constraint attached, the relinked
onboarding route, and a seed dataset so screenshots show a real season. Not ready and not
needed yet: subscription infrastructure, attribution tooling, the landing page.

### Parking lot — good, and not now

Bass vertical slice (Phase 4, and at risk per `PLAN.md` §6.2) · bite score and alerts (V2,
gated on P6) · voice notes on a catch · home-screen widget and Watch complication · tide
alarms · catch heat map · season calendar across years · personal bests · CSV/GPX export ·
multi-angler trips (a correctness issue, not a nicety — do not lose it) · solunar periods ·
swell height · regulations and bag limits (counsel-gated) · photos with EXIF stripped ·
offline map tiles · Android · P6 ratification · O6 pricing ratification · O4 evidence
threshold.

---

**Meeting closed.** Next review: at Phase 1's exit test, or 2026-09-18, whichever comes
first.
