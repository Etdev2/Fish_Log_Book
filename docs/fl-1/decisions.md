# FL-1 grill-with-docs session: who takes what

**Canonical issue:** #135 · **Date:** 2026-10-13 · **Skill:** mattpocock/skills
`engineering/grill-with-docs` (= `productivity/grilling` + `engineering/domain-modeling`).

**How this was run.** The coordinator (coo) ran the *grilling* format: it mapped a design tree,
asked the whole **frontier** each round as numbered questions with a recommended answer
(worded so that "yes" accepts it), and the expert who owns each question answered it. It only
opened the next round once every prerequisite was settled. Facts were looked up, not asked:
NOAA and CPC were queried live during the session. *Domain-modeling* output follows the repo's
`docs/agents/domain.md` layout: ADRs go to `docs/architecture/decisions/` (011, 012) and terms
go to `docs/architecture/ontology.md`. Elliott's already-settled decisions were treated as
givens, not questions: ONI history + the CPC ~9-month outlook, tides 2 years out, Kelvin wave
OUT, no Vercel deploy, no merge without independent review, and no production/Supabase changes.

**The six experts → AGENTS.md roles**

| Expert | Role (`.claude/agents/`) |
|---|---|
| Tidal oceanographer | biostat |
| Climate / ENSO scientist | biostat (2nd lane) |
| NOAA data engineer | head-dev |
| Chart / frontend dev | ux-ui |
| QA + single evidence owner | test-agent |
| Angler UX + coordinator | coo |

---

## Round 1: the frontier with no prerequisites

❓ **Q1 - Is the tide chart actually broken, or just short?** ADR 006 and `noaa-tides.ts` say
the live fetch "has NOT been run against the live service". Should we treat that as the first
fact to verify before designing anything?

➡️ Yes. Curl the exact request shape before touching code.

**NOAA data engineer:** Verified live on 2026-10-13. `datagetter` returns valid JSON for
station 9410580 for both `interval=h` and `interval=hilo`, and it sends
`access-control-allow-origin: *`, so a browser fetch works. The parser matches the live shape.
The fetch is not broken. The chart is *short*: `windowAround()` asks for −2 to +5 days, and
the only offline fallback is a fixed Aug 27 – Sep 4 fixture, so anyone who has no cache sees
August.
**Decision:** The fetch logic stays; the window and the stale labelling are the fix. *Owner:
head-dev.*

---

❓ **Q2 - What are NOAA's request limits for predictions?**

➡️ Use the documented limits, not what happens to work today.

**NOAA data engineer:** The CO-OPS API docs (api.tidesandcurrents.noaa.gov/api/prod/) list the
data-length limits as 6-minute = 1 month, hourly = 1 year, and High/Low = 1 year. A 2-year
`h` request happened to succeed live (17,520 rows), but that is undocumented behaviour.
**Decision:** Each request is at most 365 days, so 2 years = chunked requests run one after
another. *Owner: head-dev.*

---

❓ **Q3 - Hourly for two whole years?** 2 years of hourly points is ~17.5k points per station
in localStorage and a 2-year-wide SVG.

➡️ No. Fetch hourly only for the near week, and **high/low turns** for the full 2 years.

**Tidal oceanographer:** Predictions are harmonic (astronomical), so a high/low computed for
2028 is as good as one computed for tomorrow (it is still `MODEL_ANALYSIS`, never `SENSOR`).
Between the turns, the existing Fritsch–Carlson monotone interpolant (`core/rules/tide/height.ts`)
cannot overshoot a published high or low, so a turns-only curve is honest. It is smoother than
the hourly curve and misses shoulders such as the mixed-semidiurnal "stand", which is
acceptable for planning beyond a week.
**Decision:** Hourly from −2 to +7 days, hilo from −2 days to +2 years, merged with the
existing `mergeSamples`. That is ~2.9k points per station (~80 KB cached). → **ADR 011.**
*Owner: biostat (tides) and head-dev.*

---

❓ **Q4 - Which ENSO index is the "truth"?** Elliott said ONI. CPC's October 2026 outlook is now
*verified against the Relative ONI (RONI)*, and RONI and ONI differ (JAS 2026: ONI +2.16,
RONI +1.69).

