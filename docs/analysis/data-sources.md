# Environmental Data Sources

Owner: `biostat`. Written 2026-08-28. Every endpoint below was called live that day;
quoted results are real responses, not recollection. All distances are from **Balboa
Pier, Newport Beach (33.5983, -117.9000)**.

## Summary

| Need | Source | Free for a paid app? | Verdict |
|---|---|---|---|
| Tide height + curve | NOAA CO-OPS | Yes, public domain | Use it |
| Tide harmonics | CO-OPS `harcon` | Yes | Only at *reference* stations |
| Tidal current | NOAA CO-OPS | Yes | **None in Orange County. Ask the user.** |
| Weather + pressure | Open-Meteo | **No — paid tier** | Works well, budget for it |
| Weather + pressure | NWS api.weather.gov | Yes, public domain | Free fallback, US only, no backfill |
| Weather backfill | Open-Meteo Archive | **No — Professional tier** | Paid |
| Weather backfill | NOAA NCEI Global Hourly | Yes, public domain | Free but clunky |
| Water temperature | NDBC buoys | Yes | Nearest useful buoy 26 km — see §4 |
| Moon / sun | Computed on device | Free, no API | Do this. Never pay for it |
| Lake level | USGS Water Services | Yes, public domain | Thin coverage |
| Lake water temp | USGS Water Services | Yes | **Effectively nonexistent in CA** |

## 1. Tides — NOAA CO-OPS

**Terms.** US Government work, public domain. No key, no registration, commercial use
fine. Pass an `application=` parameter — it is how NOAA contacts you instead of blocking
you. Throttling exists but the threshold is unpublished; stated policy only limits "heavy
load from a singular customer". Cache aggressively; never call per-page-render.

Two APIs, easy to confuse: **MDAPI** (`/mdapi/prod/webapi/...`) for station lists,
harmonics, datums, offsets; **datagetter** (`/api/prod/datagetter?...`) for predictions
and observations.

### Harmonic constituents — yes, but read this carefully
`GET /mdapi/prod/webapi/stations/9410580/harcon.json?units=metric` returns **37
constituents** (25 with non-zero amplitude) for Newport Bay Entrance, each with
`amplitude`, `phase_GMT`, `phase_local` and `speed` (deg/hr). M2 = 0.506 m at
28.984104 deg/hr.

**The catch, and it is a big one:** harmonics exist only at *reference* stations
(`type: "R"`). Balboa Pier (9410583) is a *subordinate* station (`type: "S"`) and its
`harcon.json` returns an **empty array**. They expose time/height offsets against a parent instead:

```
GET /mdapi/prod/webapi/stations/9410583/tidepredoffsets.json
-> {"refStationId":"9410660","heightOffsetHighTide":0.96,"heightOffsetLowTide":0.96,
    "timeOffsetHighTide":-9,"timeOffsetLowTide":0,"heightAdjustedType":"R"}
```

**Second catch, verified three ways:** subordinate stations do **not** serve 6-minute
predictions at all. Every variant returns `"No Predictions data was found. Please make
sure the Datum input is valid."` — a misleading message that is really about station
type, not datum. Subordinate stations serve `interval=hilo` only.

**Uncertainty I will not paper over:** NOAA gives amplitude and phase but *not* the
nodal factors (f, u) or equilibrium argument (V0+u) for a given year. Reconstructing a
true curve from `harcon` means computing those yourself (Schureman / Meeus). I did not
implement and validate that against NOAA's own predictions, so I cannot promise our
reconstruction would match theirs. Not a weekend job.

### Recommendation for the tide curve

Do **not** use Balboa Pier (9410583). Use **9410580, Newport Bay Entrance** — a
reference station **1.7 km** away that serves 6-minute predictions directly. That series
is a better derivative source than anything we would reconstruct, and it removes the
harmonics problem entirely for the online case.

```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions
  &application=FishLogBook&begin_date=20260828&end_date=20260830&datum=MLLW
  &station=9410580&time_zone=gmt&units=metric&format=json
```

720 samples over 2 days. Differencing it gives max flood 0.390 m/hr, max ebb
-0.450 m/hr, range 1.87 m for 28-30 Aug 2026 — a legitimate *tidal-flow-strength proxy*,
smooth at 6-minute spacing.

