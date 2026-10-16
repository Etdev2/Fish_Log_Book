# Government and fishing-licence partnership

**Status:** Proposed — every commercial term in it is an **unvalidated hypothesis**
**Date:** 2026-09-15
**Governs:** agency organizations, agency dashboards, reporting programmes, licence integration, pilot strategy
**Extends:** `docs/architecture/tournament-domain-model.md` §3 (tenancy), `privacy-consent-and-data-governance.md`
**Audit:** `00-repository-audit.md` §6 G7
**Phase:** 4 (pilot), with Phase 0 legal and discovery work

---

## 1. Problem statement

The brief proposes offering Fish Legal, catch reporting and fisheries intelligence to state
fish-and-wildlife agencies; integrating with licence purchase and renewal; testing a ~$10
per-licence technology fee; sharing revenue with agencies or their conservation programmes;
and expanding state by state and internationally.

The brief also, correctly, instructs that mandatory use, the fee, revenue sharing and
licence integration be treated as hypotheses requiring legal, procurement, political and
customer validation. This spec takes that instruction literally and is structured around it.

The honest position, stated once and not softened elsewhere:

> **We currently have no agency relationship, no procurement pathway, no legal review, no
> security certification, and no evidence that any agency wants this.** Every number in §9
> is a hypothesis. The purpose of Phase 4 is to convert two or three of them into facts
> cheaply, and to discover early which ones are false.

The agency's name is the **California Department of Fish and Wildlife (CDFW)**. Other states
use different names and different statutory structures, and the product must not assume
California's shape generalises — it does not.

---

## 2. Users and stakeholders

| Stakeholder | What they actually want | What kills the deal |
|---|---|---|
| Agency data / stock-assessment staff | Better recreational catch data, cheaply | Data of unknown provenance they cannot defend in a stock assessment |
| Agency licensing staff | Nothing to break. Licence sales are revenue-critical infrastructure | Any risk to the licence transaction |
| Agency enforcement | Compliance, not an app | A product that looks like surveillance of licence holders |
| Agency IT / security | Certification, audits, accessibility law | No SOC 2, no VPAT, no state security review |
| Agency legal / public records | Statutory authority for every data use | Data they must disclose under public-records law |
| Agency leadership | A political win with no downside | Anglers complaining to legislators about a $10 fee |
| Licence vendor (an incumbent) | To keep the contract | Us. **They are the real competitor, not another fishing app.** |
| Angler | Value for a fee they did not ask for | A mandatory app to fish |
| Fish Log Book | Distribution and a defensible dataset | A three-year procurement with no revenue |

**The incumbent licence vendor is the single most under-appreciated stakeholder in the
brief.** In most states, licence sales run through an established vendor with a
multi-year contract and deep integration. That vendor will not welcome a fee attached to
their transaction, and they are in the room before we are.

---

## 3. Product goals

1. Give agencies data they can **defend**: known provenance, known precision, known
   coverage, known bias.
2. Give anglers something they would choose, whether or not an agency is involved.
3. Never make the product feel like enforcement.
4. Make every adoption level work standalone, so a pilot that stalls still delivers value.
5. Be honest about bias: voluntary catch data is not a survey, and we say so in every
   export.

---

## 4. Non-goals — and the hard boundaries

- **We do not report anglers to enforcement.** Not by feature, not by export, not by
  subpoena-friendly design. If an agency requires angler-attributable enforcement data as a
  condition of partnership, **we decline the partnership.** This is a product boundary, and
  every other section is written under it.
- We do not replace a licence system of record.
- We do not represent Fish Legal, AI ID, or any output as official regulations, an
  enforcement determination, or legal advice.
- We do not claim scientific validity we have not demonstrated.
- We do not build agency-scale architecture before an agency has signed anything.

---

## 5. User stories

1. As a CDFW stock-assessment analyst, I download quarterly aggregated catch-per-area by
   species with explicit coverage, precision and bias statements.
