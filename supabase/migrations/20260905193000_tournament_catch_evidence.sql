-- ARCH-001 / T-004 — tournament catch, evidence and offline idempotency.
-- Depends on T-003 registration. Original claims/evidence are preserved; conflicts are explicit.

create table if not exists public.tournament_catch (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  entry_id uuid not null references public.tournament_entry(id) on delete restrict,
  team_id uuid references public.tournament_team(id) on delete set null,
  tournament_boat_id uuid references public.tournament_boat(id) on delete set null,
  species_id text references public.species(id) on delete restrict,
  species_other text,
  caught_at_device timestamptz not null,
  submitted_at_device timestamptz,
  received_at_server timestamptz not null default now(),
  length_mm integer check (length_mm is null or length_mm > 0),
  weight_g integer check (weight_g is null or weight_g > 0),
  disposition text check (disposition is null or disposition in ('KEPT','RELEASED','UNKNOWN')),
  client_generated_id uuid not null,
  sync_status text not null default 'SYNCED'
    check (sync_status in ('PENDING','SYNCED','CONFLICT','FAILED')),
  status text not null default 'SUBMITTED'
    check (status in ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','DISQUALIFIED','PROTESTED','FINAL')),
  created_by uuid references public.angler(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_catch_species_present check (species_id is not null or nullif(btrim(species_other), '') is not null),
  constraint tournament_catch_client_id_unique unique (tournament_id, client_generated_id)
);

create index if not exists tournament_catch_tournament_status_idx
  on public.tournament_catch (tournament_id, status, received_at_server desc);
create index if not exists tournament_catch_entry_idx
  on public.tournament_catch (entry_id, caught_at_device desc);

create table if not exists public.catch_evidence (
  id uuid primary key default gen_random_uuid(),
  tournament_catch_id uuid not null references public.tournament_catch(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  evidence_type text not null check (evidence_type in (
    'PHOTO','VIDEO','GPS','MEASUREMENT','WEIGHT','DEVICE_METADATA','WITNESS','QR_VERIFICATION','WEIGHMASTER','CUSTOM'
  )),
  client_generated_id uuid not null,
  storage_path text,
  content_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  captured_at_device timestamptz,
  received_at_server timestamptz not null default now(),
  sync_status text not null default 'SYNCED'
    check (sync_status in ('PENDING','SYNCED','CONFLICT','FAILED')),
  created_by uuid references public.angler(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint catch_evidence_client_id_unique unique (tournament_id, client_generated_id)
);

create index if not exists catch_evidence_catch_idx
  on public.catch_evidence (tournament_catch_id, created_at);
create index if not exists catch_evidence_hash_idx
  on public.catch_evidence (content_sha256)
  where content_sha256 is not null;

create table if not exists public.tournament_sync_conflict (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  entity_type text not null check (entity_type in ('TOURNAMENT_CATCH','CATCH_EVIDENCE')),
  entity_id uuid not null,
  client_generated_id uuid not null,
  conflict_type text not null check (conflict_type in ('PAYLOAD_MISMATCH','OWNERSHIP_MISMATCH','STATE_MISMATCH','OTHER')),
  existing_snapshot jsonb not null,
  incoming_snapshot jsonb not null,
  status text not null default 'OPEN' check (status in ('OPEN','RESOLVED','IGNORED')),
  resolution_note text,
  resolved_by uuid references public.angler(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Immutable originals: downstream review/penalty records may change eligibility, but the factual claim/evidence row is not rewritten.
create or replace function public.tg_tournament_catch_immutable_claim()
returns trigger language plpgsql as $$
begin
  if new.tournament_id is distinct from old.tournament_id
     or new.organization_id is distinct from old.organization_id
     or new.entry_id is distinct from old.entry_id
     or new.team_id is distinct from old.team_id
     or new.tournament_boat_id is distinct from old.tournament_boat_id
     or new.species_id is distinct from old.species_id
     or new.species_other is distinct from old.species_other
     or new.caught_at_device is distinct from old.caught_at_device
     or new.length_mm is distinct from old.length_mm
     or new.weight_g is distinct from old.weight_g
     or new.disposition is distinct from old.disposition
     or new.client_generated_id is distinct from old.client_generated_id then
    raise exception 'original tournament catch claim is immutable; use review/penalty/correction records'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger tg_tournament_catch_immutable_claim
before update on public.tournament_catch
for each row execute function public.tg_tournament_catch_immutable_claim();

create or replace function public.tg_catch_evidence_immutable_original()
returns trigger language plpgsql as $$
begin
  if new.tournament_catch_id is distinct from old.tournament_catch_id
     or new.tournament_id is distinct from old.tournament_id
     or new.organization_id is distinct from old.organization_id
     or new.evidence_type is distinct from old.evidence_type
     or new.client_generated_id is distinct from old.client_generated_id
     or new.storage_path is distinct from old.storage_path
     or new.content_sha256 is distinct from old.content_sha256
     or new.metadata is distinct from old.metadata
     or new.captured_at_device is distinct from old.captured_at_device then
    raise exception 'original catch evidence is immutable; create a new evidence record'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger tg_catch_evidence_immutable_original
before update on public.catch_evidence
for each row execute function public.tg_catch_evidence_immutable_original();

-- Guard tournament/organization consistency across registration references.
create or replace function public.tg_validate_tournament_catch_links()
returns trigger language plpgsql as $$
declare
  entry_row public.tournament_entry;
  team_row public.tournament_team;
  boat_row public.tournament_boat;
begin
  select * into entry_row from public.tournament_entry where id = new.entry_id;
  if entry_row.id is null
     or entry_row.tournament_id <> new.tournament_id
     or entry_row.organization_id <> new.organization_id then
    raise exception 'catch entry does not belong to tournament/organization' using errcode = '23514';
  end if;

  if new.team_id is not null then
    select * into team_row from public.tournament_team where id = new.team_id;
    if team_row.id is null or team_row.tournament_id <> new.tournament_id or team_row.organization_id <> new.organization_id then
      raise exception 'catch team does not belong to tournament/organization' using errcode = '23514';
    end if;
  end if;

  if new.tournament_boat_id is not null then
    select * into boat_row from public.tournament_boat where id = new.tournament_boat_id;
    if boat_row.id is null or boat_row.tournament_id <> new.tournament_id or boat_row.organization_id <> new.organization_id then
      raise exception 'catch boat does not belong to tournament/organization' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

create trigger tg_validate_tournament_catch_links
before insert or update on public.tournament_catch
for each row execute function public.tg_validate_tournament_catch_links();

create or replace function public.tg_validate_catch_evidence_links()
returns trigger language plpgsql as $$
declare
  catch_row public.tournament_catch;
begin
  select * into catch_row from public.tournament_catch where id = new.tournament_catch_id;
  if catch_row.id is null
     or catch_row.tournament_id <> new.tournament_id
     or catch_row.organization_id <> new.organization_id then
    raise exception 'evidence catch does not belong to tournament/organization' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger tg_validate_catch_evidence_links
before insert or update on public.catch_evidence
for each row execute function public.tg_validate_catch_evidence_links();

-- Idempotent server ingestion. Same client id + same payload returns the existing row;
-- same id + materially different payload records a conflict and refuses silent overwrite.
create or replace function public.ingest_tournament_catch(
  p_tournament_id uuid,
  p_organization_id uuid,
  p_entry_id uuid,
  p_team_id uuid,
  p_tournament_boat_id uuid,
  p_species_id text,
  p_species_other text,
  p_caught_at_device timestamptz,
  p_submitted_at_device timestamptz,
  p_length_mm integer,
  p_weight_g integer,
  p_disposition text,
  p_client_generated_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_row public.tournament_catch;
  created_id uuid;
  uid uuid := auth.uid();
  incoming jsonb;
  existing jsonb;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not public.is_organization_member(p_organization_id) then
    raise exception 'organization access denied' using errcode = '42501';
  end if;

  incoming := jsonb_build_object(
    'entry_id', p_entry_id, 'team_id', p_team_id, 'tournament_boat_id', p_tournament_boat_id,
    'species_id', p_species_id, 'species_other', p_species_other, 'caught_at_device', p_caught_at_device,
    'length_mm', p_length_mm, 'weight_g', p_weight_g, 'disposition', p_disposition
  );

  select * into existing_row
    from public.tournament_catch
   where tournament_id = p_tournament_id and client_generated_id = p_client_generated_id
   for update;

  if existing_row.id is not null then
    existing := jsonb_build_object(
      'entry_id', existing_row.entry_id, 'team_id', existing_row.team_id, 'tournament_boat_id', existing_row.tournament_boat_id,
      'species_id', existing_row.species_id, 'species_other', existing_row.species_other, 'caught_at_device', existing_row.caught_at_device,
      'length_mm', existing_row.length_mm, 'weight_g', existing_row.weight_g, 'disposition', existing_row.disposition
    );
    if existing = incoming then return existing_row.id; end if;

    insert into public.tournament_sync_conflict (
      organization_id, tournament_id, entity_type, entity_id, client_generated_id,
      conflict_type, existing_snapshot, incoming_snapshot
    ) values (
      existing_row.organization_id, existing_row.tournament_id, 'TOURNAMENT_CATCH', existing_row.id,
      p_client_generated_id, 'PAYLOAD_MISMATCH', existing, incoming
    );

    update public.tournament_catch set sync_status = 'CONFLICT' where id = existing_row.id;
    raise exception 'idempotency conflict for tournament catch' using errcode = '23505';
  end if;

  insert into public.tournament_catch (
    tournament_id, organization_id, entry_id, team_id, tournament_boat_id, species_id, species_other,
    caught_at_device, submitted_at_device, length_mm, weight_g, disposition, client_generated_id,
    sync_status, created_by
  ) values (
    p_tournament_id, p_organization_id, p_entry_id, p_team_id, p_tournament_boat_id, p_species_id, p_species_other,
    p_caught_at_device, p_submitted_at_device, p_length_mm, p_weight_g, p_disposition, p_client_generated_id,
    'SYNCED', uid
  ) returning id into created_id;

  return created_id;
end $$;

revoke all on function public.ingest_tournament_catch(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,text,uuid) from public;
grant execute on function public.ingest_tournament_catch(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,text,uuid) to authenticated;

alter table public.tournament_catch enable row level security;
alter table public.catch_evidence enable row level security;
alter table public.tournament_sync_conflict enable row level security;

revoke all on public.tournament_catch from anon;
revoke all on public.catch_evidence from anon;
revoke all on public.tournament_sync_conflict from anon;

grant select, insert, update on public.tournament_catch to authenticated;
grant select, insert, update on public.catch_evidence to authenticated;
grant select, update on public.tournament_sync_conflict to authenticated;

create policy tournament_catch_read on public.tournament_catch
for select to authenticated using (
  public.is_organization_member(organization_id)
  or public.can_read_tournament_entry(entry_id)
);
create policy tournament_catch_insert on public.tournament_catch
for insert to authenticated with check (
  public.is_organization_member(organization_id)
  or public.can_read_tournament_entry(entry_id)
);
create policy tournament_catch_admin_update on public.tournament_catch
for update to authenticated using (
  public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
) with check (
  public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
);

create policy catch_evidence_read on public.catch_evidence
for select to authenticated using (
  exists (select 1 from public.tournament_catch c where c.id = tournament_catch_id and (
    public.is_organization_member(c.organization_id) or public.can_read_tournament_entry(c.entry_id)
  ))
);
create policy catch_evidence_insert on public.catch_evidence
for insert to authenticated with check (
  exists (select 1 from public.tournament_catch c where c.id = tournament_catch_id and (
    public.is_organization_member(c.organization_id) or public.can_read_tournament_entry(c.entry_id)
  ))
);

create policy tournament_sync_conflict_admin on public.tournament_sync_conflict
for all to authenticated using (
  public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
) with check (
  public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
);

create trigger tg_tournament_catch_updated_at
before update on public.tournament_catch
for each row execute function public.tg_set_updated_at();

comment on table public.tournament_catch is
  'Evidence-backed competition catch claim. Original factual claim is immutable; adjudication and penalties live in later records.';
comment on table public.catch_evidence is
  'Typed, immutable original evidence for one tournament catch. Public derivatives/projections are separate.';
comment on table public.tournament_sync_conflict is
  'Explicit offline/server reconciliation conflicts. Evidence is never silently overwritten.';