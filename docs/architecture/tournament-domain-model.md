# ARCH-001 — Tournament Domain Model & Multi-Tenant Architecture

**Project:** Fish Games / Fish Log Book  
**Workstream:** Fishing Tournament OS  
**Owner:** System Architect  
**Priority:** P0 — Blocking  
**Type:** Architecture Decision / Handoff Specification  
**Status:** FINAL REVIEW CANDIDATE

---

## 1. Decision Summary

Fish Games will evolve into one shared tournament platform serving both individual/B2C and professional/B2B customers.

The following architecture decisions are approved for implementation planning:

1. **Every tournament belongs to exactly one `Organization`.** There is no separate `USER` tournament ownership path.
2. **Individual creators receive a lightweight personal organization/workspace.** Private friend tournaments and enterprise tournaments therefore use the same tenancy, authorization, billing, scoring, judging, and audit infrastructure.
3. **The existing Fish Games event/scoring architecture is preserved and evolved, not replaced.** Existing `GameSession`, `GameEvent`, `GameRules`, deterministic event ordering, UUIDv7 idempotency, immutable void/adjustment behavior, and Fish Legal snapshots are migration assets.
4. **Official tournament state is server-authoritative; capture is local-first.** Devices may operate offline, queue evidence/events, and reconcile later.
5. **Tournament rules, scoring configuration, Fair Play policy, and regulatory context are versioned/snapshotted for official competition.** Historic results never silently change because configuration changed later.
6. **Divisions and award categories are separate concepts.** One entry may belong to a competition division while qualifying for multiple awards/jackpots.
7. **Tournament entries are separate from users.** Guest/imported competitors are supported and may later claim/link an account.
8. **Teams and boats are separate domain entities.** A team may use a boat; neither identity is inferred from the other.
9. **Catch claim, evidence, verification checks, human review, penalties, and official score are separate records.** Original evidence is preserved.
10. **Fair Play is explainable.** QR, GPS, timestamp, duplicate-photo, entry, boat, and metadata checks produce discrete signals/results rather than one opaque fraud score.
11. **Public tournament views use explicit publication projections.** Raw GPS, payment data, device metadata, private Fair Play evidence, and internal notes are private by default.
12. **Payments are separated from competition state.** Orders/payments fund registrations and pools; scoring determines results; a separate approved payout workflow moves funds.
13. **Fiat and crypto collection share a provider abstraction.** Stripe is the initial fiat target; MetaMask is the initial wallet target.
14. **Crypto collection and crypto prize payout are separate feature capabilities.** Crypto payouts require independent enablement/compliance review.
15. **All high-value mutations are auditable and idempotent.** Financial and competition history cannot be silently rewritten.

---

## 2. Existing Architecture to Preserve

The current Fish Games implementation already contains valuable properties that must remain true through migration:

- offline-first local persistence,
- UUIDv7 event identifiers,
- monotonic per-session event sequence ordering independent of device clock,
- pure scoring logic outside React/UI,
- derived scoreboard rather than mutable scoreboard state,
- append-only void/adjustment behavior instead of destructive edits,
- Fish Legal snapshots frozen on game events,
- guest participant hooks via `claimed_user_id`.

### Migration rule

Do not perform a greenfield rewrite of Fish Games.

The tournament platform should introduce durable server-backed tournament entities while adapting the existing event/scoring concepts into the new model. Existing Boat Games can continue operating during migration through adapters until equivalent tournament behavior is available.

---

## 3. Canonical Tenancy Model

### 3.1 Organization is the only tenant boundary

```text
User
  ↓ membership
Organization
  ↓ owns
Tournament
```

Every tournament has:

```text
organization_id NOT NULL
```

There is no polymorphic `owner_type = USER | ORGANIZATION` in the canonical tournament model.

### 3.2 Personal organizations

An individual user creating a casual tournament receives or uses a personal organization/workspace.

Example:

```text
Organization
  id: org_elliott_personal
  kind: PERSONAL
  owner: Elliott

Tournament
  name: Saturday Yellowtail Challenge
  organization_id: org_elliott_personal
  visibility: INVITE_ONLY
```

A professional customer uses the same architecture:

```text
Organization
  kind: BUSINESS
  name: Pacific Coast Tournament Series

Tournament
  organization_id: pacific_coast_org
```

### 3.3 Organization kinds

Recommended:

```text
PERSONAL
CLUB
BUSINESS
NONPROFIT
ENTERPRISE
PLATFORM
```

`kind` affects available product capabilities and onboarding, not data ownership semantics.

### 3.4 Why this is mandatory

A single tenant model simplifies:

- RLS,
- role resolution,
- Stripe connected accounts,
- subscriptions,
- tournament transfer/upgrades,
- public/private data projections,
- audit attribution,
- analytics,
- feature flags,
- support tooling.

---

## 4. Tournament Hierarchy

```text
Organization
 ├── Standalone Tournament
 └── Circuit / Series
      └── Season
           └── Tournament
```

`Tournament.organization_id` is mandatory.

`Tournament.season_id` is nullable.

A circuit/series is one domain concept. UI terminology may display “Circuit”, “Series”, “Trail”, or another label without creating separate database entities.

---

## 5. Core Entities

### Identity and tenancy

```text
User
Profile
Organization
OrganizationMember
OrganizationInvitation
OrganizationFeature
```

### Tournament structure

```text
Circuit
Season
Tournament
TournamentStaff
TournamentRuleSetVersion
TournamentScoringVersion
TournamentVerificationPolicyVersion
TournamentBoundaryVersion
TournamentDivision
TournamentAwardCategory
TournamentSpeciesRule
```

### Participation

```text
TournamentEntry
TournamentEntryIdentity
TournamentTeam
TournamentTeamMember
Boat
TournamentBoat
```

### Competition and integrity

```text
TournamentCatch
CatchEvidence
VerificationSession
VerificationCheck
FairPlaySignal
CatchReview
TournamentPenalty
TournamentDispute
```

### Results

```text
ScoreComputation
Standing
LeaderboardSnapshot
FinalResultSet
```

### Commerce

```text
Order
OrderItem
Payment
PaymentAttempt
PaymentAllocation
Refund
PlatformFee
OrganizerPaymentAccount
PrizePool
PrizePoolEntry
PayoutInstruction
Payout
WalletConnection
CryptoPayment
FinancialEvent
```

### Integrity

```text
AuditEvent
IdempotencyRecord
```

---

## 6. User, Entrant, and Guest Identity

`User` is an authenticated Fish Games account.

`TournamentEntry` is participation in one tournament and must not require an existing user account.

Use a participant identity record capable of representing:

```text
REGISTERED_USER
GUEST
IMPORTED
```

A B2B organizer must be able to import or register competitors who do not yet use Fish Games.

Later account claiming/linking must preserve the original tournament entry and audit history rather than replacing it.

### Required invariant

```text
TournamentEntry.tournament_id = exactly one tournament
```

A user may hold staff roles in one tournament, compete in another, and own an organization independently.

---

## 7. Divisions and Award Categories

These are separate.

### TournamentDivision

Represents a competitive field or classification.

Examples:

- Pro
- Amateur
- Junior
- Kayak
- Private Boat
- Sport Boat

### TournamentAwardCategory

Represents a result/prize category.

Examples:

- Overall Winner
- Biggest Fish
- Biggest Yellowtail
- Daily Jackpot
- Women's Division Award
- Optional Side Pot

An entry may have a primary or permitted set of divisions and may qualify for multiple award categories.

Do not model all prizes as divisions.

---

## 8. Team and Boat Model

A `TournamentTeam` is a competitor grouping.

A `Boat` is a reusable vessel identity.

A `TournamentBoat` is the vessel's tournament-specific registration/inspection/check-in state.

