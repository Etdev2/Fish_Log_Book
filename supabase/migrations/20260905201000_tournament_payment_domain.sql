-- PAY-001 — provider-neutral order/payment domain.
-- Competition state and payment state are intentionally separate. No provider SDK here.

create table if not exists public.tournament_order (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_id uuid references public.tournament(id) on delete set null,
  purchaser_angler_id uuid references public.angler(id) on delete set null,
  currency text not null,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_PAYMENT','PAID','PARTIALLY_REFUNDED','REFUNDED','CANCELLED','FAILED')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.tournament_order_item (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.tournament_order(id) on delete cascade,
  item_type text not null check (item_type in ('TOURNAMENT_ENTRY','TEAM_ENTRY','BOAT_ENTRY','MEMBERSHIP','LATE_FEE','SIDE_POT','JACKPOT','MERCHANDISE','DONATION','CUSTOM')),
  reference_id uuid,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_amount_minor bigint not null check (unit_amount_minor >= 0),
  total_amount_minor bigint not null check (total_amount_minor >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  order_id uuid not null references public.tournament_order(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  currency text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  status text not null default 'PENDING' check (status in ('PENDING','REQUIRES_ACTION','AUTHORIZED','CONFIRMED','FAILED','CANCELLED','PARTIALLY_REFUNDED','REFUNDED')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create table if not exists public.payment_attempt (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  provider_attempt_id text,
  status text not null check (status in ('CREATED','REQUIRES_ACTION','PROCESSING','SUCCEEDED','FAILED','CANCELLED')),
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  unique (payment_id, attempt_number)
);

create table if not exists public.payment_allocation (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment(id) on delete cascade,
  order_item_id uuid not null references public.tournament_order_item(id) on delete cascade,
  amount_minor bigint not null check (amount_minor >= 0),
  allocation_kind text not null default 'ORDER_ITEM' check (allocation_kind in ('ORDER_ITEM','PLATFORM_FEE','PRIZE_POOL','ORGANIZER_REVENUE')),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_refund (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment(id) on delete restrict,
  provider_refund_id text,
  amount_minor bigint not null check (amount_minor > 0),
  reason text,
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','FAILED','CANCELLED')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (provider_refund_id)
);

create table if not exists public.platform_fee (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment(id) on delete restrict,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null,
  fee_type text not null default 'PLATFORM',
  created_at timestamptz not null default now()
);

create table if not exists public.financial_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  actor_angler_id uuid references public.angler(id) on delete set null,
  unique (organization_id, idempotency_key)
);

create index if not exists tournament_order_org_status_idx on public.tournament_order (organization_id, status);
create index if not exists payment_order_idx on public.payment (order_id);
create index if not exists financial_event_aggregate_idx on public.financial_event (aggregate_type, aggregate_id, occurred_at);

alter table public.tournament_order enable row level security;
alter table public.tournament_order_item enable row level security;
alter table public.payment enable row level security;
alter table public.payment_attempt enable row level security;
alter table public.payment_allocation enable row level security;
alter table public.payment_refund enable row level security;
alter table public.platform_fee enable row level security;
alter table public.financial_event enable row level security;

revoke all on public.tournament_order, public.tournament_order_item, public.payment,
  public.payment_attempt, public.payment_allocation, public.payment_refund,
  public.platform_fee, public.financial_event from anon;

grant select, insert, update on public.tournament_order to authenticated;
grant select, insert on public.tournament_order_item to authenticated;
grant select on public.payment, public.payment_attempt, public.payment_allocation,
  public.payment_refund, public.platform_fee, public.financial_event to authenticated;

create policy tournament_order_owner_read on public.tournament_order
for select to authenticated using (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
);
create policy tournament_order_owner_write on public.tournament_order
for all to authenticated using (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
) with check (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF'])
);

create policy tournament_order_item_read on public.tournament_order_item
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','STAFF'])
  )
));
create policy tournament_order_item_insert on public.tournament_order_item
for insert to authenticated with check (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','STAFF'])
  )
));

create policy financial_org_read on public.payment
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN'])
  )
));
create policy payment_attempt_read on public.payment_attempt
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN']))
));
create policy payment_allocation_read on public.payment_allocation
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN']))
));
create policy payment_refund_read on public.payment_refund
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN']))
));
create policy platform_fee_admin_read on public.platform_fee
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and public.is_organization_member(o.organization_id, array['OWNER','ADMIN'])
));
create policy financial_event_admin_read on public.financial_event
for select to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create trigger tg_tournament_order_updated_at before update on public.tournament_order
for each row execute function public.tg_set_updated_at();
create trigger tg_payment_updated_at before update on public.payment
for each row execute function public.tg_set_updated_at();

comment on table public.tournament_order is 'Commercial order state. Competition registration/eligibility remains separate.';
comment on table public.payment is 'Provider-neutral payment record. CONFIRMED may enable explicit domain actions but never directly changes scoring.';
comment on table public.financial_event is 'Append-only financial audit event with idempotency key.';