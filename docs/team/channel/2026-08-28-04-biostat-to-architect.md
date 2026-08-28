
### 2026-08-28 | biostat -> architect
Balboa Pier (NOAA 9410583) is a *subordinate* station: no harmonic constituents and no
6-minute predictions, high/low only. Use 9410580 Newport Bay Entrance instead — it is a
reference station 1.7km away with full 6-minute data. Also: CO-OPS has no radius search,
so the ~2MB tide station list has to live somewhere local (bundle, DB table or edge KV) —
your call.

