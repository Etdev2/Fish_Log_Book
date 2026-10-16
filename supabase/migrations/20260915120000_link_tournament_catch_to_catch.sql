-- =============================================================================
-- One fish, one record: link public.tournament_catch to public.catch.
--
-- ARCH-001 built the tournament domain three months after the ontology and gave it
-- its own catch row. `tournament_catch` re-declares species, caught-at, length,
-- weight and disposition, and nothing joins it to the fish in the angler's log.
--
-- The cost of that, before this migration:
--   * an angler in a tournament logs the same fish twice, in two screens;
--   * personal bests, the Passport and every species collection silently undercount
--     tournament fish;
--   * `condition_snapshot` and the regulation snapshot attach to `public.catch`, so
--     the most heavily evidenced, judge-reviewed catches in the system carry the
--     LEAST environmental and regulatory metadata;
--   * any effort or catch-per-unit-effort figure computed from `public.catch` is
--     wrong by exactly the tournament volume — the one segment where effort is
--     precisely known.
--
-- See docs/specs/expansion/data-architecture-expansion.md §5.
--
-- Two deliberate deviations from that spec, both recorded here rather than in a
-- commit message nobody will find again:
--
--   1. `on delete set null`, NOT `on delete restrict`. The spec chose restrict so a
--      deleted personal catch could never take a competitive result (and a payout
--      computed from it) with it. `set null` reaches the same end: the tournament
--      claim is already immutable and carries its own copy of species, time, length
--      and weight, so it survives severance intact. Restrict would have been correct
--      AND would have made account deletion fail at the database level today, because
--      the deletion job that was supposed to sever links first does not exist yet. A
--      privacy guarantee that throws a foreign-key violation is not a privacy
--      guarantee. `catch_link_severed_at` below keeps the severance from being silent.
--
--   2. No backfill. Existing tournament catches stay unlinked. Matching them would
--      need a heuristic (same angler, same species, ±5 min, ±200 m) that is wrong
--      some of the time, and a wrong link is worse than an honest null — it would
--      attach one angler's conditions to another angler's competitive claim. History
--      is unlinked and labelled; the link starts now.
-- =============================================================================

alter table public.tournament_catch
  add column if not exists catch_id uuid references public.catch(id) on delete set null,
  add column if not exists catch_link_severed_at timestamptz;

comment on column public.tournament_catch.catch_id is
  'The angler''s own catch row for this fish. Null means one of exactly two things: a '
  'guest entrant with no Fish Log Book account, or a row that predates this link '
  '(2026-09-15). Never null for a new submission by an account holder — see '
  'tg_tournament_catch_requires_catch_link.';

comment on column public.tournament_catch.catch_link_severed_at is
  'Set when the linked personal catch was deleted. Distinguishes "never linked" from '
  '"was linked, and the angler deleted their fish" — the second is a fact a judge or a '
  'dispute may need, and a bare null would hide it.';

-- Reverse lookup: "is this fish entered in anything?" runs on the catch detail sheet.
create index if not exists tournament_catch_catch_idx
  on public.tournament_catch (catch_id)
  where catch_id is not null;

-- One personal catch may be entered in one event exactly once. Entering the same fish
-- twice in one tournament is double-scoring; entering it in two DIFFERENT tournaments
-- is legitimate (an event and a side jackpot), so the uniqueness is per tournament.
create unique index if not exists tournament_catch_one_per_event
  on public.tournament_catch (tournament_id, catch_id)
  where catch_id is not null;

-- -----------------------------------------------------------------------------
-- Ownership: you may only link your own fish.
--
-- security definer because `public.catch` is default-deny RLS keyed on angler_id, and
-- this check has to see a row the caller cannot select. Without it the column would be
-- a way to staple someone else's catch — and its conditions, its GPS and its
-- regulation snapshot — onto your own competitive claim.
-- -----------------------------------------------------------------------------
create or replace function public.tg_tournament_catch_link_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if new.catch_id is null then
    return new;
  end if;

  select angler_id into owner_id from public.catch where id = new.catch_id;

  if owner_id is null then
    raise exception 'linked catch % does not exist', new.catch_id
      using errcode = '23503';
  end if;

  if new.created_by is null or owner_id <> new.created_by then
    raise exception 'a tournament catch may only link to the submitting angler''s own catch'
      using errcode = '42501';
  end if;

  return new;
end $$;

create trigger tg_tournament_catch_link_ownership
before insert or update of catch_id on public.tournament_catch
for each row execute function public.tg_tournament_catch_link_ownership();

-- -----------------------------------------------------------------------------
-- The link is required going forward, for anyone who has an account to link to.
--
-- INSERT only, deliberately. Rows written before 2026-09-15 stay unlinked and stay
-- updatable; enforcing on update would make historic rows unreviewable, which would
-- punish judges for a schema decision they did not make.
--
-- `created_by` null is a guest submission: there is no personal catch in existence, so
-- there is nothing to require.
-- -----------------------------------------------------------------------------
create or replace function public.tg_tournament_catch_requires_catch_link()
returns trigger language plpgsql as $$
begin
  if new.created_by is not null and new.catch_id is null then
    raise exception
      'an account holder''s tournament catch must reference their own public.catch row '
      '(log the fish once, then enter it)'
      using errcode = '23502';
  end if;
  return new;
end $$;

create trigger tg_tournament_catch_requires_catch_link
before insert on public.tournament_catch
for each row execute function public.tg_tournament_catch_requires_catch_link();

-- -----------------------------------------------------------------------------
-- The link is immutable once made, except for severance.
--
-- Re-pointing a claim at a different personal catch after submission would be a way to
-- swap the evidence under a scored result. The one permitted transition is set -> null,
-- which is what the foreign key's ON DELETE SET NULL performs when the angler deletes
-- their fish, and it stamps the severance rather than letting it pass unrecorded.
-- -----------------------------------------------------------------------------
create or replace function public.tg_tournament_catch_link_immutable()
returns trigger language plpgsql as $$
begin
  if old.catch_id is not null and new.catch_id is null then
    new.catch_link_severed_at := coalesce(new.catch_link_severed_at, now());
    return new;
  end if;

  if old.catch_id is distinct from new.catch_id and old.catch_id is not null then
    raise exception 'a tournament catch cannot be re-pointed at a different catch'
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

create trigger tg_tournament_catch_link_immutable
before update on public.tournament_catch
for each row execute function public.tg_tournament_catch_link_immutable();
