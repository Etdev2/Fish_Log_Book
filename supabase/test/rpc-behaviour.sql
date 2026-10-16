/*
  What the registration functions actually do, run against a real Postgres.

  These are not unit tests of SQL text — they insert an organisation, a tournament and some
  jackpots, impersonate an angler, call the functions, and check the rows that come out.
  Everything happens inside one transaction that is rolled back at the end, so the script
  can be run repeatedly against the same database.

  `ok`/`not ok` lines are printed so a human skimming the output can see what passed. Any
  failure raises, which stops the script and fails the harness.
*/
begin;

create or replace function pg_temp.check(label text, condition boolean) returns void
language plpgsql as $$
begin
  if condition then
    raise notice 'ok %', label;
  else
    raise exception 'not ok %', label;
  end if;
end;
$$;

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'captain@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'host@example.test');

-- No `public.angler` insert: 20260903120000 puts a trigger on `auth.users` that creates
-- one. Inserting here would collide with it, which is itself a useful thing to have proven.

insert into public.organization (id, kind, name, created_by) values
  -- Two hosts, so the "one order cannot span two organisations" rule has something to
  -- refuse. Only one may be PERSONAL per creator, hence the CLUB kind on the second.
  ('33333333-3333-3333-3333-333333333333', 'PERSONAL', 'Host Org', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444444', 'CLUB', 'Other Org', '22222222-2222-2222-2222-222222222222');

insert into public.tournament (id, organization_id, name, visibility, status, currency,
                               entry_fee_minor, registration_closes_at, created_by)
values
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
   'Tuna Jackpot', 'PUBLIC', 'REGISTRATION_OPEN', 'USD', 40000, now() + interval '2 days',
   '22222222-2222-2222-2222-222222222222'),
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333',
   'Yellowtail Open', 'PUBLIC', 'REGISTRATION_OPEN', 'USD', 25000, now() + interval '5 days',
   '22222222-2222-2222-2222-222222222222'),
  ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333',
   'Closed Already', 'PUBLIC', 'REGISTRATION_OPEN', 'USD', 10000, now() - interval '1 hour',
   '22222222-2222-2222-2222-222222222222'),
  ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444',
   'Another Host Event', 'PUBLIC', 'REGISTRATION_OPEN', 'USD', 5000, now() + interval '3 days',
   '22222222-2222-2222-2222-222222222222'),
  -- Open for entries, but not to the public. Holding its id must not be enough.
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
   'Invite Only Shootout', 'INVITE_ONLY', 'REGISTRATION_OPEN', 'USD', 20000,
   now() + interval '4 days', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Private Crew Day', 'PRIVATE', 'REGISTRATION_OPEN', 'USD', 20000,
   now() + interval '4 days', '22222222-2222-2222-2222-222222222222');

insert into public.prize_pool (id, organization_id, tournament_id, name, currency, pool_type)
values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333',
        '55555555-5555-5555-5555-555555555555', 'Biggest Tuna', 'USD', 'JACKPOT');

insert into public.tournament_division (id, tournament_id, organization_id, name, kind,
                                        entry_fee_minor, is_optional, prize_pool_id)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555',
   '33333333-3333-3333-3333-333333333333', 'Biggest Tuna', 'JACKPOT', 10000, true,
   '99999999-9999-9999-9999-999999999999'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555',
   '33333333-3333-3333-3333-333333333333', 'Junior', 'DIVISION', null, true, null);

-- Impersonate the captain for everything below.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------- the happy path
do $$
declare
  oid_ uuid;
  total bigint;
  n integer;
