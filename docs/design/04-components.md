# 04 — Core Component Specs

Anatomy, states, sizing, and accessibility behavior for every primitive a V1 screen
needs. No code. Implementation mechanics (styling convention, token pipeline, directory
placement, no component/icon/animation library except the bounded Radix exception for
dialog/popover/select) are settled in
`docs/architecture/decisions/005-front-end-architecture.md` — this file does not
restate that ADR, only the primitives it assumes and where a spec below leans on the
Radix exception are called out inline. All colors/type/spacing reference tokens from
`01-foundations.md`, `02-semantic-colors.md`, and `tokens.json`.

---

## Button

### Variants

- **Primary** — `signal-orange` fill, `ink-on-orange` text, `radius-md` (12px), or
  `radius-full` for the quick-mark button specifically. One per screen, per
  `03-touch-and-interaction.md`.
- **Secondary** — `surface-raised` fill, `border-interactive` outline, `text-primary`
  text. Used for a real but non-primary action (e.g. "Actually, I caught one" on the
  End Trip screen).
- **Text/tertiary** — no fill, no border, `text-link` color, used for `End Trip`'s
  bare-link form and other low-emphasis actions.
- **Destructive** — `error-red-fill` background, `text-primary` label (4.55:1,
  AAA-large). Reserved for the rare explicit destructive confirmation inside the
  "Needs a Look" resolve sheet ("Wrong tap, remove it") — never for a generic
  "delete" scattered elsewhere; deletions elsewhere use the undo-toast pattern instead
  of a distinct destructive button at all.

### Sizing

Per `03-touch-and-interaction.md` §1, primary actions follow the established 68–88px
precedent from the `screens/` mockups, not the bare house-rule floor:

| Context | Height | Min width | Corner |
|---|---|---|---|
| The quick mark / `Log a Catch` (D22 — highest-stakes tap in the app) | 88px | full available width | `radius-full` |
| Other screen-level primary actions (`Start Fishing`, `Write it in`, `End Trip`) | 68px | full available width or 200px, whichever is larger | `radius-md` |
| Secondary / Destructive | 48px | 120px | `radius-md` |
| Text/tertiary | 48px tap area (visual height can be less; padding pads the target) | intrinsic | none |

Label: `text-label` (18px, 700). Icon-plus-label buttons never ship icon-only — every
icon carries its word, per house rule.

### States

- **Default** — as above.
- **Pressed/active** — fill darkens ~12% (or, for outline/text buttons, background
  fills with `surface-raised`) and the element scales to 98% for ≤100ms (respecting
  `prefers-reduced-motion` — see `06-accessibility-baseline.md` §4). Fires on
  `:active`/touchstart, not on hover.
- **Focus-visible** — 3px `tide-cyan` ring, 2–3px offset, always shown for keyboard/
  switch-control focus, never suppressed.
- **Disabled** — 45% opacity, `cursor: not-allowed`, remains in tab order but
  non-activatable, and if it's the screen's primary action, an adjacent
  `text-caption`-or-larger line states why (`02-semantic-colors.md` §Disabled).
- **Loading** — label is replaced by a fixed-size CSS-animated spinner (an inline SVG
  under `src/components/icons/` per ADR 005 §6, rotated with a CSS `@keyframes` rule —
  no animation library) plus the word "Saving…"; button retains its full tap target and stays
  visually in its pressed-adjacent state so a repeat tap while loading doesn't feel
  like nothing happened. Given the offline-first rule (writes are instant to-device),
  loading state on a write button should be rare — it's specified for the cases that do
  round-trip (e.g. auth) so it isn't invented ad hoc later.

### Accessibility

Real `<button>` semantics (or ARIA `role="button"` with full keyboard support if a
non-button element must be used); label text is the accessible name, no reliance on
`aria-label` to add meaning the visible text doesn't already have. Disabled buttons
report their state to assistive tech (`aria-disabled` / native `disabled`) and the
reason text is programmatically associated (`aria-describedby`), not just visually
adjacent.

---

## Input (text)

### Anatomy

Label above field (never placeholder-as-label — a placeholder disappears the moment
text is entered, which fails a reader who looks away mid-thought and comes back).
Optional helper text below. Optional error text below, replacing helper text when
present.

### Sizing

48px min height, `radius-md`, `border-interactive` 1px border, `surface` fill (darker
than the page for legibility of the cursor and typed text), 16px internal padding,
`text-body` (18px) for both label and typed value — an input's text is never smaller
than the 18px floor, including the value the user types.

### States