A team may reference a tournament boat, but neither record owns the other.

This supports:

- team events without boats,
- boat events with changing rosters,
- multiple teams associated with a fleet,
- reusable boat profiles across tournaments.

Sensitive vessel data is private unless explicitly published.

---

## 9. Tournament Lifecycle

Canonical states:

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

### Allowed high-level transitions

```text
DRAFT -> REGISTRATION_OPEN | CANCELLED
REGISTRATION_OPEN -> REGISTRATION_CLOSED | CANCELLED
REGISTRATION_CLOSED -> READY | REGISTRATION_OPEN | CANCELLED
READY -> LIVE | CANCELLED
LIVE -> PAUSED | COMPLETED
PAUSED -> LIVE | COMPLETED | CANCELLED
COMPLETED -> RESULTS_PENDING
RESULTS_PENDING -> FINAL
```

`FINAL` is terminal for normal operations.

Corrections after `FINAL` require a privileged audited correction workflow producing a new result-set version; previous final results remain historically addressable.

Financial refunds do not automatically roll tournament lifecycle backward.

---

## 10. Versioned Competition Configuration

When a tournament becomes `LIVE`, official competition configuration must point to immutable versions of:

- rule set,
- scoring configuration,
- verification/Fair Play policy,
- tournament boundaries,
- eligible species rules,
- relevant Fish Legal/regulatory snapshot references.

Draft configuration may be edited before start.

Once a version has been used by official competition evidence, edits create a new version rather than mutating the old one.

This is required for reproducible historical scoring and disputes.

---

## 11. Fish Legal Boundary

Fish Legal and tournament rules remain separate.

```text
Regulatory Context (Fish Legal)
        ↓
Tournament Rule Eligibility
        ↓
Fair Play / Evidence Checks
        ↓
Human Adjudication
        ↓
Scoring Eligibility
```

A tournament may be stricter than law.

A tournament cannot override law.

A missing/unverified legal data pack produces `UNKNOWN`, not an automatic legal declaration.

Competition records retain the regulatory snapshot/version used at the time of adjudication.

---

## 12. Catch / Evidence Model

### TournamentCatch

Represents the competitor's factual claim.

Suggested immutable/raw fields include:

```text
id
tournament_id
entry_id
team_id nullable
tournament_boat_id nullable
species_id
caught_at_device
submitted_at_device
received_at_server
length_mm nullable
weight_g nullable
disposition nullable
client_generated_id
status
created_at
```

Original claimed measurements are not rewritten to represent penalties.

### CatchEvidence

Evidence is one-to-many and typed:

```text
PHOTO
VIDEO
GPS
MEASUREMENT
WEIGHT
DEVICE_METADATA
WITNESS
QR_VERIFICATION
WEIGHMASTER
CUSTOM
```

Original evidence objects are retained. Public derivatives are separate assets/projections.

### Catch lifecycle

```text
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
DISQUALIFIED
PROTESTED
FINAL
```

`FLAGGED` is not a catch lifecycle state; flags are represented by verification/Fair Play signals so multiple simultaneous concerns can exist without corrupting state semantics.

---

## 13. Fair Play Architecture

Fair Play must be explainable and composable.

Do not store a single opaque “fraud score” as the official reason for rejection.

### VerificationCheck

Each check records:

```text
type
result: PASS | FAIL | WARNING | UNKNOWN | NOT_REQUIRED
policy_version_id
evidence references
machine/human source
reason code
created_at
```

Initial types:

```text
PHOTO_PRESENT
PHOTO_DUPLICATE
GPS_BOUNDARY
GPS_ACCURACY
TIME_WINDOW
QR_TOKEN
ENTRY_ACTIVE
BOAT_VALID
MEASUREMENT_PRESENT
WEIGHT_PRESENT
DEVICE_METADATA
WEIGHMASTER_CONFIRMATION
```

### FairPlaySignal

Signals are explainable concerns such as:

