# UI/UX critic loop — five rounds, measured

**Status:** Findings and method. Rounds 1–2 are measurements of the running app; rounds 3–5 score a proposed design and are labelled as such.
**Date:** 2026-09-15
**Governs:** the critique process, its scoring rubric, and the recorded scores
**Extends:** `docs/design/01`–`12`, especially `06-accessibility-baseline.md`
**Audit:** `00-repository-audit.md` §7
**Phase:** 1 (and recurring)

---

## 1. Problem statement

The brief asks for a structured, multi-round critique with independent scoring and an
explicit instruction not to inflate the score to end the process. That instruction is the
important one, so this file starts by stating what it can and cannot honestly claim.

**Rounds 1 and 2 are real.** They score the application as it runs today, measured in
Chromium at 320 / 360 / 390 / 430 px, with numbers taken from the DOM rather than from
looking at it.

**Rounds 3, 4 and 5 score a proposed design.** No design review can measure a screen that
does not exist. Those rounds are recorded as *projected* scores with the specific
assumptions they rest on, and every one of them reverts to "unmeasured" until the screens
ship and are re-measured. A projected 8.4 is not a shipped 8.4 and this document will not
pretend otherwise.

---

## 2. Method

1. Run the app. `npm ci`, `npm run dev`, `DEV_AUTH_BYPASS=true`, Chromium, mobile
   emulation, `deviceScaleFactor: 2`.
2. Measure: element offsets, computed styles, scroll widths, target sizes, anchor counts,
   fixed-chrome heights. Screenshot full-page at 320 px.
3. Score each workflow 0–10 per category, independently, each deduction citing a screen and
   an element.
4. Identify the highest-impact fixes.
5. Revise the design.
6. Re-score, with the reason for each movement.
7. Record what is still unresolved.

### 2.1 The seven critics

| Critic | Asks |
|---|---|
| First-time recreational angler | "What is this and what do I do?" |
| Experienced tournament angler | "How fast can I log a fish with wet hands?" |
| Tournament host | "Can I run a day without calling support?" |
| Mobile UI/UX expert | "Does this hold at 320 px, one-handed, in sunlight?" |
| Accessibility expert | "Does this work by keyboard, by screen reader, at 200 % text?" |
| Product architect | "Does the screen match the domain, or is it explaining the domain?" |
| Adversarial critic | "Where does this confuse, mislead or lose data?" |

### 2.2 Scoring scale

`0` broken · `3` usable with help · `5` usable, ugly or slow · `7` good, with named defects
· `9` excellent, defects are nits · `10` nothing found.

**No category scores above 8 without a passing measurement.** Aesthetic impression is not
evidence.

---

## 3. Round 1 — the application as it runs (MEASURED, 2026-09-15)

### 3.1 Scores

| # | Category | Tournaments | Log / Catch | Setup / Quiver | Fish Legal |
|---|---|---:|---:|---:|---:|
| 1 | Immediate comprehension | **3.0** | 7.0 | 6.0 | 8.0 |
| 2 | Navigation clarity | **2.5** | 7.0 | 5.5 | 7.5 |
| 3 | Task completion speed | **3.5** | 8.0 | 6.5 | 8.0 |
| 4 | Information hierarchy | **3.0** | 7.0 | 5.5 | 8.0 |
| 5 | Visual alignment & symmetry | **4.0** | 7.0 | 5.0 | 7.5 |
| 6 | Typography | 6.0 | 7.5 | 7.0 | 7.5 |
| 7 | Colour consistency | **4.5** | 7.5 | 7.0 | 8.0 |
| 8 | Mobile usability | **3.0** | 6.5 | 6.0 | 7.0 |
| 9 | Accessibility | 6.0 | 7.0 | 7.0 | 7.5 |
| 10 | Error prevention | **2.0** | 7.5 | 6.5 | 8.5 |
| 11 | Empty & loading states | 7.0 | 7.0 | 8.0 | 8.0 |
| 12 | Trust | **4.0** | 8.0 | 7.0 | **9.0** |
| 13 | Overall polish | **4.0** | 7.0 | 6.0 | 7.5 |
| | **Mean** | **4.04** | **7.23** | **6.38** | **7.85** |

Fish Legal scores highest and its Trust score is the highest single number in the product,
because its citation-or-nothing stance is a *design* decision that the UI expresses
honestly. That is the standard the rest of the app is measured against.

### 3.2 Round 1 findings, with evidence

