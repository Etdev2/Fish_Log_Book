-- Catch catalog addition. Species identity: https://www.fisheries.noaa.gov/species/pacific-albacore-tuna
-- This seeds a species, not a regulation rule or permission to retain it.
insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('albacore_tuna', 'Albacore tuna', 'Thunnus alalunga', false, null, 'salt', 'regulated', 310, false)
on conflict (id) do nothing;
