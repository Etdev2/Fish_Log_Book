# Guided setup, the Quiver, reel sizes, and region honesty

**Status:** Proposed — founder-supplied, awaiting architect and UX rulings
**Date:** 2026-09-04
**Governs:** `/setup`, `/tackle`, navigation and information architecture, reel vocabulary,
Fish Legal home and the boundaries page
**Document:** `docs/specs/setup-flow-and-quiver.md`

> Founder-supplied, 2026-09-04, after using the application enough to know where it does
> not read the way it works. Sections 1–4 and the completion checks are the founder's
> words, kept intact. Section 5 is what the code actually does today, written by
> `head-dev` before any work started, because two of the four asks rest on assumptions
> the repository does not support.

The founder also directed, same day: **the log stays on-device for now.** Database sync
comes later, once the offline path has been proven in real use. Nothing in this spec
should introduce a server round trip.

---

## Founder brief

> Now that I'm more familiar with the application, I've identified several small changes
> that would make the setup and catch-logging experience easier to understand. So ask the
> architect and the UI/UX designers, if we have to re-organize the pages and how the
> navigation is set up, let's do so — everything just makes sense and everything's on the
> right page in the right order and everything flows so that any user could pick this up.

### 1. Guided setup workflow

The ideal workflow appears to be:

1. Set or select a fishing location.
2. Add gear to the Tackle Box.
3. Build or select a fishing rod setup.
4. Add the current fishing-location conditions.
5. Log a fish.

Please organize the Settings or Setup area around this sequence. Display it as a clearly
ordered checklist or stepper so users understand what they should complete next. On
mobile, it should remain readable without horizontal overflow.

Each completed step should display a simple completed state, and tapping a step should
take the user directly to the corresponding page.

### 2. Add a Rod Quiver page

Create a page called **Quiver**, using the surfing term for a saved collection of
surfboards. In this application, the Quiver will contain the user's saved fishing rods and
complete rod setups.

Update the current **Put Away** behavior:

- Putting away a rod must remove it from Today's Setup.
- It must not delete the rod or make it disappear permanently.
- The complete setup should remain saved in the user's Quiver.
- From the Quiver, the user can add that rod back to Today's Setup for another trip.
- Saved information should include the rod, reel, line, leader, hooks, bait configuration,
  and other existing setup details.

The goal is to let anglers reuse their normal rod setups without rebuilding them before
every trip.

### 3. Correct reel-size options

The current reel-size values appear too large or too broad because spinning reels and
conventional reels use different numbering systems.

Please make the available reel sizes depend on the selected reel type:

- Spinning reels should use the appropriate larger numbering format.
- Conventional reels should use their appropriate size format.
- Other reel types should receive relevant options where applicable.
- Include a custom value when the user's reel does not match a preset.

The architect should confirm whether these values belong in the shared gear vocabulary or
in reel-type-specific option sets.

### 4. Fish Legal region emphasis

On the Fish Legal home page:

- Highlight the selected region and the Change action using the application's orange
  accent color.
- Make it immediately obvious which jurisdiction's regulations the user is viewing.
- Rename **Depth & Boundaries** to **California Depth & Boundaries** if that information
  currently applies only to California.
- When a non-California region is selected, do not imply that California-specific depth
  and boundary information applies there. Hide the option or replace it with an honest
  unavailable state until that region has equivalent data.

### Completion checks

- The five-step workflow is clear on a phone.
- Every workflow step links to the correct destination.
- Put Away preserves the rod in the Quiver.
- A saved Quiver rod can be returned to Today's Setup without being rebuilt.
- Reel sizes change appropriately based on reel type.
- Fish Legal clearly displays the active jurisdiction.
- California-only boundary information is never presented as universal.
- Existing saved rods, catches, settings, and Fish Legal data continue to work.

---

## 5. Repository reality check

Written before implementation so the architect and UX rule on facts rather than
assumptions. Four findings, two of which change what the founder asked for.

### 5.1 The Quiver is mostly a view, not a migration — §2 is cheaper than it looks

`Put away` already calls `retireRodSetup`, which writes a new revision with `retired_at`
set. **The setup is not deleted today.** `core/rules/catch/rules.ts` is explicit about
why: retiring writes revision *n+1* rather than mutating, so a fish caught on revision 1
keeps the rod it was actually caught on.

So the Quiver needs no schema change and no data migration. It needs:

- a view over retired rigs (grouped so the *setup* appears once, not once per revision),
- a "bring back to Today's Setup" action, which is a new revision with `retired_at: null`
  and a fresh slot (`nextRodSlot` never reuses a slot, including retired ones),
