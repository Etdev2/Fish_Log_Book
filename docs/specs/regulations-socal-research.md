# Southern California ocean sport fishing regulations — research findings

**Researched:** 2026-09-01 · **Role:** biostat (Regulations/Data lead)
**Jurisdiction under study:** California ocean sport fishing, Southern Management Area
**Companion documents:** `docs/specs/regulations-data-model.md` (field semantics, this author),
`docs/specs/regulations-architecture.md` (system design, architect)

---

## 0. READ THIS BEFORE USING ANY NUMBER IN THIS FILE

> **Not one value in this document was read from an official source.**
>
> Every official domain needed for this research is blocked by this environment's egress
> policy. Direct fetches to `wildlife.ca.gov`, `www.wildlife.ca.gov`, `nrm.dfg.ca.gov`,
> `fgc.ca.gov`, `data.ca.gov`, `gis.data.ca.gov`, `fisheries.noaa.gov`, `pcouncil.org`,
> `ecfr.gov` and `cdfwmarine.wordpress.com` all fail with HTTP 403 at the proxy CONNECT
> stage. Per `/root/.ccr/README.md` a 403 is an organization egress denial and must be
> reported rather than routed around, so I reported it rather than working around it.
>
> The only research channel that functioned was web *search*, which returns a search
> engine's **summary** of a page, attributed to a URL. A summary is not the regulation.
> Summaries in this session demonstrably mixed regulation years — see §4.2, where one
> search reported a 1-fish quillback sub-limit (the 2023-era rule) and another reported
> zero retention (apparently current). That is exactly the failure mode this project
> cannot ship.
>
> **Therefore every record derived from this file must carry
> `verification_status: "unverified"`, and the app must render it as "we have not
> confirmed this — check CDFW" and never as a bag limit.** The tables below are a
> *work order for a verification pass with network access*, not a dataset.

---

## 1. Evidence tiers used in this document

| Tier | Meaning | Fit for shipping? |
|---|---|---|
| **A — primary** | Text read directly from an official document or page. | Yes, with `verification_status: "verified"`. |
| **B — attributed summary** | A search engine's paraphrase, attributed to a named official URL. Not read. | **No.** Ships only as `"unverified"`, hidden behind a "not confirmed" UI state. |
| **C — conflicted** | Two or more Tier-B summaries disagree, or the value is plainly from a superseded year. | **No.** Ships as `null` + `"unverified"`. |
| **D — third party** | A blog, forum, charter or tackle site. | **Never.** Used only to learn a rule's *name*, then re-verified. |

**Tier A count for this session: 0.** Everything below is Tier B, C or D.

One Tier-D use is disclosed: an early unrestricted search surfaced `fishcity.app` (a
third-party app) claiming "canary rockfish — 2 fish, reopened for 2026, previously
prohibited". That claim is **not** carried forward as a value; it is recorded in §11 only
as a question to verify, because "canary was previously prohibited" contradicts my prior
understanding and is precisely the kind of thing worth checking. No number in the tables
below comes from a third-party source.

---

## 2. The verification work order (do this first, with network access)

These are the URLs a verification pass should fetch, in priority order. All were returned
by search as official CDFW / Fish and Game Commission / federal documents.