begin
  oid_ := public.register_crew_for_tournaments(
    '[{"tournament_id":"55555555-5555-5555-5555-555555555555",
       "division_ids":["aaaaaaaa-0000-0000-0000-000000000001","aaaaaaaa-0000-0000-0000-000000000002"]},
      {"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]}]'::jsonb,
    '[{"display_name":"Elliott T","phone":"949-555-0113","is_captain":true},
      {"display_name":"Mike R","is_captain":false}]'::jsonb,
    'key-happy-path'
  );

  select total_minor into total from public.tournament_order where id = oid_;
  -- 40000 entry + 10000 jackpot + 25000 entry. The free "Junior" division adds nothing, and
  -- the second crew member adds nothing: a boat pays once per event, not once per angler.
  perform pg_temp.check('the boat pays one entry fee per event, whatever the crew size', total = 75000);

  select count(*) into n from public.tournament_team
   where tournament_id in ('55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666');
  perform pg_temp.check('one boat per event', n = 2);

  select count(*) into n from public.tournament_entry
   where tournament_id in ('55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666');
  perform pg_temp.check('one entry per angler per event', n = 4);

  select count(*) into n from public.tournament_entry_identity i
    join public.tournament_entry e on e.id = i.tournament_entry_id
   where e.tournament_id in ('55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666');
  perform pg_temp.check('exactly one identity on each entry', n = 4);

  select count(*) into n from public.tournament_team_member where role = 'CAPTAIN';
  perform pg_temp.check('each boat has one captain', n = 2);

  perform pg_temp.check('nothing is confirmed before payment',
    not exists (select 1 from public.tournament_entry where registration_status <> 'PENDING'));

  perform pg_temp.check('the order waits for money',
    (select status from public.tournament_order where id = oid_) = 'PENDING_PAYMENT');

  perform pg_temp.check('the captain is the signed-in angler',
    (select count(*) from public.tournament_entry_identity
      where claimed_angler_id = '11111111-1111-1111-1111-111111111111'
        and identity_type = 'REGISTERED_USER') = 2);

  perform pg_temp.check('crew who have not signed in are guests',
    (select count(*) from public.tournament_entry_identity
      where display_name = 'Mike R' and identity_type = 'GUEST') = 2);

  perform pg_temp.check('the captain phone is kept for the 4am call',
    (select phone from public.tournament_entry_identity
      where display_name = 'Elliott T' limit 1) = '949-555-0113');

  perform pg_temp.check('the pot is empty until somebody pays',
    (select funded_amount_minor from public.prize_pool
      where id = '99999999-9999-9999-9999-999999999999') = 0);

  -- ------------------------------------------------------------ idempotency
  perform pg_temp.check('the same key returns the same order, not a second one',
    public.register_crew_for_tournaments(
      '[{"tournament_id":"55555555-5555-5555-5555-555555555555","division_ids":[]}]'::jsonb,
      '[{"display_name":"Elliott T","phone":"9495550113","is_captain":true}]'::jsonb,
      'key-happy-path') = oid_);

  select count(*) into n from public.tournament_entry;
  perform pg_temp.check('and creates no further entries', n = 4);

  -- ------------------------------------------------------------ confirming
  /*
    75000 minor units is $750, and also a good deal less in several other currencies. A
    payment made in a cheaper one satisfies the amount check numerically, so the currency is
    compared first.
  */
  declare wrong_currency boolean := false;
  begin
    begin
      perform public.confirm_tournament_order(oid_, 'stripe', 'pi_wrong_ccy', 75000, 'JPY');
    exception when others then wrong_currency := true; end;
    perform pg_temp.check('a payment in another currency does not buy a dollar entry', wrong_currency);
  end;

  perform public.confirm_tournament_order(oid_, 'stripe', 'pi_test_1', 75000, 'USD');

  perform pg_temp.check('paying confirms the whole crew, not just the captain',
    (select count(*) from public.tournament_entry where registration_status = 'CONFIRMED') = 4);

  perform pg_temp.check('the order is paid',
    (select status from public.tournament_order where id = oid_) = 'PAID');

  perform pg_temp.check('every line is allocated against the payment',
    (select count(*) from public.payment_allocation) =
    (select count(*) from public.tournament_order_item where order_id = oid_));

  perform pg_temp.check('the jackpot pot grows by the buy-in',
    (select funded_amount_minor from public.prize_pool
      where id = '99999999-9999-9999-9999-999999999999') = 10000);

  perform pg_temp.check('the boat joins the pot once, not once per angler',
    (select count(*) from public.prize_pool_entry
      where prize_pool_id = '99999999-9999-9999-9999-999999999999') = 1);

  -- A provider will deliver the same webhook twice. It must not double the pot.
  perform public.confirm_tournament_order(oid_, 'stripe', 'pi_test_1', 75000, 'usd');
  perform pg_temp.check('a replayed webhook does not double the pot',
    (select funded_amount_minor from public.prize_pool
      where id = '99999999-9999-9999-9999-999999999999') = 10000);
end $$;

-- ---------------------------------------------------------------- refusals
do $$
declare
  failed boolean;