**Say this in the UI:** rate of water-level change is *not* current speed. It tracks
flow in a constricted inlet and tracks weakly-to-not-at-all on an open beach. Label it
"tide movement" or "how fast the tide is running" — never "current".

Harmonics stay worth caching *for offline mode only*: 25 numbers per station versus a
year of 6-minute predictions.
### Other useful CO-OPS facts (all verified)

- Backfill works: predictions for 2019-07-04 returned normally. Tide prediction is
  computed, not archived, so any past or future date resolves.
- Observed water level backfills too — `product=water_level` returned verified 6-minute
  data for 2019-07-04 at 9410660.
- `product=air_pressure` exists at some stations; 9410660 (LA) returned 1010.5 hPa.
- Always pass an explicit `datum=MLLW`. The default is not guaranteed and mixing datums
  silently shifts every number by ~1 m (`/mdapi/.../datums.json` lists them).
- **Length limits per request:** `interval=hilo` up to 10 years; 6-minute up to 1 month;
  `MAX_SLACK` currents up to 1 year; current bins 7 days.
- No radius search. Download the station list once
  (`/mdapi/prod/webapi/stations.json?type=tidepredictions`, ~2 MB, 3499 stations) and
  build a local spatial index. Do not query NOAA to find a station.

### Station density, Southern California

From the live station list (S = subordinate, R = reference):

| km | ID | Name | Type |
|---|---|---|---|
| 0.2 | 9410583 | Balboa Pier, Newport Beach | S |
| 1.7 | 9410580 | Newport Bay Entrance, Corona del Mar | **R** |
| 6.4 | 9410599 | Santa Ana River entrance (inside) | S |
| 19.1 | TWC0427 | Los Patos (highway bridge) | S |
| 33.6 | 9410678 | Long Beach Fire Boat Pier | R |
| 37.0 | 9410660 | LOS ANGELES (Outer Harbor) | R |
| 48.4 | 9410079 | Avalon, Santa Catalina Island | R |

4 stations within 25 km, 12 within 50 km, 17 within 100 km. **Tide coverage in SoCal is
excellent** — the one variable we can enrich with real confidence.

## 2. Tidal currents — the honest answer is "no"

Same API family, `type=currentpredictions`, 4430 station-bins nationally. Nearest to
Balboa Pier: **29.7 km** lb0101 Queens Gate (Long Beach harbour entrance), then nothing
until **117.4 km** PCT0056 North Island in San Diego Bay.

**Within 25 km: zero. Within 100 km: one** — and that one is a dredged harbour entrance
channel whose currents are a function of Long Beach harbour geometry. It tells you
nothing about the water in front of Balboa Pier.

The data shape is fine where it does exist — flood/ebb direction in degrees true and
major-axis velocity in cm/s:

```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=currents_predictions
  &application=FishLogBook&station=lb0101&begin_date=20260828&end_date=20260828
  &interval=MAX_SLACK&time_zone=gmt&units=metric&format=json
-> {"Type":"ebb","meanFloodDir":48,"meanEbbDir":257,"Velocity_Major":-10.2,...}
```

**Design conclusion: the user's instinct is right — ask the user.** On the Orange
County open coast there is no predictable current product, and the dominant nearshore
flow is wind- and swell-driven longshore drift, which the tidal current model does not
describe even in principle. Auto-filling from Queens Gate would be inventing a number.

Where a user *is* near a covered station (San Diego Bay, SF Bay, Puget Sound) a prefill
is possible later, but it must show station name and distance, not just a number. Note
the station list has duplicate IDs at different `depth` values (multiple bins per
station) — key on `id` + `currbin` or you get silent duplicates.

## 3. Weather and barometric pressure

### Open-Meteo — works well, but is NOT free for us

All three endpoints verified live and working:

```
https://api.open-meteo.com/v1/forecast?latitude=33.60&longitude=-117.90&timezone=UTC
  &hourly=pressure_msl,surface_pressure,temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover
https://archive-api.open-meteo.com/v1/archive?latitude=33.60&longitude=-117.90&timezone=UTC
  &start_date=2024-06-15&end_date=2024-06-15&hourly=pressure_msl,temperature_2m
https://marine-api.open-meteo.com/v1/marine?latitude=33.60&longitude=-117.90&timezone=UTC
  &hourly=wave_height,wave_direction,wave_period,sea_surface_temperature
```

