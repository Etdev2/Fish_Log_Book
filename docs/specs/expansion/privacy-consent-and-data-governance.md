# Privacy, consent and data governance

**Status:** Proposed — **blocking dependency** for the map, research export, agency, AI and biometric specs
**Date:** 2026-09-15
**Governs:** consent records, data-access grants, location precision policy, coordinate-access auditing, retention, deletion, export
**Extends:** `docs/architecture/ontology.md` §6, `supabase/migrations/20260828120100_v1_rls.sql`
**Audit:** `00-repository-audit.md` §3.2, §6 G3
**Phase:** 0 (rules) → 1 (enforcement) → 2 (grants and audit surfaces)

---

## 1. Problem statement

A fishing spot is the most commercially and personally sensitive datum this product will
ever hold. `ontology.md` §6 already says so, and already ships the two primitives that
make protection possible (`geo_cell_1km`, `geo_cell_10km`) plus default-deny RLS. What it
does not ship is any of the machinery that turns those primitives into a policy: there is
no consent record, no access grant, no minimum-group-size gate, no log of who read an
exact coordinate, no retention clock, no deletion path and no export.

The expansion brief proposes sharing catch data with researchers, conservation groups and
state agencies, and proposes doing so at scale and across jurisdictions. Every one of
those disclosures is irreversible. Building them on the current foundation — RLS and good
intentions — would produce a system where the *absence* of a leak is an accident of the
fact that no sharing feature exists yet.

This spec defines the rules first, so that every later spec cites them instead of
inventing its own.

---

## 2. Users and stakeholders

| Stakeholder | What they need | What they can do that hurts |
|---|---|---|
| Recreational angler | Confidence that a logged spot never leaves their account without an act they took deliberately | Consent to something they did not read |
| Fishing partner / crew | See the trip they were actually on | Screenshot and forward |
| Tournament judge | Boundary validation and evidence for a specific catch in a specific event | Retain access after the event |
| Charter/organization admin | Operate a fleet's records | Treat employees' personal logs as company property |
| Researcher | Enough precision to answer an approved question | Ask for exact coordinates "to be safe" |
| Government agency | Compliance and stock-assessment data | Receive data subject to public-records disclosure |
| Conservation org | Habitat and pressure signal | Publish a map that maps a spot |
| Adversary — commercial | Reverse-engineer productive spots to sell or fish | Buy a "conservation" tier |
| Adversary — personal | Locate a specific person's fishing pattern | Correlate small aggregates |
| Fish Log Book | A dataset with a lawful basis, and no headline | Ship a sharing feature before this one |

---

## 3. Product goals

1. **Default private, always.** Exact coordinates never leave the owning angler's rows
   without an explicit, scoped, revocable, logged grant.
2. **Minimum precision necessary.** Every disclosure states the coarsest precision that
   answers the question, and the system serves exactly that, never more.
3. **Legible consent.** An angler can read, in one screen, what is shared, with whom, at
   what precision, until when, and can stop it.
4. **Auditable.** Every read of an exact coordinate by anyone other than the owner writes
   an immutable audit row that the owner can see.
5. **Reversible where reversible, honest where not.** Withdrawal stops future use; the
   system says plainly what cannot be recalled (a published aggregate, a regulatory
   submission an agency is legally required to keep).
6. **Conservation use and commercial exploitation are separated by structure**, not by a
   promise in a terms document.

---

## 4. Non-goals

- Legal advice. `counsel` drafts, a licensed attorney reviews, and neither this file nor
  the product gives anyone legal advice.
- A general-purpose sharing/social feature. `ROADMAP.md` Part 3 kills the social feed and
  nothing here revives it.
- Anonymity against a determined state actor with a warrant. We minimise and log; we do
  not promise to defeat lawful process. The consent copy must not imply otherwise.
- Cryptographic differential privacy in Phase 1. Stated as a Phase 3 research item in §17,
  not a Phase 1 claim.
- Re-litigating dark mode, offline design or any other settled ADR.

