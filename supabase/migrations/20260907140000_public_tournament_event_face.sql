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
create or replace view public.public_tournament as
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