| # | Document | URL | Why it matters |
|---|---|---|---|
| 1 | 2026 California Ocean Sport Fishing Regulations (booklet) | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=239985` | The master species table: every bag, possession and size limit. Single highest-value document. |
| 2 | 2026 Southern Management Area — Summary of Recreational Bottom Fishing Regulations | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=185058` | The Southern-area groundfish one-pager: RCG limit, sub-limits, depth lines, season windows. |
| 3 | Summary of Recreational Groundfish Fishing Regulations | `https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary` | CDFW's maintained groundfish summary, updated in-season. |
| 4 | Current CA Ocean Recreational Fishing Regulations — Southern Region | `https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern` | Region-scoped species table; search reported "updated July 1, 2026". |
| 5 | General Ocean Fishing Regs | `https://wildlife.ca.gov/Fishing/Ocean/Regulations/Sport-Fishing/General-Ocean-Fishing-Regs` | Statewide rules; search reported "updated July 24, 2026". |
| 6 | FGC Item No. 6 Staff Summary, Feb 11–12 2026 | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=241205` | 2026 groundfish rulemaking rationale — explains *why* limits are what they are. |
| 7 | FGC Finding of Emergency (2026) | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=241236` | Live emergency regulation. Must be checked for anything currently overriding the booklet. |
| 8 | Emergency Regulatory Language for Re-adoption | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=241237` | Re-adoption of an emergency rule — tells us whether an override is still in force. |
| 9 | FGC Item No. 22B Staff Summary, Aug 12–13 2026 | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=247077` | Most recent Commission action found; white seabass rulemaking. |
| 10 | 50 CFR 660.70 — Groundfish conservation areas | `https://www.ecfr.gov/current/title-50/chapter-VI/part-660/subpart-C/section-660.70` | Legal lat/long for the Cowcod Conservation Areas. |
| 11 | 50 CFR 660.71+ — depth-line coordinates | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=221972` | The waypoint list defining the fathom boundary lines. |
| 12 | CCR T-14 §35.00 | (CCR — see §9.3) | State definition of the 20-fathom boundary line. |

---

## 3. Management area boundary

**Southern Management Area / Southern Region** — reported definition:

> From **34°27′ N latitude (Point Conception, Santa Barbara County)** south to the
> **U.S.–Mexico border**. Includes part of Santa Barbara County and all of Ventura,
> Los Angeles, Orange and San Diego counties.

- Evidence tier: **B**. Source: search summary attributed to
  `https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern`.
- The founder's brief said "Point Conception south to the US/Mexico border". That is
  **consistent** with what search reported, and the useful addition is the numeric
  latitude `34°27′ N` — a machine-usable value rather than a place name. It still needs
  Tier-A confirmation, including whether the regulation says `34°27′00″` exactly and
  whether the offshore terminus is the state-water line, the EEZ, or an unbounded
  westward extent (**unconfirmed — see §11**).
- Note the vocabulary trap for the schema: CDFW's *groundfish* "Southern Management Area"
  and CDFW's *general* "Southern Region" appear to share this boundary but are named
  differently in different documents, and other rules (e.g. California halibut) are split
  at **Point Sur**, not Point Conception. **A management area is per-rule, not global.**
  The data model treats `management_area` as a reference to a named boundary, and permits
  different rules for the same species to cite different boundaries.

---

## 4. Groundfish / the RCG complex

### 4.1 The aggregate

Reported: the **RCG complex** (Rockfish, Cabezon, Greenling) carries a **10 fish in
combination per person daily bag limit**, with per-species sub-limits nested inside it.

- Evidence tier: **B**. Attributed to CDFW/FGC 2026 management-area summaries.
- Reported sub-limits (all Tier B, and see §4.2 for the conflict):
  - Copper rockfish — **1** fish
  - Vermilion / sunset rockfish — **2** fish **combined**
  - Canary rockfish — **2** fish
- The "vermilion/sunset combined" phrasing is important and is why the data model needs a
  sub-limit that can name a *set* of species rather than one: sunset rockfish
  (*Sebastes crocotulus*) is a recent split from vermilion (*S. miniatus*) and anglers
  cannot reliably tell them apart. See `regulations-data-model.md` §4.
- One search summary stated the Southern area is specifically "constrained by limits on
  copper rockfish and vermilion/sunset rockfish" relative to areas north of Point
  Conception. Tier B; treat as context, not as a rule.

### 4.2 Zero-retention species — and a documented conflict

Reported (Tier B, and consistent across two independent searches):

> The limit for **bronzespotted rockfish, cowcod, quillback rockfish and yelloweye
> rockfish is zero**. These species shall not be taken or possessed as part of the RCG
> limit, and may not be taken or possessed in California waters.

**The conflict, recorded deliberately:** a separate search summary — also attributed to
official documents — reported "a **1-fish sub-bag limit for quillback rockfish** is in
place within the 10-fish RCG daily bag limit". Two Tier-B sources, opposite answers.

The most likely reconstruction (**and it is a reconstruction, not a finding**) is that the
1-fish figure is the pre-August-2023 rule and the search engine surfaced a stale document.
A third summary reported that quillback retention was **prohibited statewide effective
Aug 7** (CDFW news item `wildlife.ca.gov/News/Archive/quillback-rockfish-retention-prohibited`)
and that a later August 2025 emergency action *restored fishing depths* previously closed
to protect quillback while **explicitly not reopening quillback retention**. That coheres
with zero retention today.

**Resolution: none.** Quillback ships as `zero_retention` **only if** Tier-A confirmed;
until then it ships as `unknown`, because guessing "zero" and guessing "one" are both
guesses and the app must not do either. This single item is the clearest argument in the
whole research pass for the `unknown` / `zero-retention` / `no-limit` three-way
distinction in the data model.

### 4.3 Depth constraints and season

Reported fragments, all Tier B, and **mutually hard to reconcile**:

- "Take or possession of all species of rockfish (except as specified), lingcod, cabezon
  and all greenlings is authorized **shoreward of the 20-fathom boundary line** from
  **May 1 through September 30 and November 1 through November 30**."
- "For **October 1 – December 31**, take is prohibited **shoreward of the 50-fathom
  (300 ft) Rockfish Conservation Area boundary line**." — note this reads as *prohibited
  shoreward*, i.e. an inverted constraint relative to the line above, which is unusual
  enough that it is very likely a mis-paraphrase of "seaward" or a different area.
- "The open season in these GMAs runs **April 1 through December 31**."
- "A 20-fathom (~120 ft) or 50-fathom (~300 ft) *inshore only* fishery and an *all-depth*
  fishery allow opportunities to retain nearshore, shelf and slope rockfish, lingcod,
  cabezon and greenling."
- **Eight Groundfish Exclusion Areas (GEAs)** restrict fishing within their boundaries.

These fragments cannot all be true of the same area in the same year. At least one is
from a different management area or a different season year. **Depth and season for the
Southern Management Area are therefore recorded as `unknown`, and today's open/closed
status is `unknown`.** I will not tell an angler the season is open.

**How the depth lines are defined** — this part is consistent and is the genuinely useful
structural finding:

| Line | Defined in | Form |
|---|---|---|
| 20-fathom boundary line | **CCR Title 14 §35.00** (state) | An ordered list of latitude/longitude **waypoints**, not a bathymetric contour. |
| 50-fathom boundary line / RCA | **50 CFR Part 660, Subpart C/G** (federal) | Likewise a series of connected waypoints. |
| Cowcod Conservation Areas (Western + Eastern) | **50 CFR §660.70** | Lat/long polygons. |

**This is the single most important structural fact for the app.** A "20-fathom line" is
*not* "where the water is 20 fathoms deep". It is a fixed legal polyline of published
waypoints that only approximates that depth. An app that computes depth from a bathymetry
raster and compares it to 20 fathoms will give a legally wrong answer near the line.
The data model therefore stores depth constraints as a **reference to a named boundary
geometry**, and stores the nominal fathom figure as a *label only*. See
`regulations-data-model.md` §7.

---

## 5. Species findings

Every row is Tier B or C. `verification_status` is `unverified` for all of them.
Sizes are given as the **published string** first because that is the legally citable
form; the SI value is the app's computed form (see `regulations-data-model.md` §3).

### 5.1 Values with a reported figure (still unverified)

| Species (ontology id) | Reported value | Published form | Tier | Note |
|---|---|---|---|---|
| `rockfish` (RCG aggregate) | 10 fish/person/day in combination | "10 fish in combination" | B | Sub-limits §4.1. Possession limit **not found**. |
| `lingcod` | 2 fish/day; min 22 in total length | "22 inches total length" | B | 558.8 mm exact; see model §3 on rounding. |
| `cabezon` | Minimum size **repealed** for 2025–26 | — | C | Reported as a repeal of the min size for cabezon, greenlings and CA scorpionfish. Bag limit is inside the RCG 10. |
| `california_scorpionfish` | Min 10 in — **but reported repealed** | "10 inches" | C | Two summaries conflict: one gives a 10 in minimum, another says the minimum was repealed for 2025–26. Ships as `unknown`. |
| `california_sheephead` | **Boat-based take closed January and February** south of Point Conception; divers and shore anglers year-round | — | B | The best mode-dependence example found; drives `fishing_mode`. Bag/size **not found** (a "13 in" figure found was *commercial nearshore*, not recreational — discarded). |
| `california_halibut` | Min 22 in total length; **5 fish** south of Point Sur | "22 inches total length" | C | The summary said "possession limit of five"; other phrasing implies a daily bag of five. Bag vs possession is **ambiguous in the source summary** and they are different fields. Ships as `unknown` for both until separated. Note the boundary is **Point Sur**, not Point Conception. |
| `white_seabass` | Min 28 in total length; 3 fish daily bag and possession | "28 inches (71 cm) total length" | B | Search **could not find** the seasonal reduction to 1 fish (Mar 15 – Jun 15) that I asked about directly — see §11. A rulemaking to raise the minimum size is reported as pending, adoption expected **Feb 2027**, i.e. not in force today. |
| `kelp_bass` | Min 14 in total length | "14 inches (356 mm) total length" | B | Bag limit **not found** separately from the bass aggregate. |
| `barred_sand_bass` | Min 14 in total length; **temporary bag and possession reduction to 4 fish, July 2025 – June 2028, barred sand bass only** | "14 inches total length" | B | **The most operationally important find in the set.** A time-boxed rule that expires mid-2028, applying to one species inside what anglers think of as a three-species aggregate. Exactly the case `effective_from`/`effective_until` exist for. |
| `spotted_sand_bass` | Min 14 in total length | "14 inches total length" | B | Bag limit not found. |
| `garibaldi` | Protected; illegal to take or possess without a CDFW permit | — | B | `zero_retention`, not `unknown`. Matches `takeStatus: "protected"` already in the ontology. |

### 5.2 Species for which **no value at all** was obtained

`yellowtail`, `pacific_barracuda`, `pacific_bonito`, `bluefin_tuna`, `yellowfin_tuna`,
`dorado`, `thresher_shark`, `leopard_shark`, `bat_ray`, `opaleye`, `sargo`,
`pacific_sanddab`, `california_corbina`, `barred_surfperch`, `walleye_surfperch`,
`yellowfin_croaker`, `spotfin_croaker`, `white_croaker`, `queenfish`, `halfmoon`,
`jacksmelt`, `round_stingray`, `shovelnose_guitarfish`, `horn_shark`, `pacific_mackerel`,
`jack_mackerel`.

That is **26 of the ~38 species in the ontology with nothing usable**. All are `unknown`.

Two of these deserve a specific flag for the verification pass:
- **`bluefin_tuna`** is managed under a federal/international framework (IATTC quota,
  NOAA implementation) layered on top of state rules, and has historically been subject
  to **in-season closure by announcement**. It is the most likely species in the list to
  be wrong on any given day. Treat it as high-churn.
- **`thresher_shark`** and **`leopard_shark`** have size limits in my recollection that I
  am deliberately not writing down, because an unverified shark size limit is the kind of
  number that gets someone cited.

### 5.3 Named rockfishes for the ID wizard — a blocking ontology gap

The brief lists twenty named rockfishes (vermilion, canary, yelloweye, copper, quillback,
gopher, black, blue, olive, starry, china, bocaccio, chilipepper, widow, greenspotted,
honeycomb, treefish, brown, calico rockfish, cowcod) and says to reuse the ids from
`src/core/ontology/species.ts` verbatim.

**None of them exist.** `src/core/ontology/species.ts` contains exactly one rockfish
entry, the group `rockfish` (*Sebastes* spp., `isGroup: true`). I verified this by reading
the file and by grepping the whole repo (including `supabase/migrations/`) for
`vermilion`, `yelloweye`, `bocaccio`, `cowcod` and `quillback` — zero hits.

I did **not** invent ids, because the ontology is seeded from
`supabase/migrations/20260828120300_v1_seed_vocabularies.sql` and guarded by a test that
fails when the two disagree; minting ids in a spec would create a second source of truth
for a vocabulary that ADR 001 says has one. This is an escalation to `architect` /
`head-dev`, not a decision for this lane.

**Consequence for sequencing:** the per-species rockfish sub-limits in §4.1 are
*unrepresentable* today. There is no `vermilion_rockfish` id to attach "2 fish" to. The
species vocabulary must gain the named rockfishes **before** the RCG sub-limit records can
be written. The recommended id convention, for whoever owns that change, is
`<common_name_snake_case>` consistent with existing entries — e.g. `vermilion_rockfish`,
`copper_rockfish`, `yelloweye_rockfish` — each with `rollsUpTo: "rockfish"`, mirroring how
`barred_surfperch` rolls up to `surfperch`.

---

## 6. Length measurement basis

Reported (Tier B): CCR Title 14 **§1.62** defines fish measurement, historically as
**total length**, **fork length** and **alternate length**. A proposed regulatory change
reported in the search results would **remove "alternate length"** on the grounds that it
"causes unnecessary confusion and concerns with law enforcement", with minimum fillet
lengths making it unnecessary.

Practical consequences the data model must absorb:
1. CDFW uses **more than one basis**, so a size limit without its basis is not actionable.
   `22 inches total length` and `22 inches fork length` are different fish.
2. `alternate length` may be **mid-repeal**, meaning the set of valid bases is
   itself time-varying. The basis field must be an open enum with an `unknown` member,
   not a closed union that a rulemaking can invalidate.
3. Some species have **fillet length** rules, a fourth kind of measurement applying to a
   processed fish. Recorded as a `special_conditions` entry, not a size limit.

Every size limit in §5 above is recorded with a basis where the source stated one, and
`unknown` where it did not. Note that **`white_seabass`, `california_halibut`, `lingcod`,
`kelp_bass`, `barred_sand_bass` and `spotted_sand_bass` were all reported as *total
length***, which is consistent, but each still needs Tier-A confirmation.

---

## 7. Boundary and MPA geodata

**Good news: California publishes machine-readable boundaries, openly licensed and in the
formats the app wants.** These URLs were returned by search as official CDFW / California
State Geoportal datasets. None were fetched (egress blocked), so the exact schema and
current file URLs are unconfirmed.

| Dataset | Portal URL | Reported formats |
|---|---|---|
| California Marine Protected Areas `[ds582]` | `https://data.ca.gov/dataset/california-marine-protected-areas-ds582` and `https://gis.data.ca.gov/datasets/CDFW::california-marine-protected-areas-ds582` | **Shapefile (ZIP), GeoJSON, KML, CSV, ArcGIS GeoServices** |
| MPA Coordinates — R7 — CDFW `[ds3207]` | `https://data.ca.gov/dataset/marine-protected-areas-coordinates-r7-cdfw-ds3207` | Shapefile, GeoJSON, KML. Coordinates **extracted from CCR §632** — i.e. the legal text, not a drawn map. |
| MPA long-term monitoring bioregions `[ds3179]` | `https://gis.data.ca.gov/maps/CDFW::marine-protected-areas-long-term-monitoring-bioregions-r7-cdfw-ds3179` | ArcGIS |
| CDFW Marine Region GIS landing page | `https://wildlife.ca.gov/Conservation/Marine/GIS` | index |
| Southern California MPA network | `https://wildlife.ca.gov/conservation/marine/mpas/network/southern-california` | narrative + maps |
| NOAA Groundfish Conservation Areas geodatabase | `https://www.fisheries.noaa.gov/resource/map/groundfish-conservation-areas-maps-and-gis-data-west-coast-region` | File geodatabase, static maps. Includes Cowcod Conservation Areas. |
| Cowcod CCA map (CDFW) | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=36132` | PDF map (not machine-readable) |

Three things to carry into the architecture:

1. **`ds3207` is the one to prefer where it covers the need**, because its coordinates are
   extracted from the regulation text (CCR §632). `ds582` is CDFW's cartographic
   *representation*. When the map and the regulation disagree, the regulation wins.
2. **CDFW attaches an explicit disclaimer** to `ds582`: *"not intended for navigational use
   or defining legal boundaries."* That disclaimer has to survive into the product. An
   app that draws an MPA polygon and says "you are outside the reserve" is making a legal
   claim CDFW itself declines to make. UX copy must be "approximate — this is not a legal
   boundary; confirm before you fish". Flag to `counsel` before any map ships.
3. **`ds582` was reported as current "as of January 1, 2019."** If accurate, the MPA
   dataset is over seven years stale relative to today and CCR §632 has almost certainly
   been amended since. Check the dataset's own `source_updated_at` before trusting it —
   this is exactly why `source_updated_at` and `verified_at` are separate fields.

**Actual coordinates obtained: none.** I could not retrieve a single boundary vertex for
the Southern Management Area line, for the 20- or 50-fathom lines, or for any San Diego /
Los Angeles / Orange County MPA, because every hosting domain is blocked. The brief asked
for 3–5 named MPAs with coordinates; I have zero. Named MPAs in the target area exist and
are well known, but naming them from memory without their legal coordinates would be worse
than useless, so this section deliberately contains no MPA names.

---

## 8. How in-season and emergency changes are announced

This is the update pipeline, and it is the part of the research that came out cleanest.
Four distinct channels, in descending order of usefulness for automation:

| Channel | URL | Character |
|---|---|---|
| **Marine Management News** (CDFW Marine Region blog) | `https://cdfwmarine.wordpress.com/` and the regulations category `.../category/regulations/` | The de-facto announcement feed for in-season changes. WordPress, so **an RSS/Atom feed almost certainly exists** — this is the highest-value automation target. Posts observed dated 2026-08-19, 2026-07-17, 2026-04-13. |
| **Marine Region News Service** (email) | `https://wildlife.ca.gov/marine-subscribe` | Subscription: regulation updates, news releases, public-meeting notices, new blog posts. Human-in-the-loop channel; good for a maintainer, not for a scraper. |
| **CDFW News archive** | `https://wildlife.ca.gov/News/Archive/...` | Individual regulation news items, e.g. the quillback prohibition notice. Stable per-item URLs, good as a `source_url`. |
| **Fish and Game Commission agendas / staff summaries / Findings of Emergency** | `https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=...` | Where a change is *decided*, weeks before it takes effect. Watching this gives lead time; the numbered `DocumentID` scheme is opaque and not enumerable, so this needs the FGC meeting-agenda index as an entry point. |
| **Marine Resources RSS** | `https://nrm.dfg.ca.gov/documents/rss/RssHandler.ashx?cat=Marine` | A real RSS endpoint returned by search. Worth testing first — it may be the cheapest reliable trigger. |