---

## 5. User stories

1. As an angler, I open **Privacy** and see one sentence per active grant: *"CDFW pilot —
   10 km cells, species and date only, until 2027-06-30. Stop."*
2. As an angler, I log a white seabass at a spot I have fished for twenty years and the
   app never offers it to any public surface at better than 10 km, ever, regardless of my
   other settings.
3. As an angler, I catch a species on the sensitive list and the app tells me, at the
   moment of logging, that this species' location is protected more strongly than my
   default — and does it in one line I do not have to dismiss.
4. As a crew member, I see the trip I was on, at full precision, because the skipper
   granted it for that trip — and lose it when the grant expires, not silently forever.
5. As a judge, I see the boundary verdict (`inside` / `outside` / `unknown`) for a
   submitted catch and **not** its coordinates, unless the tournament's verification
   policy required coordinate review and my read is logged.
6. As a researcher, I request 1 km precision for a project, get 10 km, and see the reason:
   *"Approved at 10 km. 1 km needs a data-access committee review and per-angler opt-in."*
7. As an agency analyst, I export a dataset and the file header states the precision,
   the k-anonymity threshold, the temporal delay and the exact grant that authorised it.
8. As an angler, I delete my account and my catches leave every downstream dataset that
   can still be regenerated, and I am told, in specific words, which published aggregates
   cannot be recalled.
9. As an angler, I export my own data and choose — with the default set to **no** —
   whether coordinates are included.
10. As `counsel`, I can answer "what were we allowed to do with this row on this date"
    from the database alone.

---

## 6. Complete workflow

### 6.1 The precision ladder

One ordered vocabulary, used by every spec in this directory. Nothing may invent a level.

| Level | Precision | Who may ever see it |
|---|---|---|
| `EXACT` | stored lat/lng (5 dp) + `gps_accuracy_m` | The owning angler. Anyone else only via a logged, scoped grant. |
| `CELL_1KM` | `geo_cell_1km` | Enrichment cache keys (already), trusted partners by grant, judges by policy |
| `CELL_10KM` | `geo_cell_10km` | The **finest** granularity any cross-user aggregate may group by (`ontology.md` §6) |
| `CELL_50KM` | new generated column | Default for public and sensitive-species surfaces |
| `ZONE` | named marine/regulatory area only, no cell | Sensitive species, public maps, press |
| `NONE` | no geography at all | Species/date-only exports |

**Rule P1.** A grant names one level. A service that can serve level *n* must not serve
level *n−1* by composition — an API that returns `CELL_10KM` must not also return a
station id, a spot name, a tide-station-derived value or a bathymetric depth precise
enough to re-derive the cell. `ontology.md` §6 already names station ids as
location-bearing; this rule generalises it.

**Rule P2.** Coarsening happens **server-side, before serialisation**. A client must never
receive a precise value it is expected not to display.

### 6.2 The four consent surfaces

```text
1  Account-level consent      — what may ever leave this account, at what level
2  Program consent            — a named program (a state pilot, a research project)
3  Event consent              — a tournament, for its duration, for its catches
4  Per-catch override         — this fish is more private than my default
```

Consent is **additive and intersected**: effective precision for a disclosure is the
*coarsest* of account level, program level, per-catch override and the species policy
(§6.3). Nothing widens anything.

### 6.3 Sensitive-species policy

A species-level `location_policy` with values `standard` | `protected` | `suppressed`.

- `protected` — cap any non-owner disclosure at `CELL_50KM`, add a minimum 30-day
  temporal delay. For rare, listed, spawning-aggregating or heavily targeted species.
- `suppressed` — cap at `ZONE`, 90-day delay, and exclude from any public surface
  entirely. For species where a spot disclosure is a poaching risk (white abalone,
  totoaba, listed rockfish, resident giant sea bass aggregations).

The policy is set per species **per region** (a species heavily protected in one
jurisdiction may be a common food fish in another), sourced from the agency that lists it,
and versioned like a regulation pack so a 2026 catch keeps its 2026 policy.

