# 12 — Guided setup checklist, Setup reorganised, and the Quiver

**Status:** Proposed — design only, no `.tsx` touched
**Date:** 2026-09-04
**Governs:** the Calendar home checklist, `/setup`, the new Quiver section
**Reads first:** `docs/specs/setup-flow-and-quiver.md` §6 (settled IA), `docs/design/10-setup.md`,
`docs/design/README.md` ("the test")
**Author:** `ux-ui`

Section §6 of the spec is not re-litigated here: the Quiver lives inside Setup, the nav
bar stays at six, the checklist lives on Calendar above the calendar, and the Tackle Box
is reached from Setup, not the nav. This document designs inside those rulings.

Two facts from the code drove decisions below and are stated up front so head-dev does
not have to re-derive them:

1. **Steps 1 and 4 of the founder's five-step list are one screen, not two.**
   `LocationConditionRecord` (`src/core/rules/catch/types.ts`) holds the place's name
   *and* its observed current, structure, water and depth in a single record, and
   `LocationSheet` is a single form where only `name` is required — everything else is
   optional. "Set a location" and "add conditions" are the same sheet, distinguished only
   by which fields got filled in. The checklist treats them as two rows because the
   founder's brief numbers them that way and each teaches a different idea, but both rows
   point at the same destination.