Two structural observations:

- **There is no regulations API.** No JSON endpoint publishes bag limits. Everything is
  PDF, HTML, or a Word-derived document. Any pipeline is a scrape plus human review, and
  should be designed as *"detect that something changed and alert a human"* rather than
  *"parse the new limit and ship it"*. Auto-parsing a bag limit out of a PDF and pushing
  it to anglers is a liability the product should not take on.
- **Precedent for closure-by-phone-line.** CDFW runs an Ocean Salmon Regulations Hotline
  ((707) 576-3429) and advises anglers to check before a trip because in-season action can
  close days or areas when harvest approaches a guideline. A rule can therefore change
  faster than any document we scrape. That is an argument for the app always showing
  `source_updated_at` / `verified_at` and a "check CDFW before you fish" line — not for
  trying to win the race.

---

## 9. Regulation citation forms encountered

Useful for the `source_reference` field's shape.

1. **State statute/regulation:** `CCR Title 14 §28.55(b)(1)`, `§35.00`, `§1.62`, `§632`,
   `§27.20`, `§28.30`, `§150.16`, `§1.91`. Form: `CCR T14 §<section>[(<subsection>)]`.
2. **Federal:** `50 CFR §660.70`, `50 CFR Part 660 Subpart C`, `Subpart G`. Form:
   `<title> CFR §<section>` or `<title> CFR Part <part> Subpart <letter>`.
