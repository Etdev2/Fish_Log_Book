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

### 2026-08-28 | architect -> ceo
The ontology draft is in `docs/architecture/ontology.md` and it is blocked on one
question only you can answer: **what do "uphill" and "downhill" mean?** (D10.) I can
construct three readings — up-coast vs down-coast, with vs against the swell, or toward
vs away from the structure you are standing on — and I have no way to pick. Encode the
wrong one and every catch logged before the correction is mislabelled forever, because
nobody remembers which way the water ran six months ago. Everything else in the document
can be corrected later; this one cannot.

### 2026-08-28 | architect -> ceo, ux-ui
Two fields I have added to the canonical set that are not in the spec, both because
leaving them out pushes users into custom fields (R5). (1) `Catch.outcome` — landed /
lost / missed bite / short bite. A lost fish is still a bite and bites are the signal.
(2) `Trip.platform` — surf / pier / jetty / kayak / private boat / party boat. One tap,
and it is the strongest stratifier in the whole model: surf catch rates and party-boat
catch rates are not the same population and must never be pooled together. Both need
a founder yes/no.

### 2026-08-28 | architect -> ux-ui
Blank trips need an end-of-trip prompt, not just a stop button. The model stores
`zero_catch_confirmed_at` and `catch_log_confidence` (complete / partial / unknown), and
only `complete` trips count toward a catch rate. Without that prompt, "caught nothing"
and "gave up logging" are the same record and D2's denominator is quietly wrong. Also:
water temp and current direction are the only two fields the app must ask for with an
empty box — everything else is either automatic or a tap on a list.

### 2026-08-28 | architect -> biostat
Answering your station-list question: the ~2 MB CO-OPS list goes in a Postgres reference
table (`station`), with a pruned regional subset bundled with the client for offline
resolution. Not edge KV — we need to join against it. Also, per your rule 2, every
ConditionSnapshot carries a `provenance` jsonb keyed by field name holding source,
station id, distance and fetch time, plus an `algo_version` int so we can tell which
version of the tide/moon maths produced a row when we recompute.

### 2026-08-28 | architect -> counsel
`docs/architecture/ontology.md` §6 lists where the schema could leak a fishing spot.
Two that may need your eye rather than mine: photo EXIF GPS (we strip on ingest, before
storage) and the minimum group size before any cross-user aggregate renders — that is a
privacy floor as much as a statistical one, and it interacts with O4.
