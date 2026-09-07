-- Host roles that mean something.
--
-- `organization_member.role` has allowed OWNER, ADMIN, STAFF and FINANCE since the first
-- tournament migration. Three of them are used by policies. FINANCE is named by nothing:
-- `grep -n FINANCE supabase/migrations/` outside the check constraint returned no rows
-- before this file. Granting it to a club treasurer therefore gave them strictly less than
-- STAFF — they could not read an order, a payment, a refund or a prize pool — so the only
-- way to let somebody handle the money was to make them an ADMIN, which also hands over
-- the rules, the scoring and the power to cancel the event.
--
-- This makes the money roles OWNER, ADMIN and FINANCE everywhere, uniformly, and takes
-- STAFF off the order tables. That last part is a reduction, and it is deliberate: event
-- staff run the dock, and whether a boat has paid is `tournament_entry.registration_status`,
-- not the ledger. Nothing in the application read `tournament_order` as staff, so the
-- change removes an unused capability rather than a working screen. An entrant's read of
-- their own order is untouched: it hangs off `purchaser_angler_id = auth.uid()`.
--
-- `src/core/tournaments/host-role.sql.test.ts` reads the role arrays below and fails if
-- the screen's capability table and these policies ever disagree.

-- Money reads: the ledger, in every table it is spread across.

drop policy if exists tournament_order_owner_read on public.tournament_order;
create policy tournament_order_owner_read on public.tournament_order
for select to authenticated using (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE'])
);

drop policy if exists tournament_order_owner_write on public.tournament_order;
create policy tournament_order_owner_write on public.tournament_order
for all to authenticated using (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE'])
) with check (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE'])
);

drop policy if exists tournament_order_item_read on public.tournament_order_item;
create policy tournament_order_item_read on public.tournament_order_item
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists tournament_order_item_insert on public.tournament_order_item;
create policy tournament_order_item_insert on public.tournament_order_item
for insert to authenticated with check (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists financial_org_read on public.payment;
create policy financial_org_read on public.payment
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists payment_attempt_read on public.payment_attempt;
create policy payment_attempt_read on public.payment_attempt
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists payment_allocation_read on public.payment_allocation;
create policy payment_allocation_read on public.payment_allocation
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists payment_refund_read on public.payment_refund;
create policy payment_refund_read on public.payment_refund
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (
    o.purchaser_angler_id = auth.uid()
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists platform_fee_admin_read on public.platform_fee;
create policy platform_fee_admin_read on public.platform_fee
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id
    and public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
));

drop policy if exists financial_event_admin_read on public.financial_event;
create policy financial_event_admin_read on public.financial_event
for select to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']));

-- Payouts. Reading them is a money read; approving one is the separate, deliberate act
-- the operations screen has always described, and it is the one thing besides reading
-- that FINANCE is for.

drop policy if exists payout_instruction_finance_read on public.payout_instruction;
create policy payout_instruction_finance_read on public.payout_instruction
for select to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']));

drop policy if exists payout_instruction_finance_write on public.payout_instruction;
create policy payout_instruction_finance_write on public.payout_instruction
for all to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']));

drop policy if exists payout_finance_read on public.payout;
create policy payout_finance_read on public.payout
for select to authenticated using (exists (
  select 1 from public.payout_instruction pi
   where pi.id = payout_instruction_id
     and public.is_organization_member(pi.organization_id, array['OWNER','ADMIN','FINANCE'])
));

drop policy if exists payout_event_finance_read on public.payout_event;
create policy payout_event_finance_read on public.payout_event
for select to authenticated using (exists (
  select 1 from public.payout_instruction pi
   where pi.id = payout_instruction_id
     and public.is_organization_member(pi.organization_id, array['OWNER','ADMIN','FINANCE'])
));

-- Which role am I, for this tournament?
--
-- The host screen needs the answer before it can decide what to render, and it cannot get
-- there by reading `tournament`: a non-member's select on that table returns nothing, so
-- "no row" would be indistinguishable from "no such tournament" and every stranger would
-- see a loading state resolve into a blank host page.
--
-- SECURITY DEFINER, so it must state its own authorization, and it does: the only row it
-- can ever look at is the caller's own membership. It returns a role or null and nothing
-- else — not the organisation, not who else is on the team, not whether the tournament
-- exists. Told an id they have no business with, a stranger learns exactly what they
-- already knew, which is that they are not on it.
create or replace function public.my_tournament_host_role(target_tournament_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
    from public.tournament t
    join public.organization_member m
      on m.organization_id = t.organization_id
   where t.id = target_tournament_id
     and t.deleted_at is null
     and m.angler_id = auth.uid()
     and m.status = 'ACTIVE'
     and m.deleted_at is null
   limit 1;
$$;

revoke all on function public.my_tournament_host_role(uuid) from public;
grant execute on function public.my_tournament_host_role(uuid) to authenticated;
/*
  `anon` too, deliberately. A signed-out visitor on a host URL has `auth.uid()` of null, so
  the join can never match and the function returns null — the same answer an entrant gets,
  carrying no information about anything. Without the grant the call fails on permissions
  instead, and the screen would show a signed-out visitor a red error where it should show
  them the way back to the event.
*/
grant execute on function public.my_tournament_host_role(uuid) to anon;

comment on function public.my_tournament_host_role(uuid) is
  'The calling angler''s active organisation role for a tournament, or null. Reveals nothing about anyone else.';