- **Default** — `border-interactive`.
- **Focused** — border becomes `tide-cyan` at 2px (thicker, not just recolored, so the
  state change doesn't rely on the color shift alone) plus the standard focus ring.
- **Filled** — no visual distinction from default beyond the presence of text; filled
  is not a separate style.
- **Error** — border becomes `error-red`, error sentence appears below in `error-red`
  text at `text-body` size, and the error is announced via `aria-live="polite"` the
  first time it appears (not on every keystroke, to avoid a chatty screen reader while
  typing).
- **Disabled** — 45% opacity, `cursor: not-allowed`.

### Accessibility

`<label for>` bound to the input's `id`. Error text linked via `aria-describedby` and
the input gets `aria-invalid="true"` while an error is showing. Type attributes
(`inputmode="numeric"` etc.) set correctly so mobile keyboards match the expected input
— relevant here because most numeric fields in this app (depth, length) should never
surface a full QWERTY keyboard that eats screen space needed to still see the primary
button.

---

## Select / Chip picker

Per D9 (never type what the phone already knows), most "choice" inputs in this product
are **tap-only chip rows**, not `<select>` dropdowns — species, platform, water color,
lure. A native `<select>` is used only where the option list is long and truly
alphabetic (e.g. a full species list as a fallback search, not the primary picker).
**Implementation primitive:** the native `<select>` element, not a custom listbox —
per ADR 005 §6, `select` is only a candidate for the bounded Radix exception if the
native control turns out not to be stylable enough to hold this system's contrast/
sizing floors, which has not been tested yet.

### Chip anatomy

Pill shape, `radius-full`, `border-interactive` 1px border when unselected,
`signal-orange` fill with `ink-on-orange` text when selected — the only place besides
buttons that uses the interactive color, which is intentional: a selected chip *is* a
committed choice, the same weight of action as a tap on a button.

### Sizing

48px min height (not just visual height — the full pill, including padding, must hit
48px so a chip is never a smaller target than a button), 12px horizontal internal
padding minimum, `text-label` (18px, 700). Chips in a row keep the 12px inter-target
gap from `03-touch-and-interaction.md` §2 — a chip row is not exempt from that rule
just because chips look small; they still need real space between them for cold, wet
fingers.

### States

Default (outline) / Selected (filled orange) / Focus-visible (cyan ring, same as
button) / Disabled (45% opacity — used only if a chip is contextually unavailable, e.g.
a lure that doesn't apply to the selected platform).

### Accessibility

Implemented as a group of toggle buttons (`role="group"` with an accessible group
label, e.g. "Going for?") each with `aria-pressed` reflecting selection state — never a
set of same-styled `<div>`s with only a class-name difference and no programmatic
state.

---

## Card

### Anatomy

`surface` fill, `hairline` 1px border, `radius-lg` (16px), `space-4` (16px) internal
padding minimum, `space-6` (24px) on larger cards holding multiple sections.

### States

Resting (as above) / Open-or-active (`raised` elevation per `01-foundations.md` §4.2:
`surface-raised` fill, `border-interactive` border) — used for the expanded rig strip,
an expanded tide curve. Cards themselves are not typically tappable as a whole unit
(their contents are); if a whole card ever is tappable (e.g. a "Needs a Look" queue
row), it follows Button's pressed/focus states, not a bespoke card interaction.

---

## Toast

### Anatomy

`floating` elevation (§4.2), `radius-full`, docks at the **bottom** of the screen,
above the primary action's resting position but never covering it permanently — it
auto-dismisses. Content: one line of `text-body`, optionally an `Undo` text-button at
48px min tap height even inside the compact toast shape (padding, not shrinking, makes
up the difference).

### Behavior

- Appears on every no-dialog write (quick mark, log a catch, notebook autosave
  acknowledgment — though the notebook itself doesn't need a toast per interaction,
  see `04-components.md` §Autosave indicator below).
- Stays visible **6 seconds** minimum — long enough for a glance that isn't immediate
  — and does not auto-dismiss while a screen-reader or switch-control user has focus
  inside it (the undo action must never be timed-out from under an assistive-tech user).
- Never blocks input to the rest of the screen — it is not a modal, it does not trap
  focus, and `Log a Catch` remains tappable while a previous toast is still showing.
- `aria-live="polite"` region, not `assertive` — it should announce, not interrupt
  screen-reader output the user was already mid-sentence on.

---

## Modal / Sheet

**Implementation primitive:** native `<dialog>` (modal) and a native anchored element
(sheet) are the default per `docs/architecture/decisions/005-front-end-architecture.md`
§6 — no component library ships in V1. Radix's dialog/popover primitives are the one
named, bounded exception in that ADR, and only if a native `<dialog>` cannot be made
focus- and screen-reader-correct for the trapping/return-focus behavior specified
below. That test has not been run yet; this spec assumes native will work and defers
to head-dev to flag it back to `ux-ui`/`architect` if it doesn't.

Two shapes, same underlying spec, different entry point:

- **Modal** — centered, used for a focused decision that must be made before
  continuing (rare in this app by design — most flows use undo instead of a blocking
  modal). `floating` elevation, `radius-xl` (20px), max width 480px, full-width minus
  `space-4` margins below 520px.
- **Sheet** — anchored to the bottom (the rig editor over the live-trip screen per
  `ux-cold-start.md` §5.2), slides up from the bottom edge, rounded top corners only
  (`radius-xl` top-left/top-right, square bottom), and — critically for the rig sheet —
  **never covers the primary action button**, which is a hard layout rule, not a
  styling preference: the sheet's max height leaves the bottom-docked primary button's
  68–88px zone clear at all times (whichever the docked action’s tier is), never just the bare 56px house floor.

### Behavior

Focus moves into the modal/sheet on open and is trapped there until closed (standard
modal a11y); on close, focus returns to the element that opened it. Closed by an
explicit close/back control (min 48px target, top-left or top-right, always labeled,
never an icon-only "×") — swipe-to-dismiss is allowed as an addition but never the only
way to close, per the "nothing important is gesture-only" rule. `Escape` closes it for
keyboard users. Backdrop tap closes it only for non-destructive sheets (never for a
modal presenting an unsaved destructive choice).

---

## Empty state

Never a bare "Nothing here" — every empty state in this app teaches (per house rule and
the pattern already set in `ux-cold-start.md` §2.2). Anatomy: one short sentence of
`text-body` explaining what's normal about the emptiness ("Nothing logged yet. A slow
day counts too."), then the one primary action that fills it, sized per its tier (68–88px, §Button), docked per the
one-primary-action rule. No decorative illustration required — the sentence does the
work an icon would otherwise substitute for, and a decorative-only icon adds nothing a
screen-reader user or a glare-squinting user can act on.

---

## Error state

Full-screen or inline (per context), same rule as input errors: a plain sentence
stating what happened and what to do next, `error-red` text at `text-body` or larger,
never a bare code, never "Something went wrong" without a next step. Given the offline
constraint (D3), the most common "error state" in this app is actually **not an error
at all** — "Saved on your device, will sync when you're back in signal" is a neutral
`text-muted` status line, not styled as an error, because it isn't one; reserving
`error-red` for genuine failures keeps it meaningful when it does appear.

---

## Loading state

Given offline-first writes are instant, loading states are rare and reserved for things
that must round-trip a network (initial tide fetch, auth, sync confirmation). A fixed
44px spinner (never smaller than a target it sits inside), paired with a `text-body`
or `text-caption` word describing what's loading ("Loading tide…") — never a bare
spinner with no label, and never a skeleton screen that implies content will appear
faster than it will on a boat with poor signal; an honest label with an indefinite
spinner is more truthful here than an animated skeleton promising a shape.

---

## Calendar day cell (D23's three states)

### Anatomy

Square-ish cell within the 7-column month grid, date number centered, `text-caption`
size floor for the number where space is tight but `text-body` preferred at ≥360px
widths — the accepted 320px exception is in `03-touch-and-interaction.md` §1. Below
the number: nothing, a dot, or a dot-plus-flag, per D23.

### The three states, precisely

1. **Nothing recorded** — bare number, `text-primary`, no glyph.
2. **A record exists** — number, plus a filled circular dot, `text-primary` colored
   (same ink as the number — not a status color, per `ux-calendar-notebook.md` §1.2's
   explicit rule that a catch day and a confirmed-blank day render identically). Dot
   size: 6px diameter, positioned below the number with `space-1` (4px) gap.
3. **Needs a look** — everything in state 2, plus an outline flag glyph in
   `amber-flag`, positioned beside the dot. This is the only state that uses a status
   color on this component.

**"Today"** is a fourth, independent visual modifier (an outline ring, `border-
interactive` or `tide-cyan` if today also needs the flag) layered on top of whichever
of the three states above also applies — today can be blank, recorded, or flagged,
independently of being today.

### Sizing

Full 7-column grid: each cell is a single tap target covering its entire square,
computed width at the design's minimum supported viewport (320px, minus `space-4`
edge padding ×2, ÷7) — accepted at ~45px per `03-touch-and-interaction.md` §1's stated
exception. At ≥360px width, cells reach the full 48px floor and should be sized up to
it, not left at a fixed small size once room exists.

### Accessibility

Each cell's accessible name is a full sentence built from real state, not decoration:
"August 14, has a record" / "August 15, needs a look" / "August 16" (bare, no
record). The dot and flag are `aria-hidden` (decorative duplicates of what the name
already says) so a screen reader doesn't read a glyph twice. Cell is a real button in
a grid (`role="gridcell"` inside `role="grid"`, or a native button grid — architect/
head-dev's implementation call) so arrow-key navigation works for a keyboard user
moving across the month.
