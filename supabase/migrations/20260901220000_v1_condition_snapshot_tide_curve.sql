-- v1: condition_snapshot gains tide_curve (founder Historical Catch spec §6).
--
-- The scalar tide fields (tide_height_m, tide_rate_m_per_hr, tide_state,
-- tide_pct_through_cycle, twelfths_hour, tide_range_m) already exist from the core
-- schema. What they cannot carry is the *shape* of the water around the catch — the
-- mini-curve the Catch Detail page draws. Re-sampling the tide engine at view time
-- would violate §6 ("never recompute-on-view"): what the catch shows is what was
-- captured at log time. So the curve is stored like everything else.
--
-- Shape: an array of [minutesFromCatch, metres] pairs, sampled every 15 minutes
-- across catch_time ± 3h: [["-180", 1.02], ...]. Deliberately small (25 points),
-- deliberately denormalised, deliberately not a new table.
alter table public.condition_snapshot
  add column tide_curve jsonb;

comment on column public.condition_snapshot.tide_curve is
  'Array of [minutesFromCatch: number, heightM: number] pairs sampled ±3h around the catch at 15-minute steps. Written once at fill time from the cached tide series; read-only afterwards (Historical spec §6). Null = tide fill never ran (out of window, fresh water, or pre-feature catch).';

alter table public.condition_snapshot
  add constraint snapshot_tide_curve_shape check (
    tide_curve is null
    or (jsonb_typeof(tide_curve) = 'array' and jsonb_array_length(tide_curve) <= 41)
  );

comment on constraint snapshot_tide_curve_shape on public.condition_snapshot is
  'A curve is a bounded sample set, not a warehouse: 41 points covers ±5h at 15-minute steps, far beyond the ±3h this feature writes.';
