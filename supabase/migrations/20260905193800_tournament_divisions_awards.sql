-- HARD-006 / TEST-001 discovery — canonical tournament divisions and award categories.
-- ARCH-001 requires divisions and awards as separate concepts. T-007 scoring already
-- references both tables, but the stacked implementation never created them on main.

create table if not exists public.tournament_division (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_division_code_not_blank check (length(btrim(code)) > 0),
  constraint tournament_division_name_not_blank check (length(btrim(name)) > 0),
  unique (tournament_id, code)
);

create table if not exists public.tournament_award_category (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_award_category_code_not_blank check (length(btrim(code)) > 0),
  constraint tournament_award_category_name_not_blank check (length(btrim(name)) > 0),
  unique (tournament_id, code)
);

-- An entry may participate in one or more permitted divisions. Awards remain separate and
-- are determined from final results rather than assigned to the entry as if they were divisions.
create table if not exists public.tournament_entry_division (
  tournament_entry_id uuid not null references public.tournament_entry(id) on delete cascade,
  tournament_division_id uuid not null references public.tournament_division(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tournament_entry_id, tournament_division_id)
);

create index if not exists tournament_division_tournament_active_idx
  on public.tournament_division (tournament_id, is_active);
create index if not exists tournament_award_category_tournament_active_idx
  on public.tournament_award_category (tournament_id, is_active);

create or replace function public.tg_validate_entry_division_tenant()
returns trigger language plpgsql as $$
declare
  entry_row public.tournament_entry;
  division_row public.tournament_division;
begin
  select * into entry_row from public.tournament_entry where id = new.tournament_entry_id;
  select * into division_row from public.tournament_division where id = new.tournament_division_id;

  if entry_row.id is null or division_row.id is null
     or entry_row.tournament_id <> division_row.tournament_id
     or entry_row.organization_id <> division_row.organization_id then
    raise exception 'entry and division must belong to the same tournament and organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tg_tournament_entry_division_tenant
before insert or update on public.tournament_entry_division
for each row execute function public.tg_validate_entry_division_tenant();

alter table public.tournament_division enable row level security;
alter table public.tournament_award_category enable row level security;
alter table public.tournament_entry_division enable row level security;

revoke all on public.tournament_division, public.tournament_award_category, public.tournament_entry_division from anon;
grant select, insert, update on public.tournament_division, public.tournament_award_category to authenticated;
grant select, insert, delete on public.tournament_entry_division to authenticated;

create policy tournament_division_org_read on public.tournament_division
for select to authenticated using (public.is_organization_member(organization_id));
create policy tournament_division_admin_write on public.tournament_division
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_award_category_org_read on public.tournament_award_category
for select to authenticated using (public.is_organization_member(organization_id));
create policy tournament_award_category_admin_write on public.tournament_award_category
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_entry_division_org_read on public.tournament_entry_division
for select to authenticated using (exists (
  select 1 from public.tournament_entry e
  where e.id = tournament_entry_id and public.is_organization_member(e.organization_id)
));
create policy tournament_entry_division_admin_write on public.tournament_entry_division
for all to authenticated using (exists (
  select 1 from public.tournament_entry e
  where e.id = tournament_entry_id and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
)) with check (exists (
  select 1 from public.tournament_entry e
  where e.id = tournament_entry_id and public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
));

create trigger tg_tournament_division_updated_at
before update on public.tournament_division
for each row execute function public.tg_set_updated_at();

create trigger tg_tournament_award_category_updated_at
before update on public.tournament_award_category
for each row execute function public.tg_set_updated_at();

comment on table public.tournament_division is 'Competitive classification such as Pro, Amateur, Junior, Kayak, or Private Boat.';
comment on table public.tournament_award_category is 'Result/prize category separate from competitive division; used by official final result awards.';