**Read the terms before anyone gets attached to this.** From the live terms page:

> You may only use the free API services for **non-commercial purposes.**

and, in their own list of what *is* commercial:

> Operating websites or apps that have **subscriptions** or display advertisements.

A commercial subscription fishing app is, by Open-Meteo's own definition, commercial use.
**The free tier is off limits the day we charge anyone.** Their tier table reads
Free = "Commercial use ❌"; Standard / Professional / Enterprise = ✅.

Two further details:

- **Historical, climate and ensemble APIs require the Professional plan or higher**, not
  Standard. Backfilling past conditions *is* the historical API, so pressure-at-time-of-
  catch lands on the second paid tier, not the first.
- Call accounting is fractional: 4 weeks of hourly data counts as ~3 calls, not 1.
  Backfill burns budget faster than the request count suggests.

I could not extract actual prices — the pricing page renders them client-side.
**Someone must open open-meteo.com/en/pricing in a browser and get real numbers to
`cfo`.** Confirmed volume structure only: Standard 1M calls/month, Professional 5M,
Enterprise 50M+.

Licence is CC BY 4.0, so we owe a visible credit line regardless of tier. Their UK Met
Office source is CC-BY-**SA**; if we ever pin that model specifically, `counsel` should
check whether share-alike touches anything of ours. Unlikely on default multi-model
endpoints, but flagging rather than assuming.

### NWS api.weather.gov — genuinely free, US only

```
https://api.weather.gov/points/33.60,-117.90   -> gridId SGX, 36,57, America/Los_Angeles
https://api.weather.gov/gridpoints/SGX/36,57/forecast/hourly
https://api.weather.gov/stations/KSNA/observations/latest
  -> barometricPressure 100982.11 Pa, temperature 26 C
```

Terms, from their documentation page:

> All of the information presented via the API is intended to be open data, free to use
> for any purpose. As a public service of the United States Government, we do not charge
> any fees for the usage of this service.

Rate limit is real but unpublished; exceeding it errors and clears "typically within 5
seconds." **A `User-Agent` header with a contact address is required** or you get blocked.

Two useful side effects: `/points` hands you the location's IANA timezone
(`America/Los_Angeles`), exactly what we need for "display in the catch location's local
time"; and pressure arrives in Pa with an explicit `unitCode`, the right shape for a
boundary validator.

**But it cannot backfill.** Verified: `/stations/KSNA/observations?limit=500` returned
500 records spanning only 2026-08-26 16:25 → 2026-08-28 06:50, under two days. Queries
starting 7, 30 or 120 days back returned zero features. It is a rolling window of roughly
a week — fine for a trip logged today, useless for importing three years of old trips.

### NOAA NCEI Global Hourly — the free backfill path

Public domain, no key. Verified:

```
https://www.ncei.noaa.gov/access/services/data/v1?dataset=global-hourly
  &stations=72295023174&startDate=2024-06-15T00:00:00&endDate=2024-06-15T02:00:00
  &format=json&dataTypes=TMP,SLP&includeStationName=true
-> {"DATE":"2024-06-15T00:00:00","SLP":"10120,1","TMP":"+0194,1","NAME":"LOS ANGELES ..."}
```

Free forever, but awkward: values are ISD-encoded strings — `"10120,1"` is 1012.0 hPa
with quality flag 1, `"+0194,1"` is 19.4 °C. **Missing values are sentinels like 9999,
not nulls.** Let one through and we show a user a 999.9 hPa barometer. Classic
boundary-narrowing case: parse, scale, range-check, return `null` on sentinel.

Station IDs are ISD composite IDs needing a lookup step: guessing John Wayne's returned
empty while LAX's worked. Budget time for a station-resolution table.

**Recommendation:** NWS for live/forecast (free, and it gives us the timezone), NCEI for
historical backfill (free). Hold Open-Meteo as the paid upgrade if global hourly
consistency proves worth the bill — that call is `cfo` + `ceo`'s. I am only establishing
that a zero-cost path exists.

## 4. Water temperature — the user's manual-entry decision is correct

