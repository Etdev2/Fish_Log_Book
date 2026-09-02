# 11 — Regulations & Fish ID

**Status:** Design specification, not yet built · **Written:** 2026-09-01
(initiative: *Regulations & Fish ID*)

## Job

One question, answered in two to three seconds, on a pitching deck, in full sun, with
one hand:

> **I am here, today, and I caught this fish — what is it, can I keep it, and am I
> legal where I am?**

Everything below serves that sentence. Where a decision made the answer prettier but
slower, the answer won.

This is also the first feature in the app where **being wrong has a legal consequence
for the user.** Nothing else in Fish Log Book can get somebody cited. That changes two
things about how it is designed, and both are load-bearing:

1. **Uncertainty must be visible, not smoothed over.** A missing value is never
   rendered as a dash or a zero.
2. **When we are unsure, the design pushes toward releasing the fish.** Never toward
   keeping it. This is not a tone preference — it is the rule that decides the colour,
   the wording, and the verdict downgrade table in §3.

---

## 1. Decision: the primary nav

`src/features/shell/components/shell-nav.tsx` says five destinations is the ceiling,
that "Settings" is the one that would be demoted first, and that a sixth "is a
conversation, not a patch." This section is that conversation.

### The call

**`Settings` leaves the bar. `Rules` takes its slot. The bar stays at five.**

```
before   Calendar   Setup   Log   Tide   Settings
after    Calendar   Setup   Log   Tide   Rules
```

`Settings` remains a real route at `/settings`, reached from a labelled 48px
`Settings` control in the top bar of the Calendar home (per `05-app-shell.md` §1, the
top bar is where "read rather than acted on under pressure" navigation lives — which
is exactly what Settings is).

### Why, specifically

- **A sixth slot does not fit and would not fit honestly.** At 320px, five flex-1 slots
  are 64px wide before padding. `text-label` is 18px/700; "Calendar" already exceeds
  its slot and only survives because the label is short and the row is tight. A sixth
  slot takes each to 53px, which would force either sub-16px type (forbidden without
  exception) or icon-only labels (forbidden by the house rule that every icon carries
  its word). There is no version of six that clears the floors in this system.
- **The swap makes 320px better, not worse.** "Rules" is five characters; "Settings" is
  eight. The bar's widest label after the swap is still "Calendar", and the tightest
  slot gains room.
- **Frequency and stakes both point the same way.** Settings is, by the nav file's own
  reasoning, the rarest destination and the only one never used with a fish in hand.
  Rules is consulted on the water, under time pressure, with a legal consequence
  attached. Between a destination visited twice a season at the dock and one visited
  several times a trip on a moving boat, the bottom bar belongs to the second.
- **Muscle memory survives.** The first four slots do not move. The angler who has
  learned "far right" has learned a position, and the position now holds something they
  need more often.
- **"Rules", not "Regulations" or "Regs".** Plain words, house rule. "Regulations" does
  not fit; "Regs" is jargon an occasional angler may not carry. "Rules" is the word a
  person uses out loud.

### Tap counts this buys

The critical path is not through the nav at all, and that is the point:

| Situation | Path | Taps |
|---|---|---|
| Fish in hand, logging it | Log flow → pick species → the regulation card is **already there** (§4.10) | **0 extra** |
| Fish in hand, not logging yet | `Rules` → `Can I keep this fish?` (the screen's primary action) → species | **3** |
| "What is this rockfish?" | `Rules` → `Rockfish ID` → wizard | **2** to start |
| "Am I allowed to be here?" | `Rules` → the location card at the top of the home screen is already resolved | **1** |
| Approaching a closed area | Nothing. The warning band comes to the angler (§4.8) | **0** |

### One inherited contradiction, noted and not relitigated

`05-app-shell.md` §1 argues for **no bottom tab bar at all**. The shipped app has one.
That disagreement predates this feature and is not mine to settle; this section takes
the shipped bar as the fact on the ground and makes the smallest correct change to it.
If the shell owner later removes the bar, `Rules` becomes a top-level entry wherever
`Calendar` and `Tide` go, and nothing else in this document changes.

**Out of my lane, needs head-dev:** the `SHELL_ROUTES` edit, the top-bar Settings
control, and the shell hook for the protected-area band (§4.8) are all shell code. This
document specifies them; it does not write them.

---

## 2. Decision: status colour semantics

Four states need to be readable at a glance, through glare, through polarised
sunglasses, and by a colour-deficient viewer — which, in this audience, is roughly one
man in twelve (`01-foundations.md` §1.3).

### 2.1 The four states, and what each one means

| State | Means | Word on screen | Glyph |
|---|---|---|---|
| **KEEP** | You may legally retain this fish here, today, within the limits shown. | `KEEP` | Filled check inside a circle |
| **RESTRICTED** | You may be able to keep it, but only if named conditions are met — and you have to check them. | `RESTRICTED` | Bordered triangle containing an exclamation |
| **RELEASE** | You may not retain this fish. Zero retention, closed season, or closed area. | `RELEASE` | Circular arrow returning to water (a "put it back" loop) |
| **UNKNOWN** | We could not confirm the rule. We are not telling you it is legal. | `UNKNOWN` | Outline circle containing a question mark |

**UNVERIFIED is not a fifth state.** It is a modifier that can ride on any of the four
(§3.2), because "we have a number but nobody checked it" is a statement about our data,
not about the fish.

### 2.2 Alias, or new values?

**Both, deliberately, and the split is principled:**

- **KEEP aliases `success-green`'s value** (`#48CE8A`). `02-semantic-colors.md` reserves
  success-green for "system confidence" and forbids it from meaning "good catch." KEEP
  does not break that rule: it is not a judgement about the fish or the day, it is a
  statement about the law. A 12-inch sanddab that is legal to keep is not a *better*
  fish than a rockfish you must release. The token is `status-keep`, aliased so that if
  the two meanings ever need to diverge, only one value moves.
- **RELEASE aliases `error-red`'s value** (`#FF8A80`). Release is the app's existing
  "stop / do not" colour used for its literal meaning.
- **UNVERIFIED aliases `amber-flag`'s value** (`#E8B55F`). Amber's existing promise is
  "something needs me." An imported regulation nobody has checked is exactly that.
- **RESTRICTED and UNKNOWN get genuinely new values**, because no existing colour can
  carry them safely. See below.

### 2.3 Why RESTRICTED is violet, and not amber or orange

This is the one confusion in the whole feature that gets somebody cited, so it gets the
long answer.

The intuitive ramp is green → amber → red. It is also the worst possible ramp for this
audience. To a deuteranope or protanope — the common red-green deficiencies — `#FF8A80`
(release red) and `#E8B55F` (amber) both resolve toward the same muddy yellow-tan, and
under a polarised lens in direct sun the hue separation that remains is the first thing
glare eats. "Restricted" and "Release" would land within a few degrees of each other in
perceived hue at exactly the moment the angler is deciding whether a fish goes in the
box or over the side.

**`status-restricted` is `#C9B4FF`, a light violet.** Violet is separable from both red
and green across all common colour deficiencies (it resolves toward blue, not toward
yellow), it is the one open hue slot in this palette, and — like `tide-cyan` and
`moon-pale` — it will be **single-purpose**: violet in this app means "there are
conditions attached," nowhere else, ever.

`signal-orange` was never a candidate. `02-semantic-colors.md` gives it exactly one
meaning — "tap this" — and a status band that looks like the primary button is a worse
failure than a hue collision.

### 2.4 Why UNKNOWN is deliberately colourless

`status-unknown` is `#C2CFD7`, a bright neutral steel with no hue to read. That is the
design: **we have no colour because we have no answer.** Every other state on this
screen is coloured; the one that isn't stands out precisely by its absence, and it can
never be mistaken for a permission.

It is not grey-as-in-disabled. At `#C2CFD7` it is one of the brightest colours in the
system (12.03:1 on `background`) — this state is loud, not quiet. An unknown rule is
more urgent than a known one, not less.

### 2.5 Never colour alone — four channels, every time

Every verdict renders **all four** of these simultaneously. None is optional, none is
"if there's room":

1. **The word**, in `text-display` (40px/800) — `KEEP` / `RESTRICTED` / `RELEASE` /
   `UNKNOWN`. Readable with the colour channel entirely removed.
2. **The glyph**, from §2.1 — four distinct silhouettes (filled circle, triangle, loop,
   outline circle). Distinguishable at 40px in peripheral vision by shape alone.
3. **The colour**, fill + border + headline ink.
4. **A one-sentence plain-English restatement** directly under the word, `text-body`,
   `text-primary`: "You can keep this one." / "Only if it is 22 inches or longer." /
   "This one goes back." / "We could not check this. Put it back."

Grey-scale the band, and it still answers the question. That is the test.

### 2.6 RESTRICTED and RELEASE are separated four ways, not one

Because this is the dangerous pair:

| | RESTRICTED | RELEASE |
|---|---|---|
| Hue | Violet `status-restricted` | Red `status-release` |
| Glyph | Triangle (angular) | Loop (round) |
| Word | 10 characters | 7 characters |
| Band edge | 3px border, **all four sides** | 3px border **plus** an 8px solid left rail in `status-release` |
| First word of the sentence | "Only…" | "This one goes back." |

Two of those four survive total colour loss. All four survive glare.

### 2.7 Quick reference

| State | Bright token | Fill token | Where the bright is used |
|---|---|---|---|
| KEEP | `status-keep` | `status-keep-fill` | Headline word, glyph, 3px band border |
| RESTRICTED | `status-restricted` | `status-restricted-fill` | Headline word, glyph, 3px band border |
| RELEASE | `status-release` | `status-release-fill` | Headline word, glyph, 3px band border, 8px left rail |
| UNKNOWN | `status-unknown` | `status-unknown-fill` | Headline word, glyph, 3px band border |
| UNVERIFIED (modifier) | `status-unverified` | `status-unverified-fill` | 8px left rail on the affected row, staleness banner |

Small pills (list rows, the Log strip) invert: **bright token as fill, `ink-on-status`
as the label**, so a pill reads as a solid chip of colour at 24px tall while a band
reads as a dark panel with a bright headline. One shape per scale, no ambiguity about
which is which.

---

## 3. Certainty: the content rules that outrank layout

### 3.1 "No limit", "Unknown", and "Zero" are three different things

They must never look alike, and the two ways design usually flattens them — an em dash
and a bare `0` — are both **banned outright in this feature**. No `—`, no `N/A`, no
empty cell, no bare `0` anywhere in a regulation card.

| Condition | Renders as | Colour | Sub-line (`text-body`, `text-primary`) |
|---|---|---|---|
| **No limit** | `No limit` | `text-primary` | "There is no bag limit on this species here." |
| **Zero retention** | `Zero — none may be kept` | `status-release` | "Every one of these goes back." |
| **Unknown** | `Unknown` + question glyph | `status-unknown` | "We could not confirm this. Treat it as zero and release the fish." |
| **Not applicable to this species** | `No size limit` | `text-primary` | "This species has no minimum or maximum length here." |

Note the fourth row: "no size limit" is a real regulatory fact and gets stated as one.
"We don't know the size limit" is a different sentence and a different colour.

### 3.2 Unverified records, and the downgrade table

A record is `unverified` when it exists in the dataset but no human has confirmed it
against an official source. The treatment:

- An 8px `status-unverified` left rail on the affected row (or the whole card, if the
  whole record is unverified).
- The line, in `status-unverified` at `text-body`: **"Nobody has checked this against
  the official rules yet."**
- A 48px secondary button on the card: `Show me the official page` (opens the source
  URL; disabled with a reason line when offline — `02-semantic-colors.md` §Disabled).

And, because the product rule is bias-to-release, the verdict itself is downgraded:

| True data verdict | Verified | Unverified | Data older than 30 days (§3.3) |
|---|---|---|---|
| KEEP | KEEP | **RESTRICTED** | **RESTRICTED** |
| RESTRICTED | RESTRICTED | RESTRICTED | RESTRICTED |
| RELEASE | RELEASE | RELEASE | RELEASE |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

**A verdict is never upgraded, only downgraded.** The reason for a downgrade is always
stated in the band's sentence, in place of the normal one: "We have a limit on file,
but nobody has checked it. Treat it as a maybe, not a yes."

### 3.3 The staleness banner

Three tiers, keyed off the age of the downloaded regulation dataset. The banner sits
directly under the top bar on every Rules surface, and above the Save button (never
covering it) on the Log flow's regulation strip.

| Age | Treatment | Copy |
|---|---|---|
| 0–7 days | Not a banner. One quiet line, `text-caption` (16px), `text-muted`, under the location card. | "Rules checked 3 days ago." |
| 8–30 days | Banner: `status-unverified-fill` background, 8px `status-unverified` left rail, `radius-md`, `space-4` padding, `text-body` in `text-primary`, plus a 48px `Check for updates` secondary button. | "Regulations last updated 14 days ago — connect to the internet to verify before retaining fish." |
| Over 30 days, **or** the dataset's season boundary has passed | Banner: `status-release-fill` background, 8px `status-release` left rail, otherwise identical geometry. **All KEEP verdicts downgrade to RESTRICTED** per §3.2. | "These rules are 46 days old and seasons may have changed. Check for updates before you keep anything." |

The banner is **not dismissible.** This is the one place in the app where a persistent
nag is correct: dismissing it is exactly what the angler will do at the dock and regret
on the water. It is capped at two lines of text plus one button so it never eats the
screen, and it never scrolls with content in a way that hides it — it is pinned under
the top bar until the dataset is refreshed.

### 3.4 Words we never use

Banned strings in this feature, enforced by review:

- "Definitely", "certainly", "guaranteed", "confirmed legal", "safe to keep".
- "Invalid", "error code", any bare numeral or code where a sentence belongs.
- "This is a Vermilion Rockfish." (Always "Likely…" / "Possibly…" — §4.6.)
- "N/A", "—", "null", "no data".

---

## 4. The ten surfaces

All wireframes are drawn at **320px** — the narrowest supported width, 288px of usable
content after `space-4` edge padding each side. Everything wider is the same layout
with more room; nothing reflows into a second column below 720px.

Grid discipline, applied to every surface without exception: **one column, left edge at
`space-4`, right edge at `space-4`, `space-3` (12px) between adjacent tappable things,
`space-4` (16px) between cards, `space-6` (24px) between sections.** Every card is
`radius-lg`, `surface` fill, `hairline` border, `space-4` internal padding
(`space-6` when it holds more than two sections). Nothing floats off that grid.

### 4.1 Regulations home — "My Current Regulations"

```
┌──────────────────────────────────────┐
│  Rules                    [ Settings ]│  top bar, text-h1 / 48px control
├──────────────────────────────────────┤
│ ▌Regulations last updated 14 days     │  staleness banner §3.3
│ ▌ago — connect to the internet to     │  status-unverified rail + fill
│ ▌verify before retaining fish.        │
│ ▌  ┌────────────────────┐             │
│ ▌  │ Check for updates  │  48px       │
│ ▌  └────────────────────┘             │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ WHERE YOU ARE                     │ │  text-caption, text-muted, tracking-station
│ │ Santa Monica Bay                  │ │  text-h2 (26px)
│ │ CA Groundfish Area: South         │ │  text-body-strong
│ │ Tuesday, 1 September              │ │  text-body, text-muted
│ │ Fishing from: Boat                │ │  text-body + 48px [Change] text button
│ │ ───────────────────────────────── │ │  hairline
│ │ Rules checked 3 days ago.         │ │  text-caption, text-muted (§3.3 tier 1)
│ └──────────────────────────────────┘ │
│                                        │
│ ┌──────────────────────────────────┐ │
│ │ Species & Limits                  │ │  72px row, text-h3
│ │ What you can keep, and how many   │ │  text-caption, text-muted
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Rockfish ID                       │ │
│ │ Six questions, then a best guess  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Depth & Boundary Rules            │ │
│ │ The map, and how deep you can fish│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Protected Areas                   │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Groundfish Rules                  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Seasons                           │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Gear                              │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Offline Downloads                 │ │
│ │ 2 regions saved · 1 update ready  │ │  status-unverified text if update ready
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃      Can I keep this fish?        ┃ │  68px, signal-orange, docked
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────────────┤
│ Calendar  Setup   Log   Tide   Rules  │
└──────────────────────────────────────┘
```

- **One primary action:** `Can I keep this fish?` — 68px, `signal-orange`,
  `ink-on-orange`, `radius-md`, full width minus edge padding, docked at the bottom
  above the nav per `03-touch-and-interaction.md` §3. It goes straight to the species
  picker (§4.3), skipping the home screen's own card list. It is the biggest thing on
  the screen.
- **Card ordering is by on-the-water frequency, not by category tidiness.** The three
  used with a fish in hand — Species & Limits, Rockfish ID, Depth & Boundary — are
  above the fold at 320px. Offline Downloads is last because it is a dock activity.
- Each category row: 72px min height, `space-4` padding, title `text-h3` (22px, 700,
  `text-primary`), sub-line `text-caption` (16px, `text-muted`). Rows are `space-3`
  apart. The whole row is one tap target and follows Button's pressed/focus states
  (`04-components.md` §Card).
- **Loading:** the location card renders its skeleton as honest text, not a shimmer —
  "Finding where you are…" with the 44px spinner (`04-components.md` §Loading). The
  eight category rows render immediately; they do not depend on GPS.
- **Empty (no regions downloaded at all):** the category list is replaced by a single
  card — "No rules on this phone yet. Download the area you fish so it works with no
  signal." — and the primary action becomes `Download my area`, 68px.

### 4.2 Current-location regulations, and the manual fallback

The "Where you are" card has five states. All five are the same 5-row geometry so the
card never jumps height as GPS resolves.

**Resolved (GPS good):** as drawn in §4.1, plus a `text-caption` line "Located to
within 30 feet."

**Resolving:**
```
│ WHERE YOU ARE                         │
│ Finding where you are…       ◌        │  text-h2 + 44px spinner
│ Using your last area until it does:   │  text-body
│ Santa Monica Bay                      │  text-body-strong, text-muted
│ ┌────────────────────────────────┐    │
│ │ Pick my area myself            │    │  48px secondary, always available
│ └────────────────────────────────┘    │
```
The manual escape is offered **immediately**, not after a timeout. An angler who
already knows where they are should never wait for a satellite.

**Denied (permission refused):**
```
│ WHERE YOU ARE                         │
│ ▌This phone is not sharing your       │  status-unverified rail
│ ▌location with Fish Log Book.         │
│ Pick your area and the rules will     │  text-body, text-primary
│ still work.                           │
│ ┌────────────────────────────────┐    │
│ │ Pick my area                   │    │  48px, primary-styled within the card
│ └────────────────────────────────┘    │
│ ┌────────────────────────────────┐    │
│ │ How to turn location back on   │    │  48px secondary → plain instructions
│ └────────────────────────────────┘    │
```
No error red. A refused permission is a choice, not a failure — `04-components.md`
§Error state's rule that non-errors are not styled as errors.

**Unavailable (no fix — below deck, canyon, cold start):** same as Denied but the
sentence is "No satellite fix right now. This happens below deck and near cliffs." and
the second button is dropped.

**Stale position (last fix older than 2 hours):** resolved layout plus an 8px
`status-unverified` rail on the card and the line "Your last fix was 3 hours ago. If
you have moved, pick your area." — because a two-hour-old position on a boat is a
different management area.

**Manual region picker** (reached from every fallback above):
```
┌──────────────────────────────────────┐
│  ‹ Back    Pick your area             │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ Search areas                   │  │  48px input, optional
│  └────────────────────────────────┘  │
│  RECENTLY USED                        │  text-caption, tracking-station
│  ┌────────────────────────────────┐  │
│  │ Santa Monica Bay          ✓    │  │  56px rows, 12px apart
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Marina del Rey                 │  │
│  └────────────────────────────────┘  │
│  ALL AREAS                            │
│  ┌────────────────────────────────┐  │
│  │ CA — North (Cape Mendocino…)   │  │
│  └────────────────────────────────┘  │
│  … grouped by state, then by area     │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃      Use Santa Monica Bay      ┃  │  68px, enabled once one is picked
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
```
Search is a convenience, never the only path — the persona types as little as possible.
Rows are 56px, `text-body-strong`, `space-3` apart. The selected row carries a
`signal-orange` check glyph **and** the word "Selected" in `text-caption` (never a
check alone). When the primary button is disabled, the reason sits above it: "Pick an
area first."

A manually-picked area is sticky until changed, and the home card labels it: "Area you
picked: Santa Monica Bay · [Change]" so it is never confused with a GPS result.

### 4.3 Species & limits — search and browse

```
┌──────────────────────────────────────┐
│  ‹ Rules       Species & Limits       │
├──────────────────────────────────────┤
│ ▌ staleness banner if 8+ days         │
│  ┌────────────────────────────────┐  │
│  │ Search a fish                  │  │  48px, text-body, label above
│  └────────────────────────────────┘  │
│                                        │
│  YOU LOGGED RECENTLY                   │  text-caption, tracking-station
│  ┌────────────────────────────────┐  │
│  │ Vermilion Rockfish             │  │  76px row
│  │ [KEEP] 1 per day · 12 in min   │  │  pill + text-body
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Copper Rockfish                │  │
│  │ [RELEASE] Closed until 1 Oct   │  │
│  └────────────────────────────────┘  │
│                                        │
│  COMMON IN SANTA MONICA BAY            │
│  ┌────────────────────────────────┐  │
│  │ California Halibut             │  │
│  │ [RESTRICTED] 22 in min         │  │
│  └────────────────────────────────┘  │
│  … 8–12 rows                          │
│                                        │
│  ┌────────────────────────────────┐  │
│  │ All species, A to Z            │  │  56px secondary
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Not sure what it is? Rockfish  │  │  56px secondary → §4.5
│  │ ID                             │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- **Recent-first is the design**, matching `09-fish-log.md`'s species picker: during a
  hot bite, the fish you just caught is the fish you are about to catch again.
- Row: 76px min, species name `text-body-strong` (18px/700), second line = the verdict
  pill (24px tall, `radius-sm`, bright fill, `ink-on-status` label at `text-caption`
  16px/700 — a pill is not a tap target, so 16px inside 24px is legal and legible)
  followed by the single most decision-relevant fact in `text-body`.
- **Every row carries a verdict pill.** Browsing a list is already answering the
  question; the angler should not have to open a card to learn the fish is closed.
- Search: `text-body` input, results replace the two grouped sections, matches on
  common name, regional nicknames, and scientific name. **No results:** "No fish here
  matches *chucklehead*. Try another name, or use Rockfish ID to work it out from what
  it looks like." plus the 56px `Rockfish ID` button — never a bare "0 results".
- **Offline:** identical. This list is served from the downloaded region. If the region
  is not downloaded, the screen is the empty state from §4.1 with `Download my area`.

### 4.4 The regulation result card

**This is the most important screen in the feature.** The hierarchy below is fixed and
is not a designer's preference — it is the order the angler reads under pressure, and
no future screen reorders it.

```
┌──────────────────────────────────────┐
│  ‹ Back      Vermilion Rockfish       │  top bar, name truncates at one line
├──────────────────────────────────────┤
│ ▌ staleness banner if 8+ days (§3.3)  │
│                                        │
│ ╔════════════════════════════════════╗│  THE VERDICT BAND
│ ║ ✓                                  ║│  glyph 40px, status-keep
│ ║ KEEP                               ║│  text-display 40/800, status-keep
│ ║ You can keep this one.             ║│  text-body, text-primary
│ ╚════════════════════════════════════╝│  status-keep-fill, 3px status-keep border
│                                        │
│ ┌───────────────┐ ┌────────────────┐ │  THE FOUR FACTS, 2×2
│ │ HOW MANY      │ │ HOW BIG        │ │  text-caption, text-muted
│ │ 1 per day     │ │ 12 in minimum  │ │  text-h3 (22px), text-primary
│ └───────────────┘ └────────────────┘ │
│ ┌───────────────┐ ┌────────────────┐ │
│ │ WHEN          │ │ WHERE          │ │
│ │ Open now      │ │ Shallower than │ │
│ │ Closes 31 Dec │ │ 300 ft         │ │
│ └───────────────┘ └────────────────┘ │
│                                        │
│  ALSO TRUE HERE                        │  text-caption, tracking-station
│  • Counts toward your 10-fish          │  text-body, disc bullets
│    groundfish bag.                     │
│  • Descending device required on       │
│    board.                              │
│  • Barbless hooks are not required      │
│    here.                               │
│                                        │
│  ┌────────────────────────────────┐  │
│  │ ⌄ The official wording         │  │  56px disclosure, collapsed by default
│  └────────────────────────────────┘  │
│  Source: CDFW 2026 Ocean Sport         │  text-caption, text-muted
│  Fishing Regulations, checked 3 days   │
│  ago.                                  │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃        Log this fish              ┃ │  68px primary → the Log flow, species
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │  pre-filled
└──────────────────────────────────────┘
```

**Verdict band geometry (fixed across all four states):**

| Property | Value |
|---|---|
| Fill | `status-{state}-fill` |
| Border | 3px solid `status-{state}` on all four sides |
| Extra rail (RELEASE only) | 8px solid `status-release`, left edge, inside the border |
| Corner | `radius-lg` (16px) |
| Padding | `space-5` (20px) all round |
| Glyph | 40px square, `status-{state}`, `space-3` above the word |
| Headline | `text-display` (40px/800), `status-{state}` |
| Sentence | `text-body` (18px/400), `text-primary`, `space-2` under the headline |
| Min height | Content-driven; never below 120px at any width |
| Full-bleed? | No — it respects the `space-4` edge padding like every other card |

**Secondary text inside a status fill is `text-primary`, never `text-muted`.**
`text-muted` on these fills computes to 5.5–6.0:1, below the system's accepted floor
(`01-foundations.md` §1.2). This is a hard rule, not a preference.

**The four facts:** a 2×2 grid, each cell 138px wide at 320px (288 − 12px gutter, ÷2),
`space-3` gutters both axes, `surface` fill, `hairline` border, `radius-lg`,
`space-4` padding, min height 88px so all four cells are equal regardless of content
length. Label `text-caption` (16px/500) `text-muted`, uppercase, `tracking-station`.
Value `text-h3` (22px/700) `text-primary`, wrapping to two lines maximum before it
truncates with a `Read more` 48px control.

Order within the grid is fixed: **HOW MANY, HOW BIG, WHEN, WHERE** — reading order is
left-to-right, top-to-bottom, and matches how the rule is spoken out loud.

**The other three verdicts:**

```
╔════════════════════════════════════╗   ╔════════════════════════════════════╗
║ ⚠                                  ║   ║ ↺                                  ║
║ RESTRICTED                         ║   ║ RELEASE                            ║
║ Only if it is 22 inches or longer. ║   ║ This one goes back.                ║
╚════════════════════════════════════╝   ╚════════════════════════════════════╝
 status-restricted-fill, violet border    status-release-fill, red border
                                          + 8px left rail

╔════════════════════════════════════╗
║ ?                                  ║
║ UNKNOWN                            ║
║ We could not check this rule.      ║
║ Put the fish back.                 ║
╚════════════════════════════════════╝
 status-unknown-fill, steel border
```

**Unknown values inside the four-fact grid** (a card can be KEEP overall and still have
one unknown cell — e.g. we know the bag limit but not the size limit):

```
┌───────────────┐
│ HOW BIG    ?  │  question glyph 24px, status-unknown, top-right of the cell
│ Unknown       │  text-h3, status-unknown
│ Treat it as   │  text-body, text-primary — the cell grows, the row grows with it
│ zero and      │
│ release it.   │
└───────────────┘
```
An unknown cell **cannot** coexist with a KEEP verdict on the same card. If any of the
four facts is unknown, the verdict downgrades to RESTRICTED at minimum, and to UNKNOWN
if the unknown fact is HOW MANY or WHEN. That rule lives in the data layer, not the
component — flagged to `architect` in §7.

**Unverified record** — the whole card carries an 8px `status-unverified` left rail
outside the verdict band, the band's sentence is replaced per §3.2, and a row appears
directly under the band:

```
│ ▌Nobody has checked this against the  │  status-unverified text
│ ▌official rules yet.                  │
│ ▌ ┌───────────────────────────────┐  │
│ ▌ │ Show me the official page     │  │  48px secondary
│ ▌ └───────────────────────────────┘  │
```

**The official wording** is a native `<details>`-style disclosure, **collapsed by
default, always**. 56px trigger row, `text-body-strong`, chevron glyph plus the words
"The official wording" (never a bare chevron). Expanded, the legal text renders at
`text-body` (18px — the legal text is not exempt from the type floor) in a
`surface-raised` panel with `space-4` padding, verbatim, unedited, with its citation.
It is last because nobody standing on a deck reads a statute; it is present because the
one person who needs it needs it exactly.

### 4.5 Rockfish ID wizard

Six questions, **one per screen**, no scrolling to answer. Traits, in order — chosen so
the earliest questions are the ones an angler can answer while the fish is thrashing:

1. **What colour is it mostly?**
2. **Does it have spots or blotches?**
3. **What colour are the fins?**
4. **Any stripes or bands?**
5. **What does the head and jaw look like?**
6. **Roughly how big is it?**

```
┌──────────────────────────────────────┐
│  ‹ Back    Rockfish ID       Start    │  "Start over" 48px text button, right
├──────────────────────────────────────┤
│  Question 2 of 6                      │  text-caption, text-muted
│  ●●○○○○                               │  progress dots, decorative, aria-hidden
│                                        │
│  Does it have spots or blotches?      │  text-h1 (32px), text-primary
│                                        │
│  ┌────────────────────────────────┐  │
│  │ ▓▓▓▓  Yes — clear light spots  │  │  88px tile, 64px image, text-h3 label
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ▓▓▓▓  Yes — dark blotches      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ▓▓▓▓  No — all one colour      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  ?     Not sure                │  │  88px, border-interactive outline,
│  └────────────────────────────────┘  │  same height as every other answer
└──────────────────────────────────────┘
```

- **Answer tiles:** 88px (`touch-primary-quick-mark`), full width, `space-3` apart,
  `surface` fill, `hairline` border, `radius-lg`, 64px image thumbnail at the left with
  `space-4` between image and label, label `text-h3` (22px/700). Tapping advances
  immediately — no "Next" button to hunt for. Selection state is not needed because the
  screen changes.
- **Q1 colour swatches** carry the colour *and* the word: "Bright red or orange",
  "Brown or olive", "Black or dark grey", "Copper or bronze", "Pale or whitish",
  "Not sure". A colour-blind angler is describing a fish they can see; the word is
  there so our swatch never becomes the thing they have to match.
- **Plain words only, and the jargon comes second.** "The bit under the jaw" before
  "symphyseal knob", and only ever as "the bit under the jaw (biologists call it a
  symphyseal knob)" once the angler has answered something. No Latin, no "peduncle", no
  "opercular spines" on the way in.
- **"Not sure" is a first-class answer.** Same 88px tile, same position (always last),
  never a text link, never smaller, no apology copy. It does not skip the question — it
  records "this trait is unconstrained" and keeps every candidate that would have been
  eliminated. Answering "Not sure" six times is a legal path through the wizard and it
  produces a real result page (§4.6), not a dead end.
- **Back** at every step, 48px, returns the previous answer editable. **Start over** is
  a 48px text button in the top bar.
- **Never blocks on network.** The wizard is entirely local; a downloaded region
  includes its rockfish key and reference images.
- **Images missing** (region downloaded without images, or a slow first load): the tile
  keeps its 88px height and its label, and the thumbnail slot renders a
  `surface-raised` square. The label alone is a complete answer — images are an aid,
  never the carrier.

### 4.6 ID results, and the two-species comparison

```
┌──────────────────────────────────────┐
│  ‹ Back        What you caught        │
├──────────────────────────────────────┤
│  Based on your six answers. This is a │  text-body, text-muted
│  best guess, not an identification.    │
│                                        │
│ ╔════════════════════════════════════╗│
│ ║ Likely Vermilion Rockfish          ║│  text-h2 (26px), text-primary
│ ║ 82% match                          ║│  text-h3, text-primary
│ ║ ████████████████░░░░               ║│  confidence bar, see below
│ ║ ┌────────────────────────────────┐ ║│
│ ║ │ ✓  KEEP · 1 per day · 12 in    │ ║│  the verdict, inline, 56px
│ ║ └────────────────────────────────┘ ║│
│ ╚════════════════════════════════════╝│  surface-raised card, border-interactive
│                                        │
│  OTHER POSSIBILITIES                   │  text-caption, tracking-station
│  ┌────────────────────────────────┐  │
│  │ Possibly Canary Rockfish  61%  │  │  76px rows
│  │ [RELEASE] Closed until 1 Oct    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Possibly Yelloweye        38%  │  │
│  │ [RELEASE] Zero retention        │  │
│  └────────────────────────────────┘  │
│                                        │
│ ▌If any fish it could be must be       │  status-unverified rail
│ ▌released, release it.                 │  text-body, text-primary
│                                        │
│  ┌────────────────────────────────┐  │
│  │ Compare two of these           │  │  56px secondary
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Change my answers              │  │  56px secondary
│  └────────────────────────────────┘  │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃    See the rules for Vermilion    ┃ │  68px primary → §4.4
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└──────────────────────────────────────┘
```

**Confidence language is bound to the number, and the app never claims certainty:**

| Score | Prefix | Treatment |
|---|---|---|
| 70–100% | "Likely" | Top card as drawn |
| 40–69% | "Possibly" | Same card, no other change |
| Under 40%, or no single candidate above 40% | "Can't tell from these answers" | The top card is replaced by an **UNKNOWN verdict band** (§4.4) and the primary action becomes `Show me all rockfish` |

There is no score at which the copy becomes "This is a…". The word "definitely" does
not exist in this feature (§3.4).

**The safety line is not optional.** Whenever any candidate at or above 20% carries a
RELEASE verdict, the `status-unverified`-railed line appears above the buttons: "If any
fish it could be must be released, release it." This is the bias-to-release rule made
visible at the exact moment it matters.

**Confidence bar:** 16px tall, `radius-full`, track `surface-raised`, fill
`text-link` — deliberately **not** a status colour, because the bar is about our
confidence, not about the law, and mixing the two channels would let a green bar read
as "keep". The percentage is always printed as text beside it; the bar alone never
carries the number.

**Compare two:** tapping `Compare two of these` puts the list into a selection mode —
each row gains a 48px checkbox with the visible word "Compare", the primary action
becomes `Compare these two` and is disabled with the reason "Pick two fish" until
exactly two are chosen.

```
┌──────────────────────────────────────┐
│  ‹ Back           Compare             │
├──────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  │
│  │  ▓▓▓▓▓▓▓▓▓▓  │  │  ▓▓▓▓▓▓▓▓▓▓  │  │  132px images, side by side
│  │  Vermilion   │  │  Canary      │  │  text-body-strong
│  │  [KEEP]      │  │  [RELEASE]   │  │  pills, 24px
│  └──────────────┘  └──────────────┘  │
│                                        │
│  BODY COLOUR                           │  full-width trait label,
│  ┌──────────────┐  ┌──────────────┐  │  text-caption, tracking-station
│  │ Deep red all │  │ Yellow-orange│  │  text-body, 138px columns
│  │ over         │  │ mottled      │  │
│  └──────────────┘  └──────────────┘  │
│                                        │
│  THE TELL                              │
│  ┌──────────────┐  ┌──────────────┐  │
│  │ Black edge   │  │ Three pale   │  │  the single distinguishing trait,
│  │ on the fins  │  │ stripes      │  │  status-restricted text, first section
│  └──────────────┘  └──────────────┘  │  after the header
│                                        │
│  FINS / SPOTS / JAW / SIZE …           │  same pattern, one trait per block
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃    It is the one on the left      ┃ │  68px → that species' §4.4 card
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│  ┌────────────────────────────────┐  │
│  │ It is the one on the right     │  │  68px, secondary, 12px below
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Why trait-label-above rather than a three-column table:** at 320px a label rail plus
two data columns leaves ~85px per column, which cannot hold 18px text without wrapping
every cell to four lines. A full-width label with two 138px columns beneath it holds
the alignment on both axes, keeps the type at 18px, and reads top-to-bottom the way a
person actually compares two things.

**"THE TELL" is always the first trait block** and is always rendered in
`status-restricted` — it is the one difference that decides it, and burying it in
alphabetical trait order would be a design failure with a citation attached.

If the two species carry different verdicts, a `status-unverified`-railed line sits
directly under the header: "These two have different rules. If you cannot tell them
apart, release it."

### 4.7 Boundary and depth map

```
┌──────────────────────────────────────┐
│  ‹ Rules      Where you can fish      │
├──────────────────────────────────────┤
│ ╔════════════════════════════════════╗│  THE RULE BANNER — above the map,
│ ║ ✓ INSHORE FISHING ONLY             ║│  never on top of it
│ ║ You are inside the permitted area. ║│  text-h3 + text-body
│ ╚════════════════════════════════════╝│  status-keep-fill / status-keep border
│                                        │
│ ┌──────────────────────────────────┐ │
│ │                                   │ │
│ │            ⊙ YOU ARE HERE         │ │  map, min height 320px, flexes to fill
│ │                                   │ │
│ │                     ┌──────────┐  │ │
│ │                     │ Recenter │  │ │  48px, docked bottom-right of the map,
│ │                     └──────────┘  │ │  space-3 from the map edges
│ └──────────────────────────────────┘ │
│  ┌────────────────────────────────┐  │
│  │ What is on this map (3)        │  │  56px → the overlay sheet
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Show this as words             │  │  56px → the text fallback
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**The banner is above the map, not overlaid on it.** A banner floating over tiles
fights a background it cannot control and loses in glare. Its geometry is the verdict
band's (§4.4) at a smaller headline (`text-h3`, 22px, not `text-display`), because it
is a location verdict, not a fish verdict, and must not out-shout the one the angler is
about to read on the card.

Banner states:

| Condition | Fill / border | Headline | Sentence |
|---|---|---|---|
| Inside permitted area | `status-keep-fill` / `status-keep` | `INSHORE FISHING ONLY` | "You are inside the permitted area." |
| Conditions apply here | `status-restricted-fill` / `status-restricted` | `DEPTH LIMIT — 300 FT` | "You are in 240 ft. Do not fish deeper than 300 ft here." |
| Within 0.5 nm of a restricted boundary | `status-unverified-fill` / `status-unverified` | `APPROACHING A BOUNDARY` | "Cowcod Area A is 0.4 nm south of you." |
| Inside a restricted area | `status-release-fill` / `status-release` + 8px rail | `YOU ARE IN A CLOSED AREA` | "No take of any species inside Point Vicente SMCA." |
| Position unknown | `status-unknown-fill` / `status-unknown` | `WE DO NOT KNOW WHERE YOU ARE` | "Pick your area to see the boundaries." + 48px `Pick my area` |

**"YOU ARE HERE" marker:** a 20px `text-primary` dot with a 3px `background` ring
around it (so it survives any tile colour underneath), a `text-link` accuracy circle at
the reported GPS accuracy radius, and the words "YOU ARE HERE" in `text-caption` on a
`surface` chip with `hairline` border directly above it. The label is not
zoom-dependent and never disappears.

**Overlays.** Five, all off-by-default except Regulations, toggled from a bottom sheet
(`04-components.md` §Modal/Sheet). Each overlay reuses the meaning of its colour from
§2 so the map and the card never disagree, and each carries a distinct line style so it
survives a greyscale render:

| Overlay | Colour | Line style | Legend words |
|---|---|---|---|
| Regulations area | `border-interactive` | Solid 2px, no fill | "The area whose rules you are reading" |
| Groundfish boundary | `status-restricted` | Dashed 3px, 10% fill | "Conditions apply past this line" |
| Protected areas (MPA) | `status-release` | Solid 3px, 20% fill, hatched | "No take — do not fish here" |
| Catch history | `text-primary` | 8px dots | "Where you have caught fish" |
| Fishing spots | `signal-orange` | 12px pins | "Spots you saved" — the only tappable overlay |

Sheet rows: 56px, `space-3` apart, each a labelled toggle with the line-style swatch,
the plain-English legend words, and the layer name. Toggle state is spoken in words
("Showing" / "Hidden"), never by switch position alone.

**Show this as words** — the required offline and low-vision path, and the one that
makes the map non-essential:

```
│  WHERE YOU ARE                         │
│  33.9412° N, 118.4732° W               │  font-mono, text-body
│  Santa Monica Bay · Groundfish South   │
│                                        │
│  ✓ You are inside the permitted area.  │  status-keep
│  ⚠ Depth limit here: 300 ft.           │  status-restricted
│  ↺ Nearest closed area: Point Vicente  │  status-release
│    SMCA, 1.8 nm south-east.            │
```

Every fact the map draws is available here as a sentence. If map tiles are not
downloaded, this screen **opens straight into the words view** with a line at the top —
"No map for this area on your phone. Here it is in words." plus a 48px
`Download the map` button — rather than showing an empty grey grid.

**Loading:** the banner resolves first and independently; the map area shows
"Loading the map…" with the 44px spinner. The banner never waits on tiles — the legal
answer is not allowed to be gated on cartography.

### 4.8 Protected-area warning

Three levels, and none of them is a modal. A modal that appears while somebody is
running a boat is a hazard, not a safeguard.

**Inside an MPA** — a full-width band, pinned directly under the top bar, on **every**
screen in the app, not just Rules:

```
┌──────────────────────────────────────┐
│  Log                                  │
├──────────────────────────────────────┤
│ ▌↺ YOU ARE IN A CLOSED AREA           │  status-release-fill, 8px status-release
│ ▌Point Vicente SMCA — no take of any  │  rail, headline text-h3 status-release,
│ ▌species here.                        │  sentence text-body text-primary
│ ▌ ┌───────────────────────────────┐  │
│ ▌ │ Show me on the map            │  │  48px secondary → §4.7
│ ▌ └───────────────────────────────┘  │
├──────────────────────────────────────┤
```

- It does not block anything. Logging still works — a fish caught inside an MPA is a
  thing that happened and the app does not refuse to record reality.
- The regulation card for any species, while this band is showing, renders **RELEASE**
  regardless of the species' own limits, with the sentence "You are in a closed area.
  This one goes back." The area rule overrides the species rule, always.
- It is not dismissible while the condition holds. It clears itself when the angler
  leaves, and clearing it fires a `success-green` toast: "You are out of the closed
  area." (`04-components.md` §Toast, 6 seconds, no tap needed.)

**Approaching (within 0.5 nm and closing):** same band geometry,
`status-unverified-fill` / `status-unverified` rail, headline `APPROACHING A CLOSED
AREA`, sentence "Point Vicente SMCA is 0.4 nm ahead." This one **is** dismissible for
the current trip via a 48px `Got it` button, because an angler working a legal edge
will see it repeatedly and a nag they cannot silence is a nag they learn to ignore.

**Outside:** no band. Nothing. The chrome does not accumulate reassurance.

**Position unknown:** no MPA band at all — instead the location card (§4.2) carries its
own unknown state. We never say "you are not in a closed area" when we do not know
where the angler is. Silence about a fact we do not have beats a false all-clear.

**Out of my lane, needs head-dev / architect:** the band must render above every route,
which means a shell slot and a client-side geofence subscription. That is shell and
data work, not front-end feature work, and it is the one dependency in this document
that cannot be built inside `src/features/regulations/`.

### 4.9 Offline region downloads

```
┌──────────────────────────────────────┐
│  ‹ Rules      Offline Downloads       │
├──────────────────────────────────────┤
│  Rules, maps and fish photos saved on  │  text-body
│  this phone work with no signal.       │
│  Using 84 MB of your phone's storage.  │  text-caption, text-muted
│                                        │
│  ON THIS PHONE                         │  text-caption, tracking-station
│  ┌────────────────────────────────┐  │
│  │ Santa Monica Bay               │  │  96px row
│  │ 42 MB · saved 3 days ago       │  │  text-caption, text-muted
│  │        ┌──────────┐ ┌────────┐ │  │
│  │        │  Remove  │ │ Update │ │  │  48px each, 12px apart
│  │        └──────────┘ └────────┘ │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ▌Channel Islands               │  │  status-unverified 8px rail
│  │ ▌42 MB · saved 61 days ago     │  │
│  │ ▌Update available — new season │  │  status-unverified, text-body
│  │ ▌dates.                        │  │
│  │ ▌      ┌──────────┐ ┌────────┐ │  │
│  │ ▌      │  Remove  │ │ Update │ │  │
│  │ ▌      └──────────┘ └────────┘ │  │
│  └────────────────────────────────┘  │
│                                        │
│  AVAILABLE                             │
│  ┌────────────────────────────────┐  │
│  │ Monterey Bay                   │  │
│  │ 38 MB                          │  │
│  │                     ┌────────┐ │  │
│  │                     │Download│ │  │  48px
│  │                     └────────┘ │  │
│  └────────────────────────────────┘  │
├──────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃    Update everything (1 ready)    ┃ │  68px primary
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└──────────────────────────────────────┘
```

Row states — one row geometry, 96px min, five states:

| State | Row shows | Buttons |
|---|---|---|
| Available | Name, size | `Download` 48px |
| Downloading | Name, "Downloading — 40% of 38 MB", `radius-full` progress track (`surface-raised` track, `signal-orange` fill, 8px tall) | `Stop` 48px |
| Saved | Name, "42 MB · saved 3 days ago" | `Remove`, `Update` |
| Update available | `status-unverified` rail + "Update available — new season dates." | `Remove`, `Update` |
| Failed | `status-release` rail + "The download stopped. You have most of it — tap Finish to get the rest." | `Remove`, `Finish` |

- **The failure copy names the next action**, per the house rule. Never "Download
  failed", never a code, never a retry button with no explanation.
- **Remove** uses undo, not confirmation: the row collapses, a toast says "Removed
  Monterey Bay · Undo" for 6 seconds (`04-components.md` §Toast). No "Are you sure?".
- **No signal:** `Download` and `Update` are disabled at 45% opacity with the reason
  line directly above the button group — "No internet right now. Downloads will start
  when you have signal." — never a silently greyed button.
- **Storage full:** a `status-release`-railed line above the list, "Your phone is out of
  space. Remove a region you are not fishing." No modal.
- **Empty (nothing downloaded):** the ON THIS PHONE section is replaced with one card —
  "Nothing saved yet. Download the area you fish and the rules will work with no
  signal, which is most of the time on the water." — and the primary action becomes
  `Download Santa Monica Bay` (the area GPS already resolved), 68px.

### 4.10 The regulation card inside the Log Fish flow

The zero-tap path, and the reason the nav decision in §1 does not have to carry the
whole feature.

The moment a species is chosen in Quick Log, a **regulation strip** appears between the
form and the docked `Save` button. It never covers `Save`
(`04-components.md` §Modal/Sheet's hard rule applies here too), it never blocks, and it
never delays the write.

```
┌──────────────────────────────────────┐
│  ‹ Back        Log a catch            │
├──────────────────────────────────────┤
│  [ species / rig / spot form ]        │
│                                        │
├──────────────────────────────────────┤
│ ╔════════════════════════════════════╗│  THE STRIP — 88px min
│ ║ ↺ RELEASE   Copper Rockfish        ║│  glyph + text-h3 status-release
│ ║ Closed until 1 October.            ║│  text-body text-primary
│ ║ ┌──────────────┐ ┌──────────────┐ ║│
│ ║ │ I released it│ │ See the rules│ ║│  48px chip + 48px secondary,
│ ║ └──────────────┘ └──────────────┘ ║│  space-3 apart
│ ╚════════════════════════════════════╝│  status-release-fill + 8px rail
│                                        │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃              Save                 ┃ │  68px, never covered, never disabled
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │  by anything in this strip
└──────────────────────────────────────┘
```

Rules for the strip, all of them non-negotiable:

- **It never prevents a save.** A catch is a record of what happened. If the app refused
  to log a fish it believes is closed, the angler would stop logging, and we would lose
  the data and teach them the app argues with them.
- **`I released it` is offered, never applied.** It is a 48px chip that sets the catch's
  outcome to released when tapped. The app does not silently write an outcome the
  angler did not state — that would manufacture data, which `09-fish-log.md` rules out.
- **KEEP renders quietly.** `status-keep-fill`, headline `KEEP`, one line
  ("1 per day, 12 in minimum."), and **no buttons except `See the rules`** — a permitted
  fish should cost the angler zero attention.
- **UNKNOWN and unverified render fully**, at the same 88px, with the UNKNOWN sentence
  and the `I released it` chip present. The uncertain case is never the quiet one.
- **Offline / no downloaded region:** the strip renders the UNKNOWN band with "No rules
  for this area on your phone. We cannot tell you if this one is legal." and a 48px
  `Download this area` button that queues for the next signal. It never renders blank
  and it never renders KEEP.
- **Species not yet chosen, or free-text "Something else":** no strip at all. An empty
  strip reserving vertical space above `Save` is worse than no strip.

---

## 5. States that every surface in this feature must ship

Not follow-ups. Part of the feature, per the house rule.

| State | Rule |
|---|---|
| **Loading** | Honest label plus the 44px spinner (`04-components.md` §Loading). No skeletons — a skeleton promises a shape and a speed we cannot deliver on a boat. The verdict band never shows a skeleton; it shows UNKNOWN until it has a real answer. |
| **Empty** | Every empty state teaches and carries the one action that fills it. Written out per surface in §4.1, §4.3, §4.7, §4.9. |
| **Offline** | The normal state, not an error. Everything in this feature works from the downloaded region. Missing region = UNKNOWN verdict + a download action, never a blank and never a guess. |
| **Error** | A sentence with a next action, `error-red` at `text-body` or larger. Never a code. The only genuine errors in this feature are download failures (§4.9) and a corrupt region file ("The saved rules for this area are damaged. Remove and download it again."). |
| **Stale** | §3.3, on every surface, including the Log strip. |
| **Unverified** | §3.2, per record and per field. |
| **Unknown** | §3.1, per field, and as a whole verdict. |

---

## 6. New tokens

Added to `src/core/design/tokens.json` under `color`. Every value repeats under both
`light` and `dark` per the file's `$darkOnlyByDesign` note — this product has no light
theme.

| Token | Value | Aliases | Role |
|---|---|---|---|
| `status-keep` | `#48CE8A` | value of `success-green` | KEEP headline, glyph, band border, pill fill |
| `status-keep-fill` | `#0D2419` | new | KEEP band background |
| `status-restricted` | `#C9B4FF` | new | RESTRICTED headline, glyph, border, pill fill, "THE TELL" |
| `status-restricted-fill` | `#241A3B` | new | RESTRICTED band background |
| `status-release` | `#FF8A80` | value of `error-red` | RELEASE headline, glyph, border, 8px rail, pill fill |
| `status-release-fill` | `#3E1210` | new | RELEASE band background |
| `status-unknown` | `#C2CFD7` | new | UNKNOWN headline, glyph, border, unknown field values |
| `status-unknown-fill` | `#1B242B` | new | UNKNOWN band background |
| `status-unverified` | `#E8B55F` | value of `amber-flag` | Unverified rail, staleness banner rail, approaching-boundary banner |
| `status-unverified-fill` | `#32240D` | new | Staleness and approaching-boundary banner background |
| `ink-on-status` | `#06090B` | new | Label on a bright status fill (the small pills) |

### 6.1 Contrast, computed with the WCAG relative-luminance formula

Not eyeballed, per `06-accessibility-baseline.md` §1.

| Foreground | Background | Ratio | Grade | Use |
|---|---|---|---|---|
| `status-keep` | `background` | **9.54:1** | AAA | KEEP text on the page |
| `status-keep` | `surface` | **8.77:1** | AAA | KEEP text on a card |
| `status-keep` | `status-keep-fill` | **8.16:1** | AAA | KEEP headline and glyph in the band |
| `text-primary` | `status-keep-fill` | **14.74:1** | AAA | KEEP band sentence |
| `status-restricted` | `background` | **10.44:1** | AAA | RESTRICTED text on the page |
| `status-restricted` | `surface` | **9.59:1** | AAA | RESTRICTED text on a card |
| `status-restricted` | `status-restricted-fill` | **8.91:1** | AAA | RESTRICTED headline and glyph |
| `text-primary` | `status-restricted-fill` | **14.71:1** | AAA | RESTRICTED band sentence |
| `status-release` | `background` | **8.38:1** | AAA | RELEASE text on the page |
| `status-release` | `surface` | **7.70:1** | AAA | RELEASE text on a card |
| `status-release` | `status-release-fill` | **7.08:1** | AAA | RELEASE headline, glyph, rail |
| `text-primary` | `status-release-fill` | **14.57:1** | AAA | RELEASE band sentence |
| `status-unknown` | `background` | **12.03:1** | AAA | UNKNOWN text, unknown field values |
| `status-unknown` | `surface` | **11.05:1** | AAA | Unknown value inside a fact cell |
| `status-unknown` | `status-unknown-fill` | **9.90:1** | AAA | UNKNOWN headline and glyph |
| `text-primary` | `status-unknown-fill` | **14.18:1** | AAA | UNKNOWN band sentence |
| `status-unverified` | `background` | **10.21:1** | AAA | Unverified line on the page |
| `status-unverified` | `surface` | **9.38:1** | AAA | Unverified line on a card |
| `status-unverified` | `status-unverified-fill` | **8.04:1** | AAA | Staleness banner rail and headline |
| `text-primary` | `status-unverified-fill` | **13.57:1** | AAA | Staleness banner sentence |
| `ink-on-status` | `status-keep` | **9.96:1** | AAA | KEEP pill label |
| `ink-on-status` | `status-restricted` | **10.89:1** | AAA | RESTRICTED pill label |
| `ink-on-status` | `status-release` | **8.75:1** | AAA | RELEASE pill label |
| `ink-on-status` | `status-unknown` | **12.55:1** | AAA | UNKNOWN pill label |
| `ink-on-status` | `status-unverified` | **10.66:1** | AAA | Unverified pill label |

Every pair clears AAA (7:1). The band borders clear the 3:1 non-text floor several
times over — `status-keep` against `status-keep-fill` is 8.16:1, the tightest of the
four, and the fills against `background` sit at 1.08–1.38:1, i.e. the fill reads as a
tint of the page rather than as a second surface competing with `surface`.

**The one thing that is forbidden rather than measured:** `text-muted` on any
`status-*-fill` computes to 5.55–6.03:1, under the system floor. Secondary text inside a
status fill is `text-primary`. There is no exception.

### 6.2 An amendment `02-semantic-colors.md` needs, which I did not make

That file states amber-flag "appears in exactly three places." This feature adds a
fourth — the unverified/staleness rail. The promise it actually makes ("amber = something
needs me") holds perfectly: a regulation nobody has checked is precisely something that
needs the angler. But the sentence is now literally false and should read "four places."
That file is outside this lane. **Flagged to whoever owns `docs/design/02`.**

### 6.3 No new spacing, radius, type, or touch tokens

Everything in this document composes from the existing scales. The verdict band is
padding-driven (`space-5`) rather than fixed-height so it grows with OS text size; the
wizard answer tile reuses `touch-primary-quick-mark` (88px); the fact cells reuse
`radius-lg` and `space-4`. Adding a one-off size token for a single component is how a
scale rots.

---

## 7. Deliberately left to engineering

Named here so nobody has to ask.

1. **How Leaflet paths get their colours.** Leaflet sets `stroke`/`fill` as SVG
   presentation attributes, which do not accept `var()`, and a raw hex in a `.tsx` file
   fails the tripwire — correctly. The fix is Leaflet's `className` path option plus
   CSS `stroke`/`fill` rules that read the tokens, or reading the computed custom
   property once at mount. **Head-dev's call.** The design constraint is only that the
   five overlay colours are the tokens named in §4.7 and are never duplicated as
   literals.
2. **The verdict downgrade lives in the data layer, not the component.** §3.2's table
   and §4.4's "an unknown fact cannot coexist with KEEP" rule must be computed where
   the regulation record is resolved, so that every consumer — card, list pill, Log
   strip, map banner — gets the same already-downgraded verdict. A component that
   re-derives it will drift. **Architect's call** on where that lives.
3. **Geofence subscription and the app-wide MPA band** (§4.8) need a shell slot and a
   position stream. Shell and data work, outside this feature's directory.
4. **Reference-image sourcing, licensing, and size budget** for the rockfish key
   (§4.5, §4.6). The design only requires that the label is always sufficient without
   the image, so a smaller or later image set costs nothing structurally.
5. **The confidence scoring function** behind "82%" (§4.6). The design fixes the
   language bands (70 / 40) and forbids certainty language; the maths is not mine.
6. **Whether "Not sure" answers should be weighted or merely unconstraining.** Spec'd
   as unconstraining (keeps all candidates for that trait). If the biostatistician wants
   a soft prior instead, the UI does not change.

---

## 8. Definition of done for this feature

`06-accessibility-baseline.md` §6's six checks, plus four this feature adds:

7. **Greyscale check.** Render every verdict band and every list pill with the colour
   channel removed. The state must still be readable from the word and the glyph. If a
   screenshot in greyscale cannot answer "keep or release", it is not done.
8. **The three-values check.** "No limit", "Unknown", and "Zero retention" rendered on
   one screen, side by side. If a stranger cannot tell them apart in two seconds, §3.1
   has been violated.
9. **The RESTRICTED/RELEASE pair check.** Both bands, side by side, in greyscale, at
   arm's length. Four separating channels (§2.6), at least two surviving.
10. **The offline cold-start check.** Airplane mode, no downloaded region, walk every
    surface. Nothing renders KEEP. Nothing renders blank. Every dead end carries the
    action that fixes it.