2. As an agency programme manager, I run a voluntary reporting programme for one fishery and
   see submissions, coverage and data quality in a dashboard.
3. As an angler in that programme, I opt in, report my catches through the normal logging
   flow, and get something back: better local regulations in the app, programme results, and
   a visible contribution record.
4. As an angler who did **not** opt in, nothing changes and nothing nags me.
5. As an agency legal officer, I can see exactly what data we hold, under what consent, at
   what precision, and how to have it deleted.
6. As an agency IT reviewer, I receive a security package, a VPAT, and a data-flow diagram
   without asking twice.
7. As a licence holder under a hypothetical mandatory programme, I can meet my reporting
   obligation in the app **or** by the agency's existing method, and the app never becomes a
   single point of failure for legal compliance.

---

## 6. The three adoption levels

Each is a complete product. Level 2 does not require Level 1 to have converted, and Level 3
requires legislation we do not control.

### Level 1 — Voluntary agency pilot

```text
Agency says:   "We are interested. Run a pilot."
Angler says:   "I'll help."
We provide:    a programme, an opt-in, a dashboard, an export, a report
We charge:     nothing, or a small pilot fee
Legal:         a data-sharing agreement. No statute, no procurement.
Duration:      one season
```

**This is the only level that is achievable in the next 12 months**, and it is the only one
worth designing in detail now. Everything below is scaffolding.

### Level 2 — Official licence-holder benefit or reporting companion

```text
Agency says:   "This is an official companion app. Here is our regulation data."
Angler gets:   agency-authored Fish Legal packs, official programme reporting
We charge:     an agency subscription, or a consumer subscription the agency endorses
Legal:         procurement. Security review. Accessibility (Section 508 / state law).
               Possibly an RFP.
Duration:      multi-year
```

The realistic value exchange here is **Fish Legal authorship** (agency-supplied regulation
data, `fish-legal-agency-integration.md` §6.4 level 2–3) in return for **reporting reach**.
Neither side pays much; both gain. This is a far more plausible deal than a fee.

### Level 3 — Legally authorised mandatory reporting

```text
Statute or regulation requires reporting for a species / fishery / programme
The agency designates acceptable methods — ours may be one
We charge:     per the authorising instrument
Legal:         legislation or rulemaking. Years. Public comment. Litigation risk.
```

**Requirements that are non-negotiable at Level 3:**

- The app is **never the only method.** Paper, phone and web alternatives must exist, or we
  have created an access barrier for anglers without smartphones, without data coverage, or
  with disabilities our app fails.
- Full accessibility conformance is a legal requirement, not a quality goal.
- Availability becomes a legal obligation with consequences for the angler. That is an
  operational commitment this team cannot currently make.
- Data becomes a government record with retention and disclosure rules we do not control.

---

## 7. Complete workflows

### 7.1 Agency onboarding

```text
discovery call → data-needs workshop → pilot scope → legal review (both sides)
  → data-sharing agreement → security review → programme configured
  → angler recruitment → season → analysis → published report → renew or stop
```

**Rule G1.** The pilot has a defined end and a published result, including a null result.
An open-ended pilot is a way of never being told no.

### 7.2 Angler enrolment

```text
angler sees a programme (in-app, or via an agency channel)
  → what it is, who runs it, what is shared, at what precision, for how long
  → consent (privacy §6.2 program consent) — no pre-ticks, equal-weight buttons
  → normal logging; programme-required fields appear only where the programme needs them
  → contribution record visible to the angler
  → withdraw at any time
```

**Rule G2.** Programme participation never changes the core logging flow for
non-participants, and adds at most one field for participants. A programme that makes
logging slower reduces the data it exists to collect.

### 7.3 Reporting and compliance

