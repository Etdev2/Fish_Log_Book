# 06 — Accessibility Baseline

These are floors, not aspirations. A screen that doesn't clear every item here is not
"accessible enough for a first pass" — it isn't done, per the checklist in §6.

## 1. Contrast floors

- **Body text: AAA, 7:1, wherever text carries running prose or required information.**
  See `01-foundations.md` §1.2 for every pair in the system and its exact ratio; the
  one accepted exception (`text-muted` on `surface`, 6.48:1) is scoped in that section
  to non-decision-bearing text only.
- **Large text / icons / meaningful borders: AA floor, 3:1**, never lower. `hairline`
  (1.48:1) is the one color in the system under this floor, and it is restricted to
  purely decorative dividers that carry no information on their own — see
  `01-foundations.md` §4.3.
- **Never verify by eye.** Every ratio cited anywhere in this directory was computed
  with the WCAG relative-luminance formula, not judged visually — a future screen
  introducing a new color pair must do the same before shipping it, not "looks fine to
  me in the editor."

## 2. Focus order and visibility

- Tab order follows visual/reading order on every screen — no `tabindex` values above
  0, ever.
- **Focus is never suppressed.** No `outline: none` without a replacement focus style
  meeting the ring spec below; `:focus-visible` (not bare `:focus`, which would also
  ring on a mouse click) is used so keyboard/switch-control users always get the ring
  and pointer users aren't shown one they didn't ask for.
- **The ring:** 3px solid `tide-cyan`, 2–3px offset from the element's edge, on every
  focusable control without exception — buttons, inputs, chips, calendar cells, links,
  modal close controls. Contrast of the ring against both `background` (9.53:1) and
  `surface` (8.76:1) clears AAA on its own.
- When a modal or sheet opens, focus moves to it (typically its heading or first
  control) and is trapped inside until closed; on close, focus returns to the control
  that opened it. Never left to fall back to `<body>`.

## 3. Touch sizing

- 48×48px absolute floor for anything tappable, 68–88px established precedent for
  primary actions (`03-touch-and-interaction.md` §1), 12px minimum spacing between
  adjacent targets (§2 of the same file). The one named exception (320px calendar
  cells at ~45px) is scoped explicitly in that file with the reasoning for why it's
  acceptable there and nowhere else.
- Nothing important is hover-only or gesture-only. Any swipe (dismiss-a-sheet,
  swipe-to-skip on the bass sheet) has a visible, labeled button doing the identical
  thing, per house rule — `04-components.md` states this per-component where relevant.

## 4. Motion

- `prefers-reduced-motion: reduce` is honored globally: all transition/animation
  durations collapse to effectively instant (the existing
  `learning-dashboard.module.css` pattern — `0.01ms`/single iteration — is the
  reference implementation and should be applied app-wide, not just in that one
  stylesheet).
- No animation is ever the sole carrier of a state change (e.g. a pulsing highlight
  used as a tutorial "tap here" indicator must be paired with static text saying what
  to do, not rely on the pulse alone to be noticed or to survive reduced-motion).
- No auto-playing, looping decorative motion anywhere — a boat's own motion is already
  disorienting; the UI does not add to it.

## 5. Screen-reader labeling

- Every icon has an adjacent visible text label (house rule) and that same text — not
  a separately invented `aria-label` — is the accessible name, so sighted and
  non-sighted users get identical information.
- Status that's communicated visually by shape/color (the calendar dot and flag, the
  amber "needs a look" state) is backed by real text read aloud, matching what's
  visually implied — `04-components.md` §Calendar day cell gives the exact sentence
  pattern ("August 14, has a record" / "August 15, needs a look").
- Toasts and inline validation announce via `aria-live="polite"` (never `assertive`,
  which would cut off whatever the user's screen reader was already reading) —
  `04-components.md` §Toast and §Input state this per-component.
- Decorative glyphs (the dot, the flag icon, a chip's checkmark) are `aria-hidden` when
  the same information is already present as programmatic state or text, so nothing is
  announced twice.

## 6. What "done" means for any future screen

Before a screen built from this system is called finished, it has been checked at:

1. **320px wide** — nothing overflows or requires horizontal scroll; the one accepted
   exception (calendar grid cell size) is the only place under the 48px target floor.
2. **200% browser zoom** — text reflows to remain fully readable with no clipped or
   overlapping content; nothing requires horizontal scrolling to read a full line at
   this zoom either.
3. **Keyboard only** — every interactive element is reachable in a sensible order,
   every action completable, focus always visible, no trap outside an intentional
   modal.
4. **Contrast checked, not eyeballed**, for any new color pair introduced beyond the
   ones already tabled in `01-foundations.md` §1.2.
5. **`prefers-reduced-motion: reduce` respected** — toggle it on and confirm nothing
   animates.
6. **Screen-reader pass** — turn on VoiceOver (or the platform equivalent) and confirm
   every control announces a real name and every status announces the same information
   its shape/color conveys visually.

A screen that hasn't been walked through all six is not done — it's a draft, and should
be labeled as one in review rather than handed off as finished.