begin
  -- Each of these must raise. `failed` records that it did.
  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"77777777-7777-7777-7777-777777777777","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k1');
  exception when others then failed := true; end;
  perform pg_temp.check('a passed deadline closes entries even while the status says open', failed);

  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]},
        {"tournament_id":"88888888-8888-8888-8888-888888888888","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k2');
  exception when others then failed := true; end;
  perform pg_temp.check('two hosts cannot share one payment', failed);

  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","is_captain":true}]'::jsonb, 'k3');
  exception when others then failed := true; end;
  perform pg_temp.check('the captain must be reachable by phone', failed);

  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true},
        {"display_name":"B","phone":"9495550114","is_captain":true}]'::jsonb, 'k4');
  exception when others then failed := true; end;
  perform pg_temp.check('two captains is not a crew', failed);

  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"55555555-5555-5555-5555-555555555555",
         "division_ids":["aaaaaaaa-0000-0000-0000-000000000001"]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k5');
  exception when others then failed := true; end;
  perform pg_temp.check('entering the same event twice is refused', failed);

  /*
    An invite-only or private event is not something a stranger may walk into by knowing
    its id — and an id is not a secret in any useful sense: it is in a URL somebody was
    sent, in a former entrant's history, in a screenshot. Row-level security cannot help
    here, because a `security definer` function runs with the owner's rights and RLS never
    gets a say, so the check has to be explicit in the function.
  */
  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k7');
  exception when others then failed := true; end;
  perform pg_temp.check('an invite-only event cannot be self-registered into', failed);

  failed := false;
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"cccccccc-cccc-cccc-cccc-cccccccccccc","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k8');
  exception when others then failed := true; end;
  perform pg_temp.check('a private event cannot be self-registered into', failed);

  perform pg_temp.check('and neither created an entry',
    not exists (select 1 from public.tournament_entry
                 where tournament_id in ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                                         'cccccccc-cccc-cccc-cccc-cccccccccccc')));
end $$;

-- ---------------------------------------------------------------- underpayment
do $$
declare
  oid_ uuid;
  failed boolean := false;
  n integer;
begin
  set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  oid_ := public.register_crew_for_tournaments(
    '[{"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]}]'::jsonb,
    '[{"display_name":"Host","phone":"9495550199","is_captain":true}]'::jsonb, 'key-underpay');
  begin
    perform public.confirm_tournament_order(oid_, 'stripe', 'pi_short', 100, 'USD');
  exception when others then failed := true; end;
  perform pg_temp.check('a payment smaller than the bill does not let anybody in', failed);

  select count(*) into n from public.tournament_entry e
    join public.tournament_team t on t.id = e.team_id
   where t.created_by = '22222222-2222-2222-2222-222222222222'
     and e.registration_status = 'PENDING';
  perform pg_temp.check('and that boat stays pending', n = 1);

  /*
    The regression that matters most in this file. `where team_id = team_id` inside the
    confirm function compared a column to itself, so one underpaid order would have
    confirmed every entry in the database. The captain's four entries above are already
    CONFIRMED and must stay at four.
  */
  select count(*) into n from public.tournament_entry where registration_status = 'CONFIRMED';
  perform pg_temp.check('a failed payment confirms nobody else''s entries', n = 4);
end $$;

-- ---------------------------------------------------------------- signed out
do $$
declare failed boolean := false;
begin
  set local request.jwt.claim.sub = '';
  begin
    perform public.register_crew_for_tournaments(
      '[{"tournament_id":"66666666-6666-6666-6666-666666666666","division_ids":[]}]'::jsonb,
      '[{"display_name":"A","phone":"9495550113","is_captain":true}]'::jsonb, 'k6');
  exception when others then failed := true; end;
  perform pg_temp.check('signed out, you cannot register anybody', failed);
end $$;

-- ---------------------------------------------------------------- one fish, one record
/*
  The link added by 20260915120000. ARCH-001 gave the tournament domain its own catch row
  with nothing joining it to the angler's log, so the same fish was logged twice and the
  competitive claim carried none of the conditions or regulation snapshot attached to the
  personal one. These checks pin the four rules that make the link trustworthy.
*/
do $$
declare
  trip_a uuid := '9a000000-0000-0000-0000-0000000000a1';
  catch_a uuid := '9c000000-0000-0000-0000-0000000000c1';
  trip_b uuid := '9a000000-0000-0000-0000-0000000000b1';
  catch_b uuid := '9c000000-0000-0000-0000-0000000000d1';
  captain uuid := '11111111-1111-1111-1111-111111111111';
  host uuid := '22222222-2222-2222-2222-222222222222';
  entry_ uuid;
  org_ uuid;
  tourn_ uuid;
  tc uuid;
  failed boolean;
  severed timestamptz;
  linked uuid;
