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
