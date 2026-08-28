# The Calendar, the Notebook, and the Man-Overboard Mark

**Status:** design decisions, extending `ux-cold-start.md` under D21/D21a/D22/D23/D24
(founder's answers of 2026-08-28, `docs/team/CHANNEL.md`, `founder -> all`). No
application code, no schema, no math — those belong to `architect` and `biostat`.
**Owner:** `ux-ui`. This document assumes everything settled in `ux-cold-start.md` and
does not repeat it: the four verbs, the End Trip screen, the needs-details queue's
existence, and the touch/type/contrast/motion floor all carry forward unchanged. Where
this doc adds to one of those screens, I say exactly what's added and leave the rest
alone.

---

## 0. The one move that ties this doc together

The founder's two images — "a notebook" and "the man-overboard button" — point at the
same design principle from opposite ends. The notebook has to hold *everything*,
unhurried, for later. The mark has to capture *almost nothing*, instantly, under
pressure. The failure mode in both directions is the same: making the fast thing slow
(a mark that asks a question before it saves), or making the slow thing shallow (a
journal that gets flattened into tags so it can be counted). I keep them strictly
separate the whole way through this doc — the mark writes one row and asks nothing;
the notebook writes prose and is never asked to justify itself as data. The calendar
is the seam between them: it is where a one-tap mark and a five-minute journal entry
about the same afternoon end up on the same page, and that page has to make both
visible without turning either into a score.

---

## 1. The month calendar

### 1.1 What a day cell is allowed to say

At a glance, in bright sun, one thing: **does this day have anything on it, and does
anything on it need me?** Not what, not how much, not whether it was a good day. Three
states, one shape each, same ink, same size:

- **Nothing recorded** — bare date number, nothing else.
- **A record exists** — a small filled dot under the number. This covers a confirmed
  catch *and* a confirmed zero-catch day *and* a journal-only day, identically. See
  1.2 for why that's deliberate, not a simplification I'm cutting for time.
- **Something needs a look** — a small amber outline flag next to the dot. This is an
  unresolved man-overboard mark or an unfinished trip sitting on that day. It is a
  chore indicator, not a decoration — see §4.2.

That's the entire vocabulary. No catch count, no species, no "personal best" star, no
color scale.

```
┌───────────────────────────────────────┐
│  ‹ July      August 2026      Sept ›   │      "‹ July" / "Sept ›" are full text
│                                         │      buttons, 48px tall — never a bare
│  Su   Mo   Tu   We   Th   Fr   Sa       │      chevron and never swipe-only.
│                    1    2    3          │
│                    ·    ●               │
│   4    5    6    7    8    9   10       │
│        ●         ●    ⚑         ●       │
│  11   12   13   14   15   16   17       │
│  ●              [18]                    │      [18] = today, outlined, not filled —
│  18   19   20   21   22   23   24       │      outline means "you can go here right
│                                          │      now," not "something happened here."
│  25   26   27   28   29   30   31       │
│                                          │
│  ● has a record     ⚑ needs a look       │      legend, plain words, once per screen
└───────────────────────────────────────┘
```

Each cell is one tap target covering the full day number and its glyphs — the glyph
itself is never an independent tappable icon, so it doesn't need its own label; the
day it belongs to is the label, exactly the way a page number doesn't need a caption.
The full state is also read aloud correctly for a screen reader ("August 14, has a
record" / "August 15, needs a look") since the visual shape is backed by real text,
not color alone (this also covers the 3:1 icon-contrast rule without relying on hue).

### 1.2 Why a caught day and a confirmed-blank day look the same

This is the direct answer to the gamification risk in ROADMAP Part 3. A calendar
that makes caught days bold and colorful and blank days faint or absent is a streak
grid wearing a fishing hat — it visually rewards catching and visually punishes (or
erases) not catching, which is exactly the bias Part 3 warns will corrupt the
denominator: people would start avoiding the log on a bad day because the grid makes
a bad day look like a loss.

So the dot for "two fish caught" and the dot for "confirmed nothing biting" (O11's
zero-catch confirmation, from `ux-cold-start.md` §1.4) are **the same dot** — same
size, same weight, same ink, same color. Both mean the identical thing to this screen:
*a human closed this day out and told the app what happened.* That is the only fact
the calendar rewards, and it's a fact worth rewarding because it's the one this whole
product depends on being unbiased — not the catch count.

Concretely, this rules out, on purpose, everywhere on this screen:
- No numeral badge ("3") on a cell — the moment a count is visible at a glance, the
  grid reads as a scoreboard even without color.
- No red/green, no "good day" hue mapping to catch count.
- No streak number, no "logged N days in a row," no fire icon, anywhere in this view
  or any other. ROADMAP Part 3 names this explicitly and I am not designing around it
  quietly — if anyone asks for it later, it's a founder-level call to reopen Part 3,
  not a UI tweak.
- No leaderboard, no comparison to other anglers, ever on this screen.

An open (unclosed) trip and a day with nothing at all both render as *nothing* — an
open trip is not yet a fact, it's a question, and it earns the amber flag (§1.3), not
a dot.

### 1.3 The flag is the only thing allowed to nag

The amber flag exists for exactly two situations, both because an unresolved thing
stops counting (D22's "excluded from every statistic until confirmed"):
1. A man-overboard mark from that day is still unresolved (§4.2).
2. A trip was started that day and never got an End Trip answer (the retroactive
   flow already described in `ux-cold-start.md` §1.5 — that mechanism didn't have a
   permanent home in the UI before; the calendar flag is that home).

It is amber, not red, and it is a flag shape, not an exclamation mark — "needs a
look," not "you did something wrong." Tapping the flagged day opens straight to the
item that needs an answer (§4.2), not to a generic day page the angler has to hunt
through.

### 1.4 An agenda view, because 320px and a 7-column grid are in tension

At the narrowest supported width, seven equal columns leave roughly 45px per day —
under the 48px floor for a tap target whose miss is costly. I'm not shrinking the
grid further to force compliance, and I'm not treating this as a silent exception
either: the reasoning is that a mis-tap here costs one extra tap to back out (wrong
day opens, angler taps back, tries the neighbor) with no data written and nothing
lost, which is a different harm profile than a mis-tap on a logging button. The 48px
floor exists to protect against costly mistakes, and a wrong-day tap isn't one.

That said, the grid is the overview, not the only way in. A plain-text toggle at the
top — **Month** / **List** — switches to a full-width agenda: one row per day that
has anything on it, each row a true 56px-tall tap target with the date, the same dot
or flag, and the first line of that day's journal entry if there is one.

```
┌───────────────────────────────────────┐
│  [ Month ]   List                       │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Aug 17 ●                          ┃  │
│  ┃  "Slow morning, moved twice —"       ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Aug 14 ⚑                          ┃  │
│  ┃  Trip still open — add how it went   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└───────────────────────────────────────┘
```

This is also, unplanned but welcome, most of the answer to "reference them later"
from §3 — a list of dated first lines is a much faster thing to scan for "that day
at Balboa" than a grid of dots ever will be.

---

## 2. The day page, three states

One primary action per screen holds here exactly as in `ux-cold-start.md` §1.4 — the
three states below earn three different answers to "what's the one big thing,"
because a fishing day and a reference day are different jobs.

### 2.1 Today

```
┌─────────────────────────────────┐
│  Today · Thursday, Aug 27          │
│                                    │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      Start Fishing         ┃  │  56px, primary — identical screen to
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │  ux-cold-start.md §1.2 once tapped
│                                    │
│  Notebook for today →              │  secondary text link, always present
└─────────────────────────────────┘
```

If a trip is already open, this page *is* the live surface from
`ux-cold-start.md` §1.3 — I am not designing a second live screen. If a trip on
today's date has an unresolved mark, a plain line appears above `End Trip`, not
competing with it: **"1 mark needs a quick answer →"** (see §4.2) — informational,
skippable, never blocking the trip from continuing or ending.

The notebook link is deliberately never the primary action on today's page. The
founder's own framing — "very detailed notes... with the ability to reference them
later" — describes something written when the fishing is done, at leisure, not
competing for thumb space with Start Fishing while a rod is in the other hand.

### 2.2 A past day with trips on it

This is a reference screen, not a conversion screen — the job here is reading, so the
biggest thing on the page is the content itself, not a button. This is a deliberate
reading of the "one primary action" rule, not an exception to it: on a history page,
retrieval *is* the action, and I'm not manufacturing a button just to have one.

```
┌─────────────────────────────────┐
│  Tuesday, Aug 25                   │
│                                    │
│  Balboa Pier · 6:10am–9:40am         │
│  2 fish logged                      │
│                                    │
│  Notebook                          │
│  "Bait fish were thick off the end   │
│  of the pier at first light. Moved    │
│  once the wind picked up around 8..." │
│                                    │
│           Add to this day →          │  plain text link, not a button — editing
└─────────────────────────────────┘
```

`Add to this day` is one link that leads to whichever backfill action makes sense
(add a trip, add a mark, open the notebook to keep writing) rather than three
competing buttons — the choice of *what* to add is made on the next screen, not
here, so this page stays a page about Aug 25, not a menu.

### 2.3 An empty past day

This is the backfill invitation (D24) and it gets the cold-start treatment — an
empty page teaches, it doesn't just apologize for being empty.

```
┌─────────────────────────────────┐
│  Monday, Aug 24                    │
│                                    │
│  Nothing logged for this day.       │
│  Fished but forgot to open the app?  │
│  You can write it in now.            │
│                                    │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      Write it in            ┃  │  56px, primary — the one thing this
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │  screen exists to offer
└─────────────────────────────────┘
```

`Write it in` opens a short chooser (trip details, a mark with a rough time, or just
the notebook) — same reasoning as 2.2, the fork happens one tap later so this page
keeps a single clean action. Anything created here is marked, quietly and
permanently, as entered after the fact (D24) — shown on the day page as a small
plain-word note under the entry, **"added Aug 27, for Aug 24"** — never hidden, never
styled as an error either. It's a fact about the row, not a flaw in it.

---

## 3. The notebook

### 3.1 One page, and it should feel like paper

The entry box is a single large text area, autosaving as the angler types — no Save
button, because a Save button is one more tap that can be skipped by a wave hitting
the boat, and because "did that save?" is not a question a paper notebook ever makes
you ask. Offline-first: it writes to the device immediately regardless of signal,
identically to every other write in this app.

```
┌─────────────────────────────────┐
│  Notebook · Tuesday, Aug 25         │
│                                    │
│  ┌───────────────────────────┐  │
│  │ Bait fish were thick off      │  │  one open text field, 18px, grows
│  │ the end of the pier at         │  │  as you type, no character limit
│  │ first light. Moved once the     │  │
│  │ wind picked up around 8...       │  │
│  │                                 │  │
│  └───────────────────────────┘  │
│                                    │
│  Tag this note:                    │
│  ( Balboa Pier trip )( General )     │
└─────────────────────────────────┘
```

### 3.2 Structure offered as a tap, never mined from the prose

D23 is explicit that this text is never parsed for statistics. That means anything
worth finding later has to be something the angler *chose*, at write time, with a
tap — not something the app infers from the words afterward. Two taps do that work:

- **Which trip this note is about**, when the day had more than one — a small chip
  row above the text box, populated from that day's actual trips plus a plain
  `General` option. This is stored as a link from the note to a Trip, a real field,
  not a guess from reading "pier" in the sentence. On a single-trip day this chip
  row doesn't appear at all — nothing to disambiguate.
- **A short list of your own recurring tags**, offered as chips the angler has used
  before (e.g. a spot name, "windy," "moved twice") — tapped once to attach, never
  typed fresh unless the angler wants a new one. This is the same "controlled
  vocabulary, tap not type" instinct as the rest of the app (D9's rule from
  `ux-cold-start.md` §3.4), applied to journaling instead of species/lure fields.

Both are metadata sitting *next to* the prose, never extracted *from* it. If a tag
turns out to matter statistically, that's `architect`'s call to promote it into a
real ontology field — exactly the escape hatch D23 already describes — not something
I build by having the app read the sentence.

### 3.3 Retrieval — designing the finding, not just the writing

"Reference them later" is a search problem, and I'm treating it as one, separate
from the calendar's job of browsing by date:

```
┌─────────────────────────────────┐
│  Search your notebook               │
│  [ 🔎 sabiki rig            ]        │  plain text search box, 18px
│                                    │
│  Filter by spot:                   │
│  ( Balboa Pier )( Newport Jetty )    │  tap chips, built from the angler's
│  ( All spots )                       │  own real spots — never a typed field
│                                    │
│  Aug 25 — Balboa Pier                │
│  "...sabiki rig on the bottom       │
│  once the bait moved deeper..."      │
│                                    │
│  Jul 3 — Balboa Pier                 │
│  "Switched to a sabiki after..."     │
└─────────────────────────────────┘
```

Full-text search over the angler's own stored prose is not the thing D23 forbids —
D23 forbids turning that prose into pooled statistics. Finding your own sentence
again is retrieval, not correlation, and it's the entire point the founder asked for.
The spot filter reuses the §3.2 trip-link, so "every note about Balboa Pier" is a
real query against a real link, not a text match on a place name that might be
spelled two different ways across two years of entries.

---

## 4. The man-overboard mark

### 4.1 It is not a new button — it's the one that already exists

D22's description — one tap, no questions, position saved, resolved or detailed
later — is the exact behavior `ux-cold-start.md` §1.1–1.3 already gave **Log a
Catch**. I am not adding a second control to the live surface; a second "mark"
button next to "Log a Catch" would immediately raise the question every angler would
ask standing on a rocking boat — *which one do I hit?* — and that question is the
one thing a man-overboard button is designed to never make you ask. `Log a Catch`
already lives at the bottom of the screen, biggest thing there, thumb zone, and it
already writes with no GPS or network requirement. D22 doesn't change the button; it
settles what happens after the tap — the row it creates starts life unresolved
(`species_id` null) rather than assuming a confirmed fish, and D21a's sticky rig
(§5) is what makes that single tap carry real data instead of an empty timestamp.

### 4.2 Feedback that doesn't require looking

The founder's framing is explicit — you click it *without* looking, because your
hands are busy. So the confirmation is layered by channel, in priority order for a
hand that can't check the screen:

1. **Haptic** — one short, distinct buzz, different from any other button's tap
   feedback in the app, so it's recognizable by feel alone over time.
2. **Sound** (if the device isn't silenced) — a single soft chirp, not a chime that
   competes with a fish-on shout.
3. **Visual, for whenever the angler does glance down** — the same toast pattern as
   every other log-a-catch tap, `"Fish #3 · 11:42am"` with an `Undo` link.

That third layer already carries the fix for the obvious failure mode: a mis-tap
noticed in the next few seconds is fixed with `Undo`, not a confirmation dialog
before the fact — consistent with this app's rule against "are you sure" taxes. A
mis-tap noticed *after* the undo window closes is what §4.3 is for.

### 4.3 An unresolved mark is a debt, and the queue is where it gets paid

D22 is blunt that an unresolved mark counts for nothing until a human closes it out —
so the entire value of a one-tap mark depends on there being a reliable place it
comes back to the angler's attention. I'm extending the same needs-details queue
`ux-cold-start.md` names for deferred species/lure fields (§3.3–3.4 there), not
building a parallel inbox — one list of "things I still owe this log," not two.

```
┌─────────────────────────────────┐
│  Needs a Look                3      │
│                                    │
│  ⚑ Aug 26, 6:14am · Balboa Pier      │
│    Marked, no details yet             │
│    [ Was it a fish? ]                  │
│                                    │
│  ⚑ Aug 24, 7:02pm · Balboa Pier      │
│    Marked, no details yet             │
│    [ Was it a fish? ]                  │
│                                    │
│    Aug 22 · Bass — no species yet     │
│    [ Add species ]                     │
└─────────────────────────────────┘
```

Tapping `Was it a fish?` opens one short, tap-only sheet: `Yes, add what I can` /
`Had it on, lost it` / `Just marking the spot, no fish` / `Wrong tap, remove it`.
Every option resolves the row to a real state — confirmed, lost, non-fish waypoint,
or dismissed — and the last one deletes the row with the same `Removed · Undo`
pattern used everywhere else, never a confirmation dialog, because an unwanted row
that's easy to put back is a smaller tax than a dialog every angler pays on every
correct tap.

Two things make this queue actually get emptied, rather than growing forever:
- **It's reachable from the exact moment it's most likely to get answered** — the
  End Trip screen (`ux-cold-start.md` §1.4) shows any of that trip's unresolved
  marks inline, right where the angler is already in wrap-up mode with the fish
  fresh in memory, before they ever have to find a separate queue at all.
- **It's visible from the calendar without hunting** — the amber flag (§1.3) on any
  day with an unresolved item, so a mark from three weeks ago is one tap from the
  month grid, not buried in a settings-style list nobody opens on their own.

### 4.4 Why this doesn't get a second notification system

`ux-cold-start.md` §1.5 already designed a local, on-device notification for an
open, unanswered trip. An unresolved mark on an *already-closed* trip doesn't get
its own copy of that mechanism — it rides the same End Trip moment (above) for the
common case, and otherwise sits, visible and unhurried, behind the calendar flag.
Two separate ping systems nagging about two flavors of the same underlying problem
(an unresolved thing that isn't yet a statistic) is worse than one honest queue with
two doors into it.

---

## 5. Setting the rig before, and changing it without losing the fish in hand

### 5.1 Setting it, once, before the first cast

This extends the Start Fishing screen from `ux-cold-start.md` §1.2 — same screen,
one more optional, collapsed section. Nothing here blocks or slows the primary
action; a rig is entirely skippable and every field defaults to whatever was used
last time at this Spot.

```
┌─────────────────────────────────┐
│  Where are you fishing?             │
│  [ Balboa Pier ▾ ]                    │
│  Going for? (optional)               │
│  ( Halibut )( Bass )( Anything )       │
│                                    │
│  ▾ Set your rig (optional)            │
│    Lure or bait: [ Sabiki ▾ ]          │
│    Depth: [ 20 ft ]                    │
│                                    │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      Start Fishing            ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────┘
```

`Platform` (pier/boat/kayak/surf) belongs in this same section if it ships — it's
still the pending founder yes/no `ux-cold-start.md` §1.2 already flagged, unchanged
by this doc. Whatever set of fields architect confirms, they all follow the same
rule: set once, sticky for the trip, and every mark made afterward inherits them
without being asked again — that inheritance is what turns a bare timestamp into
"halibut, sabiki, 20 feet, 11:42am" from a single tap.

### 5.2 Changing it mid-trip, without it costing the fish in hand

D21a's requirement is specific: changing the rig later must never rewrite a mark
that already happened, and — my addition, because this is where it would actually
break in the field — editing the rig must never be the thing standing between an
angler and the mark button while a fish is thrashing in their other hand.

Two design commitments make that true together:

- **The mark button is never covered by the rig editor.** On the live surface, the
  rig shows as a small strip above the primary button (`Rig: Sabiki, 20ft ▾`,
  the same collapsed-strip pattern the tide readout already uses in
  `ux-cold-start.md` §1.3). Tapping it opens the rig sheet as an overlay on the
  *upper* part of the screen only — the map/history area — while `LOG A CATCH`
  stays docked at the bottom, live and tappable, the entire time the sheet is open.
  Switching lures mid-thought never requires backing out of anything to catch a
  fish that bites while you're doing it.
- **Nothing needs to warn about the switch.** Because each mark already stores the
  rig values it inherited *at the moment it was tapped* (D21a), changing the rig
  forward from here is inherently safe — there's no "this will affect your past
  marks" dialog to design, because it's never true. That absence is the design: one
  fewer confirmation the angler has to read while wet and squinting.

```
┌─────────────────────────────────┐
│  Balboa Pier          1:42:10       │
│  Tide: rising, 62%              ⌄    │
│  Rig: Sabiki, 20ft              ⌄    │  tap opens rig sheet over the map only
│        [ map / recent               │
│          catches this trip ]           │
│      These conditions suck            │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃       LOG A CATCH              ┃  │  always live, never covered
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
│           End Trip                   │
└─────────────────────────────────┘
```

---

## 6. Apple Watch — where this whole doc doesn't apply

D15 hasn't moved, and none of the screens above are a Watch design. The Watch stays
exactly the three-button stack `ux-cold-start.md` §3.5 already specified, and this
doc adds one boundary to it: **the Watch never gets a calendar, a notebook, or a
rig-setting screen.** Reasoning per surface:

- **Month calendar and List view** — no screen small enough to matter here; a
  40mm face can't show a legible week, let alone a month, without violating the
  16px text floor. Calendar browsing is a phone/web job, full stop.
- **Notebook** — writing prose on a watch face, by dictation or by scratching at a
  crown, fails this persona harder than the phone does: wind and boat noise break
  dictation, and there's no keyboard worth typing on. The notebook doesn't exist on
  Watch in any form, not even a stub.
- **Needs Details / Needs a Look queue** — resolving a mark means reading a mark's
  context and picking among a few worded options; that's a phone task. The Watch's
  only involvement is a small, honest count as a complication or glance ("2 need a
  look") that deep-links to the phone — it never tries to resolve anything itself.
- **Setting the rig** — no reasonable one-handed Watch interaction for a chip row
  plus text entry. The rig is set on the phone before stepping onto the boat, or it
  isn't set at all and every mark just arrives with nothing to inherit — an equally
  valid, if thinner, row. The Watch never prompts for lure, bait, or depth.

The one thing the Watch keeps in full: the mark itself. `LOG A CATCH` is the same
button, same haptic-first confirmation (§4.2), same unresolved-by-default write
(D22), on a 40mm screen or a 6-inch one. That parity is the entire point of D22's
man-overboard framing — the fastest button in the app has to work identically on
the smallest screen it ships on.

---

## 7. Guesses I'm making plainly, not presenting as findings

- **The agenda/List toggle (§1.4)** solves the 320px/7-column tension by offering an
  alternate view rather than shrinking the grid. I haven't tested whether anglers
  actually reach for List over Month in practice — it's my best answer to a real
  tension, not a measured one.
- **The trip-link chip on notebook entries (§3.2)** assumes anglers will bother
  tapping a chip to say which trip a note is about. If they don't, multi-trip days
  degrade gracefully to `General` notes that are still fully readable on the day
  page, just not filterable by spot in search — a soft failure, not a broken one.
- **Folding unresolved marks into the existing End Trip and needs-details surfaces
  (§4.3–4.4)**, rather than a dedicated notification, assumes the calendar flag is
  visible enough on its own. If unresolved marks pile up unanswered in practice,
  the cheap next step is reusing the exact retroactive-notification mechanism from
  `ux-cold-start.md` §1.5 for them too — I left it out for now to avoid two
  overlapping nag systems until there's evidence one queue-plus-flag isn't enough.

---

## 8. What I need from another role

- **`architect`**: `Trip.platform` is still an open yes/no (flagged again in §5.1,
  first flagged in `ux-cold-start.md` §1.2) and now feeds the rig sheet directly —
  worth resolving before this gets built rather than after.
- **`head-dev`**: this doc assumes the web prototype (D21) is where §1–5 get built
  first, sharing the live-surface code from `ux-cold-start.md` rather than
  duplicating it — flagging so the calendar/notebook work doesn't get scoped as a
  clean-slate feature.
