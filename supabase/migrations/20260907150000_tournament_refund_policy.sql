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
  t.refund_policy,
  t.organization_id,
  t.created_at
from public.tournament t
where t.deleted_at is null
  and t.visibility in ('PUBLIC','UNLISTED');

comment on view public.public_tournament is
  'What an angler outside the organisation may read about an event: the flyer, not the books.';
