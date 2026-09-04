# 008 — Quiver setup identity, and type-scoped gear options

**Date:** 2026-09-04 · **Status:** accepted
**Answers:** `docs/specs/setup-flow-and-quiver.md` §7.1 and §7.2 — the two rulings the
founder's §6 information architecture left open.
**Depends on:** `003-web-prototype-boundary.md` (pure core, vectors, folder law),
`004-offline-store-and-sync.md` (IndexedDB is the read path, ids are minted on device),
`005-front-end-architecture.md` §2 (tokens), `001-canonical-ontology-shape.md`.
**Supersedes:** nothing. **Amends:** nothing. Both calls are additive.

## Context

The founder settled the information architecture in the spec's §6: the Quiver is a
section inside Setup, the nav stays at six, the Tackle Box is reached from Setup. Two
questions were left to the architect because neither is a product call.

**1. What is a Quiver entry?** `Put away` calls `retireRodSetup`, which writes revision
*n+1* with `retired_at` set rather than mutating (`src/features/catches/store.ts`,
`src/core/rules/catch/rules.ts`). That is correct and stays. But it means a rod put away
and brought back three times is four rows, and `RigRecord` has no field that says those
four rows are the same rod. `slot` is not it: `slot` is unique within a **trip**
(`nextRodSlot` maxes over `rigs` filtered by `trip_id`), and the Quiver's entire purpose
is to survive *between* trips. Saturday's Rod 1 and Tuesday's Rod 1 are two different
sticks, and Tuesday's Rod 3 may well be Saturday's Rod 1.

**2. Reel sizes.** `src/features/tackle/types.ts` offers spinning sizes (500–8000) and
conventional classes (12–30) in one flat `size` list regardless of the `type` chosen.

The log is on-device only (IndexedDB, `src/lib/offline/db.ts`, `DB_VERSION = 2`). There
is no server for this data yet — note that `supabase/migrations/…v1_core_schema.sql`'s
`trip_rig` does not even carry `slot`, `name`, `setup_type`, `gear` or `retired_at` yet,
so the local record is already ahead of the table. Whatever is decided here has to work
against rows sitting on the founder's phone right now, with no server to re-derive them
from and no second chance.

---

## The call

### 1. A Quiver entry is a lineage, identified by a new `quiver_id` on the rig record

**The Quiver groups by `quiver_id`: a UUIDv7 minted once, when a rod setup is first
created, and carried unchanged through every later revision — re-rig, retire, bring
back — and across every trip.**

The identity cannot be derived. Each candidate derivation fails on a case that will
happen in the first week of use:

| derived from | fails because |
|---|---|
| `(trip_id, slot)` | Trip-scoped by construction. Every new trip would start an empty Quiver. |
| `slot` alone | "Rod 1" on Saturday and "Rod 1" on Tuesday are different rods, and the same rod moves slots. |
| `name` | Nullable, defaults to `Rod {slot}`, and renaming a rod would silently fork it into two Quiver entries while two unnamed rods would merge into one. |
| gear fingerprint | Re-rigging is the normal case. Changing a leader must not create a second rod. |

So this is a new stable id on the record, not a derivation. Three fields, three
different questions, none of which substitute for another:

- `id` — this revision. What a catch points at. Never reused.
- `slot` — where this rod stands **in one trip**. Rod 1, Rod 2. `nextRodSlot` is
  unchanged and still never reuses a slot, including retired ones.
- `quiver_id` — **which rod this is**, for all time. The Quiver's grouping key.

```ts
// src/core/rules/catch/types.ts — RigRecord
/**
 * The rod's identity across trips and revisions: "my 40-lb yo-yo stick". Minted once
 * when the setup is first created, then copied forward by every revision, including
 * retire and bring-back. `slot` says where a rod stands in one trip; this says which
 * rod it is. The Quiver groups by this and nothing else.
 */
readonly quiver_id: string;
```

**`revision` becomes lineage-scoped, not slot-scoped.** Revisions increase monotonically
within a `quiver_id`, across trips. `activeRodSetups` stays correct unchanged — within
one trip a lineage occupies one slot at a time and its revisions still increase in time
order, so "highest revision in the slot" is still the standing rod — and the Quiver gains
a total order that makes "the latest state of this rod" well defined without comparing
timestamps.