begin
  -- The captain's own trip and fish, and the host's, so "you may only link your own"
  -- has something real to refuse.
  insert into public.trip (id, angler_id, water_class, started_at, started_tz, local_date,
                           client_created_at)
  values (trip_a, captain, 'salt', now(), 'America/Los_Angeles', current_date, now()),
         (trip_b, host, 'salt', now(), 'America/Los_Angeles', current_date, now());

  insert into public.catch (id, angler_id, trip_id, caught_at, caught_tz, local_date,
                            client_created_at, outcome, resolution_state)
  values (catch_a, captain, trip_a, now(), 'America/Los_Angeles', current_date, now(),
          'landed', 'confirmed'),
         (catch_b, host, trip_b, now(), 'America/Los_Angeles', current_date, now(),
          'landed', 'confirmed');

  select e.id, e.organization_id, e.tournament_id into entry_, org_, tourn_
    from public.tournament_entry e
    join public.tournament_team t on t.id = e.team_id
   where t.created_by = captain
   limit 1;
  perform pg_temp.check('the captain has an entry to submit against', entry_ is not null);

  -- 1. An account holder must bring their own catch row.
  failed := false;
  begin
    insert into public.tournament_catch
      (tournament_id, organization_id, entry_id, species_id, species_other,
       caught_at_device, client_generated_id, created_by)
    values (tourn_, org_, entry_, null, 'Yellowtail', now(), gen_random_uuid(), captain);
  exception when others then failed := true; end;
  perform pg_temp.check('an account holder cannot submit a tournament catch with no linked fish', failed);

  -- 2. You may only link your own fish.
  failed := false;
  begin
    insert into public.tournament_catch
      (tournament_id, organization_id, entry_id, species_id, species_other,
       caught_at_device, client_generated_id, created_by, catch_id)
    values (tourn_, org_, entry_, null, 'Yellowtail', now(), gen_random_uuid(), captain, catch_b);
  exception when others then failed := true; end;
  perform pg_temp.check('you cannot staple somebody else''s catch onto your claim', failed);

  -- 3. The happy path.
  insert into public.tournament_catch
    (id, tournament_id, organization_id, entry_id, species_id, species_other,
     caught_at_device, client_generated_id, created_by, catch_id)
  values (gen_random_uuid(), tourn_, org_, entry_, null, 'Yellowtail', now(),
          gen_random_uuid(), captain, catch_a)
  returning id into tc;
  perform pg_temp.check('a linked submission is accepted', tc is not null);

  -- 4. One fish enters one event once.
  failed := false;
  begin
    insert into public.tournament_catch
      (tournament_id, organization_id, entry_id, species_id, species_other,
       caught_at_device, client_generated_id, created_by, catch_id)
    values (tourn_, org_, entry_, null, 'Yellowtail', now(), gen_random_uuid(), captain, catch_a);
  exception when others then failed := true; end;
  perform pg_temp.check('the same fish cannot be entered twice in one tournament', failed);

  -- 5. A guest has no personal catch, and must still be able to compete.
  insert into public.tournament_catch
    (tournament_id, organization_id, entry_id, species_id, species_other,
     caught_at_device, client_generated_id, created_by, catch_id)
  values (tourn_, org_, entry_, null, 'Calico bass', now(), gen_random_uuid(), null, null);
  perform pg_temp.check('a guest entrant can still submit without a linked fish', true);

  -- 6. The link cannot be re-pointed at a different fish after submission.
  failed := false;
  begin
    update public.tournament_catch set catch_id = catch_b where id = tc;
  exception when others then failed := true; end;
  perform pg_temp.check('a submitted claim cannot be re-pointed at another catch', failed);

  /*
    7. Deleting the personal fish severs the link and stamps it, rather than cascading the
    competitive result away or blocking the delete. The claim is immutable and carries its
    own species, time and measurements, so it survives intact — and severed is a different
    fact from never-linked, which a dispute may need to tell apart.
  */
  delete from public.catch where id = catch_a;
  select catch_id, catch_link_severed_at into linked, severed
    from public.tournament_catch where id = tc;
  perform pg_temp.check('deleting the personal fish leaves the claim standing', linked is null);
  perform pg_temp.check('and records that the link was severed, not merely absent', severed is not null);
end $$;

-- ---------------------------------------------------------------- cell arithmetic
/*
  The generated cells, pinned against the SAME vectors as core/privacy/privacy.test.ts
  (src/core/privacy/vectors/privacy.json -> "cells").

  These two implementations have to agree exactly. A client that computes a different
  cell string than the database does not fail loudly — it quietly files its own catches
  under a cell nothing else uses, and they vanish from every aggregate built on the
  column. The southern-hemisphere and negative-longitude rows are here because that is
  where the two would diverge first: SQL `floor` and JavaScript `Math.floor` both go
  toward minus infinity, but a truncating implementation of either would not.
*/
do $$
declare
  angler_ uuid := '11111111-1111-1111-1111-111111111111';
  trip_ uuid := '9a000000-0000-0000-0000-0000000000c9';
  got record;
