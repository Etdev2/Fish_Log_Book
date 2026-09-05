# ARCH-001 — Tournament Domain Model & Multi-Tenant Architecture

**Project:** Fish Games / Fish Log Book  
**Workstream:** Fishing Tournament OS  
**Owner:** System Architect  
**Priority:** P0 — Blocking  
**Type:** Architecture / Design Specification  
**Status:** Ready for Architecture Review

---

## 1. Mission

Design the foundational architecture required to transform Fish Games into a commercial, multi-tenant Fishing Tournament Operating System that supports both:

- **B2C:** individual users creating private, invite-only, community, or small paid tournaments for friends and other anglers.
- **B2B:** clubs, brands, marinas, fleets, tournament directors, circuits, and enterprise tournament organizations running professional events on the same platform.

The platform must use one reusable tournament engine rather than separate implementations for B2C and B2B.

This ticket exists to prevent the product from being hard-coded around one tournament format, one customer type, or one payment method.

---

## 2. Core Product Principle

The same underlying tournament technology must power both individual and commercial use cases.

```text
Fish Games Platform
│
├── B2C / Individual Market
│   ├── Private Friend Tournaments
│   ├── Invite-Only Competitions
│   ├── Public Community Tournaments
│   └── Small Paid Tournaments
│
└── B2B / Tournament Operators
    ├── Clubs
    ├── Tournament Directors
    ├── Circuits
    ├── Brands
    ├── Marinas / Fleets
    └── Enterprise Tournament Organizations
```

The tournament engine, scoring engine, registration, payments, judging, leaderboard, rules, audit trail, catch evidence, and Fair Play systems should be shared.

Commercial capabilities should be layered through permissions, configuration, feature flags, subscriptions, and organization ownership—not duplicated codebases.

---

## 3. Target Hierarchy

The architecture should support:

```text
Platform
  ├── User-owned Tournament
  └── Organization
       ├── Organization Members
       ├── Branding
       ├── Staff
       ├── Circuits / Series
       │    └── Seasons
       │         └── Tournaments
       └── Standalone Tournaments
```

A tournament may be owned directly by an individual user or by an organization.

The architect must define the cleanest ownership model without duplicating tournament tables.

---

## 4. Multi-Tenant Requirement

This is a true multi-tenant system.

Examples:

- Fish Games
- Pacific Coast Tournament Series
- Florida Kingfish Association
- A private user-created friends tournament

Private administrative data must be isolated.

Organization A must never be able to access Organization B's private administrative data.

A user-owned private tournament must not expose private data to unrelated users.

Authorization must be enforced server-side and, where applicable, at the database/RLS layer.

UI hiding is not security.

---

## 5. Required Domain Entities

The architect must define ownership, responsibility, relationships, lifecycle, and security for at least:

### Identity
- User
- Profile / Angler Profile

### Organization
- Organization
- OrganizationMember
- OrganizationInvitation

### Tournament hierarchy
- Circuit / Series
- Season
- Tournament
- TournamentStaff

### Competition configuration
- TournamentDivision
- TournamentAwardCategory
- TournamentSpecies
- TournamentRule
- TournamentBoundary
- TournamentScoringConfiguration
- TournamentVerificationPolicy

### Participation
- TournamentEntry
- TournamentTeam
- TournamentTeamMember
- Boat
- TournamentBoat

### Competition evidence / integrity
- TournamentCatch
- CatchEvidence
- CatchReview
- VerificationSession
- FairPlayAssessment
- FairPlaySignal
- EvidenceFingerprint
- TournamentPenalty
- TournamentDispute

### Results
- Score / Standing
- LeaderboardSnapshot

### Platform integrity
- AuditEvent

### Commerce
- Order
- OrderItem
- Payment
- PaymentAttempt
- PaymentAllocation
- Refund
- PlatformFee
- OrganizerPaymentAccount
- PrizePool
- PrizePoolEntry
- Payout
- WalletConnection
- CryptoPayment
- FinancialEvent

---

## 6. Tournament Ownership Model

The architect must resolve how a tournament can be owned by either:

- an individual user, or
- an organization.

Evaluate approaches such as:

```text
TournamentOwner
  owner_type: USER | ORGANIZATION
  owner_id
```

or nullable foreign keys with strict constraints.

Requirements:

- no duplicate tournament implementation,
- deterministic ownership,
- secure authorization,
- easy upgrade path from user-owned B2C tournament to organization-managed tournament if product strategy later permits,
- consistent billing and audit attribution.

---

## 7. Tournament Lifecycle

Design an explicit state machine.

