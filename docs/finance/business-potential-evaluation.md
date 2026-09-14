# Fish Log Book — Business Potential & Profitability Evaluation

**Date:** 2026-09-14 · **Type:** independent investment-style review · **Audience:** the founder
**Status:** analysis, not a decision. Nothing here overrides `SPEC.md` or a founder call.

> **What this document is.** An outside-investor read of the thing this repository is
> actually building, priced. It deliberately does not flatter the work. Every number is
> either sourced, derived from a stated assumption, or labelled **assumption**. Where the
> evidence does not exist, the range is wide and says so.
>
> **Source discipline.** Anything marked FACT has a citation. Anything marked ASSUMPTION
> is my estimate and can be argued with. Do not quote an assumption back to anyone as a
> finding.

---

## 0. The thing being evaluated (read this first)

There is not one business in this repository. There are **two**, fused, plus a third
sitting unrecognised as an asset:

| # | Business | What it is | Buyer | Status in repo |
|---|---|---|---|---|
| **A** | **Consumer fishing logbook** | Tide/condition-correlated catch journal, salt + bass, free logging, paid interpretation (`SPEC.md` D1, D14) | Individual angler | Web prototype substantially built. Native iOS/Watch client (D15, the *stated shipping V1*) does not exist. |
| **B** | **Tournament operations platform** | Multi-tenant tournament OS: orgs, divisions, registration, Stripe checkout, fair-play verification, server-authoritative scoring (`docs/architecture/tournament-domain-model.md`, ADR 010) | Tournament director / club / charity / circuit | Schema, registration, checkout and a Stripe webhook merged (PRs #126–#131). |
| **C** | **Fish Legal regulations dataset** | Machine-readable bag/size/season/boundary rules across ~20+ US states, versioned, snapshot-per-catch | Latent — other apps, guides, insurers, agencies | ~25 migrations of hand-assembled regulatory content. Unrecognised as a separate asset. |

**These have different customers, different sales motions, different risk profiles, and
very different odds.** Scoring them as one product produces a mush. This document scores
the blended entity, but every section splits A / B where the answer differs, because the
single most valuable output of this review is *which one to cut*.

**Current hard facts about the venture** (from the repo, 2026-09-14):

- ~61,400 lines of TypeScript/TSX, 95 test files, 40+ Supabase migrations, ~49 routes.
- **Zero users. Zero revenue. No App Store presence. No production deployment evidenced.**
- Stripe keys are absent by design; the payment webhook refuses every request until
  onboarding and the legal work are done (`.env.local.example`). Money has never moved.
- Pricing is *recommended* at $49.99/yr + $7.99/mo (O6) and **not yet ratified**.
- Built by one founder driving an AI specialist team. Cash burn to date is effectively
  API spend plus time.

---

## 1. Idea summary

**What is being built.** A fishing logbook that captures a catch — and, critically, a trip
that produced *nothing* — in one tap, then silently attaches the environmental state at
that instant: tide height, tide state, **tide speed** (the derivative of the 6-minute NOAA
prediction series), moon phase angle, barometric pressure, weather, GPS. Over time the
angler can query their own history ("halibut, fast outgoing, three days off full") and
eventually receive a decomposable "bite score" describing conditions. Around it has grown
a legal-limits layer, a species passport, and a tournament platform that takes real money.

**Who the customer is.** Business A: the avid US angler — fishes 10+ times a year, already
owns Tide Alert or Fishbrain, keeps notes somewhere. Business B: the tournament director —
a club officer, charity organiser, or small circuit operator running 1–20 events a year
for 30–400 anglers, currently on spreadsheets, Facebook, and a cash box.

**The problem.** A: anglers believe conditions drive the bite and have no way to test it
against their own history, because nobody records the days they blanked. B: running a
tournament is a manual nightmare of registration, payment collection, weigh-in queues,
cheating suspicion, and a scoreboard written on a whiteboard.

**Why anyone pays.** A: weakly — for *interpretation*, not logging (D14). This is the soft
spot. B: strongly and immediately — a director already loses money and evenings to the
manual version, and the software fee can be passed to the angler (the category's standard
move; see §3).

**Likely business model.** A: freemium subscription, $49.99/yr. B: per-angler-entry fee
and/or a percentage of entry fees, charged at registration, plus an organisation
subscription for circuits.

**Competitive advantage.** The honest list is short: (1) the blank-trip denominator, which
is a genuine methodological differentiator nobody else collects; (2) tide *speed* as a
first-class variable, correctly derived rather than faked from harmonics (O1); (3) an
ontology disciplined enough that data can be pooled later; (4) in B, the fact that
tournament scoring sits on top of a real catch record with legal snapshots and fair-play
signals, which pure registration tools do not have.

**What must be true.**
1. Anglers will log **blank trips** without being rewarded for it — and the spec forbids
   rewarding it, because rewards corrupt the denominator (`ROADMAP.md` Part 3). This is
   the load-bearing assumption of the entire consumer thesis.
2. A meaningful slice of free loggers converts to paid interpretation — `cfo` already
   modelled that 1,000 users needs an implausible 85% conversion, and the planning target
   is **10,000 users at 5–10%** (R9).
3. Distribution exists. Nothing in this repository, or in the plan, is a distribution
   strategy.
4. For B: the founder is willing to hold other people's entry-fee money, with everything
   that legally implies.

**Investment thesis, five sentences.** Fish Log Book is a technically serious, unusually
well-specified product with no customers, no distribution plan, and a consumer market that
has repeatedly destroyed better-funded entrants. Its differentiator — blank trips and tide
derivative — is real science but it is a *feature*, and it depends on unpaid user
discipline that the product is forbidden from incentivising. The tournament platform
accidentally built alongside it is the stronger business: identified buyers, immediate pain,
cash-collecting at the point of value, and a live competitive price point of about $2 per
angler per event. Capital requirements are trivially low and AI leverage on build is
genuinely high, so the downside is bounded at roughly $30–60k and the founder's time. The
expected value is respectable only because of a thin upside tail; the **median** outcome of
this venture as currently scoped is a beautiful, unused codebase.

---

## 2. Market opportunity

### 2.1 The underlying population (FACT)

- **57.9 million Americans** aged 6+ fished in 2024 — an all-time high, 19% of the
  population ([RBFF/Outdoor Foundation 2025 Special Report on Fishing](https://www.takemefishing.org/getmedia/a57d8109-fec7-48eb-8b19-47b193e0fb18/2025SpecialReport.pdf)).
- **5.1 million first-timers** in 2024 (9% of participants) — but the sport **lost 16.6
  million anglers, a −23% churn rate**, in the same year ([RBFF, reported by Boating Industry](https://boatingindustry.com/news/2025/07/31/rbff-reports-record-fishing-participation-in-2024/)).

That churn figure is the most important market fact in this document and it is almost
never quoted in fishing-app pitch decks. **Roughly a quarter of the addressable population
leaves the hobby every year.** A subscription product in this category is not fighting
product churn; it is fighting *category* churn underneath it.

### 2.2 TAM / SAM / SOM

**Business A — consumer logbook subscription (US-first; NWS/NOAA dependency makes the
product US-only until a second data pipeline is built — `COSTS.md`).**

| Layer | Derivation | Value |
|---|---|---|
| **TAM** | 57.9M US anglers × 8% who would ever pay for any fishing app (ASSUMPTION) × $60/yr effective | **~$280M/yr** (range $150–350M) |
| **SAM** | Avid anglers only (~1/3 of participants ≈ 19M, ASSUMPTION) × 55% iOS × 6–8% pay-willing × $50 net | **~$30M/yr** (range $20–45M) |
| **SOM (3 yr, solo + AI, no paid marketing)** | 2,000–15,000 paying subs | **$85k–$640k/yr** |

**Business B — tournament operations.**

| Layer | Derivation | Value |
|---|---|---|
| **TAM** | ~30,000 US organised tournaments/yr (ASSUMPTION — only ~300 *professional* bass events are documented; club, charity, saltwater and kayak events dominate by count) × ~80 anglers avg = ~2.4M angler-entries × $2–4 captured | **$5–10M/yr** as pure software fee; **$25–80M/yr** if taking 5–8% of ~$400M–1B in gross entry fees (ASSUMPTION on flow) |
| **SAM** | Directors reachable without a sales team: clubs, charities, kayak series, small saltwater opens ≈ 40% of events | **$2–4M/yr** software-fee basis |
| **SOM (3 yr)** | 150–1,500 events/yr on platform | **$25k–$500k/yr** |

**Business C — regulations data.** No credible TAM without a buyer conversation. Treat as
a call option worth $0 until someone asks to license it.

### 2.3 Market characteristics

| Dimension | Business A | Business B |
|---|---|---|
| Target customer | Avid angler, 35–65, iOS, spends on tackle freely | Tournament director; club treasurer; charity organiser |
| Purchasing power | High on *gear*, low on *software* — a $500 reel and a $50 app feel different to the same person | Spends other people's money; fee is passed through to entrants |
| Growth | Participation at record high but flat-ish; app category mature | Growing — digitisation of weigh-ins and catch-photo-release formats is actively happening |
| Maturity | **Late/consolidating.** Fishbrain claims 20M+ users at $9.99/mo or $74.99/yr ([App Store](https://apps.apple.com/us/app/fishbrain-fishing-app/id477967747), [pricing](https://adapty.io/paywall-library/fishbrain/)); free-at-core rivals (FishAngler, GilledIt) are pressuring paywalls ([category review, 2026](https://www.gilledit.com/us/blog/best-fishing-apps)) | **Early/fragmented.** WeighBook, Weighfish, TourneyX, FishDonkey, Fishing Chaos, WebPro — many small vendors, no dominant standard |
| Competitive intensity | **Very high** | Moderate |
| Existing alternatives | Fishbrain, Navionics, FishAngler, Tide Alert, paper notebooks, Notes app, memory | Spreadsheets, Facebook groups, PayPal/Venmo, whiteboards, incumbent vendors |
| Fragmentation | Consolidating around 2–3 large apps | Highly fragmented — good for a new entrant |
| Barriers to entry | Low to build, **brutal** to distribute | Moderate — payments, trust, and money-handling compliance are real barriers that *help* whoever clears them |

**Market Opportunity Score: 5/10** overall (A: **4/10** — large but late, price-compressed,
and category churn is −23%/yr; B: **7/10** — smaller but early, fragmented, and the buyer
already pays cash for worse).

### 2.4 What share of the realistic market each revenue level requires

Consumer subscription at $49.99/yr list, net ~$42.50 after Apple's 15% small-business rate
(ASSUMPTION: ~85% choose annual; Apple SBP applies under $1M).

| Revenue | Paying subs needed | Free users needed at 7% conversion | % of SAM's ~700k pay-willing anglers |
|---|---|---|---|
| $100k/yr | ~2,350 | ~34,000 | 0.34% |
| $500k/yr | ~11,800 | ~170,000 | 1.7% |
| $1M/yr | ~23,500 | ~336,000 | 3.4% |
| $5M/yr | ~118,000 | ~1.7M | 17% — **implausible for this entity** |
| $10M/yr | ~235,000 | ~3.4M | 34% — **not a realistic path** |

Tournament line at a blended **$3.00 net per angler-entry** (ASSUMPTION: $2 base fee like
WeighBook plus payment spread; [WeighBook charges $2/angler with the fee added to the
angler's entry](https://www.weighbook.com/pricing)):

| Revenue | Angler-entries/yr | Events/yr at 80 anglers | % of estimated US entries |
|---|---|---|---|
| $100k | 33,000 | ~415 | 1.4% |
| $500k | 167,000 | ~2,080 | 7% |
| $1M | 333,000 | ~4,150 | 14% — hard, but not fantasy |
| $5M | needs the % -of-entry-fee model (~$12/entry effective), i.e. ~420k entries | ~5,200 | 17% + much higher take |
| $10M | requires national circuits + payout services | — | market-leader outcome |

**Read this table honestly:** $1M ARR is reachable in the tournament market at a plausible
share. In the consumer market it requires a third of every American angler who would ever
pay for software. That asymmetry is the finding of section 2.

---

## 3. Business model

### 3.1 Strongest monetisation models, ranked

1. **Per-angler-entry transaction fee (B)** — highest conviction. Collected at the moment
   money is already changing hands, invisible to the payer, standard in the category.
2. **Organisation subscription (B)** — $49–$299/mo for circuits running many events;
   smooths the seasonality that kills consumer fishing apps.
3. **Consumer annual subscription (A)** — as specified, $49.99/yr. Works, but it is the
   slowest and most crowded dollar in the business.
4. **Payment processing spread (B)** — 0.5–1.0% over Stripe's cost. Material once flow
   exists; also the line that attracts regulatory attention (§12).
5. **Regulations data licensing (C)** — pure option value; near-zero marginal cost if a
   buyer appears.
6. **Sponsorship of tournaments (B, later)** — tackle brands already sponsor events;
   a platform with the entrant list is the natural broker.

Explicitly **reject**: advertising (audience far too small, and ads in a $50/yr app is
value-destroying), a marketplace (no inventory, no reason to be the venue), and selling
angler location data (spot privacy is the category's third rail and the spec already
forbids it).

### 3.2 Unit economics

All ASSUMPTION unless marked. Infra numbers come from `docs/finance/cost-model.md`, which
is unusually well-built and I have not re-derived it.

**Business A — consumer subscription**

| Metric | Low | Base | High | Note |
|---|---|---|---|---|
| Price | $39.99/yr | $49.99/yr | $59.99/yr | O6 recommendation is $49.99 + $7.99/mo |
| Net ARPU after store fee | $34 | $42.50 | $51 | 15% Apple SBP |
| Gross margin | 93% | 96% | 98% | Infra is $0.006–0.05/user/mo (`COSTS.md`) — **infra is never the constraint** |
| CAC (organic/content only) | $8 | $25 | $60 | The number nobody has tested |
| CAC (paid social) | $45 | $90 | $180 | Outdoor apps bid against gear retailers |
| Annual churn | 35% | **50%** | 65% | Seasonal product + −23% category churn |
| Customer lifetime | 2.9 yr | **2.0 yr** | 1.5 yr | |
| LTV (net, margin-adjusted) | $95 | **$82** | $73 | |
| LTV:CAC (organic) | 12:1 | **3.3:1** | 1.2:1 | Viable organic, marginal paid |
| LTV:CAC (paid) | 2.1:1 | **0.9:1** | 0.4:1 | **Paid acquisition does not work at $50/yr** |
| Contribution margin/sub/yr | $32 | $40 | $49 | |
| Break-even subs (at $2,800/mo fixed — see §7) | — | **~840 paying subs** | — | ≈12,000 free users at 7% conversion |

**The single most important line above: paid acquisition is not viable.** At a $50 price
point and 50% churn, buying users loses money. That forces organic/content/community
distribution, which is slow, unpredictable, and founder-hour-intensive — and which is
precisely what §14 scores worst.

**Business B — tournament platform**

| Metric | Low | Base | High |
|---|---|---|---|
| Fee per angler-entry | $1.50 | **$3.00** | $6.00 (% model) |
| Anglers per event | 40 | **80** | 250 |
| Revenue per event | $60 | **$240** | $1,500 |
| Events per director per year | 1 | **4** | 20 |
| ARPA (per director/org, yr) | $60 | **$960** | $30,000 |
| Gross margin after Stripe | 82% | **88%** | 91% |
| CAC (direct outreach, founder-sold) | $80 | **$250** | $600 |
| Director annual retention | 55% | **75%** | 90% |
| Director lifetime | 2.2 yr | **4.0 yr** | 10 yr |
| LTV | $115 | **$3,380** | $270,000 |
| LTV:CAC | 1.4:1 | **13.5:1** | very high |
| Break-even directors (at $2,800/mo fixed) | — | **~35 active directors** | — |

**35 tournament directors versus 840 consumer subscribers for the same break-even.** That
is a 24× difference in the number of humans who must be persuaded, and tournament
directors are individually findable, contactable, and already spending money. This is the
economic core of my recommendation.

---

## 4. Probability distribution of outcomes

Startup outcomes here are **not normal**; they are heavily left-massed with a thin right
tail. Business A is a lottery with a low ticket price. Business B is a lognormal small
business with a modest tail. Blended:

### LOW CASE — 55%
*Ships late or never as a native client; consumer conversion lands at 1–2%; tournament
line is never sold because selling is uncomfortable; scope keeps growing.*

| Horizon | Users | Revenue | Annual profit | Valuation |
|---|---|---|---|---|
| 6 mo | ~30 (friends) | $0 | −$6k | ~$0 |
| 12 mo | 200–800 free, ~15 paid | $1–4k | −$12k | ~$0 |
| 24 mo | 1,500 free, 40 paid | $3–9k | −$10k | <$25k (code as an asset) |
| 36 mo | stalled or abandoned | $0–25k | −$5k to +$3k | $0–50k |
| 5 yr | abandoned | $0 | $0 | $0 |

### BASE / MOST LIKELY — 28%
*Web app ships; the tournament line gets sold to a local circle; consumer subscription
becomes a modest second stream; founder treats it as a serious side business.*

| Horizon | Metric | Revenue | Annual profit | Valuation |
|---|---|---|---|---|
| 6 mo | first 3 tournaments run | $1.5k | −$8k | — |
| 12 mo | 20 events + 300 paid subs | $22k | −$5k | ~$50k |
| 24 mo | 70 events + 900 paid subs | $62k | $28k | ~$150k |
| 36 mo | 150 events + 1,800 paid subs | **$120k** | **$70k** | **$250–400k** (2.5–3.5× SDE) |
| 5 yr | 350 events + 3,500 subs | $290k | $170k | $600k–1.0M |

### HIGH CASE — 13%
*Tournament platform finds a repeatable channel (a state circuit, a kayak series, a
charity network); consumer app rides the tournament install base; first contractor hired.*

| Horizon | Revenue | Annual profit | Valuation |
|---|---|---|---|
| 6 mo | $8k | −$15k | — |
| 12 mo | $95k | $10k | $250k |
| 24 mo | $340k | $140k | $1.0–1.4M |
| 36 mo | **$700k** | **$350k** | **$2.1–3.5M** (3–5× ARR) |
| 5 yr | $1.9M | $850k | $6–10M |

### PRECISION EXECUTION / UPSIDE — 4%
*The tournament OS becomes the default rail for US amateur tournaments, takes a percentage
of entry fees and eventually payouts, and the logbook becomes the angler-side hook with
real pooled data behind it. Requires outside capital, 3–8 employees, and compliance work
done properly.*

| Horizon | Revenue | Annual profit | Valuation |
|---|---|---|---|
| 12 mo | $250k | −$150k (funded) | $3–5M (seed) |
| 24 mo | $1.4M | $250k | $10–15M |
| 36 mo | **$3.5M** | **$1.4M** | **$17–35M** |
| 5 yr | $11M | $4M | $60–120M |

### Probability summary

| Outcome | Probability | Reasoning |
|---|---|---|
| **Failure** (abandoned, or <$25k/yr at 36 mo) | **55%** | No distribution plan, no shipped client, scope still expanding, solo founder, seasonal market with −23% category churn |
| **Sustainable small business** ($60k+/yr, founder-meaningful) | **32%** | Product quality is genuinely high; the tournament buyer is reachable; costs are near zero, so survival is cheap |
| **>$100k annual profit** | **18%** | Requires the tournament line to be sold deliberately |
| **>$1M annual revenue** | **8%** | Needs a repeatable channel, not just a good product |
| **>$1M annual profit** | **3.5%** | Needs the % -of-entry-fee model and real scale |
| **Worth $10M+** | **3.5%** | Tournament-rail outcome with outside capital |
| **Worth $100M+** | **0.4%** | Would require becoming the payments layer for competitive fishing nationally, plus international |

These are not independent buckets; each is a superset threshold and they are internally
consistent with the four scenarios above (e.g. "worth $10M+" ≈ the upside case plus the
top half of the high case).

**Why 55% failure and not 80%** (the base rate for consumer apps): the code exists, the
capital at risk is near zero, the founder is domain-expert, and there is a second business
inside the first that does not depend on consumer conversion. **Why not 35%:** nothing has
ever been sold, the shipping client per D15 has not been started, and the scope has grown
in every month of this repository's history.

---

## 5. Expected value

Probability-weighted, at the 36-month horizon:

| Measure | Low (55%) | Base (28%) | High (13%) | Upside (4%) | **Expected value** |
|---|---|---|---|---|---|
| Annual revenue | $15k | $120k | $700k | $3,500k | **$272k** |
| Annual profit | −$3k | $70k | $350k | $1,400k | **$120k** |
| Enterprise value | $20k | $325k | $2,800k | $24,000k | **$1.43M** |
| Founder equity value (100% low/base, 92% high, 55% upside after dilution) | $20k | $325k | $2,576k | $13,200k | **$911k** |

**Against what is required (36 months):**

| Input | Estimate |
|---|---|
| Cash | $30–60k recommended path (§7) |
| Founder hours | ~2,000–2,600 (§8) |
| AI-agent hours | ~5,500–8,000 |
| Opportunity cost of founder time | $150k–420k (at $75–160/hr of alternative professional output) |
| Elapsed time | 3 years of part-to-full attention |

**Expected founder equity value ≈ $911k against ~$45k cash and ~$280k of opportunity
cost → roughly a 2.8× risk-adjusted return over three years.** But note where it comes
from: **$528k of the $911k (58%) sits in the 4% upside branch.** Strip that branch out and
expected equity value falls to ~$383k — which, against $280k of opportunity cost, is
**marginal**.

**Verdict on the EV profile: ATTRACTIVE, conditionally.**
- Attractive **if** the founder pursues Business B deliberately and accepts the tail as
  the point.
- **Marginal** if the venture continues as a consumer logbook with a tournament feature
  attached, because that configuration removes most of the tail.
- **Poor** on a median basis in every configuration — the most likely single outcome is
  still a near-zero one. That is normal, and it is survivable only because the cash
  downside is small.

---

## 6. Time to profitability

Clock starts 2026-09-14. "MVP" means *in the hands of a non-founder user*, which is the
definition the repo has not yet met.

| Milestone | Low (fast) | **Most likely** | High (slow) | Note |
|---|---|---|---|---|
| Web MVP usable by a stranger | 3 wks | **6 wks** | 12 wks | Mostly built; gap is deployment, auth polish, onboarding, and a real Supabase project |
| Native iOS per D15 (the *stated* shipping client) | 4 mo | **8 mo** | 14 mo | **Not started.** Swift + watchOS + offline sync from zero |
| First paying customer — tournament (B) | 1 mo | **2.5 mo** | 6 mo | Requires Stripe onboarding + terms + one willing director |
| First paying customer — consumer (A) | 5 mo | **10 mo** | 18 mo | Gated on paid-tier features (V2 per D14) that do not exist |
| Break-even (cash, lean fixed base) | 12 mo | **22 mo** | never (55%) | ~35 active directors or ~840 subs |
| Meaningful profitability ($60k+/yr profit) | 24 mo | **34 mo** | never | |
| $100k annual revenue | 14 mo | **26 mo** | 44 mo | |
| $1M annual revenue | 30 mo | **48 mo** | never (92%) | |
| $1M annual profit | 42 mo | **60 mo+** | never (96.5%) | |

**The most decision-relevant line in this table is row 2.** The spec's shipping client is a
native Swift iPhone + Apple Watch app (D15, reaffirmed by D21), and it does not exist. Every
consumer revenue date above is downstream of an 8-month build that has not begun, on a
language the founder is learning, while the web codebase keeps growing. The tournament line
does **not** have this dependency — it can ship on the web today.

---

## 7. Capital requirements

Infrastructure is genuinely negligible (`COSTS.md`: $9–10/mo at one user, $33–52/mo at
1,000, $60–260/mo at 10,000). The money goes to legal, compliance, and the things AI cannot
do. Figures are 24-month totals.

| Category | Lean | **Recommended** | Aggressive |
|---|---|---|---|
| Development (contractor Swift help, QA devices) | $0 | $8,000 | $60,000 |
| Infrastructure (Supabase Pro, hosting) | $600 | $1,200 | $4,000 |
| AI / API costs (agent team) | $2,400 | $6,000 | $18,000 |
| Cloud / storage / egress | $200 | $800 | $3,500 |
| Data (regulatory verification — **human**, see §8) | $500 | $4,000 | $15,000 |
| Legal — ToS, privacy, tournament rules, prize/contest review | $1,500 | **$9,000** | $25,000 |
| Insurance (E&O / tech liability — needed once you hold entry fees) | $0 | $2,400 | $6,000 |
| Marketing / content | $500 | $4,000 | $40,000 |
| Sales (travel to tournaments, sponsorship of 2–3 events) | $300 | $3,500 | $20,000 |
| Employees / contractors (PT ops, support) | $0 | $0 | $70,000 |
| Hardware (test iPhone, Watch, marine-grade) | $900 | $1,800 | $4,000 |
| Customer service tooling | $0 | $600 | $3,000 |
| Compliance (money transmission analysis, KYC tooling, SOC-lite) | $0 | **$5,000** | $30,000 |
| Working capital (payout float, chargeback reserve) | $0 | $5,000 | $40,000 |
| Apple Developer + domain + misc | $300 | $400 | $800 |
| Contingency (20%) | $1,440 | $10,500 | $68,000 |
| **TOTAL (24 mo)** | **$8,640** | **$62,200** | **$407,300** |

| Question | Answer |
|---|---|
| Capital before first revenue | **$4–12k** (legal + Stripe onboarding + deployment) |
| Capital before break-even | **$25–45k** on the recommended path |
| Total outside funding requirement | **$0** for the base case. Only the 4% upside branch needs outside money — $750k–1.5M seed, and only once tournament flow proves a channel. |

**This is a capital-efficient business.** That is its best structural attribute and the
main reason the downside is survivable. Note the two lines a hobby project would omit and
which are not optional here: **legal ($9k) and compliance ($5k)**, both triggered by the
decision to hold other people's entry fees (§12).

---

## 8. Human hours vs AI hours

The build so far is strong evidence that AI leverage is real here: ~61k LOC, 40+
migrations, and a genuinely disciplined spec/ADR corpus produced by a solo founder. But the
bottleneck has already moved off code, and the repo's own history shows it — the most
recent work is all *deepening* built features, none of it is *selling* them.

### Initial build (to a sellable product, both lines)

| Area | Human hrs | AI hrs | % automatable |
|---|---|---|---|
| Initial research / market validation | 60 | 40 | 30% |
| Product design & spec | 90 | 180 | 55% |
| Software development (web) | 180 | 1,600 | 85% |
| Software development (native iOS + Watch, if pursued) | 420 | 900 | 55% |
| Content / data creation (regulations, species, packs) | 200 | 700 | 65% — **but the last 35% is legally load-bearing** |
| Marketing (content, landing, ASO) | 140 | 260 | 50% |
| Sales (tournament directors, one at a time) | **220** | 60 | **15%** |
| Legal / compliance | 70 | 90 | 35% |
| Customer support (early, high-touch) | 90 | 70 | 40% |
| Operations / deployment / release | 70 | 200 | 70% |
| Accounting / finance setup | 30 | 30 | 45% |
| Administration (entity, banking, Stripe, Apple) | 50 | 20 | 25% |
| **Initial build totals** | **~1,620 human hrs** | **~4,150 AI hrs** | **~66% AI-automatable** |

*(Excluding native iOS, which is optional in my recommendation: ~1,200 human / ~3,250 AI,
~68% automatable.)*

### Ongoing monthly operations (at base-case scale: ~150 events/yr, ~1,800 subs)

| Area | Human hrs/mo | AI hrs/mo | % automatable |
|---|---|---|---|
| Product maintenance & bug fixes | 12 | 60 | 80% |
| Regulations data upkeep (seasons change constantly) | **10** | 30 | 60% — hard ceiling, see below |
| Customer support (anglers + directors) | **18** | 25 | 55% |
| Tournament-day escalations (live, time-critical) | **14** | 6 | 25% |
| Sales / new director onboarding | **20** | 10 | 25% |
| Marketing / content | 8 | 25 | 70% |
| Finance, payouts, reconciliation, disputes | 8 | 10 | 45% |
| Compliance / legal review | 3 | 4 | 35% |
| Admin | 4 | 4 | 50% |
| **Ongoing totals** | **~97 human hrs/mo** | **~174 AI hrs/mo** | **~58% AI-automatable** |

### AI-assisted vs AI-automated — be precise about this

- **Genuinely AI-automated** (runs with review, not supervision): code generation and
  refactoring, test writing, schema migration drafting, documentation, content drafts,
  analytics queries, changelog and release notes, first-line support macros. ≈ 35% of all
  work.
- **AI-assisted** (a human still owns the outcome): architecture, statistical method,
  regulatory content verification, UX judgement, pricing, support escalations. ≈ 30%.
- **Human-only, and will stay human-only:** selling to a tournament director, being
  answerable at 6am on tournament morning, signing off that a bag limit is correct,
  holding a Stripe account, and every conversation that decides whether a stranger trusts
  you with their club's entry fees. ≈ 35%.

### The biggest remaining human bottlenecks

1. **Selling.** ~220 hours of initial founder time that no agent can take. This is the
   binding constraint on the entire venture and it is the one nothing in the repository
   addresses.
2. **Tournament-day liveness.** A weigh-in at 7am on a Saturday is an availability
   commitment, not a software feature. Two events on the same morning in different states
   is an operations problem a solo founder feels immediately.
3. **Regulatory verification.** `counsel`'s standing debt (Wikimedia/NOAA image licensing,
   FWC human verification) is correct and it never ends — seasons and limits change
   several times a year across ~20 states. **Do not let an agent be the final authority on
   a bag limit.** This is a permanent human tax on Business C and on the Fish Legal
   feature, and it is a genuine argument for *narrowing* the regulatory footprint.

---

## 9. Founder leverage

| Dimension | Assessment |
|---|---|
| Revenue per founder hour (base case, yr 3) | $120k / ~1,150 hrs = **~$104/hr** |
| Profit per founder hour (base case, yr 3) | ~$61/hr |
| Revenue per founder hour (high case, yr 3) | $700k / ~1,600 hrs = **~$438/hr** |
| Ability to delegate | **High for build** (proven in this repo), **low for sales and tournament-day ops** |
| Ability to automate | High on the product, capped on money-handling and regulatory truth |
| Need for specialised employees | Low until ~$300k revenue; then one ops/support hire and one Swift contractor |
| Operational complexity | **Rising fast** — payments, payouts, disputes, and multi-tenant data make this materially more complex than a logbook |
| Founder dependency | **Very high.** Every customer relationship, the domain expertise, the Stripe account, and the product taste are one person |

**Founder Leverage Score: 6/10.**
The build leverage is a genuine 9 — this repository is evidence of it. It is dragged down
to 6 by the parts that do not scale with AI: a single-threaded sales motion, tournament-day
presence, and regulatory sign-off. Leverage on *making* the thing is exceptional; leverage
on *selling and operating* it is ordinary.

---

## 10. Scalability

| Dimension | Score | Note |
|---|---|---|
| Technical | 8/10 | Supabase + Next.js handles this scale comfortably; offline-first is done properly |
| Operational | 4/10 | Tournament days, payouts, disputes, and support do not scale with users |
| Geographic (US) | 7/10 | Region packs are data, not code (`packs.ts`) — a real architectural win |
| International | **3/10** | NWS/NOAA are **US-only**. A non-US launch means a second weather/tide pipeline, a second regulatory corpus, and a second legal regime |
| Customer | 8/10 | Self-serve signup is natural for anglers |
| Distribution | **3/10** | No viral loop, no channel, no list |
| AI automation | 7/10 | Strong on build/content, weak on sales/ops |
| Marginal cost | 9/10 | $0.006–0.05 per user per month |

**Overall Scalability Score: 6/10.** (Technically excellent, commercially constrained.)

### What breaks first, by scale

- **100 users** — nothing technical. What breaks is *evidence*: at 100 users nobody has
  enough of their own history for the correlation features to say anything, so the paid
  tier has no product. The empty state (D19) is the whole experience.
- **1,000 users** — support becomes a real weekly job. The Supabase free tier is still
  fine (~150MB/yr). First tournament-day incident where two events collide. R2 becomes
  measurable: you will finally learn what fraction of trips get logged as blanks, and that
  number decides whether the statistical thesis lives.
- **10,000 users** — DB exceeds the free tier within year one (`cost-model.md`); photo
  storage starts compounding (R10); Supabase Pro + compute becomes necessary but is still
  only $60–260/mo. **The real break is human:** ~97 hrs/mo of ops becomes ~200, and the
  founder must hire. Pooled cross-user statistics finally become honest here — this is the
  scale at which the product's original promise actually works (R9 is right about this).
- **100,000 users** — needs a team (4–8 people), a real support org, SOC2-adjacent
  posture if enterprise circuits are involved, and payment operations as a function. Also
  the scale at which regulatory content errors become a legal event rather than a bug.
- **1,000,000 users** — not reachable as a US-only, English-only, iOS-first logbook.
  Would require international data pipelines and a category-defining position.

---

## 11. Defensibility / moat

| Source | Present? | Strength |
|---|---|---|
| Brand | No | 0/10 — nobody has heard of it |
| Network effects | Weak (A), **real (B)** | Tournament platforms get a two-sided effect: anglers who have used it once want their next event on it, and directors follow the anglers. 6/10 for B |
| Proprietary data | **Yes, potentially** | The blank-trip denominator is data literally nobody else has. 7/10 — *if* users supply it |
| AI/data flywheel | Later | Only meaningful past ~10,000 users (D12b is right that ML before then overfits) |
| Switching costs | **High once used (B)** | A director mid-season will not move platforms; past results and payouts live there. 7/10 |
| Community | No | Deliberately — no social feed (§6 of SPEC). Costs a moat, buys focus |
| Distribution | No | 1/10 — the missing piece |
| Patents/IP | No | Not applicable |
| Partnerships | No | The obvious ones (state circuits, kayak series, tackle brands) are unexplored |
| Marketplace liquidity | Partial (B) | Event listings could become a discovery surface |
| Cost advantage | Yes, mildly | Free NOAA/NWS path + AI build = structurally lower cost base than a funded competitor |
| First-mover | No (A), partial (B) | The tournament category is fragmented and unstandardised |
| Regulatory advantage | **Emerging** | Money-handling + fair-play verification is annoying enough to deter casual entrants |
| Technical advantage | Yes, real but narrow | Correct tide derivative, versioned rules snapshots, offline-first event sourcing with UUIDv7 and idempotency — this is better engineering than the category standard |
| User-generated data | Yes (B) | Verified tournament results are a durable, referenceable record |

**Moat Score: 4/10 overall** — **3/10 for A**, **6/10 for B**.

**"What prevents a better-funded competitor from copying this?"**
For Business A: **nothing.** Fishbrain could add tide-state correlation and blank-trip
logging in a quarter, and they have 20M users to test it on. The only genuine defence is
that they probably will not, because the blank trip is unglamorous, hurts their engagement
metrics, and does not fit a social product — and *that* is a real, if thin, strategic
opening. For Business B: the moat is not technology, it is **trust plus mid-season switching
cost plus money-handling friction**. A funded competitor can copy the software; they cannot
copy the 40 directors who have already run a season on it and been paid correctly.

---

## 12. Risk analysis

| # | Risk | Prob. | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **No distribution.** No channel, no list, no audience, and paid acquisition is uneconomic at $50/yr | **High** | **Critical** | Sell Business B by hand first — directors are findable and countable. Treat the first 30 as a research project, not a funnel |
| 2 | **The blank-trip denominator never materialises** (R2). Users log fish, not blanks; the statistical product is then built on biased data | **High** | **Critical** | Retroactive "you were at Balboa 6–10am, how'd it go?" prompt (O11); measure blank-rate from week one; if <30% of trips are blanks, the interpretation product does not ship |
| 3 | **Scope sprawl** — logbook + bass + regulations + passport + wildlife + games + tournaments + payments, zero users | **High** (already occurring) | **High** | Kill or freeze two of three product lines. This is the #1 controllable risk |
| 4 | **The shipping client (native iOS/Watch per D15) does not exist** and is an 8-month build | **High** | **High** | Either formally demote D15 and ship the web/PWA, or start Swift now and freeze all other feature work. The current state — neither — is the worst option |
| 5 | **Money transmission / escrow exposure.** Holding entry fees and paying prizes may make you a money transmitter in some states; crypto payouts raise FinCEN MSB questions (ADR 010 already separates these, correctly) | Medium | **Critical** | Keep Stripe Connect as the merchant of record, never touch funds directly, defer crypto payouts indefinitely, get a $5–9k legal opinion **before** the first paid event |
| 6 | **Prize contests and state gaming law.** Cash-prize tournaments are skill contests in most states but not uniformly; entry-fee-funded prize pools attract scrutiny | Medium | High | Director holds the prize obligation, platform is software-plus-payment-rail only; explicit ToS; avoid any wagering-adjacent framing (the spec already does — keep it) |
| 7 | **Regulatory content is wrong or stale** and an angler is cited or fined | Medium | **Critical** | Never block a save on a rule (already the rule); prominent "not legal advice"; timestamped source per pack; **narrow to fewer states verified properly rather than 20 states verified by agent** |
| 8 | **Platform dependency — Apple.** 15–30% cut, review risk, IAP rules | Medium | Medium | Web-first for the tournament line (no IAP obligation for physical/real-world event fees); Apple only for the consumer sub |
| 9 | **Data-source dependency.** NOAA/NWS free tiers have an unpublished throttle ("heavy load from a singular customer") and are US-only | Low | High | Cache aggressively at write time (already the design); keep the Open-Meteo Professional $99/mo path documented as a fallback |
| 10 | **Retention / seasonality (R4).** Revenue and engagement swing with the season | **High** | Medium | Annual pricing pushed hard (already the O6 recommendation); tournament org subscriptions smooth the trough |
| 11 | **Customer acquisition cost exceeds LTV in the consumer line** | **High** | High | Do not spend on paid consumer acquisition at all until LTV:CAC > 3 is demonstrated organically |
| 12 | **Key-person risk.** One founder holds domain expertise, all relationships, the Stripe account, and the product taste | **High** | High | Document the ontology and the operating rules (largely done); get a second pair of hands before tournament volume, not after |
| 13 | **AI dependency.** Build velocity assumes agent labour; quality debt can accumulate invisibly | Medium | Medium | The existing `verify` gate + code review + test discipline is genuinely good — keep it; treat regulatory and financial code as human-reviewed always |
| 14 | **Competitive response** — Fishbrain or an incumbent tournament vendor copies the differentiator | Low–Med (A) / Med (B) | Medium | Move to the tournament relationship layer, which is slower to copy than a feature |
| 15 | **Financial risk** — low. Cash at risk is $10–60k | Low | Low | Nothing needed |

**Overall Risk Score: 7/10** (high risk). Not because any one item is fatal — because
risks 1, 2, 3 and 4 are all High-probability, all simultaneously live, and all four are
*execution and focus* risks rather than external ones. That is the honest read: **the
main threat to this venture is not the market, it is the absence of a decision about what
it is.**

---

## 13. Return on capital

| Measure | Base case | High case |
|---|---|---|
| Expected capital requirement | $62k (recommended, 24 mo) | $150k |
| Expected annual profit at maturity (yr 5) | $170k | $850k |
| ROI on deployed capital | **~270%/yr at maturity** | ~560%/yr |
| Payback period (cash) | 22–30 months | 14–18 months |
| Revenue per dollar invested (yr 3, cumulative) | ~$3.20 | ~$11.00 |
| Profit per dollar invested (yr 3, cumulative) | ~$1.10 | ~$5.20 |
| Capital efficiency vs. category | Excellent — a funded competitor would spend $2–5M to reach the base case |

**Capital Efficiency: 9/10.** This is the strongest single number in the evaluation. Very
little money is required, infrastructure genuinely never becomes the constraint, and AI
labour substitutes for the largest historical cost line (engineering). **The scarce
resource in this venture is founder attention, not dollars** — which means every analysis
that focuses on cash is answering the wrong question.

---

## 14. Distribution & customer acquisition

| Channel | Business A (consumer) | Business B (tournaments) |
|---|---|---|
| Organic search | Weak — "fishing app" SEO is owned | **Strong** — "bass tournament software", "kayak tournament app" are low-volume, high-intent, winnable |
| Social media | Medium — fishing content performs, but converting viewers to $50/yr is hard | Medium — director groups on Facebook are the real venue |
| Paid acquisition | **Uneconomic** (LTV:CAC ≈ 0.9:1) | Viable at $250 CAC vs $3,380 LTV |
| Influencers | Expensive; fishing YouTubers price like gear sponsors | Low relevance |
| Partnerships | Tackle shops, charter captains, pier associations | **Best channel** — state circuits, kayak series, conservation orgs, charity networks: one relationship = 10–40 events |
| Direct sales | N/A | **The channel.** Founder-sold, one director at a time, ~2–5 hrs each |
| Enterprise sales | N/A | Later — regional circuits, tackle brands as sponsors |
| App stores | Necessary but not sufficient; ASO in "fishing" is brutal | Web-first avoids it entirely |
| Viral / referral | Weak — the spec correctly refuses social features | **Real** — every angler in an event is exposed to the platform at the moment of use, for free |
| Communities | Reddit (r/Fishing, r/bassfishing), forums — hostile to promotion, great for genuine participation | Director Facebook groups, state B.A.S.S. Nation chapters |
| Existing platforms | None | Could integrate with existing registration/payment flows |
| Affiliates | Low fit | Directors could earn a referral cut — natural and cheap |
| Content marketing | **Best consumer channel** — "does tide speed actually matter? here is 400 trips of data" is genuinely novel content nobody else can write | Supporting |

**Strongest likely channel: direct founder-led sales to tournament directors, with the
angler-side viral exposure that every event produces as the compounding mechanism.**

**Consumer acquisition difficulty: DIFFICULT.**
**Tournament acquisition difficulty: MODERATE.**

**Distribution Score: 3/10** as currently configured (nothing exists), rising to **6/10**
if the tournament motion is adopted deliberately. This is the lowest score in the entire
evaluation and it is the one the founder controls most directly.

---

## 15. Competitive position

### Business A — consumer logbook

| Competitor | Strengths | Weaknesses | Pricing | Position | Why a user might switch | What Fish Log Book does better |
|---|---|---|---|---|---|---|
| **Fishbrain** | 20M+ users, maps, social, brand, capital | Social-first; paywall is heavy and increasingly resented; no blank-trip data; no tide-derivative correlation | $9.99/mo, $74.99/yr ([App Store](https://apps.apple.com/us/app/fishbrain-fishing-app/id477967747)) | Category leader | Anglers who want privacy and analysis rather than a feed | Blank trips, tide speed, honest sample sizes, no spot-sharing pressure |
| **FishAngler / GilledIt** | **Completely free** | No revenue model to fund depth; shallow analysis ([2026 category review](https://www.gilledit.com/us/blog/best-fishing-apps)) | $0 | Free challengers | — | Depth and rigour — but "free" is a brutal anchor for a $50 product |
| **Navionics** | Charts, boating integration, hardware ties | Not a logbook; expensive | ~$25–60/yr | Adjacent | — | Logging and correlation |
| **Tide Alert / tide apps** | Excellent at tides, mature, owned by the founder himself | Tides only, no log, no correlation | $0–15/yr | Adjacent | Wanting the tide to mean something | Connecting tide to *your* catches — the founder's original insight |
| **Paper notebook / Notes app** | Free, trusted, zero friction, works wet | No enrichment, no search, no analysis | $0 | **The real incumbent** | Automatic conditions capture | This is the actual competitor to beat, and the one-tap quick mark (D22) is the right weapon |

**Position for A: DIFFERENTIATED but not category-creating.** The differentiator is
methodological and real; it is also invisible until a user has 50+ logged trips, which is
a year of use before the product proves itself. That delay is the commercial problem.

### Business B — tournament operations

| Competitor | Strengths | Weaknesses | Pricing | Why a director might switch |
|---|---|---|---|---|
| **WeighBook** | Simple, transparent, fee passed to angler | Registration/scoring only | **$2/angler/tournament, no subscription** ([pricing](https://www.weighbook.com/pricing)) | — (this is the price to beat) |
| **Fishing Chaos** | Broad feature set, live leaderboards, weighmaster flow, ticketing | Broader product, less specialised | Not published | Deeper verification, legal context |
| **FishDonkey** | Many formats (CPR, bracket, multi-day, points) | Older UX | Not published | Fair-play signals, offline reliability |
| **TourneyX** | No monthly/yearly fee | Basic | Free tier ([support](https://tourneyx.com/support/)) | Payments + verification depth |
| **WebPro Tournament Manager** | Enterprise-grade, real-time scoring | **$6,950–$18,950/yr licences** ([pricing](https://webprotournamentmanager.com/pricing/)) | Price — a 100× gap to the low end of this market |
| **Spreadsheets + Venmo + whiteboard** | Free, familiar | Error-prone, slow, disputes | $0 | **The real incumbent again** |

**Position for B: DIFFERENTIATED, with a plausible path to significantly differentiated.**
Nothing in the market combines (a) an angler-side catch app people already have open, (b)
versioned regulatory snapshots on every scored fish, (c) discrete explainable fair-play
signals instead of an opaque fraud score, and (d) server-authoritative scoring with
offline capture. ADR 010 and the tournament domain model are genuinely better architecture
than this category's norm. **That is the sentence that should be on a landing page, and
there is no landing page.**

---

## 16. Key economic drivers & sensitivity

The five variables that move the outcome most, in order:

1. **Number of tournament directors acquired per quarter (B).**
   Base: 8/quarter. ±20% → revenue moves **±20% linearly and compounds** through
   retention: over 3 years, ±20% on acquisition rate is **±$180k** of year-3 revenue in
   the high case. Highest-leverage variable in the business.
2. **Free→paid conversion rate (A).** Base 7%. At 5.6% (−20%) the consumer line needs
   420,000 free users for $1M — effectively impossible. At 8.4% (+20%) it needs 280,000 —
   still improbable. **Sensitivity insight: conversion does not rescue the consumer line at
   any realistic value.** That is a structural finding, not a tuning problem.
3. **Blank-trip logging rate (A, and the whole statistical thesis).** Base assumption ~40%
   of trips logged as blanks. At 32% the correlation output is biased but arguably usable;
   below ~25% every rate claim the product makes is wrong in the flattering direction and
   **the paid tier should not ship**. This variable is binary in effect, not linear.
4. **Annual churn (both).** Consumer base 50%. At 40% LTV rises to $102 (+24%) and paid
   acquisition becomes marginally viable; at 60% LTV falls to $68 and the consumer line is
   unfundable by any means. Director churn matters more per unit: 75%→90% retention takes
   director LTV from $3,380 to $8,450 (**+150%**).
5. **Fee per angler-entry (B).** Base $3.00. WeighBook anchors at $2. At $2.40 (−20%)
   break-even needs 44 directors instead of 35; at $3.60 (+20%), 29. Less sensitive than it
   looks — **volume matters roughly 3× more than price here**, which argues for pricing at
   or slightly below the anchor to win directors, not above it.

**Most sensitive assumption overall:** *that anyone at all will be sold to.* Every model in
this document collapses to zero on the same input — founder hours spent in front of
customers. The product's quality is not the variable in question.

---

## 17. Kill criteria

Objective, measurable, and dated. Each one should be written down with its check date
*now*, before there is emotional investment in the answer.

1. **Tournament sales.** If, **90 days after the first outreach**, fewer than **5
   tournament directors** have agreed to run an event on the platform — after at least 40
   direct conversations — the tournament line does not have a founder-led sales motion and
   should be shelved.
2. **Tournament repeat rate.** If, after the first **15 events**, fewer than **50% of
   directors book a second event**, the product is not solving the pain; stop adding
   features and go re-interview.
3. **Blank-trip discipline.** If, after **90 days with 50+ active loggers**, blank trips
   are under **25% of all logged trips**, the statistical thesis is invalidated. **Do not
   ship the paid interpretation tier.** Sell the logbook and legal layer as utility, or stop.
4. **Consumer conversion.** If, after **6 months with 1,000+ free users**, paid conversion
   is under **3%**, the consumer subscription is not a business at this price. Either
   reprice or kill the line.
5. **Consumer CAC.** If organic CAC cannot be demonstrated below **$25** within 12 months,
   consumer acquisition is not solvable by this team and the line should be treated as a
   feature of Business B, not a product.
6. **Native client cost.** If the native iOS build (D15) exceeds **$25,000 equivalent or
   6 elapsed months** without a shipped TestFlight, formally abandon D15 and ship as a PWA.
7. **Regulatory burden.** If keeping Fish Legal current costs more than **15 human hours a
   month**, cut the state footprint to the states where events actually run. This one
   protects against a slow, invisible death by maintenance.

**Non-negotiable:** if a Stripe dispute, a mis-paid prize, or a regulatory complaint occurs
before legal review is complete, stop taking money until it is. Nothing in this evaluation
is worth an enforcement action.

---

## 18. Validation plan

The cheapest path to knowing. Total to the go/no-go at Phase 3: **~$4,000 and ~130 founder
hours.** That is the real decision this document is asking for.

### Phase 1 — Demand test (2–3 weeks)
- **Objective:** find out whether tournament directors want this, before building anything else.
- **Method:** one landing page describing the tournament platform + a list of 60 US
  directors (clubs, kayak series, charity events, local saltwater opens) + 60 personal
  emails/calls. Offer: run your next event free, I'll be on the phone all day.
- **Cost:** $150 (domain, email tooling). **Human hours:** 35. **AI hours:** 20.
- **Success metric:** ≥12 replies, ≥5 calls, ≥3 verbal yeses.
- **Go/no-go:** fewer than 3 verbal yeses from 60 targeted directors → the sales motion
  does not exist; go back to §17 kill criterion 1.

### Phase 2 — MVP (3–5 weeks)
- **Objective:** make the already-built tournament flow survivable for a stranger, end to
  end: create → register → pay → score → publish results.
- **Method:** deploy production Supabase, complete Stripe Connect onboarding, write ToS +
  tournament rules template, run a fake event with 10 friends including at least one
  deliberate dispute.
- **Cost:** $1,200 (legal template review, Stripe, hosting). **Human hours:** 45. **AI hours:** 160.
- **Success metric:** a full event completes with zero manual database intervention.
- **Go/no-go:** any step requiring the founder to touch SQL during the event → not ready.

### Phase 3 — First paying customers (4–8 weeks)
- **Objective:** real money, real anglers, real tournament mornings.
- **Method:** run 3 real events for the Phase 1 yeses, charging $2/angler from event one.
  Charging from the first event is the test — free pilots prove nothing.
- **Cost:** $2,500 (insurance, legal opinion on fund-holding, travel). **Human hours:** 50. **AI hours:** 60.
- **Success metric:** 3 events completed, ≥150 angler-entries paid, ≥2 directors book again.
- **Go/no-go:** fewer than 2 rebookings → kill criterion 2.

### Phase 4 — Product-market fit (4–8 months)
- **Objective:** a repeatable channel, not a set of favours.
- **Method:** 25–40 events across at least 2 states; one circuit or series partnership;
  measure which acquisition source produced each director; introduce the consumer app to
  event anglers as a post-event hook and **measure that conversion rate** — it is the only
  cheap consumer acquisition channel this business has.
- **Cost:** $8,000. **Human hours:** 320. **AI hours:** 600.
- **Success metric:** ≥60% director rebooking; CAC under $250; ≥8% of event anglers install
  the logbook.
- **Go/no-go:** rebooking under 45% or CAC over $600 → no channel; revert to side-business mode.

### Phase 5 — Scale (12–30 months)
- **Objective:** decide whether this is a $150k/yr business or a fundable one.
- **Method:** hire one ops/support person; formalise payouts and disputes; pursue 2–3
  circuit partnerships; **only now** decide on native iOS/Watch (D15) and on outside capital.
- **Cost:** $60–150k. **Human hours:** 1,200/yr. **AI hours:** 2,000/yr.
- **Success metric:** $400k+ ARR, >70% director retention, <5% support contact rate per event.
- **Go/no-go:** if year-2 revenue is under $120k with good retention, it is a fine lifestyle
  business — stop raising, stop hiring, keep it small and profitable. That is a **win**, not a
  failure, and it should be named as one in advance.

---

## 19. Opportunity cost

| Factor | Assessment |
|---|---|
| Months of focused effort before meaningful validation | **3–5 months** to Phase 3's go/no-go (and only ~2 months if the tournament line is prioritised immediately) |
| Capital at risk | $10–60k — genuinely low |
| Founder hours at risk before the first real signal | ~130 hours to the Phase 3 decision; ~1,600 to a sellable full product |
| Difficulty of abandoning | **High, and rising.** 61k LOC, 217 documents, and a named team's worth of decisions create powerful sunk-cost gravity. The sophistication of the process is itself an emotional commitment device |
| Skills/assets retained on failure | **Substantial.** A proven AI-operated development methodology, a production-grade Next.js 16/Supabase codebase, a reusable multi-tenant payments architecture, a real regulatory dataset, and demonstrated ability to ship 61k lines solo. These transfer to *any* next venture |

**Opportunity Cost Score: 5/10.** Moderate. The cash cost is negligible and the skills
retained are unusually transferable — but three years of a capable founder's prime attention
is genuinely expensive, and the *hardest* cost to see is that this project is an excellent
place to hide from selling. Building is comfortable and this repository proves the founder
is very good at it; the next 200 hours need to be spent on the phone, which is neither.

---

## 20. Business potential scorecard

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Market Size | 6/10 | 6% | 0.36 |
| Customer Pain | 6/10 | 8% | 0.48 |
| Willingness to Pay | 6/10 | 9% | 0.54 |
| Revenue Potential | 5/10 | 7% | 0.35 |
| Profit Potential | 7/10 | 6% | 0.42 |
| Scalability | 6/10 | 5% | 0.30 |
| Capital Efficiency | 9/10 | 5% | 0.45 |
| AI Automation Potential | 7/10 | 4% | 0.28 |
| Founder Leverage | 6/10 | 5% | 0.30 |
| **Distribution** | **3/10** | **14%** | **0.42** |
| Competitive Advantage | 6/10 | 5% | 0.30 |
| Defensibility / Moat | 4/10 | 5% | 0.20 |
| **Ease of Execution** | **3/10** | **8%** | **0.24** |
| Speed to Market | 4/10 | 4% | 0.16 |
| **Probability of Success** | **4/10** | **6%** | **0.24** |
| Risk-Adjusted Return | 6/10 | 3% | 0.18 |
| **OVERALL** | | **100%** | **5.22 / 10** |

**Why these weights.** Distribution carries the largest weight (14%) because it is the
binding constraint: a superb product with no channel is worth zero, and this venture's
channel is currently empty while its product is nearly finished — the exact inverse of the
healthy ratio. Ease of execution (8%) is weighted heavily because the scope is currently
three businesses for one founder, and focus is the highest-return decision available.
Willingness to pay (9%) and customer pain (8%) are weighted next because they separate the
two businesses so sharply and therefore drive the strategic recommendation. Market size is
weighted *low* (6%) deliberately — per analytical rule 14, a big TAM is not evidence, and
this market's size has never been the problem.

**Scored separately, for the decision that matters:**

| Configuration | Overall |
|---|---|
| Consumer logbook alone (Business A) | **3.9 / 10** |
| Tournament platform alone (Business B) | **6.4 / 10** |
| Both, as currently pursued in parallel | **5.2 / 10** |
| **B-led, with A as the angler-side hook** | **6.8 / 10** |

**The blended score is lower than the focused one. That is the whole finding.**

---

## 21. Final investment verdict

**Recommendation: 3 — VALIDATE CHEAPLY**, with a specific structural change: **lead with
the tournament platform, demote the consumer logbook to the angler-side hook, and freeze
everything else.**

Not a "4 — BUILD MVP", because the MVP is essentially built and has never been shown to a
stranger; more building is the wrong prescription. Not a "2 — WATCH", because the asset is
real, the cost of finding out is ~$4k and ~130 hours, and there is a live, priced,
fragmented market with identifiable buyers. The gap between this and a 5 is not product
quality — it is that **not one dollar has ever been collected, and nobody has tried.**

| | |
|---|---|
| **Recommendation** | **3 — VALIDATE CHEAPLY** (as Business B, immediately) |
| **Overall Business Potential** | **5.2 / 10** (6.8 / 10 if refocused on the tournament line) |
| **Probability of commercial success** (self-sustaining, >$60k/yr) | **32%** |
| **Probability of failure** | **55%** |
| **Expected time to first revenue** | **2–3 months** (tournament) · 10 months (consumer) |
| **Expected time to profitability** | **22 months** |
| **Most likely 3-year revenue** | **$120,000** |
| **Most likely 3-year profit** | **$70,000** |
| **High-case 3-year revenue** | **$700,000** |
| **High-case 3-year profit** | **$350,000** |
| **Estimated capital required** | **$62,000** (recommended path, 24 mo); $8,600 lean |
| **Initial human hours** | **~1,620** (~1,200 excluding native iOS) |
| **Initial AI hours** | **~4,150** |
| **Ongoing human hours/month** | **~97** |
| **Ongoing AI hours/month** | **~174** |
| **AI-automatable percentage** | **66% build · 58% ongoing** |
| **Risk Score** | **7 / 10** (high) |
| **Scalability Score** | **6 / 10** |
| **Founder Leverage Score** | **6 / 10** |
| **Capital Efficiency Score** | **9 / 10** |
| **Moat Score** | **4 / 10** (3 consumer · 6 tournament) |

### Fatal flaws, checked first as required

Three candidates were tested for fatality. None is fatal, but one is close:

1. **Consumer subscription economics at $50/yr against a free-at-core market with −23%
   category churn.** Fatal *to Business A as a standalone company*. Not fatal to the
   venture, because Business B does not depend on it.
2. **The blank-trip denominator requires unrewarded discipline the product is forbidden
   from incentivising.** This is the closest to fatal: it is the load-bearing assumption of
   the differentiator, it has never been tested with a single real user, and the honest
   mitigations (retroactive prompts) are unproven. **This must be measured before the paid
   interpretation tier is built.**
3. **Holding other people's entry fees without legal review.** Not fatal, but it is the
   only item here that can produce a loss larger than the total capital at risk. Stripe
   Connect as merchant of record plus a real legal opinion removes it for about $9k.

### Asymmetric upside, not obvious from the surface

1. **The tournament platform is worth more than the logbook and was built almost by
   accident.** Multi-tenant orgs, idempotent financial mutations, versioned rule snapshots,
   explainable fair-play signals, offline-first event sourcing — against a market whose
   incumbents charge $2/angler or $6,950/yr with nothing in between. The founder appears to
   regard this as a feature of the fishing app. It is the better company.
2. **The regulations dataset is a real, separately saleable asset.** ~20+ states of
   machine-readable, versioned bag/size/season/boundary rules is expensive to assemble and
   nobody sells it cleanly. Worth an exploratory conversation with two fishing apps and one
   insurer — cost: three emails.
3. **The blank-trip corpus, if it ever exists at scale, is genuinely novel research data.**
   State fisheries agencies, conservation NGOs and academic fisheries departments all want
   effort data and currently buy it through expensive creel surveys. That is a grant-funded
   or licensing path that has nothing to do with consumer subscriptions — and it is the one
   outcome where the statistical rigour in this spec becomes the product rather than the
   marketing.
4. **The AI operating model itself.** A solo founder running a named specialist team to
   61k lines with this level of decision hygiene is, independently, a demonstrable
   capability. It has commercial value whatever happens to the fish.

---

## 22. The one-sentence decision

**If I were the founder, I would *validate* this opportunity — specifically by selling the
tournament platform to real directors within 60 days — because the product risk has already
been retired by an unusual amount of excellent engineering while every unit of commercial
risk remains completely untouched, and the cheapest $4,000 available anywhere is the one
that finds out whether anybody will pay.**

### What would change my mind?

**Three pieces of evidence, in order of how much they would move the number:**

1. **Five tournament directors saying yes — or sixty saying no.** Five paid events with two
   rebookings would move the overall score from 5.2 to ~7.0 and the recommendation from
   VALIDATE to **STRONG OPPORTUNITY**, because it converts the only unproven thing in the
   business (that anyone will buy) into a known quantity with a measurable CAC. Sixty
   conversations producing nothing would move it to ~3.0 and the recommendation to **DO NOT
   PURSUE (as a business)** — which is still a good outcome, because it costs 35 hours to learn.

2. **A measured blank-trip rate from 50 real anglers.** Above 40% and the statistical
   differentiator is real, the pooled dataset becomes a genuine asset, and Business A's moat
   score goes from 3 to 6. Below 25% and the interpretation product should never be built,
   the consumer line collapses to a commodity logbook, and the honest move is to strip the
   statistical claims out of the positioning entirely.

3. **Evidence on consumer conversion from event anglers.** If ≥8% of anglers at an event
   install and keep the logbook, Business B becomes a free acquisition channel for Business A
   and the two fuse into something with a compounding loop — that is the path to the 4% upside
   branch, and it would raise expected founder equity value by roughly 2×. If it is under 2%,
   the two businesses are unrelated and the consumer line should be honestly assessed as a
   personal tool that happens to be excellent.

---

### Appendix — sources

External, fetched 2026-09-14:
- [RBFF / Outdoor Foundation, 2025 Special Report on Fishing](https://www.takemefishing.org/getmedia/a57d8109-fec7-48eb-8b19-47b193e0fb18/2025SpecialReport.pdf) — 57.9M US anglers in 2024, record participation
- [Boating Industry — RBFF reports record fishing participation in 2024](https://boatingindustry.com/news/2025/07/31/rbff-reports-record-fishing-participation-in-2024/) — 5.1M first-timers; 16.6M lost anglers (−23% churn)
- [Fishbrain on the App Store](https://apps.apple.com/us/app/fishbrain-fishing-app/id477967747) and [Fishbrain paywall pricing](https://adapty.io/paywall-library/fishbrain/) — 20M+ users; $9.99/mo or $74.99/yr
- [Best Fishing Apps 2026 category review](https://www.gilledit.com/us/blog/best-fishing-apps) — free-at-core competitive pressure
- [WeighBook pricing](https://www.weighbook.com/pricing) — $2 per angler per tournament, fee added to the angler's entry
- [WebPro Tournament Manager pricing](https://webprotournamentmanager.com/pricing/) — $6,950–$18,950 annual licences; $1.25 credits
- [TourneyX](https://tourneyx.com/support/) — no monthly or yearly setup fees
- [Fishing Chaos](https://www.fishingchaos.com/tournaments) and [FishDonkey](https://www.fishdonkey.com/) — feature comparison (pricing not published)

Internal: `docs/product/SPEC.md`, `docs/product/ROADMAP.md`, `docs/finance/COSTS.md`,
`docs/finance/cost-model.md`, `docs/architecture/tournament-domain-model.md`,
`docs/architecture/decisions/010-tournament-checkout-and-payment-methods.md`,
`docs/specs/fishing-passport-wildlife-boat-games.md`, `docs/team/PLAN.md`, `.env.local.example`.

**Every figure not carrying a citation above is an assumption or a derivation from one, and
is labelled as such in the section where it appears. None of them should be repeated
outside this document without that label.**