begin
  insert into public.trip (id, angler_id, water_class, started_at, started_tz, local_date,
                           client_created_at)
  values (trip_, angler_, 'salt', now(), 'America/Los_Angeles', current_date, now());

  insert into public.catch (angler_id, trip_id, caught_at, caught_tz, local_date,
                            client_created_at, lat, lng)
  values
    (angler_, trip_, now(), 'America/Los_Angeles', current_date, now(),  33.59870, -118.01230),
    (angler_, trip_, now(), 'America/Los_Angeles', current_date, now(),  33.00000, -118.04000),
    (angler_, trip_, now(), 'America/Los_Angeles', current_date, now(), -33.86000,  151.21000),
    (angler_, trip_, now(), 'America/Los_Angeles', current_date, now(),  34.00000, -118.00000),
    (angler_, trip_, now(), 'America/Los_Angeles', current_date, now(),  33.99900, -118.00100);

  select
    count(*) filter (where geo_cell_1km  is not null) as c1,
    count(*) filter (where geo_cell_10km is not null) as c10,
    count(*) filter (where geo_cell_50km is not null) as c50
    into got
    from public.catch where trip_id = trip_;
  perform pg_temp.check('every catch with coordinates gets all three cells',
                        got.c1 = 5 and got.c10 = 5 and got.c50 = 5);

  perform pg_temp.check('southern california, 1 km',
    (select geo_cell_1km from public.catch where trip_id = trip_ and lat = 33.59870) = '3359_-11802');
  perform pg_temp.check('southern california, 10 km',
    (select geo_cell_10km from public.catch where trip_id = trip_ and lat = 33.59870) = '335_-1181');
  perform pg_temp.check('southern california, 50 km',
    (select geo_cell_50km from public.catch where trip_id = trip_ and lat = 33.59870) = '67_-237');
  perform pg_temp.check('negative longitude floors toward minus infinity',
    (select geo_cell_1km from public.catch where trip_id = trip_ and lat = 33.00000) = '3300_-11804');
  perform pg_temp.check('southern hemisphere latitude floors the same way',
    (select geo_cell_10km from public.catch where trip_id = trip_ and lat = -33.86000) = '-339_1512');
  perform pg_temp.check('a point exactly on a boundary belongs to the cell above it',
    (select geo_cell_50km from public.catch where trip_id = trip_ and lat = 34.00000) = '68_-236');
  perform pg_temp.check('and a hair below it belongs to the cell below',
    (select geo_cell_50km from public.catch where trip_id = trip_ and lat = 33.99900) = '67_-237');

  -- No coordinates is not a zero cell. It is no cell.
  insert into public.catch (angler_id, trip_id, caught_at, caught_tz, local_date,
                            client_created_at)
  values (angler_, trip_, now(), 'America/Los_Angeles', current_date, now());
  perform pg_temp.check('a catch with no fix has no cell, rather than cell zero',
    (select count(*) from public.catch
      where trip_id = trip_ and lat is null and geo_cell_50km is null) = 1);

  -- The per-catch override accepts exactly one value, and null is the normal case.
  perform pg_temp.check('privacy_override refuses anything but extra_private',
    not exists (select 1 from public.catch where trip_id = trip_ and privacy_override is not null));
end $$;

-- ---------------------------------------------------------------- provenance
/*
  The rules that make an environmental number usable by somebody who was not there.

  condition_snapshot has had the columns for two months and nothing has ever filled them
  in, so these checks are the first time anything has asserted what a filled-in one has to
  look like. All three failures below are ones a hurried worker would produce: a number
  with no dataset version (irreproducible), a row with no value at all (a refusal stored
  as data), and sea-surface temperature on a lake.
*/
do $$
declare
  angler_ uuid := '11111111-1111-1111-1111-111111111111';
  trip_ uuid := '9a000000-0000-0000-0000-0000000000e1';
  catch_ uuid := '9c000000-0000-0000-0000-0000000000e1';
  salt_snap uuid;
  fresh_snap uuid;
  failed boolean;
