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

-- Settings writes and lifecycle transitions belong to administrators, not dock staff.

drop policy if exists tournament_update_admin on public.tournament;
create policy tournament_update_admin
  on public.tournament for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

drop policy if exists tournament_division_admin on public.tournament_division;
create policy tournament_division_admin
  on public.tournament_division for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

drop policy if exists tournament_division_update_admin on public.tournament_division;
create policy tournament_division_update_admin
  on public.tournament_division for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

drop policy if exists tournament_award_category_admin on public.tournament_award_category;
create policy tournament_award_category_admin
  on public.tournament_award_category for insert to authenticated
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

drop policy if exists tournament_award_category_update_admin on public.tournament_award_category;
create policy tournament_award_category_update_admin
  on public.tournament_award_category for update to authenticated
  using (public.is_organization_member(organization_id, array['OWNER','ADMIN']))
  with check (public.is_organization_member(organization_id, array['OWNER','ADMIN']));

drop policy if exists tournament_rule_version_admin on public.tournament_rule_set_version;
create policy tournament_rule_version_admin
  on public.tournament_rule_set_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_rule_version_update_admin on public.tournament_rule_set_version;
create policy tournament_rule_version_update_admin
  on public.tournament_rule_set_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_scoring_version_admin on public.tournament_scoring_version;
create policy tournament_scoring_version_admin
  on public.tournament_scoring_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_scoring_version_update_admin on public.tournament_scoring_version;
create policy tournament_scoring_version_update_admin
  on public.tournament_scoring_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_verification_version_admin on public.tournament_verification_policy_version;
create policy tournament_verification_version_admin
  on public.tournament_verification_policy_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_verification_version_update_admin on public.tournament_verification_policy_version;
create policy tournament_verification_version_update_admin
  on public.tournament_verification_policy_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_boundary_version_admin on public.tournament_boundary_version;
