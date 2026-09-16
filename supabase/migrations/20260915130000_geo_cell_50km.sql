-- =============================================================================
-- geo_cell_50km: the default grain for public and sensitive-species surfaces.
--
-- `ontology.md` §6 ships two generated cells and rules that `geo_cell_10km` is "the
-- finest granularity any cross-user aggregate may ever group by". That remains true.
-- This adds a COARSER rung, not a finer one, because 10 km is the finest permitted and
-- not the default: a protected species, a public map, or an angler who has not chosen
-- anything should land somewhere safer than the maximum the rules allow.
--
-- Same formula shape as the existing two, deliberately. 0.5° of latitude is about
-- 55.6 km tall, and `cos(latitude)` times that wide — narrower as you go north, which is
-- the safe direction for a privacy grain to err in. `core/privacy/precision.ts` computes
-- the identical string on the client, and `privacy.test.ts` pins both against the same
-- vectors: a client that disagrees with this column would quietly exclude its own rows
-- from every aggregate built on it.
--
-- Spec: docs/specs/expansion/privacy-consent-and-data-governance.md §6.1, §8.
-- =============================================================================

alter table public.catch
  add column if not exists geo_cell_50km text generated always as (
    case when lat is null or lng is null then null else
      (floor(lat * 2))::int::text || '_' || (floor(lng * 2))::int::text
    end) stored;

comment on column public.catch.geo_cell_50km is
  'Coarsest generated cell: ~55 km of latitude. The DEFAULT grain for public and '
  'protected-species surfaces. geo_cell_10km remains the finest any cross-user aggregate '
  'may group by (ontology.md §6); this is where a disclosure lands when no rule has '
  'argued it finer.';

-- -----------------------------------------------------------------------------
-- The per-catch privacy override.
--
-- One value, not a scale. `privacy-consent-and-data-governance.md` §7.3 keeps this off
-- the quick-log path entirely — a privacy decision made with a fish flapping in the boat
-- is a decision made badly — so it is set later, from the catch detail sheet, and it caps
-- every disclosure of that one fish at ZONE forever.
--
-- Still no `public` boolean. ontology.md §6 refused that column speculatively and it is
-- still right: visibility is a function of grants, not a flag on a row.
-- -----------------------------------------------------------------------------
alter table public.catch
  add column if not exists privacy_override text
    check (privacy_override is null or privacy_override in ('extra_private'));

comment on column public.catch.privacy_override is
  'Null is the normal case: this catch follows the angler''s account default and the '
  'species policy. ''extra_private'' caps any disclosure of this fish at ZONE, beating '
  'every other input (core/privacy/effective.ts).';
