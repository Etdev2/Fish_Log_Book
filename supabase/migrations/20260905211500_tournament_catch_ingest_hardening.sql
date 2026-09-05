-- HARD-002 — make tournament catch ingest usable by participants and keep conflicts durable.
-- The original T-004 function inserted a conflict and then raised an exception, which rolls
-- back the entire PostgreSQL transaction (including the conflict row and CONFLICT status).
-- Keep the RPC signature stable: a mismatched replay returns the existing catch id with an
-- explicit persisted conflict/status for the caller to inspect. Original claim data is never overwritten.

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
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Resolve the tenant/tournament/entry relationship from server data before using the
  -- participant helper. This prevents client-supplied ids from widening authorization.
  if not exists (
    select 1
      from public.tournament_entry e
     where e.id = p_entry_id
       and e.tournament_id = p_tournament_id
       and e.organization_id = p_organization_id
       and e.deleted_at is null
  ) then
    raise exception 'catch entry does not belong to tournament/organization' using errcode = '23514';
  end if;

  -- Organizers/staff may ingest for their tournament; a normal participant may ingest only
  -- through an entry that can_read_tournament_entry resolves to their authenticated identity.
  if not (
    public.is_organization_member(p_organization_id)
    or public.can_read_tournament_entry(p_entry_id)
  ) then
    raise exception 'tournament catch access denied' using errcode = '42501';
  end if;

  incoming := jsonb_build_object(
    'entry_id', p_entry_id,
    'team_id', p_team_id,
    'tournament_boat_id', p_tournament_boat_id,
    'species_id', p_species_id,
    'species_other', p_species_other,
    'caught_at_device', p_caught_at_device,
    'length_mm', p_length_mm,
    'weight_g', p_weight_g,
    'disposition', p_disposition
  );

  select * into existing_row
    from public.tournament_catch
   where tournament_id = p_tournament_id
     and client_generated_id = p_client_generated_id
   for update;

  if existing_row.id is not null then
    existing := jsonb_build_object(
      'entry_id', existing_row.entry_id,
      'team_id', existing_row.team_id,
      'tournament_boat_id', existing_row.tournament_boat_id,
      'species_id', existing_row.species_id,
      'species_other', existing_row.species_other,
      'caught_at_device', existing_row.caught_at_device,
      'length_mm', existing_row.length_mm,
      'weight_g', existing_row.weight_g,
      'disposition', existing_row.disposition
    );

    -- Exact retry: idempotent success with no new row and no mutation of original evidence.
    if existing = incoming then
      return existing_row.id;
    end if;

    -- Mismatched retry: persist the conflict instead of raising after the write. Raising here
    -- would roll the conflict record back. Repeated delivery of the exact same mismatch is
    -- deduplicated, while a materially different incoming mismatch can still be preserved.
    if not exists (
      select 1
        from public.tournament_sync_conflict c
       where c.tournament_id = existing_row.tournament_id
         and c.entity_type = 'TOURNAMENT_CATCH'
         and c.entity_id = existing_row.id
         and c.client_generated_id = p_client_generated_id
         and c.conflict_type = 'PAYLOAD_MISMATCH'
         and c.status = 'OPEN'
         and c.existing_snapshot = existing
         and c.incoming_snapshot = incoming
    ) then
      insert into public.tournament_sync_conflict (
        organization_id,
        tournament_id,
        entity_type,
        entity_id,
        client_generated_id,
        conflict_type,
        existing_snapshot,
        incoming_snapshot
      ) values (
        existing_row.organization_id,
        existing_row.tournament_id,
        'TOURNAMENT_CATCH',
        existing_row.id,
        p_client_generated_id,
        'PAYLOAD_MISMATCH',
        existing,
        incoming
      );
    end if;

    update public.tournament_catch
       set sync_status = 'CONFLICT'
     where id = existing_row.id
       and sync_status is distinct from 'CONFLICT';

    return existing_row.id;
  end if;

  insert into public.tournament_catch (
    tournament_id,
    organization_id,
    entry_id,
    team_id,
    tournament_boat_id,
    species_id,
    species_other,
    caught_at_device,
    submitted_at_device,
    length_mm,
    weight_g,
    disposition,
    client_generated_id,
    sync_status,
    created_by
  ) values (
    p_tournament_id,
    p_organization_id,
    p_entry_id,
    p_team_id,
    p_tournament_boat_id,
    p_species_id,
    p_species_other,
    p_caught_at_device,
    p_submitted_at_device,
    p_length_mm,
    p_weight_g,
    p_disposition,
    p_client_generated_id,
    'SYNCED',
    uid
  ) returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.ingest_tournament_catch(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,text,uuid) from public;
grant execute on function public.ingest_tournament_catch(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,text,uuid) to authenticated;

comment on function public.ingest_tournament_catch(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,timestamptz,integer,integer,text,uuid) is
  'Idempotent tournament catch ingest for organizers or the participant owning the target entry. Payload mismatches persist explicit conflict state and never overwrite the original claim.';
