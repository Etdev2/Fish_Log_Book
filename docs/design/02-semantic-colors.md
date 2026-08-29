# 02 — Semantic Color Roles

Raw hex values live in `01-foundations.md`. This file says what each one *means*, and —
per the house rule that status is never color-only — what non-color signal rides along
with it every time it appears.

## Interactive (signal-orange)

**The only color that means "tap this."** One interactive color in the entire app is a
deliberate constraint: if orange always means "the primary thing to do here," the
70-year-old reader never has to stop and figure out which of several colored buttons is
the important one. Used for: the primary button fill, the quick-mark button, active
tab/segment indicators, and nothing else — never a decorative accent, never a brand
flourish on a non-interactive element.

- Non-color signal: interactive elements are also always the largest element in their
  group and carry a plain-word label (`04-components.md` §Button).
- Never paired with `tide-cyan` as adjacent interactive colors — computed ratio between
  them is 1.30:1, i.e. they are close to indistinguishable to a color-deficient viewer
  and must never compete for meaning on the same screen.

## Destructive (error-red)

Used only for: text of an error message, the icon on a "remove/dismiss" action, and (in
the one case where a destructive action is a filled button — see `04-components.md`
§Button, "Wrong tap, remove it") the `error-red-fill` background. Never used to mean
"bad day" or "no fish" — the calendar is explicit (D23) that a blank or zero-catch day
is not an error state and never renders in red.

- Non-color signal: every destructive/error state carries a sentence, never a bare red
  icon or red border alone (per house rule: errors say what to do next, in a sentence).

## Amber "needs attention" (amber-flag)

**The one status this whole system exists to make unmissable** — D22/D27's unresolved
mark, and the open-trip flag from `ux-cold-start.md` §1.5. This color appears in exactly
three places: the calendar day-cell flag, the "Needs a Look" queue badge/count, and the
inline line above `End Trip` when a trip carries an unresolved mark. It never appears
anywhere else, so an angler who has learned "amber = something needs me" is never wrong.

- Non-color signal: always paired with the outline-flag glyph (never a filled/solid
  flag — filled is reserved for the neutral "record exists" dot) and the words "needs a
  look." Screen readers get the same information as prose ("August 14, has a record" /
  "August 15, needs a look") per `ux-calendar-notebook.md` §1.1 — this document does not
  relitigate that, it inherits it.
- Deliberately not red: amber reads as "a chore," red reads as "you did something
  wrong." An accidental tap that created an unresolved mark is not a mistake worth
  alarming over — it is resolved by `Undo` or by the queue, at leisure.

## Tide (tide-cyan)

Reserved exclusively for tide data — the collapsed tide strip, the tide curve, the
percentage readout. Never used for anything else, including focus rings' *meaning*
(the focus ring reuses the hex value for contrast reasons, but a focus ring is not
"tide-colored," it is a distinct system — see `06-accessibility-baseline.md`). Keeping
tide-cyan single-purpose means a glance at any cyan text on the live-trip screen is
always tide, with no disambiguation needed.

## Moon (moon-pale)

Reserved exclusively for moon-phase data — the moon icon, moon-phase readout. Same
single-purpose reasoning as tide-cyan.

## Disabled

Not a color — a treatment: **45% opacity applied to the element's normal colors**,
`cursor: not-allowed`, and the element remains in the tab order but is not activatable.
45% (not the more common ~38%) was chosen because at 38% several of this palette's
already-mid-luminance colors (`text-muted`, `border-interactive`) drop under readable
contrast entirely rather than reading as "present but inactive" — the disabled state
still needs to be legible enough that the reader can confirm what the disabled thing
*is*, just not act on it. **A primary action is never disabled without a visible reason
next to it** ("Add a spot to start fishing" under a disabled Start Fishing button, not a
silently greyed-out button the user has to guess about) — this is the same "errors say
what to do next" rule applied to a control that isn't an error but produces the same
confusion if unexplained.

## Focus ring

Not a "meaning" color in the interactive-color-discipline sense above — it is a system
state, always `tide-cyan`, 3px solid, 2–3px offset, on every focusable element without
exception. Full behavior in `06-accessibility-baseline.md` §2.

## Success / confirmation (success-green)

Used only for system-confidence indicators that are not about the catch itself: "saved
offline, will sync," a completed-upload checkmark. **Never used to mean "good catch" or
"good day"** — that would recreate exactly the gamified good/bad day signal D23 rules
out for the calendar, just moved to a different screen. If a future screen is tempted to
turn success-green into a catch-quality signal, that is a founder-level call to reopen
D23's gamification stance, not a component styling choice.

## Quick reference

| Role | Color | Where it appears | Paired signal |
|---|---|---|---|
| Interactive | `signal-orange` | Primary buttons, quick mark, active tab | Size + plain-word label |
| Destructive | `error-red` | Error text, remove/dismiss | Sentence, never icon-only |
| Needs attention | `amber-flag` | Calendar flag, queue badge, End Trip inline note | Outline-flag glyph + "needs a look" text |
| Tide | `tide-cyan` | Tide strip/curve only | N/A — single-purpose by design |
| Moon | `moon-pale` | Moon readout only | N/A — single-purpose by design |
| Disabled | 45% opacity | Any inactive control | Adjacent reason text on primary actions |
| Focus | `tide-cyan` ring | Any focused element | Always visible, never suppressed |
| System success | `success-green` | Sync/upload confidence only | Never used for catch quality |
