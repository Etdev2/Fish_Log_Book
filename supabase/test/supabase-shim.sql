-- Minimal stand-ins for the parts of Supabase the migrations lean on. Idempotent, so the
-- harness can reset and re-apply repeatedly.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
-- The tests set this GUC to impersonate a signed-in angler.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

/*
  Real Supabase lets the client roles call `auth.uid()`; without this they cannot, and an
  RLS policy that says `purchaser_angler_id = auth.uid()` fails on permissions rather than
  on the row. Granted here because a test that reads zero rows for the wrong reason is
  worse than no test — it reports "correctly denied" for a policy that was never evaluated.
*/
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;

create extension if not exists pgcrypto;
