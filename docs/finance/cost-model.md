# Cost Model

Owner: `cfo`. Written 2026-08-28. Covers O8 (weather cost), a three-scale infra
forecast, and input to O6 (pricing). Every price below is either fetched directly from
the vendor's own pricing page/docs, or labelled as third-party-sourced /
assumption. See `docs/finance/COSTS.md` for the live one-table summary this document
feeds.

---

## 1. O8 — Weather data cost, resolved

### Open-Meteo real prices — found them

`biostat` couldn't scrape `open-meteo.com/en/pricing` because it renders client-side;
same result here — fetching that URL still returns no numbers. But Open-Meteo's own
blog post about commercial pricing (`openmeteo.substack.com/p/api-subscriptions-for-commercial`)
states the numbers in plain text, and a third-party API directory (`apio.sh/apis/open-meteo`)
independently lists the identical figures. Two independent sources agree exactly,
one of them Open-Meteo's own words — treating this as verified.

| Tier | Price | Calls/month | Historical/Archive API |
|---|---|---|---|
| Free | $0 | 300,000 (10k/day, 5k/hr) | Included, but **non-commercial only** — off-limits per D1/R6 |
| Standard | **$29/mo** | 1,000,000 | **Not included** |
| Professional | **$99/mo** | 5,000,000 | Included |
| Enterprise | custom | 50,000,000+ | Included |

The catch `biostat` flagged holds up in the pricing structure itself: Historical
Weather (needed for backfill) is gated to Professional, not Standard. There is no
$29/mo option that does both live and backfill — the real Open-Meteo price for our use
case is **$99/mo**, not $29/mo.

### The free path's real cost is engineering time, not money

NWS (`api.weather.gov`) for live/forecast + NOAA NCEI Global Hourly for backfill are
both genuinely $0, public domain, for any purpose, at any volume. The cost is one-time
integration work, not a recurring bill:

- NWS needs a `User-Agent` header with a real contact address (undocumented rate limit,
  unknown backoff behavior) and only covers a rolling ~2-day window — fine for a catch
  logged promptly, useless for backfill.