3. **Commission action:** `FGC Item No. 6, Feb 11–12 2026`; `Finding of Emergency`;
   `OAL approval effective February 12, 2024`. These are the *instruments that change* the
   sections above and carry the effective date.

The model therefore stores `source_reference` as free text plus optional structured parts,
rather than assuming a single citation grammar — a second jurisdiction will not use CCR.

---

## 10. What the ontology already gets right

`src/core/ontology/species.ts` has a `takeStatus` of `"open" | "protected" | "regulated"`.
That is a *species-level editorial hint*, and it should stay that way. It is **not** a
regulation and must never be used to answer "can I keep this fish". `garibaldi` is
`"protected"`, which happens to be right, but `takeStatus` has no jurisdiction, no date, no
mode and no area — it cannot express "sheephead, boat, January, south of Point Conception".
The regulation records are the answer; `takeStatus` is a sort order and a badge colour.
Worth saying explicitly to `ux-ui` so the two never get wired together.

---

## 11. COULD NOT VERIFY

Classified as the COO asked: **UNKNOWN** (we don't know the value), **NOT APPLICABLE**
(the concept doesn't apply to this species/rule), **ZERO RETENTION** (the value is known
and it is "you may not keep this"). The app must render all three differently — see
`regulations-data-model.md` §5.

### 11.1 Blocking, whole-category

| Gap | Class | Why |
|---|---|---|
| **Every single value in this document** | UNKNOWN | Zero Tier-A reads. Egress policy blocks all official domains. Nothing here is confirmed. |
| **Whether any species is open TODAY (2026-09-01)** | UNKNOWN | Follows from the season conflict in §4.3. The app must answer "we don't know" for open/closed status on every species until a verification pass runs. |
| **All possession limits, for every species** | UNKNOWN | Not one possession limit was obtained. Search consistently returned bag limits, and in one case (halibut) used "possession" and "bag" interchangeably — which is precisely why they are two fields. |
| **Boundary coordinates — all of them** | UNKNOWN | Southern Management Area line, 20-fathom line, 50-fathom line, CCAs, GEAs, every MPA. Zero vertices obtained. |
| **Diving / spearfishing differences** | UNKNOWN | Only one mode-dependent rule surfaced (sheephead, §5.1). Whether the RCG limits, lingcod, or the bass complex differ by mode is unknown. Do **not** assume "same as boat". |
| **Shore-based differences** | UNKNOWN | Same. Shore anglers are frequently exempt from depth constraints they cannot physically reach, but "frequently" is not a regulation. |

### 11.2 Specific values

| Item | Class | Detail |
|---|---|---|
| Quillback rockfish retention | UNKNOWN (candidate ZERO RETENTION) | Two official-attributed summaries directly conflict, §4.2. Ships `unknown` until resolved. |
| Southern Management Area depth constraint | UNKNOWN | Three irreconcilable Tier-B fragments, §4.3. |
| Southern Management Area 2026 season windows | UNKNOWN | Same. |
| Canary rockfish 2-fish sub-limit | UNKNOWN | Reported Tier B, but the accompanying third-party claim ("previously prohibited") contradicts my prior understanding, which means one of the two is wrong and I cannot tell which. |
| California scorpionfish minimum size | UNKNOWN | 10 in vs "repealed for 2025–26". Conflict. |
| Cabezon minimum size | UNKNOWN (candidate NOT APPLICABLE) | Reported repealed. If truly repealed, the correct record is *no minimum size* — which is `no-limit`, **not** `null`. Distinguishing these needs Tier A. |
| California halibut — bag vs possession | UNKNOWN | Source summary conflated the two. "5 fish" may be either. |
| White seabass seasonal 1-fish reduction | UNKNOWN | I searched for it directly. Search **did not find** it and said so. Absence of evidence in a blocked-egress session is not evidence of absence; it stays `unknown` rather than being recorded as "no seasonal reduction". |
| White seabass minimum-size rulemaking | Context, not a value | Reported pending, adoption expected **Feb 2027**. Not in force today. Recorded so a future `effective_from` is anticipated. |
| Kelp bass / spotted sand bass bag limits | UNKNOWN | Only barred sand bass's temporary 4-fish figure surfaced. Whether the other two are still at their prior limit is unconfirmed. |
| California sheephead bag and size limits | UNKNOWN | Only the Jan–Feb boat closure surfaced. A "13 in" figure found was **commercial**, and was discarded rather than reused. |
| Cowcod / yelloweye / bronzespotted | UNKNOWN (strong candidate ZERO RETENTION) | Two independent Tier-B summaries agree on zero. That is the best-supported claim in this document and still is not Tier A. |
| Garibaldi | UNKNOWN (strong candidate ZERO RETENTION) | Reported protected, permit required. |
| The 26 species in §5.2 | UNKNOWN | No value of any kind obtained. |
| Named rockfish species ids | NOT APPLICABLE *(to this lane)* | They do not exist in the ontology, §5.3. This is a vocabulary change owned by architect/head-dev, not a research gap. |
| Whether "alternate length" is currently valid | UNKNOWN | Mid-repeal per §6. |
| MPA dataset currency | UNKNOWN | `ds582` reported as "as of January 1, 2019", seven years stale. Unconfirmed whether a newer vintage exists. |

### 11.3 What I refused to write down

For the record, so a reviewer can see the shape of the omission: I hold remembered figures
for several of the §5.2 species — thresher and leopard shark size limits, yellowtail and
barracuda minimums, bluefin bag limits, the surfperch and croaker limits. **None of them
are in this document.** My training data predates today and, as §4.2 demonstrates with
quillback, the recalled value and the current value differ often enough that recall is not
evidence. A missing limit that the app labels "we don't know — check CDFW" sends an angler
to look it up. A remembered limit that is two seasons stale sends them home with an
illegal fish.
