# Worklog

Newest at the bottom. One block per working session. Written so anyone can read it.

Format:

```
### YYYY-MM-DD | role | time spent
- What changed, in plain English.
- Files: the paths touched
- Next: what is still broken or unfinished
```

No jargon. No ticket numbers. Honest times. Always say what is still broken.

---

### 2026-08-27 | coo | 30m
- Set up the team: eight specialist roles plus the shared rules everyone
  follows. Each role is a file in `.claude/agents/` that can be called by name.
- Wrote the ground rules: branch naming, nobody merges their own work, what "done"
  means, and the format for this log.
- Files: .claude/agents/*.md, docs/team/*.md, CLAUDE.md
- Next: no product vision written yet, and no folder structure decided. The app is
  still the empty Next.js starter page.

### 2026-08-28 | biostat | 90m
- Researched every environmental data source the app needs — tides, currents, weather,
  pressure, water temperature, moon, and lakes. Called every API live rather than
  trusting memory, and wrote down what each one actually costs and allows.
- Three findings that change the plan. The free weather service we assumed we'd use
  (Open-Meteo) bans commercial apps in its terms, so a paid subscription app must pay
  or switch; a free replacement exists. There is no tidal-current forecast anywhere
  near Newport Beach, so asking the user for current direction was the right call.
  And nearby water-temperature buoys disagree with each other by 2 degrees, so
  auto-filling water temp would be a guess dressed up as a measurement.
- Files: docs/analysis/data-sources.md (new), docs/team/CHANNEL.md, docs/team/WORKLOG.md
- Next: nobody has the real Open-Meteo prices yet — the page hides them from scripts.
  I did not verify CDIP or CDEC (two other water-data services) at all. And I did not
  test whether we can rebuild a tide curve from NOAA's harmonic numbers ourselves;
  that is harder than it looks and I did not want to promise it works.

### 2026-08-28 | architect | 70m
- Drafted the shared vocabulary the whole app will be built on — what a trip is, what a
  catch is, what conditions we record, and the fixed lists of species, lures, baits and
  bottom types an angler picks from. This is the piece the spec called the
  highest-leverage design job, because anything missing from these lists gets typed into
  a personal custom field and can never be compared across users.
- The big structural choices: a trip where nothing was caught is a full record, not an
  absence; conditions are recorded as their own timestamped snapshots so we can capture
  what it was like when nothing was biting; and a user's own lure ("that beat-up
  chartreuse one") is linked to a shared category ("jerkbait") so their private naming
  still produces comparable data.
- Personal custom fields are kept in a separate area of the database that the
  cross-user analysis simply has no permission to read. A label in the app explains it;
  the database enforces it.
- Wrote down where the app could accidentally give away someone's fishing spot — photo
  location tags being the worst — and what precision we should and should not store.
- Files: docs/architecture/ontology.md (new),
  docs/architecture/decisions/001-canonical-ontology-shape.md (new),
  docs/team/CHANNEL.md, docs/team/WORKLOG.md
- Next, and honestly: the species and lure lists are a researched guess, not knowledge.
  I have marked every item I am unsure about, but they need an hour with the founder
  before anyone builds a dropdown from them. One item is genuinely blocking — nobody has
  told me what "uphill" and "downhill" mean, and that field cannot be built until they
  do. No code and no database migration was written; this is a document only.

### 2026-08-28 | cfo | 70m
- Answered the open weather-cost question. Found Open-Meteo's real prices (the pricing
  page hides them from scripts, but their own blog post has the numbers, confirmed by a
  second independent source): the tier we'd actually need is $99/month, not the $29
  headline price, because backfilling old weather data needs their more expensive plan.
  Recommending we build on the free government weather sources instead — the cost is a
  few days of one-time engineering work, not a recurring bill, and we're nowhere near
  the free sources' usage limits even at 10,000 users.
- Modeled what this app costs to run at 1 user, 1,000 users, and 10,000 users. The
  answer: server costs are trivially small at every size (a few cents per user per
  month) — the thing that decides whether this makes money is what fraction of users
  pay, not the server bill. Flagged that photo storage grows every year and never
  shrinks, and that compressing photos before upload matters a lot for that number.
- Looked at what five comparable fishing/tide apps charge and recommended a price:
  $49.99/year with a $7.99/month option. Worked out that a solo founder needs roughly
  10,000 signed-up users with 5-10% of them paying to make this a real income — 1,000
  users isn't enough at any realistic conversion rate.
- Files: docs/finance/cost-model.md (new), docs/finance/COSTS.md (new),
  docs/team/CHANNEL.md, docs/team/WORKLOG.md
- Next: `ceo` needs to weigh in on the $49.99/yr price and the 10,000-user planning
  target (O6 still open). Nobody has priced Expo's OTA update service yet — I could
  only find their build pricing. Domain registrar cost is still a guess.

### 2026-08-28 | ux-ui | 1h
- Designed three connected screens the founder delegated: what a brand-new user sees
  (cold start), how a bad fishing day actually gets recorded (the "these conditions
  suck" flow), and how bass/lake fishing stays fast to log when the app can't
  auto-detect almost anything about the water.
- The bad-day flow is the important one: one button, available any time during a trip
  as a way to vent, and the same button at the end of a trip if nothing was caught —
  it's what confirms the trip actually happened rather than just being abandoned. Added
  a check-in reminder (a phone notification, no internet needed) for trips people leave
  open and never come back to close out, since that's the exact moment people forget to
  log a bad day.
- For lake/bass fishing, kept the instant one-tap catch log exactly as fast as it is for
  ocean fishing, and added one optional, skip-any-time screen right after for water
  color/structure/depth — fields the app can't get automatically on a lake and that get
  hard to remember if you wait.
- No code. This is a design document only: `docs/product/ux-cold-start.md`.
- Files: docs/product/ux-cold-start.md (new), docs/team/CHANNEL.md, docs/team/WORKLOG.md
- Next: two open questions for `architect`/`ceo` are called out in the channel entry —
  whether the `platform` field ships (I designed around it existing), and whether
  salt-vs-fresh could be guessed automatically instead of asked once per spot. Nobody
  has put this in front of a real 70-year-old angler yet.

### 2026-08-28 | coo | 90m
- Read every product/architecture/finance doc written so far and sequenced the two
  products (saltwater and bass) the founder committed to building together — this was
  the biggest unfilled gap in the project (risk R11), and until now nobody had a plan
  for building both without ending up with two half-finished apps.
- The plan: prove the whole app once on saltwater first — real trip, real conditions,
  offline write, synced — then reuse that same skeleton for bass a week or two later,
  rather than building both at the same time by feel. Bass adds a vocabulary and one
  optional extra screen; it does not rebuild the logging flow.
- Found that the feature list currently asks for more in the first release than one
  person can build at once, and named specific cuts (a fancier search screen, a second
  chart overlay, a station picker) that can wait without hurting the app's core promise.
- Corrected a misreading in the roadmap: the "uphill/downhill" question everyone flagged
  as the single biggest blocker only blocks one small field, not the whole database.
  The real, currently-unowned risk is that nobody has designed how the app saves data
  with no signal — that's a hard requirement (D3), not optional, and it's a bigger risk
  to getting something running soon than any open question for the founder.
- Closed four questions that had been sitting unanswered in the team channel all day
  without needing the founder for three of them; the one that does need him is now a
  one-line multiple-choice question instead of an open-ended one.
- Rewrote the backlog, which was stale — it predated every decision made today and was
  still describing a web app, not the native iPhone/Watch app the founder actually
  committed to.
- Files: docs/team/PLAN.md (new), docs/team/BACKLOG.md, docs/team/CHANNEL.md
- Next: the plan assigns the offline-sync design and the iOS project location to
  `architect` — neither has an owner yet and both need to happen before real logging
  code gets written. Nothing in this session touched code; the app is still the empty
  Next.js skeleton.

### 2026-08-28 | architect | 45m
- The founder answered the question that was blocking the data model: "uphill" means the
  current running up the coast to the northwest, "downhill" is down the coast to the
  southeast, and inshore/offshore are toward and away from the beach. It is tied to the
  shape of the coast, not to the tide — a rising tide can run either way along the
  beach, which is exactly why recording both is worth doing.
- Designed how that gets stored. The angler always sees and taps their own four words.
  Underneath, the app saves the real compass direction those words point to at that
  particular spot. That means the data still makes sense at a bay, a jetty, or on a
  coast that runs the other way, and we can change the wording later without spoiling
  every catch already recorded. We keep the angler's word too, so if a spot's
  orientation was set up wrong it can be fixed rather than lost.
- The cost is one small setup step: when you save a saltwater spot, you drag a line along
  the beach and tap the water side. Once per spot, never again. Automating that from a
  coastline map is possible later — I have not checked whether a suitable map exists or
  what it costs, and I have said so rather than assuming.
- Confirmed lakes simply do not have these fields, the same way they do not have tides.
- Files: docs/architecture/ontology.md,
  docs/architecture/decisions/002-current-direction-storage.md (new),
  docs/architecture/decisions/001-canonical-ontology-shape.md (dated note added)
- Honest notes: the document is now 461 lines against a 400-line target I was given. I
  moved the reasoning into the decision file to slow the growth, but it is still over and
  I would rather flag that than quietly delete content. Still unanswered: whether bass
  fishing needs its own current field for dams and river inflows, and whether the two
  fields I proposed last session (how you were fishing, and whether a fish was landed or
  lost) are approved. Still no code and no database migration.

### 2026-08-28 | head-dev | 20m
- Set up the shared toolkit of working methods the team's assistants can now follow. Until
  today they had no agreed place to put issues, no agreed words for sorting them, and no
  agreed list of which documents to read before starting. They now do.
- Issues will live in this project's GitHub issue list. Created the five sorting tags we
  will use: needs sorting, waiting on more information, ready for an assistant to build,
  needs a person, and will not do. One of the five already existed and was reused rather
  than duplicated.
- Wrote down which documents an assistant must read before touching anything: the fishing
  vocabulary document, the decision records, and the specification with its settled and
  unsettled markings. The standard setup expected those in different folders than ours. I
  pointed it at where ours actually are instead of moving anything, because moving them
  would have broken about eight references scattered through other documents.
- Copied three warnings out of the private team channel and into that reading list, because
  they were addressed to particular people and a fresh assistant would never have seen them:
  never call tide movement "current", store the up-coast/down-coast direction as a real
  compass bearing rather than the word, and remember that a trip catching nothing is a real
  record and not a missing one.
- Files: docs/agents/issue-tracker.md, docs/agents/triage-labels.md, docs/agents/domain.md
  (all new), CLAUDE.md, docs/team/CHANNEL.md
- Honest notes: no application code was written or changed, so there was nothing to look at
  in a browser. This is filing-cabinet work — it only pays off if the next assistant
  actually reads it. Still no database and still no first screen.
- Next: the specification can now be turned into real numbered tickets. Nobody has done
  that yet.

### 2026-08-28 | coo | 50m
- The founder decided this morning to build a calendar, a day journal and a one-tap
  "man overboard" mark right now, as a web app anyone can use in a browser this week,
  rather than waiting for the iPhone app to be built. Native iPhone and Apple Watch are
  still the real product; the web version is a fast prototype and the spec the iPhone
  build gets made from.
- Reworked the sequencing plan around that: the very first phase is no longer "start the
  iPhone project," it's "get the calendar/journal/mark working in the browser." The
  iPhone project now starts right after that web version gets used on a real fishing
  trip — not on a guessed date.
- Said plainly what this costs: it's more work piled onto a first release that was
  already too big, plus a second version of the screens to maintain. To make room:
  bass fishing stays out of the web version entirely (it still gets built, just once,
  natively, later) and the web version won't try to fetch real tide/weather data live —
  it saves the position and fills that in afterward, same as it already does when there's
  no phone signal.
- Named a new risk that wasn't on the list before: the web version might quietly become
  "the app" by default, because it'll actually work and be in the founder's hand, and the
  Apple Watch — the whole reason for going native — could keep getting pushed off without
  anyone deciding that out loud. Wrote down exactly what to watch for so this gets caught
  early instead of six weeks from now.
- Files: docs/team/PLAN.md, docs/team/BACKLOG.md
- Next: `architect` is finishing the two design documents (how offline saving works, and
  what's shared between the web and iPhone versions) that the web build actually depends
  on — nobody should start building logging screens before those land.

### 2026-08-28 | ux-ui | 55m
- Designed the calendar/notebook/man-overboard screens the founder asked for this
  morning (D21-D24), extending my earlier cold-start doc rather than replacing it.
- Key calls: a caught day and a confirmed-zero day render as the identical dot on the
  month grid (no color/count reward for catching, per ROADMAP Part 3's anti-streak
  rule); the man-overboard mark is the existing Log a Catch button, not a new one; an
  unresolved mark surfaces through the existing needs-details queue plus a calendar
  flag, not a second inbox; the rig-editing sheet never covers the log button so a
  mid-trip lure change can't cost the fish in hand.
- Files: docs/product/ux-calendar-notebook.md (new)
- Next: architect still owes a yes/no on Trip.platform, which now feeds the rig sheet
  directly, not just the trip form.

### 2026-08-28 | architect | 3h
- The founder's four answers (calendar, notebook, quick mark, backfill) are now designed
  and written as database tables. This is the first real database work in the project —
  everything before it was a document.
- The calendar day is stored as a plain date, not a moment in time, so an angler who
  travels still sees one August 28th and not two. A trip that runs past midnight belongs
  to the day it started. One rule, no exceptions for night fishing.
- The one-tap mark is saved as "not confirmed yet". Nothing that is unconfirmed can ever
  reach a catch rate — not because someone remembers to filter it out, but because the
  part of the system that does statistics has no permission to see those rows at all.
  Same trick already used for private notes and the day journal.
- The rig you set before a trip (spot, lure, bait, depth) is copied onto each fish as it
  is logged, and rig history cannot be edited afterwards. Changing your lure at 3pm
  cannot rewrite what the 11am fish was caught on.
- Rows typed in from a paper log are permanently marked as such and cannot later be
  passed off as live. Weather for old days comes from an archive; where nothing covers a
  day, the fields stay empty rather than being filled with zeroes.
- Wrote the offline design that nobody owned and that the plan called the biggest risk:
  where writes are stored on the phone, how they queue up with no signal, and what
  happens if two devices disagree. Designed so the future iPhone app uses the same rules.
- Decided the iPhone project will live in this same repository. A second repository is
  how the two apps quietly drift apart.
- Files: docs/architecture/ontology.md, docs/architecture/sync-protocol.md (new),
  docs/architecture/decisions/003-web-prototype-boundary.md (new),
  docs/architecture/decisions/004-offline-store-and-sync.md (new),
  supabase/migrations/ (four new SQL files: schema, security, analytics, vocabulary lists)
- Honest notes: **I have not run the SQL.** There is no Postgres or Docker on this
  machine, so it is unexecuted and someone must run it against a real Supabase project
  before trusting it. No app code was written and nothing was looked at in a browser.
  The species and lure lists are seeded from my earlier guesses; every guess is flagged
  in the data so the founder's corrections are a small job, not a rewrite.

### 2026-08-28 | head-dev | 90m
- Reviewed and merged all three morning branches into `main`, in the order asked:
  `coo/web-slice-resequence`, `ux/calendar-notebook`, `architect/calendar-notebook`. All
  three were doc/design/schema only — no application code — so build and lint were
  expected to stay clean, and they did: `npm run build`, `npm run lint`, and
  `npx tsc --noEmit` all pass with nothing new. Every append-only conflict in
  `docs/team/WORKLOG.md` and `docs/team/CHANNEL.md` was a union of both sides, nothing
  dropped. Deleted the three merged branches and the now-stale worktrees that held them.
- Read the schema and the two new ADRs closely before merging, since the SQL had never
  been run by anyone. This machine has no Docker and no `psql`, and the Supabase CLI
  needs a database password this box does not have (and I did not go hunting for one in
  credential stores — that is a `founder`-owned secret, not something to dig for). I did
  find real, working network egress to the linked Supabase project's connection pooler,
  so the machine could reach a real database if a password existed; it just doesn't have
  one available to this session.
- **What I could still verify, honestly:** I ran all four migration files, in order,
  against a real (WASM-compiled) Postgres engine in a throwaway scratch directory —
  `@electric-sql/pglite`, not the linked Supabase project, and nothing here touched or
  reset any real project. All four applied cleanly with no syntax or dependency errors.
  I also exercised the RLS and the analytics-isolation design directly: a second angler
  reading `trip`/`catch` sees zero rows; `pooled_analyst` is denied on the base `catch`
  table but can read `analytics.catch_event`. Both behave exactly as ADR 004/§5.1 claim.
- **Two real bugs found by actually running it, not just reading it.** (1) The
  `tg_catch_resolution` trigger that auto-sets `resolved_at`/`resolved_by` only fires
  `BEFORE UPDATE`, never `BEFORE INSERT` — so inserting a catch directly as `confirmed`
  (the "full catch form" path in D22's own lifecycle diagram, not just the quick-mark
  path) fails the `catch_unresolved_is_unresolved` check unless the client also sets
  `resolved_at` itself on that insert, which is undocumented anywhere. (2)
  `journal_entry`'s `unique (angler_id, entry_date)` is a plain constraint, not
  `where deleted_at is null` — once a day's journal entry is soft-deleted, no new entry
  for that date can ever be inserted again, permanently. Confirmed both by triggering
  them for real, not by inspection alone. Neither blocks the merge (no app code depends
  on the schema yet) but both need a follow-up migration before `architect`/`head-dev`
  build the day-page or the confirm-catch flow against this schema.
- **Say the honest state of the SQL plainly: it has now been run once, against a
  throwaway local engine that is not the project's real Postgres.** It has never touched
  the actual Supabase project named in `.env.local`, has never been exercised through
  PostgREST/supabase-js the way the app will actually call it, and the two bugs above are
  proof there was real value in doing even this much — architect's document review alone
  would not have caught either one. Running it for real against the linked project still
  needs a database password nobody has handed this session.
- Files: docs/team/WORKLOG.md, docs/team/CHANNEL.md (conflict resolution only — union of
  every branch's appended entries). No other file content changed; the merge commits
  carry the rest.
- Next: (a) fix the two schema bugs above in a new migration before any logging UI is
  built against `catch`/`journal_entry`; (b) get this machine, or a machine that has one,
  a real Supabase DB password so the migrations can be pushed and verified against the
  actual project, not just a stand-in engine; (c) `architect`'s own open questions in
  `ontology.md` §8 (items 6-9) are still open.