**Rule P3.** Policy changes apply going forward to *disclosures*, not retroactively to
stored rows. Tightening a policy must re-suppress already-published aggregates at the next
rebuild; a policy that tightens triggers a rebuild rather than waiting for one.

### 6.4 Grant lifecycle

```text
REQUESTED -> APPROVED -> ACTIVE -> (EXPIRED | REVOKED | SUPERSEDED)
                     \-> DENIED
```

Every grant carries: grantee (org, project or person), purpose text in plain language,
precision level, temporal delay, field allow-list, start and end date, legal basis,
whether re-disclosure is permitted, and the approving actor. **A grant with no end date is
invalid.** Maximum 24 months; renewal is a new grant, not an extension.

### 6.5 k-anonymity gate

No pooled figure renders or exports unless, within the cell-and-period being reported:

- `distinct_anglers >= k` (default **k = 5**), and
- no single angler contributes more than **60 %** of the rows, and
- `distinct_catches >= 20`.

`ontology.md` §6 item 5 already flags this as "a privacy constraint as much as a
statistical one" and assigns the threshold to `biostat`. The numbers above are the
**defaults this spec adopts until `biostat` returns a computed threshold**; the code reads
them from one config so the replacement is a value change.

Below threshold, the surface says *"Not enough independent reports here yet"* — never a
zero, never an empty cell that reads as "no fish here".

### 6.6 Deletion and retention

| Class | Retention | On account deletion |
|---|---|---|
| Catch, snapshot, gear, trip | Owner-controlled, indefinite by default | Hard-deleted within 30 days |
| Media blobs | Owner-controlled | Hard-deleted within 30 days, including derived thumbnails and embeddings |
| Derived embeddings (biometrics, AI) | Bound to source media | Deleted with the media; deletion job must name the embedding store |
| Coordinate-access audit rows | 7 years, immutable | **Retained**, with the angler id pseudonymised. An audit log you can delete is not an audit log — the consent copy says this. |
| Pooled aggregates already published | Rebuilt on schedule; the angler's rows drop out of the next rebuild | Told plainly: already-distributed files cannot be recalled |
| Regulatory submissions an agency must keep | Agency's statutory schedule | Told plainly at the point of consent, not at deletion |
| Tournament results and evidence | Per `tournament-domain-model.md` §29 compliance boundary | Retained; a competitive result is a public fact of the event |

**Rule P4.** A consent screen that offers deletion must state, before the user agrees, the
classes that survive deletion. If we cannot honour "delete everything", we must not imply
it.

---

## 7. Screen and component requirements

### 7.1 `/settings/privacy` — Privacy and sharing

One screen, four blocks, no nested settings tree.

1. **What is shared right now.** One card per active grant. Each: grantee name, plain
   purpose sentence, precision chip (`10 km cells`), end date, and a **Stop sharing**
   button that is a real button, 48 px, not a toggle buried in a row.
   Empty state (the correct state today): *"Nothing is shared. Your catches and locations
   are on your device and in your account only."*
2. **Your defaults.** Precision ladder as a single-select list with a plain-language line
   under each. Default `NONE`.
3. **Protected species.** Read-only list of species whose location is protected more
   strongly than the default in the active region, each with its source.
4. **Your data.** Export (with a coordinates checkbox, default off), and Delete account
   with the §6.6 survivorship statement shown *before* the confirm.

### 7.2 Consent moment component

Reused by every program, project, tournament and agency flow. Never a wall of text.

- One sentence of what. One sentence of who. One line of precision, in the angler's units
  and words (`"About 10 km — roughly a harbour, not a spot"`).
- The end date, always visible, never in a footnote.
- Two buttons of equal visual weight. Consent is not a primary action; **Not now** is not
  a tertiary link.
- No pre-ticked boxes, ever. No "by continuing you agree".
- A permanent link to the full text that opens in place, not a new context.

### 7.3 Per-catch privacy control

