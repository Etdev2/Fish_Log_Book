# ARCH-001 Architecture Review

**Reviewed:** 2026-09-05  
**Scope:** `docs/architecture/tournament-domain-model.md` against the current Fish Log Book / Fish Games codebase  
**Reviewer:** Architecture review lane  
**Verdict:** **CHANGES REQUIRED BEFORE IMPLEMENTATION BOARD**

---

## Executive Summary

ARCH-001 has the correct product scope and captures the major domains required for a commercial Fishing Tournament OS: B2C and B2B tournament operation, tournament configuration, scoring, Fair Play, payments, crypto, prize pools, offline operation, auditability, and multi-tenant security.

The document is strong as an architecture brief, but it is not yet an approved implementation contract. Several foundational decisions are intentionally left open. Those decisions must be resolved before multiple implementation agents begin work or they will produce incompatible schemas, permission models, and scoring/payment interfaces.

The current repository also contains valuable Fish Games architecture that should be evolved rather than discarded. Existing Boat Games code already provides an offline-first event model, deterministic identifiers/order, pure scoring, immutable void/adjustment semantics, and frozen Fish Legal snapshots. The Tournament OS should preserve those properties while adding server authority, tenancy, registration, judging, Fair Play, and commerce.

---

## Review Gate 1 — Unify Tenancy

### Finding
ARCH-001 currently allows a tournament to be owned either directly by a user or by an organization and asks the architect to choose a polymorphic or nullable-key model.

### Decision
**Use one tenant model: every tournament belongs to an Organization.**

For B2C, automatically create or expose a lightweight **Personal Organization / Personal Workspace** for the user. Private friend tournaments live there.

For B2B, tournaments live in a normal commercial organization.

```text
User
  -> Personal Organization
       -> Private / Community Tournaments

Business Users
  -> Organization
       -> Circuits / Seasons / Tournaments
```

### Why
This gives one ownership path for:

- RLS
- authorization
- billing
- audit attribution
- feature flags
- organization upgrades
- invitations/staff
- payment accounts
- reporting

Avoid `owner_type + owner_id` as the primary tenancy mechanism unless later requirements prove it necessary.

### Required ARCH-001 change
Replace dual tournament ownership as a core model with:

```text
Tournament.organization_id NOT NULL
Organization.kind = PERSONAL | BUSINESS | PLATFORM
Organization.created_by_user_id
```

A personal organization can remain invisible/lightweight in B2C UX.

---

## Review Gate 2 — Preserve Existing Event-Sourced Game Properties

### Finding
The current Fish Games implementation already has important integrity properties:

- local-first IndexedDB storage,
- UUIDv7 identifiers,
- monotonic event sequence ordering,
- pure scoring folds,
- immutable void/adjustment events,
- frozen Fish Legal snapshots,
- separation between game event and optional personal catch log row.

### Decision
The Tournament OS must **adapt and migrate** these concepts rather than start with an unrelated greenfield tournament model.

### Required architecture direction
Introduce a server-authoritative tournament event/evidence model while preserving deterministic offline creation and append-only history.

Recommended conceptual split:

```text
TournamentCatch / Submission
  -> identity + current competition claim

CatchEvidence
  -> immutable evidence objects

TournamentEvent / AuditEvent
  -> append-only lifecycle and official mutations

Scoring Engine
  -> pure deterministic calculation from approved competition state
```

Existing `GameEvent.id` / sequence concepts should inform offline idempotency and ordering.

### Required ARCH-001 change
Migration plan must explicitly map:

- `GameSession` -> tournament/private-game migration path
- `GameParticipant` -> TournamentEntry / guest participant path
- `GameEvent` -> catch/event/evidence architecture
- `GameRules` -> scoring/rule configuration
- current scoring fold -> reusable scoring primitives
- `EventLegalSnapshot` -> tournament regulatory snapshot strategy

No destructive rewrite until compatibility is documented.

---

## Review Gate 3 — Separate Divisions, Eligibility Tags, and Awards

### Finding
Real tournaments can place one entrant in multiple classifications while awarding prizes across separate categories.

### Decision
Do not overload one `division_id`.

Use separate concepts:

```text
TournamentDivision
EntryDivisionMembership
AwardCategory
Award / PrizeDefinition
```

Example:

An angler may be:

- Amateur division
- Kayak class
- Junior eligible

while simultaneously competing for:

- Overall
- Biggest Fish
- Species Jackpot

This avoids later schema rewrites for overlapping tournament classifications.

---

