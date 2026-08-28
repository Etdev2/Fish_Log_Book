# Handoff

**Purpose:** hand this project to a different person or AI assistant with no prior context.
Written to be self-contained. If you are picking this up cold, read this file top to
bottom before touching anything.

**Last updated:** 2026-08-28
**Project state:** design and research complete for V1 scope. **No application code
written yet.** The Next.js app in `src/` is an unmodified starter skeleton.

---

## 1. What this project is

**Fish Log Book** — an iPhone fishing logbook that makes it effortless to record a catch,
and just as importantly a trip where you caught *nothing*, then automatically attaches the
environmental conditions at that exact moment: tide state, tide movement, moon phase,
barometric pressure, weather, location.

Over time it lets an angler search their own patterns ("every halibut I caught on a fast
outgoing tide") and eventually scores current conditions 1–10.

**The differentiator is tide correlation plus the blank trips.** Plenty of apps show tides;
plenty log catches. Almost none connect the two, and none collect the trips that caught
nothing — which are the denominator that makes any rate claim meaningful.

Business: subscription. Logging is free forever; interpretation is paid.

---

## 2. Read these, in this order

| File | What it gives you |
|---|---|
| `docs/product/SPEC.md` | **Start here.** 19 settled decisions, open questions, feature list, 11 risks. The source of truth for scope. |
| `docs/architecture/ontology.md` | The data model. Entities, two vocabularies, what is auto-captured vs typed. |
| `docs/architecture/decisions/001-canonical-ontology-shape.md` | Why the model is shaped that way, and what was rejected. |
| `docs/analysis/data-sources.md` | Verified research on every external data API. Endpoints were called live, not recalled. |
| `docs/finance/cost-model.md` | Infra costs at 1 / 1,000 / 10,000 users, pricing recommendation. |
| `docs/team/HOUSE-RULES.md` | Git protocol, quality bar, how to log work. |
| `docs/team/CHANNEL.md` | Cross-role findings. Read the entries addressed to your role. |
| `docs/team/WORKLOG.md` | What has been done, in plain English. |

**Reading the spec:** decisions are tagged **SETTLED** (decided by the founder — build on
it), **PROPOSED** (recommended, not yet approved — do not build), **OPEN** (unanswered).
Do not silently promote a proposal into a decision.

---

## 3. The single blocking question

**Nobody has defined what "uphill" and "downhill" mean.**

The founder uses these to describe current direction, with "inshore" and "offshore" as the
other two vectors — four directions total (spec D10). But *relative to what* is unresolved.
There are at least three defensible readings.

This blocks the ontology from being finalised, and it cannot be deferred: **every catch
logged under the wrong reading is mislabelled and unrecoverable**, because you cannot
reconstruct what the angler meant. Everything else in the ontology can be migrated later.
This cannot.

**Do not guess. Ask the founder.**

---

## 4. Work queue

Ordered. Each item says enough to act on without re-deriving context.

### Blocked on the founder
1. **Define uphill/downhill** (see §3). Blocks finalising the ontology.
2. **Red-pen the controlled vocabularies** in `docs/architecture/ontology.md` — species,
   lure classes, bait, structure, water clarity. These are researched guesses with `?`
   marks on the uncertain ones. The founder is an experienced angler; this is a ~20-minute
   pass. Now two passes, since saltwater and bass are both V1 (spec D18).
   *Why it matters:* anything missing from the canonical lists pushes users into custom
   fields, and custom-field data can never be pooled across users. A gap here is data
   permanently lost to the statistics.

### Ready to start
3. **Sequence the two products** — owner `coo`. Decision D18 committed to building
   saltwater and bass together rather than sequentially. There is no plan for doing that
   without producing two half-products (risk R11). This is the largest unfilled gap.
4. **Ratify pricing (O6)** — owner `ceo`. `cfo` recommends $49.99/yr + $7.99/mo. Needs a
   yes/no.
5. **Decide P6** — the correlation engine living server-side in TypeScript with thin native
   clients. Strongly recommended and currently only PROPOSED. See §5 for why it matters.
6. **Evidence threshold (O4)** — owner `biostat`. Spec D12a says the bite score refuses to
   render below a threshold. That threshold must be *computed*, not picked as a round
   number.
7. **Licence check (O9)** — owner `counsel`. `suncalc` reports no licence field on npm.
   Use `astronomy-engine` (MIT, verified) unless cleared.

### In progress at time of writing
8. **`ux-ui`** is designing the cold-start screen, the bad-conditions capture flow (O11),
   and how bass logging stays fast. Branch `ux/cold-start`. Check whether it landed.

### Not started, needed before code
9. Supabase schema and migrations, from the ontology — owner `architect`.
10. The tide engine: fetch NOAA 6-minute predictions, difference them for movement, cache
    for offline. Owner `biostat` + `head-dev`.
11. Native iOS project setup. Nothing exists yet.

---

## 5. Decisions a newcomer will want to re-litigate — don't, without reading why

- **Native Swift, not React Native.** The founder chose native after the Expo case was
  argued, because Apple Watch is a V1 target and Expo does not do watchOS. Android comes
  later as a *native* app. (Spec D15.)
  **The consequence that must not be lost:** this risks writing the statistics engine
  multiple times. P6 exists to prevent that — shared server-side engine, thin clients. If
  you are implementing and P6 has not been approved, raise it before writing any
  statistics in Swift.
- **Water temperature is manual entry.** Six buoys within 50km of the founder's spot
  disagreed by 2.1 °C at the same instant. Auto-filling would be a confident wrong number.
- **Current direction is manual entry.** There are zero NOAA current-prediction stations
  within 25km of Newport Beach. It cannot be auto-filled.
- **No machine learning on per-user data.** At 50–100 catches against a dozen variables, ML
  overfits and reports noise as signal. ML is a pooled cross-user feature, later.
- **No generic fishing advice.** The moment the app ships tips not derived from the user's
  own data, it competes with every fishing blog and loses its differentiator.
- **Logging stays free forever.** Paywalling logging starves the app of the data that makes
  it worth subscribing to.

---

## 6. Traps that will waste your time

- **NOAA station 9410583 (Balboa Pier) is a *subordinate* station.** No harmonic
  constituents, no 6-minute predictions, high/low only. Its error message blames the datum,
  which sends you debugging entirely the wrong thing. **Use 9410580 (Newport Bay Entrance)**
  — a reference station 1.7km away with full data.
- **Open-Meteo's free tier forbids commercial use.** Their own example of prohibited use is
  "apps that have subscriptions." Standard ($29/mo) excludes historical data; you would need
  Professional ($99/mo). Build on NWS `api.weather.gov` + NOAA NCEI instead, both free and
  public domain. NWS cannot backfill past ~2 days, so both are needed.
- **Store moon phase as an angle, not illumination fraction.** Illumination is symmetric —
  waxing and waning gibbous both read 0.8 — so it silently merges two different conditions.
  Also store a *signed* days-from-full so "3 days before" is distinguishable from "3 after".
- **"Tide movement" is not "current speed."** The derivative of the tide curve is a rate of
  water-level change. They correlate but are not the same quantity, and there is no nearby
  current station to calibrate against. Never label it "current" in the UI.
- **Do not run multiple agents in the same working tree.** Two did, and their commits
  collided — one agent's work landed under another's commit message and log entries were
  duplicated across branches. Use isolated worktrees.
- **`AGENTS.md` is regenerated by `next dev`.** If it shows up dirty, commit it with your
  work. Do not revert it.
- **This is Next.js 16.** Read `node_modules/next/dist/docs/` before writing App Router
  code. Do not write it from training data.

---

## 7. Working conventions

Eight specialist roles are defined in `.claude/agents/` — architect, biostat, ceo, cfo,
coo, counsel, head-dev, ux-ui. They are Claude Code subagents, but the role definitions
are plain markdown and read perfectly well as job descriptions for a human or another AI.

Git: branch as `<role>/<short-slug>`, never commit to `main`, nobody merges their own work.
Every session appends a plain-English entry to `docs/team/WORKLOG.md`. Findings another
role needs go in `docs/team/CHANNEL.md`.

**Never commit** `.env.local`, API keys, or a real user's fishing coordinates. Fishermen do
not share spots — location precision is a privacy question, not just a schema one.

---

## 8. Honest status

Design is well ahead of implementation, which is deliberate — the statistical foundations
had to be right before code locked them in. But nothing has been built or validated with a
real angler in the field, and no assumption in this repo has survived contact with a boat.

The two largest risks, both in the spec: **R1** — small per-user samples produce confident
nonsense, which is why sample sizes are shown on every claim. **R11** — building two
products at once may yield two half-products. The founder accepted R11 knowingly.
