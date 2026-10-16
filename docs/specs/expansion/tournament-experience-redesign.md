# Tournament experience redesign

**Status:** Proposed — highest user-visible return in the expansion; needs no new backend
**Date:** 2026-09-15
**Governs:** `/tournaments/**`, tournament information architecture, catch submission, judging, standings, host command centre
**Extends:** `docs/architecture/tournament-domain-model.md` (ARCH-001), `docs/design/tournaments/UX-001-tournament-flow-contract.md`
**Audit:** `00-repository-audit.md` §3.4, §7
**Phase:** 1

---

## 1. Problem statement

The tournament backend is the most capable part of this product: 40+ tables, versioned rule
sets, immutable evidence, fair-play signals, QR verification, adjudication, disputes,
payouts, a Stripe webhook with tests. ARCH-001 is a serious piece of architecture and it is
largely built.

The tournament **screens** are the weakest part of the product, and the measurements say
why. On one tournament overview at 320 px:

- **33 anchors.** 14 are the always-mounted navigation drawer.
- **Two navigation systems to the same four destinations, disagreeing with each other.**
  A chip row reads `Home · ① Entry · ② Compete · ③ Results · Rules` (five items, three
  numbered). Directly beneath it, a card stack reads `1 Enter · 2 Know the rules ·
  3 Compete · 4 Results` (four items, four numbered). "Rules" is unnumbered in one and
  step 2 in the other. The leaderboard screen then announces **"Step 3 of 3"**. Three
  different counts of the same journey, on two adjacent screens.
- **The primary action sits at y = 740 px (320 px wide) and y = 712 px (390 px wide), in a
  640 px viewport.** On every phone, the button an angler taps with a fish flapping in the
  boat is below the fold.
- **The bottom bar is 97 px and two rows at 320 px**, 49 px and one row at 390 px, taking
  15 % of a small screen and overlapping content that has no bottom padding for it.
- **The register screen shows "Every angler needs a name." in red under an empty, untouched
  field on first paint.** The form accuses the user before they have done anything.
- The leaderboard's first row uses a trophy where every other row uses a rank numeral, a
  larger orange weight where others use smaller white, unit below the number where others
  have it inline, and species above the name where others have it below. One list, two
  designs.

None of this is a backend problem. It is the product explaining its own architecture to the
user instead of getting out of the way.

---

## 2. Users and stakeholders

| User | Moment | What failure costs |
|---|---|---|
| First-time entrant | Deciding whether to enter, on a phone, in 60 seconds | They do not enter |
| Registered angler, pre-event | "What do I need to do before Saturday?" | They arrive non-compliant |
| Angler, on the water, live | Logging a fish with wet hands, 30 s, possibly no signal | A fish that does not count |
| Team captain | Managing crew entries and jackpots | Wrong division, refund dispute |
| Host / director | Running the day: entries, check-in, reviews, standings | The event stops |
| Judge | Deciding one catch on evidence | A wrong call, a dispute |
| Spectator / sponsor | Watching standings | Nothing; but they are the growth loop |

---

## 3. Product goals

1. **One flow, one vocabulary, one count.** Delete the duplicate navigation entirely.
2. **The next action is always above the fold**, on every tournament screen, at 320 px.
3. **Logging a tournament fish is the normal logging flow plus one tap.** No second catch
   form, no re-entry of species, size or time (`data-architecture-expansion.md` §5).
4. Every state an entry can be in is nameable and visible: registered ≠ paid ≠ eligible ≠
   checked in ≠ competing.
5. Offline submission is a first-class path, with a visible queue.
6. Preserve every simple mobile action the brief names, and preserve the shipped backend
   semantics exactly.

---

## 4. Non-goals

- Rewriting ARCH-001 or any tournament table. This is a UI and IA spec.
- AI as a judge. AI assists; a human decides (ARCH-001 §13 "Human authority", and the
  brief agrees).
- Public global leaderboards outside an event. `ROADMAP.md` Part 3 still holds.
- Live fleet position tracking.
- Building the white-label theming engine in Phase 1. The structure allows it (§6.7); the
  theming work is Phase 4.

