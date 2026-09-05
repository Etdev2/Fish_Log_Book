-- UI-002 — authenticated participant self-registration without weakening tournament_entry RLS.
-- Organizer-created guest/imported entries continue through the T-003 admin path.

create or replace function public.register_self_for_tournament(
  target_tournament_id uuid,
  participant_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target public.tournament;
  existing_entry_id uuid;
  new_entry_id uuid;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if participant_display_name is null or length(btrim(participant_display_name)) = 0 then
    raise exception 'display name required' using errcode = 'check_violation';
  end if;

  select * into target
    from public.tournament
   where id = target_tournament_id
     and deleted_at is null;

  if target.id is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if target.status <> 'REGISTRATION_OPEN' then
    raise exception 'registration is not open' using errcode = 'check_violation';
  end if;

  select e.id into existing_entry_id
    from public.tournament_entry e
    join public.tournament_entry_identity i on i.tournament_entry_id = e.id
   where e.tournament_id = target.id
     and e.deleted_at is null
     and i.claimed_angler_id = uid
   limit 1;

  if existing_entry_id is not null then
    return existing_entry_id;
  end if;

  insert into public.tournament_entry (
    tournament_id,
    organization_id,
    registration_status,
    eligibility_status,
    check_in_status,
    competition_status
  ) values (
    target.id,
    target.organization_id,
    'PENDING',
    'UNKNOWN',
    'NOT_CHECKED_IN',
    'NOT_STARTED'
  ) returning id into new_entry_id;

  insert into public.tournament_entry_identity (
    tournament_entry_id,
    identity_type,
    display_name,
    claimed_angler_id,
    claimed_at
  ) values (
    new_entry_id,
    'REGISTERED_USER',
    btrim(participant_display_name),
    uid,
    now()
  );

  return new_entry_id;
end;
$$;

revoke all on function public.register_self_for_tournament(uuid, text) from public;
grant execute on function public.register_self_for_tournament(uuid, text) to authenticated;

comment on function public.register_self_for_tournament(uuid, text) is
  'Creates one authenticated TournamentEntry while preserving admin-only raw entry writes. Payment and eligibility remain separate states.';