```text
QR_EXPIRED
QR_REUSED
GPS_OUTSIDE_BOUNDARY
GPS_LOW_ACCURACY
PHOTO_DUPLICATE
TIMESTAMP_MISMATCH
UNREGISTERED_ENTRY
DEVICE_TIME_ANOMALY
MISSING_REQUIRED_EVIDENCE
```

Signals never silently alter measurements or scores.

Tournament verification policy determines which deterministic failures block approval and which require judge review.

### Human authority

Automation detects and explains.

Officials adjudicate disputed/high-value cases.

All overrides require reason + actor + timestamp.

---

## 14. QR Verification

QR is an optional verification transport, not inherently proof by itself.

Supported session purposes may include:

```text
TOURNAMENT_WINDOW
ENTRY_IDENTITY
BOAT_IDENTITY
CHECK_IN
WEIGH_STATION
CATCH_SESSION
```

### QR payload rule

Use opaque server identifiers and/or cryptographically signed tokens.

Do not encode sensitive personal or financial information.

### Rotating QR

A tournament may create signed time-window tokens:

```text
valid_from
valid_until
purpose
tournament_id
nonce/session_id
signature/key version
```

### Offline behavior

Pre-issued signed verification material may be downloaded before departure and validated locally when safe.

Offline validation produces a locally recorded verification result that is revalidated/reconciled by the server when connectivity returns.

Offline validation must record what could not be confirmed server-side at capture time.

---

## 15. Duplicate Evidence Detection

Store deterministic hashes/fingerprints for evidence where technically appropriate.

At minimum detect exact re-use of the same uploaded binary/evidence identifier.

Future perceptual image similarity may generate review signals but must not automatically accuse/disqualify a competitor without deterministic policy support or human review.

Evidence fingerprints are private integrity metadata.

---

## 16. GPS and Time Trust Model

Store separately:

```text
device_capture_time
device_submission_time
server_received_time
verified_time
latitude
longitude
accuracy_m
source
```

GPS boundary evaluation returns:

```text
INSIDE
OUTSIDE
UNKNOWN
```

Low accuracy can produce `UNKNOWN` or a warning according to policy.

Device time is evidence, not authoritative server time.

Impossible or suspicious timing generates a signal instead of silently rewriting timestamps.

---

## 17. Scoring Service Boundary

Authoritative scoring is pure/domain logic outside UI components.

```text
Frozen Scoring Version
+ Eligible Approved Catches
+ Penalties
+ Tie Breakers
+ Award Categories
        ↓
Scoring Engine
        ↓
ScoreComputation
        ↓
Standing / Leaderboard Projection
```

Initial supported scoring families:

```text
BIGGEST_FISH
TOTAL_WEIGHT
BEST_N_WEIGHT
TOTAL_LENGTH
BIGGEST_LENGTH
POINTS
SPECIES_POINTS
SPECIES_MULTIPLIER
EVERY_FISH_COUNTS
```

`CUSTOM` may exist only through a validated, versioned configuration/plugin contract; arbitrary executable customer code is out of scope.

### Existing scoring migration

Current `GameRules`/pure scoring functions remain available for Boat Games and may become adapters or reusable primitives where semantics match. Do not force professional tournament scoring into existing casual game-mode types.

### Final results

Finalization stores a `FinalResultSet` referencing exact configuration versions and source competition records.

---

## 18. Penalties

Penalties are first-class append-only records.

Targets may include:

```text
CATCH
ENTRY
TEAM
BOAT
```

Types may include:

```text
POINT_DEDUCTION
WEIGHT_DEDUCTION
TIME_PENALTY
CATCH_REMOVAL
DISQUALIFICATION
CUSTOM
```

Original catch weight/length remains unchanged.

Penalty removal/reversal creates an audited reversing record or status transition; it does not erase history.

---

## 19. Reviews and Disputes

### CatchReview

Multiple reviews are allowed.