- NCEI needs a station-ID resolution step (ISD composite IDs aren't guessable —
  `biostat` notes a naive guess for John Wayne airport's station returned nothing) and
  ISD-encoded value parsing with sentinel handling (`9999` means missing, not a real
  reading — let one through and a user sees a 999.9 hPa barometer).

Rough estimate: **3-5 dev-days, once**, to build both integrations with proper
null-handling and station lookup. That is the entire cost of the free path. It does not
recur monthly the way $99/mo does.

### Call volume never gets close to needing a paid tier

Modeled in §2 below: even at 10,000 users, estimated weather-related calls land around
150,000-190,000/month — under 20% of Open-Meteo's *Standard* tier cap, let alone
Professional's 5,000,000. Paying would buy a single unified API and better documentation,
not capacity. We are nowhere near a volume ceiling on the free path either — NWS and
NCEI have no published call caps for this kind of usage.

### Recommendation

**Build on NWS + NCEI (the free path) through V1 and through 10,000 users.** Reasoning:

1. Volume never justifies the paid tier — see above.
2. The tier we'd actually need is $99/mo (Professional), not the $29/mo Standard tier —
   that's real money from user #1, before a single subscriber exists. A year of it
   ($1,188) is more than the Apple Developer fee.
3. The free path's cost is bounded and one-time (~3-5 dev-days); Open-Meteo's cost is
   unbounded and recurring forever.
4. Revisit only if (a) the product expands outside the US — NWS is US-only, or
   (b) the ongoing support burden from NCEI's data quirks (station gaps, sentinel bugs)
   starts costing more engineer-hours per month than $99 would buy back. That's a real
   trade to make later, with real support-ticket data — not one to make on day one by
   guessing.

This confirms `biostat`'s own instinct in `docs/analysis/data-sources.md` §3. Their
open question is answered: real prices exist, they change the recommendation from
"maybe pay for convenience" to "no reason to pay at any modeled scale."

---

## 2. Running cost forecast — 1 / 1,000 / 10,000 users

### Assumptions (label: assumption, not fact)

- **A1 — catches+blank trips per user per season: 75.** The spec's own R1 risk note
  says anglers log "50-100 catches a season"; 75 is the midpoint, applied to catches and
  blank trips combined (both are logged events per D2).
- **A2 — enrichment happens once per event, at write time, and is cached.** This is the
  single biggest lever in this whole model. If the app re-fetched weather/tide on every
  screen view instead of caching at log time, every number below involving API calls
  would be 10-100x higher depending on how often a user reopens their history.
- **A3 — ~3 external calls per enrichment event** (tide prediction, current weather,
  historical backfill on delayed entries). All three are $0 under the free path
  regardless of volume at these scales, so weather is not a line item that scales cost
  in this model — Supabase is.
- **A4 — photo attach rate 40%, average compressed size 800 KB.** No usage data exists
  yet; this assumes the app compresses client-side before upload (a build decision, not
  yet made). Flagged below as the single largest lever on storage cost.
- **A5 — active users view their own photos ~10 times/month, client caches after first
  load.** Optimistic. If the client does not cache and re-downloads images on every
  list render, egress could be 5-10x this estimate.
- **A6 — 100% of signed-up accounts counted as active,** i.e. these are ceiling
  numbers for "1,000 users" / "10,000 users", not typical-month numbers for a base
  with a smaller active fraction.

### Database size

Catch row estimate ~2 KB (enrichment fields + custom-field JSON, per D11) — assumption.

| Scale | DB growth/year | vs. Free tier cap (500 MB) |
|---|---|---|
| 1 user | 150 KB | Trivial forever |
| 1,000 users | 150 MB | Free tier holds for ~3 years on catch data alone |
| 10,000 users | 1.5 GB | **Exceeds free tier within year 1** — forces Pro plan on DB size alone |

### File storage (photos) — the line the spec flagged as scaling badly, confirmed

Photos are `[V2]` logging, not gated by D14 — so this cost applies to free users too,
not just payers. Storage is cumulative; nothing here expires or gets deleted.

| Scale | Photo storage added/year | Pro plan (100 GB included, $0.0213/GB over) |
|---|---|---|
| 1 user | 24 MB | Never a cost |
| 1,000 users | 24 GB | Inside 100 GB included for ~4 years of accumulation |
| 10,000 users | 240 GB | **Exceeds 100 GB in year 1**: ~140 GB over ≈ $3/mo, growing ≈ $3/mo per additional year of accumulation (≈ $23/mo by year 5) |

**This compounds every year the app runs** because nothing deletes old photos — that is
the "scales badly" the spec meant, not that any one photo is expensive.

**Lever, and it's a build decision not a finance one:** A4 assumes 800 KB average after
client-side compression. Uncompressed iPhone photos run 3-8 MB. Skipping compression
would make the 10k-user, year-5 number roughly 10x worse (~$230/mo instead of ~$23/mo).
Recommend compressing to ~200-400 KB average (long edge ~1600px, JPEG quality ~70-75)
before upload — flagging this to `architect`/`ux-ui`, this is their call to implement,
not mine to build, but it is a real line on this bill.

### Egress (bandwidth)

Under A5: 1,000 users → ~8 GB/mo; 10,000 users → ~80 GB/mo. Both comfortably inside
Pro's 250 GB included egress, so $0 modeled overage at either scale — **but this is the
most assumption-dependent number in the model.** An uncached photo re-fetch per view is
a bill, not a feature, the same principle as the weather API. Recommend: cache images
on-device after first load, and route anything servable through a CDN path via
Supabase's cached-egress tier ($0.03/GB) rather than standard ($0.09/GB).

### Compute

Pro plan's included $10/mo credit covers one Micro instance ($10/mo, 1 GB RAM) — plausibly
sufficient through 1,000 users given how small each row is and how simple V1's query
patterns are (per-user history, filters). At 10,000 users, budget a contingency step to
Small ($15/mo) once real query patterns are known, especially once D12b's pooled
hierarchical models start running cross-user aggregate queries — **this is a genuine
unknown, not a confident number.**

### MAU (auth)

Free tier already includes 50,000 MAU; Pro includes 100,000. Not a cost driver at
either 1,000 or 10,000 users.

### Total monthly infra cost

**1 user (founder only)**

| Item | Cost/mo |
|---|---|
| Supabase (Free tier — everything trivial at this scale) | $0 |
| Weather (NWS + NCEI) | $0 |
| Apple Developer Program ($99/yr amortized) | $8.25 |
| RevenueCat (free under $2,500 MTR) | $0 |
| EAS (Free tier: 15 Android + 15 iOS builds/mo) | $0 |
| Domain | unknown — not yet purchased, assume ~$12-15/yr from a standard registrar (unverified) |
| **Total** | **~$9-10/mo** |

**1,000 users**

| Item | Cost/mo |
|---|---|
| Supabase Pro (base $25, storage/egress overage ≈ $0 in year 1, compute covered by included credit) | ~$25 |
| Weather | $0 |
| Apple Developer | $8.25 |
| RevenueCat (well under $2,500 MTR — see §3) | $0 |
| EAS (Free tier likely sufficient; Starter $19/mo if shipping weekly) | $0-19 |
| **Total** | **~$33-52/mo → $0.033-0.052 per user/month** |

**10,000 users**

| Item | Cost/mo |
|---|---|
| Supabase Pro (base $25 + storage overage $3-13 growing with accumulation + compute contingency +$5 to Small) | ~$33-43 |
| Weather | $0 |
| Apple Developer | $8.25 |
| RevenueCat (likely crosses $2,500 MTR at realistic conversion — see §3, budget the 1% fee) | varies, see §3 |
| EAS Update bandwidth/MAU pricing beyond Build minutes — **unknown, check `docs.expo.dev/billing/plans`**, I could not get exact tiers | $19-199 (assumption range) |
| **Total (infra only, excl. RevenueCat's revenue-share)** | **roughly $60-260/mo → $0.006-0.026 per user/month** |

Supabase's Team plan ($599/mo) is not expected to be needed at 10,000 users with this
data shape — that tier is more like 100,000+ users or heavy compute workloads,
flagged as a later concern, not this one.

### Where caching/precomputation materially changes these numbers

1. **Enrichment cached at write time, never re-fetched on view (A2).** Already assumed
   above. This is the whole reason weather is a $0 line at every scale — an uncached
   per-view weather call would turn a $0 line into real money fast.
2. **Photo compression before upload.** ~10x difference in the storage line between a
   compressed pipeline and raw camera output.
3. **Client-side image caching after first load.** The single largest lever on the
   egress line — see A5's caveat above.
4. **Bundle the ~2 MB NOAA tide station list locally** (architect's open item from
   `docs/analysis/data-sources.md`) rather than querying it live — avoids repeated
   CO-OPS calls and is required anyway for offline mode (D3).

---

## 3. Input to O6 — subscription pricing

### Comparables found (source noted per row)

| App | Monthly | Annual | Annual effective $/mo | Source |
|---|---|---|---|---|
| FishAngler VIP | $6.99 | $49.99 | $4.17 | App Store listing, fetched directly |
| Fishbrain Pro/Premium | $12.99-14.99 (multiple concurrent SKUs, likely legacy cohorts) | $79.99 | $6.67 | App Store listing, fetched directly |
| Tide Alert | $6.99/3mo (~$27.96/yr equiv) | $19.99; a $99.99 "Gold" tier also listed, purpose unclear | $1.67 | App Store listing, fetched directly |
| Navionics Boating (US) | — | ~$49.99 | $4.17 | Third-party pricing blog (wavveboating.com) — **not independently verified**, treat as approximate |
| ANGLR | £4.99/mo (~$6.30 USD) via `anglr.pro`, a distinct "AI Fish Scanner" product | ~$50/yr for the separate ANGLR Logbook app per search summary | ~$4.17 | `anglr.pro/pricing` fetched directly for the monthly figure; the $50/yr Logbook figure is search-derived, **not independently verified** |

Pattern: most fishing/outdoor condition apps cluster **$40-80/year effective** if
bought annually, or **$7-15/month** if bought monthly — annual is typically priced at
a 40-55% discount to monthly-equivalent, consistent with normal seasonal-app structure.

### Recommendation: $49.99/yr primary, $7.99/mo secondary

Reasoning:

- Sits at the Navionics/FishAngler-annual cluster — mid-market for the category, not
  the cheapest (Tide Alert) or the most expensive (Fishbrain).
- Above Tide Alert's $19.99/yr is justified: D14 gates real capability (correlation
  engine, alerts, bite score, forecast overlays, export), not just a tide viewer.
- At or below Fishbrain's tier respects that V1's feature set is thinner than
  Fishbrain's cross-user social product — no pooled ML yet (D12b), no alerts or bite
  score until their evidence gates are met (D12a, O4). Pricing above the market leader
  for a leaner V1 feature set would be a hard sell.
- Monthly option matches spec's own instinct (D14: "Annual pricing likely fits the
  season better than monthly") while still giving new users a way to try the paid tier
  mid-season without full annual commitment — every comparable above sells both.

This is a **recommendation for `ceo` to weigh in on** (O6 explicitly needs both roles),
not a settled number.

### Conversion rate needed for solo-founder viability

At $49.99/yr, after Apple's cut (30% standard, **15% under the App Store Small
Business Program** — realistic for a solo founder at this revenue) and RevenueCat's
fee (free until $2,500 MTR, then 1% of gross tracked):

