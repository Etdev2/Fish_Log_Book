-- ARCH-001 / T-002 — tournament core, lifecycle and frozen competition configuration.
-- Depends on T-001 organization tenancy.

create table if not exists public.tournament (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  slug text,
  visibility text not null default 'PRIVATE'
    check (visibility in ('PRIVATE','INVITE_ONLY','UNLISTED','PUBLIC')),
  status text not null default 'DRAFT'
    check (status in ('DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','READY','LIVE','PAUSED','COMPLETED','RESULTS_PENDING','FINAL','CANCELLED')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tournament_name_not_blank check (length(btrim(name)) > 0),
  constraint tournament_time_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create unique index if not exists tournament_org_slug_unique_active
  on public.tournament (organization_id, lower(slug))
  where slug is not null and deleted_at is null;

create index if not exists tournament_org_status_idx
  on public.tournament (organization_id, status)
  where deleted_at is null;

create table if not exists public.tournament_rule_set_version (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  version integer not null,
  rules jsonb not null,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (tournament_id, version)
);

create table if not exists public.tournament_scoring_version (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  version integer not null,
  scoring_family text not null
    check (scoring_family in ('BIGGEST_FISH','TOTAL_WEIGHT','BEST_N_WEIGHT','TOTAL_LENGTH','BIGGEST_LENGTH','POINTS','SPECIES_POINTS','SPECIES_MULTIPLIER','EVERY_FISH_COUNTS','CUSTOM')),
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (tournament_id, version)
);

create table if not exists public.tournament_verification_policy_version (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  version integer not null,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (tournament_id, version)
);

create table if not exists public.tournament_boundary_version (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  version integer not null,
  boundaries jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (tournament_id, version)
);

alter table public.tournament
  add column if not exists active_rule_set_version_id uuid references public.tournament_rule_set_version(id),
  add column if not exists active_scoring_version_id uuid references public.tournament_scoring_version(id),
  add column if not exists active_verification_policy_version_id uuid references public.tournament_verification_policy_version(id),
  add column if not exists active_boundary_version_id uuid references public.tournament_boundary_version(id);

create table if not exists public.tournament_lifecycle_event (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid not null references public.angler(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists tournament_lifecycle_event_lookup
  on public.tournament_lifecycle_event (tournament_id, created_at);

create or replace function public.tournament_transition_allowed(from_status text, to_status text)
returns boolean
language sql
immutable
as $$
  select case
    when from_status = 'DRAFT' and to_status in ('REGISTRATION_OPEN','CANCELLED') then true
    when from_status = 'REGISTRATION_OPEN' and to_status in ('REGISTRATION_CLOSED','CANCELLED') then true
    when from_status = 'REGISTRATION_CLOSED' and to_status in ('READY','REGISTRATION_OPEN','CANCELLED') then true
    when from_status = 'READY' and to_status in ('LIVE','CANCELLED') then true
    when from_status = 'LIVE' and to_status in ('PAUSED','COMPLETED') then true
    when from_status = 'PAUSED' and to_status in ('LIVE','COMPLETED','CANCELLED') then true
    when from_status = 'COMPLETED' and to_status = 'RESULTS_PENDING' then true
    when from_status = 'RESULTS_PENDING' and to_status = 'FINAL' then true
    else false
  end;
$$;

create or replace function public.transition_tournament(
  target_tournament_id uuid,
  next_status text,
  transition_reason text default null
)
returns public.tournament
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.tournament;
begin
  select * into current_row
    from public.tournament
   where id = target_tournament_id
     and deleted_at is null
   for update;

  if current_row.id is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if not public.is_organization_member(current_row.organization_id, array['OWNER','ADMIN','STAFF']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not public.tournament_transition_allowed(current_row.status, next_status) then
    raise exception 'invalid tournament transition: % -> %', current_row.status, next_status
      using errcode = 'check_violation';
  end if;

  if next_status = 'LIVE' and (
    current_row.active_rule_set_version_id is null
    or current_row.active_scoring_version_id is null
    or current_row.active_verification_policy_version_id is null
    or current_row.active_boundary_version_id is null
  ) then
    raise exception 'LIVE requires frozen rule, scoring, verification, and boundary versions'
      using errcode = 'check_violation';
  end if;

  if next_status = 'LIVE' then
    update public.tournament_rule_set_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_rule_set_version_id;
    update public.tournament_scoring_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_scoring_version_id;
    update public.tournament_verification_policy_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_verification_policy_version_id;
    update public.tournament_boundary_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_boundary_version_id;
  end if;

  insert into public.tournament_lifecycle_event (
    tournament_id, organization_id, from_status, to_status, actor_id, reason
  ) values (
    current_row.id, current_row.organization_id, current_row.status, next_status, auth.uid(), transition_reason
  );

  update public.tournament
     set status = next_status
   where id = current_row.id
  returning * into current_row;

  return current_row;
end;
$$;

revoke all on function public.transition_tournament(uuid, text, text) from public;
grant execute on function public.transition_tournament(uuid, text, text) to authenticated;

-- Once a competition configuration version is locked, it is immutable.
create or replace function public.tg_reject_locked_tournament_version_update()
returns trigger language plpgsql as $$
begin
  if old.locked_at is not null then
    raise exception 'locked tournament configuration versions are immutable'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'tournament_rule_set_version',
    'tournament_scoring_version',
    'tournament_verification_policy_version',
    'tournament_boundary_version'
  ] loop
    execute format(
      'create trigger tg_%1$s_immutable_locked before update or delete on public.%1$s for each row execute function public.tg_reject_locked_tournament_version_update()',
      t
    );
  end loop;
end $$;

alter table public.tournament enable row level security;
alter table public.tournament_rule_set_version enable row level security;
alter table public.tournament_scoring_version enable row level security;
alter table public.tournament_verification_policy_version enable row level security;
alter table public.tournament_boundary_version enable row level security;
alter table public.tournament_lifecycle_event enable row level security;

revoke all on public.tournament from anon;
revoke all on public.tournament_rule_set_version from anon;
revoke all on public.tournament_scoring_version from anon;
revoke all on public.tournament_verification_policy_version from anon;
revoke all on public.tournament_boundary_version from anon;
revoke all on public.tournament_lifecycle_event from anon;

grant select, insert, update on public.tournament to authenticated;
grant select, insert, update on public.tournament_rule_set_version to authenticated;
grant select, insert, update on public.tournament_scoring_version to authenticated;
grant select, insert, update on public.tournament_verification_policy_version to authenticated;
grant select, insert, update on public.tournament_boundary_version to authenticated;
grant select on public.tournament_lifecycle_event to authenticated;

create policy tournament_select_member
  on public.tournament for select to authenticated
  using (public.is_organization_member(organization_id));
create policy tournament_insert_admin
  on public.tournament for insert to authenticated
  with check (created_by = auth.uid() and public.is_organization_member(organization_id, array['OWNER','ADMIN']));
create policy tournament_update_admin
  on public.tournament for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_rule_version_member
  on public.tournament_rule_set_version for select to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id)));
create policy tournament_rule_version_admin
  on public.tournament_rule_set_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));