---

## 5. User stories

1. As a first-timer, I open an event and in one screen learn what it is, when, where, what
   it costs, what counts, and what I do next — without scrolling.
2. As an entrant, I open the event during the tournament and the **first thing on screen**
   is a 68 px orange button that logs a fish.
3. As an angler, I log a fish the way I always do, and a single toggle on the sheet says
   *"Count in Harbor Bay Shootout"* — pre-selected because the event is live and I am
   inside the boundary.
4. As an angler with no signal, I submit, see *"1 waiting to send"*, keep fishing, and it
   sends itself when signal returns.
5. As a captain, I register four anglers and three jackpots in one order, and see clearly
   who still needs a name, a phone number and a division.
6. As a host, I open one command centre and see: entries needing action, catches needing
   review, open disputes, and standings — with counts, in that order.
7. As a judge, I see one catch, its evidence, the automated checks with their results, and
   two buttons — and my decision is recorded with my reason.
8. As an angler, my catch is rejected and I am told exactly why, what the rule says, and how
   to dispute it.

---

## 6. Complete workflow

### 6.1 The information architecture — one spine

Replace both existing navigation systems with **one**, matching UX-001's route proposal:

```text
/tournaments                      the season: every event, list or calendar   (KEEP — good)
/tournaments/[id]                 ONE event screen, phase-aware               (REPLACE overview)
/tournaments/[id]/rules           what counts
/tournaments/[id]/register        entry + payment                             (KEEP, fix §6.4)
/tournaments/[id]/my-entry        my status, my crew, my catches
/tournaments/[id]/leaderboard     standings
/tournaments/[id]/host            command centre (hosts only)
/tournaments/[id]/host/judge      review queue
```

**Rule T1.** One tab bar, five tabs maximum, unnumbered:
`Event · Rules · My entry · Standings · Host`. No step numbers anywhere in navigation.
Numbers belong to a checklist the user completes once, not to a bar they live in.

**Rule T2.** The "How this tournament works" explainer cards are deleted. They existed
because the tabs did not explain themselves. The fix is better tab labels, not a second set
of links that disagrees.

**Rule T3.** The word for each destination is fixed and used everywhere, including in
copy: *Event, Rules, My entry, Standings, Host.* Not Entry/Enter, not Compete/Competing,
not Results/Standings interchangeably.

### 6.2 The event screen is phase-aware

One screen, four layouts, driven by the lifecycle state the backend already owns
(`tournament.status`, ARCH-001 §9).

```text
BEFORE REGISTRATION OPENS   hero + what it is + "Opens 12 Sep" + Remind me
REGISTRATION OPEN           hero + PRIMARY: Register  + fee, deadline countdown, spots
REGISTERED, NOT STARTED     hero + PRIMARY: My entry  + a real readiness checklist
LIVE                        PRIMARY: Log a fish (68px, top) + my standing + time left
                            + sync state + boundary + rules summary
COMPLETED / FINAL           PRIMARY: Standings + payout status + results
CANCELLED                   what happened, refund status, nothing else
```

**Rule T4.** The primary action is the **first interactive element below the title**, above
any detail block, at every phase. The measured 740 px offset is the bug this rule exists to
kill.

**Rule T5.** The hero states, in this order and nothing else: name, status pill, when,
where, entry fee, prize pool. Six facts. The current hero's label/value stack burns ~450 px
saying them; a two-column definition grid at 320 px says them in ~180 px.

**Rule T6.** No fact appears twice on one screen. Today "when" appears in the hero *and* in
an "Event details" card as separate Starts and Ends cards.

### 6.3 Live-event screen (the one that matters)

At 320 px, above the fold (568 px of usable height after a 49 px bar):

```text
┌──────────────────────────────┐
│ Harbor Bay Shootout  ● LIVE  │   28 px
│ 4h 12m left · inside boundary│   20 px
├──────────────────────────────┤
│                              │
│      🐟  LOG A FISH          │   68 px, signal-orange, full width
│                              │
├──────────────────────────────┤
│ You: 2nd · 24.2 lb           │   24 px
│ 3 catches · 1 waiting to send│   20 px
├──────────────────────────────┤
│ [Standings] [Rules] [My entry]│  48 px
└──────────────────────────────┘
```