2. **A trip has no "end" in the UI yet** (`docs/design/09-fish-log.md`, "deliberately not
   built"). An open trip can span days. That makes "is there a location on the *current
   trip*" an unstable, code-churn-sensitive thing to hang a one-time checklist on — see
   §1.2 below for why the checklist does not use it.

---

## Part 1 — the five-step guided checklist

> **Superseded in part, founder 2026-09-04 (after first review).** There are now SIX
> steps, and step 1 changed meaning: it is "choose your fishing region" in Settings, not
> "set a fishing location". Location and conditions merged into one step — this document
> reached the same conclusion in 1.1's own note that both rows pointed at the same sheet.
> A tide station step was added at position 2, beside the region, since both are one-time
> Settings choices. Final order: region → tide station → tackle → rod setup → location and
> conditions → log a fish. Region and station ship with defaults, so "done" for those two
> means the angler actually chose, via `LocalPreference.useIsSet`, not that a value
> exists. Everything else below — the latch, the row copy pattern, the collapsed state,
> the Setup reorder, and the whole of Parts 2 and 3 — stands as written. See
> `docs/specs/setup-flow-and-quiver.md` §5.5.

### 1.1 The five steps, their destination, and what "done" means

This is the most important table in the document. Read the two right-hand columns
before building anything.

| # | Step (founder's words) | Destination | "Done" test | Lifetime or per-trip? |
|---|---|---|---|---|
| 1 | Set or select a fishing location | `/setup` — Location & Conditions section | The angler has **ever** saved a location (any `location_condition` row, any trip, `deleted_at IS NULL`) | **Lifetime** |
| 2 | Add gear to the Tackle Box | `/tackle` | The Tackle Box has **ever** held at least one item | **Lifetime** |
| 3 | Build or select a fishing rod setup | `/setup` — Today's Setup / Quiver section | The angler has **ever** saved a rod setup (any `trip_rig` row, any trip, any revision — active or retired) | **Lifetime** |
| 4 | Add current fishing-location conditions | `/setup` — Location & Conditions section (same sheet as step 1) | At least one saved location has **ever** had one or more of `current_term`, `current_strength`, `structure_type_ids`, `bottom_depth_m`, `water_color_id`, `water_clarity_id` set — i.e. something beyond just a name | **Lifetime** |
| 5 | Log a fish | `/log` | The angler has **ever** logged at least one catch | **Lifetime** |

**Every step is lifetime, not "today," and this is deliberate — it is the actual design
decision, not a simplification.**

The data underneath steps 1 and 4 is genuinely per-trip: a location describes right now,
and a fresh trip starts with no locations of its own (spec §6, `docs/design/10-setup.md`
"Location conditions are mutable"). If the checklist re-asked "is there a location on
*this* trip" every time a new trip opened, it would flip back to incomplete every single
outing for an angler who has fished for a decade — which is exactly the nagging failure
mode the founder named in §6.2 ("a checklist that keeps nagging an experienced user is a
checklist they learn to ignore"). A stepper that re-opens itself is worse than one that
never existed.

So the checklist is not a live readout of today's trip. It is a **one-time orientation
flag**, checked once per step and then remembered forever, independent of what happens to
any later trip. Concretely: each of the five booleans above is computed once, and the
moment it is true, it is written to durable local state (e.g. a `checklist_progress`
record, one boolean per step, no `trip_id`) and never re-derived from live data again —
so if an angler later deletes every location they ever saved, step 1 stays checked. The
checklist is not audited state; it is a memory of "you have done this before, so you know
how." That is also why deleting all your gear does not resurrect step 2 — the flag, once
set, cannot go back to false.

Steps 2 and 3 read the same way whether "lifetime" is stated for them or not, since
tackle and rod setups already persist independent of any single trip (that is the entire
point of the Tackle Box and the Quiver). Writing "lifetime" next to all five, including
the two that are naturally per-trip data, is the one line in this document worth
re-reading if anything about the checklist behaves unexpectedly later: **the checklist
step is not the data. It is a memory that the data was produced once.**

### 1.2 What each step's row says

Order matches the founder's numbered list exactly (spec §1).

Incomplete row — number, label, one-line explainer in `text-caption`/`text-text-muted`,
whole row is a `min-h-touch-floor` tap target that links to its destination:

| # | Label (`text-body`, `text-text-primary`) | Explainer (`text-caption`, `text-text-muted`) |
|---|---|---|
| 1 | Set a fishing location | Where are you fishing? |
| 2 | Add gear to your Tackle Box | Rods, reels, line, hooks — whatever's in your box. |
| 3 | Build a rod setup | Pair your gear into a rod you can fish with. |
| 4 | Add today's conditions | Current, structure, water — what you see out there. |
| 5 | Log your first fish | One tap, from here or the Log tab. |

Completed row — same label, explainer replaced by a status word, not removed (color is
never the only signal — 06-accessibility-baseline.md):

> **Set a fishing location** — *Done*

`Done` renders in `success-green` (the token's own documented use is "system-confidence
indicators... a completed... checkmark" — `02-semantic-colors.md` §"Success /
confirmation" — this is exactly that case, not a catch-quality signal, so it does not
reopen D23). No checkmark glyph without the word next to it, per the house rule on icons.

A completed row **stays tappable** and still goes to its destination — someone who
finished step 2 in January may want to add more gear in September, and the row is the
obvious place to do that. Completion changes the caption, not the tap behavior.

### 1.3 Layout at 320px

```
┌───────────────────────────────────┐  Card: CARD_CLASS, p-4, gap-3
│ Get set up                        │  h2, text-h3
│                                    │
│ [1] Set a fishing location      › │  min-h-touch-floor row, full width
│     Where are you fishing?        │  text-caption below label, wraps
│                                    │  12px+ gap before next row
│ [2] Add gear to your Tackle Box › │
│     Rods, reels, line, hooks —    │
│     whatever's in your box.       │
│                                    │
│ [3] Build a rod setup           › │
│     Pair your gear into a rod     │
│     you can fish with.            │
│                                    │
│ [4] Add today's conditions      › │
│     Current, structure, water —   │
│     what you see out there.       │
│                                    │
│ [5] Log your first fish         › │
│     One tap, from here or the     │
│     Log tab.                      │
└───────────────────────────────────┘
```

Numbers are plain circled digits (`1`–`5`) in a fixed-width leading column, not icons —
no image asset, no icon package (V1 ships none, per ADR 005 / README). Each row is a
single `<Link>` with `flex items-start gap-3 min-h-touch-floor` — the number and text
sit in one flex row so the two-line explainer wraps under the label without breaking the
tap target into two pieces. At 320px width the explainer text wraps to 2 lines for rows
2–4; that is accounted for above and does not overflow, because nothing in the row is
fixed-width except the leading number column.

Card sits **above** `MonthCalendar` in `src/app/(app)/page.tsx`, same page, above the
existing "Open tide chart" link and the passport card — matching spec §6.2 exactly
("the first screen on launch, so a new angler meets the order of operations without
having to find anything first").

### 1.4 The collapsed state — exact copy

The moment all five lifetime flags are true, the five-row card is replaced by one row:

```
┌───────────────────────────────────┐
│ Setup complete            Review › │
└───────────────────────────────────┘
```

- Left text: **"Setup complete"** — `text-body`, `text-text-muted`. Plain past-tense
  statement, not praise ("Nice work!" is the wrong register for this audience and this
  product — the log itself never celebrates, per D23, and this card should not either).
- Right side: **"Review"** — a `SECONDARY_BUTTON`-style link to `/setup`. Not "Open
  Setup" or "Setup" alone — "Review" says correctly that there is nothing left to
  configure for the first time, only things to look at or change.
- Whole thing is one row, `min-h-touch-floor`, fits on one line at 320px (the string
  "Setup complete" + "Review" is well under the ~30-character budget at 288px of usable
  width in `text-body`/`text-label`).

**Can it be re-expanded? No — not automatically, and there is no manual toggle.** Once
collapsed, it stays collapsed for the life of the account (or until app data is reset).
There is no accordion affordance to bring the five rows back, on purpose: a toggle that
re-shows five rows on a misplaced tap is itself a small annoyance, and the entire feature
that the five rows point at — rods, gear, locations, conditions — already lives
permanently at `/setup`, which is exactly where "Review" sends you. The checklist's job
was to teach the order once; `/setup` is the durable home for doing any of it again.
Nothing is lost by never re-expanding, because nothing the checklist could show you is
unavailable elsewhere.

If, hypothetically, an angler wipes their local data (`docs/architecture/decisions/004`)
and starts over, the checklist naturally reappears, because the lifetime flags themselves
were part of that wiped state — no special-case code needed.

---

## Part 2 — the Setup page, reorganised

### 2.1 Section order, and why

1. **Setup intro card** — unchanged. One `h1` ("Setup") and the existing one-line job
   statement. It orients; it is not a step.
2. **Today's Setup → Rods.** The founder's own phrase in spec §2, kept as the exact
   section label. This is the highest-frequency action on the page for a returning
   angler — most trips start with "is my usual rod still rigged, or do I need to bring
   one back" — so it sits first, immediately under the intro.
3. **Quiver.** Placed directly beneath Today's Setup's rods, not lower on the page and
   not behind a nav item, because spec §6.1 states the reasoning plainly: "saved rods sit
   next to the place you pull them into, which is also where the mental model wants
   them." Bring a rod back from the Quiver and the section you land in — Today's Setup —
   is one scroll away, not a page away.
4. **Today's Setup → Location & Conditions.** Second half of "what am I fishing with, and
   where" (the page's own job statement in `10-setup.md`). It follows rods for the same
   frequency reason: most returning anglers check their rod before they check the spot,
   since the spot is often the same water they fished last time and the rod is the thing
   more likely to have changed hands or gotten re-rigged.
5. **Tackle Box** — a single link-out card at the bottom, not a full section. Restocking
   gear is an at-home, off-trip errand, not a per-trip decision, and it is already reached
   from Setup per spec §6.3 ("the Tackle Box is reached from Setup, not promoted to the
   nav"). Bottom placement matches its lower frequency: you touch it when your gear
   changes, not every time you go fishing.

This keeps the two sections that repeat every trip (Rods, Location & Conditions) at the
top in the order most anglers actually use them, puts the Quiver where the founder said
the mental model wants it, and demotes the one section that is genuinely occasional
(Tackle Box) to a single card at the end rather than competing for attention with the
things done today.

### 2.2 Section headers — exact copy

| Order | Header (`h2`/`text-h3`) | Subheading / count line (unchanged pattern from current code) |
|---|---|---|
| 1 | Setup | *(unchanged intro paragraph)* |
| 2 | Today's Setup | *(no separate label — "Rods" is implicit as the first subsection; see 2.3)* |
| — | Rods | "None yet" / "N rigged" (existing copy, unchanged) |
| 3 | Quiver | "Nothing saved yet" / "N saved" |
| — | Location & Conditions | "None yet" / "N set up" *(renamed from "Today's locations" — see 2.4)* |
| 4 | Tackle Box | *(link card, see 2.5)* |

### 2.3 "Today's Setup" as a page-level grouping, not a redundant heading

Rather than inserting a literal `<h2>Today's Setup</h2>` above `<h3>Rods</h3>`, which
would put two headings back to back with nothing between them, "Today's Setup" is the
name of the region of the page containing Rods and Location & Conditions — realized as a
short intro line under the page's `h1`, not a second heading:

> Setup
> What you are fishing with and where, so logging a fish stays a couple of taps.

This sentence already exists in the current `SetupPage` component (`setup-page.tsx`) and
does not need to change — it already says "Today's Setup" in substance. Rods and
Location & Conditions keep their own `h3`s exactly as today.

### 2.4 One rename: "Today's locations" → "Location & Conditions"

The current heading "Today's locations" undersells what the section stores (spec §11–§13:
current, structure, water colour and clarity, bottom depth — not just a name), and it is
also the destination for checklist step 4, which is explicitly about conditions, not
location alone. Renaming it to **"Location & Conditions"** makes the checklist step 4
destination self-evident when an angler lands on the page after tapping it. The "+ Add
location" button keeps its existing label unchanged — adding a location is still the
single action that opens the sheet where conditions also live.

### 2.5 The Tackle Box link card — exact copy

A small card at the bottom of Setup, not a full section with a list, since Setup does not
own the Tackle Box's content:

```
┌───────────────────────────────────┐
│ Tackle Box                        │
│ Everything in your kit — rods,    │
│ reels, line, hooks, and more.     │
│                                    │
│ [ Open Tackle Box ]               │
└───────────────────────────────────┘
```

- Header: **"Tackle Box"** (`text-h3`)
- Body: **"Everything in your kit — rods, reels, line, hooks, and more."** (`text-body`,
  `text-text-muted`)
- Button: **"Open Tackle Box"** (`SECONDARY_BUTTON`, links to `/tackle`) — secondary, not
  primary, because Setup's one primary action is building today's rig, not shopping your
  inventory.

---

## Part 3 — the Quiver

`docs/architecture/decisions/008-quiver-identity-and-type-scoped-gear-options.md` landed
while this document was being written and settles the identity question §7.1 of the spec
left open: a Quiver entry is a **lineage**, grouped by a persistent `quiver_id` carried
across every re-rig, retire, and bring-back. This section designs against that ruling,
not around it. Two things from ADR 008 shape the screen directly:

- `quiverEntries()` returns **every lineage the angler has ever created**, not only the
  retired ones — each entry carries `in_todays_setup: boolean`.
- `canBringBack(entry)` is false whenever the lineage's latest revision is still active.
  A lineage currently rigged cannot be brought back a second time (that would put the
  same rod in Today's Setup twice), so the Quiver must show *something* for it other than
  the bring-back button, rather than hiding it and leaving an angler wondering where it
  went.

### 3.1 What a Quiver card shows

One card per lineage (`QuiverEntry`), sorted most-recently-used first
(`last_used_at`). Per spec §2, saved information includes rod, reel, line,
leader, hooks, and bait configuration. Rather than reusing the terse, unlabelled
`rodSummary()` string ("40 lb Fluoro · 6/0 Circle · Live bait") used on the active
Today's Setup card — appropriate there because the angler already knows which rod they
are looking at mid-trip — the Quiver shows **labelled rows**, because here the angler is
scanning several saved setups to pick the right one, sometimes weeks after they built it:

```
┌───────────────────────────────────┐
│ 40 lb Yo-Yo Stick                 │  title: the angler's own name, or
│                                    │  see 3.2 if none was given
│ Rod      Conventional             │  each row only appears if that
│ Reel     Star drag, 30            │  gear role was set — omit blanks,
│ Line     40 lb mono               │  never print "—" or "Not set"
│ Leader   60 lb fluorocarbon       │
│ Hooks    6/0 circle               │
│ Bait     Live bait                │
│                                    │
│ [ Bring back to Today's Setup ]   │  one primary action, full width
└───────────────────────────────────┘
```

- Row labels are exactly: **Rod, Reel, Line, Leader, Hooks, Bait** — plain words matching
  the founder's own list in spec §2, not the internal `GearRole` keys (`main_line`,
  `lure`/`jig`, `terminal`, `weight` collapse into or are omitted from this list; if a
  setup also has a weight or terminal-tackle entry recorded, add it as a seventh row
  labelled **Weight** or **Terminal tackle** only when present — never a blank row).
- Rows with no value are omitted entirely, not shown as "—" or greyed out (a blank row a
  70-year-old has to parse and dismiss is wasted attention).
- **One primary action:** `PRIMARY_BUTTON`, full width of the card, reads **"Bring back
  to Today's Setup"** — the exact destination named, matching spec §2's own phrase
  ("From the Quiver, the user can add that rod back to Today's Setup"). No secondary
  actions on this card (no rename, no delete) — the Quiver is a save point, not an
  inventory manager, and adding a second button here would break the one-primary-action
  rule for no benefit an angler on a boat needs.
- Tapping the button is instant, no confirmation screen — it is purely additive (a new
  active rod appears in Today's Setup; nothing is removed or overwritten), so there is
  nothing to protect against. A toast confirms where it went and offers the one
  correction an angler might want:

  > **Back in Today's Setup.** `Undo`

  Tapping `Undo` puts it straight back in the Quiver — symmetric with 3.3 below, and
  cheaper than a confirmation dialog nobody reads.

**When `in_todays_setup` is true** (`canBringBack(entry)` is false), the card shows the
same rod/reel/line/leader/hooks/bait rows, but the primary-button slot is replaced with a
plain status line instead of a disabled-looking button — a greyed-out button an angler
pokes at twice in the sun is worse than no button:

```
┌───────────────────────────────────┐
│ 40 lb Yo-Yo Stick                 │
│ Rod      Conventional             │
│ Reel     Star drag, 30            │
│ Line     40 lb mono               │
│ Leader   60 lb fluorocarbon       │
│ Hooks    6/0 circle               │
│ Bait     Live bait                │
│                                    │
│ Already in Today's Setup          │  text-body, text-text-muted, no button
└───────────────────────────────────┘
```

Text: **"Already in Today's Setup."** No action needed here — put it away from Today's
Setup first (2.1) if it needs to come back later for a different slot.

### 3.2 The title

ADR 008 rules that the Quiver never falls back to `Rod {slot}` — a slot number from a
trip three weeks ago is meaningless in a saved collection, and `rodSetupLabel()`'s
existing `Rod {slot}` fallback stays exactly as-is, but only for Today's Setup, where the
slot is the thing on screen. `QuiverEntry.label` is the ADR's own field, already resolved
by core before it reaches the component, so this design does not need to compute a
fallback — only specify what it should read when a lineage has no angler-given name:

**Named lineage:** the angler's own name, unchanged, e.g. "40 lb Yo-Yo Stick".

**Unnamed lineage:** built from `setup_type` and the rod/reel gear rows, short and
joined, e.g. **"Conventional · Star drag, 30"** — enough to tell two unnamed rods apart
in a scanning list, without inventing an identity `quiver_id` doesn't already give it.

### 3.3 Put Away — corrected copy

Spec §2 is explicit: putting a rod away must not imply deletion, because it never
deletes. Today's `setup-page.tsx` already does the right *thing* (`retireRodSetup` writes
a new revision, nothing is destroyed) but says nothing to the angler about it — a plain
"Put away" button with no follow-up reads as final, even though it is not.

**No confirmation dialog is added.** Per the house rule (undo over "are you sure"), and
because this action is reversible in one tap, a blocking dialog would tax every angler to
guard against a mistake that costs nothing to reverse. Instead:

- **Button copy stays "Put away"** on the Today's Setup rod card (`SECONDARY_BUTTON`) —
  it is already short, plain, and accurate; the fix is not the button, it is the
  follow-up.
- **A toast appears immediately after the tap:**

  > **Put away — saved in your Quiver.** `Undo`

  This is the corrected copy the spec asks for: it names where the rod went (answering
  "did I just lose this?") in the same breath as confirming the action happened, and
  `Undo` reverses it in one tap (re-activates the same rod in Today's Setup) for the rare
  case of a mis-tap — cheaper and faster than a dialog that would have appeared on every
  single put-away, including the 99% that were intentional.
- The existing caption on a re-rigged rod — "Version 2 — earlier fish keep the setup they
  were caught on" — is unrelated to Put Away and is correct as-is; it is not changed by
  this document.

### 3.4 Quiver empty state — exact copy

Before any rod has ever been put away:

```
┌───────────────────────────────────┐
│ Quiver                            │
│                                    │
│ Nothing saved yet. Put a rod away │
│ from Today's Setup and it lands   │
│ here, ready to bring back next    │
│ trip — nothing you build today    │
│ has to be rebuilt tomorrow.       │
└───────────────────────────────────┘
```

- Header: **"Quiver"**, count line reads **"Nothing saved yet"** (matches the existing
  "None yet" pattern's tone for Rods/Locations, adapted to the Quiver's own verb).
- Body copy: **"Nothing saved yet. Put a rod away from Today's Setup and it lands here,
  ready to bring back next trip — nothing you build today has to be rebuilt tomorrow."**
  This both explains what the Quiver is for and tells the angler exactly which button on
  the page above fills it, matching the house rule that an empty state teaches rather
  than just states absence.
- No button on the empty card itself — the action that would fill it ("Put away") lives
  on the Rods cards above, and duplicating it here would be a second way to do the same
  thing on the same page, which is not needed.

---

## Open items this document raises but does not close

1. **Deep-linking a checklist row to a specific field inside `/setup`.** This document
   specifies destinations at the page/section level (e.g. "the Location & Conditions
   section"), not a query-param or anchor scheme that auto-opens the `LocationSheet` on
   arrival. An anchor (`/setup#location`) that scrolls to the section header is a
   reasonable, low-risk enhancement head-dev can add without a client-side sheet-opening
   hook on page load, but it is not required to satisfy spec §1 ("tapping a step should
   take the user directly to the corresponding page") — landing on the right section with
   its existing "+ Add" button one tap away already does that.