### CO-OPS water temperature: not where we need it

`product=water_temperature`, verified: 9410580 Newport Bay Entrance and 9410660 Los
Angeles both return `"No data was found. This product may not be offered at this
station."` 9410230 La Jolla (Scripps) returns **22.9 °C** — from **100.9 km** away.

### NDBC buoys: nearest useful one is 26 km offshore

From the live `latest_obs.txt` table (883 stations), buoys reporting water temp near
Balboa Pier, same sampling moment:

| km | 26.2 | 26.6 | 30.1 | 36.7 | 38.4 | 50.4 |
|---|---|---|---|---|---|---|
| station | 46253 | 46285 | 46256 | 46277 | 46222 | 46275 |
| water temp °C | 24.1 | 24.6 | 23.4 | 25.5 | 24.1 | 25.3 |

**This settles the question.** Six buoys inside 50 km, sampled at the same moment,
disagree by **2.1 °C** (23.4 to 25.5). We cannot interpolate to Balboa Pier better than
roughly ±1 °C — and that is before noting these are all *offshore* buoys while the angler
stands in 2 m of surf, where solar heating, tidal exchange out of Newport Bay and local
upwelling move inshore temperature further from the offshore value than the buoys differ
from each other.

A 1-2 °C error is not rounding — it is the difference between two bite windows.
**Keep water temperature as manual entry.** Costless alternative: show the nearest buoy as a labelled *reference*, not a prefill —
"nearest buoy 46253, 26 km offshore, 24.1 °C at 06:00" — beside an empty field. The user
types what their thermometer says, or leaves it blank and the analysis reports "no water
temp for this trip." An empty field is honest; a wrong prefill is worse than nothing
because the user never learns it was a guess.

Endpoints, all free/public domain — all stations in one table, ~45 days rolling per
station, and per-year archives:

```
https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt
https://www.ndbc.noaa.gov/data/realtime2/46277.txt                  # 2167 rows
https://www.ndbc.noaa.gov/data/historical/stdmet/46277h2024.txt.gz
```

Fixed-width text, `MM` means missing — same sentinel discipline as NCEI. The
`latest_obs.txt` column order is STN LAT LON YYYY MM DD hh mm WDIR WSPD GST WVHT DPD APD
MWD PRES PTDY ATMP WTMP DEWP VIS TIDE: **ATMP (air) sits immediately before WTMP
(water)**. I got this wrong on my first parse and produced plausible-looking nonsense.
Pin columns by header name, not index.

### Satellite / model SST

Open-Meteo Marine returns `sea_surface_temperature` (25.1 °C at our point, 25.3 °C
offshore) and is spatially continuous, so no "nearest station" problem. But it is a
*model*, it disagreed with the nearest real buoy by ~1 °C, and it carries the same
commercial-use restriction as the rest of Open-Meteo. It hides the error bar rather than
shrinking it. Not a reason to auto-fill.

CDIP (Scripps) operates several of the nearshore SoCal buoys listed above and has finer
nearshore coverage via its own THREDDS service. I did not verify their terms. If
auto-fill is ever revisited, that is the thread to pull.

## 5. Moon and sun — compute it, never pay for it

**Confirmed: this needs no API.** Sun and moon position are deterministic functions of
time and observer coordinates, accurate to well under a minute from published series. An
API here buys latency, a rate limit, an outage mode and a bill, in exchange for nothing.

Standard references and libraries:

- **Meeus, *Astronomical Algorithms* (2nd ed.)** — canonical. Ch. 25 solar position,
  47 lunar position, 48 illuminated fraction, 49 phases.
- **`astronomy-engine`** (npm v2.1.19, **MIT**) — port of a vetted ephemeris; gives
  illumination fraction, phase angle, rise/set/transit at sub-arcminute accuracy. Use this.
- **`suncalc`** (npm v2.0.1) — smaller and widely used, but lower lunar accuracy and
  effectively unmaintained. npm metadata reported no licence field in my check; the repo
  is BSD-2-Clause but **`counsel` should confirm** before shipping.

### Continuous moon phase, not eight buckets

Eight discrete phases throw away most of the signal and manufacture false boundaries: a
catch 12 hours before full and one 12 hours after land in different buckets despite
near-identical conditions. Store per catch:

- `moon_illumination_fraction` — 0.0-1.0, continuous.
- `moon_phase_angle_deg` — 0-360, monotonic through the cycle. **Correlate against this
  one**, because illumination is symmetric: waxing and waning gibbous both read 0.8, and
  they are not the same thing to a fish.
- `days_from_new`, `days_from_full` — **signed**. "3 days before full" is -3, "3 days
  after" is +3. Unsigned distance destroys the exact asymmetry the user asked about.
- Moonrise, moonset, sunrise, sunset, civil twilight — all UTC, at the *catch* coordinate.

Derive the 8-phase label at display time only, for the icon. Never store it, never
analyse on it.

**Warning for whoever writes the copy:** moon phase has a ~29.5 day period, season has a
365 day period, and over one or two years of data they are not independent — someone who
fishes mostly in summer has their full moons disproportionately in summer. Any "full moon
works" finding must control for season or plainly say it cannot separate the two. Same
trap as pressure and season.

## 6. Lakes and freshwater

Lakes have no tides. Drop the tide module entirely for an inland water body rather than
showing a flat line or a zero — a zero implies a measurement was taken.
**What still works, unchanged:** all weather and pressure (§3) and all sun/moon
astronomy (§5) — those are location-based, not coast-based. For a lake angler, pressure
and moon are the entire automatic set.

### USGS Water Services — free, public domain, and thinner than you would hope

```
https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=ca&parameterCd=00010
  &siteType=LK&siteStatus=active
```

Parameter codes: `00010` water temp °C, `00062` reservoir elevation, `62614` lake
elevation NAVD88, `00065` gage height. Live counts, **active California lake sites**:

| Parameter | Sites | Reality |
|---|---|---|
| `00010` water temp | **4** | Salt ponds/lagoons: Alviso, Rodeo Lagoon, Denverton Slough. **Zero fishable lakes.** |
| `62614` lake elevation | 26 | Salton Sea, Donner, Prosser, Stampede, Boca, El Capitan, San Vicente |
| `00062` reservoir elev | 3 | Upper/Lower Twin Lake, Bridgeport Reservoir |
| `00065` gage height | 4 | Havasu, Tahoe (Tahoe City), Clear Lake |

**Honest conclusion: lake level exists for perhaps 30 named California waters, and lake
water temperature exists for none that anyone fishes.** The four water-temp sites are
research stations in tidal salt ponds.

So manual entry for water temp is *more* clearly right for lakes than for the coast.
Lake-level auto-fill is worth building only if a user's home water is on the 30-site
list; the UI must degrade to "no level data for this lake" for everyone else.

Lead worth chasing later: **CDEC** (cdec.water.ca.gov), the state reservoir network, has
far denser CA reservoir coverage than USGS. Untested here — I cannot speak to its terms
or uptime. A lead, not a recommendation.

## What the analysis layer must do with all of this

1. **Missing is missing.** No station in range, buoy `MM`, NCEI `9999`, NWS outage — all
   become `null`, and the analysis says "no tide data for this trip". Never zero.
2. **Carry provenance.** Every enriched value stores source, station ID and distance from
   the catch. A water temp from 100 km away is a different fact from one at the pier, and
   the UI must be able to say so.
3. **Round coordinates to ~1 km before caching.** Stations, buoys and weather grids are
   coarser than that anyway: no accuracy lost, less stored about where people fish.
4. **Currents are user-entered.** We lack the data and will not invent it.
5. **Tide rate of change is not current speed.** The UI must not call it "current".
6. **Water temperature is user-entered**, with the nearest buoy shown as a labelled
   reference at its true distance.

## Open questions for other roles

- `cfo` / `ceo`: real Open-Meteo prices are not machine-readable — open the pricing page
  and get the numbers. Historical needs the *Professional* tier, not Standard.
- `counsel`: confirm `suncalc`'s licence if we prefer it to `astronomy-engine`; glance at
  Open-Meteo's CC-BY-SA UK Met Office source if we ever pin that model.
- `architect`: the CO-OPS tide station list alone is ~2 MB. Bundle, DB table, or edge KV?
- Nobody has verified CDIP or CDEC terms. Do not build on either until someone does.