A review records actor, role, decision, reasons, evidence considered, and timestamps.

### TournamentDispute

Lifecycle:

```text
OPEN
UNDER_REVIEW
UPHELD
OVERTURNED
DENIED
CLOSED
```

Dispute outcomes never delete original decisions; they create new audited decisions/state.

---

## 20. Authorization Model

Use three independent relationships:

```text
OrganizationMember  -> tenant-level authority
TournamentStaff     -> event operational authority
TournamentEntry     -> competitor participation
```

Recommended roles:

```text
PLATFORM_ADMIN
ORGANIZATION_OWNER
ORGANIZATION_ADMIN
ORGANIZATION_STAFF
FINANCE_ADMIN
TOURNAMENT_DIRECTOR
TOURNAMENT_ADMIN
JUDGE
WEIGHMASTER
STAFF
CAPTAIN
ANGLER
```

### Permission principles

- Organization owners/admins manage their organization, not other tenants.
- Finance roles do not automatically receive judging permissions.
- Judges do not automatically receive financial permissions.
- Tournament staff roles are scoped to a tournament unless explicitly inherited from an organization permission.
- Angler participation does not grant tournament administration.
- Public spectator access is not a role assignment; it uses explicit public projections.
- Platform-admin actions require separate privileged service authorization and auditing.

All sensitive mutations re-resolve authorization server-side.

Client-provided role/tenant claims are never trusted as authority.

---

## 21. Public vs Private Data Classification

### Publicable by explicit tournament configuration

Examples:

- tournament name/dates,
- public rules,
- sponsor branding,
- competitor display name,
- approved public catch photo,
- public weight/length,
- leaderboard/standings,
- selected boat/team display information.

### Private by default

- exact raw catch GPS,
- device metadata,
- private evidence originals,
- internal judge notes,
- Fair Play signals/details,
- payment details,
- wallet addresses unless required for an explicit public feature,
- bank/provider account identifiers,
- private vessel registration information,
- contact information.

Public pages query dedicated safe projections/views/API DTOs rather than exposing raw tables.

---

## 22. Financial Domain

Tournament competition and money are separated.

```text
Registration / Purchase Intent
        ↓
Order + OrderItems
        ↓
Payment(s)
        ↓
Allocation
   ├── Organizer Revenue
   ├── Platform Fee
   └── Prize Pool Funding
```

Do not model registration payment as `paid: boolean`.

Order-item types may include:

```text
TOURNAMENT_ENTRY
TEAM_ENTRY
BOAT_ENTRY
MEMBERSHIP
LATE_FEE
SIDE_POT
JACKPOT
MERCHANDISE
DONATION
CUSTOM
```

Payment status and tournament-entry status are separate state machines connected by explicit business rules.

---

## 23. Payment Provider Abstraction

Tournament code depends on a provider-neutral payment interface.

Conceptual contract:

```text
createPayment
confirmPayment
getPaymentStatus
refundPayment
```

Initial adapters:

```text
StripePaymentProvider
CryptoPaymentProvider
```

Provider webhooks/server verification are authoritative for final payment status.

---

## 24. Stripe / Fiat

Evaluate Stripe Connect for business organizations.

`OrganizerPaymentAccount` stores provider account IDs and onboarding/capability state, never raw banking credentials.

Platform fee configuration is explicit and attributable to organization/tournament/order/payment.

Fee strategy may support:

- percentage,
- flat,
- percentage + flat,
- subscription-linked pricing,
- enterprise contract pricing.

Exact commercial pricing is product configuration, not core scoring logic.

---

## 25. Crypto / MetaMask

MetaMask is the initial wallet UX target; wallet architecture must remain provider-neutral.

Never request/store:

- private keys,
- seed phrases,
- wallet passwords.

For fiat-denominated entry fees, crypto checkout creates a temporary quote containing:

```text
fiat amount/currency
crypto amount/asset
exchange rate/source
quoted_at
expires_at
network/chain
```