## Review Gate 4 — Define the Entry Aggregate

### Finding
ARCH-001 separates User, Team, Boat, and TournamentEntry correctly, but the authoritative competition unit remains ambiguous.

### Decision
`TournamentEntry` is the registration/eligibility aggregate for a tournament. It must have a stable `id` regardless of whether scoring is individual or team-based.

Teams and boats are associated entities, not replacements for an entry.

Recommended:

```text
TournamentEntry
  tournament_id
  primary_user_id nullable (guest/imported entries allowed later)
  registration_status
  eligibility_status
  payment_status
  competition_status

TournamentTeamMembership
TournamentBoatAssignment
EntryDivisionMembership
```

Scoring configuration determines whether standings roll up by ENTRY, TEAM, or BOAT.

This prevents scoring logic from changing the registration model.

---

## Review Gate 5 — Scoring Engine Contract Must Be Versioned

### Finding
The existing app already contains pure scoring logic. ARCH-001 correctly requires a service boundary but does not yet define configuration versioning.

### Decision
Every tournament must reference an immutable scoring configuration version once competition begins.

Recommended concept:

```text
ScoringRuleSet
  id
  version
  schema_version
  configuration
  frozen_at
```

The scoring engine contract should accept only normalized domain inputs and return deterministic standings/results.

UI, payments, and judging must never directly calculate authoritative rankings.

Finalization stores a result snapshot plus the scoring ruleset version used to produce it.

---

## Review Gate 6 — Rules and Regulatory Snapshots

### Finding
ARCH-001 correctly separates Fish Legal and tournament rules. The existing GameEvent architecture already freezes legal state at scoring time.

### Decision
Preserve this principle.

Tournament competition should retain:

- tournament ruleset version,
- Fish Legal/regulatory pack/version used for automated checks,
- Fair Play policy version,
- scoring ruleset version.

Historic results must not change because a later regulation pack, tournament rule, or Fair Play policy changed.

---

## Review Gate 7 — Fair Play Must Be Evidence-Based, Not a Single Score

### Finding
ARCH-001 has a strong Fair Play concept but implementation could drift toward one opaque fraud score.

### Decision
Keep individual verification checks first-class and explainable.

Recommended model:

```text
VerificationCheck
  catch_id / submission_id
  check_type
  status: PASS | WARNING | FAIL | UNKNOWN | REVIEW_REQUIRED
  evidence_reference
  policy_version
  evaluated_at

FairPlayAssessment
  aggregate disposition for review workflow
```

Important distinctions:

- Cryptographic file hash: exact duplicate detection.
- Perceptual image fingerprint: near-duplicate/same-image detection; future capability.
- QR validation: signed/session-token verification.
- GPS: preserve accuracy and UNKNOWN state.
- Device timestamps: signals only; server time remains independent.

Automation flags; officials adjudicate where the policy does not define a deterministic outcome.

---

## Review Gate 8 — QR Tokens Need Explicit Trust Boundaries

### Decision
Use signed, expiring server-issued verification tokens or random opaque session tokens.

Never encode sensitive user information directly into QR payloads.

QR verification records should include:

- verification_session_id
- tournament_id
- subject type/id where applicable
- valid_from / valid_until
- token version
- scanned_at_device
- received_at_server
- verification result

Offline verification must state whether the token was verified locally, server-verified later, or could not be verified.

---

## Review Gate 9 — Financial Ledger and Competition State Must Be Separate

### Finding
ARCH-001 correctly separates orders/payments from TournamentEntry but should make money immutability stronger.

### Decision
Use provider-neutral commerce plus append-only financial events.

Recommended boundary:

```text
Order
OrderItem
Payment
PaymentAttempt
Refund
PaymentAllocation
FinancialEvent
```

Tournament eligibility may depend on a derived payment state, but tournament records must not become the accounting ledger.

Prize calculations and fund movement remain separate:

```text
Final Result
  -> Prize Entitlement / Payout Calculation
  -> Human Approval
  -> Payout
  -> Provider transaction
```

Never let the scoring engine initiate a payout.

---

## Review Gate 10 — Fiat and Crypto Need Separate Provider Capabilities

### Decision
Keep the unified payment abstraction, but model provider capabilities explicitly.

Examples:

- collect payment
- refund
- connected-account transfer
- fiat payout
- crypto collection
- crypto payout

Accepting crypto and paying prizes in crypto remain separate feature flags.

MetaMask is a wallet connector, not the authoritative payment verifier. Server-side blockchain verification must confirm transaction network, asset, destination, amount, transaction status, and replay protection before the unified payment state becomes confirmed.

