-- PAY-002 — Stripe provider persistence and organizer account capability tracking.
-- No raw card/CVV storage. Stripe identifiers only.

create table if not exists public.organizer_payment_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  provider text not null default 'stripe',
  provider_account_id text not null,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  requirements_due text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id),
  unique (organization_id, provider)
);

create table if not exists public.stripe_webhook_event (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  livemode boolean not null,
  object_id text,
  payload_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'RECEIVED' check (processing_status in ('RECEIVED','PROCESSED','IGNORED','FAILED')),
  failure_reason text
);

alter table public.organizer_payment_account enable row level security;
alter table public.stripe_webhook_event enable row level security;
revoke all on public.organizer_payment_account, public.stripe_webhook_event from anon;
grant select on public.organizer_payment_account to authenticated;

create policy organizer_payment_account_admin_read on public.organizer_payment_account
for select to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

create trigger tg_organizer_payment_account_updated_at before update on public.organizer_payment_account
for each row execute function public.tg_set_updated_at();

comment on table public.organizer_payment_account is 'Provider account identifiers/capabilities only; no bank credentials or secrets.';
comment on table public.stripe_webhook_event is 'Server-only idempotent Stripe webhook receipt ledger after signature verification.';