create policy tournament_boundary_version_admin
  on public.tournament_boundary_version for insert to authenticated
  with check (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

drop policy if exists tournament_boundary_version_update_admin on public.tournament_boundary_version;
create policy tournament_boundary_version_update_admin
  on public.tournament_boundary_version for update to authenticated
  using (exists (select 1 from public.tournament t where t.id = tournament_id and public.is_organization_member(t.organization_id, array['OWNER','ADMIN'])));

create or replace function public.transition_tournament(
  target_tournament_id uuid,
  next_status text,
  transition_reason text default null
)
returns public.tournament
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.tournament;
begin
  select * into current_row
    from public.tournament
   where id = target_tournament_id
     and deleted_at is null
   for update;

  if current_row.id is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if not public.is_organization_member(current_row.organization_id, array['OWNER','ADMIN']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not public.tournament_transition_allowed(current_row.status, next_status) then
    raise exception 'invalid tournament transition: % -> %', current_row.status, next_status
      using errcode = 'check_violation';
  end if;

  if next_status = 'LIVE' and (
    current_row.active_rule_set_version_id is null
    or current_row.active_scoring_version_id is null
    or current_row.active_verification_policy_version_id is null
    or current_row.active_boundary_version_id is null
  ) then
    raise exception 'LIVE requires frozen rule, scoring, verification, and boundary versions'
      using errcode = 'check_violation';
  end if;

  if next_status = 'LIVE' then
    update public.tournament_rule_set_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_rule_set_version_id;
    update public.tournament_scoring_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_scoring_version_id;
    update public.tournament_verification_policy_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_verification_policy_version_id;
    update public.tournament_boundary_version
       set locked_at = coalesce(locked_at, now())
     where id = current_row.active_boundary_version_id;
  end if;

  insert into public.tournament_lifecycle_event (
    tournament_id, organization_id, from_status, to_status, actor_id, reason
  ) values (
    current_row.id, current_row.organization_id, current_row.status, next_status, auth.uid(), transition_reason
  );

  update public.tournament
     set status = next_status
   where id = current_row.id
  returning * into current_row;

  return current_row;
end;
$$;

-- The money matrix covers pools, contributions and crypto records as well as orders.

drop policy if exists prize_pool_org_read on public.prize_pool;
create policy prize_pool_org_read on public.prize_pool
for select to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']));

drop policy if exists prize_pool_entry_read on public.prize_pool_entry;
create policy prize_pool_entry_read on public.prize_pool_entry
for select to authenticated using (exists (
  select 1 from public.prize_pool pp where pp.id = prize_pool_id and public.is_organization_member(pp.organization_id, array['OWNER','ADMIN','FINANCE'])
));

drop policy if exists crypto_quote_read on public.crypto_payment_quote;
create policy crypto_quote_read on public.crypto_payment_quote
for select to authenticated using (exists (
  select 1 from public.tournament_order o where o.id = order_id and (
    o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE'])
  )
));

drop policy if exists crypto_payment_read on public.crypto_payment;
create policy crypto_payment_read on public.crypto_payment
for select to authenticated using (exists (
  select 1 from public.payment p join public.tournament_order o on o.id = p.order_id
  where p.id = payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE']))
));

drop policy if exists crypto_observation_read on public.crypto_chain_observation;
create policy crypto_observation_read on public.crypto_chain_observation
for select to authenticated using (exists (
  select 1 from public.crypto_payment cp
  join public.payment p on p.id = cp.payment_id
  join public.tournament_order o on o.id = p.order_id
  where cp.id = crypto_payment_id and (o.purchaser_angler_id = auth.uid() or public.is_organization_member(o.organization_id, array['OWNER','ADMIN','FINANCE']))
));

-- Whether the club's provider account can take charges and pay out is money state too
-- (ADR 011), so the treasurer reads it alongside the owner and admins.
drop policy if exists organizer_payment_account_admin_read on public.organizer_payment_account;
create policy organizer_payment_account_admin_read on public.organizer_payment_account
for select to authenticated using (public.is_organization_member(organization_id, array['OWNER','ADMIN','FINANCE']));

-- One statement snapshot of every order and confirmed refund, with no REST row limit.
-- SECURITY INVOKER retains the underlying table grants and RLS. Integer results cross
-- the JSON boundary as text, so the client can reject overflow before any rounding.
-- Public event pricing is already exposed through the tournament projection; this
-- read grant lets the invoker map jackpot lines while the member SELECT policy scopes it.
grant select on public.tournament_division to authenticated;
create or replace function public.tournament_money_totals(target_tournament_id uuid)
returns table (
  currency text, collected_minor text, outstanding_minor text,
  paid_orders text, unpaid_orders text, refunded_orders text
)
language plpgsql stable security invoker set search_path = ''
as $$
declare totals record;
begin
  if coalesce(public.my_tournament_host_role(target_tournament_id), '') not in ('OWNER','ADMIN','FINANCE') then
    raise exception 'Not authorized to read the tournament ledger' using errcode = '42501';
  end if;

  with lines as (
    select i.order_id, sum(i.total_amount_minor) as line_total,
      sum(case when (i.item_type in ('TEAM_ENTRY','TOURNAMENT_ENTRY') and t.id = target_tournament_id)
        or (i.item_type in ('JACKPOT','SIDE_POT') and d.tournament_id = target_tournament_id)
        then i.total_amount_minor else 0 end) as event_total,
      bool_or(case when i.item_type in ('TEAM_ENTRY','TOURNAMENT_ENTRY') then t.id is null
        when i.item_type in ('JACKPOT','SIDE_POT') then d.id is null else true end) as unmapped,
      -- An order must carry at least one line for the event in its own header. Without one,
      -- the header and lines disagree, and the money would land on whichever event asks.
      bool_or((i.item_type in ('TEAM_ENTRY','TOURNAMENT_ENTRY') and t.id = o.tournament_id)
        or (i.item_type in ('JACKPOT','SIDE_POT') and d.tournament_id = o.tournament_id)) as header_mapped
    from public.tournament_order_item i
    join public.tournament_order o on o.id = i.order_id
    left join public.tournament t on i.item_type in ('TEAM_ENTRY','TOURNAMENT_ENTRY') and t.id = i.reference_id
    left join public.tournament_division d on i.item_type in ('JACKPOT','SIDE_POT') and d.id = i.reference_id
    group by i.order_id
  ), refunds as (
    select p.order_id, sum(r.amount_minor) as amount
    from public.payment p join public.payment_refund r on r.payment_id = p.id
    where r.status = 'CONFIRMED' group by p.order_id
  ), ledger as (
    select o.currency, o.total_minor, o.status, coalesce(r.amount, 0) as refunded,
      case when li.order_id is null then o.total_minor else li.event_total end as event_minor,
      coalesce(li.unmapped or li.line_total <> o.total_minor
        or (o.tournament_id is not null and not li.header_mapped), false) as unmapped
    from public.tournament_order o left join refunds r on r.order_id = o.id
    left join lines li on li.order_id = o.id
    where o.tournament_id = target_tournament_id or li.event_total > 0
  )
  select min(l.currency) as currency, count(distinct l.currency) as currencies,
    coalesce(sum(case when l.status in ('PAID','PARTIALLY_REFUNDED','REFUNDED')
      then case when l.refunded = l.total_minor then 0
        else l.event_minor - l.refunded end else 0 end), 0)::text as collected_minor,
    coalesce(sum(case when l.status in ('DRAFT','PENDING_PAYMENT') then l.event_minor else 0 end), 0)::text as outstanding_minor,
    count(*) filter (where l.status in ('PAID','PARTIALLY_REFUNDED'))::text as paid_orders,
    count(*) filter (where l.status in ('DRAFT','PENDING_PAYMENT'))::text as unpaid_orders,
    count(*) filter (where l.refunded > 0 or l.status in ('PARTIALLY_REFUNDED','REFUNDED'))::text as refunded_orders,
    coalesce(bool_or(l.unmapped or l.refunded > l.total_minor
      or (l.refunded > 0 and l.refunded < l.total_minor and l.event_minor <> l.total_minor)
      or (l.status = 'REFUNDED' and l.refunded <> l.total_minor)
      or (l.status = 'PARTIALLY_REFUNDED' and (l.refunded <= 0 or l.refunded >= l.total_minor))
      or (l.status not in ('PAID','PARTIALLY_REFUNDED','REFUNDED') and l.refunded > 0)), false) as inconsistent
  into totals from ledger l;

  if totals.currencies > 1 or totals.inconsistent then
    raise exception 'Ledger currency, event allocation or confirmed refunds are inconsistent' using errcode = '22023';
  end if;
  return query select totals.currency, totals.collected_minor, totals.outstanding_minor,
    totals.paid_orders, totals.unpaid_orders, totals.refunded_orders;
end;
$$;
revoke all on function public.tournament_money_totals(uuid) from public, anon;
grant execute on function public.tournament_money_totals(uuid) to authenticated;
