-- inSeasonWindow year-wrap fix (2026-09-03): engine now compares season bounds on
-- MM-DD and honours windows that span New Year's (start > end). Real dates replace the
-- note-only workaround on the two wrapped pot-gear seasons shipped in the v4 WA crab
-- migration. Dates are booked to the 2026 federal-regs year like every other row.
update public.reg_rule
set season_start = '2026-12-01', season_end = '2026-09-15',
    depth_note = 'Pot-gear window (wraps the calendar year); non-pot gear year-round.'
where species_id is null
  and reg_area_id = 'wa-ma-1-4-coastal'
  and verbatim like 'Grays Harbor, and Marine Areas 1-3%Pot Gear.%';

update public.reg_rule
set season_start = '2026-11-15', season_end = '2026-09-15',
    depth_note = 'Pot-gear window (wraps the calendar year); non-pot gear year-round.'
where species_id is null
  and reg_area_id = 'wa-willapa-bay'
  and verbatim like 'Willapa Bay — Dungeness and Red Rock Crab%Pot Gear.%';
