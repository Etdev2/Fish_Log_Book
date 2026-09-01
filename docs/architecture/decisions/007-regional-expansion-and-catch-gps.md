# ADR 007 — Region expansion, freshwater readiness, catch GPS, and the map

**Status:** accepted (founder rulings 2026-09-01, intake:
`docs/product/requests/2026-09-01-expansion-requirements.md`)
**Decides on:** founder requirements §1–§5 (and the principle behind §8–§10).

---

## 1. The rule that shapes everything here

**No region is in the data model, ever.** A catch is species + time + GPS + spot +
setup + conditions + tide. Geography that *interprets* that (which region you fish,
what species get suggested) is presentation and preference. The day the app claims to
"know where you are" and filters your fish accordingly, it has stopped being a logbook
and started being a guesser. Recommendation is a layer, not a column.

## 2. Catch GPS — already built, now ratified

Requirement §1's capture half exists: catches carry `lat` / `lng` / `gps_accuracy_m`.
The pattern (`attachPositionLater`) implements exactly the founder's UX ruling —
request opens with the sheet, save *reads* the fix and never awaits it, late fixes patch
the row, misses are a null, and none of it blocks the water (spec §21).

Two properties to preserve in later slices:

- **A missing fix is an honest `null`, never a synthesized point.** "No GPS" is data.
- **Offline-first by construction:** coordinates live in the local store and ride the
  outbox like everything else (ADR 004). "No service" never was a special case.

## 3. Spots vs catch GPS — two nouns, both kept

| | Fishing Spot (`spot`) | Catch GPS (`catch.lat/lng`) |
|---|---|---|
| Origin | Angler names it | Device fixes it |
| Precision | Area that produces | Exact instant of the catch |
| Mutability | Renames, retunes | Immutable; accuracy recorded |
| Question it answers | "Does the West End pay?" | "Where exactly was that bite?" |

Both are required — §2 of the intake. Collapsing them into one field loses the
analysis the founder asked for (spot → conditions → success). The `spot` table exists in
the schema; a `spot.environment` and `spot.typical_depth` shape lands with the spots
slice; catches reference a spot id *and* keep their own fix.

## 4. Regions steer defaults — Settings, not schema

`settings/region.ts` — a device-local preference (same `preference.ts` mechanics as
units; IDB migration noted in its header applies here too). `core/ontology/regions.ts`
maps region → a curated starter list. Rules:

- Search and "Something else" always reach the full vocabulary in every region.
- Custom region = no regional suggestions; Recent learns the water instead.
- Lists are honest starter sets (`needs_review` flags carry forward), not a promise
  of local regulations. The app never tells anyone a season or a limit.

## 5. Freshwater readiness without a rewrite

`core/ontology/environments.ts` lands the eight environments (ocean → stream) with
water-class roll-ups and each environment's eventual condition emphasis. The species
vocabulary already carried `water_class`; freshwater species now fill that half of the
list. What consciously did **not** happen: conditions questions did not split by
environment yet — that is product design (which variables matter to whom), and landing
it half-thought would build the rewrite the founder explicitly wants to avoid.

## 6. The map is offline-first geometry

Per founder ruling: markers ride built-in coastline/chart geometry that renders with
zero signal; network tiles (if ever) are progressive enhancement cached when available.
A blank gray grid offshore is the one outcome this decision exists to prevent.

## 7. What this ADR pre-commits later slices to

- **Tide markers (§6 intake):** placed on the curve by `caught_at`; cluster/staple
  overlaps; tap → catch sheet. Fixture data is fine — expiration risk lives in owner
  decision on live tide data, not here.
- **Calendar (§7):** `/` is a stub today by honesty, not by accident; month grid with
  record dots per the calendar decision (D-series notes).
- **Filters (§8):** query layer over the local store, both location kinds.
- **Night Fishing Mode (§9):** a third appearance, *not* a dark-theme variant; it owns
  its own contrast/glare decisions when it lands.
- **Don't-Forget List (§10):** trip gear specs compared against the tackle box; the
  list reads gear by id, never by typed name.

## Consequences

- Species picker reaches `regions.ts`; the SoCal chip list moved from a component
  constant into region data without changing one chip's identity.
- One new migration keeps the vocabulary parity honest (milky + regional species), and
  a parity test now fails on any future drift in either direction — the mirror comment
  in `species.ts` finally has teeth.
