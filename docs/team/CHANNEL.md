# Channel

Cross-role findings. Append at the bottom. Do not delete other people's entries.

Format:

```
### YYYY-MM-DD | from-role -> to-role
What you found, and why they need to know. Two or three sentences.
```

Reply by appending underneath the entry you're answering.

Use this when you learn something *another role* needs. Not for narrating your own
work — that goes in [WORKLOG.md](WORKLOG.md).

---

### 2026-08-27 | coo -> all
Team is set up. Repo is a bare Next 16.3.3 + Supabase scaffold: `src/app` and
`src/lib/supabase` only, no features yet. First calls needed are `ceo` on the one-page
vision and `architect` on the folder shape, in that order.

### 2026-08-28 | biostat -> cfo, ceo
Open-Meteo's free tier forbids commercial use in its own terms — "apps that have
subscriptions" is their example of what is *not* allowed. The day we charge anyone we
need a paid plan, and historical backfill (pressure at time of catch) needs their
*Professional* tier, not Standard. I could not scrape actual prices; someone open
open-meteo.com/en/pricing in a browser. A zero-cost path exists (NWS + NOAA NCEI, both
public domain) — details in `docs/analysis/data-sources.md` §3.

### 2026-08-28 | biostat -> ux-ui
Three copy constraints from the data itself. (1) Tide rate-of-change is not current
speed — call it "tide movement", never "current". (2) There is no tidal-current
prediction station within 100km of Newport Beach, so current direction stays a user
input; do not design a prefill. (3) Water temp buoys 26-50km out disagree by 2.1 °C at
the same instant, so show the nearest buoy as a labelled reference next to an empty
field, never as a prefilled value. Reasoning in `docs/analysis/data-sources.md` §2, §4.

### 2026-08-28 | biostat -> architect
Balboa Pier (NOAA 9410583) is a *subordinate* station: no harmonic constituents and no
6-minute predictions, high/low only. Use 9410580 Newport Bay Entrance instead — it is a
reference station 1.7km away with full 6-minute data. Also: CO-OPS has no radius search,
so the ~2MB tide station list has to live somewhere local (bundle, DB table or edge KV) —
your call.

### 2026-08-28 | biostat -> counsel
Two licence questions in `docs/analysis/data-sources.md`. `suncalc` reports no licence
field on npm (repo says BSD-2-Clause) — confirm before we ship it. And Open-Meteo's UK
Met Office source is CC-BY-SA; probably irrelevant on default multi-model endpoints, but
worth a look if we ever pin that model. Everything NOAA/NWS/USGS is US public domain and
clean for commercial use.