On the catch detail sheet, not the quick-log path. One control: *"Extra private"* with a
one-line explanation. Setting it caps disclosure at `ZONE` for that catch forever. It is a
one-way switch in the UI (an angler can loosen it in Settings with a confirm, so that a
mistap is recoverable but not casual).

**Rule P5.** No privacy control is added to the quick-log path. The brief is explicit that
the fast species-first tap must not slow down, and a privacy decision at the moment of a
flapping fish is a decision made badly.

### 7.4 Coordinate-access receipt

When a non-owner reads an exact coordinate, the owner gets a receipt in the privacy screen:
*"2026-10-02 — Judge, Harbor Bay Shootout, read the coordinates of 1 catch. Reason:
boundary protest."* Not a push notification; a list the angler can check.

---

## 8. Data requirements

New tables. All `angler_id`-owned tables keep the existing default-deny RLS pattern with
`(select auth.uid())`.

```sql
-- What the angler agreed to, when, and to what text.
consent_record (
  id uuid pk,
  angler_id uuid not null references angler(id) on delete cascade,
  scope text not null check (scope in ('ACCOUNT','PROGRAM','EVENT','CATCH')),
  scope_ref_id uuid,                    -- program / tournament / catch, null for ACCOUNT
  consent_document_id text not null,    -- versioned text
  consent_document_version integer not null,
  precision_level text not null check (precision_level in
    ('EXACT','CELL_1KM','CELL_10KM','CELL_50KM','ZONE','NONE')),
  field_allow_list text[] not null default '{}',
  granted_at timestamptz not null,
  expires_at timestamptz,               -- null only for ACCOUNT-scope defaults
  withdrawn_at timestamptz,
  withdrawal_reason text,
  locale text not null,                 -- which translation they actually read
  ui_surface text not null,             -- which screen obtained it
  created_at timestamptz not null default now()
);
-- Immutable: a consent record is never updated. Withdrawal writes withdrawn_at only;
-- a changed mind writes a NEW record. Enforced by trigger, same pattern as
-- tg_tournament_catch_immutable_claim.

-- Who may read what, at what precision, until when.
data_access_grant (
  id uuid pk,
  grantee_kind text not null check (grantee_kind in
    ('ORGANIZATION','RESEARCH_PROJECT','AGENCY','PARTNER_ANGLER','JUDGE','SUPPORT')),
  grantee_id uuid not null,
  subject_kind text not null check (subject_kind in ('ANGLER','TOURNAMENT','PROGRAM','COHORT')),
  subject_id uuid,
  precision_level text not null,
  temporal_delay_days integer not null default 0,
  field_allow_list text[] not null,
  purpose text not null,                -- plain language, shown to the angler verbatim
  legal_basis text not null,
  redisclosure_permitted boolean not null default false,
  status text not null check (status in
    ('REQUESTED','APPROVED','ACTIVE','DENIED','EXPIRED','REVOKED','SUPERSEDED')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,         -- NOT NULL. no perpetual grants.
  approved_by uuid,
  approved_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint grant_window check (ends_at > starts_at),
  constraint grant_max_24_months check (ends_at <= starts_at + interval '24 months')
);

-- Every non-owner read of a location at better than CELL_10KM. Append-only.
location_access_audit (
  id uuid pk,
  occurred_at timestamptz not null default now(),
  actor_id uuid,                        -- null for service jobs, which name themselves below
  actor_kind text not null check (actor_kind in ('ANGLER','JUDGE','STAFF','SERVICE','AGENCY','RESEARCHER')),
  actor_service text,                   -- required when actor_kind = 'SERVICE'
  grant_id uuid references data_access_grant(id),
  subject_angler_id uuid not null,
  catch_id uuid,
  precision_served text not null,
  row_count integer not null,
  purpose text not null,
  request_fingerprint text not null,    -- hash of the query shape, for pattern detection
  constraint audit_needs_grant_or_owner check (grant_id is not null or actor_kind = 'ANGLER')
);
-- No UPDATE or DELETE policy exists for this table for any role. Retention is by
-- partition drop at 7 years, executed by migration, not by the API.

-- Per-region, per-species location sensitivity, versioned like a regulation pack.
species_location_policy (
  species_id text not null references species(id),
  region_id text not null,
  policy text not null check (policy in ('standard','protected','suppressed')),
  min_precision text not null,
  temporal_delay_days integer not null default 0,
  source_url text not null,
  source_verified_at date not null,
  effective_from date not null,
  effective_to date,
  version integer not null,
  primary key (species_id, region_id, version)
);

-- A named research or agency programme a grant can hang off.
research_project (
  id uuid pk, name text not null, organization_id uuid, principal_investigator text,
  approved_precision text not null, irb_or_equivalent_ref text, data_management_plan_url text,
  public_summary text not null,          -- shown to anglers verbatim
  starts_at date not null, ends_at date not null,
  status text not null check (status in ('PROPOSED','APPROVED','ACTIVE','CLOSED','WITHDRAWN'))
);
```