Suggested starting states:

```text
DRAFT
REGISTRATION_OPEN
REGISTRATION_CLOSED
READY
LIVE
PAUSED
COMPLETED
RESULTS_PENDING
FINAL
CANCELLED
```

Define valid transitions, roles allowed to trigger each transition, and effects on registration, catch submission, judging, scoring, payments/refunds, and post-final corrections.

Final results must not silently mutate.

---

## 8. User vs Angler vs Tournament Entry

Do not model `User = Tournament Competitor`.

A user is an identity and may be a tournament creator in one event, an angler in another, a judge in another, and an organization owner elsewhere.

A `TournamentEntry` must represent participation in exactly one tournament.

The architect must decide whether a reusable `AnglerProfile` is necessary or whether profile data belongs elsewhere.

---

## 9. Tournament Entry Model

A tournament entry may need to represent entrant/user, division, team, boat, entry number, registration state, payment state, eligibility state, check-in state, and competition state.

Do not collapse unrelated concerns into one ambiguous status unless there is a justified state model.

---

## 10. Team and Boat Separation

A team is not a boat.

```text
Team Pacific
  competes aboard
FV Pacific
```

Evaluate `TournamentTeam`, `TournamentTeamMember`, `Boat`, and `TournamentBoat`.

Recommended initial direction: tournament-specific teams, reusable boats where appropriate.

---

## 11. Divisions vs Award Categories

Resolve whether competitive divisions and award categories are separate concepts.

An entrant may simultaneously qualify for Overall, Private Boat, Junior, and Big Fish.

Avoid forcing one-entry-one-division if real tournament structures require overlapping categories.

---

## 12. Species Configuration

Use a global species model plus tournament-specific configuration.

```text
Species
TournamentSpecies
```

Tournament-specific attributes may include eligible status, min/max length, min/max weight, count limits, points, multiplier, and bonus rules.

Do not mix tournament species rules with Fish Legal regulations.

---

## 13. Fish Legal Boundary

Legal regulations and tournament rules are separate systems.

```text
Fish Legal
  -> regulatory validation

Tournament Engine
  -> tournament eligibility

Verification Engine
  -> final competition evaluation
```

A tournament may prohibit something that is otherwise legal. A tournament may not make illegal fishing legal.

---

## 14. Tournament Rules and Versioning

Design `TournamentRule` with categories such as eligibility, species, boundary, gear, method, measurement, photo, weigh-in, timing, boat, team, sportsmanship, safety, penalties, protests, tie breakers, and custom.

Rules must be versioned or snapshotted before competition begins so historical results always point to the rules under which they were earned.

---

## 15. Boundaries and Geofencing

Evaluate `TournamentBoundary` with types such as INCLUDE, EXCLUDE, CHECK_IN, WEIGH_IN, and START_AREA.

The model should be compatible with future polygons, circles, coordinates, and predefined regulatory areas.

Do not build the map editor in ARCH-001.

---

## 16. Catch Domain

Treat a tournament catch as competition evidence, not simply fish + weight.

Evaluate separation into:

```text
TournamentCatch
CatchEvidence
CatchReview
```

`TournamentCatch` represents the competitor claim. `CatchEvidence` represents proof. `CatchReview` represents adjudication.

Potential catch fields include tournament_id, entry_id, team_id, boat_id, species_id, caught_at, submitted_at, latitude/longitude, gps_accuracy, weight, length, measurement_method, status, and client_generated_id.

---

## 17. Catch Evidence

Evidence types should be extensible.

Examples: PHOTO, VIDEO, GPS, MEASUREMENT, WEIGHT, DEVICE_METADATA, WITNESS, WEIGHMASTER, QR_VERIFICATION, CUSTOM.

One catch may have multiple evidence records.

---

## 18. Catch State Machine

Recommended starting states:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
FLAGGED
DISQUALIFIED
PROTESTED
FINAL
```

Define valid transitions and roles.

Verification level must remain separate from catch lifecycle state.

---

## 19. Verification and Fair Play

Fish Games must support a configurable competition-integrity layer designed to reduce recycled photos, duplicate fish submissions, impersonation, out-of-bounds catches, out-of-time catches, and evidence tampering.

```text
Catch Submission
  -> Evidence Collection
  -> Fair Play Verification
  -> Judge Review
  -> Scoring Eligibility
