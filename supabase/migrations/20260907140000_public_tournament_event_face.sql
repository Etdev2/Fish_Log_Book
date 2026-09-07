/*
  The public projection of a tournament has to carry the things a public event card shows.

  `public_tournament` is what an angler who is not in your organisation reads, and it did
  not select `location_name`, `entry_fee_minor` or `currency` — the three facts the event
  calendar exists to answer. Two consequences, both bugs:

  1. Every public event on the calendar would render "Not announced" for where it is and
     nothing for what it costs, no matter what the host had filled in.
  2. Any query asking the view for those columns fails outright, taking the whole events
     list down rather than degrading.

  Safe to expose: these are the contents of the flyer. Money that is nobody else's business
  — what has been collected, who paid, platform fees — stays out of this view, as it always
  has; the pot is read from `prize_pool` under its own policies.

  A replacement view rather than an edit to 20260905195500: that migration is now
  applicable, so its history is real and `create or replace view` is the ordinary way to
  evolve one.
*/
/*
  Dropped and recreated rather than `create or replace view`. Replace can only APPEND
  columns: inserting one into the middle of the select list fails with "cannot change name
  of view column", because Postgres matches the new definition to the old one positionally.
  Keeping the columns in a readable order is worth the drop, and nothing depends on this
  view but the client.
*/
drop function if exists public.get_public_tournament(text);
drop view if exists public.public_tournament;
create view public.public_tournament as
select
  t.id,
  t.slug,
  t.name,
  t.description,
  t.visibility,
  t.status,
  t.starts_at,
  t.ends_at,
  t.registration_opens_at,
  t.registration_closes_at,
  t.location_name,
  t.entry_fee_minor,
  t.currency,
  t.organization_id,
  t.created_at
from public.tournament t
where t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED');

comment on view public.public_tournament is
  'What an angler outside the organisation may read about an event: the flyer, not the books.';

/*
  `get_public_tournament` returns `setof public.public_tournament`, so it holds a reference
  to the view's row type and has to be dropped with it and put back afterwards. Restored
  verbatim from 20260905195500, grants included — a function that silently loses its grant
  is a route that stops working for anonymous readers.
*/
create or replace function public.get_public_tournament(target_slug text)
returns setof public.public_tournament
language sql stable security definer set search_path = public as $$
  select * from public.public_tournament where slug = target_slug limit 1;
$$;

revoke all on function public.get_public_tournament(text) from public;
grant execute on function public.get_public_tournament(text) to anon, authenticated;
