/*
  Registering a crew for one or more events, as a single transaction.

  Why a function and not inserts from the browser: `tournament_entry` is writable only by
  OWNER/ADMIN/STAFF of the owning organisation (20260905190000), which is correct — an
  angler must not be able to write arbitrary entries. Self-registration therefore has to go
  through a definer function that decides, in one place, exactly what an angler may create
  for themselves. `register_self_for_tournament` already does that for a bare one-person
  entry; this is the same idea for the flow the product actually has: a crew, a captain, a
  basket of events and jackpots, and a bill.

  Why one transaction: ADR 010 §1 makes a registration all-or-nothing. Six inserts issued
  separately from a browser can half-succeed — a phone loses signal between the entry and
  its identities and an angler is registered as nobody. Inside a function they commit
  together or not at all.

  What it deliberately does NOT do is take money or confirm anything. Everything it creates
  is PENDING. Activation happens in `confirm_tournament_order`, which is not callable by an
  angler — see the note there.

  **The shape of a crew, which the schema decides and not this function.**
  `tournament_entry_one_identity` is a unique index: an entry holds exactly ONE person. A
  boat is therefore a `tournament_team` grouping one entry per angler, with the captain
  flagged on `tournament_team_member.role`. Three anglers across two events is six entries
  and two teams, which looks like a lot until you notice it is the only shape in which a
  crew member can be scored, disqualified or claim their own catches independently.

  The money does not multiply with the crew. One boat pays one entry fee per event — a
  `TEAM_ENTRY` line, not one line per angler — and a jackpot is bought by the boat once.
  That is what the schema's separate `TEAM_ENTRY` item type is for, and it matches how these
  events are actually sold.
*/

