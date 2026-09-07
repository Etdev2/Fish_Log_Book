-- HARD-007 / TEST-001 discovery — metadata required by public tournament discovery and registration UI.
-- These are tournament-owned fields, not public-only duplicates. T-008 allowlists them later.

alter table public.tournament
  add column if not exists description text,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz;

alter table public.tournament
  drop constraint if exists tournament_registration_time_order;

alter table public.tournament
  add constraint tournament_registration_time_order check (
    registration_closes_at is null
    or registration_opens_at is null
    or registration_closes_at >= registration_opens_at
  );

comment on column public.tournament.description is
  'Organizer-authored tournament description. Public projection exposes it only for PUBLIC/UNLISTED tournaments.';
comment on column public.tournament.registration_opens_at is
  'Optional registration opening time; null means no separate scheduled opening boundary.';
comment on column public.tournament.registration_closes_at is
  'Optional registration closing time; null means no separate scheduled closing boundary.';
