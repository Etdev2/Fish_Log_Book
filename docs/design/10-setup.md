# 10 — Setup

**Status:** Built as a local-first web prototype · **First slice:** 2026-09-01
(product spec: *Fish Log Revision — Active Setup, Location Conditions & Quick Mark
Resolution*, 2026-09-01)

## Job

Answer two questions before the fish is in the boat — **what am I fishing with, and where
am I fishing?** — so that logging a catch stays a couple of taps.

**Configure once. Log repeatedly.** Rod, reel, line, leader, hook, bait, spot, current,
structure and water are the same for a dozen catches in a row. They are asked once, here,
and copied onto each fish as it is logged.

## What it looks like when it is working

An angler with one rod rigged and one spot set up logs a yellowtail in **two taps**:
`+ Log catch` → `Yellowtail` → the rod and place are already selected → `Save`. With three
rods out it is three taps. Everything else about the fish is optional and behind
*Add details*, exactly as before.

## The headline finding: almost none of this was new modelling

The spec asks for rod setups, presets, location conditions and observed-condition
vocabularies. Most of it already existed:

| Spec asks for | What it maps to | New? |
|---|---|---|
| Rod setup, snapshotted onto catches (§6, §10) | `trip_rig` — D21a's sticky rig, already append-only | **extended** to N slots |
| Rig gear by role (§7) | the `catch_gear` shape from the Fish Log slice | mirrored as `trip_rig_gear` |
| Current direction — uphill/downhill/inshore/offshore (§13) | `condition_snapshot.current_term`, with exactly those four values | existing |
| Current strength (§13) | `condition_snapshot.current_strength` | existing |
| Structure, water colour, water clarity (§13) | seeded `structure_type` / `water_color` / `water_clarity` vocabularies | existing |
| Water depth ≠ catch depth (§13) | `bottom_depth_m` vs `depth_fished_m`, already separate columns | existing |
| Location conditions preset (§11) | — | **new** `location_condition` |

The ontology had reserved the angler-observed current terms for exactly this, years of
design-decisions earlier. The work was wiring, one generalisation, and one new table.

## Rod setups are D21a generalised, not a second system

`trip_rig` already was "the standing configuration a catch inherits from", already
append-only, and already the thing `catch.rig_id` points at. It modelled **one** rig per
trip; the spec needs several concurrent rods. So it gained a `slot`, and its uniqueness
moved from `(trip_id, revision)` to `(trip_id, slot, revision)`.

That constraint swap is the one non-additive change in the migration and it is required:
under the old constraint two rods could not both be at revision 1. Existing rows are
unaffected — `slot` defaults to 1 — and the new constraint is strictly weaker, so nothing
legal became illegal.

**A separate `rod_setup` table was deliberately not created.** Two answers to "what was I
fishing with" is precisely the drift ADR 003 exists to prevent.

### §10 falls out of the append-only rule, it is not bolted on

Re-rigging Rod 1 at 10am inserts **revision 2 of slot 1**. Revision 1 is never mutated —
not by the app, and not by a buggy client, because `trip_rig` revokes UPDATE and DELETE
outright. The 8am catch still points at revision 1, so it still says 40 lb leader.

Verified in a real PostgreSQL 16, not asserted: after a re-rig to 60 lb, the earlier fish
still joins to `40 lb fluorocarbon`, and an `UPDATE` on revision 1 raises.

Putting a rod away is itself a new revision. It never deletes, so every catch that came on
that rod still resolves.

## Location conditions are mutable; the history is the copy

A rod setup is append-only. A location is not — it describes the spot *right now*, and an
angler correcting "Strong" to "Light" at noon is fixing the present, not the morning.

So the history lives on the catch: `applyLocation` **copies** the observed values onto the
fish, keeping `location_condition_id` as the live link for "how has West End fished".
Editing the preset afterwards cannot retell the fish; deleting it (`ON DELETE SET NULL`)
takes the link and leaves every observed value intact. Both proven in Postgres and in the
browser.

