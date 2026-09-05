-- ARCH-001 / T-006 — judge review, append-only penalties, disputes and overrides.
-- Depends on T-005 Fair Play + verification. Financial permissions are intentionally absent.

create table if not exists public.catch_review (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_catch_id uuid not null references public.tournament_catch(id) on delete cascade,
  reviewer_angler_id uuid not null references public.angler(id) on delete restrict,
  decision text not null check (decision in ('APPROVE','REJECT','DISQUALIFY','RETURN_FOR_EVIDENCE','NO_ACTION')),
  reason text not null check (length(btrim(reason)) > 0),
  notes text,
  source_verification_session_id uuid references public.verification_session(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists catch_review_catch_idx
  on public.catch_review (tournament_catch_id, created_at);

create table if not exists public.tournament_penalty (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  target_type text not null check (target_type in ('CATCH','ENTRY','TEAM','BOAT')),
  target_id uuid not null,
  penalty_type text not null check (penalty_type in ('POINT_DEDUCTION','WEIGHT_DEDUCTION','TIME_PENALTY','CATCH_REMOVAL','DISQUALIFICATION','CUSTOM')),
  points_delta numeric,
  weight_delta_g integer,
  time_penalty_seconds integer,
  custom_code text,
  reason text not null check (length(btrim(reason)) > 0),
  issued_by uuid not null references public.angler(id) on delete restrict,
  reverses_penalty_id uuid references public.tournament_penalty(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint tournament_penalty_shape check (
    (penalty_type = 'POINT_DEDUCTION' and points_delta is not null and points_delta <= 0)
    or (penalty_type = 'WEIGHT_DEDUCTION' and weight_delta_g is not null and weight_delta_g <= 0)
    or (penalty_type = 'TIME_PENALTY' and time_penalty_seconds is not null and time_penalty_seconds >= 0)
    or (penalty_type in ('CATCH_REMOVAL','DISQUALIFICATION'))
    or (penalty_type = 'CUSTOM' and custom_code is not null)
  )
);

create index if not exists tournament_penalty_target_idx
  on public.tournament_penalty (tournament_id, target_type, target_id, created_at);
create unique index if not exists tournament_penalty_single_reversal
  on public.tournament_penalty (reverses_penalty_id)
  where reverses_penalty_id is not null;

create table if not exists public.tournament_dispute (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  opened_by_entry_id uuid references public.tournament_entry(id) on delete set null,
  related_catch_id uuid references public.tournament_catch(id) on delete set null,
  related_penalty_id uuid references public.tournament_penalty(id) on delete set null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','RESOLVED','DENIED','WITHDRAWN')),
  subject text not null check (length(btrim(subject)) > 0),
  statement text not null check (length(btrim(statement)) > 0),
  opened_by_angler_id uuid references public.angler(id) on delete set null,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text,
  resolved_by uuid references public.angler(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint tournament_dispute_resolution_shape check (
    (status in ('RESOLVED','DENIED') and resolved_at is not null and resolved_by is not null and resolution is not null)
    or status not in ('RESOLVED','DENIED')
  )
);

create table if not exists public.tournament_dispute_event (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.tournament_dispute(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('OPEN','UNDER_REVIEW','RESOLVED','DENIED','WITHDRAWN')),
  actor_angler_id uuid not null references public.angler(id) on delete restrict,
  reason text not null check (length(btrim(reason)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.adjudication_override (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_catch_id uuid references public.tournament_catch(id) on delete cascade,
  verification_check_id uuid references public.verification_check(id) on delete set null,
  fair_play_signal_id uuid references public.fair_play_signal(id) on delete set null,
  outcome text not null check (outcome in ('ALLOW','BLOCK','REQUIRE_REVIEW')),
  reason text not null check (length(btrim(reason)) > 0),
  actor_angler_id uuid not null references public.angler(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint adjudication_override_has_subject check (
    tournament_catch_id is not null or verification_check_id is not null or fair_play_signal_id is not null
  )
);

-- Reviews, penalties and overrides are immutable audit records.
create or replace function public.tg_reject_adjudication_mutation()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only; add a new review/penalty/override instead', tg_table_name
    using errcode = 'check_violation';
end $$;

create trigger tg_catch_review_immutable
before update or delete on public.catch_review
for each row execute function public.tg_reject_adjudication_mutation();
create trigger tg_tournament_penalty_immutable
before update or delete on public.tournament_penalty
for each row execute function public.tg_reject_adjudication_mutation();
create trigger tg_adjudication_override_immutable
before update or delete on public.adjudication_override
for each row execute function public.tg_reject_adjudication_mutation();
create trigger tg_tournament_dispute_event_immutable
before update or delete on public.tournament_dispute_event
for each row execute function public.tg_reject_adjudication_mutation();

create trigger tg_tournament_dispute_updated_at
before update on public.tournament_dispute
for each row execute function public.tg_set_updated_at();

-- Validate that a reversal stays inside the same tournament and mirrors the original target.
create or replace function public.tg_validate_penalty_reversal()
returns trigger language plpgsql as $$
declare original public.tournament_penalty;
begin
  if new.reverses_penalty_id is null then return new; end if;
  select * into original from public.tournament_penalty where id = new.reverses_penalty_id;
  if original.id is null then raise exception 'reversed penalty not found'; end if;
  if original.tournament_id <> new.tournament_id or original.organization_id <> new.organization_id then
    raise exception 'penalty reversal crosses tournament or organization' using errcode = '23514';
  end if;
  if original.target_type <> new.target_type or original.target_id <> new.target_id then
    raise exception 'penalty reversal must target the same subject' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger tg_tournament_penalty_validate_reversal
before insert on public.tournament_penalty
for each row execute function public.tg_validate_penalty_reversal();

alter table public.catch_review enable row level security;
alter table public.tournament_penalty enable row level security;
alter table public.tournament_dispute enable row level security;
alter table public.tournament_dispute_event enable row level security;
alter table public.adjudication_override enable row level security;

revoke all on public.catch_review, public.tournament_penalty, public.tournament_dispute,
  public.tournament_dispute_event, public.adjudication_override from anon;

grant select, insert on public.catch_review to authenticated;
grant select, insert on public.tournament_penalty to authenticated;
grant select, insert, update on public.tournament_dispute to authenticated;
grant select, insert on public.tournament_dispute_event to authenticated;
grant select, insert on public.adjudication_override to authenticated;

-- Operational adjudication is intentionally scoped to organization staff. No finance role appears here.
create policy catch_review_org_read on public.catch_review for select to authenticated
  using (public.is_organization_member(organization_id));
create policy catch_review_judge_insert on public.catch_review for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_penalty_org_read on public.tournament_penalty for select to authenticated
  using (public.is_organization_member(organization_id));
create policy tournament_penalty_judge_insert on public.tournament_penalty for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy adjudication_override_org_read on public.adjudication_override for select to authenticated
  using (public.is_organization_member(organization_id));
create policy adjudication_override_judge_insert on public.adjudication_override for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_dispute_read on public.tournament_dispute for select to authenticated
  using (
    public.is_organization_member(organization_id)
    or opened_by_angler_id = auth.uid()
    or (opened_by_entry_id is not null and public.can_read_tournament_entry(opened_by_entry_id))
  );
create policy tournament_dispute_open on public.tournament_dispute for insert to authenticated
  with check (
    public.is_organization_member(organization_id)
    or opened_by_angler_id = auth.uid()
    or (opened_by_entry_id is not null and public.can_read_tournament_entry(opened_by_entry_id))
  );
create policy tournament_dispute_staff_update on public.tournament_dispute for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy tournament_dispute_event_read on public.tournament_dispute_event for select to authenticated
  using (exists (
    select 1 from public.tournament_dispute d
    where d.id = dispute_id and (
      public.is_organization_member(d.organization_id)
      or d.opened_by_angler_id = auth.uid()
      or (d.opened_by_entry_id is not null and public.can_read_tournament_entry(d.opened_by_entry_id))
    )
  ));
create policy tournament_dispute_event_insert on public.tournament_dispute_event for insert to authenticated
  with check (exists (
    select 1 from public.tournament_dispute d
    where d.id = dispute_id and public.is_organization_member(d.organization_id, array['OWNER','ADMIN','STAFF'])
  ));

comment on table public.catch_review is 'Append-only human review decisions. Multiple reviews may exist; history is never overwritten.';
comment on table public.tournament_penalty is 'Append-only scoring inputs. Reversals are new rows referencing the original penalty.';
comment on table public.adjudication_override is 'Reasoned human override of verification/fair-play outcomes with actor and timestamp.';
comment on table public.tournament_dispute is 'Participant dispute case; lifecycle changes are mirrored in tournament_dispute_event.';