**Bring-back is a new revision, not an un-retire.** `retired_at` is never cleared on an
existing row; nothing in `trip_rig` is ever mutated. Bringing a rod back writes revision
*n+1* with the same `quiver_id`, the **new** `trip_id`, a fresh slot from `nextRodSlot`,
`retired_at: null`, and the gear copied from the revision being restored. A rod put away
and brought back three times is one Quiver entry with six revisions, which is exactly
what "the log never lies about what a fish was caught on" costs.

**Guard:** bring-back is legal only when the lineage's latest revision is retired. Two
live revisions of one lineage in one trip would render the same rod twice in Today's
Setup, so the guard is a pure function, not a disabled button.

**Labelling:** the Quiver never falls back to `Rod {slot}`. A slot number from a trip
three weeks ago is meaningless in a saved collection. An unnamed lineage is labelled from
its `setup_type` and its rod/reel gear. `rodSetupLabel` keeps its current slot fallback
for Today's Setup, where the slot is the thing the angler is looking at.

#### Where the code goes (ADR 003 §2, §3)

Pure, in a new `src/core/rules/catch/quiver.ts`. No React, no DOM, no db, no id or clock
generation inside — the caller supplies `id` and `nowIso`, exactly as `repeatSeedFrom`
already refuses to mint them:

```ts
export interface QuiverEntry {
  readonly quiver_id: string;
  readonly latest: RigRecord;      // highest revision in the lineage
  readonly in_todays_setup: boolean;
  readonly last_used_at: string;   // latest.effective_from
  readonly label: string;
}

export function quiverKeyOf(rig: RigRecord): string;
export function quiverEntries(rigs: readonly RigRecord[], tripId: string): readonly QuiverEntry[];
export function canBringBack(entry: QuiverEntry): boolean;
export function broughtBackRevision(
  latest: RigRecord,
  input: { id: string; tripId: string; slot: number; nowIso: string },
): RigRecord;
```

`quiverKeyOf` returns `rig.quiver_id` and falls back to `` `${rig.trip_id}:${rig.slot}` ``
if it is ever absent. Belt and braces: after the migration below no persisted row lacks
it, but core must stay total when a row arrives from a sync path whose column does not
exist yet.

The impure half is three lines in `src/features/catches/store.ts`, next to
`saveRodSetup`/`retireRodSetup` and using the same `persist(row, mutation)` path:
`bringBackRodSetup(quiverId, tripId)` reads the snapshot, calls `broughtBackRevision`
with `uuidv7()`, `new Date().toISOString()` and `nextRodSlot(...)`, and persists.
`saveRodSetup` gains an optional `quiverId` — omitted mints a new lineage, supplied
continues one. `retireRodSetup` already spreads `...rig`, so it carries the id for free.

The Quiver component calls `quiverEntries(state.rigs, tripId)` and
`logActions.bringBackRodSetup`. **No grouping, no revision arithmetic and no
retired-filtering in a component** — that is the rule ADR 003 exists for, and it is the
rule this feature is most likely to break, because grouping in a `useMemo` looks harmless.

Vectors, per ADR 003 §4: a `quiver` block in `src/core/rules/vectors/catch-rules.json`.
It must contain at minimum — put away and brought back three times appears **once**;
a lineage across two trips appears once; two unnamed rods in different trips do not
merge; a legacy row with no `quiver_id` groups by trip and slot; `canBringBack` is false
for a live lineage. (`scripts/check-tripwires.mjs` only enforces vectors for *top-level*
`src/core/rules/*.ts`, so a file in `catch/` is on the honour system. Write them anyway.)

#### The migration — required, and it must not be skipped

Rigs already exist on the founder's device. There is no server to re-derive them from.

**`src/lib/offline/db.ts`: `DB_VERSION` 2 → 3.** Inside the version-change transaction
(so it is atomic with the upgrade, and a killed tab leaves either v2 or a fully
backfilled v3):