A wallet signature or submitted transaction hash does not equal confirmed payment.

Server-side chain/provider verification confirms transaction finality according to configured policy.

Transaction identifiers must be unique/idempotent to prevent replay/double credit.

---

## 26. Crypto Collection vs Crypto Payout

Two independent capabilities:

```text
ACCEPT_CRYPTO_PAYMENT
ENABLE_CRYPTO_PAYOUT
```

Accepting crypto does not enable prize payout in crypto.

Crypto payout requires separate organization/tournament capability flags, operational controls, and compliance approval.

---

## 27. Prize Pools and Payouts

`PrizePool` represents restricted competition funding and is separate from organizer revenue.

Examples:

- overall purse,
- big-fish pool,
- species jackpot,
- optional side pot.

Participation in optional pools is explicit via `PrizePoolEntry` and linked order items.

### Money movement boundary

```text
FinalResultSet
        ↓
Payout Calculation
        ↓
PayoutInstruction (DRAFT)
        ↓
Authorized Human Approval
        ↓
Payout Provider
        ↓
Payout status/events
```

The scoring engine never sends money.

Payout instructions reference the final result version used to calculate them.

---

## 28. Financial Audit / Ledger Principles

Financial history uses append-only events where practical.

Record:

- order created,
- payment attempted,
- payment confirmed/failed,
- payment allocation,
- platform fee assessed,
- refund requested/confirmed,
- payout instruction created/approved,
- payout submitted/completed/failed,
- crypto transaction submitted/confirmed.

Refunds and reversals create records; they do not delete the original payment history.

All financial operations are idempotent.

---

## 29. Compliance Boundary

Paid contests, side pots, prize payouts, taxes, money transmission, crypto, and tournament rules may vary by jurisdiction.

Architecture must support capability gating by:

```text
platform
organization
tournament
jurisdiction
```

Legal/compliance enablement is separate from technical capability.

No architecture assumption means a feature is legal everywhere merely because the code supports it.

---

## 30. Offline-First / Server-Authoritative Model

The app must work offshore.

### Local capture

Devices may create locally:

- catches,
- evidence metadata,
- QR scans,
- check-ins where permitted,
- local verification observations.

Every locally generated mutation uses a deterministic client ID/idempotency key.

### Server reconciliation

Server is authoritative for:

- tenant membership,
- official tournament lifecycle,
- official registration status,
- official payment status,
- official verification results after reconciliation,
- judge decisions,
- scoring/final standings,
- payouts.

### Sync statuses

```text
PENDING
SYNCED
CONFLICT
FAILED
```

Conflicts never silently overwrite competition evidence.

Server receipt time is stored separately from device capture time.

---

## 31. Event / Audit Architecture

All material competition and financial changes produce `AuditEvent` or domain-specific immutable financial events.

Examples:

```text
TOURNAMENT_PUBLISHED
RULE_VERSION_ACTIVATED
TOURNAMENT_STARTED
CATCH_SUBMITTED
CATCH_EVIDENCE_ADDED
VERIFICATION_CHECK_COMPLETED
JUDGE_DECISION_RECORDED
PENALTY_APPLIED
DISPUTE_RESOLVED
RESULT_SET_FINALIZED
FINAL_RESULT_CORRECTED
ORDER_CREATED
PAYMENT_CONFIRMED
REFUND_CONFIRMED
PAYOUT_APPROVED
```

Audit records include actor/service, tenant, tournament, entity identifiers, action, reason, timestamps, and safe previous/new state references where appropriate.

---

## 32. RLS / Server Authorization

Supabase/Postgres remains the expected persistence direction unless a later ADR changes it.

### RLS principle

Every tenant-sensitive row has a deterministic path to `organization_id` directly or through a protected parent.

Favor direct `organization_id` on high-volume/security-critical tables when it materially simplifies policies and indexing, while preserving relational constraints to tournament ownership.

### Service operations

