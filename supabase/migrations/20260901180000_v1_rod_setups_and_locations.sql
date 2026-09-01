-- =============================================================================
-- Rod setups (N per trip) and observed location conditions
--
-- Implements: Fish Log revision §5–§13 (Setup), §10 (setup vs historical catch data).
--
-- WHAT THIS DOES TO EXISTING OBJECTS
--
-- `trip_rig` gains four columns and its uniqueness moves from (trip_id, revision) to
-- (trip_id, slot, revision). That constraint swap is the one non-additive change in this
-- file and it is required: D21a modelled ONE standing rig per trip, and the revision
-- number was therefore unique on its own. An angler fishing three rods needs three
-- concurrent revision chains, and (trip_id, revision) forbids two rods sharing revision 1.
--
-- Existing rows are unaffected: `slot` defaults to 1, so a trip that had one rig keeps
-- one rig, in slot 1, with its revision history intact. The new constraint is strictly
-- weaker than the old one, so nothing that was legal becomes illegal.
--
-- A separate `rod_setup` table was deliberately NOT created. `trip_rig` already is "the
-- standing configuration a catch inherits from", already append-only, and already the
-- thing `catch.rig_id` points at. A second table would be a second answer to "what was I
-- fishing with", which is exactly the drift ADR 003 exists to prevent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- trip_rig -> N rods per trip
-- -----------------------------------------------------------------------------

alter table public.trip_rig
  add column slot        integer not null default 1 check (slot >= 1),
  add column name        text,
  add column setup_type  text check (setup_type in (
                           'flyline','surface_iron','yo_yo','knife_jig','slow_pitch',
                           'dropper_loop','trolling','bottom','bait_rig','custom')),
  add column live_bait   boolean not null default false,
  -- Putting a rod away is itself a revision, so the rod's history stays intact and every
  -- catch that came on it still resolves. Never a delete.
  add column retired_at  timestamptz;

alter table public.trip_rig drop constraint trip_rig_trip_id_revision_key;
alter table public.trip_rig add constraint trip_rig_trip_slot_revision_key
  unique (trip_id, slot, revision);

comment on column public.trip_rig.slot is
  'Rod 1, Rod 2, ... Stable for the life of the trip; revisions accrue within a slot. '
  'Fish Log revision §5: three rods is a starting point, not a limit.';
comment on column public.trip_rig.retired_at is
  'Set by a NEW revision, never by updating an old one (the table revokes UPDATE). A '
  'retired slot stops being offered when logging and keeps every catch that came on it.';

create index idx_rig_trip_slot on public.trip_rig (trip_id, slot, revision desc);

-- -----------------------------------------------------------------------------
-- trip_rig_gear — the rig, role by role
--
-- Same shape and the same id-plus-snapshot rule as `catch_gear`: `tackle_item_id` is the
-- live link and may go null, `label` is what was actually tied on. Deliberately not
-- reusing catch_gear with a nullable catch_id — a rig row and a catch row have different
-- lifetimes, and a nullable foreign key that means "this one is really the other thing"
-- is how a table stops being readable.
-- -----------------------------------------------------------------------------

create table public.trip_rig_gear (
  id              uuid primary key default gen_random_uuid(),
  angler_id       uuid not null references public.angler(id) on delete cascade,
  rig_id          uuid not null references public.trip_rig(id) on delete cascade,
  tackle_item_id  uuid references public.tackle_item(id) on delete set null,
  role            text not null check (role in (
                    'rod','reel','main_line','leader','hook',
                    'lure','jig','bait','weight','terminal')),
  label           text not null check (length(btrim(label)) > 0),
  detail          text,
  created_at      timestamptz not null default now()
);

create index idx_rig_gear_rig on public.trip_rig_gear (rig_id);
create index idx_rig_gear_angler_created on public.trip_rig_gear (angler_id, created_at, id);

-- -----------------------------------------------------------------------------
-- location_condition — observed conditions at a place being fished
--
-- MUTABLE on purpose, unlike a rig. This describes the spot as it is right now; the
-- history lives on each catch's own copied values (Fish Log revision §10). Editing
-- "West End" at noon is a correction to the present, not a rewrite of the morning.
--
-- current_term reuses the ontology's four angler-observed values. It is NOT a measured
-- current vector and nothing derives a bearing from it (§13); `spot.alongshore_bearing_deg`
-- remains the only place a real bearing lives.
-- -----------------------------------------------------------------------------