1. Read every `trip_rig` row. Group by `(trip_id, slot)`.
2. Mint one UUIDv7 per group. Write it as `quiver_id` onto every row in that group.
3. In the same transaction, for every `outbox` mutation with `entity === "trip_rig"` and
   `state !== "done"`, merge the same `quiver_id` into its payload, so the queued insert
   and the stored row do not disagree.

Adding an absent identity field to a local row is not a violation of append-only. Nothing
about what was fished changes, no `id` changes, and every `catch.rig_id` pointer still
resolves. Append-only protects the angler's history from being rewritten; it does not
require us to leave rows unlabelled forever.

**What the angler sees afterwards:** every rod they have ever saved is in the Quiver and
still works. Rods from *different trips* that were "the same rod" in the angler's head
appear as separate entries, because the data linking them never existed and inventing the
link — by name, or by gear similarity — would merge two rods that were never the same
one. This is honest, it is one-time, it decays as new setups are created with real
lineages, and a future "these are the same rod" merge action can be added if the founder
actually finds the duplicates annoying. **Nothing is orphaned and nothing disappears.**

**Trap, and this one is load-bearing.** The current `upgrade` callback does
`if (oldVersion >= 1) { …create location_condition…; return; }`. That early `return`
means a device on v1 or v2 would run the v2 step and **skip the v3 backfill entirely**,
leaving rods with no `quiver_id` and an empty-looking Quiver — silently, with no error.
The upgrade must be restructured into cumulative, non-returning steps
(`if (oldVersion < 2) { … }` then `if (oldVersion < 3) { … }`) as part of this change.
Verify by opening the app with an existing v2 database, not only with a fresh one.

**Server, later.** When `trip_rig` is brought up to the local shape, the same migration
adds `quiver_id uuid not null`, an index on `(angler_id, quiver_id, revision desc)`, and
replaces `unique (trip_id, revision)` with `unique (quiver_id, revision)` — revision is
lineage-scoped now. That migration is out of scope here; it is named so it is not
rediscovered.

Add **Quiver** and **rod setup lineage** to `docs/architecture/ontology.md`. A term the
schema carries is a term the glossary defines.

### 2. Reel sizes are type-scoped, on the field schema. `head-dev` is right

Options that depend on another field belong in **type-scoped option sets on the field
that has them**, not in the shared gear vocabulary. The vocabulary is a flat list of
values; "4000 is meaningless on a lever drag" is a *relation between two fields*, and a
flat list has nowhere to put it. A shared list can only be right for one reel type at a
time, and it is currently right for none.

`AttributeField` in `src/features/tackle/types.ts` gains three optional keys. Every
existing field is untouched and keeps working:

```ts
export type AttributeField = {
  key: string;
  label: string;
  /** Options when the field has no controller, or when the controller's value has no
   *  set of its own. Never a union of two numbering systems. */
  options: readonly string[];
  placeholder: string;
  maxChips?: number;
  /** Key of the field in the SAME category whose value selects this field's options. */
  dependsOn?: string;
  /** Controlling value -> options. Exact match on the controlling field's value. */
  optionsBy?: Readonly<Record<string, readonly string[]>>;
  /** Shown in place of the chip row while the controller is unset. Copy is ux-ui's. */
  emptyHint?: string;
};
```

Resolution is one pure function in the same file, and it is the **only** place options
are chosen:

```ts
export function fieldOptions(
  field: AttributeField,
  attributes: Record<string, string>,
): readonly string[] {
  if (!field.optionsBy) return field.options;
  const controller = field.dependsOn ? attributes[field.dependsOn] ?? "" : "";
  return field.optionsBy[controller] ?? field.options;
}
```

The `reels` `size` field becomes `dependsOn: "type"`, `options: []`, an `emptyHint`, and
an `optionsBy` keyed on the five existing type values — spinning in thousands
(500–20000), conventional and star drag in line classes (10–80), lever drag in classes
(12–130), baitcasting in hundreds (100–400). The exact ladders are `head-dev`'s to write
from the founder's brief; the shape above is the contract. Brand-specific ladders (Avet
SX/JX/MX, Shimano 200/300/400) go through Other… until someone asks for a second field.

Three invariants, enforced by a unit test in `src/features/tackle/`, not by care:

