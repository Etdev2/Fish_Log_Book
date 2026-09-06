-- Saving the format a host chose for their tournament.
--
-- The format — the categories, what scores in each, what each costs, how each pays out —
-- is written as one document into `tournament_scoring_version.configuration`, and mirrored
-- into `tournament_award_category` rows so that standings and final awards have something
-- durable to point at.
--
-- It goes through a function rather than through table grants for three reasons:
--
-- 1. The two writes have to happen together. A scoring version without its categories, or
--    categories without the version that froze them, is a tournament that cannot be scored.
-- 2. Versions are the audit trail. Every save appends a new version and repoints
--    `tournament.active_scoring_version_id`; nothing is edited in place, so what a
--    tournament was scored under is always recoverable.
-- 3. A locked version is immutable and a running tournament's rules must not move under
--    the people fishing it. Both are checked here, in one place, rather than hoped for.

create or replace function public.save_tournament_format(
  target_tournament_id uuid,
  format jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target public.tournament;
  next_version integer;
  new_version_id uuid;
  category jsonb;
  ordinal integer := 0;
  family text;
  currency text;
  kept text[] := array[]::text[];
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into target
    from public.tournament
   where id = target_tournament_id
     and deleted_at is null;

  if target.id is null then
    raise exception 'tournament not found' using errcode = 'no_data_found';
  end if;

  -- Setting the terms of a competition is an owner/admin act, not something any member of
  -- the organization can do on the morning of the event.
  if not public.is_organization_member(target.organization_id, array['OWNER','ADMIN']) then
    raise exception 'not permitted to set the format for this tournament' using errcode = '42501';
  end if;

  -- Before the boats leave, and not after. LIVE, PAUSED, COMPLETED, RESULTS_PENDING, FINAL
  -- and CANCELLED are all refused: changing what counts once anybody has fished is the one
  -- thing that makes a result impossible to defend.
  if target.status not in ('DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','READY') then
    raise exception 'the format cannot change once the tournament has started (status %)', target.status
      using errcode = 'check_violation';
  end if;

  if format is null or jsonb_typeof(format -> 'categories') <> 'array'
     or jsonb_array_length(format -> 'categories') = 0 then
    raise exception 'a format needs at least one category' using errcode = 'check_violation';
  end if;

  currency := coalesce(format ->> 'currency', 'USD');
  if currency !~ '^[A-Z]{3}$' then
    raise exception 'currency must be a three letter code' using errcode = 'check_violation';
  end if;

  -- One family when every category agrees, CUSTOM when they do not. Mirrors
  -- `familyColumnFor` in core/tournaments/formats.ts; the column holds one value and the
  -- configuration document is the truth.
  select case when count(distinct value ->> 'family') = 1
              then min(value ->> 'family')
              else 'CUSTOM' end
    into family
    from jsonb_array_elements(format -> 'categories') as value;

  select coalesce(max(version), 0) + 1 into next_version
    from public.tournament_scoring_version
   where tournament_id = target_tournament_id;

  insert into public.tournament_scoring_version (
    tournament_id, version, scoring_family, configuration, created_by
  )
  values (target_tournament_id, next_version, family, format, uid)
  returning id into new_version_id;

  -- Categories are upserted by slug rather than replaced, because `final_result_award`
  -- references them `on delete restrict`: a category that has already awarded somebody a
  -- prize cannot be deleted, and should not be. One the host dropped is soft-deleted
  -- instead, so the award it produced still resolves.
  for category in select * from jsonb_array_elements(format -> 'categories')
  loop
    ordinal := ordinal + 1;
    kept := kept || (category ->> 'id');

    insert into public.tournament_award_category (
      tournament_id, organization_id, slug, name, sort_order,
      scoring_family, configuration, payout_model, payout_split,
      entry_fee_minor, currency, deleted_at
    )
    values (
      target_tournament_id,
      target.organization_id,
      category ->> 'id',
      category ->> 'name',
      ordinal,
      coalesce(category ->> 'family', 'BIGGEST_FISH'),
      coalesce(category - 'id' - 'name' - 'family', '{}'::jsonb),
      coalesce(category -> 'payout' ->> 'model', 'NONE'),
      coalesce(category -> 'payout' -> 'split', '[]'::jsonb),
      nullif(category ->> 'entryFeeMinor', '')::bigint,
      currency,
      null
    )
    on conflict (tournament_id, slug) do update set
      name = excluded.name,
      sort_order = excluded.sort_order,
      scoring_family = excluded.scoring_family,
      configuration = excluded.configuration,
      payout_model = excluded.payout_model,
      payout_split = excluded.payout_split,
      entry_fee_minor = excluded.entry_fee_minor,
      currency = excluded.currency,
      deleted_at = null,
      updated_at = now();
  end loop;

  update public.tournament_award_category
     set deleted_at = now(), updated_at = now()
   where tournament_id = target_tournament_id
     and deleted_at is null
     and not (slug = any (kept));

  update public.tournament
     set active_scoring_version_id = new_version_id,
         updated_at = now()
   where id = target_tournament_id;

  return new_version_id;
end $$;

revoke all on function public.save_tournament_format(uuid, jsonb) from public;
grant execute on function public.save_tournament_format(uuid, jsonb) to authenticated;

comment on function public.save_tournament_format(uuid, jsonb) is
  'Appends a scoring version holding the host''s format document, mirrors its categories into tournament_award_category, and makes it the active version. Owner/admin only, and refused once the tournament has started.';

-- Reading a tournament's active format back is a plain select on
-- `tournament_scoring_version`, which already carries an organization-scoped read policy
-- from 20260905184500. Nothing new is granted here.
