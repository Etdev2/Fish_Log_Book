# 011 — Host roles: what a treasurer may see

**Date:** 2026-09-07 · **Status:** accepted
**Answers:** the founder's tournament brief (2026-09-06) — "there will also be a host admin
page, so if you're a host you have upgraded permissions" — and the follow-up instruction to
harden the section before production.
**Depends on:** `010-tournament-checkout-and-payment-methods.md` (the order and payment
tables these roles govern), `005-front-end-architecture.md` §3 (directory contract).
**Supersedes:** nothing.

## Context

`organization_member.role` has allowed four values since the first tournament migration:
`OWNER`, `ADMIN`, `STAFF`, `FINANCE`. Row-level security across twenty-odd tables names the
first three. It names `FINANCE` nowhere.

The consequence is worth stating plainly, because it inverts the intent of the role. A club
that granted `FINANCE` to its treasurer gave that person strictly *less* than event staff:
no order, no payment, no refund, no payout instruction, no prize pool, no financial event.
The only way to let somebody handle the money was to make them an `ADMIN` — which also
grants the rules, the scoring, the boundaries, the roster and the power to cancel the
event. The separation of duty that `FINANCE` exists to express could not be expressed.

Meanwhile `/tournaments/[id]/operations` asked nobody's permission at all. It rendered the
host heading, the lifecycle controls, the judging queue and the money panel to any visitor
who knew the address. RLS meant the panels came back empty rather than full, so this was
never a data leak; it was a screen telling a stranger they were the host of an event,
with a "Cancel the tournament" control on it. The money panel was worse than empty — it
printed *"Nothing has been taken and nothing is owed"* as a constant, a sentence that would
have survived the first real entry fee and looked exactly like a quiet tournament.

## Decision

**1. Four roles, and the money is one of them.**

| | Owner | Administrator | Event staff | Treasurer |
|---|---|---|---|---|
| Open the host screen | ✓ | ✓ | ✓ | ✓ |
| Change rules, scoring, boundaries, event state | ✓ | ✓ | | |
| Read and change the roster | ✓ | ✓ | ✓ | |
| Judge catches, penalties, disputes | ✓ | ✓ | ✓ | |
| Read the ledger and the prize pool | ✓ | ✓ | | ✓ |
| Approve a payout | ✓ | ✓ | | ✓ |
| Add or re-role the host team | ✓ | ✓ | | |

`FINANCE` is added to every money-read policy. It is *not* added to judging, to the roster,
or to the event's settings, because a treasurer who could disqualify a boat is not a
separation of duty, it is an administrator with a different name.

**2. Event staff come off the order tables.** This is a reduction and it is deliberate.
Staff run the dock; whether a boat has paid is `tournament_entry.registration_status`, not
the ledger. Nothing in the application read `tournament_order` as staff, so the change
removes an unused capability rather than a working screen. An entrant's read of their own
order is untouched — it hangs off `purchaser_angler_id = auth.uid()`, not off a role.

**3. The screen asks the server who you are, through one function.**
`my_tournament_host_role(uuid)` returns the caller's own active role or null.

It exists rather than a client-side join because a non-member's `select` on `tournament`
returns no rows, making "you are not a host" and "no such tournament" indistinguishable —
the screen would have to guess between sending somebody to the public page and telling them
the event does not exist. Being `security definer` it states its own authorization, and it
states the narrowest possible one: the only row it can reach is the caller's own
membership. It is granted to `anon` as well as `authenticated`, because a signed-out
visitor's `auth.uid()` is null, the join cannot match, and null is the correct answer —
without the grant they would meet a permission error where they should meet a way back.

**4. The capability table lives in the core and is checked against the SQL.**
`src/core/tournaments/host-role.ts` is the single answer to "may I", and
`host-role.sql.test.ts` reads the migrations and fails if the two ever disagree. Two
statements of one rule, written in two languages a week apart, drift — and drift here is
either a treasurer shown a button that errors or, worse, a lane hidden from somebody the
database would have admitted.

**5. The client check is presentation, never enforcement.** The server decides what a
request may touch; this decides what a person is shown. A lane hidden by
`hostCapabilities` is a courtesy, not a control, and no rule may ever be enforced only
there.

## Consequences

- A treasurer can do the job the role was named for, without being handed the tournament.
- A stranger on a host URL gets a sentence and two links rather than a locked room.
- The money panel reads `tournament_order` and, when it cannot, says so rather than
  showing a zero. A zero and "not allowed to look" must never render the same.
- Adding somebody to a host team is still not possible from the app: it needs an invitation
  with an email and an expiring token, and none of that half exists. The screen says so
  instead of offering a button that would appear to grant an administrator and would not.
- The event-state controls remain visible and disabled, per ADR 010's line that activation
  is a server-side act. Roles do not change that.