```

Potential verification levels:

- SELF_REPORTED
- PHOTO_VERIFIED
- METADATA_VERIFIED
- JUDGE_VERIFIED
- OFFICIAL_VERIFIED

Automation should detect and flag. Judges should adjudicate disputed or high-value cases. All material integrity decisions must be auditable.

---

## 20. Tournament Verification Policy

Create a configurable tournament verification policy rather than hard-coding one requirement for every event.

Possible requirements:

- photo,
- video,
- GPS,
- tournament identifier,
- rotating QR,
- measurement board,
- scale evidence,
- device metadata,
- weighmaster confirmation,
- official review.

Support product presets such as Basic, Standard, Strict, and Custom over the same underlying verification engine.

---

## 21. QR Verification Architecture

QR technology must be optional and extensible.

Potential uses:

- Tournament QR
- Rotating time-window QR
- Angler/entry QR
- Boat QR
- Weigh-station QR
- Check-in QR
- Catch/session QR

Do not treat QR appearance as security. Use server-issued identifiers or signed tokens and avoid storing sensitive data in QR payloads.

Potential `VerificationSession` fields:

```text
id
tournament_id
type
token_reference
valid_from
valid_until
status
created_by
created_at
```

Potential types: TOURNAMENT, ANGLER, BOAT, WEIGH_STATION, CHECK_IN, CATCH.

Architect must determine whether signed time-window tokens or server-issued random tokens are preferable.

---

## 22. Photo Verification and Duplicate Detection

Preserve original uploaded evidence where possible. Display/compressed derivatives should remain separate.

Evaluate evidence hashing/fingerprinting so the system can detect the same image or evidence reused across catches.

Potential duplicate checks:

- duplicate image fingerprint,
- same evidence attached to multiple catches,
- reused QR/session,
- duplicate client-generated IDs,
- suspicious timestamp patterns.

These should produce review signals rather than automatic accusations unless a rule is deterministic and safe to enforce.

---

## 23. GPS and Time Verification

GPS result should support INSIDE, OUTSIDE, and UNKNOWN. Poor accuracy must not silently become a definitive failure.

Store separate timestamps such as:

- device_capture_time,
- device_submission_time,
- server_received_time,
- verified_time.

Do not rely solely on the device clock.

---

## 24. Fair Play Signals

Evaluate `FairPlayAssessment` with statuses such as PASS, WARNING, REVIEW_REQUIRED, FAIL, UNKNOWN.

Potential `FairPlaySignal` types:

- QR_EXPIRED
- GPS_OUTSIDE_BOUNDARY
- PHOTO_DUPLICATE
- TIMESTAMP_MISMATCH
- UNREGISTERED_ENTRY
- REUSED_IDENTIFIER
- DEVICE_TIME_ANOMALY
- MISSING_REQUIRED_EVIDENCE

Signals should include severity, evidence, timestamp, and resolution status.

---

## 25. Offline QR / Integrity Support

Because tournaments may happen offshore, integrity checks must tolerate unreliable connectivity.

Evaluate signed tokens that can be downloaded before departure, verified locally where appropriate, stored with scan metadata, and reconciled with the server later.

Do not silently weaken verification when offline. Record what could and could not be verified at the time.

---

## 26. Scoring Service Boundary

Authoritative tournament scoring must not live in UI components.

```text
Tournament Configuration
+ Eligible Catches
+ Penalties
+ Tie Breakers
  -> Scoring Engine
  -> Standings