- Net per paying user: $49.99 × 0.85 ≈ **$42.49/yr** (~$3.54/mo).

**Infra cost is not the constraint.** From §2, infra at 10,000 total users runs
$0.006-0.026 per user/month — two to three orders of magnitude below the $3.54/mo net
revenue from one paying subscriber. Covering the server bill needs almost no
conversion: at 1,000 total users, infra runs ~$400-625/yr, covered by **~12 paying
users (1.2% conversion)**.

**Founder income is the real constraint.** For this to be a full-time living (assume a
modest $36,000/yr target):

| Total signed-up users | Paying users needed at $42.49 net/yr | Implied conversion rate | Plausible? |
|---|---|---|---|
| 1,000 | 847 | 85% | No — typical freemium conversion is 2-10% |
| 10,000 at 5% conversion | 500 | 5% | ~$21,245/yr — supplemental income, not a living |
| 10,000 at 10% conversion | 1,000 | 10% (optimistic but not absurd for a niche high-intent utility) | ~$42,490/yr — thin but plausible full-time income |

**Recommendation:** treat 10,000 signed-up users at 5-10% conversion as the realistic
near-term planning target, not 1,000. The number that decides whether this is viable as
a solo-founder product is user acquisition and conversion rate — infra cost will never
be the binding constraint at any scale modeled here.

---

## Open items for other roles

- `ceo`: O6 needs a yes/no on $49.99/yr + $7.99/mo, and on whether 10,000 users /
  5-10% conversion is the target to plan the business around.
- `architect`: EAS Update's bandwidth/MAU-based pricing (separate from Build minutes)
  is **unknown — check `docs.expo.dev/billing/plans`** for exact tiers once P1
  (platform) is settled; I could only confirm Build pricing, not Update pricing.
- Domain registrar cost is unverified — pick one and get the real number in before
  launch, it's small but it's a line.
- Navionics' $49.99/yr and ANGLR Logbook's ~$50/yr are third-party-sourced, not
  independently confirmed from the vendor. Fine for directional comparison, not for
  quoting as fact elsewhere.
