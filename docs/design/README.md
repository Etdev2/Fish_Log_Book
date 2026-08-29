# Design

`screens/` holds the source for the Fish Log Book screen-flow mockups — one `.dc.html`
file per screen, plus `canvas.json` for their layout. These predate this directory's
written system and are the precedent it formalizes and extends, not a separate body of
work — see "Relationship to the mockups" below.

Published canvas: https://claude.ai/code/artifact/86376b33-ee95-4dcc-959e-7acb95f7d91d

Eight screens, drawn from the decisions in `docs/product/ux-cold-start.md`:

| File | Screen |
|---|---|
| `Main.dc.html` | Home — saltwater, day one |
| `HomeLake.dc.html` | Home — lake / bass mode |
| `ActiveTrip.dc.html` | Active trip |
| `EndTrip.dc.html` | End trip, zero catches — the most important screen |
| `LockScreen.dc.html` | The retroactive check-in notification |
| `BassSheet.dc.html` | Bass post-catch sheet |
| `BiteScore.dc.html` | Bite score below threshold (V2) |
| `Watch.dc.html` | Apple Watch |

These are static mockups, not a prototype.

---

# The written design system (this round's deliverable)

**Status:** foundations, approved scope "design system + app shell first." No product
screens are designed in detail here — that stays with `docs/product/ux-cold-start.md`
and `docs/product/ux-calendar-notebook.md`, and with the mockups above, which this
system formalizes.
**Owner:** `ux-ui`. Reads before writing: `docs/product/SPEC.md` (D22/D23/D26/D27),
`docs/product/ux-cold-start.md`, `docs/product/ux-calendar-notebook.md`, and the eight
mockups in `screens/`.

This is not a style guide for a desktop app that happens to be responsive. Every number
in this directory was chosen against one test, and that test is stated once here so it
does not need repeating on every page:

## The test

**A person in their late sixties, on a boat that is moving, in direct sun or before
dawn, with cold or wet hands, sometimes in gloves, one hand occupied by a rod or a rail
or a fish. Their reading glasses are in a bag they cannot reach. They have maybe one
free thumb and they cannot look at the screen continuously.**

If a design decision would fail that person, it fails, regardless of how it looks on a
laptop at a design review. Where a number below has a specific reason tied to this
person — a font size, a target size, a contrast ratio — the reason is stated next to
the number, not left as an assertion.

## Relationship to the mockups

The eight `screens/*.dc.html` files already chose a visual language — "dark
marine-instrument," their words — and it is the direct ancestor of everything in
`01-foundations.md` through `06-accessibility-baseline.md`. Two things carry forward
unchanged, adopted here as **established precedent, not re-derived**:

- **The marine palette** — `#0A1014` background, `#121A20` surface, `#26333C`
  hairline, `#FF7A18` signal orange, `#3FC7E0` tide-only cyan, `#E8D9A8` moon-only
  pale. `01-foundations.md` extends this palette with the neutrals and status colors
  it was missing and states every pair's contrast ratio; it does not change any of the
  five colors above.
- **Primary touch targets at 68–88px** — well past the 44px/48px floor, "because this
  gets tapped with cold wet hands in glare," in the mockups' own words. This document
  adopts that range as the working precedent for primary actions rather than the
  house-rule minimum (56px) — see `03-touch-and-interaction.md` §1 for the full sizing
  table.

One thing does **not** carry forward silently — see the open question below.

## Open question: type family (Archivo/IBM Plex Mono vs. Geist Sans/Mono)

The mockups are set in **Archivo** (UI) and **IBM Plex Mono** (measurements/readouts).
The shipped app (`src/app/layout.tsx`, live today) loads **Geist Sans / Geist Mono**
via `next/font/google`. These are two different, already-real choices, and this
document does not have the authority to silently pick a winner — it affects
already-shipped code (`src/`) outside this role's write scope, and it is a product
identity call, not a mechanical one — `docs/architecture/decisions/005-front-end-
architecture.md` settled styling, tokens, directories, shell, and state, but did not
touch font family, so this is genuinely still open. Stated plainly as a founder-level
call:

