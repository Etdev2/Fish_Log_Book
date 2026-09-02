# Southern California Rockfish Identification — reference data and decision tree

**Owner:** biostat (species-identification data lane) · **Date:** 2026-09-01
**Status:** draft for implementation · **Scope:** *biology only*
**Explicitly out of scope:** bag limits, sub-limits, size limits, season dates, depth
closures. Those belong to `docs/specs/regulations-data-model.md` and
`docs/specs/regulations-socal-research.md` and are owned by another agent. Nothing in
this file states a legal number. Where this file says "legal risk", it means *"getting
this one wrong is expensive"* — not *"here is the rule"*.

---

## 0. What this feature is, and the honest claim it may make

An angler holding a rockfish answers a handful of simple visual questions and gets a
**ranked list of candidate species with a feature-match percentage**.

The percentage is **not** a probability that the fish is that species. It is the share of
the *weighted characters the angler actually answered* that match our reference
description of that species. We have no labelled, verified photo dataset of SoCal
rockfish caught by our users, therefore we cannot calibrate a probability, therefore we
must not print one. The distinction matters: a "78%" that means "matches 78% of what you
told us" is honest; a "78%" that the user reads as "78% chance it's a vermilion" is a
citation waiting to happen.

Required UI framing (for `ux-ui` to translate):

> **Feature match, not a positive ID.** This shows how well each species fits the
> features you described. It is not a probability, and it cannot see your fish. If two
> species are close, assume the more restricted one.

The app must **never** display a single species as "identified". The minimum output is a
ranked list with the top candidate's discriminating character spelled out so the angler
can go check it on the fish in their hand.

---

## 1. Verification standard, and an important limitation

**Limitation, stated up front:** outbound page fetching is blocked in this working
environment. Every trait below was verified against the *content returned by web search
over authoritative sources* (CDFW / CA Marine Species Portal, NOAA Fisheries and NOAA
archive rockfish guides, WDFW and ODFW ID material, FishBase, ADF&G, and the
long-standing California angler references pierfishing.com / kenjonesfishing.com for
colloquial names). I could not open the source PDFs directly and read them line by line.

Consequences, and they are not cosmetic:

- Traits below are **second-hand verified**, not primary-source verified. Before this
  data ships, one person should open the CDFW ID flyers and the RecFIN "Identification of
  Common Groundfish Species of Central and Southern California" sheet and check the
  `discriminators` field for each species. That is a ~1 hour job and it is the single
  highest-value review in this initiative.
- Anywhere I could not verify a trait, the JSON has `null`. There are a lot of `null`s.
  That is correct behaviour. A wrong field mark on a yelloweye is exactly the failure this
  feature exists to prevent, so a gap stays a gap.
- Section 8 lists everything I could not verify.

---

## 2. The question axes

Fixed, in the order the wizard should present them (which is *not* the order of their
evidential weight — see §4).

| # | axis | answers |
|---|------|---------|
| 1 | `primary_color` | red · orange · brown · black · blue · yellow · olive/green · pink · white/pale · mottled/patterned · **Not sure** |
| 2 | `spots_blotches` | yes (+ pattern picker) · no · subtle · **Not sure** |
| 3 | `fin_color` | fins same colour as body · **fin tips or edges are a different colour** (+ which colour) · fins spotted · **Not sure** |
| 4 | `bands_stripes` | no · body bands · stripes radiating back from the eye · a stripe along the lateral line · **Not sure** |
| 5 | `head_jaw` | head spines (strong/weak/none) · lower jaw sticks out (y/n) · mouth (small/medium/large) · eyes (normal/large) · knob on chin tip (y/n) · **Not sure** on each |
| 6 | `typical_size` | measured length, or a band: under 25 cm · 25–40 cm · 40–60 cm · over 60 cm · **Not sure** |
| 7 | `depth_range` | taken from the trip record automatically; asked only if unknown |

Axis 3 (`fin_color`) is the single most useful rockfish character and the UI must ask it
as a *contrast* question, not a colour question: **"are the tips or edges of the fins a
different colour from the body?"** Black-edged fins on vermilion, black fin membranes on
widow, black spots on a black rockfish's dorsal, dark saddles on a quillback's spines —
these persist when body colour has faded in a fish box, which body hue does not.

---

## 3. Which question goes first, and why

**First question: `primary_color`.**

It is the question that splits these 25 species most evenly, measured as the entropy of
the resulting partition:

| candidate first question | partition over the 25 species | entropy |
|---|---|---|
| **`primary_color` (3 practical buckets)** | red/orange/pink ≈ 11 · brown/tan/olive ≈ 11 · black/blue ≈ 3 | **≈ 1.41 bits** |
| `spots_blotches` | yes ≈ 18 · no ≈ 5 · subtle ≈ 2 | ≈ 1.10 bits |
| `bands_stripes` | yes ≈ 9 · no ≈ 16 | ≈ 0.94 bits |
| `fin_color` contrast | yes ≈ 6 · no ≈ 19 | ≈ 0.80 bits |

Nothing splits this fauna into thirds, because the Southern California rockfish
assemblage really is mostly "a red one" or "a brown one". Colour is the best available
first cut and, just as important, it is the question an angler can answer instantly
without turning the fish over.

**But colour is deliberately weighted *low* as evidence (§4).** Rockfish colour varies
within a species, shifts with depth and light, and fades after death. Colour is a
*navigation* device that gets the angler to a short list fast; the *evidence* comes from
fins, bands and jaw. Say this in the UI when the first answer is given:

> Colour narrows things down, but rockfish colour varies a lot and fades once the fish is
> out of the water. The next few questions matter more.

**Depth is never the first question and is never a question at all if we can avoid it.**
The app already knows the depth from the trip record. Depth is strong evidence — it would
partition these species almost perfectly evenly into shallow/mid/deep — but it is
*habitat*, not the fish, so it enters the model as a multiplicative prior (§4.4), never as
a gate. A yelloweye caught in 25 m is a yelloweye.

---

## 4. The scoring model

Simple, auditable, and reproducible by hand on a napkin. No black box.

### 4.1 Per-trait match

For species `s` and axis `t`, the reference table yields a match value:

```
m(s,t) = 1.0   the species' reference value contains the angler's answer
       = 0.5   partial: the species is genuinely variable on this axis, OR our
               reference value for this axis is null (unknown — neither confirms
               nor contradicts)
       = 0.0   the reference value contradicts the answer
```

`m = 0.5` for "unknown" is intentional: an unverified trait must neither reward nor punish
a species. The trace must distinguish the two reasons so the explanation reads
"*we don't have this character recorded for cowcod*" rather than a bogus "partial match".

### 4.2 Weights

```
w[fin_color]      = 3.0
w[bands_stripes]  = 2.5
w[spots_blotches] = 2.0
w[head_jaw]       = 2.0
w[primary_color]  = 1.0
w[typical_size]   = 1.0
                  ------
total             = 11.5
```

Rationale: `fin_color` and `bands_stripes` are close to species-constant and survive
handling. `head_jaw` is highly diagnostic *when read correctly* (bocaccio's maxilla,
cabezon's snout cirrus, cowcod's incised dorsal) but anglers misread it often, so its
weight already carries that discount — it is not 3.0. `primary_color` is 1.0 for the
reasons in §3.

`head_jaw` is a composite; score its sub-answers as the mean of the sub-answers actually
given, then apply `w = 2.0` once. A user who answers only "lower jaw sticks out" supplies
one sub-answer, not five.

### 4.3 Fit

