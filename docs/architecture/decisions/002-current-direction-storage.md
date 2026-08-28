# 002 — Current direction: store a bearing, display the angler's word

**Date:** 2026-08-28 · **Status:** accepted
**Implements:** D20 (which settles D10 and closes the modelling half of O2)
**Detail:** `docs/architecture/ontology.md` §3.1. Does not supersede 001.

## Context

D10 gave four terms — uphill, downhill, inshore, offshore — and O2 established there is
no tidal-current prediction station within 100 km of Newport, so the field is user input
and always will be. What was missing was what the words mean and what a row holds.

The founder has now defined them: two perpendicular axes anchored to the **coastline**,
not the tide. Uphill is up-coast (northwest, toward Long Beach and Santa Barbara),
downhill is down-coast (southeast, toward Dana Point and San Diego); inshore is toward
the beach, offshore away from it. A flooding tide can run either way along the coast, so
current direction and tide state are independent variables — which is precisely what
makes recording both worth the tap.

## The call

The angler taps their own four words. The database stores the **compass bearing** those
words resolve to at that spot, derived from the spot's own coastline orientation.

- Spot holds two explicit bearings — `alongshore_bearing_deg` ("uphill" here) and
  `offshore_bearing_deg` — plus `axis_source` and `axis_revision`.
- ConditionSnapshot holds **both** `current_term` (the raw assertion) and
  `current_bearing_deg` (derived), plus `current_axis_revision`.
- The axes are captured once per spot by dragging an arrow along the beach on a map.
- Freshwater has none of these columns. Absent, not nullable.

## Why both the term and the bearing

Storing only the term gives a label with no physical anchor: it cannot be pooled across
spots, and it cannot be re-labelled later without invalidating every catch already
logged. Storing only the bearing is worse in a different way — if a spot's axes were
drawn wrong, there is no way back, because "they said uphill" is unrecoverable from a
wrong number. The term is the datum; the bearing is a derivation that must stay
recomputable. `axis_revision` is what makes stale derivations findable.

## What it costs us

- One extra setup gesture per saltwater spot, at a moment the user is not fishing.
- Three columns on the snapshot where a naive design has one, and a recompute job to run
  whenever a spot's axes are edited.
- Two bearings on Spot rather than one plus a perpendicular rule, so nothing enforces
  that they are 90° apart. That is intentional — harbour mouths and jetty corners are
  not obliged to be — but it means a fat-fingered pair of axes will not trip a constraint.
- Under D15 the term-to-bearing arithmetic is written in Swift, in Kotlin and on the
  server. It is a lookup and a mod-360 add specifically so triplication is survivable.

## Rejected

- **A single global term-to-compass mapping.** Breaks at the first bay, jetty, harbour
  mouth or east-facing coast, and silently — every affected catch looks fine and is wrong.
- **Storing only the four terms as an enum.** Not poolable across coastlines; freezes the
  vocabulary permanently.
- **Deriving direction from tide phase.** Physically wrong here, and it would collapse two
  independent variables into one, destroying the correlation the product exists to find.
- **Asking the angler for a compass bearing.** They think in the four words. D9's spirit
  is that the app absorbs the translation, not the user.
- **Auto-deriving axes from a coastline dataset now.** No dataset has been verified for
  resolution, licence or size. Modelled as a later prefill the user confirms.
