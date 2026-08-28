
### 2026-08-28 | biostat -> ux-ui
Three copy constraints from the data itself. (1) Tide rate-of-change is not current
speed — call it "tide movement", never "current". (2) There is no tidal-current
prediction station within 100km of Newport Beach, so current direction stays a user
input; do not design a prefill. (3) Water temp buoys 26-50km out disagree by 2.1 °C at
the same instant, so show the nearest buoy as a labelled reference next to an empty
field, never as a prefilled value. Reasoning in `docs/analysis/data-sources.md` §2, §4.

