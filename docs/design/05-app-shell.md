# 05 — The App Shell

D23 makes the month calendar the app's home screen. This changes what a "persistent
nav" even needs to do: there is no tab bar full of five equally-weighted destinations,
because there aren't five equally important places to go — there's the calendar
(home), the live trip (when one is open), the notebook, and the "Needs a Look" queue,
and one of those (the live trip) only exists some of the time.

## 1. What persistent navigation is, on a phone

**No bottom tab bar.** A tab bar's whole premise — several co-equal sections, one tap
away, always visible — doesn't match this app's actual shape: this app has one home
(the calendar) and a small number of things that only matter contextually (an open
trip, an unresolved queue). A permanent five-icon bar would either waste a slot most of
the time (an "Active Trip" tab with nothing in it) or, worse, invite exactly the
tab-hopping/streak-adjacent engagement pattern D23 §1.2 explicitly designs against.

Instead, three elements, present on every screen, doing three different jobs:

- **A minimal top bar** — screen title (`text-h1` or context-appropriate heading) and,
  only when relevant, a back control. No logo-as-home-button pattern that only power
  users learn; the calendar is reached via an explicit `Calendar` text link/icon-with-
  label in this bar on every non-calendar screen, never assumed.
- **A persistent, contextual primary action**, docked at the bottom per
  `03-touch-and-interaction.md` §3 — this is where the quick mark lives, and it changes
  meaning by context rather than existing as a fifth thing to navigate to:
  - No open trip, on the calendar or a day page → `Start Fishing` (68px).
  - An open trip, from anywhere in the app → `Log a Catch` (88px) stays reachable via a
    persistent strip (see §2) even if the angler has navigated away from the live-trip
    screen itself — a trip that's running doesn't stop being interruptible just because
    someone tapped into the notebook to jot something first.
- **A small, honest badge** for the "Needs a Look" queue (`ux-calendar-notebook.md`
  §4.3) — a count, not an icon alone ("2" inside the amber-flag treatment from
  `02-semantic-colors.md`), reachable from the top bar. It is not a fourth nav
  destination competing for a whole tab; it's a badge that opens a queue, the same
  relationship a phone's notification count has to its source app.

## 2. Keeping the quick mark reachable while navigating elsewhere

This is the one shell behavior that most needs stating precisely, because D22's whole
premise (a fish is in hand, right now, no time to navigate) breaks if opening the
notebook or the queue makes `Log a Catch` disappear until the angler backs out.

**Rule: an open trip is a persistent state of the shell, not a screen.** While a trip
is open, a slim strip — trip name, elapsed time, and a compact but still 48px-minimum
`Log a Catch` affordance — stays docked at the bottom of every screen in the app except
the live-trip screen itself (which shows the full 88px version instead of the strip).
Tapping the strip's mark button logs a catch to the open trip from wherever the angler
currently is, with the identical toast/haptic feedback as tapping it from the live
screen — the trip does not need to be back on-screen for the mark to be honest. Tapping
the strip's *label* (not the mark button — a separate target, 12px away per the
interactive-spacing rule) navigates back to the full live-trip screen.

```
Any screen, trip open, e.g. viewing the Notebook:
┌─────────────────────────────────┐
│  ‹ Notebook · Aug 25                │  top bar
│                                    │
│  [ notebook content ]               │
│                                    │
├───────────────────────────────────┤
│  Balboa Pier · 1:42:10        ⌄     │  persistent strip, 12px from mark button
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃       LOG A CATCH              ┃  │  88px, always live, identical to the
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │  live-trip screen's button
└─────────────────────────────────┘
```

No screen in the app is ever allowed to cover this strip with a modal that has no
visible way to close it — every modal/sheet spec in `04-components.md` requires an
explicit, labeled close control for exactly this reason.

## 3. Behavior at 320px

- Top bar: title truncates with an ellipsis before it wraps to a second line — a
  two-line top bar would push content down unpredictably screen to screen. Back
  control, when present, is a real 48px target, never a bare edge-of-screen swipe zone
  (per the "nothing important is gesture-only" rule).
- Persistent primary action / mark strip: never shrinks below its defined height (68px
  or 88px) at any supported width — width is what flexes (edge padding drops to
  `space-4`/16px per `01-foundations.md` §3), height does not, because a shorter button
  is a smaller target exactly when the phone is smallest and hardest to hold steady.
- Queue badge: collapses to just the number in the amber treatment (drops any
  decorative icon padding) but keeps its 48px tap target — the badge is small
  visually, never small as a target.
- The calendar grid's 320px accommodation (~45px cells, with the List/agenda view as
  the 48px-compliant alternative) is specified in `04-components.md` §Calendar day
  cell and `03-touch-and-interaction.md` §1 — the shell's job here is only to make sure
  the Month/List toggle itself is a full 48px control, not a cramped afterthought next
  to a tight grid.

## 4. What the shell deliberately does not include

- **No streak, count, or "days logged" indicator anywhere in the shell chrome** — same
  ROADMAP Part 3 constraint the calendar itself observes (`ux-calendar-notebook.md`
  §1.2). The shell must not reintroduce at the app-frame level what the calendar
  screen was explicitly designed to avoid.
- **No search-everything omnibox in the shell.** Notebook search
  (`ux-calendar-notebook.md` §3.3) lives inside the notebook, not hoisted into global
  chrome — a search bar in every screen's top bar would compete with the badge and the
  back control for the same limited top-bar space, for a feature used far less often
  than "get back to today."
