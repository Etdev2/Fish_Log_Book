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
