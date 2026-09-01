-- =============================================================================
-- catch_gear — several pieces of gear on one catch, each with a role
--
-- Implements: Fish Log spec §14 (multiple gear relationships) and §15 (historical
-- gear accuracy). Additive only: no existing table, column, constraint or policy is
-- altered or dropped by this file.
--
-- WHY THIS TABLE EXISTS
--
-- `catch` already carries `tackle_item_id`, copied from the sticky rig (D21a). That is
-- one lure, and it is the right shape for the question D21a was answering — "what was
-- tied on" — but it cannot express a rod, a reel, a main line, a leader and a jig on the
-- same fish. The spec is explicit that the system must not be designed around a single
-- `gear_id`, because "which leader was I using when the big ones bit" is exactly the
-- question the Fish Log exists to answer later.
--
-- `catch.tackle_item_id` is deliberately LEFT IN PLACE and still populated. It is the
-- indexed, single-value column that D21a's rig inheritance and the existing analytics
-- views read, and removing it would be a destructive change to shipped behaviour for no
-- gain. Treat it as the primary lure; treat this table as the full rig. When an analysis
-- needs one lure per catch it reads the column; when it needs the whole setup it joins
-- here.
--
-- WHY label/detail ARE STORED ALONGSIDE tackle_item_id (spec §15)
--
-- An angler edits or deletes a tackle item six months after the catch. The FK is
-- ON DELETE SET NULL rather than CASCADE, so losing the tackle item never deletes the
-- record of the fish, and `label`/`detail` — snapshotted at the moment of the catch —
-- keep the history true even after the link is gone. The id is for "how has this jig
-- performed"; the snapshot is for "what was actually on the end of the line that day".
-- Storing only one of the two loses a real question.
-- =============================================================================

create table public.catch_gear (
  id                uuid primary key default gen_random_uuid(),
  angler_id         uuid not null references public.angler(id) on delete cascade,
  catch_id          uuid not null references public.catch(id) on delete cascade,
  -- Nullable and SET NULL on purpose: gear the angler no longer owns still caught a fish.
  tackle_item_id    uuid references public.tackle_item(id) on delete set null,
  role              text not null check (role in (
                      'rod','reel','main_line','leader','hook',
                      'lure','jig','bait','weight','terminal')),
  -- The §15 snapshot. NOT NULL: a gear row that names nothing is not worth keeping.
  label             text not null check (length(btrim(label)) > 0),
  detail            text,
  created_at        timestamptz not null default now(),
  client_updated_at timestamptz,
  updated_at        timestamptz not null default now(),
  -- Deliberately NOT unique on (catch_id, role): two jigs on a dropper loop, or two
  -- rods on a trolling pattern, are real rigs and the schema must not forbid them. The
  -- client replaces a catch's gear set wholesale on edit, so duplicates cannot accrete.
  deleted_at        timestamptz
);

comment on table public.catch_gear is
  'Fish Log spec §14/§15. Several pieces of gear per catch, each with a role. '
  'label/detail are a snapshot taken at the moment of the catch and are what keeps a '
  'historical catch accurate after the tackle item is edited or deleted; tackle_item_id '
  'is the live link and may go null. catch.tackle_item_id remains the single primary '
  'lure for D21a rig inheritance and is not superseded by this table.';

create index idx_catch_gear_catch   on public.catch_gear (catch_id) where deleted_at is null;
create index idx_catch_gear_tackle  on public.catch_gear (tackle_item_id)
  where tackle_item_id is not null and deleted_at is null;
-- The sync cursor shape used by every other syncable table (ADR 004 §5).
create index idx_catch_gear_updated on public.catch_gear (angler_id, updated_at, id);

create trigger tg_catch_gear_updated_at before update on public.catch_gear
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS: the same four policies every angler-owned table gets, written the same way
-- (`(select auth.uid())` so it is evaluated once per statement, not once per row).
-- -----------------------------------------------------------------------------

alter table public.catch_gear enable row level security;

create policy catch_gear_select on public.catch_gear
  for select to authenticated using (angler_id = (select auth.uid()));
create policy catch_gear_insert on public.catch_gear
  for insert to authenticated with check (angler_id = (select auth.uid()));
create policy catch_gear_update on public.catch_gear
  for update to authenticated
  using (angler_id = (select auth.uid())) with check (angler_id = (select auth.uid()));
create policy catch_gear_delete on public.catch_gear
  for delete to authenticated using (angler_id = (select auth.uid()));

revoke all on public.catch_gear from anon;