**Additional column on `catch`:** `privacy_override text check (privacy_override in
('extra_private'))`, nullable. Plus one new generated column `geo_cell_50km`, mirroring the
existing generated-column pattern exactly.

**Nothing in this spec adds a `public` boolean to `catch`.** `ontology.md` §6 refuses the
speculative column and it is still right: visibility is a function of grants, not a flag.

---

## 9. API and service requirements

One service owns coarsening. No screen, job or export computes it independently.

```text
core/privacy/precision.ts      pure: (lat, lng, level) -> cell | zone | null
core/privacy/effective.ts      pure: (account, program, catchOverride, speciesPolicy) -> level
core/privacy/k-anonymity.ts    pure: (rows, k, dominance, minCatches) -> Suppressed | Aggregate
```

Pure and vector-tested under `src/core/`, per ADR 003, so the Swift client cannot
reimplement the policy differently.

- **`POST /api/grants`** — request. Never auto-approves anything above `CELL_10KM`.
- **`GET /api/me/sharing`** — every active grant touching the caller, in the angler's words.
- **`DELETE /api/grants/:id`** — revoke. Takes effect on the next request, not the next
  rebuild; already-delivered files are stated as unrecallable.
- **`POST /api/exports`** — asynchronous, produces a manifest (§10 of
  `fisheries-intelligence-map.md`), writes an audit row, and refuses if k fails.
- **Enrichment calls** (`catch-environmental-enrichment.md`) round to `CELL_1KM` **before
  the outbound request and before any log line**, per `ontology.md` §6 item 4. The
  enrichment service is an `actor_kind = 'SERVICE'` that must name itself in
  `actor_service`.

**Rule P6.** No user-supplied text (spot names, notes, display names) may enter a log
line, exception message, breadcrumb or error report. Existing rule, `ontology.md` §6
item 3; restated because the expansion adds many new services that could break it.

---

## 10. Offline behaviour

- Consent is obtained online. An offline client may **not** mint a consent record; the
  screen says so and the action is unavailable rather than queued. A consent captured
  while offline is a consent whose document version we cannot prove.
- Withdrawal **is** queued offline, because failing safe means honouring a stop as early as
  possible. It is written to the outbox as a `patch` and applied on reconnect; until then
  the client behaves as if withdrawn.
- Effective precision is computed locally from the cached policy for display purposes only.
  Nothing offline transmits.
- Per-catch `extra_private` is a local column change, carried by the existing outbox.

---

## 11. Privacy and security requirements

1. Default deny at every layer: RLS, service, serialiser.
2. Coarsening server-side before serialisation (Rule P2).
3. Exact coordinates require a grant **and** write an audit row, atomically, in the same
   transaction as the read where the read is via RPC.
4. Photo EXIF GPS stripped on ingest, before the file lands in storage
   (`ontology.md` §6 item 1). This is a *Phase-2 blocker* for any media feature: it is not
   optional and it is not "later".
