# Cold Start, the Bad-Conditions Screen, and Two Products in One App

**Status:** design decisions, delegated by the founder (D19) and by O11's "design this
properly, it is likely the most important screen in the app." No application code here.
**Owner:** `ux-ui`. Overturns nothing settled; where I disagree with a settled decision
I say so once, here, rather than quietly designing around it.

Everything below assumes the touch/type/contrast/motion rules in this repo's `ux-ui`
role definition without repeating them per-screen. Numbers (48px, 56px, 18px) are
stated only where a specific screen is unusually tight.

---

## 0. The one design move that ties all three problems together

The zero-catch confirmation (O11) is not just a data-quality fix. It is also the thing
that fills the cold-start screen (O13) with real numbers instead of a progress-bar
platitude, and it is cheap enough on a lake that it survives bass mode's thin automatic
dataset (D18). I designed O11 first and let it pay rent in the other two.

---

## 1. O11 — Capturing a trip, especially a bad one

### 1.1 Four verbs, not a form

The whole logging surface, on phone and Watch alike, is four buttons:

**Start Fishing** · **Log a Catch** · **These conditions suck** · **End Trip**

No trip ever requires all four in order. `Log a Catch` or `These conditions suck` fired
with no open trip silently opens one behind the user, exactly as the ontology already
specifies for an orphan catch — I am extending that same rule to the frustration button.
An angler who never ceremonially taps "Start Fishing" still produces a complete record
the moment they tap either action button. Ceremony is available for the angler who wants
`hours_fished` and a live tide readout; it is never required to get a valid row.

### 1.2 Start Fishing (optional, but cheap when used)

