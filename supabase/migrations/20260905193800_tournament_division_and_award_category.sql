-- Divisions and award categories.
--
-- WHY THIS FILE IS DATED BEFORE THE FILE THAT NEEDS IT
--
-- `20260905194000_tournament_scoring.sql` already references both of these tables:
--
--   standing.division_id                       -> public.tournament_division(id)
--   final_result_award.tournament_award_category_id -> public.tournament_award_category(id)
--
-- Neither table was ever created, in that migration or any other. A fresh `supabase db
-- reset` therefore fails at 194000 with "relation public.tournament_division does not
-- exist", which means no database has ever successfully applied it and there is no
-- deployed environment for an out-of-order version to skip. Creating them here — one
-- version earlier, so the foreign keys resolve when 194000 runs — is the repair that keeps
-- the existing file untouched. Everything is `if not exists`, so an environment that
-- somehow already has these tables is unaffected.
--
-- WHAT THEY ARE
--
-- A DIVISION is who you are competing against: Junior, Ladies, Masters, Charter. Every
-- entry sits in at most one.
--
-- An AWARD CATEGORY is what you are competing for: Biggest Marlin, Biggest Tuna, Heaviest
-- Stringer. An entry can be in several at once, each with its own scoring rule, its own
-- entry fee and its own pot — the shape a Bisbee's-style event needs, and the shape
-- `core/tournaments/formats.ts` writes.
--
-- The two are deliberately separate axes. "Biggest tuna in the Junior division" is the
-- intersection of one of each, and collapsing them into a single list is how a tournament
-- ends up unable to express that.

-- Divisions -----------------------------------------------------------------

create table if not exists public.tournament_division (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tournament_division_name_not_blank check (length(btrim(name)) > 0),
  unique (tournament_id, name)
);

create index if not exists tournament_division_tournament_lookup
  on public.tournament_division (tournament_id, sort_order)
  where deleted_at is null;

-- Award categories ----------------------------------------------------------

create table if not exists public.tournament_award_category (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  -- Stable within the tournament and chosen by the host's format document, so a standing
  -- row and an award row can both name the same category without a lookup.
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,

  -- The same nine families `tournament_scoring_version.scoring_family` allows. A category
  -- scores on exactly one of them.
  scoring_family text not null default 'BIGGEST_FISH'
    check (scoring_family in ('BIGGEST_FISH','TOTAL_WEIGHT','BEST_N_WEIGHT','TOTAL_LENGTH','BIGGEST_LENGTH','POINTS','SPECIES_POINTS','SPECIES_MULTIPLIER','EVERY_FISH_COUNTS','CUSTOM')),
  -- Species list, points table, best-N — whatever that family needs. Mirrors the category
  -- as it appears in the frozen scoring version's configuration.
  configuration jsonb not null default '{}'::jsonb,

  payout_model text not null default 'NONE'
    check (payout_model in ('NONE','WINNER_TAKE_ALL','PLACES')),
  -- Percentages, first place first. Empty unless the model is PLACES.
  payout_split jsonb not null default '[]'::jsonb,

  -- What the host says it costs to enter this category. Declared, never collected here:
  -- money moves through the payment domain and nowhere else.
  entry_fee_minor bigint check (entry_fee_minor is null or entry_fee_minor >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),

  division_id uuid references public.tournament_division(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint tournament_award_category_name_not_blank check (length(btrim(name)) > 0),
  constraint tournament_award_category_slug_not_blank check (length(btrim(slug)) > 0),
  unique (tournament_id, slug)
);

create index if not exists tournament_award_category_tournament_lookup
  on public.tournament_award_category (tournament_id, sort_order)
  where deleted_at is null;

-- A category belongs to the same tournament as the division it is scoped to. Enforced
-- rather than trusted, matching `tg_validate_tournament_entry_scope` and its siblings in
-- 20260905190500 — a cross-tournament reference here would silently mis-score an event.
create or replace function public.tg_validate_award_category_scope()
returns trigger language plpgsql as $$
declare
  division_tournament uuid;
begin
  if new.division_id is not null then
    select tournament_id into division_tournament
      from public.tournament_division
     where id = new.division_id;

    if division_tournament is null or division_tournament <> new.tournament_id then
      raise exception 'award category division must belong to the same tournament'
        using errcode = 'foreign_key_violation';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tg_award_category_scope on public.tournament_award_category;
create trigger tg_award_category_scope
  before insert or update on public.tournament_award_category
  for each row execute function public.tg_validate_award_category_scope();

-- Row level security --------------------------------------------------------

alter table public.tournament_division enable row level security;
alter table public.tournament_award_category enable row level security;

revoke all on public.tournament_division from anon;
revoke all on public.tournament_award_category from anon;
grant select on public.tournament_division to authenticated;
grant select on public.tournament_award_category to authenticated;

-- Reads follow the tournament: anyone in the organization can see its divisions and
-- categories. Writes are not granted to `authenticated` at all — categories are written by
-- `save_tournament_format`, a security-definer function that checks the caller is an owner
-- or admin and that the tournament is not already locked. There is no direct write path,
-- deliberately: a category edited out from under a running tournament changes what
-- everybody was fishing for.
create policy tournament_division_org_read on public.tournament_division
  for select to authenticated
  using (public.is_organization_member(organization_id));

create policy tournament_award_category_org_read on public.tournament_award_category
  for select to authenticated
  using (public.is_organization_member(organization_id));

comment on table public.tournament_division is
  'Who an entry competes against (Junior, Ladies, Charter). One per entry at most.';
comment on table public.tournament_award_category is
  'What an entry competes for (Biggest Marlin, Heaviest Stringer). Several per entry, each with its own rule, fee and pot. Written only by save_tournament_format.';