- **Adopt Archivo + IBM Plex Mono app-wide** (match the mockups). *Cost:* one font-
  loading swap in `layout.tsx` (`next/font/google` serves both families, so this is a
  configuration change, not a rewrite) plus updating `font-family` references across
  existing CSS Modules (`app-nav.module.css`, `learning-dashboard.module.css`, and any
  new component styles). *Benefit:* keeps the one visual identity that's already been
  deliberately chosen and justified (a technical, instrument-panel character that suits
  a tide/moon/depth-reading product) instead of inheriting Geist by default because it
  ships with the Next.js starter.
- **Adopt Geist Sans + Geist Mono app-wide** (match the shipped code). *Cost:* re-set
  the eight existing mockups' type, which were drawn and reasoned about in Archivo/Plex
  Mono specifically — a smaller file count to touch, but it abandons a choice that was
  made on purpose ("chosen, not inherited," per the mockups' own README) in favor of
  whatever the framework defaulted to. *Benefit:* zero change to already-shipped code.

**Recommendation: Archivo + IBM Plex Mono.** The mockups' font choice was a deliberate
design decision with a stated rationale; Geist's presence in `layout.tsx` reads as the
Next.js starter default, not a considered choice for this product. The technical cost
of the swap is low — `next/font/google` supports both families as a drop-in — and it is
one config file plus CSS `font-family` references, not a rewrite. **This is a
recommendation, not a decision this document makes unilaterally.** It is left open for
the founder to call; `architect`/`head-dev` execute whichever direction is chosen, and
`tokens.json`'s `fontFamily` block is flagged as a placeholder pending that call.

**Numeric type scale is unaffected either way** — `01-foundations.md` §2's sizes (16px
floor, 18px body floor, the full scale) hold regardless of which family ships; only the
`font-family` value changes.

## What's in this directory

| File | Covers |
|---|---|
| `01-foundations.md` | Color palette + contrast ratios, type scale, spacing scale, corner/elevation/border language |
| `02-semantic-colors.md` | What each color *means* — interactive, destructive, "needs attention," tide, moon, disabled, focus |
| `03-touch-and-interaction.md` | Target sizing (68–88px precedent), thumb-reach zones, why hover is never load-bearing, non-visual confirmation |
| `04-components.md` | Every primitive a V1 screen needs: button, input, select, chip, card, toast, modal/sheet, empty/error/loading states, calendar day cell |
| `05-app-shell.md` | Persistent navigation, where the quick mark lives, behavior at 320px |
| `06-accessibility-baseline.md` | The non-negotiable floors and what "done" means for a future screen |
| `tokens.json` | The proposed contents of `src/core/design/tokens.json` (ADR 005 §2) — head-dev moves this into place, this directory is not the runtime source |
| `screens/` | The eight source mockups this system formalizes (see above) |

## Implementation mechanics — settled elsewhere, linked not restated

`docs/architecture/decisions/005-front-end-architecture.md` resolved every mechanism
question this directory used to defer: Tailwind v4 utility classes are the only styling
convention (CSS Modules are being removed repo-wide); tokens are authored as plain JSON
at `src/core/design/tokens.json` and generated into CSS so a future Swift build can read
the same source; directory placement follows ADR 005 §3; and **V1 ships no component
library, no icon package, and no animation library**, with one bounded exception —
Radix primitives for dialog/popover/select only, and only if a native element cannot be
made focus- and screen-reader-correct. This document does not repeat those decisions —
`04-components.md` calls out, per component, which primitive it assumes and where it
would lean on the Radix exception if native turns out insufficient.

## What this directory does NOT decide

- **The four product screens in detail** (Start Fishing, live trip, End Trip, calendar
  month/day/notebook). Those are specified in the two `docs/product/ux-*.md` files and
  sketched in `screens/`. This system is what those screens get built *out of*.
- **Any V2+ feature**, including the bite score (D12a) — `BiteScore.dc.html` sketches
  its below-threshold state only, and no score renders anywhere in the written system,
  on purpose.

## Inherited, not reopened

The product UX docs and the mockups already settled real interaction law that this
document extends rather than repeats: a touch-target floor of 48px/56px with an
established 68–88px precedent for primary actions, 18px minimum body text, four verbs
on the live surface, the "same dot for a catch and a confirmed zero" rule (D23), one
primary action per screen, undo over confirm. Where a number below matches one already
stated in those sources, it is restated here because this is now the canonical written
source for it — the product docs and mockups remain correct and this directory is where
head-dev should look first when implementing.