Privileged server/service-role operations still perform application-layer authorization before mutation; bypassing RLS is not permission by itself.

### Public reads

Public APIs/views expose allowlisted fields only.

---

## 33. Proposed Relationship Sketch

```text
User
  └─< OrganizationMember >─ Organization
                               ├─< Circuit ─< Season
                               └─< Tournament
                                    ├─< TournamentStaff
                                    ├─< TournamentDivision
                                    ├─< TournamentAwardCategory
                                    ├─< TournamentEntry
                                    │     ├─< TournamentTeamMember >─ TournamentTeam
                                    │     └── identity/user claim
                                    ├─< TournamentBoat >─ Boat
                                    ├─< TournamentCatch
                                    │     ├─< CatchEvidence
                                    │     ├─< VerificationCheck
                                    │     ├─< FairPlaySignal
                                    │     └─< CatchReview
                                    ├─< TournamentPenalty
                                    ├─< TournamentDispute
                                    ├─< Standing / LeaderboardSnapshot
                                    ├─< Order ─< OrderItem
                                    │     └─< Payment / Refund / Allocation
                                    ├─< PrizePool ─< PrizePoolEntry
                                    └─< PayoutInstruction ─< Payout
```

Exact SQL tables/constraints belong in the implementation schema ticket, but implementation must conform to these domain boundaries.

---

## 34. Migration from Existing Fish Games

### Phase A — preserve

Current casual Fish Games continues using existing `GameSession`, `GameParticipant`, `GameEvent`, and pure scoring behavior.

### Phase B — introduce tournament server domain

Create organization/tenancy and tournament domain without deleting existing local stores.

### Phase C — adapters

Provide adapters/mappers for concepts that are compatible:

```text
Game participant -> tournament entry/guest identity where promoted
Game event -> tournament catch/event evidence where promoted
Game scoring configuration -> selected reusable scoring primitives
Fish Legal snapshot -> tournament regulatory snapshot model
```

Do not force all casual game events into professional tournament tables automatically.

### Phase D — convergence

New tournament UX uses the server-backed tournament engine with offline capture support. Casual Boat Games may remain a lightweight mode sharing scoring/evidence primitives where useful.

### Migration invariants

- existing catches remain intact,
- existing Boat Games remain playable during staged migration,
- no existing event IDs are reissued,
- no historic legal/scoring result is silently rewritten,
- destructive migrations require explicit backup/rollback plan.

---

## 35. B2C vs B2B Capability Matrix

| Capability | Personal / Friend Tournament | B2B / Enterprise |
|---|---:|---:|
| Shared tournament engine | Yes | Yes |
| Invite-only event | Yes | Yes |
| Public registration | Optional | Yes |
| Guest/imported entrants | Yes | Yes |
| Teams/boats | Optional | Yes |
| Configurable scoring | Yes | Yes |
| Photo/QR/GPS Fair Play | Configurable | Configurable/Strict |
| Official judging | Optional | Yes |
| Entry fees | Feature-gated | Yes where enabled |
| Crypto payment | Feature-gated | Feature-gated |
| Crypto payout | Separately gated | Separately gated |
| Prize pools | Feature/jurisdiction gated | Feature/jurisdiction gated |
| Circuits/seasons | Optional/Premium | Yes |
| Organization staff | Minimal | Yes |
| White-label branding | No/limited | Premium |
| Sponsor tools | Limited | Yes |
| Advanced reporting | Limited | Yes |

Capabilities change by plan/feature flag; the underlying tournament model does not.

---

## 36. Implementation Sequence

No broad parallel implementation begins until this document is approved and converted into bounded tickets.

Recommended dependency order:

```text
T-001 Tenant / Organization Foundation
        ↓
T-002 Tournament Core + Lifecycle + Versioning
        ↓
T-003 Entry / Guest Identity / Registration
        ↓
T-004 Catch + Evidence + Offline Idempotency
        ↓
T-005 Fair Play / Verification / QR
        ↓
T-006 Judge Review + Penalties + Disputes
        ↓
T-007 Scoring Engine + Standings + Finalization
        ↓
T-008 Public Leaderboard / Tournament Projections
```

