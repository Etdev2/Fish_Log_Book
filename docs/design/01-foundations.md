# 01 — Visual Foundations

See `README.md` for the persona this all tests against. Every token named below is also machine-readable in `tokens.json` (the proposed contents of `src/core/design/tokens.json` per `docs/architecture/decisions/005-front-end-architecture.md` #2) — this file is the reasoning, `tokens.json` is the value head-dev consumes. All contrast ratios below were
computed with the standard WCAG relative-luminance formula, not eyeballed — the script
is disposable but the numbers are exact.

## 1. Color

### 1.1 Base palette (extends, does not discard, the existing marine palette)

The dark marine palette already in use (`background #0A1014`, `surface #121A20`,
signal orange, tide cyan, moon pale) is the right starting point for this product: dark
UI is the correct default for a screen used before dawn and in direct glare alike — a
bright white UI is unreadable in full sun (a phone screen loses most of its dynamic
range to reflected light, and a light UI has none left to lose) and is punishing before
dawn. Everything below extends that palette with the neutrals and status colors it was
missing.

| Name | Hex | Role |
|---|---|---|
| `background` | `#0A1014` | App background, the deepest layer |
| `surface` | `#121A20` | Cards, panels, the calendar grid, sheets' resting state |
| `surface-raised` | `#172229` | Modals, the active/open state of a card, popovers |
| `hairline` | `#26333C` | Decorative dividers only — see §4, this is NOT a meaningful border |
| `border-interactive` | `#61747E` | Input, select, and unfilled-button borders — meets 3:1 |
| `text-primary` | `#EEF4F7` | Default body and heading text |
| `text-muted` | `#8CA0AC` | Secondary text, timestamps, helper text, labels |
| `text-link` | `#C3D2DA` | Nav links, non-primary tappable text |
| `signal-orange` | `#FF7A18` | The one interactive/primary color in the app |
| `signal-orange-pressed` | `#FF9D57` | Pressed/active state of orange, and orange text-on-dark contexts |
| `ink-on-orange` | `#140800` | Text/icons placed on an orange fill |
| `tide-cyan` | `#3FC7E0` | Reserved exclusively for tide data and the focus ring — see `02-semantic-colors.md` |
| `moon-pale` | `#E8D9A8` | Reserved exclusively for moon-phase data |
| `amber-flag` | `#E8B55F` | The one "needs attention" color — unresolved marks, open trips (D22/D27) |
| `success-green` | `#48CE8A` | Confirmed/complete state (e.g. sync indicator), never used for "good catch" |
| `error-red` | `#FF8A80` | Error text, destructive text/icons, validation messages |
| `error-red-fill` | `#C1443A` | Destructive button fill (rare — see `04-components.md`) |

### 1.2 Contrast ratios — every foreground/background pair this system uses

Target: **AAA for body text (7:1) wherever the pair carries running text**, because the
reading conditions (bright glare, reading glasses left in the truck) are worse than a
typical AA use case assumes. AA (4.5:1 text, 3:1 large text/icons/borders) is the floor
for anything decorative-adjacent; nothing in the system is allowed to fall below AA.

| Foreground | Background | Ratio | Grade | Use |
|---|---|---|---|---|
| `text-primary` | `background` | **17.24:1** | AAA | Default body text |
| `text-primary` | `surface` | **15.84:1** | AAA | Body text on cards |
| `text-primary` | `surface-raised` | **14.58:1** | AAA | Body text in modals/sheets |
| `text-muted` | `background` | **7.05:1** | AAA | Helper text, timestamps |
| `text-muted` | `surface` | **6.48:1** | AA (fails AAA by 0.5) | Helper text on cards — see note below |
| `text-link` | `background` | **12.35:1** | AAA | Nav and inline links |
| `text-link` | `surface` | **11.35:1** | AAA | Links on cards |
| `signal-orange` | `background` | **7.34:1** | AAA | Orange text/icons on background |
| `signal-orange` | `surface` | **6.74:1** | AA (large text/icons only) | Orange text/icons on cards |
| `signal-orange-pressed` | `background` | **9.31:1** | AAA | — |
| `ink-on-orange` | `signal-orange` | **7.56:1** | AAA | Primary button label |
| `ink-on-orange` | `signal-orange-pressed` | **9.59:1** | AAA | Primary button label, pressed |
| `tide-cyan` | `background` | **9.53:1** | AAA | Tide readouts |
| `tide-cyan` | `surface` | **8.76:1** | AAA | Tide readouts on cards |
| `moon-pale` | `background` | **13.60:1** | AAA | Moon readouts |
| `moon-pale` | `surface` | **12.49:1** | AAA | Moon readouts on cards |
| `amber-flag` | `background` | **10.21:1** | AAA | Flag icon + "needs a look" text |
| `amber-flag` | `surface` | **9.38:1** | AAA | Flag on cards |
| `success-green` | `background` | **9.54:1** | AAA | Sync/confirmation state |
| `error-red` | `background` | **8.38:1** | AAA | Error text |
| `error-red` | `surface` | **7.72:1** | AAA | Error text on cards |
| `text-primary` | `error-red-fill` | **4.55:1** | AAA-large / AA-normal | Destructive button label (large bold text only) |
| `border-interactive` | `background` | **3.93:1** | AA (non-text floor) | Input/select outline |
| `border-interactive` | `surface` | **3.61:1** | AA (non-text floor) | Input/select outline on cards |
| `hairline` | `background` | **1.48:1** | Below AA — decorative only | Dividers, never meaningful |

**Note on `text-muted` on `surface` (6.48:1):** this is the one pair in the system that
misses the AAA target, by half a point, on the single most common "secondary text on a
card" combination. Rather than push the color further off-neutral to force AAA (which
would drift `text-muted` toward looking like a status color), the rule going forward is:
**`text-muted` on `surface` is fine for timestamps, labels, and helper copy that is
never the only carrier of required information; it is never used for text a decision
depends on** (error messages, the flag state, anything in `error-red` or `amber-flag`
instead). Those all clear AAA on their own.

