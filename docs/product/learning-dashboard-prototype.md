# Learning Dashboard prototype

**Status:** Founder-approved prototype brief, ready for implementation  
**Owner:** `coo` for sequence, `ux-ui` for interaction, `head-dev` for implementation  
**Audience:** Founder, team, and the agents implementing the first slice

## Outcome

Add a visual Learning Dashboard that can be opened from the app's normal navigation on
localhost and a Vercel deployment, including on an iPhone. It has two modes:

1. **User Guide** teaches a customer why Fish Log Book is useful and how to use it. It
   launches an interactive overlay on the real app and is intended to become a shipped
   customer feature.
2. **Builder View** lets the founder and team inspect what works, what is mocked, what is
   planned, and what still needs a decision. It is a team prototype, not a customer
   feature, even though this first version is intentionally reachable from normal
   navigation without a passcode.

The dashboard is a visual product-direction tool as well as a tutorial. It must help a
non-developer understand both the user journey and how the parts of the system connect.

## Current truth

The web app currently has one route, `/`, showing Fish Log Book and Supabase connection
status. There is no navigation shell and the catch, conditions, history, and insights
screens are not implemented in the current app tree. The first slice must never present
those screens as working software. It may show them as clickable mockups labeled
**Prototype**.

## Smallest useful first slice

Build one responsive dashboard route at `/learn` and one simple global navigation entry
named **Learn & Build**. The dashboard contains two large choices: **User Guide** and
**Builder View**.

### User Guide

Provide a four-step guided journey:

1. **Open the app** — introduce the value: quickly record fishing activity and connect it
   with conditions over time.
2. **Log a catch** — show a visual mock of the quick-mark/catch workflow.
3. **Review conditions** — explain tide and moon context; do not show weather or pressure
   as implemented because `SPEC.md` D25 excludes them from the current web prototype.
4. **See history and insights** — show the calendar/notebook direction and explain that
   useful patterns improve as honest catch and blank-trip history accumulates. Do not
   render a bite score; `SPEC.md` D12a reserves it for V2+ with enough evidence.

The guide uses a focused overlay with a highlighted target, short plain-language copy,
**Back**, **Next**, **Skip**, **Exit**, and a visible `Step n of 4` indicator. Where a real
screen exists, the overlay sits on that screen. Where it does not, it opens a clearly
labeled prototype mock within the dashboard. The guide can be replayed from the dashboard
at any time. Completing or skipping it must not change production data.

### Builder View

Show the same four-part journey as a clickable visual map. Every item has exactly one
status:

- **Working now** — backed by a real route and behavior in the repository.
- **Prototype** — interactive or visual, but not real product behavior.
- **Planned** — approved direction that has not been mocked or built.
- **Needs a decision** — work that cannot be represented honestly without a founder or
  owner decision.

The initial catalog is deliberately explicit:

| Item | Initial status | Reason |
|---|---|---|
| App entry and Supabase status | Working now | `/` exists and reports the current connection state. |
| Quick mark / log a catch | Prototype | Show the approved D22 direction as a mock; no catch UI exists yet. |
| Tide and moon conditions | Planned | D25 approves them, but the current app has no user-facing conditions surface. |
| Calendar history and insights | Prototype | Show the approved D23 direction as a mock; no calendar route exists yet. |
| Future Builder View protection | Needs a decision | Access control is deferred; the eventual method and timing are not selected. |

These statuses describe repository reality at implementation time, not permanent product
labels. Update them only when evidence in the app changes.

Selecting an item opens a detail panel that includes:

- what the user sees and why it matters;
- whether the selected surface is real or simulated;
- a small visual data flow: user action -> local/app state -> shared data or enrichment ->
  result shown to the user;
- a button to open the related real route or prototype mock;
- feedback controls: **Approved**, **Needs changes**, or **Idea**;
- reviewer name, optional comment, and recorded date/time.

For the first slice, feedback is stored only in that browser (for example, local storage)
and is labeled **Saved on this device only**. Include a reset action. Do not imply that
feedback synchronizes between the founder's iPhone and a teammate's device.

## Navigation and visual behavior

- Add **Learn & Build** to a simple app-level navigation bar visible on mobile and desktop.
- Keep tap targets comfortable on an iPhone and avoid hover-only interactions.
- Use large cards, short text, strong contrast, and a persistent way back to the dashboard.
- Make status labels visible in text, not color alone.
- Keep overlays keyboard-accessible: focus moves into the overlay, controls have useful
  labels, Escape exits, and focus returns to the triggering control.
- Preserve the dashboard's two-mode structure even as real routes replace mocks. A mock is
  promoted to **Working now** only after its related behavior exists and has been tested.

## Prototype boundaries

This first version intentionally has **no passcode or access control**. Builder View must
therefore contain no secrets, credentials, private customer information, precise fishing
coordinates, unreleased pricing, or operational controls. Anything unsafe to publish on
a public preview URL does not belong in it.

Deployment to Vercel does not make Builder View private. Before the app has customers or
sensitive internal material, add access control and remove Builder View from customer
navigation. That is a separate security decision and is explicitly deferred, not solved
by a hidden URL.