```
┌─────────────────────────────┐
│  Where are you fishing?      │
│  [ Balboa Pier ▾ ]           │  last-used spot; tap to change or drop a pin
│  Going for? (optional)       │
│  ( Halibut )( Bass )( Anything )  ← chips, skippable, none selected by default
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      Start Fishing       ┃  │  56px, primary, only tappable thing that matters
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────┘
```
`target_species_ids` (architect's addition) rides along here for free — one tap, and it
is what turns a blank trip into "went for halibut, conditions weren't right" instead of
an unexplained zero. `platform` (surf/pier/boat/kayak — also architect's addition,
pending a founder yes/no per channel) belongs on this same screen as a chip row if it
ships; I'm designing as if it will, because a screen this cheap to extend now is
expensive to retrofit once trips exist without it.

### 1.3 While fishing — the frustration button is not the end-of-trip button

```
┌─────────────────────────────┐
│  Balboa Pier          1:42:10│
│  Tide: rising, 62%       ⌄   │  collapsed strip, tap to expand the curve
│        [ map / recent        │
│          catches this trip ] │
│      These conditions suck    │  secondary, always live, never blocks anything
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃       LOG A CATCH          ┃  │  primary, biggest thing, bottom thumb zone
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
│           End Trip             │  tertiary text link
└─────────────────────────────┘
```
Tapping **These conditions suck** mid-trip does not close the trip. It writes a
timestamped mood marker and nothing else — the founder's "you wanna click that" payoff
(D16), available as many times as the angler needs it, decoupled from the one-time
`catch_log_confidence` decision that only `End Trip` makes. This also does quiet
double duty: if the angler abandons the app without ever tapping `End Trip`, that marker
is evidence they were still actively fishing at that timestamp, not evidence they walked
away — useful context for whoever eventually looks at a `partial`/`unknown` trip.

**Log a Catch** is one tap, writes locally, done — a toast ("Fish #2 · 11:42am") with an
**Undo** link for a few seconds, never a confirmation dialog. This is unchanged for
salt vs. bass; §3 covers what, if anything, follows it.

### 1.4 End Trip — the screen O11 is actually about

Two states, and only one primary action on each:

```
Zero catches so far:                One or more catches logged:
┌───────────────────────┐          ┌───────────────────────┐
│  Balboa Pier · 3h 20m    │          │  Balboa Pier · 3h 20m    │
│    How'd it go?           │          │  2 fish logged             │
│  ┏━━━━━━━━━━━━━━━━━┓  │          │  ┏━━━━━━━━━━━━━━━┓  │
│  ┃ These conditions   ┃  │          │  ┃    End Trip       ┃  │
│  ┃ suck. End trip.     ┃  │          │  ┗━━━━━━━━━━━━━━━┛  │
│  ┗━━━━━━━━━━━━━━━━━┛  │          └───────────────────────┘
│  Actually, I caught one →│
└───────────────────────┘
```
(undo-style correction on the left, never a confirm dialog.) Tapping the zero-catch
button does two things at once: it sets
`zero_catch_confirmed_at` and `catch_log_confidence = complete` (satisfying the
architect's requirement that only a deliberate act produces a countable rate), and it
records the expressive sentiment D16 asked for. One tap, one screen, no separate
"neutral blank" path to design around — a blank trip and an expressive one are the same
button, because I don't think most anglers make that distinction in the moment, and
offering two buttons here would break the "one primary action" rule for no real gain.

If the trip already has catches, there is nothing to confirm — a Catch existing is
itself proof the trip was live — so `End Trip` is a bare, unemotional button.

### 1.5 The retroactive prompt — R2's actual mitigation

This only works for trips the app already knows about — i.e., the angler tapped
**Start Fishing** or fired one of the action buttons — and never got formally closed.
It cannot recover a trip that produced zero taps of any kind; that gap is real and I am
not solving it here (see §4). What it does solve: the very common case where someone
fished for three hours, caught nothing, put the phone away irritated, and never opened
the app again that day — R2's exact failure mode.

**Mechanism: a local notification, scheduled on-device at trip start, no network
required.** This is deliberately not a "next time you open the app" banner, because the
whole point is that a bad day is the day someone is least likely to open the app on
their own.

```
Lock screen, ~4h after "Start Fishing", if the trip is still open:
┌─────────────────────────────┐
│ 🎣 How did Balboa Pier go?    │
│ Tap to log it — takes 5 sec.  │
└─────────────────────────────┘
```
Tapping it deep-links straight into the §1.4 screen for that trip. If the trip closes
on its own before the notification fires, the notification is cancelled — the angler
who logs normally never sees this at all.

If it's ignored, the app does not nag a second time. At 24h the trip's confidence quietly
becomes `unknown` (excluded from any rate) but stays visible, un-scary, as a normal row
in trip history with a small **"Still open — add how it went"** link — answerable at
leisure, forever, not just in a 5-second notification window.

The four-hour delay is a guess, not a measurement — **I do not know the real
distribution of trip lengths for this app's users.** It's a placeholder tuned to "long
enough that most trips have ended, short enough that memory hasn't faded," and should be
replaced with a real number once trips exist to measure it.

**Ask permission for this in plain language, before the OS does — shown once, right
after the first "Start Fishing" tap, not at cold launch, so it has a reason attached:**
"We'll check in if you leave a trip open, so a slow day still counts toward your stats" /
**Turn on check-ins** / *Not now*. A bare OS permission dialog with no context reads as
spam and gets declined reflexively; tying the ask to something the angler already said
they wanted (their own stats being right) is the only honest way to ask for it.

---

## 2. O13 / Q16 — What a user with no data sees

**My call: show the real, local conditions, permanently — not as a placeholder for the
data that's missing, but as the thing worth opening the app for on day one and every day
after.** This is not a stopgap on the way to a score; it stays in the product forever,
underneath whatever the score becomes. Combined with a second, smaller card that is
honest about progress toward the score using the angler's own count — not a generic
"log more!" nudge, a real number.

### 2.1 Home screen, brand-new user

```
Saltwater spot:                       Lake spot (bass mode):
┌───────────────────────┐            ┌───────────────────────┐
│  Newport Bay Entrance    │            │  Big Bear Lake            │
│  Tide: rising, 34% ↑       │            │  No tide here — it's a lake.│
│  ▁▂▃▅▇▇▅▃▂▁▂▃▅▇ next high 2:14pm │  │  Pressure: 1013 hPa, rising │
│  Moon: waning gibbous     │            │  Moon: waning gibbous, 62% │
│  Pressure: 1013 hPa, steady│           │                          │
│  ┏━━━━━━━━━━━━━━━━━┓  │            │  ┏━━━━━━━━━━━━━━━━━┓  │
│  ┃   Start Fishing     ┃  │            │  ┃   Start Fishing     ┃  │
│  ┗━━━━━━━━━━━━━━━━━┛  │            │  ┗━━━━━━━━━━━━━━━━━┛  │
│  Your log is empty. Every │            └───────────────────────┘
│  trip — even a slow one — │
│  teaches the app what your│
│  water does.               │
└───────────────────────┘
```
Real tide/moon/pressure data for the angler's own default spot, not stock content — it
satisfies D19's ban on generic advice because nothing here is advice, it's measurement.
Works from minute one and never goes away once trips exist; catches just start appearing
as dots on this same tide curve. On a lake, the explicit **"No tide here"** line matters
more than it looks: biostat's rule is that a missing value must never render as a flat
line or a zero, since either reads as a measurement that was taken. Words are the fix.

### 2.2 Empty trip history

```
┌─────────────────────────────┐
│  Your Trips        🎣           │
│  Nothing logged yet.            │
│  Start a trip below. A slow      │
│  day counts too — it's how the   │
│  app learns what a slow day       │
│  looks like at your spots.        │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃      Start Fishing         ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────┘
```

### 2.3 The bite score, below threshold (V2+ — D12a's actual render rule)

D12a is explicit that V1 ships no score at all, so this card does not exist until V2.
Designing it now because O13's question ("what renders below threshold") is really
asking about this exact moment, and getting the *shape* right now means the eventual
score slots into UI that already exists and already has real numbers behind it — the O4
threshold and the O11 confirmed-complete count.

```
┌─────────────────────────────┐
│  Bite Score — Balboa Pier       │
│                               │
│  Still building.                │
│  7 of ~20 complete trips          │
│  logged here.                    │
│  ███████░░░░░░░░░░░░░░░░░           │
│                               │
│  The score needs enough of        │
│  your own trips at this spot       │
│  to mean something. Keep           │
│  logging and it turns on.          │
└─────────────────────────────┘
```
The number is real — it is the count of `catch_log_confidence = complete` trips at that
Spot against whatever O4 computes as the threshold — not a decorative bar. This is also
the moment the app can honestly tell the angler why answering the §1.5 notification
matters: every "these conditions suck, end trip" tap is a tick on this exact bar.

---

## 3. D18 — Two products, one interface, without a lowest-common-denominator form

### 3.1 Mode lives on the Spot, once, not on every trip

The ontology already puts `water_class` on `Spot`, not on `Trip` or `Catch`. That is
the right place and I'm building the UX around it rather than around a per-log toggle:
**the salt/fresh question gets asked exactly once, when a Spot is first created**, and
never again for every subsequent trip there.

First time a new pin is dropped: **"What kind of water is this?"** — two giant buttons,
**Salt water (ocean, bay)** and **Fresh water (lake, river)**, plain words, one-time
cost. After this the app already knows which ontology applies every time that Spot is
used — no "pick a mode" step in the fast path at all. *(Guess, flagged: a bundled
lake/coastline lookup could pre-fill this most of the time. I have not verified such a
dataset exists or is cheap to bundle — a question for `architect`/`biostat`, not a
requirement here. The manual ask is fine on its own; one tap, ever, per spot.)*

### 3.2 The one-tap write is inviolate in both modes

`Log a Catch` writes timestamp + GPS instantly and shows the toast, identically on salt
and lake. Nothing that follows is allowed to block or slow that write. Where the two
modes genuinely differ is what, if anything, is offered *after* the write completes —
and only on phone, never on Watch.

### 3.3 Salt: nothing more is needed

Tide, tide movement, tide state, moon, and pressure are all `AUTO`. The toast is the
whole interaction. Species/lure/length go to the leisure "needs details" queue exactly
as the spec already describes, because tide from three days ago is exactly
reconstructable — deferring costs nothing.

### 3.4 Fresh/bass: an optional 5-second sheet, because deferral is lossy here

Biostat's finding is blunt: on a lake, the automatic set is pressure and moon only.
Everything a bass angler actually reasons about — water colour, structure, cover, depth
— is `USER`. If that goes straight into the same low-urgency "someday" queue as species
ID, I think it mostly won't get filled in, for a reason that doesn't apply on salt water:
**tide doesn't decay in memory because the app fetches it later regardless of when you
ask; structure and water colour decay because they live only in the angler's memory of
that exact spot at that exact hour.** *(This is a behavioural guess, not something I've
verified — flagged as such, but it's the reason I'm proposing a deviation from strict
one-tap rather than accepting the queue as sufficient.)*

```
Immediately after the toast, on a lake trip only — swipe-away or Skip, never blocking:
┌─────────────────────────────┐
│  Nice fish! Logged 12:04pm ✓   │
│  While it's fresh —             │
│  Water color                    │
│  ( Clear )( Green )( Stained )( Muddy ) │
│  Structure                      │
│  ( Point )( Dock )( Timber )( Rock ) │
│  Depth                         │
│  ( Shallow )( Mid )( Deep )      │
│         Skip — add later →       │
└─────────────────────────────┘
```
Every row is a tap-only chip, no keyboard, no typing — keeping faith with D9's actual
rule ("never type something the phone already knows" is about typing, not tap count).
Realistically this makes bass logging "one tap plus one optional five-second tap sheet,"
not strictly one tap — a deliberate, disclosed deviation, and the smallest sheet I could
build that still captures the fields that are the entire reason a bass angler would use
this app, given how thin the automatic set is. `cover_type` is deliberately left out of
the quick sheet, only in the leisure queue — the architect flagged doubt on whether
structure/cover earns two separate fields, and putting both in the fast path would be
answering the founder's open question with my thumb on the scale.

Anything skipped lands in the same "needs details" queue as salt mode, with one honest
addition: items older than a day get a quiet visual note — **"logged 2 days ago — might
be hard to recall now"** — not a blocking warning, not styled as an error, just framing
that sets the right expectation instead of implying the field is equally fillable at any
distance in time.

### 3.5 What stays shared, and why that's correct rather than a compromise

The four verbs (§1.1) are identical on salt and fresh, on phone and Watch. That
shared surface isn't a lowest-common-denominator compromise — the wrist genuinely can't
host a chip sheet, and it shouldn't try. The Apple Watch app is, on purpose, the same
four big buttons regardless of mode:

Watch, idle: one screen, one button, **Start Fishing**. Watch, active trip: **LOG
CATCH** biggest and topmost, **These conditions suck** below it, **End Trip** as small
text at the bottom — the exact same three-button stack regardless of salt or fresh. No
Force Touch, no long-press, no gesture-only action — every one of these is a plain
visible button, held to the same 48px-equivalent floor as the phone, because cold wet
hands don't get smaller on a smaller screen. The divergence between salt and bass lives
entirely in the optional phone-only enrichment layer; the wrist never sees it.

---

## 4. Guesses I'm making plainly, not presenting as findings

- **The 4-hour retroactive-notification delay** (§1.5) is invented, not measured.
  Replace it with real trip-duration data once it exists.
- **Memory decays faster for water colour/structure than for tide** (§3.4) is a
  behavioural assumption about bass anglers I have not tested.
- **Combining "conditions suck" for both the expressive vent and the zero-catch
  confirmation into one button** (§1.3–1.4) assumes anglers don't want to distinguish
  "bad conditions" from "just didn't feel like it" as separate data. If that's wrong,
  it's a cheap two-button change to this same screen, not a re-architecture.
- **A bundled lake/coastline dataset could auto-suggest salt vs. fresh** (§3.1) is a
  nice-to-have I have not confirmed is buildable — escalating, not assuming.

## 5. What I'm not solving, on purpose

**True automatic trip detection** — a trip the angler never tapped anything for at
all — is the residual gap in R2 that this design cannot close. The spec already says
this is "the eventual answer," not a V1 problem, and it needs background-location and
battery tradeoffs that are `architect`'s call, not mine to sketch here. What I've built
instead is the cheapest version that recovers the much more common case: a trip that
*was* started and then abandoned out of frustration — which I'd guess, without data to
back it, is the majority of R2's actual bias, since starting a trip is already the
lowest-friction button in the app.
