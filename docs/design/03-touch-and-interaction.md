# 03 — Touch and Interaction Law

## 1. Minimum touch target: 48px floor, 68–88px established precedent for primary actions

**48×48px is the absolute floor for every tappable thing, no exceptions.** This is not
a generic mobile-guideline number picked because Apple or Google publish it — it is
sized for cold, wet fingers that have lost fine motor precision, on a moving boat,
often through a lightweight glove. A relaxed adult fingertip contact area is
commonly cited around 10mm (~38px on a standard phone density); 48px adds headroom on
top of that for the tremor, the boat's motion, and gloved or arthritic hands this
audience skews toward — not for a "just in case," but because a missed tap on this
screen while a fish is in hand is not a minor annoyance, it's a lost record.

**Primary actions go well past that floor, at 68–88px — an established precedent from
the `screens/` mockups, not a number newly derived here.** Those mockups sized
`LOG A CATCH` at 88px (the single highest-stakes tap in the app — D22's man-overboard
button) and `Start Fishing` at 68px, with the stated reasoning "this gets tapped with
cold wet hands in glare." This document adopts that range as the working target for
every screen's primary action rather than inventing a smaller number:

| Action tier | Height | Precedent |
|---|---|---|
| The quick mark / `Log a Catch` (D22) | 88px | `ActiveTrip.dc.html` — the single most consequential tap in the app, sized at the top of the range |
| Other screen-level primary actions (`Start Fishing`, `Write it in`, `End Trip`) | 68px | `Main.dc.html` |
| Secondary / destructive buttons | 48px | House-rule floor, unchanged |
| Absolute floor for anything tappable | 48px | House rule |

56px (the plain house-rule floor for "a primary action") remains the legal minimum for
any primary button this table doesn't name explicitly — new primary actions should
default to 68px, not fall back to 56px, unless a real layout constraint forces it, in
which case 56px is still compliant, just under-precedent.

**The one stated exception, and why it's allowed:** calendar day cells at 320px width
compute to ~45px, 3px under the floor (`ux-calendar-notebook.md` §1.4). This is
accepted, once, because the cost of a miss there is a wrong day opening and one extra
tap to back out — no data lost, nothing written — a categorically smaller harm than a
missed tap on a logging control. The List/agenda view exists specifically so a true
56px row is always available as an alternative path into the same data. No other
screen gets this exception without the same "nothing is lost by a miss" reasoning
applied explicitly.

## 2. Spacing between adjacent tappable things: 12px minimum

Two 48px targets 12px apart give an effective 60px center-to-center pitch, which is
enough separation for a boat's motion to not turn "I meant the left button" into "I hit
both." This is `space-3` in the spacing scale (`01-foundations.md` §3) — never
`space-2` (8px) between two things a user must tell apart, even if a screen feels
"tight" without it. If a layout doesn't have room for 12px between two targets, the fix
is fewer targets on that screen, not less spacing.

## 3. Thumb-reach zones (one-handed use)

Assume: phone held in one hand, thumb is the only input, the other hand may be full
(rod, rail, fish). On a typical 6–6.7" phone the comfortable thumb arc from a natural
low grip covers roughly the bottom third of the screen with no stretch, the middle
third with a stretch, and the top third only with a grip shift or a second hand.

- **Bottom zone (no stretch): the primary action, always.** `Log a Catch`, `Start
  Fishing`, `End Trip`'s button — every screen's one primary action docks here, and it
  stays reachable even while a secondary panel (the rig sheet, the tide curve) is open
  above it, per `ux-cold-start.md` §5.2's explicit rule that the mark button is never
  covered.
- **Middle zone (reachable with a stretch): secondary actions and content that's read,
  not urgently tapped** — the tide strip, the rig strip, secondary buttons like `These
  conditions suck`.
- **Top zone (grip-shift required): navigation, back, and anything read rather than
  acted on under pressure** — screen titles, the month/year header, tab bar if one ever
  exists above content. Never the target for anything time-critical.

## 4. Hover is never load-bearing

Nothing in this system does anything meaningful only on hover. Reasons this is absolute,
not a nice-to-have, for this product specifically: the primary device is a phone, which
has no hover state at all; the actual state on a boat compounds this — a mouse-equipped
desktop reviewer is not the deployment target even for the web-prototype phase (D21).
Any `:hover` style in the codebase (several already exist, e.g. `app-nav.module.css`'s
`.links a:hover`) is a **progressive enhancement for the rare desktop viewer only** —
every state it communicates (pressed, active) must already be communicated by a
`:focus-visible` and an `:active`/pressed style that fires on tap, with no hover
required to discover it.

## 5. Confirmation without looking (D22's quick mark)

The quick mark is designed to be used by feel, not by sight — the founder's own framing
is "you click it without looking." Feedback is layered, in priority order for a hand
that cannot check the screen, and this order is fixed system-wide for every "wrote
something with no dialog" action, not just the mark:

1. **Haptic** — one short, distinct pulse pattern reserved for this action alone, so
   over a season of use it becomes recognizable by feel without a glance, the same way
   a phone's silent-mode switch is learned by feel.
2. **Sound**, if the device isn't silenced — one soft, short chirp. Deliberately not a
   chime long or bright enough to compete with someone shouting "fish on."
3. **Visual, for whenever a glance is available** — a toast (`04-components.md` §Toast)
   with the plain result (`"Fish #3 · 11:42am"`) and an `Undo` link, not a modal, and
   never something that requires a tap to dismiss before the angler can do anything
   else.

A mis-tap is fixed by `Undo` inside the toast's window, or later by the "Needs a Look"
queue (`ux-calendar-notebook.md` §4.3) — never by a confirmation dialog before the fact.
This is the house rule ("prefer undo over 'are you sure'") applied at its highest-stakes
point: the one button in this app explicitly designed to be pressed by someone who
cannot verify what they're pressing.

## 6. Pressed and active states are visible without color alone

Every tappable element has a distinct pressed/active visual state (see
`04-components.md` for per-component detail) that changes more than hue — a scale-down
of 2–4%, a fill-darken, or a border-thicken — so the state reads correctly even to a
viewer relying on shape/brightness over color, and so it reads in direct glare where
subtle color shifts wash out but a shape or brightness change does not.