```

Initial scoring modes should be architecturally supportable:

- BIGGEST_FISH
- TOTAL_WEIGHT
- BEST_N_WEIGHT
- TOTAL_LENGTH
- BIGGEST_LENGTH
- POINTS
- SPECIES_POINTS
- SPECIES_MULTIPLIER
- EVERY_FISH_COUNTS
- CUSTOM

Determine configuration storage, validation strategy, recalculation behavior, persistence/snapshot strategy, and deterministic finalization.

---

## 27. Penalties and Tie Breakers

Penalties must be first-class records and must not silently overwrite original catch evidence.

Potential targets: Catch, Entry, Team, Boat.

Potential types: POINT_DEDUCTION, WEIGHT_DEDUCTION, TIME_PENALTY, CATCH_REMOVAL, DISQUALIFICATION, CUSTOM.

Tie breakers must be ordered and deterministic.

---

## 28. Disputes and Audit Trail

Design a formal dispute/protest lifecycle.

Every material action affecting competition results should generate an audit event.

Examples include tournament published, rule changed, tournament started, catch submitted/edited/approved/rejected, penalty applied/removed, score recalculated, QR issued/rotated/scanned/rejected, Fair Play assessment changed, tournament ended, results finalized, and final result corrected.

Critical tournament history should be append-only where practical.

---

## 29. Authorization Model

Evaluate separate relationships for OrganizationMember, TournamentStaff, and TournamentEntry.

Potential roles:

- PLATFORM_ADMIN
- ORGANIZATION_OWNER
- ORGANIZATION_ADMIN
- ORGANIZATION_STAFF
- FINANCE_ADMIN
- TOURNAMENT_DIRECTOR
- TOURNAMENT_ADMIN
- JUDGE
- WEIGHMASTER
- STAFF
- CAPTAIN
- ANGLER
- SPECTATOR

A user may have different roles in different tournaments.

Produce a complete permission matrix.

---

## 30. B2C Capability Model

The architecture must support user-created tournaments such as:

```text
Creator: individual user
Visibility: invite-only
Participants: 6
Scoring: biggest yellowtail
Duration: one day
Entry Fee: optional
Judges: optional
Verification: photo + tournament code
```

Potential visibility modes: PRIVATE, INVITE_ONLY, UNLISTED, PUBLIC.

Do not create a separate B2C scoring, registration, payment, or verification system.

---

## 31. B2B Capability Model

The same engine must scale to hundreds or thousands of participants, organizations and staff, divisions, boats/teams, judging, traditional weigh-ins, multi-day events, sponsor presentation, public leaderboards, registration fees, side pots, reporting, white-label branding, circuits and seasons, and strict Fair Play policies.

Commercial capabilities should be enabled through plans, feature flags, and configuration.

---

## 32. Financial Architecture

Payments are a first-class architecture concern.

The system must eventually support tournament entry fees, team fees, boat fees, membership fees, late fees, side pots/jackpots, merchandise, donations, refunds, platform fees, organizer revenue, prize pools, payouts, fiat payments, crypto payments, fiat payouts, and separately enabled crypto payouts.

Never model payment as only `paid = true`.

```text
Tournament Entry
  -> Order
  -> Order Items
  -> Payment
  -> Payment Allocation
```

---

## 33. Payment Provider Abstraction

Tournament logic must not depend directly on Stripe or MetaMask.

Define a provider boundary such as:

```text
PaymentService
  createPayment()
  confirmPayment()
  getPaymentStatus()
  refundPayment()
```

Initial provider implementations to evaluate:

- StripePaymentProvider
- CryptoPaymentProvider

Tournament registration should consume a unified payment state.

---

## 34. Fiat / Stripe Architecture

Evaluate Stripe Connect for B2B organizer accounts.

```text
Angler
 -> Checkout
 -> Stripe
 -> Fish Games platform fee
 -> Tournament organizer allocation
```

Organization-level financial accounts should store provider identifiers/status, not sensitive bank credentials.

Fee models must be configurable: percentage, flat fee, percentage + flat, subscription + reduced fee, or enterprise agreement.

---

## 35. Crypto / MetaMask Architecture

Support optional wallet-based checkout with MetaMask as the initial wallet target, without hard-coding MetaMask as the only future wallet.

```text
Checkout
 -> choose Crypto
 -> connect wallet
 -> verify network
 -> generate temporary quote
 -> user signs transaction
 -> transaction broadcast
 -> independent confirmation
 -> payment confirmed
 -> tournament entry activated
```

Never request or store seed phrases, private keys, or wallet passwords.

Store only necessary public wallet identifiers, transaction hashes, quote metadata, and verification state.

---

## 36. Fiat and Crypto Unified at Order Layer

The tournament engine should ultimately see `Payment Status = CONFIRMED`, not care whether payment came from card, Apple Pay, bank, ETH, stablecoin, or another future provider.

Provider complexity remains behind the payment service.

---

## 37. Crypto Acceptance vs Crypto Payouts

These are separate capabilities.

```text
Capability A: accept crypto payments
Capability B: pay tournament prizes in crypto
```

Capability B must be independently feature-flagged and subject to separate compliance review.

Do not assume accepting crypto automatically enables crypto payouts.

---

## 38. Prize Pools and Payouts

Prize pools must be first-class records.

Examples include overall prize pool, big fish pool, species jackpot, team pool, and optional side pot.

Track participation explicitly.

The scoring engine may calculate winners but must never directly move money.

```text
Final Results
 -> Payout Calculation
 -> Human Review / Approval
 -> Payout Instruction
 -> Payment Provider