- and copy that stops implying `Put away` is destructive.

**Ruling needed:** a rod put away and brought back three times accumulates revisions. The
Quiver must group by setup identity, and the architect should say what that identity is —
`rules.ts` currently treats a slot as the identity of a rod within a trip, which is not
the same thing as "my 40-lb yo-yo stick".

### 5.2 The reel size list is exactly the bug described — one flat list of two systems

`src/features/tackle/types.ts`, the `reels` category:

```ts
{ key: "type",  options: ["Conventional", "Spinning", "Baitcasting", "Lever drag", "Star drag"] },
{ key: "size",  options: ["500","1000","2500","3000","4000","5000","6000","8000","12","16","20","30"] },
```

Spinning sizes and conventional sizes are offered in the same chip row regardless of the
type chosen, which is why the values read as "too large or too broad". The founder's
diagnosis is correct and the fix is a dependent option set keyed on `type`.

**Ruling needed** (the founder asked for it explicitly): shared vocabulary or type-scoped
option sets. `head-dev`'s recommendation is type-scoped — the field schema already exists
per category, so this is a `optionsBy` variant on one field rather than a new vocabulary
concept, and a shared list cannot express "4000 is meaningless on a lever drag".

### 5.3 Depth & boundaries is NOT California-only — it is worse than that

The founder's §4 assumed the page is California-specific. It is not. Reading
`boundary-map.tsx`:

- Southern California and the five `ca_gma_*` regions render the SoCal bundle with the
  50-fathom RCA ribbon.
- Northern California and its GMA regions render the NorCal bundle.
- **Every other region falls back to a Florida overview.**

So a Washington or Texas angler opening "Depth & boundary rules" today is shown a
**Florida** map, centred on the Indian River Lagoon. That is not a California-specific
page leaking into other states — it is a Florida page leaking into every state that is
not California.

Renaming the card to "California Depth & Boundaries" would therefore be *inaccurate*, and
would also hide the real defect. The honest fixes are:

- name the card for the region actually being rendered, and
- for a region with no verified boundary data, do what §4's second half asks — hide it, or
  state plainly that there is no verified boundary data for that region — rather than
  silently substituting another state's coastline.

This is a correctness issue in the same family as the two contradictory bag limits fixed
on 2026-09-04, and it should be treated with the same priority.

### 5.4 The navigation bar is full, and a seventh destination is a founder decision

`shell-nav.tsx` carries six destinations — Calendar, Setup, Log, Tide, Legal, Settings —
and `shell-nav.test.ts` pins the count with a comment saying a seventh "still needs a
decision, not a patch". Below 384px the bar already wraps to two rows of three.

The founder has now opened that decision by asking for the pages and navigation to be
reorganised. It cannot be resolved inside a component: it is an information-architecture
ruling, and it interacts with §1 (where the guided checklist lives) and §2 (where the
Quiver lives).

**This is the ruling the architect and `ux-ui` owe before implementation starts.**

---

## 6. Information architecture — decided

Founder, 2026-09-04, answering the three questions §5 raised. These are settled; the
architect and `ux-ui` design *within* them, not around them.

1. **The Quiver lives inside Setup, as a section.** Setup becomes "Today's Setup" plus
   "Quiver". **The nav bar stays at six** — `shell-nav.test.ts` keeps its pin, and the
   seventh-destination decision stays unspent. Saved rods sit next to the place you pull
   them into, which is also where the mental model wants them.
2. **The guided checklist lives on the Calendar home page**, above the calendar. It is the
   first screen on launch, so a new angler meets the order of operations without having to
   find anything first. It must collapse to a single line once all five steps are done —
   a checklist that keeps nagging an experienced user is a checklist they learn to ignore.
3. **The Tackle Box is reached from Setup**, not promoted to the nav. Setup becomes the hub
   for everything you do before fishing — location, tackle, rods, conditions — and Settings
   goes back to being only settings.

The through-line: **Setup is trip preparation, home is what to do next, Settings is
preferences.** Anything that does not fit one of those three sentences is in the wrong
place.

## 7. Still owed by the architect

Both were raised in §5 and neither is a founder call.

1. **Quiver setup identity** (§5.1). A rod put away and brought back accumulates revisions.
   What identity does the Quiver group by, given that `rules.ts` treats a slot as a rod's
   identity *within a trip*, which is not "my 40-lb yo-yo stick"?
2. **Reel size option shape** (§5.2). Shared gear vocabulary, or type-scoped option sets?
   `head-dev` recommends type-scoped.
