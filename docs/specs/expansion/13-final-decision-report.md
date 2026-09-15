# Final decision report

**Status:** Strategic assessment. Opinionated by request.
**Date:** 2026-09-15
**Reads:** every other file in `docs/specs/expansion/`
**Decision owners:** founder (gates), `ceo` (scope), `architect` (structure), `counsel` (legal)

---

## 1. The one-paragraph version

The expansion brief describes a global fisheries intelligence platform. The repository
contains a good personal logbook, an unusually complete tournament backend, the best
regulation feature I have seen in a consumer fishing app, and **two catch-record systems
that do not know about each other.** The single highest-value act in the entire brief is
not AI, not maps and not government: it is joining those two records, turning on the
enrichment worker that was designed two months ago and never built, and fixing a tournament
information architecture that is measurably confusing at 320 px. That is Phase 1, it needs
no new science, no new partner and no new consent, and it makes every later ambition
possible. Everything involving photographs is blocked on a founder cost decision, not on
capability. Everything involving government is blocked on ten conversations nobody has had.

---

## 2. What should be built now

Ranked by value per unit of risk.

1. **Join the two catch records.** `tournament_catch.catch_id → public.catch`. Without it,
   personal bests undercount, effort statistics are wrong by exactly the tournament volume,
   and the most heavily evidenced catches in the system carry the least scientific metadata.
   It is a one-column migration and a trigger. Everything downstream depends on it.
2. **The enrichment worker.** The schema, the provenance fields, the status lifecycle and
   the retry semantics already exist and have never run. This converts a logbook into a
   dataset with no new product surface and no new consent.
3. **The tournament information architecture.** Measured: two navigation systems disagreeing
   about whether there are three, four or five steps; the primary action 740 px down the
   page on a live event; a validation error shown before the user has typed anything. All
   fixable with no backend work.
4. **The equipment catalog ladder.** ADR 008 already built the mechanism; this adds the data
   behind it. Real user value, low risk, and it makes gear poolable for the first time.
5. **Privacy governance.** Cheap now, impossible to retrofit, and a hard dependency of every
   other ambition in the brief.

## 3. What should be researched first, before building

1. **Do the trait keys already beat a model?** For salmon and rockfish — the two
   highest-consequence groups — a two-question agency key may be better, offline, free and
   auditable. If so, AI Fish ID's honest scope is the low-consequence long tail, which is
   also the lowest-value segment. **Answer this before spending a season collecting images.**
2. **Does any agency want this?** Ten conversations. No code.
3. **Is individual re-identification possible for the species our users catch?** Probably
   not, for uniform species. One controlled study answers it.
4. **What is the real k threshold?** `ontology.md` §6 already assigned this to `biostat` and
   it is still open. The community map's viability depends on the answer.
5. **Where is the fact/compilation line on equipment catalogs?** `counsel`, before any bulk
   import.

## 4. What should remain a long-term bet

Mandatory reporting; per-licence fees; revenue sharing; multi-state expansion; international
regulation packs; 3-D visualisation; biometric re-identification as a product rather than a
study; commercial data licensing. Each requires something we do not have — legislation, a
signed pilot, a validated model, a licensed dataset — and none of them should shape
architecture today.

---

## 5. The five most dangerous assumptions

| # | Assumption | Why it is dangerous | How to falsify it cheaply |
|---|---|---|---|
| **1** | *Agencies will pay, and a $10 per-licence fee is attachable.* | Licence fees are usually statutory; an incumbent vendor owns the transaction; anglers organise against new fees. This assumption underwrites the whole commercial thesis in the brief. | 10 discovery conversations, one of them with a licensing manager. Weeks, not years. |
| **2** | *Voluntary catch data is good enough for stock assessment.* | It is self-selected and skewed toward successful trips and engaged anglers. An agency that uses it without a bias statement will blame us for the conclusion. | Ask one stock-assessment analyst to look at a real export and say whether they could use it. |
| **3** | *AI fish ID will be accurate enough to be safe.* | Look-alike species are exactly where the value and the legal danger both live. A confident wrong answer on a protected rockfish is the liability event. | Run the trait-key comparison on existing photos before building anything. |
| **4** | *k-anonymity protects fishing spots.* | k = 5 over 10 km cells does not protect a spot fished by five friends, and repeated aggregates leak by differencing. | Red-team the aggregate API with a differencing attack before the community map ships. |
| **5** | *The tournament flow works.* | Every screen has only ever been exercised against a seeded local demo store, in every environment. The scores in the critic loop carry a systematic upward bias because of it. | Run one real, small, free event. |

**A sixth, which the brief itself contains:** *"do not create a second, competing
catch-record system."* We already did, three months ago, and nobody noticed until this
audit. The dangerous assumption is that a rule stated in a document is a rule enforced in a
schema.

---

## 6. Strongest immediate user value

