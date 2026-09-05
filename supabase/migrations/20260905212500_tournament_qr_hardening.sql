-- HARD-004 — authorize QR verification against server-side tournament context and surface reuse.
-- QR/Fair Play outcomes remain explainable signals; this function never changes scores.

create or replace function public.validate_qr_verification_scan(
  target_token_id uuid,
  target_entry_id uuid,
  target_catch_id uuid,
  device_scanned_at timestamptz,
  client_id uuid
)
returns table(scan_id uuid, result text, reason_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  token_row public.qr_verification_token;
  existing_row public.qr_verification_scan;
  catch_row public.tournament_catch;
  resolved_entry_id uuid := target_entry_id;
  resolved_result text;
  resolved_reason text;
  caller_authorized boolean := false;
  token_reused boolean := false;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into token_row
    from public.qr_verification_token
   where id = target_token_id;

  -- Unknown tokens have no trustworthy tenant context to persist. Return an explicit result
  -- rather than attempting an insert with null tournament/organization ids.
  if token_row.id is null then
    scan_id := null;
    result := 'FAIL';
    reason_code := 'QR_UNKNOWN';
    return next;
    return;
  end if;

  if target_entry_id is not null and not exists (
    select 1
      from public.tournament_entry e
     where e.id = target_entry_id
       and e.tournament_id = token_row.tournament_id
       and e.organization_id = token_row.organization_id
       and e.deleted_at is null
  ) then
    raise exception 'QR target entry does not belong to token tournament/organization' using errcode = '23514';
  end if;

  if target_catch_id is not null then
    select * into catch_row
      from public.tournament_catch
     where id = target_catch_id;

    if catch_row.id is null
       or catch_row.tournament_id <> token_row.tournament_id
       or catch_row.organization_id <> token_row.organization_id then
      raise exception 'QR target catch does not belong to token tournament/organization' using errcode = '23514';
    end if;

    if target_entry_id is not null and catch_row.entry_id <> target_entry_id then
      raise exception 'QR target catch does not belong to target entry' using errcode = '23514';
    end if;

    resolved_entry_id := catch_row.entry_id;
  end if;

  -- A targeted scan may be performed by tournament staff or the participant who owns the
  -- target entry/catch. An untargeted tournament-window scan may additionally be performed
  -- by any claimed participant in that same tournament.
  if target_entry_id is not null or target_catch_id is not null then
    caller_authorized :=
      public.is_organization_member(token_row.organization_id, array['OWNER','ADMIN','STAFF'])
      or (resolved_entry_id is not null and public.can_read_tournament_entry(resolved_entry_id));
  else
    caller_authorized :=
      public.is_organization_member(token_row.organization_id, array['OWNER','ADMIN','STAFF'])
      or exists (
        select 1
          from public.tournament_entry e
          join public.tournament_entry_identity i on i.tournament_entry_id = e.id
         where e.tournament_id = token_row.tournament_id
           and e.organization_id = token_row.organization_id
           and e.deleted_at is null
           and i.claimed_angler_id = uid
      );
  end if;

  if not caller_authorized then
    raise exception 'QR verification access denied' using errcode = '42501';
  end if;

  -- Client-generated scan ids are idempotency keys within a tournament. Exact replays return
  -- the original server result even if the token has since expired. Reusing the same client id
  -- for materially different scan payload is rejected without mutating the original record.
  select * into existing_row
    from public.qr_verification_scan
   where tournament_id = token_row.tournament_id
     and client_generated_id = client_id;

  if existing_row.id is not null then
    if existing_row.qr_token_id is not distinct from token_row.id
       and existing_row.tournament_entry_id is not distinct from resolved_entry_id
       and existing_row.tournament_catch_id is not distinct from target_catch_id
       and existing_row.scanned_at_device is not distinct from device_scanned_at then
      return query select existing_row.id, existing_row.server_result, existing_row.server_reason_code;
      return;
    end if;

    raise exception 'QR scan client id reused with different payload' using errcode = '23505';
  end if;

  if token_row.revoked_at is not null then
    resolved_result := 'FAIL';
    resolved_reason := 'QR_REVOKED';
  elsif now() < token_row.valid_from or now() > token_row.valid_until then
    resolved_result := 'FAIL';
    resolved_reason := 'QR_EXPIRED';
  else
    select exists (
      select 1
        from public.qr_verification_scan s
       where s.qr_token_id = token_row.id
         and s.client_generated_id <> client_id
         and s.server_result in ('PASS','WARNING')
    ) into token_reused;

    if token_reused then
      resolved_result := 'WARNING';
      resolved_reason := 'QR_REUSED';
    else
      resolved_result := 'PASS';
      resolved_reason := 'QR_VALID';
    end if;
  end if;

  insert into public.qr_verification_scan(
    tournament_id,
    organization_id,
    qr_token_id,
    tournament_entry_id,
    tournament_catch_id,
    scanned_at_device,
    received_at_server,
    server_result,
    server_reason_code,
    client_generated_id
  ) values (
    token_row.tournament_id,
    token_row.organization_id,
    token_row.id,
    resolved_entry_id,
    target_catch_id,
    device_scanned_at,
    now(),
    resolved_result,
    resolved_reason,
    client_id
  ) returning id into scan_id;

  if resolved_reason = 'QR_EXPIRED' then
    insert into public.fair_play_signal(
      tournament_id,
      organization_id,
      tournament_catch_id,
      tournament_entry_id,
      code,
      severity,
      source,
      explanation,
      payload
    ) values (
      token_row.tournament_id,
      token_row.organization_id,
      target_catch_id,
      resolved_entry_id,
      'QR_EXPIRED',
      'WARNING',
      'SERVER',
      'QR token was outside its server-valid time window.',
      jsonb_build_object('token_id', token_row.id, 'scan_id', scan_id)
    );
  elsif resolved_reason = 'QR_REUSED' then
    insert into public.fair_play_signal(
      tournament_id,
      organization_id,
      tournament_catch_id,
      tournament_entry_id,
      verification_session_id,
      code,
      severity,
      source,
      explanation,
      payload
    ) values (
      token_row.tournament_id,
      token_row.organization_id,
      target_catch_id,
      resolved_entry_id,
      token_row.verification_session_id,
      'QR_REUSED',
      'WARNING',
      'SERVER',
      'QR token was observed in more than one distinct scan. This is a review signal only and does not alter scoring.',
      jsonb_build_object('token_id', token_row.id, 'scan_id', scan_id)
    );
  end if;

  result := resolved_result;
  reason_code := resolved_reason;
  return next;
end;
$$;

revoke all on function public.validate_qr_verification_scan(uuid,uuid,uuid,timestamptz,uuid) from public;
grant execute on function public.validate_qr_verification_scan(uuid,uuid,uuid,timestamptz,uuid) to authenticated;

comment on function public.validate_qr_verification_scan(uuid,uuid,uuid,timestamptz,uuid) is
  'Authorized, idempotent tournament QR validation. Unknown/revoked/expired/reused outcomes are explicit; Fair Play warnings never silently change scoring.';
