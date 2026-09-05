-- ARCH-001 / T-003 — tournament entry, guest/import identity, team and boat registration.
-- Depends on T-002 tournament core. Payment state deliberately remains outside this domain.

create table if not exists public.tournament_team (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint tournament_team_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists tournament_team_tournament_idx
  on public.tournament_team (tournament_id)
  where deleted_at is null;

create table if not exists public.boat (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organization(id) on delete set null,
  owner_angler_id uuid references public.angler(id) on delete set null,
  name text not null,
  registration_number text,
  make text,
  model text,
  length_mm integer check (length_mm is null or length_mm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint boat_name_not_blank check (length(btrim(name)) > 0),
  constraint boat_has_owner_context check (organization_id is not null or owner_angler_id is not null)
);

create table if not exists public.tournament_boat (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  boat_id uuid not null references public.boat(id) on delete restrict,
  entry_number text,
  registration_status text not null default 'PENDING'
    check (registration_status in ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
  inspection_status text not null default 'NOT_REQUIRED'
    check (inspection_status in ('NOT_REQUIRED','PENDING','PASSED','FAILED')),
  check_in_status text not null default 'NOT_CHECKED_IN'
    check (check_in_status in ('NOT_CHECKED_IN','CHECKED_IN','CHECKED_OUT')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, boat_id)
);

create table if not exists public.tournament_entry (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  team_id uuid references public.tournament_team(id) on delete set null,
  tournament_boat_id uuid references public.tournament_boat(id) on delete set null,
  entry_number text,
  registration_status text not null default 'PENDING'
    check (registration_status in ('PENDING','CONFIRMED','WAITLISTED','REJECTED','WITHDRAWN','CANCELLED')),
  eligibility_status text not null default 'UNKNOWN'
    check (eligibility_status in ('UNKNOWN','PENDING_REVIEW','ELIGIBLE','INELIGIBLE')),
  check_in_status text not null default 'NOT_CHECKED_IN'
    check (check_in_status in ('NOT_CHECKED_IN','CHECKED_IN','CHECKED_OUT')),
  competition_status text not null default 'NOT_STARTED'
    check (competition_status in ('NOT_STARTED','ACTIVE','PAUSED','FINISHED','DISQUALIFIED','WITHDRAWN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists tournament_entry_number_unique_active
  on public.tournament_entry (tournament_id, entry_number)
  where entry_number is not null and deleted_at is null;

create index if not exists tournament_entry_tournament_status_idx
  on public.tournament_entry (tournament_id, registration_status)
  where deleted_at is null;

create table if not exists public.tournament_entry_identity (
  id uuid primary key default gen_random_uuid(),
  tournament_entry_id uuid not null references public.tournament_entry(id) on delete cascade,
  identity_type text not null check (identity_type in ('REGISTERED_USER','GUEST','IMPORTED')),
  display_name text not null,
  email text,
  source_reference text,
  claimed_angler_id uuid references public.angler(id) on delete set null,
  claim_token_hash text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint tournament_entry_identity_name_not_blank check (length(btrim(display_name)) > 0),
  constraint registered_identity_has_angler check (
    identity_type <> 'REGISTERED_USER' or claimed_angler_id is not null
  )
);

create unique index if not exists tournament_entry_one_identity
  on public.tournament_entry_identity (tournament_entry_id);

create index if not exists tournament_entry_identity_claimed_idx
  on public.tournament_entry_identity (claimed_angler_id)
  where claimed_angler_id is not null;

create table if not exists public.tournament_team_member (
  id uuid primary key default gen_random_uuid(),
  tournament_team_id uuid not null references public.tournament_team(id) on delete cascade,
  tournament_entry_id uuid not null references public.tournament_entry(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('CAPTAIN','MEMBER','ALTERNATE')),
  created_at timestamptz not null default now(),
  unique (tournament_team_id, tournament_entry_id)
);

create table if not exists public.tournament_entry_identity_claim (
  id uuid primary key default gen_random_uuid(),
  tournament_entry_identity_id uuid not null references public.tournament_entry_identity(id) on delete cascade,
  angler_id uuid not null references public.angler(id) on delete restrict,
  claimed_at timestamptz not null default now(),
  source text not null default 'CLAIM_TOKEN',
  unique (tournament_entry_identity_id)
);

create or replace function public.claim_tournament_entry_identity(
  target_identity_id uuid,
  claim_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  identity_row public.tournament_entry_identity;
  expected_hash text;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into identity_row
    from public.tournament_entry_identity
   where id = target_identity_id
   for update;

  if identity_row.id is null then
    raise exception 'entry identity not found' using errcode = 'P0002';
  end if;

  if identity_row.claimed_angler_id is not null then
    if identity_row.claimed_angler_id = uid then
      return identity_row.tournament_entry_id;
    end if;
    raise exception 'entry identity already claimed' using errcode = '23505';
  end if;

  if identity_row.claim_token_hash is null or claim_token is null or length(claim_token) < 16 then
    raise exception 'valid claim token required' using errcode = '42501';
  end if;

  expected_hash := encode(digest(claim_token, 'sha256'), 'hex');
  if expected_hash <> identity_row.claim_token_hash then
    raise exception 'invalid claim token' using errcode = '42501';
  end if;

  update public.tournament_entry_identity
     set claimed_angler_id = uid,
         claimed_at = now(),
         claim_token_hash = null
   where id = identity_row.id;

  insert into public.tournament_entry_identity_claim (
    tournament_entry_identity_id, angler_id
  ) values (identity_row.id, uid);

  return identity_row.tournament_entry_id;
end;
$$;

revoke all on function public.claim_tournament_entry_identity(uuid, text) from public;
grant execute on function public.claim_tournament_entry_identity(uuid, text) to authenticated;

-- RLS helpers keep entry access readable and avoid trusting client-provided organization ids.
create or replace function public.can_read_tournament_entry(target_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.tournament_entry e
      left join public.tournament_entry_identity i on i.tournament_entry_id = e.id
     where e.id = target_entry_id
       and e.deleted_at is null
       and (
         public.is_organization_member(e.organization_id)
         or i.claimed_angler_id = auth.uid()
       )
  );
$$;

revoke all on function public.can_read_tournament_entry(uuid) from public;
grant execute on function public.can_read_tournament_entry(uuid) to authenticated;

alter table public.tournament_team enable row level security;
alter table public.boat enable row level security;
alter table public.tournament_boat enable row level security;
alter table public.tournament_entry enable row level security;
alter table public.tournament_entry_identity enable row level security;
alter table public.tournament_team_member enable row level security;
alter table public.tournament_entry_identity_claim enable row level security;

revoke all on public.tournament_team from anon;
revoke all on public.boat from anon;
revoke all on public.tournament_boat from anon;
revoke all on public.tournament_entry from anon;
revoke all on public.tournament_entry_identity from anon;
revoke all on public.tournament_team_member from anon;
revoke all on public.tournament_entry_identity_claim from anon;

grant select, insert, update on public.tournament_team to authenticated;
grant select, insert, update on public.boat to authenticated;
grant select, insert, update on public.tournament_boat to authenticated;
grant select, insert, update on public.tournament_entry to authenticated;
grant select, insert, update on public.tournament_entry_identity to authenticated;
grant select, insert, update on public.tournament_team_member to authenticated;
grant select on public.tournament_entry_identity_claim to authenticated;

create policy tournament_entry_read
  on public.tournament_entry for select to authenticated
  using (public.can_read_tournament_entry(id));
create policy tournament_entry_admin_write
  on public.tournament_entry for all to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_entry_identity_read
  on public.tournament_entry_identity for select to authenticated
  using (public.can_read_tournament_entry(tournament_entry_id));
create policy tournament_entry_identity_admin_insert
  on public.tournament_entry_identity for insert to authenticated
  with check (exists (
    select 1 from public.tournament_entry e
     where e.id = tournament_entry_id
       and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
  ));
create policy tournament_entry_identity_admin_update
  on public.tournament_entry_identity for update to authenticated
  using (exists (
    select 1 from public.tournament_entry e
     where e.id = tournament_entry_id
       and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
  ));

create policy tournament_team_member_read
  on public.tournament_team_member for select to authenticated
  using (public.can_read_tournament_entry(tournament_entry_id));
create policy tournament_team_member_admin_write
  on public.tournament_team_member for all to authenticated
  using (exists (
    select 1 from public.tournament_entry e
     where e.id = tournament_entry_id
       and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
  ))
  with check (exists (
    select 1 from public.tournament_entry e
     where e.id = tournament_entry_id
       and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
  ));

create policy tournament_team_org_read
  on public.tournament_team for select to authenticated
  using (public.is_organization_member(organization_id));
create policy tournament_team_org_write
  on public.tournament_team for all to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_boat_org_read
  on public.tournament_boat for select to authenticated
  using (public.is_organization_member(organization_id));
create policy tournament_boat_org_write
  on public.tournament_boat for all to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy boat_owner_or_org_read
  on public.boat for select to authenticated
  using (
    owner_angler_id = auth.uid()
    or (organization_id is not null and public.is_organization_member(organization_id))
  );
create policy boat_owner_or_org_write
  on public.boat for all to authenticated
  using (
    owner_angler_id = auth.uid()
    or (organization_id is not null and public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  )
  with check (
    owner_angler_id = auth.uid()
    or (organization_id is not null and public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  );

create policy tournament_entry_claim_audit_read
  on public.tournament_entry_identity_claim for select to authenticated
  using (
    angler_id = auth.uid()
    or exists (
      select 1
        from public.tournament_entry_identity i
        join public.tournament_entry e on e.id = i.tournament_entry_id
       where i.id = tournament_entry_identity_id
         and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
    )
  );

create trigger tg_boat_updated_at
before update on public.boat
for each row execute function public.tg_set_updated_at();
create trigger tg_tournament_boat_updated_at
before update on public.tournament_boat
for each row execute function public.tg_set_updated_at();
create trigger tg_tournament_entry_updated_at
before update on public.tournament_entry
for each row execute function public.tg_set_updated_at();

comment on table public.tournament_entry is
  'Participation in exactly one tournament. Registration, eligibility, check-in and competition states remain independent.';
comment on table public.tournament_entry_identity is
  'Registered, guest or imported competitor identity. Later account claiming links without replacing tournament history.';
comment on table public.tournament_team is 'Tournament-specific competitor grouping; intentionally separate from vessel identity.';
comment on table public.boat is 'Reusable vessel identity; tournament-specific state lives in tournament_boat.';
