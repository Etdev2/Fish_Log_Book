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
   '22222222-2222-2222-2222-222222222222');

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
  perform public.confirm_tournament_order(oid_, 'stripe', 'pi_test_1', 75000);

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
  perform public.confirm_tournament_order(oid_, 'stripe', 'pi_test_1', 75000);
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
    perform public.confirm_tournament_order(oid_, 'stripe', 'pi_short', 100);
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

rollback;