Everything else scrolls below. This is the screen a 70-year-old uses one-handed in chop,
and it should contain the fewest things of any screen in the product.

### 6.4 Registration (fix, do not rebuild)

The multi-event, multi-crew, one-order model is right and matches ADR 010. Fixes:

1. **No validation before interaction.** Errors appear on blur after input, or on submit —
   never on first paint. This is the single clearest error-prevention defect in the product.
2. **Order the screen the way the decision is made:** who is fishing → what you are
   entering → the money. Currently the refund-policy *checkbox* sits in the events section
   while the refund-policy *text* is 400 px below in the Pay section. Move the checkbox to
   sit with the text it refers to.
3. **One test-mode message, in one place, at the top.** Today "Test mode" sits mid-page and
   "Demo mode" sits at the very bottom, in different words.
4. **The disabled Pay button states its own reason, in the button's own labelled region,
   below it or in it** — not as orange body text above it that reads as an error unrelated
   to the control.
5. **One numeric treatment.** Money is tabular-mono everywhere or nowhere. Currently
   `$150 entry` is mono in the checklist and proportional in the total. `Free to enter` is
   set in the mono numeric font, which is for numbers.
6. **A running total pinned above the fold** once anything is ticked.

### 6.5 Catch submission — one catch, two roles

This is the change that removes the most work from the angler and the most risk from the
data (`data-architecture-expansion.md` §5).

```text
angler taps Log a fish (normal quick-log sheet)
  └─ species, size, photo if required — the SAME sheet as always
  └─ NEW: a single toggle "Count in Harbor Bay Shootout"
       pre-selected when: event is LIVE, angler has a confirmed entry,
       and the position is inside the boundary
  └─ save → public.catch written (durable, offline)
          → tournament_catch written with catch_id → public.catch
          → evidence rows attached (photo, GPS, device metadata, QR if required)
          → both queued in the existing outbox
```

Rules:

- **No second catch form.** The tournament does not get its own species picker.
- The toggle explains what it adds: *"Adds a photo and your position as evidence."*
- Turning it **off** is always possible; a fish caught in an event you do not want to
  submit is still a fish.
- If evidence required by the verification policy is missing, the sheet says so **before**
  save, names the missing item, and still saves the personal catch. The personal catch is
  never blocked by tournament rules (`fish-legal-agency-integration.md` Rule L2, same
  principle).
- Corrections after submission write a `catch_amendment` with `affects_tournament_claim`,
  which the judge sees as a correction request. The immutable claim stays immutable.

### 6.6 Judging

One catch per screen. Four blocks:

1. **The claim** — species, length/weight, time, entrant. Read-only, marked immutable.
2. **The evidence** — photos, GPS verdict (`inside` / `outside` / `unknown`, **never raw
   coordinates** unless the policy requires coordinate review and the read is audited),
   device metadata, QR scan, duplicate-hash result.
3. **The automated checks** — each `verification_check` with its outcome and what it means,
   and each `fair_play_signal` with its severity. Presented as *signals*, never as a verdict.
4. **The decision** — Approve / Reject / Request correction, each requiring a reason;
   Reject requires selecting the rule it breaches, from the active rule set version.

**Rule T7.** The decision buttons are never pre-selected, never ordered by what the AI
suggests, and carry no colour advantage. A judging UI that nudges is a judging UI that
loses a dispute.

### 6.7 Host command centre

One screen, four counts, in priority order, each a link into a queue:

```text
Needs you now
  ▸ 3 catches waiting for review        > 
  ▸ 1 dispute open                      >
  ▸ 2 entries need approval             >
  ▸ 0 payments failed
Event
  ▸ Status: LIVE · 4h 12m left · Pause event
  ▸ 47 entered · 41 checked in
  ▸ Standings (provisional)             >
Before you can start            (DRAFT/READY only)
  ▸ Rules ✓  Scoring ✓  Verification ✓  Boundary ✓
```

