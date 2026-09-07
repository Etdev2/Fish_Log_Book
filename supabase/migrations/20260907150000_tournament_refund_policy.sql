/*
  The host's refund policy, on the tournament.

  ADR 010 §4 requires it on the checkout screen above the pay button, in the host's own
  words, because weather cancellation is routine in this sport and "what happens to my
  $400" is the first question a person asks. Until now there was nowhere to put one, so the
  checkout could only ever say "this host has not published a refund policy" — for every
  event, forever.

  Deliberately free text and deliberately nullable. It is a promise between a host and an
  angler about their money; a set of structured options would either be wrong for most
  events or would read as the app underwriting the terms. Null is honest and the screen
  says so.

  Public, because it is part of the offer: it goes in the projection an angler reads before
  they have entered, alongside the price it qualifies.
*/
alter table public.tournament
  add column if not exists refund_policy text;

comment on column public.tournament.refund_policy is
  'The host''s own words on withdrawals and cancellations. Shown above the pay button. Null means none published, which the checkout states rather than inventing terms.';

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
  t.refund_policy,
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
