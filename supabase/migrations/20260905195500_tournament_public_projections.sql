-- T-008 — explicit public-safe tournament projections.
-- Public access is allowlisted through views/functions only. Raw GPS, device metadata,
-- original evidence, Fair Play details, payments, wallet addresses, private vessel data,
-- contact information, and internal notes remain private.

create or replace view public.public_tournament as
select
  t.id,
  t.slug,
  t.name,
  t.description,
  t.visibility,
  t.status,
  t.starts_at,
  t.ends_at,
  t.registration_opens_at,
  t.registration_closes_at,
  t.organization_id,
  t.created_at
from public.tournament t
where t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED');

create or replace view public.public_tournament_entry as
select
  e.id,
  e.tournament_id,
  e.entry_number,
  e.team_id,
  e.tournament_boat_id,
  i.display_name
from public.tournament_entry e
join public.tournament_entry_identity i on i.tournament_entry_id = e.id
join public.tournament t on t.id = e.tournament_id
where e.deleted_at is null
  and e.registration_status = 'CONFIRMED'
  and t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED');

create or replace view public.public_tournament_catch as
select
  c.id,
  c.tournament_id,
  c.entry_id as tournament_entry_id,
  c.species_id,
  c.weight_g,
  c.length_mm,
  c.caught_at_device as captured_at_device,
  c.status as state,
  e.storage_path as public_photo_path
from public.tournament_catch c
join public.tournament t on t.id = c.tournament_id
left join lateral (
  select ce.storage_path
  from public.catch_evidence ce
  where ce.tournament_catch_id = c.id
    and ce.evidence_type = 'PHOTO'
  order by ce.created_at asc
  limit 1
) e on true
where t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED')
  and c.status in ('APPROVED','FINAL');

create or replace view public.public_leaderboard as
select
  s.tournament_id,
  s.tournament_entry_id,
  s.division_id,
  s.rank,
  s.score_numeric,
  s.eligible_catch_count,
  s.is_disqualified,
  sc.computed_at
from public.standing s
join public.score_computation sc on sc.id = s.score_computation_id
join public.tournament t on t.id = s.tournament_id
where t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED')
  and sc.status = 'COMPLETE';

revoke all on public.public_tournament from anon, authenticated;
revoke all on public.public_tournament_entry from anon, authenticated;
revoke all on public.public_tournament_catch from anon, authenticated;
revoke all on public.public_leaderboard from anon, authenticated;

grant select on public.public_tournament to anon, authenticated;
grant select on public.public_tournament_entry to anon, authenticated;
grant select on public.public_tournament_catch to anon, authenticated;
grant select on public.public_leaderboard to anon, authenticated;

comment on view public.public_tournament is 'Allowlisted tournament metadata for PUBLIC/UNLISTED discovery. PRIVATE and INVITE_ONLY are excluded.';
comment on view public.public_tournament_entry is 'Public competitor display projection. No email, claim token, user id, contact details or payment state.';
comment on view public.public_tournament_catch is 'Approved public catch projection. No raw GPS, device metadata, original evidence metadata, Fair Play signals or internal notes.';
comment on view public.public_leaderboard is 'Public official standing projection. No scoring internals, penalty detail, payment or private integrity metadata.';

create or replace function public.get_public_tournament(target_slug text)
returns setof public.public_tournament
language sql stable security definer set search_path = public as $$
  select * from public.public_tournament where slug = target_slug limit 1;
$$;

create or replace function public.get_public_leaderboard(target_tournament_id uuid)
returns setof public.public_leaderboard
language sql stable security definer set search_path = public as $$
  select * from public.public_leaderboard
  where tournament_id = target_tournament_id
  order by rank asc, tournament_entry_id asc;
$$;

revoke all on function public.get_public_tournament(text) from public;
revoke all on function public.get_public_leaderboard(uuid) from public;
grant execute on function public.get_public_tournament(text) to anon, authenticated;
grant execute on function public.get_public_leaderboard(uuid) to anon, authenticated;
