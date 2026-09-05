-- PAY-003 — crypto collection provider persistence.
-- Collection is separate from payout capability. No private keys, seed phrases, or wallet secrets.

create table if not exists public.wallet_connection (
  id uuid primary key default gen_random_uuid(),
  angler_id uuid not null references public.angler(id) on delete cascade,
  wallet_address text not null,
  chain_namespace text not null,
  chain_id text not null,
  connected_at timestamptz not null default now(),
  last_verified_at timestamptz,
  disconnected_at timestamptz,
  unique (angler_id, chain_namespace, chain_id, wallet_address)
);

create table if not exists public.crypto_payment_quote (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  order_id uuid not null references public.tournament_order(id) on delete cascade,
  fiat_currency text not null,
  fiat_amount_minor bigint not null check (fiat_amount_minor >= 0),
  crypto_asset text not null,
  crypto_amount_atomic numeric not null check (crypto_amount_atomic > 0),
  chain_namespace text not null,
  chain_id text not null,
  rate_source text not null,
  quoted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint crypto_quote_expiry_after_quote check (expires_at > quoted_at)
);

create table if not exists public.crypto_payment (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payment(id) on delete restrict,
  quote_id uuid not null references public.crypto_payment_quote(id) on delete restrict,
  payer_wallet_address text not null,
  recipient_wallet_address text not null,
  chain_namespace text not null,
  chain_id text not null,
  crypto_asset text not null,
  expected_amount_atomic numeric not null check (expected_amount_atomic > 0),
  tx_hash text,
  status text not null default 'AWAITING_TX' check (status in ('AWAITING_TX','SUBMITTED','CONFIRMING','CONFIRMED','FAILED','EXPIRED','WRONG_NETWORK','WRONG_ASSET','UNDERPAID','OVERPAID')),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmations integer not null default 0 check (confirmations >= 0),
  block_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_namespace, chain_id, tx_hash)
);

create table if not exists public.crypto_chain_observation (
  id uuid primary key default gen_random_uuid(),
  crypto_payment_id uuid not null references public.crypto_payment(id) on delete cascade,
  tx_hash text not null,
  observed_chain_id text not null,
  observed_asset text not null,
  observed_amount_atomic numeric not null,
  recipient_wallet_address text not null,
  confirmations integer not null default 0,
  finality_status text not null check (finality_status in ('SEEN','CONFIRMING','FINAL','REORGED','FAILED')),
  observed_at timestamptz not null default now(),
  unique (crypto_payment_id, tx_hash, confirmations, finality_status)
);

alter table public.wallet_connection enable row level security;
alter table public.crypto_payment_quote enable row level security;
alter table public.crypto_payment enable row level security;
alter table public.crypto_chain_observation enable row level security;

revoke all on public.wallet_connection, public.crypto_payment_quote, public.crypto_payment, public.crypto_chain_observation from anon;
grant select, insert, update on public.wallet_connection to authenticated;
grant select on public.crypto_payment_quote, public.crypto_payment, public.crypto_chain_observation to authenticated;

create policy wallet_connection_owner on public.wallet_connection
for all to authenticated using (angler_id = auth.uid()) with check (angler_id = auth.uid());

create policy crypto_quote_read on public.crypto_payment_quote
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN'])
  )
));

create policy crypto_payment_read on public.crypto_payment
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN']))
));

create policy crypto_observation_read on public.crypto_chain_observation
for select to authenticated using (exists (
  select 1 from public.crypto_payment cp
  join public.payment p on p.id = cp.payment_id
  join public.tournament_order o on o.id = p.order_id
  where cp.id = crypto_payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN']))
));

create trigger tg_crypto_payment_updated_at before update on public.crypto_payment
for each row execute function public.tg_set_updated_at();

comment on table public.wallet_connection is 'Public wallet address linkage only. Never stores private keys, seed phrases, passwords, or signing secrets.';
comment on table public.crypto_payment_quote is 'Temporary fiat-to-crypto quote with explicit source, chain, asset and expiry.';
comment on table public.crypto_payment is 'Crypto collection state. Wallet signature or submitted transaction is not payment confirmation; server-verified finality is required.';