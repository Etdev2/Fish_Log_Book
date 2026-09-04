-- =============================================================================
-- Row-level security for the regulation tables
--
-- `20260828120100_v1_rls.sql` put RLS on every table that existed on 28 August and
-- closed with `revoke all on all tables in schema public from anon`. The four
-- regulation tables were created on 1 September, four days later, and that statement
-- only ever affected tables that existed when it ran — there is no
-- `alter default privileges ... for anon` in the public schema to catch later ones.
-- So `reg_area`, `reg_group`, `reg_pack` and `reg_rule` have been the only tables in
-- the schema with no RLS, no policy, and no revoke.
--
-- Reading them was never the risk: regulations are public law and the app ships them
-- in the client bundle anyway. WRITING them is. The anon key is public by design (it
-- is in every browser that loads the app), and a table with no RLS and no revoke is
-- reachable through PostgREST with whatever the role's default grants allow. A stranger
-- editing a bag limit or a size limit would be changing what Fish Legal tells an angler
-- the law is — the one thing in this product that must not be wrong.
--
-- These are reference data with no `angler_id`, so they take the vocabulary pattern
-- from the original migration rather than the angler-owned one: any signed-in angler
-- may read, nobody may write through the API, rows arrive by migration.
--
-- Idempotent: safe whether or not it has already been applied, because the state of
-- production is exactly what was unverified when this was written
-- (docs/team/PRE-SHIP-CHECKLIST.md, "Confirm RLS is actually applied").
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array['reg_area','reg_group','reg_pack','reg_rule']
  loop
    execute format('alter table public.%I enable row level security', t);

    -- `if not exists` is not available for policies on every supported version, so
    -- drop-then-create keeps this re-runnable without depending on it.
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select to authenticated using (true)', t);

    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