The readiness checklist (`READINESS` in `tournament-overview.tsx`) is good and is kept —
but it belongs to the **host**, on the host screen. Today it renders to entrants, who
cannot act on it.

White-label: the command centre and public event screens read organisation branding
(logo, accent colour) from `organization`. The **accent colour must not be able to override
`signal-orange` on safety-critical controls** or the contrast floors in
`docs/design/06-accessibility-baseline.md`. A branding system that can produce an
unreadable Log-a-fish button is a defect, not a feature.

---

## 7. Screen and component requirements

### 7.1 Deletions

| Delete | Reason |
|---|---|
| `TournamentJourney` explainer cards | Duplicate navigation (Rule T2) |
| Step numbers in tab chips (`① Entry`) | Conflict with the cards and with "Step 3 of 3" |
| "Step N of 3" headers | Third conflicting count |
| Duplicate Starts/Ends cards on the overview | Already in the hero (Rule T6) |
| Readiness checklist on the entrant view | Host-only |
| Single-fact cards in "Event details" | Five cards for five facts; one definition grid instead |

### 7.2 Leaderboard — one row design

The current first row breaks four alignment rules the rest of the list follows. Fix:

- Rank column is **always** present and always the same width, including rank 1. A trophy
  may sit *beside* the numeral; it may not replace it.
- One type size for the weight; leader emphasis is weight-of-type and the row's border,
  not a different scale.
- Unit inline, always, tabular-mono, right-aligned on a fixed column.
- Species in the same slot in every row.
- **Provisional rows are visually distinct and labelled** — a row "waiting on a review"
  currently occupies a confirmed rank. Show it in place with a `Provisional` chip and an
  explanation of what happens if it is rejected.
- Ties resolve by the rule set's documented tiebreak and the row says which one applied.

### 7.3 Shell

Two shell problems are tournament-visible but shell-owned, and `ux-ui` must resolve them
before this spec's 320 px targets can be met:

1. The bottom bar is **97 px and two rows at 320 px**. Six destinations do not fit.
   Options: five destinations plus the drawer; icon+label at a smaller label scale (which
   collides with the type floor); or a scrolling bar (which hides destinations). This spec
   states the constraint and does not choose.
2. `main` has 24 px bottom padding and the bar is sticky, so content lands under it. Bottom
   padding must equal the measured bar height, not a constant.

### 7.4 States

Every tournament screen implements, distinctly: loading (skeleton, not spinner), empty,
error with retry (the existing `ErrorScreen` is good and should be reused), offline with
queue depth, and demo. The **demo notice must move to the top of the screen** — it is
currently the last element on the page, so an angler scrolls an entire fake tournament
before learning none of it is real.

---

## 8. Data requirements

No new tournament tables. Two changes:

1. `tournament_catch.catch_id` → `public.catch` (`data-architecture-expansion.md` §5.2).
2. A `tournament_entry` read model for the entrant's status strip, combining registration,
   eligibility, check-in and competition status into one payload so four screens cannot
   disagree about what "registered" means. `entrySteps()` already computes this shape in
   `format.ts`; it becomes the single source and moves into `core/tournaments/`.

Public projections (`core/tournaments/public-projection.ts`) already enforce what may be
shown publicly. Every new surface reads through it.

---

## 9. API and service requirements

- Reuse `useEvents`, `useStandings`, `useDivisions`, `useTournament`,
  `useRegistrationOrder`. The one-loader-per-question pattern is correct and is the reason
  the three event views cannot disagree.
- Standings poll with backoff while LIVE; no websockets in Phase 1.
- Submission uses the existing tournament ingest with `client_generated_id`; the reconciler
  in `core/tournaments/catch-sync.ts` is already written and tested.
- **Demo store**: keep, but make it unmistakable (§7.4) and make `hasSupabaseBrowserConfig`
  the only switch. Today this is every environment, which means the tournament flow has
  never been exercised against a real server by a real user — a fact the roadmap must
  account for.