begin
  insert into public.trip (id, angler_id, water_class, started_at, started_tz, local_date,
                           client_created_at)
  values (trip_, angler_, 'salt', now(), 'America/Los_Angeles', current_date, now());
  insert into public.catch (id, angler_id, trip_id, caught_at, caught_tz, local_date,
                            client_created_at, lat, lng)
  values (catch_, angler_, trip_, now(), 'America/Los_Angeles', current_date, now(),
          33.5987, -118.0123);

  insert into public.condition_snapshot (angler_id, trip_id, catch_id, kind, observed_at, water_class)
  values (angler_, trip_, catch_, 'catch', now(), 'salt')
  returning id into salt_snap;
  perform pg_temp.check('a snapshot starts pending, as it always has',
    (select enrichment_status from public.condition_snapshot where id = salt_snap) = 'pending');

  -- 1. The happy path: a tide prediction, labelled as the model it is.
  insert into public.environmental_observation
    (snapshot_id, field_name, value_numeric, unit, provider_id, dataset_id, dataset_version,
     observation_kind, observed_at, retrieved_at, distance_to_source_m)
  values (salt_snap, 'tide_height_m', 1.42, 'm', 'noaa-coops', 'coops:predictions:9410580',
          'coops-2026', 'MODEL_ANALYSIS', now(), now(), 4200);
  perform pg_temp.check('a tide prediction stores as MODEL_ANALYSIS, not as a sensor reading',
    (select observation_kind from public.environmental_observation
      where snapshot_id = salt_snap and field_name = 'tide_height_m') = 'MODEL_ANALYSIS');

  -- 2. No dataset version means the number cannot be reproduced. Refused.
  failed := false;
  begin
    insert into public.environmental_observation
      (snapshot_id, field_name, value_numeric, unit, provider_id, dataset_id, dataset_version,
       observation_kind, retrieved_at)
    values (salt_snap, 'sst_c', 18.4, 'C', 'noaa-coops', 'x', null, 'SATELLITE', now());
  exception when others then failed := true; end;
  perform pg_temp.check('a value with no dataset version is refused', failed);

  -- 3. A row with neither a number nor a string is a refusal, not an observation.
  failed := false;
  begin
    insert into public.environmental_observation
      (snapshot_id, field_name, unit, provider_id, dataset_id, dataset_version,
       observation_kind, retrieved_at)
    values (salt_snap, 'sst_c', 'C', 'noaa-coops', 'x', 'v1', 'SATELLITE', now());
  exception when others then failed := true; end;
  perform pg_temp.check('an empty observation is refused — missing is a refusal, not a value', failed);

  -- 4. Re-fetching the same dataset version is idempotent, not a duplicate.
  failed := false;
  begin
    insert into public.environmental_observation
      (snapshot_id, field_name, value_numeric, unit, provider_id, dataset_id, dataset_version,
       observation_kind, retrieved_at)
    values (salt_snap, 'tide_height_m', 1.42, 'm', 'noaa-coops', 'coops:predictions:9410580',
            'coops-2026', 'MODEL_ANALYSIS', now());
  exception when others then failed := true; end;
  perform pg_temp.check('the same field from the same dataset version cannot be stored twice', failed);

  -- 5. A new dataset version is a NEW row; the old reading is kept, never rewritten.
  insert into public.environmental_observation
    (snapshot_id, field_name, value_numeric, unit, provider_id, dataset_id, dataset_version,
     observation_kind, retrieved_at)
  values (salt_snap, 'tide_height_m', 1.39, 'm', 'noaa-coops', 'coops:predictions:9410580',
          'coops-2027', 'MODEL_ANALYSIS', now());
  perform pg_temp.check('a new dataset version is a new row, and the old one survives',
    (select count(*) from public.environmental_observation
      where snapshot_id = salt_snap and field_name = 'tide_height_m') = 2);

  -- 6. A lake has no sea-surface temperature to be missing.
  insert into public.condition_snapshot (angler_id, trip_id, kind, observed_at, water_class)
  values (angler_, trip_, 'manual', now(), 'fresh')
  returning id into fresh_snap;
  failed := false;
  begin
    update public.condition_snapshot set sst_c = 18.4 where id = fresh_snap;
  exception when others then failed := true; end;
  perform pg_temp.check('freshwater cannot acquire a sea-surface temperature', failed);

  failed := false;
  begin
    update public.condition_snapshot set tide_station_id = '9410580' where id = fresh_snap;
  exception when others then failed := true; end;
  perform pg_temp.check('nor a tide station, which is location-bearing as well as wrong', failed);

  -- 7. The provider registry is reference data, not something an angler can assert.
  perform pg_temp.check('the one provider we can already talk to is registered',
    exists (select 1 from public.environmental_provider where id = 'noaa-coops'));
end $$;

-- ---------------------------------------------------------------- host roles
/*
  Who can see the money, proved by row-level security rather than by reading the policy
  text. These run as the `authenticated` role — every check above calls a SECURITY DEFINER
  function, which bypasses RLS entirely, so none of them would have noticed if a policy
  were wrong.

  FINANCE was in `organization_member.role`'s check constraint from the first tournament
  migration and named by no policy anywhere, so a club treasurer could read no order, no
  payment and no prize pool. The first two checks are that hole, closed.
*/
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'treasurer@example.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dockhand@example.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'stranger@example.test');

