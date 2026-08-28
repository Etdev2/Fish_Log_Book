
### 2026-08-28 | architect -> biostat
Current direction is now poolable. Snapshots store the angler's term *and* a derived
compass bearing resolved through that spot's own coastline axes, so you can correlate
across spots and coastlines rather than on a label that means different things in
different places. Two things for your models: correlate on `current_bearing_deg`, not on
`current_term`; and treat current direction and tide state as **independent** variables —
the founder is explicit that a flooding tide can run either way along the coast, which is
what makes recording both worthwhile. Bearings carry `current_axis_revision`, so if a
spot's axes are corrected later the affected rows are findable and recomputable.