| Programme type | Shape |
|---|---|
| Voluntary survey | Opt-in, aggregate export, no angler identity |
| Species-specific reporting (e.g. a tagged-species card) | Per-catch submission, angler-identified **to the agency only**, under explicit consent |
| Trip-level reporting | Trip declaration and return, matching the agency's existing logbook form |
| Compliance attestation (Level 3) | Submission receipt with a reference number, retained by the angler as proof |

**Rule G3.** A compliance submission always produces a **receipt the angler keeps**, works
offline with a queued receipt, and never leaves the angler unable to prove they complied
because our server was down.

### 7.4 Agency dashboard

```text
Programme health     enrolled, active, submissions, coverage by area, trend
Data quality         completeness, GPS accuracy distribution, verification mix,
                     known biases, sample sizes per cell
Catch intelligence   aggregated catch by species / area / period, k-gated, delayed
Effort               where derivable, with effort_quality stated (D5)
Compliance           submissions vs expected, for designated programmes only
Exports              request, manifest, history, audit
Administration       programme config, users, roles, audit log
```

**Rule G4.** Every figure shows its sample size and its precision. A dashboard that lets an
analyst quote a number without its uncertainty will eventually produce a regulation based on
eleven fish.

---

## 8. Data requirements

```sql
government_organization (
  id uuid pk, organization_id uuid not null references organization(id),
  jurisdiction_kind text not null check (jurisdiction_kind in
    ('STATE','FEDERAL','TRIBAL','PROVINCE','NATIONAL','INTERNATIONAL')),
  jurisdiction_code text not null,          -- 'US-CA'
  official_name text not null,              -- 'California Department of Fish and Wildlife'
  short_name text not null,                 -- 'CDFW'
  public_records_regime text,               -- statute reference; drives the consent warning
  data_sharing_agreement_ref text, agreement_starts date, agreement_ends date,
  security_review_status text check (security_review_status in
    ('NOT_STARTED','IN_PROGRESS','APPROVED','REJECTED')),
  status text not null check (status in ('PROSPECT','PILOT','ACTIVE','SUSPENDED','ENDED'))
);

agency_program (
  id uuid pk, government_organization_id uuid not null references government_organization(id),
  name text not null, program_kind text not null check (program_kind in
    ('VOLUNTARY_SURVEY','SPECIES_REPORTING','TRIP_REPORTING','COMPLIANCE')),
  adoption_level integer not null check (adoption_level between 1 and 3),
  species_scope text[], region_scope text[], season_start date, season_end date,
  required_fields text[] not null default '{}',
  precision_level text not null,            -- privacy ladder
  temporal_delay_days integer not null default 0,
  legal_authority text,                     -- statute / regulation citation, or null at L1
  angler_facing_summary text not null,      -- shown verbatim at consent
  status text not null check (status in ('DRAFT','OPEN','CLOSED','ARCHIVED'))
);

report_submission (
  id uuid pk, program_id uuid not null references agency_program(id),
  angler_id uuid not null references angler(id) on delete cascade,
  catch_id uuid references catch(id) on delete set null,
  trip_id uuid references trip(id) on delete set null,
  submitted_at timestamptz not null default now(),
  receipt_reference text not null unique,   -- the angler's proof (Rule G3)
  payload jsonb not null,                   -- what was sent, frozen
  precision_level text not null,
  consent_record_id uuid not null references consent_record(id),
  status text not null check (status in ('QUEUED','SUBMITTED','ACKNOWLEDGED','REJECTED','WITHDRAWN')),
  agency_acknowledged_at timestamptz, agency_reference text
);

license_link (
  id uuid pk, angler_id uuid not null references angler(id) on delete cascade,
  government_organization_id uuid not null,
  license_number_hash text not null,        -- HASHED. we do not store licence numbers.
  license_class text, valid_from date, valid_to date,
  verification_method text not null check (verification_method in
    ('SELF_DECLARED','AGENCY_API','VENDOR_API','DOCUMENT_UPLOAD')),
  verified_at timestamptz, status text not null
);
```

