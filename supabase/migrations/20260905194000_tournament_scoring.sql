-- T-007 — deterministic tournament scoring, standings, snapshots and finalization.
-- Depends on T-006 adjudication. Scoring consumes approved catches + append-only penalties.
-- Scoring never initiates payments.

create table if not exists public.score_computation (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  scoring_version_id uuid not null references public.tournament_scoring_version(id) on delete restrict,
  source_cutoff_at timestamptz not null,
  source_hash text not null,
  computed_at timestamptz not null default now(),
  computed_by uuid references public.angler(id) on delete set null,
  status text not null default 'COMPLETE' check (status in ('RUNNING','COMPLETE','FAILED')),
  failure_reason text,
  unique (tournament_id, scoring_version_id, source_hash)
);

create table if not exists public.standing (
  id uuid primary key default gen_random_uuid(),
  score_computation_id uuid not null references public.score_computation(id) on delete cascade,
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  tournament_entry_id uuid not null references public.tournament_entry(id) on delete cascade,
  division_id uuid references public.tournament_division(id) on delete set null,
  rank integer not null check (rank > 0),
  score_numeric numeric not null,
  tie_break_value numeric,
  eligible_catch_count integer not null default 0 check (eligible_catch_count >= 0),
  penalty_points numeric not null default 0,
  penalty_weight_g numeric not null default 0,
  is_disqualified boolean not null default false,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (score_computation_id, tournament_entry_id, division_id)
);

create table if not exists public.leaderboard_snapshot (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  score_computation_id uuid not null references public.score_computation(id) on delete restrict,
  snapshot_kind text not null default 'LIVE' check (snapshot_kind in ('LIVE','CHECKPOINT','FINAL')),
  generated_at timestamptz not null default now(),
  payload jsonb not null,
  source_hash text not null,
  unique (tournament_id, snapshot_kind, source_hash)
);

create table if not exists public.final_result_set (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament(id) on delete cascade,
  organization_id uuid not null references public.organization(id) on delete cascade,
  version integer not null check (version > 0),
  score_computation_id uuid not null references public.score_computation(id) on delete restrict,
  rules_version_id uuid not null references public.tournament_rule_set_version(id) on delete restrict,
  scoring_version_id uuid not null references public.tournament_scoring_version(id) on delete restrict,
  verification_policy_version_id uuid not null references public.tournament_verification_policy_version(id) on delete restrict,
  boundary_version_id uuid not null references public.tournament_boundary_version(id) on delete restrict,
  finalized_by uuid not null references public.angler(id) on delete restrict,
  finalized_at timestamptz not null default now(),
  correction_reason text,
  supersedes_final_result_set_id uuid references public.final_result_set(id) on delete restrict,
  source_hash text not null,
  unique (tournament_id, version),
  unique (tournament_id, source_hash)
);

create table if not exists public.final_result_award (
  id uuid primary key default gen_random_uuid(),
  final_result_set_id uuid not null references public.final_result_set(id) on delete cascade,
  tournament_award_category_id uuid not null references public.tournament_award_category(id) on delete restrict,
  tournament_entry_id uuid references public.tournament_entry(id) on delete restrict,
  tournament_team_id uuid references public.tournament_team(id) on delete restrict,
  tournament_boat_id uuid references public.tournament_boat(id) on delete restrict,
  rank integer not null check (rank > 0),
  winning_value numeric,
  detail jsonb not null default '{}'::jsonb,
  constraint final_result_award_one_target check (
    ((tournament_entry_id is not null)::int +
     (tournament_team_id is not null)::int +
     (tournament_boat_id is not null)::int) = 1
  )
);

create index if not exists standing_tournament_rank_idx on public.standing (tournament_id, rank);
create index if not exists standing_entry_idx on public.standing (tournament_entry_id);
create index if not exists final_result_set_tournament_version_idx on public.final_result_set (tournament_id, version desc);

alter table public.score_computation enable row level security;
alter table public.standing enable row level security;
alter table public.leaderboard_snapshot enable row level security;
alter table public.final_result_set enable row level security;
alter table public.final_result_award enable row level security;

revoke all on public.score_computation, public.standing, public.leaderboard_snapshot,
  public.final_result_set, public.final_result_award from anon;

grant select, insert on public.score_computation to authenticated;
grant select, insert on public.standing to authenticated;
grant select, insert on public.leaderboard_snapshot to authenticated;
grant select, insert on public.final_result_set to authenticated;
grant select, insert on public.final_result_award to authenticated;

create policy score_computation_org_read on public.score_computation
for select to authenticated using (public.is_organization_member(organization_id));
create policy score_computation_admin_insert on public.score_computation
for insert to authenticated with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy standing_org_read on public.standing
for select to authenticated using (public.is_organization_member(organization_id));
create policy standing_admin_insert on public.standing
for insert to authenticated with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy leaderboard_snapshot_org_read on public.leaderboard_snapshot
for select to authenticated using (public.is_organization_member(organization_id));
create policy leaderboard_snapshot_admin_insert on public.leaderboard_snapshot
for insert to authenticated with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy final_result_set_org_read on public.final_result_set
for select to authenticated using (public.is_organization_member(organization_id));
create policy final_result_set_admin_insert on public.final_result_set
for insert to authenticated with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

create policy final_result_award_org_read on public.final_result_award
for select to authenticated using (exists (
  select 1 from public.final_result_set fr
  where fr.id = final_result_set_id and public.is_organization_member(fr.organization_id)
));
create policy final_result_award_admin_insert on public.final_result_award
for insert to authenticated with check (exists (
  select 1 from public.final_result_set fr
  where fr.id = final_result_set_id and public.is_organization_member(fr.organization_id, array['OWNER','ADMIN','STAFF'])
));

create or replace function public.next_final_result_version(target_tournament_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(max(version), 0) + 1 from public.final_result_set where tournament_id = target_tournament_id;
$$;
revoke all on function public.next_final_result_version(uuid) from public;
grant execute on function public.next_final_result_version(uuid) to authenticated;

comment on table public.score_computation is 'Reproducible score computation over an exact scoring version and source hash.';
comment on table public.final_result_set is 'Immutable official result version. Corrections create a new version and optionally supersede a prior result.';
comment on table public.final_result_award is 'Official award result only; no financial or payout side effects.';