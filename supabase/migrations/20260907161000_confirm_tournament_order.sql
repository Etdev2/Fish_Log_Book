/*
  Turning a paid order into live entries.

  **This function is not callable by an angler, and that is the whole point.** Registration
  creates PENDING entries and a PENDING_PAYMENT order; the only thing that activates them is
  a confirmed payment. If the browser could call this, anybody could register for every
  event in the app for nothing — the client would simply skip the paying and call the
  confirming. So `authenticated` is not granted execute. It runs from the service role: a
  Stripe webhook, or a server-side on-chain observation.

  That has a consequence worth stating plainly rather than discovering: until that webhook
  exists, entries stay PENDING after a test-mode payment. The screens say so. A PENDING
  entry that claims to be confirmed would be the single worst lie this app could tell an
  angler standing on a dock at 5am.

  Idempotent on `provider_payment_id`, because a payment provider will deliver the same
  webhook more than once and paying twice must not double the pot.
*/

create or replace function public.confirm_tournament_order(
  target_order_id uuid,
  provider_name text,
  provider_reference text,
  paid_amount_minor bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.tournament_order;
  existing_payment_id uuid;
  new_payment_id uuid;
  item public.tournament_order_item;
  /*
    Named `item_team_id`, not `team_id`. A PL/pgSQL variable that shares a name with a
    column silently shadows it, so `where team_id = team_id` compares the column to itself
    and is true for every row — this exact line, before it was renamed, would have confirmed
    every entry in the database on any payment. Prefixed names are the cheap defence.
  */
  item_team_id uuid;
  item_entry_id uuid;
begin
  select * into target from public.tournament_order where id = target_order_id;
  if target.id is null then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  -- Replayed webhook: the same provider payment lands again. Return what it already did.
  select id into existing_payment_id
    from public.payment
   where provider = provider_name
     and provider_payment_id = provider_reference;
  if existing_payment_id is not null then
    return existing_payment_id;
  end if;

  /*
    Refuse to activate an order for less than it costs. A provider that reports a smaller
    amount than the bill is either a partial payment or a mismatched reference, and both are
    reasons to stop rather than to let somebody into a $400 tournament for $4.
  */
  if paid_amount_minor < target.total_minor then
    raise exception 'payment of % does not cover the order total of %',
      paid_amount_minor, target.total_minor using errcode = 'check_violation';
  end if;

  insert into public.payment (
    organization_id, order_id, provider, provider_payment_id,
    currency, amount_minor, status, confirmed_at
  ) values (
    target.organization_id, target.id, provider_name, provider_reference,
    target.currency, paid_amount_minor, 'CONFIRMED', now()
  ) returning id into new_payment_id;

  update public.tournament_order
     set status = 'PAID', updated_at = now()
   where id = target.id;

  for item in
    select * from public.tournament_order_item where order_id = target.id
  loop
    insert into public.payment_allocation (payment_id, order_item_id, amount_minor, allocation_kind)
    values (new_payment_id, item.id, item.total_amount_minor, 'ORDER_ITEM');

    item_team_id := nullif(item.metadata->>'tournament_team_id', '')::uuid;
    item_entry_id := nullif(item.metadata->>'tournament_entry_id', '')::uuid;

    /*
      An entry line is bought by the boat, so it confirms the boat: every entry on that
      team, which is one per angler. Confirming only the captain would leave the rest of
      the crew pending on a paid order — registered as nobody, on the water.
    */
    if item.item_type in ('TEAM_ENTRY', 'BOAT_ENTRY', 'TOURNAMENT_ENTRY') and item_team_id is not null then
      update public.tournament_entry e
         set registration_status = 'CONFIRMED', updated_at = now()
       where e.team_id = item_team_id;
    end if;

    /*
      A jackpot buy-in joins its pot only now. Creating the `prize_pool_entry` at
      registration would have counted unpaid entrants in the "34 in" that the next angler
      reads when deciding whether the pot is worth it.
    */
    if item.item_type in ('JACKPOT', 'SIDE_POT') and item_entry_id is not null then
      if nullif(item.metadata->>'prize_pool_id', '') is not null then
        insert into public.prize_pool_entry (
          prize_pool_id, tournament_entry_id, participation_status,
          contribution_amount_minor, funding_reference_type, funding_reference_id
        ) values (
          (item.metadata->>'prize_pool_id')::uuid, item_entry_id, 'ACTIVE',
          item.total_amount_minor, 'PAYMENT', new_payment_id
        )
        on conflict (prize_pool_id, tournament_entry_id) do nothing;

        update public.prize_pool
           set funded_amount_minor = funded_amount_minor + item.total_amount_minor,
               funding_status = 'PARTIALLY_FUNDED',
               updated_at = now()
         where id = (item.metadata->>'prize_pool_id')::uuid;
      end if;
    end if;
  end loop;

  /*
    A free event produces no priced line at all, and an angler who entered one is entered.
    Confirm every pending entry on any team this order created, so a boat that paid $100 for
    a jackpot on a free event does not end up with a paid jackpot and an unconfirmed crew.
  */
  update public.tournament_entry e
     set registration_status = 'CONFIRMED', updated_at = now()
   where e.registration_status = 'PENDING'
     and e.team_id in (
       select distinct nullif(i.metadata->>'tournament_team_id', '')::uuid
         from public.tournament_order_item i
        where i.order_id = target.id
          and nullif(i.metadata->>'tournament_team_id', '') is not null
     );

  return new_payment_id;
end;
$$;

/*
  No grant to `authenticated`. See the header — this is the line that stops the checkout
  being free. `service_role` bypasses RLS and function grants in Supabase, so the webhook
  can call it without one; spelling out the revoke keeps the intent visible to the next
  person to read this file.
*/
revoke all on function public.confirm_tournament_order(uuid, text, text, bigint) from public;
revoke all on function public.confirm_tournament_order(uuid, text, text, bigint) from anon;
revoke all on function public.confirm_tournament_order(uuid, text, text, bigint) from authenticated;

comment on function public.confirm_tournament_order(uuid, text, text, bigint) is
  'Activates the entries on a paid order. Service role only — an angler who could call this would never need to pay.';