**Rule G5.** Licence numbers are stored as a salted hash, never in plaintext. A licence
number is a government identifier tied to a real name and address, and the only operation we
need is equality.

**Rule G6.** `report_submission.payload` is frozen at submission. What we sent is what we
sent; a later catch amendment produces a **new** submission referencing the first, not a
rewrite.

---

## 9. Commercial hypotheses — stated as hypotheses

Each must be falsifiable and cheap to test. None is a plan.

| # | Hypothesis | Test | Likely verdict, stated honestly |
|---|---|---|---|
| H1 | An agency will run a voluntary pilot with us | 10 discovery conversations | **Plausible.** Agencies pilot things. This is the one to test first. |
| H2 | An agency will supply regulation data for Fish Legal | Ask, in the pilot | **Plausible and cheap.** The highest-value, lowest-cost ask in the whole brief. |
| H3 | An agency will pay a subscription | Procurement conversation | Slow. State IT procurement is 12–36 months and usually needs an RFP. |
| H4 | A **$10 per-licence technology fee** can be attached to licence sales | Legislative and licensing-staff conversation | **Unlikely as described.** Licence fees are usually statutory. Adding a fee generally requires legislation, faces organised angler opposition, and touches the incumbent vendor's contract. |
| H5 | Revenue can be shared with an agency or its conservation programme | Legal review | **Legally fraught.** Revenue sharing with a regulator that also approves our product raises conflict-of-interest questions that a state ethics office, not a product team, must answer. |
| H6 | Licence purchase/renewal can be integrated | Vendor and agency conversation | **Vendor-gated.** Not ours to decide. |
| H7 | Mandatory use can be authorised | Rulemaking | Years, and only for a narrow fishery. |
| H8 | Aggregated data has standalone commercial value to non-government buyers | Customer conversations | **Untested, and the most dangerous to assume** — it also collides with the consent basis anglers gave. |

**Recommended pricing posture for Phase 4:** a **fixed-fee pilot** (or free), not per-licence
and not revenue-shared. Per-seat and per-licence pricing invite a procurement process; a
small fixed pilot fee often fits inside a manager's discretionary authority. That single
difference can be the gap between a three-month start and a three-year one.

**On the $10 fee, plainly:** it is the most attractive number in the brief and the least
likely to survive contact with a licensing statute. The product should be built so that it
is *never* the thing the business depends on. If it ever happens, it will happen after a
successful programme has made the case — not as the opening ask.

---

## 10. Procurement and security readiness

Nothing below is optional at Level 2. All of it takes months and none of it is engineering
work anyone enjoys.

| Requirement | Status today |
|---|---|
| SOC 2 Type II or equivalent | **None** |
| State security assessment (e.g. CA SIMM/STD 140 style) | **Not started** |
| VPAT / Section 508 + state accessibility conformance | **Not produced.** The baseline is strong (`06-accessibility-baseline.md`) but a VPAT is a document, and it must be true |
| Data-flow and system-boundary diagrams | Derivable from `data-architecture-expansion.md`; not produced |
| Incident response and breach notification | **None** |
| Business continuity / SLA | **None** |
| Insurance (cyber, E&O) | Unknown |
| Subcontractor/subprocessor list | Not maintained |
| Records-retention schedule aligned to the agency's | Not produced |

**Rule G7.** Do not begin a Level-2 conversation before the security package exists. An
agency that asks for it and receives nothing is a conversation that ends, and the second
conversation is much harder than the first.

---

## 11. Data ownership, permitted use and public records

1. **Anglers own their data.** Agencies receive a licence to use it for the programme's
   stated purpose, at the stated precision, for the stated period. That is the whole grant.