5. Station ids, buoy ids, spot names and spot-derived labels never appear in cross-user
   output (Rule P1).
6. Composition attacks are actively tested: the k-anonymity test suite includes a
   differencing case — two overlapping queries whose difference isolates one angler must
   both be refused, not just individually pass.
7. Service-role keys never reach the browser. Existing pattern in
   `src/lib/supabase/service-role.ts`; every new server route follows it.
8. `redisclosure_permitted = false` is the default, and the export manifest says so in
   words a recipient's counsel will read.

---

## 12. Accessibility requirements

Per `docs/design/06-accessibility-baseline.md`, with three additions specific to consent:

- Consent text at the body scale (18 px), never at caption scale. A privacy disclosure set
  in the smallest type in the app is a dark pattern regardless of intent.
- Both consent buttons meet the 48 px floor with 12 px separation and **equal** visual
  weight; the accept button carries no colour advantage.
- Precision levels are never communicated by colour or icon alone — each carries text
  ("About 10 km").
- The grant list is a real list with one item per grant, announced as such; "Stop sharing"
  names its grant in its accessible name (`Stop sharing with CDFW pilot`), not just "Stop".
- Withdrawal confirmation is announced `aria-live="polite"`, per the baseline's §5.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Angler withdraws mid-tournament | Tournament results and evidence retained per §6.6; **future** disclosure stops. The screen says which is which. |
| Species reclassified `standard` → `suppressed` | Next aggregate rebuild suppresses historic cells too (Rule P3). Already-exported files are listed as unrecallable in the audit. |
| Catch has no coordinates | Precision ladder is a no-op; the row is still subject to k-anonymity on species/date. |
| Two grants overlap | Coarsest wins. Never the union. |
| Grant expires mid-export | The export fails and says so. It does not deliver a partial file under an expired grant. |
| Minor account | No grant above `CELL_50KM`, no program consent, ever, without a verified guardian flow. Until that flow exists, minors' data is `NONE`. |
| Angler in a jurisdiction with data-localisation law | Grant creation is blocked pending `counsel`; the system must be able to refuse by jurisdiction from day one. |
| Shared device / family account | Consent binds to `angler_id`. The consent screen names the account. |
| Agency subject to public-records law | Handled in `government-fisheries-partnership.md` §11; the grant carries `redisclosure_permitted` and the consent copy states the risk *before* the angler agrees. |
| Deleted angler's rows inside an aggregate already computed | Dropped at next rebuild; rebuild cadence is stated to the angler (weekly). |

---

## 14. Failure states

- **Policy service unavailable** → deny. Every disclosure path fails closed. There is no
  "assume standard" fallback; a missing species policy is treated as `protected`.
- **Audit write fails** → the read fails. An unlogged exact-coordinate read must not
  happen. This is the one place where availability loses to auditability.
- **k-anonymity computation fails** → suppress, with the "not enough reports" copy.
- **Export job fails** → no partial file, no partial audit. Idempotent retry on the same
  request id.
- **Consent document version missing** → consent cannot be obtained; the screen shows an
  error, not a default document.

---

## 15. Analytics and success metrics

Measured on the platform's own telemetry, and none of it uses user text.

| Metric | Target |
|---|---|
| Exact-coordinate reads by non-owners with no grant | **0**, alerted, treated as an incident |
| Audit coverage (non-owner exact reads with an audit row) | 100 % |
| Consent comprehension (post-consent quiz in the pilot cohort: "what precision did you agree to?") | ≥ 80 % correct |
| Median time on the consent screen | ≥ 12 s (a faster median means nobody is reading it; that is a design failure, not a win) |
| Grants revoked within 30 days of grant | < 10 % (higher means the consent moment is misleading) |
| Aggregate cells suppressed for k | Reported, not minimised. A falling number is only good if angler count is rising. |
| Subject-access / deletion requests fulfilled within 30 days | 100 % |

---

## 16. Acceptance criteria

1. `core/privacy/` exists, is pure, and has JSON vector tests covering every ladder level,
   every intersection of account/program/catch/species policy, and the differencing attack.