**R1-A · Two navigation systems, three different counts.** `/tournaments/[id]/overview`
renders a chip row `Home · ① Entry · ② Compete · ③ Results · Rules` (5 items, 3 numbered) and
immediately below it a card stack `1 Enter · 2 Know the rules · 3 Compete · 4 Results`
(4 items, 4 numbered). `/leaderboard` then announces **"Step 3 of 3"**. "Rules" is
unnumbered in one and step 2 in the other.
*Critics: architect, first-timer, adversarial. Categories 1, 2, 4.* **Severity: highest.**

**R1-B · The primary action is below the fold on every phone.** Measured top offset of
`Compete now — log a catch`: **740 px at 320 px wide, 712 px at 390 px**, in a 640 px
viewport. On a live tournament screen.
*Critics: tournament angler, mobile expert. Categories 3, 4, 8.* **Severity: highest.**

**R1-C · The bottom bar takes 97 px and two rows at 320 px** (49 px at 390 px), and `main`
has a constant 24 px bottom padding, so content lands underneath it.
*Critics: mobile expert, accessibility. Categories 5, 8.*

> **Correction, 2026-09-15.** This finding originally read "recorded and not fixed",
> which was wrong and unfair to the work. `shell-nav.tsx` records the measurement *and
> the alternatives*: six labels want 366 px in one row, equal columns would want 432 px,
> and shrinking the type is unavailable because the 16 px floor has no escape hatch. Two
> rows of three at full size is the least-bad option, and the six destinations are a
> founder decision. It is a deliberate, measured trade-off, not an oversight. The 97 px
> is still 15 % of a small screen and the composition of the bar is still open (R5-D) —
> but it is open, not neglected. The height is now asserted in CI so it cannot grow
> further.

**R1-D · Validation fires before interaction.** `/register` paints "Every angler needs a
name." in `error-red` under an empty, untouched Name field.
*Critics: first-timer, adversarial. Category 10.* **Severity: highest for its category.**

**R1-E · The leaderboard's first row is a different component.** Rank 1 has a trophy and no
numeral; ranks 2–5 have numerals. Rank 1's weight is large and orange with the unit on its
own line; the rest are smaller, white, unit inline. Rank 1 shows species above the name;
the rest below.
*Critics: mobile expert, adversarial. Categories 5, 6, 13.*

**R1-F · Provisional results occupy confirmed ranks.** "A. Lewis · White seabass · waiting
on a review" sits at rank 3 with no visual distinction from a confirmed rank.
*Critics: tournament angler, adversarial. Categories 10, 12.*

**R1-G · The demo notice is the last element on the page.** An angler scrolls an entire
fabricated tournament, including prize pools and entry fees, before reading "Demo mode".
And the demo store is active in **every environment today**.
*Critics: adversarial, first-timer. Category 12.* **Severity: high, and it is a trust
defect, not a layout one.**

**R1-H · 33 anchors on one screen**, 14 of them the always-mounted drawer. Each drawer
link's accessible name is its label concatenated with its blurb
("CalendarYour days on the water, and what you caught").
*Critic: accessibility. Categories 2, 9.*

**R1-I · Facts repeat.** The overview hero states "When"; an Event details block restates
Starts and Ends as two separate single-fact cards. Five single-fact cards in a column, each
with card padding, is ~400 px to convey five short strings.
*Critics: architect, mobile expert. Categories 4, 5, 13.*

**R1-J · Two mixed numeric treatments in one flow.** `/register` sets `$150 entry` in
tabular-mono in the event checklist and `$150` proportional in the total; `Free to enter`
is set in the mono numeric face.
*Critics: mobile expert. Categories 6, 7.*

**R1-K · Setup alternates container languages.** "Setup" and "Tackle Box" are cards;
"Today's rods", "Quiver" and "Location" are bare headings. The left rail alternates between
card padding and zero, so nothing lines up vertically down the screen.
*Critic: mobile expert. Category 5.*

**R1-L · Orange is overloaded.** `signal-orange` is simultaneously: the primary action, the
selected chip, the active region emphasis in Fish Legal, the "Fishing now" status pill, the
"You host this" badge, and the disabled Pay button at reduced opacity. Six meanings, one
colour — and the disabled state is the same hue as the enabled one.
*Critics: mobile expert, adversarial. Categories 7, 10.*

### 3.2b What has since been fixed, and measured again

