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
  or public.is_organization_member(organization_id, array['OWNER','ADMIN'])
) with check (
  purchaser_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN'])
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
    or public.is_organization_member(o.organization_id, array['OWNER','ADMIN'])
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
using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

-- FINANCE can approve an existing draft, not create or rewrite its economic terms.
-- The definer boundary is needed because that role has no direct table write policy.
-- All authorization and the only permitted transition happen in one atomic UPDATE.
create or replace function public.approve_tournament_payout(
  target_instruction_id uuid, reason text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_id uuid;
begin
  if auth.uid() is null or nullif(btrim(reason), '') is null then
    raise exception 'An authenticated approver and a reason are required' using errcode = '42501';
  end if;

  update public.payout_instruction
     set status = 'APPROVED', approved_by = auth.uid(), approved_at = now(),
         approval_reason = btrim(reason)
   where id = target_instruction_id
     and status = 'DRAFT'
     and public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE'])
  returning id into approved_id;

  if approved_id is null then
    raise exception 'Payout is not approvable' using errcode = '42501';
  end if;

  insert into public.payout_event (payout_instruction_id, event_type, actor_angler_id, reason)
  values (approved_id, 'APPROVED', auth.uid(), btrim(reason));
  return approved_id;
end;
$$;
revoke all on function public.approve_tournament_payout(uuid, text) from public, anon;
grant execute on function public.approve_tournament_payout(uuid, text) to authenticated;

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

-- A hidden roster tab must also be inaccessible through direct database requests.
-- Entrants keep access to their own claimed entry, even if they also hold FINANCE.
create or replace function public.can_read_tournament_entry(target_entry_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tournament_entry e
    left join public.tournament_entry_identity i on i.tournament_entry_id = e.id
    where e.id = target_entry_id and e.deleted_at is null
      and (public.is_organization_member(e.organization_id, array['OWNER','ADMIN','STAFF'])
        or i.claimed_angler_id = auth.uid())
  );
$$;
revoke all on function public.can_read_tournament_entry(uuid) from public;
grant execute on function public.can_read_tournament_entry(uuid) to authenticated;

drop policy if exists tournament_team_org_read on public.tournament_team;
create policy tournament_team_org_read on public.tournament_team
for select to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

drop policy if exists tournament_boat_org_read on public.tournament_boat;
create policy tournament_boat_org_read on public.tournament_boat
for select to authenticated
using (public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

drop policy if exists boat_owner_or_org_read on public.boat;
create policy boat_owner_or_org_read on public.boat
for select to authenticated
using (owner_angler_id = auth.uid()
  or public.is_organization_member(organization_id, array['OWNER','ADMIN','STAFF']));

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
