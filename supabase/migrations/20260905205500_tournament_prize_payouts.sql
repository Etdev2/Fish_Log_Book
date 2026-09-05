-- PAY-004 — prize pools and payout instructions.
-- Depends semantically on PAY-001 and structurally on T-007 final_result_set.
-- Scoring never initiates money movement. Human approval is required before provider execution.

create table if not exists public.prize_pool (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  name text not null,
  currency text not null,
  pool_type text not null default 'PRIMARY' check (pool_type in ('PRIMARY','SIDE_POT','JACKPOT','CUSTOM')),
  funding_status text not null default 'UNFUNDED' check (funding_status in ('UNFUNDED','PARTIALLY_FUNDED','FUNDED','LOCKED','SETTLED','CANCELLED')),
  target_amount_minor bigint check (target_amount_minor is null or target_amount_minor >= 0),
  funded_amount_minor bigint not null default 0 check (funded_amount_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, name)
);

create table if not exists public.prize_pool_entry (
  id uuid primary key default gen_random_uuid(),
  prize_pool_id uuid not null references public.prize_pool(id) on delete cascade,
  tournament_entry_id uuid not null references public.tournament_entry(id) on delete cascade,
  participation_status text not null default 'ACTIVE' check (participation_status in ('ACTIVE','WITHDRAWN','DISQUALIFIED','REFUNDED')),
  contribution_amount_minor bigint not null default 0 check (contribution_amount_minor >= 0),
  funding_reference_type text,
  funding_reference_id uuid,
  created_at timestamptz not null default now(),
  unique (prize_pool_id, tournament_entry_id)
);

create table if not exists public.payout_instruction (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  prize_pool_id uuid not null references public.prize_pool(id) on delete restrict,
  final_result_set_id uuid not null references public.final_result_set(id) on delete restrict,
  tournament_entry_id uuid references public.tournament_entry(id) on delete restrict,
  tournament_team_id uuid references public.tournament_team(id) on delete restrict,
  tournament_boat_id uuid references public.tournament_boat(id) on delete restrict,
  rank integer not null check (rank > 0),
  currency text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','SUBMITTED','CONFIRMED','FAILED','CANCELLED','REVERSED')),
  calculation_detail jsonb not null default '{}'::jsonb,
  approved_by uuid references public.angler(id) on delete restrict,
  approved_at timestamptz,
  approval_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_instruction_one_recipient check (
    ((tournament_entry_id is not null)::int +
     (tournament_team_id is not null)::int +
     (tournament_boat_id is not null)::int) = 1
  ),
  constraint payout_instruction_approval_complete check (
    status = 'DRAFT' or (approved_by is not null and approved_at is not null and length(btrim(coalesce(approval_reason,''))) > 0)
  )
);

create table if not exists public.payout (
  id uuid primary key default gen_random_uuid(),
  payout_instruction_id uuid not null references public.payout_instruction(id) on delete restrict,
  provider text not null,
  provider_payout_id text,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED','PROCESSING','CONFIRMED','FAILED','CANCELLED','REVERSED')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null,
  destination_reference text,
  failure_code text,
  failure_message text,
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (provider, provider_payout_id)
);

create table if not exists public.payout_event (
  id uuid primary key default gen_random_uuid(),
  payout_instruction_id uuid not null references public.payout_instruction(id) on delete cascade,
  payout_id uuid references public.payout(id) on delete set null,
  event_type text not null,
  actor_angler_id uuid references public.angler(id) on delete set null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists prize_pool_tournament_idx on public.prize_pool (tournament_id);
create index if not exists payout_instruction_tournament_status_idx on public.payout_instruction (tournament_id, status);
create index if not exists payout_instruction_final_result_idx on public.payout_instruction (final_result_set_id);

alter table public.prize_pool enable row level security;
alter table public.prize_pool_entry enable row level security;
alter table public.payout_instruction enable row level security;
alter table public.payout enable row level security;
alter table public.payout_event enable row level security;

revoke all on public.prize_pool, public.prize_pool_entry, public.payout_instruction, public.payout, public.payout_event from anon;
grant select on public.prize_pool, public.prize_pool_entry, public.payout_instruction, public.payout, public.payout_event to authenticated;
grant insert, update on public.prize_pool, public.prize_pool_entry, public.payout_instruction to authenticated;

create policy prize_pool_org_read on public.prize_pool
for select to authenticated using (public.is_organization_member(organization_id));
create policy prize_pool_finance_write on public.prize_pool
for all to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy prize_pool_entry_read on public.prize_pool_entry
for select to authenticated using (exists (
  select 1 from public.prize_pool pp where pp.id = prize_pool_id and public.is_organization_member(pp.organization_id)
));
create policy prize_pool_entry_write on public.prize_pool_entry
for all to authenticated using (exists (
  select 1 from public.prize_pool pp where pp.id = prize_pool_id and public.is_organization_member(pp.organization_id, array['OWNER','ADMIN'])
)) with check (exists (
  select 1 from public.prize_pool pp where pp.id = prize_pool_id and public.is_organization_member(pp.organization_id, array['OWNER','ADMIN'])
));

create policy payout_instruction_finance_read on public.payout_instruction
for select to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN']));
create policy payout_instruction_finance_write on public.payout_instruction
for all to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create policy payout_finance_read on public.payout
for select to authenticated using (exists (
  select 1 from public.payout_instruction pi where pi.id = payout_instruction_id and public.is_organization_member(pi.organization_id, array['OWNER','ADMIN'])
));
create policy payout_event_finance_read on public.payout_event
for select to authenticated using (exists (
  select 1 from public.payout_instruction pi where pi.id = payout_instruction_id and public.is_organization_member(pi.organization_id, array['OWNER','ADMIN'])
));

create trigger tg_prize_pool_updated_at before update on public.prize_pool
for each row execute function public.tg_set_updated_at();
create trigger tg_payout_instruction_updated_at before update on public.payout_instruction
for each row execute function public.tg_set_updated_at();

comment on table public.prize_pool is 'Competition prize funding kept separate from organizer revenue and payment provider state.';
comment on table public.payout_instruction is 'Draft payout derived from an exact FinalResultSet. Human approval is required before submission.';
comment on table public.payout is 'Provider execution record. Crypto payout is a separately gated provider capability and is not implied by crypto collection.';