**The tournament information architecture rebuild, with one-catch submission.**

An angler currently logs the same fish twice, in two flows, into two tables, and then cannot
find the button to do it because it is below the fold. Fixing that removes work from the
user, removes a whole class of data corruption, and needs nothing that does not already
exist. Second place: the equipment ladder, because "pick your reel, specs preloaded" is
immediately, obviously better than typing.

## 7. Strongest government value

**Fish Legal, as a data-authorship partnership — not the dashboard, and not reporting.**

~50 region packs already exist with citations and versioned snapshots on every catch. An
agency's cheapest, lowest-risk, highest-status contribution is to *review and authorise one
pack*. It costs them a staff afternoon, gives us the credibility nothing else can buy, and
requires no procurement, no fee and no legislation.

The dashboard and the reporting workflow are what an agency asks for second. Authorship is
what they can say yes to first.

## 8. Strongest defensible advantage

**The environmental snapshot with per-field provenance, attached immutably to a catch.**

Anyone can build a catch log. Anyone can buy weather data. Almost nobody will do the
unglamorous work of recording, for every value, *which provider, which dataset version, what
kind of observation, observed when, retrieved when, at what resolution, how far from the
source*, and then refusing to overwrite it when the provider improves. That discipline —
plus the regulation snapshot the app already writes on every catch — is what makes a dataset
a scientist will accept, and it compounds every season. It cannot be retrofitted onto a
competitor's five years of history.

Runner-up: the regulation snapshot itself. It is already shipped and already unusual.

---

## 9. The smallest credible government pilot

> **One species. One region. One season. One question. No fee.**

- **Species:** California halibut. Popular, size-regulated, already in the SoCal pack, and
  an agency already cares about its recreational take.
- **Region:** one CDFW management area.
- **Ask of the agency:** review and authorise the halibut rules in our SoCal pack
  (`fish-legal-agency-integration.md` level 1 authorship), and nominate one analyst to
  receive a quarterly aggregate.
- **Ask of anglers:** opt in; log halibut as you already do.
- **We deliver:** a quarterly aggregate at 10 km cells with a 30-day delay, a written bias
  and coverage statement, and a published end-of-season report including what the data
  cannot support.
- **We charge:** nothing.
- **Success:** the analyst answers *"yes, I could use this"* — or tells us precisely why not,
  which is equally valuable and much cheaper than finding out at Level 2.
- **Cost:** a data-sharing agreement, an export, a report. No dashboard, no licence
  integration, no procurement.

Everything else in the government brief is a consequence of this working.

## 10. The smallest credible AI Fish ID experiment

> **No model. No training. Four weeks.**

1. Collect 300 photographs of rockfish already taken by existing users, with consent, across
   the vermilion / canary / yelloweye complex.
2. Have an ichthyologist label them. That is the ground truth.
3. Run three things against the same images:
   - the **existing trait-key** decision path,
   - an **off-the-shelf** general vision model with no fine-tuning,
   - **anglers themselves**, unaided.
4. Report per-species precision, recall and the confusion matrix for all three.

**If the trait key wins** — which is the outcome to expect for this complex — AI Fish ID's
scope shrinks to the species no key covers, and we have saved a season and a model-training
budget by spending four weeks. **If the off-the-shelf model is close**, we have a baseline
and a justified reason to build. Either result is worth more than the first six months of a
training pipeline.

## 11. The smallest credible re-identification experiment

> **No machine learning at all, for six months.**

Partner with an existing **tagging programme**. Add one feature: a tag-number field and a
tag-photo prompt on the catch sheet, with the programme's own reporting flow behind it.

Then measure:

1. How many tagged fish do our users actually encounter and report? (If the answer is "four",
   there is no biometric programme to build — there is not enough recapture in the world our
   users fish.)
2. For those, do we have photographs good enough, from both captures, to attempt matching
   retrospectively? Score them against the capture protocol.
3. Only if both answers are encouraging, run the controlled validation study on 2–3 species.

This costs one form field. It tests the two assumptions the whole programme rests on —
recapture frequency and photo quality — before a single embedding is computed. And the
tag-reporting feature has standalone scientific value even if biometrics never happens,
which may well turn out to be the real contribution: **volume of tag reports, not computer
vision.**

---

## 12. The next ten engineering tickets, in order