```

---

## 39. Crypto Quotes and Confirmation

If entry fees are denominated in fiat, generate a temporary crypto quote and store fiat amount/currency, crypto amount/asset, exchange rate, quoted_at, and expires_at.

A wallet signature is not proof of confirmed payment.

Blockchain confirmation must be independently verified server-side.

Transaction hashes must be unique to prevent replay/double-crediting.

---

## 40. Financial Security

Requirements:

- no raw card storage,
- no CVV storage,
- no private crypto keys,
- no seed phrase collection,
- verify provider webhooks/signatures,
- verify blockchain transactions independently,
- server-side refund/payout authorization,
- idempotent financial operations,
- financial audit events,
- finance permissions separate from judging permissions.

---

## 41. Compliance Boundary

Entry fees, prize pools, paid contests, crypto, payouts, tax reporting, and jurisdiction-specific rules may have legal/compliance implications.

Architecture must support feature flags by organization, tournament, and jurisdiction.

Do not encode assumptions that all tournaments can legally offer the same financial features everywhere.

---

## 42. Offline / Sync Requirements

Fishing tournaments must not assume connectivity.

Design for future offline-capable submissions with client_generated_id, device timestamps, local queue, idempotent sync, server received timestamp, conflict states, and evidence upload recovery.

Potential sync states: PENDING, SYNCED, CONFLICT, FAILED.

Do not silently overwrite competition evidence during conflict resolution.

---

## 43. Security / RLS Requirements

If Supabase/Postgres remains the persistence layer, evaluate RLS for tenant-sensitive records.

Every protected tournament record must have a deterministic ownership path to either owner user or organization.

All sensitive mutations must re-check permission server-side.

Never trust role or ownership identifiers supplied by the client.

---

## 44. Migration Strategy

Review the existing Fish Games / Fish Log Book implementation before proposing migrations.

ARCH-001 must identify existing entities that can be reused, entities requiring replacement, backwards-compatible migration steps, data conversion requirements, temporary adapters if needed, and features that must remain working during migration.

Avoid destructive rewrites unless clearly justified.

---

## 45. Required Deliverable

Finalize this document with:

1. Executive architecture decision summary
2. Entity relationship diagram
3. Ownership model for USER and ORGANIZATION tournaments
4. Entity responsibilities
5. Tournament lifecycle state machine
6. Catch lifecycle state machine
7. Verification/Fair Play architecture
8. QR/session architecture
9. Payment lifecycle state machine
10. Permission matrix
11. B2C vs B2B capability matrix
12. Scoring service boundary
13. Rule/Fish Legal boundary
14. Payment provider abstraction
15. Stripe Connect model
16. MetaMask/crypto model
17. Prize pool and payout model
18. Audit/event strategy
19. RLS / server authorization strategy
20. Offline/idempotency strategy
21. Proposed schema
22. Migration plan from existing implementation
23. Risks
24. Open questions
25. Recommended implementation sequence

---

## 46. Architect Acceptance Criteria

ARCH-001 is complete only when the architecture can answer without ambiguity:

- Who owns a tournament?
- Can a user create a private tournament without an organization?
- How can ownership migrate if needed?
- How are organizations and private tournaments isolated?
- What is a tournament entry?
- How do teams and boats differ?
- Can one entrant qualify for multiple categories?
- How are rules versioned?
- How does Fish Legal remain separate?
- What is the authoritative catch record?
- How is evidence stored?
- How is judging represented?
- How does Fair Play assess photo, GPS, time, and QR evidence?
- How are QR tokens issued, rotated, signed, and reconciled offline?
- How are duplicate photos/evidence detected?
- What triggers automatic failure versus human review?
- How is authoritative scoring performed?
- How are penalties and tie breakers represented?
- How are final results locked?
- How are disputes audited?
- How does registration interact with orders/payments?
- How are platform fees represented?
- How does Stripe Connect map to organizations?
- How does MetaMask fit behind a provider abstraction?
- How is a crypto transaction independently verified?
- How do prize pools differ from organizer revenue?
- How are payouts approved?
- How are fiat payouts separated from crypto payouts?
- Which capabilities are feature-flagged?
- How will offline submissions avoid duplicates?
- How will the existing app migrate safely?

---

## 47. Implementation Gate

The architect may inspect the codebase, document decisions, produce diagrams, propose schema, and identify migration steps.

Do **not** implement production tournament migrations, Stripe, MetaMask, prize payouts, or large UI changes until this architecture is reviewed and converted into implementation tickets.

Once ARCH-001 is approved, implementation should be decomposed into separate tickets beginning with the minimum vertical slice:

```text
Tournament Ownership / Tenancy
 -> Tournament Creation
 -> Registration
 -> Catch Submission
 -> Fair Play / Judge Review
 -> Scoring Engine
 -> Leaderboard
 -> Finalization
```

Financial implementation should follow the approved payment domain contract rather than being built ad hoc inside registration.