Rounds 2–5 below score a *proposed* design. These specific findings are no longer
proposals — they were implemented and re-measured on 2026-09-15, and the numbers are
pinned in CI by `scripts/check-layout.mjs`.

| Finding | Before | After |
|---|---|---|
| R1-A two navigation systems, three counts | 5 numbered chips + 4 numbered cards + "Step 3 of 3" | **One tab bar.** Journey cards deleted, step numbers gone everywhere |
| R1-B primary action below the fold | **740 px** at 320 px, 712 px at 390 px | **436 px** at 320 px, 414 px at 390 px — clears the fold at both |
| R1-G demo notice last on the page | last element, muted caption | **first element**, bordered, `role="status"`, and it now says "nothing here is a real event" |
| R1-H 33 anchors, duplicate destinations | 33 | **29** |
| R1-I facts repeated | hero + 4 single-fact cards restating Starts/Ends | one card, one definition list, no restatement |
| 45 × 48 nav target at 390 px | 1 under the floor | **0 under the floor at any width tested** |

Two things were *not* fixed and are named rather than quietly dropped:

- **The < 200 px target in `tournament-experience-redesign.md` §16.3 is not met.** 436 px
  clears the fold, which was the ticket's goal, but the stricter target needs the
  phase-aware LIVE layout in that spec's §6.2–§6.3 — a compact hero that renders only
  name, time remaining and the action during a live event. That is a separate piece of
  work and the criterion stays open until it ships.
- **R1-C, R1-F, R1-J, R1-K, R1-L** are untouched. Round 2's scores below assume them
  fixed and remain projections.

### 3.3 What Round 1 found that is already right — keep it

- No horizontal overflow at 320 px on any screen tested. Rare and valuable.
- Touch targets clear 48 px almost everywhere (one 45×48 exception at 390 px).
- The focus ring spec is real, applied, and contrast-checked.
- Error screens are scoped and honest: *"Everything else in the app still works — this is
  the tournament connection only."* That sentence is better than most products manage.
- The design tokens are generated from one source and checked in CI (`tokens:check`).
- The events list at `/tournaments` is genuinely good: one list, two views, three filters,
  and every card carries the three facts a decision needs.

---

## 4. Round 2 — after the cheap structural fixes (MEASURED where marked, else PROJECTED)

Changes scored: delete the journey cards and step numbers (R1-A); move the primary action
above the detail blocks (R1-B); one leaderboard row template (R1-E); demo notice to the top
(R1-G); errors on blur/submit only (R1-D); collapse the Event-details cards into one
definition grid (R1-I).

| # | Category | Tournaments | Δ | Why |
|---|---|---:|---:|---|
| 1 | Immediate comprehension | 6.0 | +3.0 | One journey, one vocabulary |
| 2 | Navigation clarity | 6.5 | +4.0 | One tab bar; drawer still heavy |
| 3 | Task completion speed | 6.5 | +3.0 | Primary action above the fold |
| 4 | Information hierarchy | 6.0 | +3.0 | Facts stated once |
| 5 | Visual alignment | 5.5 | +1.5 | Rows unified; bar still two-row at 320 |
| 6 | Typography | 6.5 | +0.5 | Numeric treatment unified |
| 7 | Colour consistency | 5.0 | +0.5 | Orange still overloaded (R1-L) |
| 8 | Mobile usability | 5.5 | +2.5 | Bar height unresolved |
| 9 | Accessibility | 6.5 | +0.5 | Fewer duplicate links; names still concatenated |
| 10 | Error prevention | 6.5 | +4.5 | Errors after interaction only |
| 11 | Empty & loading | 7.5 | +0.5 | Demo notice honest |
| 12 | Trust | 6.5 | +2.5 | Demo notice first; provisional still unlabelled |
| 13 | Overall polish | 5.5 | +1.5 | |
| | **Mean** | **6.12** | **+2.08** | |

**Still failing after Round 2:** the bottom bar (R1-C), orange overload (R1-L), provisional
ranks (R1-F), drawer accessible names (R1-H), setup container language (R1-K).

---

## 5. Round 3 — shell and colour (PROJECTED)

### 5.1 Changes scored

**Bottom bar.** Six destinations do not fit at 320 px. Three options were considered:

| Option | Verdict |
|---|---|
| Smaller labels | **Rejected.** Collides with the type floor in `01-foundations.md` §2.1, which exists because of who uses this app. |
| Scrolling bar | **Rejected.** Hides destinations; `destinations.ts` already records what happens when a feature is hard to find. |
| **Five destinations + drawer** | **Adopted.** Calendar · Log · Tide · Legal · More. Setup and Settings move into the drawer, which already exists, is already the documented map, and is already reachable from every screen. |