| # | Ticket | Spec | Why here | Est. |
|---:|---|---|---|---|
| 1 | **`tournament_catch.catch_id` → `public.catch`**, with the account-holder trigger and a recorded backfill decision | `data-architecture-expansion.md` §5 | Everything downstream is wrong without it, and it is one column | S |
| 2 | **`core/privacy/`**: precision ladder, effective-precision intersection, k-anonymity gate — pure, vector-tested, sole authority | `privacy-consent-...` §9 | Cheap now, impossible later. Blocks the map, exports, agency, AI | M |
| 3 | **Enrichment worker skeleton + provider cache + tide adapter**, reusing `noaa-tides.ts`, writing `environmental_observation` | `catch-environmental-enrichment.md` §9 | The designed-and-never-built feature. Turns the logbook into a dataset | M |
| 4 | **Delete the duplicate tournament navigation.** One tab bar, no step numbers, journey cards removed, primary action above the fold | `tournament-experience-redesign.md` §6.1–6.2 | The largest measured usability defect in the product | M |
| 5 | **Measurement tests in CI** at 320/390 px: primary-action offset, bar height, bottom padding, horizontal overflow, touch size | `ui-ux-critic-loop.md` §11 | Stops every R1 finding from coming back. Do it *with* ticket 4, not after | S |
| 6 | **Register-screen error prevention**: no validation before interaction; refund checkbox beside its text; one test-mode notice at the top; one numeric treatment | `tournament-experience-redesign.md` §6.4 | The clearest error-prevention defect; money is involved | S |
| 7 | **One-catch submission**: the quick-log sheet gains a single "Count in {event}" toggle writing both rows | `tournament-experience-redesign.md` §6.5 | Removes duplicate entry permanently. Depends on ticket 1 | M |
| 8 | **`environmental_observation` + provider registry + SST, wind and pressure adapters**, with per-field provenance rendered in `sourced-value.tsx` | `catch-environmental-enrichment.md` §6.3, §8 | The defensible advantage (§8 above), made real | L |
| 9 | **Equipment catalog schema + ladder + ~200 seeded models**, extending `fieldOptions()` without breaking the Quiver | `equipment-product-catalog.md` §6, §8 | High user value, low risk, makes gear poolable | L |
| 10 | **`/settings/privacy`** with the honest empty state, per-catch override, coordinates-off-by-default export, and the deletion job that reaches media and embeddings | `privacy-consent-...` §7 | The angler-facing half of ticket 2; also the first thing any agency or reviewer asks to see | M |

**Not in the top ten, deliberately:** the community map (no data yet), the agency dashboard
(no agency yet), AI Fish ID (no media ruling, and §10's experiment comes first), biometrics
(§11's tag experiment comes first), the 3-D view (not on this data resolution), licence
integration (vendor-gated).

**Two non-engineering items that outrank all ten:** the founder's ruling on server media,
and ten agency conversations. Neither costs engineering time and both change what the list
should be.

---

## 13. Where I disagree with the brief

Stated plainly, because a plan that agrees with everything is not a plan.

1. **"Fish Legal should eventually support all US coastal regions, inland states, Mexico."**
   It already supports ~50 regions, and that is already more maintenance than anyone is
   funding. The next move is not expansion; it is **retiring the packs we cannot keep
   current** and making freshness visible.
2. **"Validate dark, light and night modes."** There is one mode, by an explicit design
   decision grounded in glare on open water. Building a light theme to satisfy a checklist
   would make the product worse where it is used. **Night mode, however, genuinely does not
   exist and genuinely should** — that is the real finding behind the request.
3. **The $10 per-licence fee.** It is the most attractive number in the brief and the least
   likely to survive a licensing statute, an incumbent vendor contract and an organised
   angler response. Build so the business never depends on it.
4. **Conservation points, recapture badges and prizes.** `ROADMAP.md` Part 3 already ruled
   that rewarding logging corrupts the data the product's statistical claim rests on.
   Rewarding *recaptures* is worse because it rewards handling a live animal again. The
   incentive must reward honest confirmation and data quality — never an outcome.
5. **The Google-Earth-like 3-D map.** Bathymetry at 450 m resolution rendered in 3-D looks
   authoritative and is not. It is the most expensive and least defensible item in the
   brief.
6. **"Real-time" environmental data.** Satellite SST is a multi-day composite; HF-radar
   currents are patchy and coastal; buoys are points 20 km away. The product's advantage
   comes from saying so, not from hiding it.
7. **The premise that the agency is the customer.** A plausible and cheaper reading is that
   the agency is a **data partner and a credibility source**, and the paying customers are
   anglers and tournament operators — which is exactly what `SPEC.md` D14 already decided.
   This deserves an explicit `ceo` ruling before any procurement effort is spent.

---

## 14. What I would protect, if pressure came

Four decisions in this repository are better than they look and will be the first things a
growth or partnership conversation asks to relax:

1. **Citation or nothing.** Fish Legal's willingness to say "we don't know" is why its trust
   score is the highest number in the product.
2. **Missing is null, never zero.** Written into a schema comment by someone who knew what
   they were protecting.
3. **No streaks, no logging rewards.** The denominator is the asset.
4. **The catch is the fact; everything else happens around it.** The ordering contract in
   `create.ts` is the reason offline logging works, and it is one refactor away from being
   lost.