create table public.location_condition (
  id                   uuid primary key default gen_random_uuid(),
  angler_id            uuid not null references public.angler(id) on delete cascade,
  trip_id              uuid not null references public.trip(id) on delete cascade,
  spot_id              uuid references public.spot(id),
  name                 text not null check (length(btrim(name)) > 0),
  current_term         text check (current_term in ('uphill','downhill','inshore','offshore','unknown')),
  current_strength     text check (current_strength in ('none','light','moderate','strong','very_strong')),
  -- Several at once is normal: "Rocky + Kelp" is one place, not two (§13).
  structure_type_ids   text[] not null default '{}',
  -- Bottom depth HERE. Never the depth a fish was caught at — that is catch.depth_fished_m,
  -- and conflating them would poison every depth correlation this log exists to support.
  bottom_depth_m       numeric(6,2) check (bottom_depth_m is null or bottom_depth_m >= 0),
  water_color_id       text references public.water_color(id),
  water_clarity_id     text references public.water_clarity(id),
  notes                text,
  created_at           timestamptz not null default now(),
  client_updated_at    timestamptz,
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

comment on table public.location_condition is
  'Fish Log revision §11-§13. Angler-observed conditions at a place being fished today. '
  'Mutable preset; the immutable record of what a given fish was caught in is the copy '
  'on public.catch plus its condition_snapshot.';

create index idx_location_trip on public.location_condition (trip_id) where deleted_at is null;
create index idx_location_angler_updated on public.location_condition (angler_id, updated_at, id);

create trigger tg_location_condition_updated_at before update on public.location_condition
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- catch — the copy of what the location said at the moment of the fish (§10, §17)
-- -----------------------------------------------------------------------------

alter table public.catch
  add column rig_slot              integer check (rig_slot is null or rig_slot >= 1),
  add column location_condition_id uuid references public.location_condition(id) on delete set null,
  add column location_name         text,
  add column current_term          text check (current_term in ('uphill','downhill','inshore','offshore','unknown')),
  add column current_strength      text check (current_strength in ('none','light','moderate','strong','very_strong')),
  add column structure_type_ids    text[] not null default '{}',
  add column water_color_id        text references public.water_color(id),
  add column water_clarity_id      text references public.water_clarity(id);

comment on column public.catch.location_condition_id is
  'The live link, for "how has West End fished". ON DELETE SET NULL: removing the preset '
  'must never take the record of the fish with it. The columns beside this one are the '
  'copy taken at the moment of the catch and are what stay true afterwards.';
comment on column public.catch.bottom_depth_m is
  'Depth of water at the spot. NOT where the fish was — that is depth_fished_m. '
  'Fish Log revision §13.';

create index idx_catch_location on public.catch (location_condition_id)
  where location_condition_id is not null;

-- -----------------------------------------------------------------------------
-- RLS: the same four policies every angler-owned table gets.
-- -----------------------------------------------------------------------------

alter table public.location_condition enable row level security;

create policy location_condition_select on public.location_condition
  for select to authenticated using (angler_id = (select auth.uid()));
create policy location_condition_insert on public.location_condition
  for insert to authenticated with check (angler_id = (select auth.uid()));
create policy location_condition_update on public.location_condition
  for update to authenticated
  using (angler_id = (select auth.uid())) with check (angler_id = (select auth.uid()));
create policy location_condition_delete on public.location_condition
  for delete to authenticated using (angler_id = (select auth.uid()));

-- trip_rig_gear follows trip_rig: read and insert only, so a rig's history cannot be
-- rewritten by editing the gear hanging off it.
alter table public.trip_rig_gear enable row level security;

create policy trip_rig_gear_select on public.trip_rig_gear
  for select to authenticated using (angler_id = (select auth.uid()));
create policy trip_rig_gear_insert on public.trip_rig_gear
  for insert to authenticated with check (angler_id = (select auth.uid()));

revoke update, delete on public.trip_rig_gear from authenticated, anon;
revoke all on public.location_condition from anon;
revoke all on public.trip_rig_gear from anon;