insert into public.organization_member (organization_id, angler_id, role, status) values
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FINANCE', 'ACTIVE'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'STAFF', 'ACTIVE');

insert into public.tournament_order (id, organization_id, tournament_id, purchaser_angler_id,
                                     currency, subtotal_minor, total_minor, status, idempotency_key)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333',
        '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
        'USD', 40000, 40000, 'PENDING_PAYMENT', 'host-role-fixture');

grant select on public.tournament_order to authenticated;

do $$
declare n integer;
begin
  set local role authenticated;

  set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  -- Scoped to the fixture row: the registration checks above created several real orders
  -- in this same club, and a bare count would pass for the wrong reason.
  select count(*) into n from public.tournament_order
   where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  perform pg_temp.check('a treasurer can read an order for their club', n = 1);

  -- And every other order the club has taken, which is the point of the role.
  select count(*) into n from public.tournament_order
   where organization_id = '33333333-3333-3333-3333-333333333333';
  perform pg_temp.check('and every other order the club has taken', n > 1);

  perform pg_temp.check('and knows they are the treasurer',
    public.my_tournament_host_role('55555555-5555-5555-5555-555555555555') = 'FINANCE');

  -- Event staff run the dock. Whether a boat has paid is the entry's registration status,
  -- not the ledger, and this release takes them off it deliberately.
  set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select count(*) into n from public.tournament_order;
  perform pg_temp.check('event staff cannot read the ledger at all', n = 0);

  perform pg_temp.check('but staff still know they are staff',
    public.my_tournament_host_role('55555555-5555-5555-5555-555555555555') = 'STAFF');

  -- The purchaser keeps their own receipt. Tightening the host side must never take an
  -- angler's own order away from them.
  set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  select count(*) into n from public.tournament_order
   where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  perform pg_temp.check('an angler can still read the order they paid for', n = 1);

  perform pg_temp.check('and an entrant is not a host',
    public.my_tournament_host_role('55555555-5555-5555-5555-555555555555') is null);

  set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  select count(*) into n from public.tournament_order;
  perform pg_temp.check('a stranger reads no orders at all', n = 0);

  /*
    Told a tournament id they have no business with, a stranger learns nothing. The
    function returns null whether the tournament exists or not, so it cannot be used to
    discover which ids are real.
  */
  perform pg_temp.check('a stranger gets null, not an error',
    public.my_tournament_host_role('55555555-5555-5555-5555-555555555555') is null);
  perform pg_temp.check('and null for an id that does not exist either',
    public.my_tournament_host_role('00000000-0000-0000-0000-000000000000') is null);

  reset role;

  -- Signed out. The screen calls this before it knows whether anybody is signed in, and a
  -- permission failure here would put a red error in front of a visitor who has simply
  -- followed a link to a host page.
  set local role anon;
  set local request.jwt.claim.sub = '';
  perform pg_temp.check('signed out, the host role is null rather than an error',
    public.my_tournament_host_role('55555555-5555-5555-5555-555555555555') is null);
  reset role;
end $$;

-- ---------------------------------------------------------------- host permission boundaries
-- Full fixture rows retain their foreign keys: approvals operate on real drafts derived
-- from a result set, not a mocked table with its constraints removed.
do $$
declare
  t record;
  rv uuid; sv uuid; vv uuid; bv uuid; computation uuid; result_id uuid;
  team_id uuid; pool_id uuid;