create or replace function public.register_crew_for_tournaments(
  registrations jsonb,
  crew jsonb,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  reg jsonb;
  member jsonb;
  captain_count integer := 0;
  captain_digits integer := 0;
  target public.tournament;
  organization uuid;
  order_currency text;
  new_order_id uuid;
  existing_order_id uuid;
  new_entry_id uuid;
  new_team_id uuid;
  captain_entry_id uuid;
  running_total bigint := 0;
  division public.tournament_division;
  division_id uuid;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if idempotency_key is null or length(btrim(idempotency_key)) = 0 then
    raise exception 'idempotency key required' using errcode = 'check_violation';
  end if;

  if registrations is null or jsonb_typeof(registrations) <> 'array'
     or jsonb_array_length(registrations) = 0 then
    raise exception 'choose at least one event' using errcode = 'check_violation';
  end if;

  if crew is null or jsonb_typeof(crew) <> 'array' or jsonb_array_length(crew) = 0 then
    raise exception 'a crew needs at least one angler' using errcode = 'check_violation';
  end if;

  /*
    The same three crew rules the form enforces (`core/tournaments/registration.ts`), stated
    again here because a client-side check is a courtesy and a server-side one is the rule.
    The phone test is "enough digits to dial", not a format: international numbers and
    "(cell)" are both real, and rejecting a number a host can actually ring in order to
    enforce a pattern is the wrong trade.
  */
  for member in select * from jsonb_array_elements(crew) loop
    if length(btrim(coalesce(member->>'display_name', ''))) = 0 then
      raise exception 'every angler needs a name' using errcode = 'check_violation';
    end if;
    if coalesce((member->>'is_captain')::boolean, false) then
      captain_count := captain_count + 1;
      captain_digits := length(regexp_replace(coalesce(member->>'phone', ''), '\D', '', 'g'));
    end if;
  end loop;

  if captain_count <> 1 then
    raise exception 'exactly one captain is required' using errcode = 'check_violation';
  end if;
  if captain_digits < 7 then
    raise exception 'the captain needs a contact number' using errcode = 'check_violation';
  end if;

  /*
    Idempotency comes FIRST, before any validation.

    It is a money property, not a nicety: a double-tapped Pay button, or a client retrying
    after a dropped response, must not produce two orders and two sets of entries. Putting
    it after the checks was a real bug and the database found it — the retry reached the
    "you are already entered" guard, which is true precisely BECAUSE the first call
    succeeded, and the caller got an error instead of the order it had already paid for.

    Scoped to the purchasing angler rather than the organisation, because the organisation
    is not known until the events have been read, and a key is minted per attempt by one
    client anyway.
  */
  select id into existing_order_id
    from public.tournament_order
   where tournament_order.idempotency_key = btrim(register_crew_for_tournaments.idempotency_key)
     and purchaser_angler_id = uid;
  if existing_order_id is not null then
    return existing_order_id;
  end if;

  /*
    Every event on one order must belong to one organisation, because `tournament_order`
    holds a single `organization_id` — and that is right, not a limitation to design around:
    one card charge cannot pay two different hosts, and a refund from a shared basket would
    have no single party to come from. A basket spanning hosts is two registrations.
  */
  for reg in select * from jsonb_array_elements(registrations) loop
    select * into target
      from public.tournament
     where id = (reg->>'tournament_id')::uuid
       and deleted_at is null;

    if target.id is null then
      raise exception 'tournament not found' using errcode = 'P0002';
    end if;
    if target.status <> 'REGISTRATION_OPEN' then
      raise exception 'registration is not open for %', target.name using errcode = 'check_violation';
    end if;

    /*
      Only an event that is offering itself publicly may be self-registered into.

      Without this, holding a tournament's id was enough to enter a PRIVATE or INVITE_ONLY
      event — the id is not a secret in any useful sense (it is in a URL somebody was sent,
      in a former entrant's history, in a screenshot), and "invite only" would have meant
      nothing. Row-level security does not cover it either: this is a `security definer`
      function, so it runs with the owner's rights and RLS never gets a say. The check has
      to be here, explicitly.

      Private and invite-only events are still filled — by the organiser, through the
      admin path that `tournament_entry`'s OWNER/ADMIN/STAFF policy already guards.
    */
    if target.visibility not in ('PUBLIC', 'UNLISTED') then
      raise exception 'this event is not open to self-registration'
        using errcode = '42501';
    end if;
    -- The deadline is enforced by the clock, not by whoever last set the status column.
    if target.registration_closes_at is not null and target.registration_closes_at <= now() then
      raise exception 'entries have closed for %', target.name using errcode = 'check_violation';
    end if;

    if organization is null then
      organization := target.organization_id;
      order_currency := target.currency;
    elsif organization <> target.organization_id then
      raise exception 'these events have different hosts, so they cannot share one payment'
        using errcode = 'check_violation';
    elsif order_currency is distinct from target.currency then
      raise exception 'these events are priced in different currencies'
        using errcode = 'check_violation';
    end if;

    -- Entering twice is a mistake, not an intention, and it would be charged for twice.
    if exists (
      select 1
        from public.tournament_entry e
        join public.tournament_entry_identity i on i.tournament_entry_id = e.id
       where e.tournament_id = target.id
         and e.deleted_at is null
         and i.claimed_angler_id = uid
    ) then
      raise exception 'you are already entered in %', target.name using errcode = 'unique_violation';
    end if;
  end loop;

  insert into public.tournament_order (
    organization_id, tournament_id, purchaser_angler_id, currency,
    subtotal_minor, total_minor, status, idempotency_key
  ) values (
    organization,
    (registrations->0->>'tournament_id')::uuid,
    uid,
    coalesce(order_currency, 'USD'),
    0, 0, 'PENDING_PAYMENT',
    btrim(register_crew_for_tournaments.idempotency_key)
  ) returning id into new_order_id;

  for reg in select * from jsonb_array_elements(registrations) loop
    select * into target from public.tournament where id = (reg->>'tournament_id')::uuid;

    /*
      The boat. Named for the captain, because that is how a dock refers to it and because
      the schema wants a non-blank name that a person will recognise on a leaderboard.
    */
    insert into public.tournament_team (tournament_id, organization_id, name, created_by)
    values (
      target.id,
      target.organization_id,
      coalesce(
        nullif(btrim((select m->>'display_name' from jsonb_array_elements(crew) m
                       where coalesce((m->>'is_captain')::boolean, false) limit 1)), ''),
        'Crew'
      ),
      uid
    ) returning id into new_team_id;

    for member in select * from jsonb_array_elements(crew) loop
      insert into public.tournament_entry (
        tournament_id, organization_id, team_id, registration_status,
        eligibility_status, check_in_status, competition_status
      ) values (
        target.id, target.organization_id, new_team_id, 'PENDING',
        'UNKNOWN', 'NOT_CHECKED_IN', 'NOT_STARTED'
      ) returning id into new_entry_id;

      /*
        One identity per entry — the captain is the signed-in angler and is claimed;
        everyone else is a GUEST, because they have not signed in and claiming on their
        behalf would fail `registered_identity_has_angler`. A guest can claim later.
      */
      insert into public.tournament_entry_identity (
        tournament_entry_id, identity_type, display_name, email, phone,
        claimed_angler_id, claimed_at
      ) values (
        new_entry_id,
        case when coalesce((member->>'is_captain')::boolean, false) then 'REGISTERED_USER' else 'GUEST' end,
        btrim(member->>'display_name'),
        nullif(btrim(coalesce(member->>'email', '')), ''),
        nullif(btrim(coalesce(member->>'phone', '')), ''),
        case when coalesce((member->>'is_captain')::boolean, false) then uid else null end,
        case when coalesce((member->>'is_captain')::boolean, false) then now() else null end
      );

      insert into public.tournament_team_member (tournament_team_id, tournament_entry_id, role)
      values (
        new_team_id, new_entry_id,
        case when coalesce((member->>'is_captain')::boolean, false) then 'CAPTAIN' else 'MEMBER' end
      );

      if coalesce((member->>'is_captain')::boolean, false) then
        captain_entry_id := new_entry_id;
      end if;
    end loop;

    -- An unpriced event produces no line. Null is "the host has not said", and charging
    -- zero for it would tell the angler their entry is settled when it is not.
    if target.entry_fee_minor is not null then
      insert into public.tournament_order_item (
        order_id, item_type, reference_id, description, quantity,
        unit_amount_minor, total_amount_minor, metadata
      ) values (
        new_order_id, 'TEAM_ENTRY', target.id, target.name, 1,
        target.entry_fee_minor, target.entry_fee_minor,
        jsonb_build_object('tournament_team_id', new_team_id)
      );
      running_total := running_total + target.entry_fee_minor;
    end if;

    for division_id in
      select (value #>> '{}')::uuid from jsonb_array_elements(coalesce(reg->'division_ids', '[]'::jsonb))
    loop
      select * into division
        from public.tournament_division
       where id = division_id
         and tournament_id = target.id
         and deleted_at is null;

      if division.id is null then
        raise exception 'that jackpot is not part of %', target.name using errcode = 'P0002';
      end if;
      if not division.is_optional then
        raise exception '% is not something you opt into', division.name using errcode = 'check_violation';
      end if;

      -- A division with no fee is included in the entry: it is joined, not bought.
      if division.entry_fee_minor is not null then
        insert into public.tournament_order_item (
          order_id, item_type, reference_id, description, quantity,
          unit_amount_minor, total_amount_minor, metadata
        ) values (
          new_order_id,
          case when division.kind = 'SIDE_POT' then 'SIDE_POT' else 'JACKPOT' end,
          division.id,
          target.name || ' — ' || division.name,
          1,
          division.entry_fee_minor, division.entry_fee_minor,
          jsonb_build_object(
            'tournament_team_id', new_team_id,
            -- The boat buys in once, and the pot records the captain's entry as the holder.
            'tournament_entry_id', captain_entry_id,
            'prize_pool_id', division.prize_pool_id
          )
        );
        running_total := running_total + division.entry_fee_minor;
      end if;
    end loop;
  end loop;

  update public.tournament_order
     set subtotal_minor = running_total,
         total_minor = running_total,
         updated_at = now()
   where id = new_order_id;

  return new_order_id;
end;
$$;

revoke all on function public.register_crew_for_tournaments(jsonb, jsonb, text) from public;
grant execute on function public.register_crew_for_tournaments(jsonb, jsonb, text) to authenticated;

comment on function public.register_crew_for_tournaments(jsonb, jsonb, text) is
  'Creates one order and one PENDING entry per event, with the crew on each, in a single transaction. Takes no money and confirms nothing.';
