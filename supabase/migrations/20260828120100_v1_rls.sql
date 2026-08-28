-- =============================================================================
-- V1 row-level security
-- ontology.md §6: every user-owned table gets RLS keyed on angler_id = auth.uid(),
-- default deny. There is no "public catch" state in V1 because there is no sharing
-- feature — the column is not added speculatively.
--
-- `(select auth.uid())` rather than a bare `auth.uid()`: the subselect is evaluated
-- once per statement instead of once per row, which matters at 100k catches.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reference vocabularies: readable by any signed-in angler, writable by nobody
-- through the API. Rows are added by migration.
-- -----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['species','lure_class','bait_type','structure_type',
                           'cover_type','water_clarity','water_color','seasonal_pattern',
                           'vocabulary_version']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select to authenticated using (true)', t);
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Angler
-- -----------------------------------------------------------------------------

alter table public.angler enable row level security;

create policy angler_select on public.angler
  for select to authenticated using (id = (select auth.uid()));
create policy angler_insert on public.angler
  for insert to authenticated with check (id = (select auth.uid()));
create policy angler_update on public.angler
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- no delete policy: an angler deletes their account through auth, and the cascade
-- takes the rest. A DELETE on this table from a client is always a bug.

-- -----------------------------------------------------------------------------
-- Angler-owned tables. Same four policies everywhere, generated so they cannot drift.
-- -----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['spot','tackle_item','trip','catch',
                           'condition_snapshot','journal_entry','sync_conflict']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated
         using (angler_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated
         with check (angler_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated
         using (angler_id = (select auth.uid()))
         with check (angler_id = (select auth.uid()))', t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated
         using (angler_id = (select auth.uid()))', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- trip_rig: read and insert only. D21a — changing the rig means inserting revision
-- n+1, so history cannot be rewritten. The trigger blocks it too; this makes it
-- unreachable rather than merely rejected.
-- -----------------------------------------------------------------------------

alter table public.trip_rig enable row level security;

create policy trip_rig_select on public.trip_rig
  for select to authenticated using (angler_id = (select auth.uid()));
create policy trip_rig_insert on public.trip_rig
  for insert to authenticated with check (angler_id = (select auth.uid()));

revoke update, delete on public.trip_rig from authenticated, anon;

-- -----------------------------------------------------------------------------
-- Nothing is reachable by `anon`. V1 has no public surface at all.
-- -----------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