---

## 10. Offline behaviour

- Catch and evidence are durable locally before any network attempt, via the existing
  outbox (one transaction for row + mutation).
- The queue is **visible**: *"2 catches waiting to send"* on the live screen, with a list
  and a manual retry.
- Rules, boundary and the entry status strip are cached at check-in so they work offline —
  they are needed exactly when signal is worst.
- Standings are unavailable offline and say so. A stale leaderboard shown as live is worse
  than none.
- Photo blobs stay local until upload succeeds; a failed upload never loses the catch
  (existing `media.ts` behaviour).
- QR verification tokens work offline per ARCH-001 §14; the scan is queued.
- **Rule T8.** The submission deadline is evaluated on `caught_at_device` plus the server's
  trust model (ARCH-001 §16), not on arrival time. An angler must not lose a fish because
  the harbour has no signal.

---

## 11. Privacy and security requirements

- Judges see boundary **verdicts**, not coordinates, unless the verification policy requires
  coordinate review — and then the read is audited
  (`privacy-consent-and-data-governance.md` §8).
- Public projections never expose position, evidence or judge notes. Already enforced;
  the leaderboard footer already says so and that copy should stay.
- Host fleet views are event-scoped and expire with the event
  (`fisheries-intelligence-map.md` §11.7).
- Payment: no card data touches the app; the Stripe webhook secret gating stays as is.
- Entrant contact details are visible to the host only, for the stated purpose (reaching
  them if the weather turns), and are not exportable to a marketing list.
- Guest entrants have no account and therefore no personal catch; their data retention is
  event-scoped.

---

## 12. Accessibility requirements

Per `docs/design/06-accessibility-baseline.md`, with tournament specifics:

- The live primary action is ≥ 68 px (design 03 §1 primary-action precedent) and reachable
  without scrolling.