➡️ Ship **ONI v5** history (Elliott's decision), take the outlook probabilities from CPC as
published, and show both index names in the source line.

**Climate/ENSO scientist:** Agreed. The episodes come from ONI v5 using CPC's classic rule:
≥ +0.5 °C (El Niño) or ≤ −0.5 °C (La Niña) for ≥ 5 consecutive overlapping seasons. The
outlook is CPC's 9 seasons of probabilities as published (RONI-based). Switching history to
RONI is a decision for Elliott, recorded as open.
**Decision:** ONI v5 history and the CPC outlook as published. Flag RONI to Elliott.
→ **ADR 012.** *Owner: biostat (ENSO lane).*

---

## Round 2: unblocked by Q1–Q4

❓ **Q5 - How does a 2-year series fit a chart built for a week?**

➡️ Keep `TideTimeline` unchanged and feed it a **view window**: a 7-day slice of the series,
re-sliced when the angler jumps to a date.

**Chart/frontend dev:** Rendering 2 years at the current pixels-per-hour would be a chart
hundreds of thousands of pixels wide, with daylight spans for every day. A pure
`sliceSeries()` plus a `Jump to date` control (min/max = the loaded range) is the smallest
change. The calendar sheet keeps working inside the slice.
**Decision:** View-window slicing plus a date jump. *Owner: ux-ui.*

---

❓ **Q6 - Is the stale or fixture state visible enough?** Today the provenance label lives only
inside the Station sheet.

➡️ Yes, it needs to be visible: put a banner above the chart whenever the source is the
fixture or a stale cache.

**Angler UX:** Someone in the marina has to see "this is an old sample" without opening a
sheet. A confident wrong tide is the worst failure (`use-tide-series.ts`).
**Decision:** An always-visible stale banner using the existing `tideSourceLabel()`.
*Owner: ux-ui, reviewed by coo.*

---

❓ **Q7 - What does "shade El Niño" look like on a week-wide chart?**

➡️ An **ENSO ribbon** above the chart that spans the whole loaded range month by month:
observed episodes solid, outlook months tinted by the dominant probability, and the months
past the outlook grey ("no forecast"). A marker shows the week on screen, and a legend and
source line sit underneath.

**Climate/ENSO scientist:** A week is always entirely inside one ENSO state, so shading only
the visible week says nothing. The ribbon shows the years-out context Elliott asked for and
is honest about where the forecast stops.
**Chart/frontend dev:** It is a separate component, so it does not change `TideTimeline` and
does not conflict with lane 3.
**Decision:** `EnsoRibbon`, with a month marked as "outlook El Niño" when P(El Niño) ≥ 50%,
"outlook La Niña" when P(La Niña) ≥ 50%, and neutral otherwise. *Owner: ux-ui and biostat.*

---

## Round 3: delivery

❓ **Q8 - Branches and stacking?** Lanes 3 and 4 both touch `tide-screen.tsx`.

➡️ Use three PRs: `fl1/fix-homepage-link` (README, this doc, ADRs), `fl1/tides-2yr` off `main`,
and `fl1/enso-shading` **stacked on** `fl1/tides-2yr`, so that nobody edits another lane's lines.

**Coordinator:** Accepted. Never commit to a closed PR's branch.
**Decision:** As recommended. *Owner: coo.*

---

❓ **Q9 - Evidence and the freeze?**

➡️ test-agent is the single evidence owner. It posts `npm run verify` results and the CI links
for each PR on #135. Every lane ACKs a write-freeze before the final status.

**QA:** The evidence is `npm run verify` locally plus the GitHub `verify` check per PR, plus a
live NOAA curl transcript.
**Decision:** As recommended. *Owner: test-agent.*

---

❓ **Q10 - The homepage link?** GitHub's "Website" field is a repo setting.

➡️ Try the API. If the app cannot change it, ship the README link and ask Elliott to change
the field.

**Coordinator:** The API returned 403 "Resource not accessible by integration". → Elliott has
to change the field (Settings → General → Website).
**Decision:** README PR plus a manual step for Elliott. *Owner: coo.*

---

**Frontier empty.** Open for Elliott: (1) whether to switch the history to RONI; (2) the
GitHub Website field; (3) a Vercel deploy after review (not authorised in FL-1).