---

## Review Gate 11 — Compliance Feature Gates

### Decision
Financial and contest capabilities must be feature-gated independently.

Minimum gates to design for:

- paid_entry_enabled
- side_pots_enabled
- cash_prizes_enabled
- crypto_payment_enabled
- crypto_payout_enabled
- public_paid_tournament_enabled

Gate resolution may depend on platform configuration, organization status, tournament jurisdiction, and later compliance decisions.

Do not hard-code a legal conclusion into the tournament engine.

---

## Review Gate 12 — Server Authority + Offline Operation

### Finding
The current Fish Games implementation is device-local. Commercial tournaments require cross-device synchronization and trusted server state.

### Decision
Adopt a local-first / server-authoritative model.

Client devices may create offline submissions and evidence references using deterministic IDs, but official tournament state is reconciled and finalized on the server.

Required concepts:

- client_generated_id / idempotency key
- device_created_at
- server_received_at
- sync state
- immutable upload/evidence identifiers
- conflict/review state
- server-authoritative official decision

Never use last-write-wins for official catch evidence, judging, penalties, or financial data.

---

## Review Gate 13 — Audit Domains

### Decision
Do not use a single audit table as a substitute for domain records.

Domain records remain first class (`CatchReview`, `Penalty`, `Refund`, `Payout`, etc.).

`AuditEvent` records who/what/when for important mutations and transitions.

For competition integrity, preserve original values and append corrections rather than overwriting history where practical.

---

## Review Gate 14 — Public vs Private Data Classification

### Finding
ARCH-001 requires tenant security but does not yet classify public tournament information.

### Decision
The architecture must distinguish:

- PRIVATE ADMIN DATA
- PARTICIPANT-ONLY DATA
- OFFICIAL/JUDGE-ONLY EVIDENCE
- PUBLIC TOURNAMENT DATA
- PUBLIC RESULTS

Photos, exact GPS coordinates, boat registration details, payment information, device metadata, and private Fair Play signals must not automatically become public because a leaderboard is public.

Public projections/read models should explicitly select safe fields.

---

## Review Gate 15 — Guest / Imported Competitors

### Finding
Large tournament operators may need to import entrants or register participants who have not created Fish Games accounts yet.

### Decision
Do not require every TournamentEntry to have an authenticated user at creation time.

Allow an optional identity-claim flow later:

```text
TournamentEntry
  user_id nullable
  participant identity fields / imported reference

Later:
  claim entry -> bind user_id with verified process
```

This is consistent with the existing GameParticipant `claimed_user_id` concept and prevents B2B onboarding from being blocked by account creation.

---

## Review Gate 16 — API / Domain Contract Ownership

Before parallel implementation, the architect must freeze version 1 contracts for:

- tenant/organization ownership
- tournament state machine
- entry aggregate
- catch/evidence/review state
- scoring input/output
- payment state
- verification/Fair Play state
- audit event shape

These become protected shared contracts. Parallel agents may implement behind them but may not independently change them.

---

# Required Changes Before Approval

ARCH-001 should be revised to incorporate these resolved decisions:

1. All tournaments belong to an Organization; B2C uses a personal organization/workspace.
2. Existing `GameSession/GameEvent/GameRules/scoring` behavior receives an explicit migration/reuse strategy.
3. Divisions, memberships, award categories, and prizes are distinct.
4. TournamentEntry is the stable registration aggregate; scoring rollup is configurable.
5. Scoring, tournament rules, Fair Play policy, and regulatory checks are versioned/frozen for competition history.
6. Fair Play checks are explainable first-class records.
7. QR trust and offline verification boundaries are explicit.
8. Commerce is provider-neutral and ledger-like; competition state never substitutes for financial history.
9. Crypto collection and crypto payout remain separate capabilities.
10. Local-first capture is combined with server-authoritative official state.
11. Data visibility/classification is explicit.
12. Imported/guest competitors are supported without requiring an account at initial registration.
13. Version 1 shared domain contracts are frozen before implementation lanes open.

---

# Review Verdict

**CHANGES REQUIRED — ARCH-001 is not yet released to the implementation board.**

No production implementation lanes should begin until the architect incorporates the required changes above and the revised architecture is reviewed once more.

The next architecture action is to revise `docs/architecture/tournament-domain-model.md` on the architecture lane, converting open questions into explicit version 1 decisions and adding the migration mapping to the existing Fish Games event/scoring implementation.
