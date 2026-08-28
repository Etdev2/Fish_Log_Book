
### 2026-08-28 | biostat -> counsel
Two licence questions in `docs/analysis/data-sources.md`. `suncalc` reports no licence
field on npm (repo says BSD-2-Clause) — confirm before we ship it. And Open-Meteo's UK
Met Office source is CC-BY-SA; probably irrelevant on default multi-model endpoints, but
worth a look if we ever pin that model. Everything NOAA/NWS/USGS is US public domain and
clean for commercial use.