- One 45×48 px nav target measured at 390 px is below the 48 px floor and must be fixed.
- Status is never colour-only: every pill carries text (already true — keep it).
- The drawer's 14 links are always in the DOM, and each accessible name is currently the
  label **concatenated with its blurb** ("CalendarYour days on the water, and what you
  caught"). Separate them so the accessible name is the label.
- Live regions: standings updates and queue-depth changes announce `aria-live="polite"`,
  once per change.
- The countdown is not the only expression of time remaining; the end time is stated in
  words.
- Forms: errors are associated with their inputs via `aria-describedby`, announced on
  occurrence, and **not present before interaction**.
- Long tournament names (the brief asks for this explicitly) must not break the hero or the
  tab bar. Tested with a 120-character name at 320 px.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Angler in two live events at once | The toggle becomes a multi-select; both claims reference one `catch_id` |
| Fish caught 30 s after the deadline | Submitted, flagged late by the server's trust model, judge decides. The app does not silently drop it. |
| Outside the boundary | Submitted with an `outside` verdict and a visible warning at submission time, not a silent rejection later |
| Entry unpaid when the event starts | Entry status strip says exactly which state blocks competing, and links to payment |
| Host cancels mid-event | Clear state, refund status per the refund policy, standings frozen and labelled |
| Judge rejects, angler disputes | Dispute flow; standings show the affected row as under dispute rather than removing it silently |
| Guest entrant with no account | No personal catch; tournament catch stands alone; `catch_id` null |
| Two devices for one entry | `client_generated_id` reconciler: identical payload = replay, different = conflict, never overwrite |
| 500-entrant leaderboard on a 320 px phone | Virtualised list, sticky "your row", jump-to-me control |
| Very long species name in a leaderboard row | Species truncates with a title; the weight and rank never move |
| Event with no entries | Honest empty state with the host's next action, not a blank board |

---

## 14. Failure states

- Standings load fails → the existing `ErrorScreen` pattern, scoped: *"Standings did not
  load. Your catches are safe."*
- Submission rejected (4xx) → surfaced in the queue with the reason and an amend path.
  Never silently dropped (ADR 004 §6).
- Payment fails → registration stays pending, the reason is shown, retry is available, and
  no entry is activated (already enforced by `paymentCanActivateRegistration`).
- Photo upload fails → catch stands, evidence marked missing, retry queued.
- Demo mode with real intent → prominent top notice (§7.4).
- Tournament server unreachable during a live event → full offline mode with queue; the
  screen says what works and what does not.

---

## 15. Analytics and success metrics

| Metric | Now | Target |
|---|---|---|
| Taps from event open to "log a fish" during LIVE | ≥ 2 + a scroll | **1, no scroll** |
| Duplicate catch entry (same fish in personal log and tournament separately) | unmeasured; structurally guaranteed | **0**, structurally impossible after §6.5 |
| Registration completion rate | unmeasured (demo only) | > 70 % of starts |
| Registration abandonment at the validation-error step | unmeasured | measure first, then reduce |
| Catches submitted offline and successfully synced | — | > 99 % |
| Median judge time per catch | — | < 45 s |
| Disputes per 100 catches | — | tracked; a rise after a UI change is a regression |
| Support contacts containing "I don't know what to do next" | — | the qualitative metric that actually matters |

---

## 16. Acceptance criteria

1. Exactly one navigation system per tournament screen. A test asserts no screen renders
   both a tab bar and a journey card stack.
2. No step numbers in any navigation component; a test greps for `Step \d of \d` and the
   numbered-chip pattern and fails on a match.
3. At 320 × 568, the primary action's top offset is **< 200 px** on the LIVE event screen,
   verified by a measurement test (today: 740 px).
4. The bottom bar is one row at 320 px, and `main`'s bottom padding equals its measured
   height.
5. No form field renders an error before it has been touched or the form submitted, proven
   by a test on the register screen.
6. Logging a fish during a live event writes one `public.catch` and one `tournament_catch`
   referencing it, in one user action, proven by an integration test.
7. Every leaderboard row uses one row template; rank 1 has a rank numeral; a screenshot
   test pins it at 320 px.
8. Provisional rows are labelled and distinguishable from confirmed rows.
9. The demo notice is the first element on any demo-mode screen.
10. A 120-character tournament name and a 40-character species name render without overflow
    at 320 px.
11. Every screen implements loading / empty / error / offline states, proven by the
    existing chrome-coverage test pattern.
12. `npm run verify` passes.

---

## 17. Dependencies

- `data-architecture-expansion.md` §5 — **blocking** for §6.5.
- `ux-ui` ruling on the six-destination bottom bar (§7.3).
- `ui-ux-critic-loop.md` — this spec's designs enter that loop before implementation.
- Real Supabase tournament data in at least one environment. Today every environment runs
  the demo store; the flow is unexercised end to end.
- ARCH-001 remains authoritative for every backend semantic. Where this spec and ARCH-001
  disagree, ARCH-001 wins and this spec is wrong.

---

## 18. Risks and unanswered questions

1. **The demo store has hidden every integration bug.** Every screen has only ever been
   seen against seeded local data. The first real event will find problems no amount of
   design work prevents. *Recommendation: one real, small, free event with friendly users
   before any paid event.*
2. **Deleting the explainer cards will feel like removing help.** They exist because
   somebody could not find their way. The fix is fewer destinations with better names; if
   post-change users still cannot navigate, the tab labels are wrong — do not re-add a
   second navigation.
3. **The bottom bar is over-subscribed** and adding the map (`fisheries-intelligence-map.md`
   §7.1) makes it worse. This needs a decision, not another exception.
4. **Money raises the stakes of every UI defect.** A confusing refund policy is a chargeback.
   `counsel` should review the registration and refund copy before the first paid event.
5. **Judging under time pressure is where fairness is lost.** A 45 s median is a
   productivity target that could become a fairness problem. Watch dispute rate alongside
   it, and never optimise one without the other.
6. *Open:* should an angler be able to submit a fish to a tournament **from the Fish Log**
   after the fact (within the window), or only at the moment of logging? The data model
   allows it; the fairness model may not. `ceo` and a tournament director should decide,
   not engineering.