2. `redisclosure_permitted` defaults false and is stated in every export manifest.
3. **Public-records law can override our terms.** Data held by a state agency may be
   disclosable on request, regardless of what our agreement says. Therefore:
   - Data shared with an agency is **aggregated and coarsened by default**
     (`CELL_10KM` or coarser, delayed).
   - Angler-identified data is shared only where a programme legally requires it, with a
     consent that **states the public-records risk in plain words before the angler agrees**.
   - The agreement asks the agency to assert an exemption where one exists — and we do not
     rely on them winning.
4. Permitted uses are enumerated in the agreement: stock assessment, management, conservation
   planning, and programme evaluation. **Enforcement targeting of identifiable individuals
   is excluded** (§4).
5. Retention follows the agency's statutory schedule for what they hold, and ours for what we
   hold, and those differ. The consent says so.
6. Derived agency products (a published stock assessment) are the agency's and are not
   recallable. Deletion cannot reach them, and the consent says so.

---

## 12. Accessibility requirements

Two audiences, two standards.

**Angler-facing** — `docs/design/06-accessibility-baseline.md`, plus, at Level 3, the legal
obligation that a person who cannot use the app can still comply (a non-app alternative is
required, §6 Level 3).

**Agency-facing dashboard** — this is government software and is subject to Section 508 and
state law:

- WCAG 2.1 AA minimum across the dashboard, including every chart and table.
- Every visualisation has a data-table equivalent (this is also better for analysts).
- Keyboard-only operation of every function, including exports.
- Screen-reader tested, not merely linted.
- Works at 200 % zoom in a desktop browser.
- **A VPAT that is true.** An inaccurate VPAT is a procurement failure and a legal exposure.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Angler withdraws mid-programme | Future sharing stops; already-submitted reports are government records and stay. Said **before** consent. |
| Agency requests exact coordinates | Denied unless a specific grant and consent exist; the grant is logged and time-boxed. |
| Agency requests angler identity for enforcement | **Refused** (§4). Escalates to `counsel` and `ceo`. |
| Agency subpoena or lawful order | `counsel` handles; angler notified where lawful; the transparency policy states our practice. |
| Programme spans two states | Two organizations, two consents, two precision policies. Never merged. |
| Licence expires mid-season | `license_link` status changes; programme eligibility follows; the app does not accuse anyone of fishing illegally. |
| Agency ends the agreement | Programme closes; sharing stops; the angler is told; data already delivered is not recallable. |
| Tribal jurisdiction | Distinct sovereign; `jurisdiction_kind = 'TRIBAL'`; its own agreement and its own data-sovereignty terms, which may be stricter than anything in this document. |
| Mexico / international | Different legal basis, likely data-localisation; `counsel` before any conversation. |
| Agency dashboard user leaves the agency | Access removed via organization membership; grants are per-organization, never per-person-forever. |

---

## 14. Failure states

- Submission fails → queued with a local receipt (Rule G3); the angler is never left unable
  to prove compliance.
- Agency API unavailable → queue and retry; the dashboard states last-successful-sync.
- Export fails → no partial file, no partial audit.
- Consent expires mid-programme → sharing stops; the angler is prompted to renew; nothing
  auto-renews.
- Security incident → notification per the agreement and applicable law. **We do not have a
  runbook for this and that is a Phase-4 blocker.**

---

## 15. Analytics and success metrics

**Pilot success is not usage.** It is whether the agency can use the data.

| Metric | Target |
|---|---|
| Discovery conversations held | 10 before any build |
| Agencies expressing pilot interest | ≥ 2 |
| Pilot agreements signed | 1 |
| Enrolled anglers in the pilot fishery | ≥ 200 |
| Areas meeting k ≥ 5 for aggregation | ≥ 60 % of the pilot area |
| Submission completeness (required fields present) | > 90 % |
| **Agency analyst rating: "could you use this in a stock assessment?"** | **The only metric that matters** |
| Published pilot report | 1, including limitations and null findings |
| Fish Legal packs upgraded to agency-reviewed | ≥ 1 |
| Angler complaints about the programme | Tracked; a spike is a design failure |