Shared feedback is also deferred. A later version may use authenticated team identities
and Supabase persistence so comments synchronize across devices. Until that work is
approved and implemented, the device-local label is mandatory.

No prototype surface writes catches, trips, locations, conditions, or feedback to the
production database. Mock data must be visibly fictional and must not contain real user
coordinates.

## Acceptance criteria for the first slice

- From `/`, the founder can tap **Learn & Build** and choose either mode on an iPhone-sized
  viewport.
- User Guide completes the four-step journey with Back, Next, Skip, Exit, progress, replay,
  and clear real-versus-mock labeling.
- Builder View shows all four statuses, opens an explanation/data-flow panel, and opens a
  related route or mock.
- Feedback captures status, name, optional comment, and time, survives a refresh on the
  same browser, can be reset, and says it is device-only.
- No secrets or real coordinates appear, and no prototype interaction writes production
  data.
- Keyboard and touch navigation work; lint, build, and focused tests pass; the result is
  inspected in a desktop browser and an iPhone-sized viewport.

## Ordered native Codex handoffs

Use the active Codex adapters and the cheapest adequate tier. Keep this as one write
workstream unless file ownership is split in advance; helpers in the same workstream do
not need separate worktrees.

### 1. `repo-scout` — LOW, read-only

```text
TASK: Locate the current app shell, routes, styling, testing setup, and any reusable visual prototypes.
MODEL TIER: LOW
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: src/app/, src/components/, docs/design/, package.json, this brief
ALLOWED WRITES: None
CONSTRAINTS / DO NOT: Do not propose new architecture or edit files.
EXPECTED OUTPUT: Concise path map, existing conventions, and confirmed test commands.
DONE WHEN: ux-ui and head-dev can work without rescanning the repository.
```

### 2. `ux-ui` — MEDIUM, design the interaction in the shared workstream

```text
TASK: Turn this brief into the responsive dashboard, overlay, builder map, detail panel, and feedback interaction design.
MODEL TIER: MEDIUM
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: This brief, repo-scout path map, docs/product/SPEC.md D12a/D21-D25, docs/design/
ALLOWED WRITES: Approved design docs and front-end files assigned by head-dev.
CONSTRAINTS / DO NOT: Label mocks honestly; no secrets, real coordinates, database writes, passcode, or bite score.
EXPECTED OUTPUT: Implementable screen states and accessible interaction behavior; front-end changes only if assigned.
DONE WHEN: Every acceptance criterion has a visible state, including mobile and keyboard behavior.
```

### 3. `head-dev` — MEDIUM, implement the first slice

```text
TASK: Implement the approved Learning Dashboard first slice and device-local feedback.
MODEL TIER: MEDIUM
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: This brief, repo-scout map, ux-ui states, relevant Next.js 16 docs under node_modules/next/dist/docs/
ALLOWED WRITES: Assigned application, component, style, and focused test files on the workstream branch.
CONSTRAINTS / DO NOT: No production-data writes, auth, shared feedback backend, secrets, or unsupported feature claims.
EXPECTED OUTPUT: Working localhost feature with tests and a short changed-file/check report.
DONE WHEN: Acceptance criteria are met and lint/build/focused tests pass.
```

### 4. `test-agent` — LOW, verify

```text
TASK: Verify the four-step guide, Builder View states, local feedback, reset, navigation, and no production writes.
MODEL TIER: LOW
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: This brief and the implementation diff
ALLOWED WRITES: Focused test files only if assigned; otherwise read-only verification.
CONSTRAINTS / DO NOT: Do not redesign production code.
EXPECTED OUTPUT: Pass/fail evidence for every acceptance criterion and exact failures.
DONE WHEN: Automated checks and desktop/iPhone-sized manual checks are reported.
```

### 5. `code-reviewer` — MEDIUM, read-only review

```text
TASK: Review correctness, accessibility, truthful status labeling, data isolation, and scope.
MODEL TIER: MEDIUM
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: This brief, implementation diff, and test evidence
ALLOWED WRITES: None
CONSTRAINTS / DO NOT: Do not fix findings or broaden the feature.
EXPECTED OUTPUT: Findings ordered by severity with file/line evidence, or an explicit no-findings result.
DONE WHEN: head-dev can resolve every finding without interpreting reviewer intent.
```

### 6. `git-integrator` — LOW, integrate after approval

```text
TASK: Confirm checks and review resolution, then mechanically integrate the approved branch.
MODEL TIER: LOW
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: Workstream branch, test report, code-review report, docs/team/HOUSE-RULES.md
ALLOWED WRITES: Git operations and mechanical conflict fixes only.
CONSTRAINTS / DO NOT: Return semantic conflicts to head-dev or architect; do not guess product behavior.
EXPECTED OUTPUT: Integrated commit/branch status and cleanup report.
DONE WHEN: Approved work is integrated, pushed as authorized, and the worktree status is clean.
```

Escalate to `architect` at HIGH only if implementation reveals a cross-cutting route,
state, persistence, or security boundary that this brief does not settle. The first slice
does not require an architecture pass merely to draw approved flows; `diagram-agent` at
LOW may render an approved data-flow diagram if that saves `ux-ui` time.
