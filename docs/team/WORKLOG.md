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
