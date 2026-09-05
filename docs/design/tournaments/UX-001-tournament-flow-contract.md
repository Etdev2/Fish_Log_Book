# UX-001 — Tournament UX Contract & Flow Map

**Status:** Ready for implementation handoff  
**Source:** `docs/architecture/tournament-domain-model.md`  
**Scope:** Product/UX contract only. No production UI implementation in this lane.

## 1. Product principle

The same tournament engine serves personal/B2C and organization/B2B users. The UX must therefore progressively reveal complexity instead of presenting enterprise controls to every angler.

A casual user should be able to create a private tournament in a few steps. A tournament director should be able to continue into advanced configuration without switching products or creating a separate tournament type.

## 2. Recommended information architecture

```text
/tournaments
  /new
  /[tournamentId]
    overview
    register
    catches
    leaderboard
    rules
    participants
    judge
    manage
      setup
      entries
      teams-boats
      verification
      scoring
      staff
      finance (future/payment-gated)
```

Routes are a UX proposal, not an API or database contract.

## 3. Entry points

### Personal user

Primary CTA: **Create Tournament**

Default path:

```text
Create Tournament
 -> name + date/time
 -> visibility
 -> scoring preset
 -> invite/join method
 -> verification preset
 -> review
 -> create draft
```

Advanced settings remain collapsed unless requested.

### Organization user

Primary CTA: **Create Organization Tournament**

Adds progressive sections for:

- circuit/season
- divisions
- awards
- teams/boats
- staff/judges
- verification policy
- public registration
- branding
- payment configuration when enabled

The underlying tournament object is the same.

## 4. Personal/private tournament flow

```text
Tournaments
 -> Create Tournament
 -> "Friends / Private" recommended preset
 -> Tournament name
 -> Date or date range
 -> Visibility: PRIVATE | INVITE_ONLY | UNLISTED | PUBLIC
 -> Scoring preset
 -> Verification: Basic | Standard | Strict | Custom
 -> Review
 -> DRAFT tournament
 -> Invite friends
```

### Simplicity rule

For a friend tournament, the first screen must not require organization-management concepts. The user's personal organization/workspace is infrastructure and does not need to be explained unless they enter account/business settings.

## 5. Join / registration flow

Support registered, guest, and imported entrants.

```text
Invite link / join code / public tournament
 -> Tournament preview
 -> Join / Register
 -> Existing account OR continue as guest where allowed
 -> required eligibility fields
 -> team/boat selection if required
 -> optional paid items shown as pending until payment contract is available
 -> registration submitted
 -> status screen
```

### Registration state presentation

Do not collapse all state into "registered".

User-facing states may include:

- Draft / incomplete
- Submitted
- Awaiting organizer approval
- Payment required
- Confirmed
- Waitlisted
- Ineligible / action required
- Cancelled

Exact backend state names remain owned by T-003.

## 6. Tournament lifecycle visibility

Every organizer screen should show current lifecycle state prominently:

```text
DRAFT
REGISTRATION OPEN
REGISTRATION CLOSED
READY
LIVE
PAUSED
COMPLETED
RESULTS PENDING
FINAL
CANCELLED
```

High-risk transitions such as Start Tournament, Finalize Results, Cancel Tournament, or post-final correction require confirmation and an explanation of consequences.

## 7. Angler live-tournament home

During LIVE state, prioritize:

1. Log tournament catch
2. Current standing / leaderboard when visible
3. Required verification instructions
4. Time remaining / tournament status
5. Rules and boundary summary
6. Sync/offline state

Do not make users hunt through administrative navigation while on the water.

## 8. Catch submission + evidence flow

```text
Log Tournament Catch
 -> species
 -> measurement(s) required by event
 -> photo/video evidence
 -> GPS/time capture where required
 -> QR/session verification where required
 -> review submission
 -> save locally immediately
 -> sync/reconcile
 -> submitted / review-required status
```

The UI must distinguish:

- captured locally
- uploaded/synced
- under review
- approved
- rejected
- action/evidence requested

Never tell the angler "verified" merely because evidence was captured locally.

## 9. Offline UX

Offshore connectivity is expected to fail.

### Required states

- **Saved on this device** — local capture succeeded.
- **Sync pending** — server has not confirmed receipt.
- **Synced** — server received the submission.
- **Conflict / review required** — reconciliation needs attention.
- **Upload failed** — retry available without recreating the catch.

A persistent but non-alarming sync indicator should be visible during live competition.

Never silently discard evidence or imply server confirmation while offline.

## 10. Fair Play UX

Verification must be explainable.

