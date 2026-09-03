-- Angler row on signup, plus catch columns the web log already writes.
--
-- public.angler.id = auth.users.id. Without a row, every trip/catch insert fails the FK
-- even with a valid JWT. The trigger is the only honest place: the client can also
-- upsert, but a magic-link user who never opens the app still has a profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.angler (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Client CatchRecord already carries these; sending them without columns is PGRST204.
alter table public.catch
  add column if not exists species_other text,
  add column if not exists quantity integer not null default 1 check (quantity >= 1),
  add column if not exists tags text[] not null default '{}',
  add column if not exists favorite boolean not null default false;

comment on column public.catch.species_other is
  'Free text when the fish is not in the vocabulary. Never a substitute for species_id.';
comment on column public.catch.quantity is
  'How many. Defaults 1. A mark is one event; a confirmed multi-fish drop can be more.';
comment on column public.catch.favorite is
  'Angler star. Local-first; syncs like any other column.';