`structure_type_ids` is copied by value, so mutating the preset's array cannot reach a
catch's copy — there is a test that mutates the source and asserts the copy is unmoved.

## Quick Mark Resolution — and a bug it uncovered

The spec's title promised a Quick Mark Resolution section that the document did not
contain (flagged before starting; the founder asked for the obvious reading). Building it
found a real defect shipped in the Fish Log slice:

**"Say what this was" routed through `logCatch`, which created a SECOND catch and left the
original mark unresolved in the queue forever.**

Resolving now updates the mark in place. The mark *is* the fish — it was recorded at the
moment it happened — and resolving finishes that record rather than writing a new one.
Preserved untouched: `caught_at`, `caught_tz`, `local_date`, `trip_id`, the position fix,
`capture_mode`, and the `condition_snapshot` already attached to its id. The angler fills
in what the button could not know; nothing observed is overwritten by something typed
later. D22's one-way rule still holds.

A quick mark also now inherits the standing rod and the most recent location, so tapping
one button does not produce a poorer record than the full sheet.

## Two UX problems the screenshots caught and the assertions did not

1. **The species list pushed the rest of the flow off screen.** Twelve chips is taller
   than a phone, so Rod, Where and Save needed a scroll — a four-tap flow turned into a
   scroll. The picker now collapses to the answer plus **Change** the moment a species is
   chosen. Picking is still one tap from a visible list.
2. **"Not recorded" was filled orange.** Orange is this system's affirmative signal, so
   the do-nothing option looked like the recommendation and out-shouted the actual rods.
   It is now a quiet chip that still reads as current.

A third came out of a failing test rather than a screenshot: tapping the already-selected
rod **deselected** it. A confirming tap that silently clears the record is the worst kind
of wrong, so the preset chips are select-only and "Not recorded" is the explicit clear.

## Tackle Box integration accelerates; it never gates (§8)

Each gear line offers what the angler already owns as chips and accepts free text
identically. Someone who has never opened the Tackle Box can rig every rod without
noticing it exists.

What is stored is the **label**, plus the tackle id when one was picked — the same
id-plus-snapshot rule the catch uses. The Tackle Box is still a session-only prototype, so
a bare reference would go stale on the next reload and take the rod's description with it.

## Checks

- `npm run verify` green — **299 tests**; `npm run build` green, `/setup` static.
- **34 Setup browser checks** at 390×844, zero console errors: nav, the empty Fish Log
  being unchanged before any Setup exists, rod and location creation, more than three
  rods, the `Species → Rod → Where → Save` flow, the full snapshot landing on the catch,
  **§10 twice over** (re-rig, then edit the location), reload persistence, retiring a rod,
  and no overflow at 390 px or 320 px.
- **11 mark-resolution checks**: no second row, same row confirmed, original timestamp
  preserved to the millisecond, location and rod preserved, queue emptied.
- **10 regression checks** on the previous slice, since the nav went from four tabs to
  five: the quick mark still defaults off, still sits above the nav, and **all five tabs
  stay hit-testable**; Tide stays immersive and unscrolled.
- **All seven migrations applied to a real PostgreSQL 16**, plus behaviour: three rods at
  revision 1 (impossible under the old constraint), append-only enforcement, the §10
  guarantee, blank names and invented current terms refused, RLS blocking cross-angler
  reads and writes, `trip_rig_gear` UPDATE revoked, `anon` with no access.
- **Not tested on a real phone.**

## Deliberately not built

- **Reusable rod presets across trips (§9).** The founder chose today's rods first, presets
  as their own PR. The data model is ready for it: a preset is a rod setup with no
  `trip_id`, copied into a slot.
- **GPS position on a location (§13).** `spot_id` is wired and `spot` already carries
  coordinates; picking or creating a spot from Setup is the Spots feature's job.
- **Per-rod depth and lure/jig weight fields**, which the spec lists as *potential*. They
  are additive to the same gear rows when they earn their place.