### Angler view

Show requirements before submission:

- Photo required
- GPS required
- QR required
- Measurement required

After submission, show understandable outcomes such as:

```text
✓ Photo received
✓ Entry active
✓ QR valid
⚠ GPS accuracy low — organizer may review
```

Do not expose internal anti-fraud metadata, device risk signals, or private judge notes to public views.

### Judge view

Recommended review card:

```text
Catch #1842
Angler: [display name]
Species / measurement
Submitted time

Verification
✓ Photo present
✓ Entry active
✓ QR valid
⚠ GPS accuracy low

Evidence gallery
Rule references
Prior review history

Actions
APPROVE
REJECT
REQUEST MORE EVIDENCE
ESCALATE
```

Every adverse/override action requires a reason.

## 11. Leaderboard/public projection

Public leaderboard reads only safe projections.

May display when configured:

- display name
- team/boat public label
- approved catch photo derivative
- public weight/length
- points/standing
- award category

Must never expose by default:

- raw GPS
- device metadata
- payment details
- wallet addresses
- internal Fair Play signals
- private evidence originals
- judge notes
- private vessel/contact information

## 12. Organizer dashboard

Recommended hierarchy:

### Before event

- Setup completeness
- Registration count/status
- Staff/judges
- Rules/scoring
- Verification requirements
- Teams/boats
- Public page preview

### During event

- live status
- submissions queue
- Fair Play/review queue
- leaderboard
- incidents/disputes
- connectivity/sync exceptions

### After event

- pending reviews
- disputes
- scoring/finalization
- final-results confirmation
- exports/reporting
- payout workflow later, when enabled

## 13. B2C vs B2B progressive disclosure

### Personal / friend default

Show:

- name/date
- invite privacy
- simple scoring preset
- basic verification
- participants
- leaderboard

Hide advanced features behind "Advanced tournament settings".

### Organization / enterprise

Expose based on permissions/features:

- circuit/season
- divisions
- award categories
- boats/teams
- staff/judges
- strict verification policy
- sponsor/branding
- reporting
- payment configuration

No duplicate UI architecture should emerge for B2C vs B2B.

## 14. Screen / modal inventory

### Participant surfaces

- Tournament list
- Tournament preview
- Join/register
- Registration status
- Live tournament home
- Log catch
- Evidence review
- Submission detail/status
- Leaderboard
- Rules/boundary summary
- My tournament catches

### Organizer surfaces

- Create wizard
- Tournament dashboard
- Setup/settings
- Entries
- Teams/boats
- Staff
- Verification policy
- Judge queue
- Catch review detail
- Scoring configuration
- Leaderboard management
- Results finalization
- Disputes

### Modals / sheets

- Join code
- Invite/share
- lifecycle transition confirmation
- request more evidence
- reject/override reason
- offline/sync conflict detail
- finalization confirmation

## 15. Component/data-contract assumptions

### Approved architecture assumptions

- every tournament resolves to one organization tenant
- entrant identity is separate from User
- teams and boats are separate
- divisions and awards are separate
- catch/evidence/review are separate
- Fair Play checks are discrete and explainable
- final scoring is server-authoritative
- public views use safe projections

### Mock until implementation tickets stabilize

- exact API route names
- exact registration status enums
- exact payment status mapping
- exact component names
- exact server-action signatures

UX implementation agents must consume stabilized contracts rather than create competing domain types in components.

## 16. Accessibility and mobile constraints

- Primary competition flows must work one-handed on a phone.
- Important actions require at least 44x44 CSS pixel target areas.
- Status must not rely on color alone.
- Evidence requirements need text labels and accessible instructions.
- Error/review states must explain recovery action.
- Modal/sheet flows must preserve keyboard and screen-reader focus.
- Avoid dense enterprise controls in the live angler experience.
- Keep live catch logging shallow; minimize typing while on the water.

## 17. Implementation handoff order

UX application work should begin only as backend contracts stabilize:

```text
T-002 -> tournament overview/lifecycle shells
T-003 -> registration/join surfaces
T-004 -> catch/evidence/offline surfaces
T-005 -> Fair Play/QR surfaces
T-006 -> judge/dispute surfaces
T-007 -> leaderboard/finalization surfaces
T-008 -> public tournament/leaderboard surfaces
```

Mocks are acceptable before these tickets merge, but production UI must not redefine their contracts.

## 18. Done criteria

UX-001 is complete when an implementation agent can build the tournament experience without rediscovering navigation, participant/organizer journeys, privacy rules, offline messaging, or B2C/B2B progressive disclosure.