2. No route, job or view computes a cell or a k-gate outside `core/privacy/`. A test greps
   for `floor(lat` and `geo_cell` outside the allowed files and fails.
3. `location_access_audit` has no `update` or `delete` policy for any role, proven by a
   test that attempts both as each role and expects failure.
4. `data_access_grant` rejects a null or > 24-month `ends_at` at the database level.
5. `consent_record` rejects an `UPDATE` to any field other than `withdrawn_at` /
   `withdrawal_reason`, by trigger.
6. `/settings/privacy` renders correctly at 320 px with zero grants, one grant, and
   40 grants, and its empty state is the honest "nothing is shared" copy.
7. An end-to-end test proves: grant → exact read → audit row → revoke → next read denied.
8. A test proves the enrichment path rounds to `CELL_1KM` before both the outbound HTTP
   call and any log statement.
9. The deletion job deletes media, thumbnails **and** embeddings, proven by a test that
   asserts the embedding store is empty for the deleted angler.
10. `rls-coverage.test.ts` (which already exists) is extended to require a policy on every
    new table in this spec.

---

## 17. Dependencies

- `counsel` — consent text, legal bases per jurisdiction, the public-records warning, the
  minors position, data-localisation refusal list. **HIGH tier, and on the critical path.**
- `biostat` — the real k threshold, dominance ratio and minimum-catch count replacing §6.5
  defaults; the differencing-attack test cases.
- `architect` — sign-off that `core/privacy/` is the only coarsening authority.
- Sensitive-species lists per region: sourced from each agency's own listing, with
  `source_url` and `source_verified_at`, following the citation-or-nothing standard Fish
  Legal already holds itself to.
- Object storage with EXIF stripping (audit G2) before any media-bearing feature.

---

## 18. Risks and unanswered questions

1. **Consent is not comprehension.** An angler who taps through a well-designed screen has
   still not understood a 10 km cell. The 12-second median metric is an attempt to detect
   this; it is not a solution. *Unanswered: is a comprehension check ethically required for
   a government programme, and does adding one destroy enrolment?*
2. **Public-records law can defeat consent.** Data lawfully given to a state agency may
   become disclosable regardless of our grant terms. §11 of the government spec addresses
   it; the residual risk is real and belongs in the consent copy.
3. **k = 5 is a guess.** It is the common default and `biostat` has not computed the
   product's own. A spot fished by five friends is not protected by k = 5.
4. **Aggregates leak over time.** Repeated weekly aggregates of a stable population allow
   differencing. Mitigation is delay plus dominance caps; the real answer may be formal
   differential privacy, which is a Phase 3 research item and is not claimed now.
5. **Bathymetry and zone labels can re-derive a cell** when combined with a coarse cell and
   a species. Rule P1 forbids the combination; enforcing it requires a field-combination
   allow-list that does not exist yet. *Open: who owns that allow-list?*
6. **The audit log is itself sensitive.** It records who looked at whom. Access to it needs
   its own governance, which this spec does not yet define. *Open.*
7. **Minors.** Undesigned. Currently the safe answer (`NONE`) is also the useless one.
8. **We have no DPO, no incident-response runbook and no breach-notification path.** Not
   this spec's scope but it is a prerequisite for the government pilot, and naming it here
   is the point.

---

## 19. Recommended implementation phase

**Phase 0** — §6.1 ladder, §6.3 policy shape, §6.5 gate definition, `core/privacy/` with
vectors, and the `counsel` review. No UI. Cheap, and it unblocks everything.

**Phase 1** — `consent_record`, `location_access_audit`, `geo_cell_50km`, per-catch
override, `/settings/privacy` with the honest empty state, export with coordinates off by
default, deletion job.

**Phase 2** — `data_access_grant`, `research_project`, grant UI, coordinate-access
receipts, k-gate enforcement in the map and export services.

**Phase 3** — differencing-attack hardening, formal privacy research, minors flow.