Bottom padding on `main` becomes the measured bar height, not a constant.

**Orange.** `signal-orange` is reserved for **the primary action and the active region
emphasis in Fish Legal** — the two uses the founder's design explicitly asked for. Status
pills move to the existing semantic tokens (`success-green` taking entries, `amber-flag`
attention, `tide-cyan` final, `text-muted` closed). Disabled controls lose the fill
entirely rather than wearing the same hue at lower opacity.

**Setup.** One container language: every section is a card, or none is. Cards, to match the
rest of the app.

**Drawer.** Accessible name is the label; the blurb is a separate element.

| # | Category | Tournaments | Δ | Log | Setup | Fish Legal |
|---|---|---:|---:|---:|---:|---:|
| 1 | Comprehension | 7.0 | +1.0 | 7.5 | 7.0 | 8.0 |
| 2 | Navigation | 7.5 | +1.0 | 8.0 | 7.5 | 8.0 |
| 3 | Speed | 7.5 | +1.0 | 8.5 | 7.5 | 8.0 |
| 4 | Hierarchy | 7.0 | +1.0 | 7.5 | 7.0 | 8.0 |
| 5 | Alignment | 7.5 | +2.0 | 7.5 | **7.5** | 8.0 |
| 6 | Typography | 7.0 | +0.5 | 7.5 | 7.5 | 7.5 |
| 7 | Colour | 7.5 | +2.5 | 8.0 | 8.0 | 8.5 |
| 8 | Mobile | 7.5 | +2.0 | 7.5 | 7.5 | 7.5 |
| 9 | Accessibility | 7.5 | +1.0 | 7.5 | 7.5 | 8.0 |
| 10 | Error prevention | 7.0 | +0.5 | 8.0 | 7.0 | 8.5 |
| 11 | Empty & loading | 7.5 | — | 7.5 | 8.0 | 8.0 |
| 12 | Trust | 7.0 | +0.5 | 8.0 | 7.5 | 9.0 |
| 13 | Polish | 7.0 | +1.5 | 7.5 | 7.5 | 8.0 |
| | **Mean** | **7.27** | **+1.15** | **7.73** | **7.54** | **8.08** |

**Still failing:** provisional ranks (R1-F), the live-screen density target, offline queue
visibility, long-name handling.

---

## 6. Round 4 — the live screen and the states (PROJECTED)

### 6.1 Changes scored

- The LIVE event screen reduced to the five-element layout in
  `tournament-experience-redesign.md` §6.3. Target: primary action top offset **< 200 px**
  at 320 × 568.
- Offline queue depth surfaced on the live screen with a list and manual retry.
- Provisional leaderboard rows labelled with a `Provisional` chip plus one line of what
  happens if the review rejects it.
- Long-name handling: 120-character tournament name, 40-character species name, at 320 px
  and at 200 % text scale.
- Every screen's five states (loading / empty / error / offline / demo) proven by the
  existing chrome-coverage test pattern.

| # | Category | Tournaments | Δ | Notes |
|---|---|---:|---:|---|
| 1 | Comprehension | 8.0 | +1.0 | Live screen says one thing |
| 2 | Navigation | 8.0 | +0.5 | |
| 3 | Speed | 8.5 | +1.0 | One tap, no scroll |
| 4 | Hierarchy | 8.0 | +1.0 | |
| 5 | Alignment | 8.0 | +0.5 | |
| 6 | Typography | 7.5 | +0.5 | Long names survive 200 % scale |
| 7 | Colour | 8.0 | +0.5 | |
| 8 | Mobile | 8.5 | +1.0 | |
| 9 | Accessibility | 8.0 | +0.5 | Live regions, associated errors |
| 10 | Error prevention | 8.0 | +1.0 | Queue visible; late/outside submissions explained |
| 11 | Empty & loading | 8.5 | +1.0 | Five distinct states everywhere |
| 12 | Trust | 8.0 | +1.0 | Provisional is legible |
| 13 | Polish | 8.0 | +1.0 | |
| | **Mean** | **8.08** | **+0.81** | |

---

## 7. Round 5 — adversarial pass (PROJECTED, and the score goes DOWN in two categories)

The adversarial critic's job is to find what the previous four rounds agreed to stop
looking at. Four findings, two of which cost points.