Financial work can begin in a separate lane after `T-001` and tournament/entry contracts are stable:

```text
PAY-001 Order / Payment Domain
PAY-002 Stripe Provider
PAY-003 Crypto / MetaMask Provider
PAY-004 Prize Pools / Payout Instructions
```

UI work may proceed in parallel only against approved contracts/mocks and with non-overlapping write lanes.

---

## 37. Parallel-Agent Contract

The repository AI operating system remains authoritative.

For this initiative:

- one coordinating COO owns sequencing,
- architect owns structural decisions,
- each implementation ticket has one write lane,
- agents do not independently change shared contracts,
- unexpected architecture needs return to architect,
- code reviewers remain read-only,
- git-integrator alone integrates approved lanes,
- no duplicate Claude/Codex work unless intentionally requested.

Shared contracts that require architect approval to change after implementation begins:

- organization/tenant ownership,
- tournament lifecycle,
- entry identity model,
- catch/evidence boundaries,
- configuration versioning,
- scoring service interface,
- payment provider interface,
- Fair Play verification result semantics,
- public/private data classification.

---

## 38. Risks / Required Follow-Up Reviews

Implementation tickets must explicitly address these risks:

1. RLS complexity and cross-tenant leakage.
2. Offline conflict/replay/idempotency correctness.
3. Media evidence storage costs and retention.
4. Explainability/false positives in Fair Play checks.
5. Payment and payout compliance by jurisdiction.
6. Crypto price volatility and transaction finality.
7. Result reproducibility after rule/configuration updates.
8. Scaling leaderboard reads during live events.
9. Migration compatibility with existing Boat Games.
10. Privacy of raw catch locations and competitor evidence.

Security, payment, and compliance tickets require specialist review before production enablement.

---

## 39. Deferred / Non-Blocking Decisions

These do not block Phase 1 architecture:

- custom domains,
- native white-label apps,
- livestream/broadcast production,
- hardware weigh-station integrations,
- satellite messaging integrations,
- advanced perceptual-image ML,
- sponsor analytics,
- international tax automation,
- arbitrary customer scoring code,
- blockchain smart-contract prize escrow.

The domain model intentionally leaves room for them without requiring them now.

---

## 40. Final Architecture Acceptance Criteria

ARCH-001 is approved only if the reviewer confirms:

- every tournament has one organization tenant,
- personal tournaments use personal organizations,
- RLS has one deterministic tenant ownership path,
- guest/imported entries do not require Fish Games accounts,
- teams and boats are independent,
- divisions and awards are independent,
- rules/scoring/Fair Play/boundaries can be versioned/frozen,
- original catch evidence is not destructively rewritten,
- Fair Play checks are discrete/explainable,
- QR has signed/opaque token semantics and offline reconciliation,
- scoring is authoritative outside UI and reproducible,
- final result corrections are versioned/audited,
- public projections exclude sensitive raw data,
- fiat and crypto payments share a provider-neutral boundary,
- crypto payout is separately gated from crypto acceptance,
- scoring never directly sends money,
- prize pools and organizer revenue are separate,
- financial operations are auditable/idempotent,
- offline capture reconciles to server-authoritative official state,
- migration preserves existing Fish Games integrity properties,
- implementation can be split into exclusive agent write lanes without changing these contracts.

---

## 41. Implementation Gate

**DO NOT OPEN THE IMPLEMENTATION BOARD UNTIL THE FINAL REVIEW PASSES.**

After approval, the coordinating architect/COO converts this architecture into dependency-ordered implementation tickets with explicit owners, allowed-write paths, dependencies, acceptance criteria, and tests.

No implementation agent may reinterpret or silently replace the architectural contracts in this document.