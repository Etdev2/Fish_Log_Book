-- HARD-003 — idempotent tournament evidence ingest with durable conflicts.
-- Original evidence remains immutable. Exact retries reuse the existing evidence row;
-- mismatched retries persist reconciliation state instead of collapsing into a generic 409.

create or replace function public.ingest_catch_evidence(
  p_tournament_catch_id uuid,
  p_tournament_id uuid,
  p_organization_id uuid,
  p_evidence_type text,
  p_client_generated_id uuid,
  p_storage_path text,
  p_content_sha256 text,
  p_metadata jsonb,
  p_captured_at_device timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_catch public.tournament_catch;
  existing_row public.catch_evidence;
  created_id uuid;
  uid uuid := auth.uid();
  incoming jsonb;
  existing jsonb;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into parent_catch
    from public.tournament_catch
   where id = p_tournament_catch_id;

  if parent_catch.id is null
     or parent_catch.tournament_id <> p_tournament_id
     or parent_catch.organization_id <> p_organization_id then
    raise exception 'evidence catch does not belong to tournament/organization' using errcode = '23514';
  end if;

  if not (
    public.is_organization_member(p_organization_id)
    or public.can_read_tournament_entry(parent_catch.entry_id)
  ) then
    raise exception 'catch evidence access denied' using errcode = '42501';
  end if;

  incoming := jsonb_build_object(
    'tournament_catch_id', p_tournament_catch_id,
    'evidence_type', p_evidence_type,
    'storage_path', p_storage_path,
    'content_sha256', p_content_sha256,
    'metadata', coalesce(p_metadata, '{}'::jsonb),
    'captured_at_device', p_captured_at_device
  );

  select * into existing_row
    from public.catch_evidence
   where tournament_id = p_tournament_id
     and client_generated_id = p_client_generated_id
   for update;

  if existing_row.id is not null then
    existing := jsonb_build_object(
      'tournament_catch_id', existing_row.tournament_catch_id,
      'evidence_type', existing_row.evidence_type,
      'storage_path', existing_row.storage_path,
      'content_sha256', existing_row.content_sha256,
      'metadata', existing_row.metadata,
      'captured_at_device', existing_row.captured_at_device
    );

    if existing = incoming then
      return existing_row.id;
    end if;

    if not exists (
      select 1
        from public.tournament_sync_conflict c
       where c.tournament_id = existing_row.tournament_id
         and c.entity_type = 'CATCH_EVIDENCE'
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
        'CATCH_EVIDENCE',
        existing_row.id,
        p_client_generated_id,
        'PAYLOAD_MISMATCH',
        existing,
        incoming
      );
    end if;

    update public.catch_evidence
       set sync_status = 'CONFLICT'
     where id = existing_row.id
       and sync_status is distinct from 'CONFLICT';

    return existing_row.id;
  end if;

  insert into public.catch_evidence (
    tournament_catch_id,
    tournament_id,
    organization_id,
    evidence_type,
    client_generated_id,
    storage_path,
    content_sha256,
    metadata,
    captured_at_device,
    sync_status,
    created_by
  ) values (
    p_tournament_catch_id,
    p_tournament_id,
    p_organization_id,
    p_evidence_type,
    p_client_generated_id,
    p_storage_path,
    p_content_sha256,
    coalesce(p_metadata, '{}'::jsonb),
    p_captured_at_device,
    'SYNCED',
    uid
  ) returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.ingest_catch_evidence(uuid,uuid,uuid,text,uuid,text,text,jsonb,timestamptz) from public;
grant execute on function public.ingest_catch_evidence(uuid,uuid,uuid,text,uuid,text,text,jsonb,timestamptz) to authenticated;

comment on function public.ingest_catch_evidence(uuid,uuid,uuid,text,uuid,text,text,jsonb,timestamptz) is
  'Idempotent immutable evidence ingest for organizers or the participant owning the parent catch entry. Mismatched retries persist explicit reconciliation conflicts.';