**R5-A · The demo store still exists in every environment.** Rounds 1–4 improved how demo
mode is *labelled*. None of them made a real tournament run. Every score above is a score
of seeded local data. **Trust −0.5.** This is not fixable by design and it is the single
largest unquantified risk in the section.

**R5-B · "One tap, no scroll" was measured on one tournament in one state.** An event with
two divisions, three jackpots, a boundary warning and an unpaid entry has more to say above
the fold than the layout allows. The five-element live screen may not survive a real
complex event. **Comprehension −0.5**, pending a test against the most complex event the
schema permits, not the demo one.

**R5-C · Colour discipline is enforced by review, not by tooling.** Nothing prevents the
next feature from reaching for `signal-orange` as a status colour again — which is exactly
how it acquired six meanings. Needs a lint rule or a token-usage test, not a design
document. *No score change; it is a process defect, and it is why Round 3's +2.5 will decay.*

**R5-D · Round 3's bottom-bar change removes Setup from the bar.** Setup is a
per-trip action, not app housekeeping, and burying it repeats the mistake
`destinations.ts` documents. *Unresolved.* The honest options are: five destinations with
Setup kept and Tide moved, or accept the drawer and measure whether Setup use falls. This
document does not get to decide; it records that Round 3's score was taken with an
unvalidated assumption.

### 7.1 Round 5 final scores

| # | Category | Tournaments | Log | Setup | Fish Legal |
|---|---|---:|---:|---:|---:|
| 1 | Immediate comprehension | **7.5** | 8.0 | 7.5 | 8.0 |
| 2 | Navigation clarity | 8.0 | 8.0 | **7.0** | 8.0 |
| 3 | Task completion speed | 8.5 | 8.5 | 7.5 | 8.0 |
| 4 | Information hierarchy | 8.0 | 8.0 | 7.5 | 8.0 |
| 5 | Visual alignment & symmetry | 8.0 | 8.0 | 7.5 | 8.0 |
| 6 | Typography | 7.5 | 7.5 | 7.5 | 7.5 |
| 7 | Colour consistency | 8.0 | 8.0 | 8.0 | 8.5 |
| 8 | Mobile usability | 8.5 | 8.0 | 7.5 | 7.5 |
| 9 | Accessibility | 8.0 | 8.0 | 7.5 | 8.0 |
| 10 | Error prevention | 8.0 | 8.0 | 7.0 | 8.5 |
| 11 | Empty & loading states | 8.5 | 8.0 | 8.0 | 8.0 |
| 12 | Trust | **7.5** | 8.0 | 7.5 | 9.0 |
| 13 | Overall polish | 8.0 | 8.0 | 7.5 | 8.0 |
| | **Mean** | **8.00** | **8.00** | **7.54** | **8.08** |
| | **Product mean** | | | | **7.91** |

**The loop does not terminate early.** The brief permits stopping above a defensible 9.0.
Nothing here is above 9.0, and the two highest individual scores (Fish Legal trust at 9.0,
mobile usability at 8.5) are the only ones near it. A sixth round is required after
implementation, scored by measurement rather than projection.

---

## 8. Movement summary

| Workflow | R1 (measured) | R5 (projected) | Δ |
|---|---:|---:|---:|
| Tournaments | 4.04 | 8.00 | +3.96 |
| Log / Catch | 7.23 | 8.00 | +0.77 |
| Setup / Quiver | 6.38 | 7.54 | +1.16 |
| Fish Legal | 7.85 | 8.08 | +0.23 |

The tournament section carries almost all of the available gain, which is the brief's own
conclusion arrived at independently. Fish Legal moves least because it was already right.

---

## 9. Validation matrix

The brief lists ten conditions. Eight are adopted as written. Two are changed, with reasons.

