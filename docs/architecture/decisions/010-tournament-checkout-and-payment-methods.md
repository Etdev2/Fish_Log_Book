# 010 — Tournament checkout: one order, two ways to pay

**Date:** 2026-09-07 · **Status:** accepted
**Answers:** the founder's tournament redesign brief (2026-09-06/07) — a registration form
where anglers, a captain and several events or jackpots are chosen together and paid for in
one go; "consider a crypto payment via MetaMask, or any other plug-in it doesn't matter …
and this is on top of Stripe"; and four open UI questions the founder handed to the
architect and UX roles rather than deciding himself.
**Depends on:** `003-web-prototype-boundary.md` (pure core, vectors, folder law),
`005-front-end-architecture.md` §3 (directory contract) and §5 (product routes stay static).
**Supersedes:** nothing.

## Context

Most of this already exists and none of it is reachable.

`src/core/tournaments/payments.ts` defines a `PaymentProvider` port —
`createPayment` / `confirmPayment` / `getStatus` / `refund` — and two implementations sit
beside it: `stripe-provider.ts` and `crypto-provider.ts`. The database has
`tournament_order`, `tournament_order_item` (with `JACKPOT` and `SIDE_POT` among its item
types), `payment`, `payment_attempt`, `payment_allocation`, `payment_refund`,
`platform_fee`, and for crypto specifically `wallet_connection`, `crypto_payment_quote` and
`crypto_payment` — the last with exactly the failure states this problem has
(`WRONG_NETWORK`, `WRONG_ASSET`, `UNDERPAID`, `OVERPAID`, `EXPIRED`).

So the founder's two asks — pay for several things at once, and pay by card or by wallet —
are not new architecture. They are the architecture that was built and never surfaced. What
follows records the decisions that were implicit in it, plus the ones that were not.

## Decision

### 1. One order, many items. The "multi request" is the order.

A registration is **one `tournament_order`** carrying **one `tournament_order_item` per
thing bought**: the base entry for each event, plus one line per optional jackpot or side
pot. Selecting three events and two jackpots is one order with five items and one total.

This is why the checkout can be one screen and one payment. The alternative — an order per
event — would mean an angler entering a three-event series pays three times, gets three
receipts, and can end up half-registered when the second card attempt fails. Partial
failure across a single intended act is the thing to design out, and a single order with a
single payment is how.

Consequence: **an order is all-or-nothing.** A payment that confirms activates every item;
a payment that fails activates none. `paymentCanActivateRegistration` already encodes this
(`CONFIRMED` only), and nothing may loosen it to "activate the entries we got money for".

### 2. Crypto is a second provider, not a second checkout.

MetaMask (and any other EIP-1193 wallet — the founder is explicit that the plug-in does not
matter) is reached through the **existing `PaymentProvider` port**, exactly as Stripe is.
The checkout screen chooses a method; everything above the port is identical.

Three rules that follow, and one that does not:

- **Prices are quoted in fiat, always.** `crypto_payment_quote` stores
  `fiat_amount_minor` and derives `crypto_amount_atomic` at a recorded `rate_source` with an
  `expires_at`. An entry fee is $400; it is never "0.1 ETH". A tournament that priced in a
  volatile asset would be running an unintended sweepstake on the exchange rate, and the
  angler and the host would be on opposite sides of it.
- **Prefer a stablecoin, and let the host choose the chain.** The schema is
  chain-agnostic (`chain_namespace` + `chain_id`) and this decision does not pick one; it
  requires that whatever is chosen is recorded on the quote and checked on the observation.
  `evaluateObservation` already fails a payment whose chain, asset, recipient or amount does
  not match its quote, and that check is the safety property — it must never be relaxed.
- **Confirmed means on-chain final, not submitted.** A transaction hash is a promise. The
  order moves to `PAID` only when `evaluateObservation` returns `CONFIRMED` at the required
  confirmation count. The registration screen must therefore have a real "waiting on the
  network" state; a spinner that resolves optimistically would register people who have not
  paid.
- **What does not follow: crypto is not a refund mechanism.** An on-chain transfer cannot
  be reversed, so a refund is a *new outbound payment* to an address a human has approved.
  `CryptoPaymentProvider.refund` throws unless the gateway explicitly supports it, and that
  is correct. Card refunds stay automatic; crypto refunds are an operator action.

### 3. Payment collection is off by default until it is licensed.

Taking entry fees and paying out prizes is regulated, and taking them in crypto adds to that
rather than avoiding it: money transmission, AML/KYC obligations, tax reporting, and state
contest and gambling law all attach to holding other people's stakes and distributing them.
Nothing in this repository constitutes advice on any of it, and none of it is the
architect's to sign off.

The engineering consequence is the part that is: **the live payment path ships behind a
provider that must be configured, and the default configuration is a test provider.** The
UI is built in full — a registration is a real order with real line items and a real total
— and no key that can move real money is present. Turning it on is a deployment decision
with a lawyer attached, not a code change.

### 4. The four open UI questions

The founder handed these to the architect and UX roles. Ruled here so they are not
relitigated per screen.

- **A captain's contact belongs on the entry, and is required.** When weather cancels at
  4am the host has to reach every boat, and there is currently nowhere to hold a phone
  number. It is entry data, not profile data — the person running the boat that day is not
  always the account holder.
- **Each jackpot shows its own pot and its own count at the point of choice.** "Biggest
  tuna — $4,200, 34 in" is the fact that decides whether somebody adds a side pot. A single
  event-level total cannot answer it, and `prize_pool` is already per-pool, so this is a
  presentation decision, not a schema one.
- **A crew is editable until registration closes; the money is not.** Crew changes
  constantly and a locked entry means phoning the host. Changing *what was bought* after
  payment is a refund and a new order, not an edit — so names and contacts stay editable,
  and line items do not.
- **The refund policy is stated on the checkout screen, above the pay button.** Weather
  cancellation is routine in this sport and "what happens to my $400" is the first question
  a person asks. It is the host's policy, so it is the host's text; the screen requires it
  rather than inventing one.

## Rejected

**A separate crypto checkout flow.** It duplicates every rule above — totals, line items,
all-or-nothing activation, refund policy — in a second place where they will drift. The
port exists precisely so the method is a leaf decision.

**Pricing tournaments directly in crypto.** See §2. It converts a fishing tournament into a
currency bet for both parties.

**Holding funds until payout to "simplify" refunds.** This is the design that most clearly
makes the platform a money transmitter, and it is exactly the thing §3 says is not the
architect's call to make silently.

## Consequences

- `src/lib/wallet/` gains the browser wallet connector (EIP-1193 talks to a browser API, so
  by ADR 005 §3 it is `lib`, not `core`). The provider stays pure in `core`.
- The checkout screen has four terminal states per method, not two: paid, declined,
  expired quote, and — crypto only — confirming. The last one is a real screen with a real
  wait, and the registration is not active while it is showing.
- `tournament_division` and `tournament_award_category` are referenced by
  `20260905194000_tournament_scoring.sql` and never created; jackpots are divisions, so
  that gap is closed by the registration work rather than left.