**`hairline` is stated at 1.48:1 deliberately** — it is a decorative section divider
(the line under the header, the rule between two menu rows) and WCAG's 3:1 non-text
floor applies to borders that carry meaning (an input's boundary, a focus indicator), not
to plain dividers. Nothing in this system relies on `hairline` alone to communicate a
state; anywhere a border needs to mean something, `border-interactive` (3.6–3.9:1) is
used instead.

### 1.3 Color is never the only signal

Every status in this system (see `02-semantic-colors.md`) pairs its color with a shape
or a word: the amber flag is an outline flag icon *and* the words "needs a look," never
amber alone; the calendar dot is round and identical regardless of catch count; errors
are always a sentence, never a red border with no text. This is required twice over —
for the roughly 1 in 12 men over sixty with some degree of color vision deficiency, and
for anyone squinting at a washed-out screen in full sun where hue is the first thing
glare destroys and shape is the last.

## 2. Type scale

**Base body size: 18px. This is a floor, not a default that can be tuned down for
"dense" screens — nothing in this app ever renders body text below 18px, and nothing
renders any text, including captions, timestamps, and legends, below 16px.**

### 2.1 Why 18px, specifically

The web-standard "16px is fine" guidance assumes a reader at a comfortable, stable
reading distance with corrected vision available. This product's reader is often 65–75
years old — presbyopia (the age-related loss of near-focus that reading glasses correct
for) is functionally universal by that age — and the reading glasses that would correct
for it are, per the brief, "in a bag somewhere," i.e. not on their face. On top of that,
the phone is at arm's length, not the ~35cm comfortable reading distance UI guidance
usually assumes, and it is being read on a moving boat and in glare that reduces
effective contrast. Each of those alone would argue for larger type; stacked, 16px is
not defensible. 18px is the smallest size that stays legible through all three
degradations at once without inflating every screen to the point that a phone shows two
lines of information. This is not a stylistic choice — it is the same reasoning that
led WCAG to treat 18pt (24px) as its own "large text" threshold; we are one step below
that threshold as our *minimum*, not our target, for exactly this reader.

### 2.2 The scale

Scale ratio ~1.25 (a "major third," rounded to whole pixels so nothing lands on a
fraction), anchored at the 18px floor:

| Token | Size | Line-height | Weight | Use |
|---|---|---|---|---|
| `text-caption` | 16px | 1.4 | 500 | Timestamps, legends, mono data labels, the *only* place below body — never smaller, never used for anything the user must act on |
| `text-body` | 18px | 1.55 | 400 | Default paragraph and UI text — the floor |
| `text-body-strong` | 18px | 1.55 | 700 | Emphasized body text, list item titles |
| `text-label` | 18px | 1.3 | 700 | Form labels, button labels, chip labels |
| `text-h3` | 22px | 1.25 | 700 | Card headings, sheet titles |
| `text-h2` | 26px | 1.2 | 800 | Section headings, day-page date |
| `text-h1` | 32px | 1.1 | 800 | Screen titles ("Notebook," "Needs a Look") |
| `text-display` | 40px | 1.05 | 800 | The rare hero number — a trip timer, a big count |

No token below `text-caption` exists. If a future screen wants something smaller — a
copyright line, a version number — it still uses `text-caption` at 16px; there is no
escape hatch, because the rule in `CLAUDE.md`/house style ("never below 16px, ever,
including captions") is absolute, not a guideline to be balanced against layout density.

### 2.3 Weight and family — open question, see README

**This is not settled by this document.** The eight `screens/` mockups set UI text in
**Archivo** and tabular/numeric readouts in **IBM Plex Mono**; the shipped app
(`src/app/layout.tsx`) currently loads **Geist Sans / Geist Mono**. The two disagree,
this document does not have write access to `src/` to resolve it unilaterally, and it
affects already-shipped code — so it is stated here as an open question with a
recommendation, not silently decided. Full reasoning, the cost of each option, and the
recommendation (Archivo + IBM Plex Mono) are in `README.md` under "Open question: type
family." Whichever family ships, the role split below holds:

- **UI text family** (Archivo, pending the open question above) — all prose, labels,
  headings, button text.
- **Mono family** (IBM Plex Mono, pending the open question above) — reserved for
  genuinely tabular/numeric readouts (timestamps, coordinates, the trip timer, tide
  percentage) where fixed-width digits prevent numbers from jittering as they update —
  never for prose, never for button labels, because mono at small sizes reads as
  "technical/system," not as an inviting tap target for this audience.

The numeric type scale in §2.2 (sizes, line-heights, weights) is unaffected by this
question — only the `font-family` value changes depending on how it's resolved.

## 3. Spacing scale

Base unit 4px, values chosen so every gap that separates two tappable things can hit
the 12px interactive-spacing floor (`03-touch-and-interaction.md`) without rounding:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px — the interactive-spacing floor |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px — the touch-target floor, reused as a spacing value on purpose |
| `space-16` | 64px |

Screen edge padding at the narrowest supported width (320px) is `space-4` (16px) per
side, leaving 288px of usable width — enough for a single-column card and a 56px
primary button with room either side to avoid edge mis-taps from a thumb that overhangs
the phone's bezel.

## 4. Corner, elevation, and border language

### 4.1 Corner radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Chips, badges, the status pill |
| `radius-md` | 12px | Buttons, inputs, selects |
| `radius-lg` | 16px | Cards, the calendar day cell |
| `radius-xl` | 20px | Modals, dialogs |
| `radius-full` | 999px | The primary "quick mark" button, toasts, the progress track |

### 4.2 Elevation

This is a dark-on-dark UI on a screen fighting glare, so elevation is communicated by
**layered fill + border, not drop shadow** for anything resting in the normal flow —
shadows wash out to nothing in direct sun and cost contrast for no legible gain. Only
things that float *over* other content (modals, sheets, toasts) get a shadow, because
their job is to visually separate from a busy background behind them, not from a flat
page:

| Level | Treatment | Use |
|---|---|---|
| `flat` | `background`, no border | The page itself |
| `resting` | `surface` fill, 1px `hairline` border | Cards, the calendar grid, list rows |
| `raised` | `surface-raised` fill, 1px `border-interactive` border | Open/active card state, the rig strip when expanded |
| `floating` | `surface-raised` fill, 1px `border-interactive` border, `0 12px 40px rgb(0 0 0 / 45%)` shadow | Modals, bottom sheets, the toast |

### 4.3 Border language

Two borders, two jobs, never interchangeable:

- **`hairline` (`#26333C`, 1.48:1)** — decorative separation only: the line under the
  header, the rule between rows in a list. Never used where its absence would remove
  information a user needs.
- **`border-interactive` (`#61747E`, 3.6–3.9:1)** — meaningful boundaries: the edge of
  an input, a select, an unfilled/secondary button, the calendar's "today" outline.
  Meets the WCAG 3:1 non-text contrast floor on both `background` and `surface`, so it
  reads in glare where `hairline` would not.
- **Focus ring** — always `tide-cyan` at 3px, offset 2–3px from the element (matches
  the existing `app-nav.module.css` pattern, now formalized). See
  `06-accessibility-baseline.md` §2 for full behavior.