| Condition | Status | Evidence / note |
|---|---|---|
| 320 px screens | **Measured.** No horizontal overflow on any screen tested | Passing |
| Larger screens (390, 430, tablet) | Measured at 390/430; tablet untested | `max-w-reading` caps line length, so wide layouts are unexercised. **Gap.** |
| Text scaling to 200 % | **Not yet tested.** Required for R4 sign-off | Gap |
| Reduced motion | Honoured in tokens and in components (`motion-reduce:` utilities present throughout) | Passing; needs a coverage test |
| Dark mode | Passing — it is the only mode | |
| **Light mode** | **Changed to: not applicable.** `tokens.json` states dark-only is a deliberate decision because a light UI loses its contrast headroom to reflected glare on open water | Building a light theme to satisfy a checklist would make the product worse in its primary use case |
| **Night mode** | **Changed to: a real requirement, and it does not exist.** Dark ≠ night. A pre-dawn boat needs red-preserving output and a dimmer floor than `#0A1014` at full brightness allows | **Gap. Higher value than a light theme and not currently scheduled.** |
| Touch targets | Measured, and now **asserted in CI**. The 45×48 nav link is fixed; zero targets under the floor at 320 or 390 px, with the calendar-grid exception from `03-touch-and-interaction.md` §1 recorded by name in `scripts/check-layout.mjs`. Measured, that exception is 38 px wide, not the "~45 px" the design doc assumes — worth `ux-ui` knowing | Passing, with one named exception that is wider than advertised |
| Offline states | Partially. The log is offline-first; the tournament queue is not yet surfaced | R4 item |
| Long species / tournament names | **Not yet tested** at 320 px | R4 item |
| Large datasets | Untested. A 500-entrant leaderboard and a 10,000-catch log have never been rendered | **Gap — needs seeded fixtures** |
| Empty datasets | Good. Empty states are a strength of this codebase | Passing |

---

## 10. Unresolved problems (the honest list)

1. **R5-A** — every score is against a demo store. Until one real event runs, the
   tournament scores are estimates with a systematic upward bias.
2. **R5-B** — the live screen is untested against the most complex event the schema permits.
3. **R5-D** — the bottom-bar composition is unresolved, and the map
   (`fisheries-intelligence-map.md` §7.1) wants a seventh destination.
4. **R5-C** — colour discipline has no enforcement, so Round 3's gain will decay.
5. **Night mode does not exist** and is a genuine need this product's users have.
6. **Text scaling to 200 % is untested.**
7. **Large-dataset rendering is untested.** There are no fixtures.
8. **Tablet and desktop are unexercised.**
9. **Setup scores lowest after five rounds (7.54)** and received the least attention because
   the brief prioritised tournaments. Its two weakest categories (navigation 7.0, error
   prevention 7.0) are unaddressed.
10. **No usability testing with a real user has been done at any point in this loop.** Seven
    simulated critics are not one person on a boat. Everything above is a structured
    inspection, and an inspection is not a test.

---

## 11. Acceptance criteria for the loop itself

1. Round 6 is run **after implementation**, by measurement, and its scores replace rounds
   3–5 in this file.
2. Each numbered finding (R1-A … R5-D) has a ticket or a recorded decision not to fix.
3. ~~Measurement tests exist for: primary-action offset, bottom-bar height, `main` bottom
   padding, horizontal overflow, minimum touch size — run in CI, at 320 and 390 px.~~
   **Done 2026-09-15:** `scripts/check-layout.mjs`, wired into `.github/workflows/verify.yml`,
   covering eight routes at 320 and 390 px. It also asserts one navigation system per
   tournament screen and the absence of step counters, and it was proved to catch a
   planted regression rather than assumed to. `main` bottom padding is still a constant
   24 px and is **not** yet asserted — the dock height is, which is the half that can grow.
4. A token-usage test enforces §5.1's orange discipline (R5-C).
5. Seeded fixtures exist for 500 entrants and 10,000 catches, and both render within budget.
6. 200 % text scale and reduced motion have coverage tests.
7. No score in this file is raised without a new measurement recorded beside it.

---

## 12. Dependencies

`ux-ui` owns the revisions. `head-dev` owns the measurement tests.
`tournament-experience-redesign.md` is the design under review in rounds 2–5.
`docs/design/06-accessibility-baseline.md` supplies the floors, which are not negotiable by
this loop. Real tournament data is a prerequisite for a defensible Round 6.

---

## 13. Risks and unanswered questions

1. **Projected scores get quoted as achieved scores.** The mitigation is the labelling in
   this file, and it is a weak mitigation. Round 6 should be run before this document is
   shown to anyone outside the team.
2. **Seven simulated critics share one author's blind spots.** They are a checklist, not a
   panel.
3. **Optimising for 320 px can cost the 430 px experience.** Nothing in rounds 1–5 scored a
   large phone or a tablet on its own terms.
4. *Open:* is 7.91 good enough to ship? This document's position is **yes for Phase 1** —
   the numbers are honest, the defects are named, and the alternative is another round of
   projection. It is not good enough to stop measuring.