Let `A` be the set of axes the angler actually answered (i.e. **excluding every "Not
sure"**), and `W_A = Σ_{t∈A} w[t]`.

```
fit(s) = ( Σ_{t∈A} w[t] · m(s,t) ) / W_A          ∈ [0, 1]
```

**This is the number the UI displays**, as `round(100 · fit(s))` with the label
"feature match". It does **not** sum to 100 across candidates, and that is on purpose: a
set of numbers that sums to 100 reads as a probability distribution, and this is not one.

### 4.4 Priors — for ranking only, never for display as a match score

```
prior_depth(s)  = 1.00  recorded depth within the species' typical band
                = 0.60  within the species' full recorded range but outside typical
                = 0.25  outside the full recorded range
                = 1.00  depth unknown  (missing data must never be scored as zero)

prior_region(s) = 1.00  common in the Southern California Bight
                = 0.80  occasional
                = 0.50  rare / at the edge of its range here
                = 1.00  socal_frequency is null

prior_photo(s)  = 1.00  default (see §6)

score(s) = fit(s) · prior_depth(s) · prior_region(s) · prior_photo(s)
```

**Rank by `score`. Display `fit`.** Show the priors as separate, plain-language badges —
"typical depth for this species", "unusual depth", "rare south of Point Conception" —
so the angler can see the reasoning and disagree with it. Never fold a habitat prior into
a number that looks like a body-feature match.

The 0.25 floor for "outside known range" is deliberately a floor and not a zero. Range
maps are incomplete and fish move.

### 4.5 The refuse-to-rank rule

The app shows **no ranking** and instead shows *"We cannot narrow this down"* if **any**
of these holds:

1. `W_A < 4.0` — the angler answered almost nothing. (One low-weight answer cannot rank
   25 species.)
2. `max_s fit(s) < 0.55` — nothing on the list matches well. The fish may be a species we
   do not carry (see §8.1).
3. **four or more** species score within 10% (relative) of the top score.
4. the top two are within 10% (relative) of each other **and** their `legal_risk` levels
   differ.

Copy in that case:

> **We can't narrow this down.** Your answers fit several species about equally well.
> Treat this fish as the most restricted possibility on the list — **{name of the
> highest-risk candidate}** — until you can check it against a photo guide. If it is
> still alive, releasing it with a descending device is the safe call.

### 4.6 The risk-asymmetry guard (applies even when we *do* rank)

Mistaking a vermilion for a yelloweye costs you a fish. Mistaking a yelloweye for a
vermilion costs you a citation. The model must be asymmetric to match.

> If any species with `legal_risk.level == "high"` scores at or above **0.85 × the top
> score**, show a persistent banner naming it and its single discriminating character —
> regardless of where it ranks.

Example banner: *"**Could this be a yelloweye?** Check the eye — a yelloweye's iris is
bright yellow, and large adults have rough, raspy bony ridges above the eye. Yelloweye is
a prohibited-retention species."*

The high-risk species may never be silently dropped from the candidate set by any filter,
prior, or photo classifier.

### 4.7 Explainability requirement

Every candidate expands to a per-trait trace:

```
Vermilion rockfish — 82% feature match
  ✓ fin tips/edges a different colour (black)     +3.0 / 3.0
  ✓ no bands or stripes                           +2.5 / 2.5
  ✓ spotting/mottling present                     +2.0 / 2.0
  – head & jaw: you weren't sure                  not counted
  ✓ mostly red/orange                             +1.0 / 1.0
  ✗ size 40–60 cm (we expect 30–55 cm)            +0.5 / 1.0
  Depth 60 m — typical for this species.
```

If we cannot render that trace, we do not show the number.

---

## 5. "Not sure" is a first-class answer

- "Not sure" is the **pre-selected default** on every question. The angler can press
  "Show candidates" at any point and get a ranking from what they have answered so far,
  subject to §4.5 rule 1.
- "Not sure" removes that axis from **both** the numerator and the denominator (§4.3). It
  eliminates no species and changes no species' relative standing. It only makes the
  remaining evidence carry proportionally more.
- "Not sure" is never a dead end and never a terminal branch. There is no path through
  this wizard that ends in "sorry".
- Because `W_A` shrinks with each "Not sure", the UI must show evidence strength
  alongside the ranking: **"Based on 3 of 6 features."** A 95% match on two answered
  questions is weaker than a 70% match on six, and the interface has to make that
  visible or the number lies.
- Do not penalise not-knowing. There is no "you should have answered this" state.

---

## 6. Injecting a future AI photo classifier without touching the scoring model

The classifier produces a normalised score `p̂(s) ∈ [0,1]` per species. Convert it to the
existing prior slot and change nothing else:

```
prior_photo(s) = clamp( 0.5 + 1.5 · p̂(s) , 0.5 , 2.0 )
```

Properties this buys us:

- **It cannot eliminate anything.** The floor is 0.5, so a species the classifier hates
  can still win on trait evidence.
- **It cannot dominate.** The ceiling is 2.0 — roughly the same leverage as the depth
  prior. A confident classifier reorders; it does not decide.
- **The displayed number does not change.** `fit(s)` is still pure trait evidence, so the
  headline percentage keeps meaning exactly what it meant before. The classifier's
  contribution appears as its own badge: *"photo suggests: vermilion, canary"*.
- **The trace stays honest.** Log `fit`, each prior, and the final `score` separately.
- **The §4.6 risk guard is evaluated after the classifier**, and a high-risk species may
  never be removed from the candidate set by classifier output. Photo models fail on
  exactly the confusing fish that matter most.
- The classifier may also *seed* the candidate set (present its top-k first) as long as
  the full list stays reachable in one tap.

Additionally: if the classifier and the angler's trait answers disagree sharply — top
photo candidate is not in the top 3 by `fit` — that is a §4.5-style refusal, not a
tiebreak. Say so.

---

## 7. Structured trait table

Units per ADR 006: lengths in **millimetres**, depths in **metres**. Inch/foot values are
a display concern only. `null` means "not verified", never "absent".

```json
{
  "schema_version": "1.0.0",
  "generated": "2026-09-01",
  "units": { "length": "mm", "depth": "m" },
  "enums": {
    "primary_color": ["red","orange","brown","black","blue","yellow","olive_green","pink","white_pale","mottled_patterned"],
    "spots_blotches": ["yes","no","subtle",null],
    "bands_stripes_locations": ["body_bands","head_bars_from_eye","lateral_line_stripe","oblique_dorsal_stripe"],
    "socal_frequency": ["common","occasional","rare",null],
    "legal_risk_level": ["high","moderate","low",null],
    "data_completeness": ["good","partial","thin"]
  },
  "sources": {
    "cdfw_portal": "https://marinespecies.wildlife.ca.gov/",
    "cdfw_id_flyers": "https://wildlife.ca.gov/Fishing/Ocean/Fish-ID/Sportfish",
    "cdfw_quillback_copper_gopher_flyer": "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=222200&inline=",
    "cdfw_copper_gopher_canary_flyer": "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=197164&inline=",
    "cdfw_nearshore_rockfish": "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=36305",
    "cdfw_shelf_rockfish": "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=36552",
    "cdfw_marine_news": "https://cdfwmarine.wordpress.com/",
    "recfin_socal_groundfish_id": "https://www.recfin.org/wp-content/uploads/2025/04/IDENTIFICATION-OF-COMMON-GROUNDFISH-SPECIES-of-central-and-Southern-California.pdf",
    "odfw_rockfish_id": "https://dfw.state.or.us/mrp/FishID/docs/Rockfish%20ID%2001012017.pdf",
    "odfw_red_rockfish_id": "https://www.dfw.state.or.us/mrp/publications/recfish/redRFID_vApr05.pdf",
    "wdfw_species": "https://wdfw.wa.gov/species-habitats/species/",
    "noaa_fisheries": "https://www.fisheries.noaa.gov/species/",
    "noaa_afsc_rockfish_guide": "https://archive.fisheries.noaa.gov/afsc/groundfish/RockfishGuide/",
    "fishbase": "https://www.fishbase.se/",
    "adfg_yelloweye": "https://www.adfg.alaska.gov/index.cfm?adfg=yelloweyerockfish.main",
    "simon_mbnms": "https://sanctuarysimon.org/dbtools/species-database/",
    "pierfishing": "https://www.pierfishing.com/",
    "kenjonesfishing": "http://kenjonesfishing.com/",
    "pfmc_cowcod_2019": "https://www.pcouncil.org/documents/2019/10/status-of-cowcod-sebastes-levis-in-2019-october-24-2019.pdf/",
    "pfmc_quillback_ca_2021": "https://www.pcouncil.org/documents/2021/12/status-of-quillback-rockfish-sebastes-maliger-in-u-s-waters-off-the-coast-of-california-in-2021-using-catch-and-length-data-december-2021.pdf/",
    "sciencedirect_vermilion_sunset": "https://www.sciencedirect.com/science/article/abs/pii/S0165783622000522",
    "caseagrant_scorpionfish": "https://caseagrant.ucsd.edu/seafood-profiles/california-scorpionfish"
  },
  "notes": {
    "typical_length_basis": "Every typical_length_mm range is an ESTIMATE of the size an angler actually lands in the Southern California Bight, derived from maximum length plus general fishery reports. None is a sourced measurement. See §8.",
    "max_length_basis": "max_length_mm values are sourced (FishBase / agency species pages) and are maximum RECORDED length, not typical.",
    "verification": "Traits verified via search over the listed sources; source pages could not be opened directly in this environment. See §1."
  },

  "species": {

    "vermilion_rockfish": {
      "common_name": "Vermilion rockfish",
      "scientific_name": "Sebastes miniatus",
      "in_app_vocabulary": false,
      "aliases": ["vermilion", "reds", "red snapper (misnomer)", "rasher"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["red", "orange", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "deep orange to red overall with grey/black mottling over the back and sides" },
        "fin_color": { "description": "fins red", "contrasting_margins": "yes", "margin_description": "fins may be edged with black, most obvious in smaller fish" },
        "bands_stripes": { "value": null, "locations": [], "description": "faint head bars radiating from the eye are reported in some guides; NOT verified here. Critically, the lateral line does NOT sit in a clear pale stripe (unlike canary)." },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "underside of the lower jaw is ROUGH / scaly to the touch — this is the classic vermilion-vs-canary/yelloweye test, both of which have a smooth jaw. Body also feels rougher." }
      },
      "typical_length_mm": { "min": 300, "max": 550, "basis": "estimated" },
      "max_length_mm": { "value": 910, "basis": "source" },
      "depth_m": { "typical_min": 50, "typical_max": 274, "full_min": 15, "full_max": 467 },
      "socal_frequency": { "value": "common", "basis": "the mainstay of the SoCal rockfish fishery" },
      "discriminators": [
        { "vs": "canary_rockfish", "test": "Canary has a clear pale/grey zone along the lateral line free of mottling, three orange bars across the head, a smooth jaw, and (in fish under about 355 mm) a dark blotch on the rear of the spiny dorsal. Vermilion's lateral line is not in a clear stripe, its jaw is rough and scaly, and its fins carry black edges." },
        { "vs": "yelloweye_rockfish", "test": "Yelloweye has a bright yellow iris and, in large adults, rough raspy bony ridges above the eye. Vermilion's eye is not yellow. Check the eye first, always." },
        { "vs": "sunset_rockfish", "test": "NOT SEPARABLE IN THE HAND. Sunset rockfish (S. crocotulus) is a cryptic sibling of vermilion, separable only genetically. Sunset predominates south of Point Conception on reefs deeper than about 100 m." }
      ],
      "confusable_with": ["canary_rockfish", "yelloweye_rockfish", "sunset_rockfish", "bocaccio", "chilipepper_rockfish"],
      "legal_risk": { "level": "moderate", "reason": "a species-specific sub-limit applies and differs by side of Point Conception; also indistinguishable in the hand from sunset rockfish. Numbers are owned by the regulations spec." },
      "data_completeness": "partial",
      "sources": ["cdfw_portal", "odfw_red_rockfish_id", "fishbase", "sciencedirect_vermilion_sunset"]
    },

    "canary_rockfish": {
      "common_name": "Canary rockfish",
      "scientific_name": "Sebastes pinniger",
      "in_app_vocabulary": false,
      "aliases": ["canary", "orange rockfish", "fantail rockfish"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["orange", "yellow", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "bright yellow to orange mottling on a grey background; some fish carry dark blotches on the body or dorsal fin" },
        "fin_color": { "description": "fins orange", "contrasting_margins": "yes", "margin_description": "fish under about 355 mm (14 in) have dark markings on the rear part of the spiny dorsal fin" },
        "bands_stripes": { "value": "yes", "locations": ["head_bars_from_eye", "lateral_line_stripe"], "description": "three orange stripes angling down and back across the head, the middle one running across the eye and one either side of it; the lateral line lies inside a narrow grey stripe that is clear of blotches" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "large head; jaw smooth (contrast vermilion's rough jaw)" }
      },
      "typical_length_mm": { "min": 350, "max": 550, "basis": "estimated" },
      "max_length_mm": { "value": 760, "basis": "source" },
      "depth_m": { "typical_min": 80, "typical_max": 200, "full_min": null, "full_max": 838 },
      "socal_frequency": { "value": "occasional", "basis": "present but less abundant in the Bight than north of Point Conception; not separately verified" },
      "discriminators": [
        { "vs": "vermilion_rockfish", "test": "The lateral line. On canary it runs through a clear pale/grey stripe free of mottling; on vermilion it does not. Then feel the jaw — canary smooth, vermilion rough." },
        { "vs": "yelloweye_rockfish", "test": "Eye colour. Yelloweye's iris is bright yellow; canary's is not. Yelloweye adults also have raspy ridges above the eye." }
      ],
      "confusable_with": ["vermilion_rockfish", "yelloweye_rockfish"],
      "legal_risk": { "level": "moderate", "reason": "a species-specific sub-limit applies; historically an overfished, rebuilt stock. Numbers owned by the regulations spec." },
      "data_completeness": "good",
      "sources": ["cdfw_portal", "odfw_red_rockfish_id", "noaa_fisheries", "wdfw_species", "fishbase"]
    },

    "yelloweye_rockfish": {
      "common_name": "Yelloweye rockfish",
      "scientific_name": "Sebastes ruberrimus",
      "in_app_vocabulary": false,
      "aliases": ["rasphead rockfish", "turkey-red rockfish", "red rockfish", "red rockcod", "yellowbelly", "red snapper (misnomer)"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["orange", "red", "yellow"],
        "spots_blotches": { "value": "subtle", "description": "deep orange to orange-red overall; no strong body spotting. A lighter line is usually visible along the lateral line." },
        "fin_color": { "description": "fins orange-red", "contrasting_margins": "yes", "margin_description": "fins are often tipped in black" },
        "bands_stripes": { "value": "yes", "locations": ["lateral_line_stripe"], "description": "fish under about 300 mm carry one or two whitish stripes along the side; adults lose them. A pale line along the lateral line usually remains." },
        "head_jaw": { "head_spines": "strong", "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "THE two marks: (1) bright yellow iris; (2) rough, raspy bony ridges above the eye in large adults — hence 'rasphead'. Jaw is smooth. Tail forked with distinct tips." }
      },
      "typical_length_mm": { "min": 450, "max": 700, "basis": "estimated" },
      "max_length_mm": { "value": 910, "basis": "source" },
      "depth_m": { "typical_min": 90, "typical_max": 180, "full_min": 11, "full_max": 550 },
      "socal_frequency": { "value": "occasional", "basis": "less common in the Bight than to the north; not separately verified" },
      "discriminators": [
        { "vs": "vermilion_rockfish", "test": "Yellow iris and raspy ridges above the eye = yelloweye. Rough scaly jaw with black-edged fins and no yellow eye = vermilion." },
        { "vs": "canary_rockfish", "test": "Canary has a clear pale stripe at the lateral line and three orange head bars; yelloweye has the yellow eye and, when young, one or two white side stripes." }
      ],
      "confusable_with": ["vermilion_rockfish", "canary_rockfish"],
      "legal_risk": { "level": "high", "reason": "retention prohibited statewide in California as of the 2025/2026 groundfish regulations. Verify current status with the regulations spec before shipping." },
      "data_completeness": "good",
      "sources": ["adfg_yelloweye", "odfw_red_rockfish_id", "cdfw_marine_news", "fishbase", "wdfw_species"]
    },

    "copper_rockfish": {
      "common_name": "Copper rockfish",
      "scientific_name": "Sebastes caurinus",
      "in_app_vocabulary": false,
      "aliases": ["chucklehead", "whitebelly rockfish", "white gopher", "white grouper", "sailfin rockfish", "yellowbacked rockfish", "fighting bob", "never dies"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["brown", "olive_green", "orange", "pink", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "olive-brown to copper with pink, orange or yellow blotching, often near the gill covers; white on the sides and belly. Colour is highly variable — dark brown through pink-orange." },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["head_bars_from_eye", "lateral_line_stripe"], "description": "usually TWO dark bands radiating back from the eye, and a wide pale/white zone along the rear two-thirds of the lateral line. Both are the working marks." },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": null }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 580, "basis": "source" },
      "depth_m": { "typical_min": 10, "typical_max": 100, "full_min": 10, "full_max": 183 },
      "socal_frequency": { "value": "common", "basis": "widespread nearshore; not separately verified for the Bight" },
      "discriminators": [
        { "vs": "brown_rockfish", "test": "Copper has two dark bands radiating back from the eye and a pale rear two-thirds of the lateral line; brown has neither, but does have a dark spot on the gill cover." },
        { "vs": "quillback_rockfish", "test": "Quillback has very long dorsal spines with deeply incised membranes and no eye bands; copper's dorsal is ordinary and it has the eye bands and the pale lateral line." },
        { "vs": "gopher_rockfish", "test": "Gopher has pale pinkish/white blotches on a dark olive-brown ground and no pale lateral-line stripe; copper has the pale lateral line and eye bands." }
      ],
      "confusable_with": ["brown_rockfish", "quillback_rockfish", "gopher_rockfish"],
      "legal_risk": { "level": "high", "reason": "a very small species-specific sub-limit applies in California — much smaller than the aggregate bag — so a misidentification puts an angler over immediately. Numbers owned by the regulations spec. Note also that copper x quillback hybrids are reported, which defeats the lateral-line mark." },
      "data_completeness": "partial",
      "sources": ["cdfw_quillback_copper_gopher_flyer", "cdfw_copper_gopher_canary_flyer", "fishbase", "wdfw_species", "pierfishing", "kenjonesfishing"]
    },

    "quillback_rockfish": {
      "common_name": "Quillback rockfish",
      "scientific_name": "Sebastes maliger",
      "in_app_vocabulary": false,
      "aliases": ["quillback", "quillback seaperch"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["brown", "black", "yellow", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "brown to black body with yellow to white mottling and blotches running from the back downwards, usually ending around mid-body; the rear of the fish darkens. Brown or orange freckling on the head extending down to below the pectoral fins." },
        "fin_color": { "description": "dorsal spines white or light yellow", "contrasting_margins": "yes", "margin_description": "the long dorsal spines can carry dark brown or black saddles, giving a barred look to the dorsal fin itself" },
        "bands_stripes": { "value": "no", "locations": [], "description": "no dark bands radiating from the eye — this is the working separation from copper" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "THE mark: dorsal fin spines are very long and the membranes between them are deeply incised, so the spiny dorsal looks like a row of separate quills." }
      },
      "typical_length_mm": { "min": 250, "max": 400, "basis": "estimated" },
      "max_length_mm": { "value": 636, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 274 },
      "socal_frequency": { "value": "rare", "basis": "catches south of Point Conception are rare; southern limit around Anacapa Passage (PFMC 2021 California assessment)" },
      "discriminators": [
        { "vs": "copper_rockfish", "test": "Long, deeply incised dorsal spines and NO eye bands = quillback. Ordinary dorsal, two eye bands and a pale rear lateral line = copper." },
        { "vs": "china_rockfish", "test": "China has one unmistakable yellow stripe running from about the third dorsal spine down and back along the lateral line; quillback has scattered yellow mottling and no stripe." },
        { "vs": "brown_rockfish", "test": "Brown has a dark spot on the gill cover and a normal dorsal fin; quillback has the incised quill dorsal." }
      ],
      "confusable_with": ["copper_rockfish", "brown_rockfish", "china_rockfish", "gopher_rockfish"],
      "legal_risk": { "level": "high", "reason": "retention prohibited statewide in California as of the 2025/2026 groundfish regulations. Rare in SoCal, which makes anglers less practised at spotting it. Verify current status with the regulations spec." },
      "data_completeness": "good",
      "sources": ["cdfw_quillback_copper_gopher_flyer", "pfmc_quillback_ca_2021", "cdfw_marine_news", "fishbase", "wdfw_species"]
    },

    "gopher_rockfish": {
      "common_name": "Gopher rockfish",
      "scientific_name": "Sebastes carnatus",
      "in_app_vocabulary": false,
      "aliases": ["gopher"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "olive_green", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "dark olive-brown to brown ground colour with PINKISH or WHITE blotches and spots" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": null, "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": null }
      },
      "typical_length_mm": { "min": 200, "max": 330, "basis": "estimated" },
      "max_length_mm": { "value": 430, "basis": "source" },
      "depth_m": { "typical_min": 12, "typical_max": 50, "full_min": 12, "full_max": 50 },
      "socal_frequency": { "value": "occasional", "basis": "common in central California; present but less abundant in the Bight. Not separately verified." },
      "discriminators": [
        { "vs": "black_and_yellow_rockfish", "test": "Colour of the blotches. Gopher = PINK or WHITE blotches on brown. Black-and-yellow = YELLOW to orange-yellow blotches on black, with a dark grey lower lip. Black-and-yellow also sits shallower (intertidal to about 37 m, mostly under 18 m) where the two overlap. NOTE: black_and_yellow_rockfish is not yet in the app vocabulary — see §8.1." },
        { "vs": "copper_rockfish", "test": "Copper has two dark eye bands and a wide pale rear lateral line; gopher has neither." }
      ],
      "confusable_with": ["black_and_yellow_rockfish", "copper_rockfish", "brown_rockfish", "quillback_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited or narrowly sub-limited status known to this spec; managed within the general nearshore complex. Numbers owned by the regulations spec." },
      "data_completeness": "partial",
      "sources": ["cdfw_quillback_copper_gopher_flyer", "simon_mbnms", "fishbase", "pierfishing"]
    },

    "black_rockfish": {
      "common_name": "Black rockfish",
      "scientific_name": "Sebastes melanops",
      "in_app_vocabulary": false,
      "aliases": ["black bass", "black seaperch"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["black", "brown", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "dark grey-black to blue-black, lighter below, with dark mottling on the back" },
        "fin_color": { "description": "dorsal fin carries BLACK SPOTS", "contrasting_margins": "yes", "margin_description": "black spotting on the spiny dorsal fin is the working separation from blue rockfish, which has none. The anal fin is ROUNDED (blue's is slanted/straight)." },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": true, "mouth_size": "large", "eye_size": null, "symphyseal_knob": null, "notes": "large mouth, lower jaw projects slightly — blue rockfish has a distinctly short, small mouth" }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 690, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 366 },
      "socal_frequency": { "value": "rare", "basis": "abundant from the Oregon border south to Point Conception; uncommon in the Bight" },
      "discriminators": [
        { "vs": "blue_rockfish", "test": "Three checks, in order: (1) black spots on the dorsal fin — black yes, blue no; (2) anal fin rounded (black) vs slanted or straight (blue); (3) mouth large with a projecting lower jaw (black) vs short and small (blue)." }
      ],
      "confusable_with": ["blue_rockfish", "olive_rockfish", "widow_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec. Numbers owned by the regulations spec." },
      "data_completeness": "partial",
      "sources": ["odfw_rockfish_id", "fishbase", "wdfw_species", "recfin_socal_groundfish_id"]
    },

    "blue_rockfish": {
      "common_name": "Blue rockfish",
      "scientific_name": "Sebastes mystinus",
      "in_app_vocabulary": false,
      "aliases": ["blues", "blue bass"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["blue", "black", "mottled_patterned"],
        "spots_blotches": { "value": "subtle", "description": "blue to blue-grey with dark mottling; no dorsal blotches and NO spots on the dorsal fin" },
        "fin_color": { "description": "no spots on the dorsal fin; anal fin slanted or straight-edged", "contrasting_margins": "no", "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["head_bars_from_eye"], "description": "adults show two or more sloped bars running from the eye back to the gill cover" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": false, "mouth_size": "small", "eye_size": null, "symphyseal_knob": null, "notes": "distinctly short, small mouth" }
      },
      "typical_length_mm": { "min": 250, "max": 400, "basis": "estimated" },
      "max_length_mm": { "value": 610, "basis": "source" },
      "depth_m": { "typical_min": 5, "typical_max": 25, "full_min": 0, "full_max": 156 },
      "socal_frequency": { "value": "occasional", "basis": "distributed from the Oregon border to Point Conception with occasional records into southern California; range reaches northern Baja" },
      "discriminators": [
        { "vs": "black_rockfish", "test": "No spots on the dorsal fin, straight/slanted anal fin, small short mouth = blue. Spotted dorsal, rounded anal fin, large mouth = black." }
      ],
      "confusable_with": ["black_rockfish", "olive_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec. Note: 'blue rockfish' was split into S. mystinus and S. diaconus (deacon rockfish); deacon is a more northern species, so a blue in SoCal is mystinus." },
      "data_completeness": "good",
      "sources": ["simon_mbnms", "odfw_rockfish_id", "fishbase", "cdfw_portal"]
    },

    "olive_rockfish": {
      "common_name": "Olive rockfish",
      "scientific_name": "Sebastes serranoides",
      "in_app_vocabulary": false,
      "aliases": ["johnny bass", "jonathan", "sugar bass", "sugarfish", "greenie", "kelp salmon", "kelp yellowtail", "bass rockfish"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["olive_green", "brown", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "olive-brown with a series of dark and light/white blotches along the back and pale areas under the dorsal fins" },
        "fin_color": { "description": "tail greenish-yellow; fins yellowish", "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": true, "notes": "knob at the tip of the lower jaw. 12-14 dorsal spines, 3 anal spines, 9 anal soft rays. Bass-shaped body." }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 610, "basis": "source" },
      "depth_m": { "typical_min": 0, "typical_max": 30, "full_min": 0, "full_max": 146 },
      "socal_frequency": { "value": "common", "basis": "a standard SoCal kelp-zone catch; the 'johnny bass' name is specifically Southern Californian" },
      "discriminators": [
        { "vs": "kelp_bass", "test": "Dorsal fin profile. On kelp bass the third to fifth dorsal spines are markedly taller than the rest; on olive rockfish the spiny dorsal is even. Olive rockfish also has a knob on the chin tip." },
        { "vs": "yellowtail_rockfish", "test": "Olive lacks the reddish-brown flecking on the scales that yellowtail rockfish shows, and its tail is greenish-yellow rather than plain yellow. NOTE: yellowtail_rockfish is not in the app vocabulary — see §8.1." }
      ],
      "confusable_with": ["kelp_bass", "yellowtail_rockfish", "black_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec. But note it is routinely logged as 'calico bass' by anglers, which corrupts catch data as well as compliance." },
      "data_completeness": "good",
      "sources": ["pierfishing", "kenjonesfishing", "simon_mbnms", "fishbase"]
    },

    "starry_rockfish": {
      "common_name": "Starry rockfish",
      "scientific_name": "Sebastes constellatus",
      "in_app_vocabulary": false,
      "aliases": ["spotted corsair", "spotted rockfish", "chinafish"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["orange", "red"],
        "spots_blotches": { "value": "yes", "description": "orange-red body sprinkled profusely with many small WHITE star-like spots over head and body, PLUS 5 or 6 large white blotches on the upper flanks. Distinctive and hard to mistake once seen." },
        "fin_color": { "description": "fins orange-red", "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "head noticeably rounded compared with other rockfish, and marked with white blotches" }
      },
      "typical_length_mm": { "min": 250, "max": 400, "basis": "estimated" },
      "max_length_mm": { "value": 460, "basis": "source" },
      "depth_m": { "typical_min": 24, "typical_max": 274, "full_min": 24, "full_max": 274 },
      "socal_frequency": { "value": "common", "basis": "a regular Bight deep-reef species; not separately verified" },
      "discriminators": [
        { "vs": "honeycomb_rockfish", "test": "Starry has many small WHITE spots on a red-orange body. Honeycomb has DARK-EDGED scales below the lateral line forming a net/honeycomb pattern on a tan-brown body, with only 4-6 white blotches above the lateral line." },
        { "vs": "greenspotted_rockfish", "test": "Greenspotted's spots are olive-GREEN on a pink-yellow body and it has pink/yellow bars radiating from the eye; starry's spots are white and it has no head bars." }
      ],
      "confusable_with": ["honeycomb_rockfish", "greenspotted_rockfish", "speckled_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["noaa_afsc_rockfish_guide", "cdfw_portal", "fishbase"]
    },

    "china_rockfish": {
      "common_name": "China rockfish",
      "scientific_name": "Sebastes nebulosus",
      "in_app_vocabulary": false,
      "aliases": ["china", "yellowstripe rockfish"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["black", "blue", "yellow", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "blue or black overall with yellow mottling mixed with some white mottling" },
        "fin_color": { "description": "pelvic, anal and caudal fins dark; dorsal spines long with deeply incised membranes", "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["oblique_dorsal_stripe", "lateral_line_stripe"], "description": "THE mark: a clear yellow stripe starting on the dorsal fin near the third dorsal spine, running obliquely down to the lateral line and then back along it — the shape of an ice-hockey stick. Unmistakable." },
        "head_jaw": { "head_spines": "strong", "lower_jaw_projecting": null, "mouth_size": "small", "eye_size": null, "symphyseal_knob": null, "notes": "compact body, small mouth, concave space between the eyes, robust head spines but none above the eyes" }
      },
      "typical_length_mm": { "min": 250, "max": 350, "basis": "estimated" },
      "max_length_mm": { "value": 450, "basis": "source" },
      "depth_m": { "typical_min": 3, "typical_max": 128, "full_min": 3, "full_max": 128 },
      "socal_frequency": { "value": "rare", "basis": "southern limit reported at Redondo Beach and San Nicolas Island, so it barely reaches the Bight" },
      "discriminators": [
        { "vs": "quillback_rockfish", "test": "The yellow hockey-stick stripe. China has it; quillback has scattered yellow mottling and no stripe. Both have long, deeply incised dorsal spines, so use the stripe, not the fin." }
      ],
      "confusable_with": ["quillback_rockfish", "black_and_yellow_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec — but it is rare enough in SoCal that a claimed china rockfish here deserves a second look." },
      "data_completeness": "good",
      "sources": ["odfw_rockfish_id", "wdfw_species", "fishbase"]
    },

    "bocaccio": {
      "common_name": "Bocaccio",
      "scientific_name": "Sebastes paucispinis",
      "in_app_vocabulary": false,
      "aliases": ["salmon grouper", "grouper", "rock salmon", "salmon rockfish", "lockjaw", "brown bomber", "slimy", "sewer salmon", "wormbag"],
      "aliases_verified": true,
      "traits": {
        "primary_color": ["brown", "olive_green", "red", "pink"],
        "spots_blotches": { "value": "subtle", "description": "olive-brown to reddish above, paler pink-red below; dusky speckling is more evident in smaller fish. Body pattern is NOT strongly verified here." },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": "body without bars" },
        "head_jaw": { "head_spines": "weak", "lower_jaw_projecting": true, "mouth_size": "large", "eye_size": null, "symphyseal_knob": false, "notes": "THE mark: the upper jaw (maxilla) is very long, reaching to or past the rear margin of the eye. Lower jaw projects strongly and enters the dorsal profile; symphyseal knob ABSENT but the lower jaw is thickened. Narrow suborbital, dorsal membranes not deeply incised." }
      },
      "typical_length_mm": { "min": 400, "max": 700, "basis": "estimated" },
      "max_length_mm": { "value": 910, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 476 },
      "socal_frequency": { "value": "common", "basis": "a mainstay Bight species; the name 'salmon grouper' is Californian angler usage" },
      "discriminators": [
        { "vs": "chilipepper_rockfish", "test": "Put a finger on the corner of the mouth. Bocaccio's upper jaw reaches to or past the BACK of the eye; chilipepper's reaches only to about the MIDDLE of the eye. Chilipepper also has a bright, lighter red zone along the lateral line and a large knob on the chin." },
        { "vs": "cowcod", "test": "Cowcod has a very high, deeply incised spiny dorsal, a spiny head, small eyes and faint pale bars; bocaccio has weak head spines, a plain body and the long jaw." }
      ],
      "confusable_with": ["chilipepper_rockfish", "cowcod", "widow_rockfish", "vermilion_rockfish"],
      "legal_risk": { "level": "moderate", "reason": "historically overfished and separately managed; check the regulations spec before assuming it falls under the general aggregate." },
      "data_completeness": "partial",
      "sources": ["noaa_afsc_rockfish_guide", "cdfw_portal", "fishbase", "pierfishing", "kenjonesfishing"]
    },

    "chilipepper_rockfish": {
      "common_name": "Chilipepper rockfish",
      "scientific_name": "Sebastes goodei",
      "in_app_vocabulary": false,
      "aliases": ["chilipepper", "chili"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["pink", "red", "white_pale"],
        "spots_blotches": { "value": "no", "description": "plain pinkish-red above becoming whitish below" },
        "fin_color": { "description": "fins pink", "contrasting_margins": "no", "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["lateral_line_stripe"], "description": "the lateral line stands out clearly as a lighter, brighter red zone along the middle of the side" },
        "head_jaw": { "head_spines": "absent", "lower_jaw_projecting": true, "mouth_size": "medium", "eye_size": null, "symphyseal_knob": true, "notes": "elongate pointed head with no head spines; lower jaw prominently projecting with a large knob at the front; upper jaw reaches only to about the centre of the eye" }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 560, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 425 },
      "socal_frequency": { "value": "common", "basis": "regular Bight species; not separately verified" },
      "discriminators": [
        { "vs": "bocaccio", "test": "Jaw length. Chilipepper's upper jaw stops around the middle of the eye and it has a big chin knob; bocaccio's upper jaw runs to or past the back of the eye and has no knob." },
        { "vs": "widow_rockfish", "test": "Widow's anal and pectoral fin MEMBRANES are black; chilipepper's fins are pink." }
      ],
      "confusable_with": ["bocaccio", "widow_rockfish", "vermilion_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["noaa_afsc_rockfish_guide", "fishbase", "cdfw_portal"]
    },

    "widow_rockfish": {
      "common_name": "Widow rockfish",
      "scientific_name": "Sebastes entomelas",
      "in_app_vocabulary": false,
      "aliases": ["widow", "brownie", "soft brown"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "orange"],
        "spots_blotches": { "value": "subtle", "description": "brown to brassy orange, lighter below; some fish carry dusky patches or saddles that fade after capture. Juveniles have distinct dark saddles." },
        "fin_color": { "description": "THE mark: fin MEMBRANES are black, most obviously on the anal and pectoral fins", "contrasting_margins": "yes", "margin_description": "black fin membranes against a brown-brassy body" },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": "weak", "lower_jaw_projecting": true, "mouth_size": "small", "eye_size": null, "symphyseal_knob": null, "notes": "head spines reduced or effectively absent — unusual among rockfish; short head, small mouth, lower jaw projects slightly; narrow caudal peduncle; anal fin strongly slanted towards the tail" }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 610, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": null, "full_max": 800 },
      "socal_frequency": { "value": "occasional", "basis": "not separately verified for the Bight" },
      "discriminators": [
        { "vs": "bocaccio", "test": "Widow has black fin membranes, a small mouth and almost no head spines; bocaccio has a huge jaw reaching past the eye." },
        { "vs": "black_rockfish", "test": "Black rockfish has black SPOTS on the dorsal fin and a rounded anal fin; widow has uniformly black fin membranes and a strongly slanted anal fin." }
      ],
      "confusable_with": ["bocaccio", "black_rockfish", "chilipepper_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["noaa_fisheries", "cdfw_portal", "fishbase", "wdfw_species"]
    },

    "greenspotted_rockfish": {
      "common_name": "Greenspotted rockfish",
      "scientific_name": "Sebastes chlorostictus",
      "in_app_vocabulary": false,
      "aliases": ["greenspot", "chucklehead (locally, ambiguous with copper)"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["pink", "yellow", "olive_green"],
        "spots_blotches": { "value": "yes", "description": "distinct olive-GREEN spots on the top of the head, the back and above the lateral line, on an overall yellow-pink body; plus 3-5 white blotches above the lateral line" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["head_bars_from_eye"], "description": "alternating pink and yellow bars radiating backwards from the eye" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": "medium", "eye_size": "large", "symphyseal_knob": null, "notes": "big head, large eyes, short snout; mouth reaches to the front of the eye socket" }
      },
      "typical_length_mm": { "min": 250, "max": 400, "basis": "estimated" },
      "max_length_mm": { "value": 534, "basis": "source" },
      "depth_m": { "typical_min": 61, "typical_max": 244, "full_min": 61, "full_max": 244 },
      "socal_frequency": { "value": "common", "basis": "regular Bight deep-reef species; not separately verified" },
      "discriminators": [
        { "vs": "starry_rockfish", "test": "Spot colour. Green spots and pink/yellow head bars = greenspotted. White spots and no head bars = starry." },
        { "vs": "greenblotched_rockfish", "test": "Greenblotched (S. rosenblatti) carries green worm-like BLOTCHES/vermiculations rather than discrete round green spots. These two are genuinely difficult and often mixed. NOTE: greenblotched_rockfish is not in the app vocabulary — see §8.1." }
      ],
      "confusable_with": ["starry_rockfish", "greenblotched_rockfish", "honeycomb_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["cdfw_portal", "fishbase", "wdfw_species", "noaa_afsc_rockfish_guide"]
    },

    "honeycomb_rockfish": {
      "common_name": "Honeycomb rockfish",
      "scientific_name": "Sebastes umbrosus",
      "in_app_vocabulary": false,
      "aliases": ["honeycomb"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "red", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "tan, brown or reddish-brown with 4 to 6 white blotches spaced irregularly ABOVE the lateral line; scales BELOW the lateral line are edged with dark brown or green, producing the honeycomb net pattern the fish is named for" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": null, "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": "small", "eye_size": "large", "symphyseal_knob": null, "notes": "compact squat body, mid-length head with a short snout, disproportionately large eyes, small terminal mouth" }
      },
      "typical_length_mm": { "min": 180, "max": 260, "basis": "estimated" },
      "max_length_mm": { "value": 298, "basis": "source" },
      "depth_m": { "typical_min": 60, "typical_max": 90, "full_min": 30, "full_max": 119 },
      "socal_frequency": { "value": "common", "basis": "range runs from Point Pinos south into Baja; a Bight species" },
      "discriminators": [
        { "vs": "starry_rockfish", "test": "Honeycomb's dark scale-edge net below the lateral line, plus a small overall size (rarely over 300 mm). Starry is red-orange with many small white spots and gets noticeably bigger." },
        { "vs": "greenspotted_rockfish", "test": "Greenspotted has discrete green spots and head bars; honeycomb has dark scale outlines forming a mesh." }
      ],
      "confusable_with": ["starry_rockfish", "greenspotted_rockfish", "calico_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["fishbase", "noaa_afsc_rockfish_guide", "cdfw_portal"]
    },

    "treefish": {
      "common_name": "Treefish",
      "scientific_name": "Sebastes serriceps",
      "in_app_vocabulary": false,
      "aliases": ["treefish", "convict fish"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["yellow", "olive_green", "black"],
        "spots_blotches": { "value": "no", "description": "no spotting — the pattern is bars" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["body_bands", "head_bars_from_eye"], "description": "five to six vertical BLACK bars down the sides on a yellowish to olive body, plus two blackish bands radiating from the eye" },
        "head_jaw": { "head_spines": "strong", "lower_jaw_projecting": null, "mouth_size": "medium", "eye_size": "small", "symphyseal_knob": null, "notes": "head covered in strong spines (serriceps = 'serrated head'); pointed snout; small eyes; and BRIGHT PINK/RED LIPS, which nothing else here has" }
      },
      "typical_length_mm": { "min": 200, "max": 330, "basis": "estimated" },
      "max_length_mm": { "value": 410, "basis": "source" },
      "depth_m": { "typical_min": 5, "typical_max": 90, "full_min": 5, "full_max": 107 },
      "socal_frequency": { "value": "common", "basis": "a characteristic SoCal shallow-reef species" },
      "discriminators": [
        { "vs": "flag_rockfish", "test": "Bar colour and ground colour. Treefish = BLACK bars on a yellow-olive body, pink lips, shallow water. Flag = RED bars on a white-pale body, deeper water." },
        { "vs": "calico_rockfish", "test": "Calico's bars are diagonal reddish-brown on greenish-yellow and it is much smaller; treefish bars are vertical, black, and it has pink lips." }
      ],
      "confusable_with": ["flag_rockfish", "calico_rockfish", "black_and_yellow_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["pierfishing", "kenjonesfishing", "fishbase", "cdfw_portal"]
    },

    "brown_rockfish": {
      "common_name": "Brown rockfish",
      "scientific_name": "Sebastes auriculatus",
      "in_app_vocabulary": false,
      "aliases": ["bolina", "chocolate bass"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "red", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "brown to red-brown with light orange-brown to black mottling, AND a dark brown spot on the gill cover (operculum), towards its rear margin — the name auriculatus, 'eared', refers to it" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": "no dark bands radiating from the eye — this separates it from copper" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": null }
      },
      "typical_length_mm": { "min": 250, "max": 400, "basis": "estimated" },
      "max_length_mm": { "value": 560, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 128 },
      "socal_frequency": { "value": "common", "basis": "range covers the Bight; not separately verified" },
      "discriminators": [
        { "vs": "copper_rockfish", "test": "Dark spot on the gill cover and NO eye bands = brown. Two eye bands and a wide pale rear lateral line = copper." },
        { "vs": "quillback_rockfish", "test": "Quillback's dorsal spines are long with deeply incised membranes; brown's dorsal is ordinary and it has the opercular spot." }
      ],
      "confusable_with": ["copper_rockfish", "quillback_rockfish", "gopher_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec — but it sits next to copper and quillback, both of which are high-risk, so a brown-rockfish call should always be checked against those two." },
      "data_completeness": "partial",
      "sources": ["cdfw_nearshore_rockfish", "fishbase", "simon_mbnms"]
    },

    "calico_rockfish": {
      "common_name": "Calico rockfish",
      "scientific_name": "Sebastes dallii",
      "in_app_vocabulary": false,
      "aliases": ["calico"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["olive_green", "yellow", "brown", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "greenish-yellow ground with mottled brown spotting; the mottling fades rapidly after death" },
        "fin_color": { "description": "anal and pelvic fins transparent tinged with red; caudal and dorsal fins dark; pectoral fins orange and red", "contrasting_margins": "yes", "margin_description": "dark dorsal and tail against a pale greenish body" },
        "bands_stripes": { "value": "yes", "locations": ["body_bands"], "description": "diagonal (oblique) reddish-brown bars across the flanks" },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": "large", "eye_size": "large", "symphyseal_knob": null, "notes": "sharp snout, large eyes, large terminal mouth on a small body" }
      },
      "typical_length_mm": { "min": 130, "max": 220, "basis": "estimated" },
      "max_length_mm": { "value": 250, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 18, "full_max": 256 },
      "socal_frequency": { "value": "common", "basis": "a Bight species; not separately verified" },
      "discriminators": [
        { "vs": "treefish", "test": "Size does most of the work: calico is one of the smallest rockfish (max 250 mm) with diagonal reddish-brown bars; treefish is bigger with vertical black bars and pink lips." },
        { "vs": "olive_rockfish", "test": "Olive is a large bass-shaped fish with a chin knob and no bars; calico is a small fish with oblique bars." }
      ],
      "confusable_with": ["treefish", "honeycomb_rockfish", "squarespot_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "good",
      "sources": ["noaa_afsc_rockfish_guide", "cdfw_nearshore_rockfish", "fishbase"]
    },

    "cowcod": {
      "common_name": "Cowcod",
      "scientific_name": "Sebastes levis",
      "in_app_vocabulary": false,
      "aliases": ["cow cod", "cowfish"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["pink", "orange", "white_pale", "yellow"],
        "spots_blotches": { "value": "no", "description": "adults cream, pink, salmon, orange or gold; the markings are bars, not spots" },
        "fin_color": { "description": "adult fins pink; juveniles have yellow fins", "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["body_bands"], "description": "4 to 5 narrow, somewhat irregular dark or reddish vertical bars along the sides, often faint or nearly gone in large adults. Juveniles are strongly barred — gold or brown bars on a whitish to pale yellow ground." },
        "head_jaw": { "head_spines": "strong", "lower_jaw_projecting": true, "mouth_size": "large", "eye_size": "small", "symphyseal_knob": null, "notes": "THE mark: a very high first dorsal fin with DEEPLY INCISED membranes, so the spiny dorsal looks like a row of separate spikes and is set off from the squared soft dorsal. Large head armed with many spines, small eyes, large mouth with a jutting lower jaw." }
      },
      "typical_length_mm": { "min": 500, "max": 800, "basis": "estimated" },
      "max_length_mm": { "value": 1000, "basis": "source" },
      "depth_m": { "typical_min": 90, "typical_max": 300, "full_min": 40, "full_max": 515 },
      "socal_frequency": { "value": "occasional", "basis": "a Southern California Bight species; adults over 440 mm sit on rocky bottom at 90-300 m, juveniles on fine sand and clay at 40-100 m" },
      "discriminators": [
        { "vs": "bocaccio", "test": "The spiny dorsal. Cowcod's is very high with deeply cut membranes, a row of spikes; bocaccio's is ordinary. Cowcod also has small eyes and a spiny head; bocaccio has weak head spines and the very long upper jaw." },
        { "vs": "flag_rockfish", "test": "Flag's bands are vivid red on a clearly white body and there are two on the head; cowcod's bars are faint on a pink-orange body and it has the incised spiny dorsal." }
      ],
      "confusable_with": ["bocaccio", "flag_rockfish", "vermilion_rockfish"],
      "legal_risk": { "level": "high", "reason": "retention prohibited statewide in California as of the 2025/2026 groundfish regulations, and dedicated Cowcod Conservation Areas exist. Verify current status with the regulations spec." },
      "data_completeness": "good",
      "sources": ["pfmc_cowcod_2019", "cdfw_marine_news", "fishbase", "cdfw_portal"]
    },

    "flag_rockfish": {
      "common_name": "Flag rockfish",
      "scientific_name": "Sebastes rubrivinctus",
      "in_app_vocabulary": false,
      "aliases": ["barber pole", "Spanish flag"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["white_pale", "red"],
        "spots_blotches": { "value": "no", "description": "white body with red banding; no spotting" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "yes", "locations": ["body_bands", "head_bars_from_eye"], "description": "FOUR vermilion bands on the body and TWO on the head — one running down from the eye, one towards the upper jaw. Bands are vivid red and usually narrow towards the belly. The band at the front of the dorsal fin extends well into the gill cover." },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": null }
      },
      "typical_length_mm": { "min": 250, "max": 380, "basis": "estimated" },
      "max_length_mm": { "value": 510, "basis": "source" },
      "depth_m": { "typical_min": null, "typical_max": null, "full_min": 0, "full_max": 302 },
      "socal_frequency": { "value": "occasional", "basis": "a Bight species; not separately verified" },
      "discriminators": [
        { "vs": "redbanded_rockfish", "test": "On flag rockfish the front band extends well into the gill cover; on redbanded the first red band passes over the gill cover and stops at the pectoral fin base. Flag bands are vivid red and narrow towards the belly; redbanded bands are more brownish-red and widen or fade towards the belly. Pectoral rays typically 17 on flag, 19 on redbanded. NOTE: redbanded_rockfish is not in the app vocabulary — see §8.1." },
        { "vs": "treefish", "test": "Red bands on a white body (flag) vs black bars on a yellow-olive body with pink lips (treefish)." }
      ],
      "confusable_with": ["redbanded_rockfish", "treefish", "cowcod"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "partial",
      "sources": ["noaa_afsc_rockfish_guide", "cdfw_portal", "fishbase", "wdfw_species"]
    },

    "speckled_rockfish": {
      "common_name": "Speckled rockfish",
      "scientific_name": "Sebastes ovalis",
      "in_app_vocabulary": false,
      "aliases": ["speckled"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "white_pale", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "overall light tan with small dark brown and black speckling over the back and sides — fine speckles, not blotches" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": null, "eye_size": null, "symphyseal_knob": null, "notes": "oval, elongate, narrow body (width 28-32% of standard length) — slimmer than most of the deep reds" }
      },
      "typical_length_mm": { "min": 300, "max": 450, "basis": "estimated" },
      "max_length_mm": { "value": 560, "basis": "source" },
      "depth_m": { "typical_min": 75, "typical_max": 150, "full_min": 30, "full_max": 365 },
      "socal_frequency": { "value": "common", "basis": "range San Francisco to northern Baja, rare north of Santa Barbara — i.e. this is primarily a Bight species" },
      "discriminators": [
        { "vs": "starry_rockfish", "test": "Speckled's spots are small and DARK on a light tan body; starry's are WHITE on a red-orange body." },
        { "vs": "bocaccio", "test": "Bocaccio's upper jaw runs to or past the back of the eye; speckled has an ordinary mouth and fine dark speckling." }
      ],
      "confusable_with": ["starry_rockfish", "bocaccio", "widow_rockfish"],
      "legal_risk": { "level": "low", "reason": "no prohibited status known to this spec." },
      "data_completeness": "partial",
      "sources": ["cdfw_portal", "fishbase", "noaa_afsc_rockfish_guide"]
    },

    "california_scorpionfish": {
      "common_name": "California scorpionfish (sculpin)",
      "scientific_name": "Scorpaena guttata",
      "in_app_vocabulary": true,
      "aliases": ["sculpin", "scorpion", "spotted scorpionfish", "scorps"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["red", "brown", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "red to brown with dark blotches and spotting on the body AND — in adults — large spotting on the anal, caudal, dorsal and pectoral fins. Juveniles have no fin spotting." },
        "fin_color": { "description": "adult fins are SPOTTED; large pectoral fins", "contrasting_margins": "no", "margin_description": "spotted fins are the mark, not contrasting margins" },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": "strong", "lower_jaw_projecting": null, "mouth_size": "large", "eye_size": null, "symphyseal_knob": null, "notes": "stocky, slightly compressed body; large head and mouth; large pectoral fins. VENOMOUS spines in the dorsal, anal and pelvic fins — painful, not fatal. Handle first, identify second." }
      },
      "typical_length_mm": { "min": 250, "max": 350, "basis": "estimated" },
      "max_length_mm": { "value": 430, "basis": "source" },
      "depth_m": { "typical_min": 6, "typical_max": 137, "full_min": 0, "full_max": 183 },
      "socal_frequency": { "value": "common", "basis": "one of the most commonly caught SoCal bottom fish; 'sculpin' is the universal local name" },
      "discriminators": [
        { "vs": "cabezon", "test": "Cabezon has NO SCALES (smooth, slimy skin), a single fleshy flap on the midline of the snout and a pair of longer flaps behind the eyes, and a broad bony ridge running from the eye across the cheek. Scorpionfish is scaled, redder, and has spotted fins. Only the scorpionfish's spines are venomous. Note that anglers call BOTH of these 'sculpin', which is exactly why this pair must be in the tree." },
        { "vs": "vermilion_rockfish", "test": "Scorpionfish has spotted fins, a much bigger head relative to its body and big fan-like pectorals; vermilion has plain red fins with black edges." }
      ],
      "confusable_with": ["cabezon", "vermilion_rockfish", "brown_rockfish", "treefish"],
      "legal_risk": { "level": "moderate", "reason": "managed under its own rules rather than the rockfish complex, so mixing it into a rockfish count is a compliance error in both directions. Numbers owned by the regulations spec. Safety: venomous spines." },
      "data_completeness": "good",
      "sources": ["caseagrant_scorpionfish", "pierfishing", "kenjonesfishing", "fishbase", "cdfw_portal"]
    },

    "cabezon": {
      "common_name": "Cabezon",
      "scientific_name": "Scorpaenichthys marmoratus",
      "in_app_vocabulary": true,
      "aliases": ["cabbies", "bullhead", "sculpin (locally, ambiguous)", "marbled sculpin"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["mottled_patterned", "brown", "olive_green", "red"],
        "spots_blotches": { "value": "yes", "description": "heavily marbled/mottled; individual fish run greenish, reddish or brown" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": "large", "eye_size": null, "symphyseal_knob": null, "notes": "THE marks: no scales at all — skin is smooth and slimy; a single fleshy flap (cirrus) on the midline of the snout and a pair of longer flaps just behind the eyes; a very large head with a broad bony support running from the eye across the cheek; no large canine teeth. Spines are NOT venomous. The roe is toxic to humans — do not eat it." }
      },
      "typical_length_mm": { "min": 350, "max": 600, "basis": "estimated" },
      "max_length_mm": { "value": 990, "basis": "source" },
      "depth_m": { "typical_min": 0, "typical_max": 60, "full_min": 0, "full_max": 231 },
      "socal_frequency": { "value": "common", "basis": "widespread nearshore; not separately verified for the Bight" },
      "discriminators": [
        { "vs": "california_scorpionfish", "test": "Scales. Cabezon has none and feels smooth; scorpionfish is scaled. Cabezon has the snout flap; scorpionfish has spotted fins and venomous spines." },
        { "vs": "lingcod", "test": "Lingcod has big fang-like canine teeth, a longer more eel-like body and a long dorsal fin notched between the spiny and soft parts. Cabezon has no big canines and has the fleshy snout flap." }
      ],
      "confusable_with": ["california_scorpionfish", "lingcod"],
      "legal_risk": { "level": "moderate", "reason": "part of the nearshore complex with its own size rule. Numbers owned by the regulations spec. Safety: the roe is toxic." },
      "data_completeness": "good",
      "sources": ["cdfw_portal", "pierfishing", "kenjonesfishing", "fishbase"]
    },

    "lingcod": {
      "common_name": "Lingcod",
      "scientific_name": "Ophiodon elongatus",
      "in_app_vocabulary": true,
      "aliases": ["ling", "lings", "buckethead"],
      "aliases_verified": false,
      "traits": {
        "primary_color": ["brown", "olive_green", "blue", "mottled_patterned"],
        "spots_blotches": { "value": "yes", "description": "mottled and spotted in brown, grey and green-blue; a minority of fish have blue-green flesh, which is harmless" },
        "fin_color": { "description": null, "contrasting_margins": null, "margin_description": null },
        "bands_stripes": { "value": "no", "locations": [], "description": null },
        "head_jaw": { "head_spines": null, "lower_jaw_projecting": null, "mouth_size": "large", "eye_size": null, "symphyseal_knob": null, "notes": "THE marks: an elongate body, a very large mouth with prominent CANINE (fang-like) teeth, and a long dorsal fin notched between the spiny and soft sections. No fleshy flap on the snout." }
      },
      "typical_length_mm": { "min": 500, "max": 800, "basis": "estimated" },
      "max_length_mm": { "value": 1520, "basis": "source" },
      "depth_m": { "typical_min": 10, "typical_max": 100, "full_min": 0, "full_max": 427 },
      "socal_frequency": { "value": "occasional", "basis": "present in the Bight, more abundant to the north; not separately verified" },
      "discriminators": [
        { "vs": "cabezon", "test": "Teeth. Lingcod has big canines; cabezon does not, and cabezon has the fleshy snout flap and scaleless skin." }
      ],
      "confusable_with": ["cabezon"],
      "legal_risk": { "level": "moderate", "reason": "has a minimum size limit and its own sub-limit. Numbers owned by the regulations spec." },
      "data_completeness": "good",
      "sources": ["cdfw_portal", "fishbase", "wdfw_species", "noaa_fisheries"]
    }

  }
}
```