---

## 16. Acceptance criteria

1. No agency feature ships before `privacy-consent-and-data-governance.md` is implemented.
2. Every agency data access is grant-gated, k-gated, delayed, and audited.
3. No agency-facing endpoint can return exact coordinates without a specific grant, proven
   by a test.
4. Licence numbers are stored hashed; a test asserts no plaintext column exists.
5. Programme consent states the public-records risk verbatim before the accept action,
   proven by a copy test.
6. `report_submission` payloads are immutable; amendments create new submissions (Rule G6).
7. Every dashboard figure renders its sample size and precision (Rule G4), proven by a test.
8. The dashboard passes WCAG 2.1 AA automated checks and a manual keyboard pass, and the
   VPAT reflects the result.
9. A submission made offline produces a local receipt and syncs (Rule G3).
10. No feature exists that reports an identifiable angler to enforcement (§4), proven by
    architecture review and recorded as a standing constraint.

---

## 17. Dependencies

- `privacy-consent-and-data-governance.md` — **hard blocker.**
- `data-architecture-expansion.md` §8 — aggregates and exports.
- `fish-legal-agency-integration.md` — the agency's cheapest, highest-value entry point.
- `counsel` — agreements, public records, ethics/conflict review of H5, tribal and
  international terms. **HIGH tier, months of work, on the critical path.**
- `biostat` — bias statements, coverage, and the defensibility of every figure.
- `ceo` — the §4 boundaries, and acceptance that H4/H5/H7 may be permanently false.
- Security certification and an incident-response runbook — neither exists.

---

## 18. Risks and unanswered questions

1. **We are competing with an incumbent licence vendor** for a transaction that agency staff
   consider critical infrastructure. Nothing in the brief accounts for this and it is the
   most likely reason H4 and H6 fail.
2. **Voluntary catch data is biased** — self-selected, skewed toward successful trips and
   engaged anglers. `SPEC.md` D27 and `ontology.md` already take unresolved marks seriously
   for exactly this reason. **Every export must carry a bias statement**, and an agency that
   uses our data without one will eventually blame us for the conclusion.
3. **Revenue sharing with a regulator** (H5) may be legally impermissible and is, at
   minimum, a conflict-of-interest question for a state ethics office. It should not appear
   in a pitch deck before `counsel` clears it.
4. **Mandatory use would change the product's relationship with its users** from "chose it"
   to "made to use it". Support load, tone, expectations and reviews all change. The team
   should decide whether it *wants* Level 3 before pursuing it.
5. **Procurement can consume a year with no revenue.** Fixed-fee pilots under a manager's
   discretionary authority are the mitigation.
6. **An agency partnership constrains the product** — regulatory-approved release cycles,
   change control, uptime obligations.
7. **Political risk cuts both ways.** An administration change can end a programme;
   an angler backlash over a fee can end a relationship.
8. *Open:* is the agency the customer at all? A plausible alternative reading is that the
   **agency is a data partner and a credibility source**, and the customer is the angler and
   the tournament operator. That framing is cheaper, faster, and consistent with `SPEC.md`
   D14 (free logging, charge for interpretation). **It deserves an explicit `ceo` decision
   before any procurement effort is spent.**

---

## 19. Recommended implementation phase

**Phase 0, now, costing almost nothing:** 10 discovery conversations. Ask what data they
lack, how they'd defend it, who owns the licence contract, and what a pilot would need. Ask
whether they'd supply regulation data. **Build nothing.**

**Phase 1–2, as a by-product:** the privacy, consent, aggregate and export machinery — all of
which is justified by the angler-facing product alone.

**Phase 4:** one Level-1 pilot, one fishery, one season, fixed fee or free, published report.

**Never, until a pilot has succeeded:** per-licence fees, revenue sharing, mandatory
reporting, multi-state expansion, or any architecture built for agency scale.