create policy tournament_rule_version_update_admin
  on public.tournament_rule_set_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));

create policy tournament_scoring_version_member
  on public.tournament_scoring_version for select to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id)));
create policy tournament_scoring_version_admin
  on public.tournament_scoring_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));
create policy tournament_scoring_version_update_admin
  on public.tournament_scoring_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));

create policy tournament_verification_version_member
  on public.tournament_verification_policy_version for select to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id)));
create policy tournament_verification_version_admin
  on public.tournament_verification_policy_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));
create policy tournament_verification_version_update_admin
  on public.tournament_verification_policy_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));

create policy tournament_boundary_version_member
  on public.tournament_boundary_version for select to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id)));
create policy tournament_boundary_version_admin
  on public.tournament_boundary_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));
create policy tournament_boundary_version_update_admin
  on public.tournament_boundary_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN','STAFF'])));

create policy tournament_lifecycle_event_member
  on public.tournament_lifecycle_event for select to authenticated
  using (public.is_organization_member(organization_id));

create trigger tg_tournament_updated_at
before update on public.tournament
for each row execute function public.tg_set_updated_at();

comment on table public.tournament is
  'Server-authoritative tournament aggregate. Every row belongs to one Organization tenant.';
comment on table public.tournament_lifecycle_event is
  'Append-only audit record for canonical tournament lifecycle transitions.';
