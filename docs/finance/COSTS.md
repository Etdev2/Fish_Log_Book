# Running Costs

Owner: `cfo`. One table, updated when a price or a decision changes. Detail and
reasoning behind these numbers: `docs/finance/cost-model.md`.

| Item | Tier we're on | Price | What ends it (free-tier cliff) | Source |
|---|---|---|---|---|
| Supabase | Free (until DB/storage limits force Pro) | $0 → $25/mo Pro | 500 MB DB, 1 GB file storage, 5 GB egress, 50k MAU | supabase.com/pricing, fetched 2026-08-28 |
| Supabase storage overage | — | $0.0213/GB beyond Pro's 100 GB | Photos are cumulative, never deleted — this is the line that grows every year | supabase.com/pricing |
| Supabase egress overage | — | $0.09/GB standard, $0.03/GB cached, beyond Pro's 250 GB | Uncached photo re-fetches on every view | supabase.com/pricing |
| Supabase compute | Micro (covered by Pro's $10 credit) | $0 effective, $15/mo Small if we outgrow it | Query load, not yet known at scale | supabase.com/docs, fetched 2026-08-28 |
| Weather + pressure (live/forecast) | NWS `api.weather.gov` | $0, public domain, any volume | None published; US-only is the real ceiling | docs.data-sources.md, biostat, verified live |
| Weather + pressure (historical backfill) | NOAA NCEI Global Hourly | $0, public domain, any volume | None published | docs.data-sources.md, biostat, verified live |
| Weather (rejected paid option) | Open-Meteo Professional | $99/mo (Standard $29/mo doesn't include Historical, which we need) | N/A — not in use, see cost-model.md §1 | openmeteo.substack.com + apio.sh, cross-verified 2026-08-28 |
| Tides | NOAA CO-OPS | $0, public domain, any volume | Unpublished throttle on "heavy load from a singular customer" | data-sources.md, biostat |
| Moon/sun | Computed on-device (`astronomy-engine`) | $0, no API | N/A | data-sources.md, biostat |
| Apple Developer Program | Standard | $99/yr ($8.25/mo amortized) | N/A, required to ship on iOS | Known program fee |
| RevenueCat | Free | $0 up to $2,500 MTR, then 1% of gross tracked | $2,500/mo in tracked revenue | revenuecat.com/pricing, fetched 2026-08-28 |
| EAS Build (if Expo/RN, per P1) | Free | $0 → $19/mo Starter → $199/mo Production | 15 Android + 15 iOS builds/month | expo.dev/pricing, fetched 2026-08-28 |
| EAS Update (OTA) bandwidth/MAU pricing | — | **unknown — check `docs.expo.dev/billing/plans`** | — | not resolved; flagged in cost-model.md |
| Domain | — | unverified, assume ~$12-15/yr | — | not yet purchased |

## Cost per active user per month

Derived in full in `cost-model.md` §2. Headline numbers, infra only (excludes
Apple/RevenueCat's revenue share, which scales with revenue not users):

| Scale | Total infra/mo | Per user/mo |
|---|---|---|
| 1 user (founder) | ~$9-10 | n/a (fixed cost, not per-user) |
| 1,000 users | ~$33-52 | ~$0.033-0.052 |
| 10,000 users | ~$60-260 | ~$0.006-0.026 |

**Infra cost is not the constraint on this business at any modeled scale.** The
constraint is conversion rate to a paying subscriber — see cost-model.md §3.

## Assumptions this table depends on (label: assumption)

- 75 logged events (catches + blank trips) per user per season.
- Enrichment cached at write time, never re-fetched per view — the single biggest
  lever on the weather/tide numbers being $0.
- 40% photo attach rate, 800 KB average after client-side compression (compression not
  yet built — real number could be ~10x worse if skipped).
- 100% of signed-up accounts treated as active (ceiling estimate, not typical-month).

Last updated: 2026-08-28.