1. A field with `optionsBy` has `dependsOn`, and that key exists in the same category.
2. A dependent field appears **after** its controller in `fields`, so the controller is
   answered first. `reels` already satisfies this.
3. No category's `options` array mixes two numbering systems. This is the bug; a test is
   how it stops coming back.

`ChoiceField` stays dumb: `tackle-editor-sheet.tsx` calls `fieldOptions(field,
draft.attributes)` and passes the resolved list in as an `options` prop. Resolution does
not move into the component (ADR 003 §3, ADR 005 §3). No colour or size literals are
involved either way (ADR 005 §2, tripwire 2).

#### Gear already saved with a size that is not valid for its type

**Nothing happens to it, and that is the design, not an oversight. No migration.**

`attributes` is `Record<string, string>` and was never constrained to the option list.
`ChoiceField` already computes `valueIsCustom` for a value outside the chip row and opens
the free-text input pre-filled with it. So a spinning reel saved as "20" keeps its value,
keeps rendering, keeps matching search (`itemMatchesSearch` scans attribute values), and
keeps its auto-name. It simply shows as a custom value instead of a highlighted chip —
which is also true today for anyone who typed their own size.

**Changing `type` does not clear `size`.** The dependent value stays and becomes a custom
value. Silently deleting something the angler typed because they corrected an unrelated
field is the worse failure by a wide margin, and a Penn 30 relabelled from Conventional
to Lever drag is still a 30. This matches `retainedAttributes`, which already keeps values
whose key survives a category switch.

The gear vocabulary stays in `src/features/tackle/types.ts` for now. When the Setup gear
picker becomes a second consumer, the registry moves to `src/core/ontology/tackle.ts`
**unchanged in shape** — that is a scoped move, not a redesign, and it is not part of
this work.

---

## What it costs us

- **A new field on the rig record and a real IndexedDB migration**, on the one store
  whose data cannot be re-fetched from anywhere. The `upgrade` restructure is the risky
  part and has to be tested against an existing v2 database.
- **Rods saved before today split by trip in the Quiver.** One-time, honest, and the
  alternative is guessing which rods were the same one.
- **A typo in a rod's name still costs a revision**, and now those revisions also
  accumulate in the lineage. Unchanged from D21a; the Quiver just makes it visible.
- **`revision` changes meaning** from slot-scoped to lineage-scoped. Nothing reads it
  arithmetically today except `saveRodSetup`, but the future server migration has to
  change its unique constraint, and that is now a thing someone must not forget.
- **Three more optional keys on `AttributeField`.** A field schema that can express a
  dependency is a field schema someone will eventually build a three-level dependency
  with. Invariant 1 and the review bar are the only things stopping that.

## Rejected

- **A separate saved-setup / template store that a trip rig is instantiated from.** The
  tidy-looking option. It duplicates the gear shape into a second entity, needs a second
  write path and a second migration, and gives two answers to "what was I fishing with" —
  precisely the drift ADR 003 §3 exists to prevent. One append-only table with a lineage
  id says everything the template table would, and cannot disagree with itself.
- **Grouping the Quiver by `name`.** No new field, no migration, and wrong within a week:
  renaming forks a rod in two, and two rods left unnamed merge into one.
- **Grouping by a gear fingerprint.** Makes re-rigging — the normal act — destroy the
  rod's identity.
- **Clearing `retired_at` on the existing row to bring a rod back.** One row instead of
  two, and it mutates a record the server explicitly revokes UPDATE on. Retirement was a
  fact that was true; unmaking it silently rewrites what the trip looked like.
- **Deriving `quiver_id` lazily in the view instead of persisting it.** The derivation
  would have to be recomputed identically by the Swift client from the same ambiguous
  inputs, forever. An identity that two clients each guess at is not an identity.
- **Reel size as a shared vocabulary with a `system` tag on each value** (`{value:
  "4000", system: "spinning"}`). More general, and it pushes the filtering decision into
  every consumer instead of answering it once in the registry. Type-scoped sets answer it
  in the data, where it can be read.
- **Clearing the size when the reel type changes.** Loses the angler's own input to fix
  a display concern.
