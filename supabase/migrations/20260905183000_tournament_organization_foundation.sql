-- ARCH-001 / T-001 — canonical tournament tenancy foundation
-- Every tournament-capable workspace is an organization, including PERSONAL workspaces.
-- Additive only: existing Fish Log Book / Boat Games tables are untouched.

create table if not exists public.organization (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('PERSONAL','CLUB','BUSINESS','NONPROFIT','ENTERPRISE','PLATFORM')),
  name text not null,
  slug text,
  created_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint organization_name_not_blank check (length(btrim(name)) > 0)
);

create unique index if not exists organization_slug_unique_active
  on public.organization (lower(slug))
  where slug is not null and deleted_at is null;

create unique index if not exists organization_one_personal_per_creator
  on public.organization (created_by)
  where kind = 'PERSONAL' and deleted_at is null;

create table if not exists public.organization_member (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  angler_id uuid not null references public.angler(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','STAFF','FINANCE')),
  status text not null default 'ACTIVE' check (status in ('INVITED','ACTIVE','SUSPENDED','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists organization_member_one_active_membership
  on public.organization_member (organization_id, angler_id)
  where deleted_at is null;

create index if not exists organization_member_angler_lookup
  on public.organization_member (angler_id, organization_id)
  where deleted_at is null and status = 'ACTIVE';

create table if not exists public.organization_invitation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  invited_email text,
  invited_angler_id uuid references public.angler(id) on delete set null,
  role text not null check (role in ('ADMIN','STAFF','FINANCE')),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','REVOKED','EXPIRED')),
  token_hash text,
  expires_at timestamptz,
  invited_by uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint organization_invitation_has_target check (
    invited_email is not null or invited_angler_id is not null
  )
);

create index if not exists organization_invitation_org_status
  on public.organization_invitation (organization_id, status);

create table if not exists public.organization_feature (
  organization_id uuid not null references public.organization(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, feature_key),
  constraint organization_feature_key_not_blank check (length(btrim(feature_key)) > 0)
);

-- Membership lookup is SECURITY DEFINER to avoid recursive RLS evaluation on
-- organization_member. It returns only authorization truth, not member data.
create or replace function public.is_organization_member(
  target_organization_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.organization_member m
     where m.organization_id = target_organization_id
       and m.angler_id = auth.uid()
       and m.status = 'ACTIVE'
       and m.deleted_at is null
       and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;

revoke all on function public.is_organization_member(uuid, text[]) from public;
grant execute on function public.is_organization_member(uuid, text[]) to authenticated;

-- Idempotently returns/creates the authenticated user's PERSONAL organization.
-- This is intentionally explicit instead of a trigger on auth.users so onboarding can
-- call it transactionally when tournament functionality is first used.
create or replace function public.ensure_personal_organization()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select o.id into org_id
    from public.organization o
   where o.kind = 'PERSONAL'
     and o.created_by = uid
     and o.deleted_at is null
   limit 1;

  if org_id is not null then
    return org_id;
  end if;

  insert into public.organization (kind, name, created_by)
  values ('PERSONAL', 'My Tournaments', uid)
  returning id into org_id;

  insert into public.organization_member (organization_id, angler_id, role, status)
  values (org_id, uid, 'OWNER', 'ACTIVE');

  return org_id;
exception
  when unique_violation then
    -- Concurrent first-use calls converge on the same personal organization.
    select o.id into org_id
      from public.organization o
     where o.kind = 'PERSONAL'
       and o.created_by = uid
       and o.deleted_at is null
     limit 1;
    return org_id;
end;
$$;

revoke all on function public.ensure_personal_organization() from public;
grant execute on function public.ensure_personal_organization() to authenticated;

alter table public.organization enable row level security;
alter table public.organization_member enable row level security;
alter table public.organization_invitation enable row level security;
alter table public.organization_feature enable row level security;

revoke all on public.organization from anon;
revoke all on public.organization_member from anon;
revoke all on public.organization_invitation from anon;
revoke all on public.organization_feature from anon;

grant select, insert, update on public.organization to authenticated;
grant select, insert, update on public.organization_member to authenticated;
grant select, insert, update on public.organization_invitation to authenticated;
grant select, insert, update, delete on public.organization_feature to authenticated;

create policy organization_select_member
  on public.organization for select to authenticated
  using (public.is_organization_member(id));

create policy organization_insert_self
  on public.organization for insert to authenticated
  with check (created_by = auth.uid());

create policy organization_update_admin
  on public.organization for update to authenticated
  using (public.is_organization_member(id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(id, array['OWNER','ADMIN']));

create policy organization_member_select_same_org
  on public.organization_member for select to authenticated
  using (public.is_organization_member(organization_id));

create policy organization_member_insert_admin
  on public.organization_member for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy organization_member_update_admin
  on public.organization_member for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy organization_invitation_select_admin
  on public.organization_invitation for select to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy organization_invitation_insert_admin
  on public.organization_invitation for insert to authenticated
  with check (
    invited_by = auth.uid()
    and public.is_organization_member(organization_id, array['OWNER','ADMIN'])
  );

create policy organization_invitation_update_admin
  on public.organization_invitation for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy organization_feature_select_member
  on public.organization_feature for select to authenticated
  using (public.is_organization_member(organization_id));

create policy organization_feature_write_admin
  on public.organization_feature for all to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create trigger tg_organization_updated_at
before update on public.organization
for each row execute function public.tg_set_updated_at();

create trigger tg_organization_member_updated_at
before update on public.organization_member
for each row execute function public.tg_set_updated_at();

comment on table public.organization is
  'ARCH-001 canonical tenant. PERSONAL and B2B tournaments share this ownership boundary.';
comment on table public.organization_member is
  'Tenant authority only. Tournament participation is modeled separately by TournamentEntry.';
