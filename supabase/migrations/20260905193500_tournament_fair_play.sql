-- ARCH-001 / T-005 — explainable Fair Play, verification checks and QR sessions.
-- Signals are evidence for policy/human review and never silently change scoring.

create table if not exists public.verification_session (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_entry_id uuid references public.tournament_entry(id) on delete cascade,
  tournament_catch_id uuid references public.tournament_catch(id) on delete cascade,
  purpose text not null check (purpose in ('TOURNAMENT_WINDOW','ENTRY_IDENTITY','BOAT_IDENTITY','CHECK_IN','WEIGH_STATION','CATCH_SESSION')),
  policy_version_id uuid not null references public.tournament_verification_policy_version(id) on delete restrict,
  status text not null default 'OPEN' check (status in ('OPEN','COMPLETE','EXPIRED','REVOKED')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint verification_session_target_present check (
    tournament_entry_id is not null or tournament_catch_id is not null or purpose = 'TOURNAMENT_WINDOW'
  )
);

create table if not exists public.verification_check (
  id uuid primary key default gen_random_uuid(),
  verification_session_id uuid not null references public.verification_session(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_catch_id uuid references public.tournament_catch(id) on delete cascade,
  type text not null check (type in (
    'PHOTO_PRESENT','PHOTO_DUPLICATE','GPS_BOUNDARY','GPS_ACCURACY','TIME_WINDOW','QR_TOKEN',
    'ENTRY_ACTIVE','BOAT_VALID','MEASUREMENT_PRESENT','WEIGHT_PRESENT','DEVICE_METADATA','WEIGHMASTER_CONFIRMATION'
  )),
  result text not null check (result in ('PASS','FAIL','WARNING','UNKNOWN','NOT_REQUIRED')),
  source text not null check (source in ('MACHINE','HUMAN','OFFLINE_DEVICE','SERVER')),
  reason_code text not null,
  reason_detail text,
  evidence_ids uuid[] not null default '{}',
  checked_by uuid references public.angler(id) on delete set null,
  checked_at timestamptz not null default now()
);

create table if not exists public.fair_play_signal (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_catch_id uuid references public.tournament_catch(id) on delete cascade,
  tournament_entry_id uuid references public.tournament_entry(id) on delete cascade,
  verification_session_id uuid references public.verification_session(id) on delete cascade,
  code text not null check (code in (
    'QR_EXPIRED','QR_REUSED','GPS_OUTSIDE_BOUNDARY','GPS_LOW_ACCURACY','PHOTO_DUPLICATE',
    'TIMESTAMP_MISMATCH','UNREGISTERED_ENTRY','DEVICE_TIME_ANOMALY','MISSING_REQUIRED_EVIDENCE'
  )),
  severity text not null check (severity in ('INFO','WARNING','BLOCKING_REVIEW')),
  source text not null check (source in ('MACHINE','HUMAN','OFFLINE_DEVICE','SERVER')),
  explanation text not null,
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.angler(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.qr_verification_token (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  verification_session_id uuid references public.verification_session(id) on delete cascade,
  purpose text not null check (purpose in ('TOURNAMENT_WINDOW','ENTRY_IDENTITY','BOAT_IDENTITY','CHECK_IN','WEIGH_STATION','CATCH_SESSION')),
  nonce_hash text not null,
  key_version integer not null check (key_version > 0),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint qr_token_time_order check (valid_until > valid_from),
  unique (tournament_id, nonce_hash)
);

create table if not exists public.qr_verification_scan (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  qr_token_id uuid references public.qr_verification_token(id) on delete set null,
  tournament_entry_id uuid references public.tournament_entry(id) on delete set null,
  tournament_catch_id uuid references public.tournament_catch(id) on delete set null,
  scanned_at_device timestamptz not null,
  received_at_server timestamptz,
  offline_verified boolean not null default false,
  server_result text check (server_result in ('PASS','FAIL','WARNING','UNKNOWN')),
  server_reason_code text,
  client_generated_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, client_generated_id)
);

create index if not exists verification_check_catch_idx on public.verification_check(tournament_catch_id, type);
create index if not exists fair_play_signal_open_idx on public.fair_play_signal(tournament_id, code) where resolved_at is null;
create index if not exists qr_verification_token_validity_idx on public.qr_verification_token(tournament_id, valid_from, valid_until) where revoked_at is null;

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
  token_row public.qr_verification_token;
  existing_row public.qr_verification_scan;
  resolved_result text;
  resolved_reason text;
begin
  select * into token_row from public.qr_verification_token where id = target_token_id;
  if token_row.id is null then
    resolved_result := 'FAIL';
    resolved_reason := 'QR_UNKNOWN';
  elsif token_row.revoked_at is not null then
    resolved_result := 'FAIL';
    resolved_reason := 'QR_REVOKED';
  elsif now() < token_row.valid_from or now() > token_row.valid_until then
    resolved_result := 'FAIL';
    resolved_reason := 'QR_EXPIRED';
  else
    resolved_result := 'PASS';
    resolved_reason := 'QR_VALID';
  end if;

  select * into existing_row
    from public.qr_verification_scan
   where tournament_id = token_row.tournament_id
     and client_generated_id = client_id;

  if existing_row.id is not null then
    return query select existing_row.id, existing_row.server_result, existing_row.server_reason_code;
    return;
  end if;

  insert into public.qr_verification_scan(
    tournament_id, organization_id, qr_token_id, tournament_entry_id, tournament_catch_id,
    scanned_at_device, received_at_server, server_result, server_reason_code, client_generated_id
  ) values (
    token_row.tournament_id, token_row.organization_id, token_row.id, target_entry_id, target_catch_id,
    device_scanned_at, now(), resolved_result, resolved_reason, client_id
  ) returning id into scan_id;

  if resolved_reason = 'QR_EXPIRED' then
    insert into public.fair_play_signal(
      tournament_id, organization_id, tournament_catch_id, tournament_entry_id,
      code, severity, source, explanation, payload
    ) values (
      token_row.tournament_id, token_row.organization_id, target_catch_id, target_entry_id,
      'QR_EXPIRED','WARNING','SERVER','QR token was outside its server-valid time window.',
      jsonb_build_object('token_id', token_row.id)
    );
  end if;

  result := resolved_result;
  reason_code := resolved_reason;
  return next;
end;
$$;

revoke all on function public.validate_qr_verification_scan(uuid,uuid,uuid,timestamptz,uuid) from public;
grant execute on function public.validate_qr_verification_scan(uuid,uuid,uuid,timestamptz,uuid) to authenticated;

-- Prevent evidence interpretation records from being rewritten; corrections are new checks/signals.
create or replace function public.tg_immutable_verification_record()
returns trigger language plpgsql as $$
begin
  raise exception 'verification records are append-only; create a new check/signal instead' using errcode = 'check_violation';
end;
$$;

create trigger tg_verification_check_immutable
before update or delete on public.verification_check
for each row execute function public.tg_immutable_verification_record();

alter table public.verification_session enable row level security;
alter table public.verification_check enable row level security;
alter table public.fair_play_signal enable row level security;
alter table public.qr_verification_token enable row level security;
alter table public.qr_verification_scan enable row level security;

revoke all on public.verification_session from anon;
revoke all on public.verification_check from anon;
revoke all on public.fair_play_signal from anon;
revoke all on public.qr_verification_token from anon;
revoke all on public.qr_verification_scan from anon;

grant select, insert, update on public.verification_session to authenticated;
grant select, insert on public.verification_check to authenticated;
grant select, insert, update on public.fair_play_signal to authenticated;
grant select, insert, update on public.qr_verification_token to authenticated;
grant select, insert, update on public.qr_verification_scan to authenticated;

create policy verification_session_org_access on public.verification_session
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy verification_check_org_access on public.verification_check
for select to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));
create policy verification_check_org_insert on public.verification_check
for insert to authenticated
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy fair_play_signal_org_access on public.fair_play_signal
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy qr_token_org_access on public.qr_verification_token
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy qr_scan_org_or_entry_read on public.qr_verification_scan
for select to authenticated
using (
  public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
  or (tournament_entry_id is not null and public.can_read_tournament_entry(tournament_entry_id))
);

comment on table public.fair_play_signal is
  'Explainable integrity signal. It never changes scores by itself; policy and human adjudication decide consequences.';
comment on table public.verification_check is
  'Discrete PASS/FAIL/WARNING/UNKNOWN/NOT_REQUIRED checks tied to a frozen verification policy version.';
comment on table public.qr_verification_token is
  'Server-issued opaque/signed-token metadata. No personal, financial or secret-key material is stored here.';