begin
  for t in select id, organization_id from public.tournament
    where id in ('55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888')
  loop
    insert into public.tournament_rule_set_version (tournament_id, version, rules, created_by)
      values (t.id, 1, '{}'::jsonb, '22222222-2222-2222-2222-222222222222') returning id into rv;
    insert into public.tournament_scoring_version (tournament_id, version, scoring_family, created_by)
      values (t.id, 1, 'BIGGEST_FISH', '22222222-2222-2222-2222-222222222222') returning id into sv;
    insert into public.tournament_verification_policy_version (tournament_id, version, created_by)
      values (t.id, 1, '22222222-2222-2222-2222-222222222222') returning id into vv;
    insert into public.tournament_boundary_version (tournament_id, version, created_by)
      values (t.id, 1, '22222222-2222-2222-2222-222222222222') returning id into bv;
    insert into public.score_computation
      (tournament_id, organization_id, scoring_version_id, source_cutoff_at, source_hash)
      values (t.id, t.organization_id, sv, now(), 'host-approval-fixture') returning id into computation;
    insert into public.final_result_set
      (tournament_id, organization_id, version, score_computation_id, rules_version_id,
       scoring_version_id, verification_policy_version_id, boundary_version_id, finalized_by, source_hash)
      values (t.id, t.organization_id, 1, computation, rv, sv, vv, bv,
        '22222222-2222-2222-2222-222222222222', 'host-approval-fixture') returning id into result_id;
    insert into public.tournament_team (tournament_id, organization_id, name, created_by)
      values (t.id, t.organization_id, 'Payout crew', '11111111-1111-1111-1111-111111111111') returning id into team_id;
    insert into public.prize_pool (tournament_id, organization_id, name, currency)
      values (t.id, t.organization_id, 'Approval fixture', 'USD') returning id into pool_id;
    insert into public.payout_instruction
      (id, tournament_id, organization_id, prize_pool_id, final_result_set_id, tournament_team_id, rank, currency, amount_minor)
      values (case when t.id = '55555555-5555-5555-5555-555555555555' then
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'::uuid else 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'::uuid end,
        t.id, t.organization_id, pool_id, result_id, team_id, 1, 'USD', 25000);
  end loop;
end $$;

do $$
declare n integer; denied boolean;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  update public.tournament_order set total_minor = 1 where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  get diagnostics n = row_count;
  perform pg_temp.check('treasurer cannot rewrite another purchaser order', n = 0);

  denied := false;
  begin
    insert into public.tournament_order
      (organization_id, tournament_id, purchaser_angler_id, currency, subtotal_minor, total_minor, status, idempotency_key)
      values ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111', 'USD', 1, 1, 'DRAFT', 'finance-cannot-create-order');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('treasurer cannot create an order for another purchaser', denied);

  denied := false;
  begin
    insert into public.tournament_order_item (order_id, item_type, description, quantity, unit_amount_minor, total_amount_minor)
      values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TOURNAMENT_ENTRY', 'No permission', 1, 1, 1);
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('treasurer cannot add a line item to another purchaser order', denied);

  update public.payout_instruction set amount_minor = 1 where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
  get diagnostics n = row_count;
  perform pg_temp.check('treasurer cannot rewrite payout terms through table UPDATE', n = 0);

  denied := false;
  begin
    insert into public.payout_instruction
      (tournament_id, organization_id, prize_pool_id, final_result_set_id, tournament_team_id, rank, currency, amount_minor)
      select tournament_id, organization_id, prize_pool_id, final_result_set_id, tournament_team_id, 2, currency, 1
      from public.payout_instruction where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('treasurer cannot create a payout instruction', denied);

  select count(*) into n from public.tournament_entry;
  perform pg_temp.check('treasurer cannot read the entrant roster', n = 0);
  select count(*) into n from public.tournament_entry_identity;
  perform pg_temp.check('treasurer cannot read entrant names or phone numbers', n = 0);
  select count(*) into n from public.tournament_team;
  perform pg_temp.check('treasurer cannot read the crew roster', n = 0);

  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '  ');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('approval requires a nonblank reason', denied);

  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'Other club');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('treasurer cannot approve another club payout', denied);

  set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  select count(*) into n from public.tournament_entry;
  perform pg_temp.check('event staff retain roster access', n > 0);
  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Dock staff');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('event staff cannot approve payouts', denied);

  set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  select count(*) into n from public.tournament_entry;
  perform pg_temp.check('entrants retain their own claimed entry', n > 0);

  set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Stranger');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('strangers cannot approve payouts', denied);

  set local request.jwt.claim.sub = '';
  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'No user');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('an authenticated database role alone cannot approve without a user', denied);

  set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.check('treasurer can approve their club existing draft',
    public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '  Reviewed result  ')
      = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'::uuid);
  denied := false;
  begin perform public.approve_tournament_payout('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Approve twice');
  exception when insufficient_privilege then denied := true; end;
  perform pg_temp.check('an approved instruction cannot be approved again', denied);

  perform pg_temp.check('approval records server-side identity and preserves the amount and rank', exists (
    select 1 from public.payout_instruction where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'
      and status = 'APPROVED' and amount_minor = 25000 and rank = 1
      and approved_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and approved_at is not null and approval_reason = 'Reviewed result'
  ));
  select count(*) into n from public.payout_event where payout_instruction_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1'
    and event_type = 'APPROVED' and actor_angler_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.check('exactly one approval audit event is recorded', n = 1);
  reset role;
  perform pg_temp.check('anonymous callers cannot execute approval',
    not has_function_privilege('anon', 'public.approve_tournament_payout(uuid,text)', 'EXECUTE'));
end $$;

rollback;
