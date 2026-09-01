# 09 — Fish Log

**Status:** Built as a local-first web prototype · **First slice:** 2026-09-01 ·
**Second slice (quick mark + shell):** 2026-09-01
(product spec: the Fish Log specification supplied by the founder, 2026-09-01)

## Job

An angler holding a fish, on a moving boat, in the sun, with wet hands and no signal,
records what they caught in under ten seconds. Underneath, the app builds a structured
history that will later answer "what actually works for me."

Those two sentences pull in opposite directions, and every decision below is about
which one wins where. The short version: **the angler's time wins at the glass, and
data integrity wins in the store.** Nothing is asked for that can be captured or
inferred, and nothing is invented that was not observed.

## The headline finding: this was not a schema project

The spec (§38, §47, §48) asks for an architecture review before building tables, and
lists conceptual entities: `catches`, `species`, `gear_items`, `catch_gear`,
`catch_environment`, `trips`, `locations`.

**Almost all of it already exists**, in `supabase/migrations/20260828120000_v1_core_schema.sql`,
and it is better specified than the sketch in §39 — it already has the D22 mark
lifecycle, the D21a sticky rig, timezone-safe local-date bucketing, soft deletes, sync
columns and RLS. So this slice is a UI and local-store feature built on the existing
ontology, and exactly **one** additive migration was written.

| Spec asks for | What it maps to | New? |
|---|---|---|
| `catches` | `public.catch` | existing |
| `species` | `public.species` (text ids, aliases, roll-ups) | existing |
| `trips` | `public.trip` | existing |
| `catch_environment` | `public.condition_snapshot` | existing |
| `locations` | `public.spot` (+ `geo_cell_*` grids) | existing |
| `gear_items` | `public.tackle_item` | existing |
| `catch_gear` | `public.catch_gear` | **added** |
| `tags` / `catch_tags` | `catch.tags` (array, local) | see *Deviations* |

### The one migration

`supabase/migrations/20260901120000_v1_catch_gear.sql` — additive only. Nothing existing
is altered or dropped.

`catch` already had `tackle_item_id`, which is one lure. Spec §14 is explicit that the
system must not be built around a single `gear_id`: a catch involves a rod, a reel, a
main line, a leader and a jig, and "which leader was on when the big ones bit" is a
question the log exists to answer. `catch.tackle_item_id` is **kept and still written** —
it is what D21a's rig inheritance and the existing analytics views read — and the new
table carries the full rig beside it.

Each gear row stores `tackle_item_id` *and* a `label`/`detail` snapshot, which is spec
§15's requirement: the FK is `ON DELETE SET NULL`, so when the angler deletes that jig
from their Tackle Box six months later, the catch still says what was actually tied on.
The id answers "how has this jig performed"; the snapshot keeps the history true after
the id is gone. This is verified against a real PostgreSQL 16, not asserted.

## Answers to the spec's §48 review questions

1. **Trips optional, implicit, or auto-created?** *Implicit.* `catch.trip_id` is NOT NULL
   because a catch with no trip has no effort denominator (§12), and §11 forbids making
   the angler create one. Both hold: the first catch of a session silently opens a trip
   and later catches join it. The angler is never asked, and never sees the word.
2. **Trip → Catch relationship?** One trip, many catches; the existing FK. A trip is
   "open" until explicitly ended. An abandoned trip is a real thing that happened and is
   not tidied away.
3. **Species normalization?** Already normalized: `public.species`, stable text ids, with
   group roll-ups. Mirrored into `src/core/ontology/species.ts` so the one required field
   on a catch works with no signal. `species_other` is a separate column for the genuine
   unknown, so free text can never be mistaken for an id.
4. **Catch ↔ Tackle Box?** `catch_gear`, above.
5. **Historical accuracy when gear changes?** Id plus snapshot, `ON DELETE SET NULL`.
6. **Locations embedded, relational, or hybrid?** Hybrid, as built: `spot_id` for the
   named place, plus `lat`/`lng` and derived `geo_cell_1km`/`geo_cell_10km` on the catch.
7. **What to snapshot?** `condition_snapshot`, one row per catch.
8. **Raw vs derived?** Raw. `moon_phase_angle_deg` and `moon_illumination_fraction` are
   stored; no bite score, no "good moon", nothing derived that a better algorithm would
   later want to recompute (§18).
9. **Provider provenance?** `provenance` jsonb + `enrichment_status` + `snapshot_basis`,
   all already in the schema. A snapshot written here is `partial`, never `complete` —
   see *Conditions* below.
10. **Editing an old catch's timestamp?** Not yet implemented; see *Not built*.
11. **Offline persistence?** IndexedDB, per ADR 004 §1. Details below.
12. **Offline id generation?** UUIDv7 minted on device (`src/core/sync/uuid.ts`), with
    vectors. Time-ordered, so it doubles as the idempotency key and sorts by creation.
13. **Sync conflict resolution?** ADR 004 §4, unchanged. The envelope and its state
    machine are implemented in `src/core/sync/outbox.ts`; the flusher is not (below).
14. **Indexes now?** `catch_gear` gets catch, tackle and sync-cursor indexes. The local
    store indexes `catch` by trip and by local date.
15. **Protecting exact locations?** Coordinates are never rendered — the detail screen
    says "Saved privately with this catch" and nothing more. RLS on every table is
    verified to block cross-angler reads, inserts and deletes, and `anon` has no access
    at all. Privacy is enforced at the data layer, not by hiding it visually (§37).
16. **10,000+ catches?** Measured, not assumed: see *Numbers*.
17. **Existing structures that should replace the proposal?** Yes — nearly all of it.
    See the table above.

## What was built

- **`/log`** — the Fish Log home. `+ Log catch`, recent catches grouped by local day,
  search, and three views (All / Favorites / Needs details). Deliberately not a
  dashboard: analytics belong to their own feature (§8, §33).
- **Quick Log** — one thing above the fold, species, and Save live from the first tap.
  Everything else is behind **Add details**. Save never blocks.
- **Species picker** — recent first, then a curated common set, then all species behind
  one tap, then search, then "Something else" free text. Recent-first is the design:
  during a hot bite the fish you just caught is the fish you are about to catch again.
- **Repeat and Duplicate** (§6, §7) — "Save & log another" reopens the sheet with the
  same setup and a new timestamp; Duplicate does the same from any past catch. Both
  carry *how you were fishing* and deliberately not *this fish*: weight, length and
  notes never copy forward, because copying them manufactures data.
- **Catch detail** — sections that render only when they hold something, plus Edit-by-
  duplicate, Favorite, and a two-step Delete.
- **The quick mark (D22)** — the shell button that has said "wired when logging lands"
  since the shell round is now wired. It writes an `unresolved` row: no species, no
  outcome, excluded from every rate until a human says what happened.
- **Photos** — stored as blobs on the device, in their own object store so a list query
  never drags megabytes along. EXIF is deliberately not read for time or place (§25).

## Local-first, and what "saved" means

Per ADR 004: every read comes from IndexedDB and the network fills it in later. A row
and its outbox mutation are written in **one transaction** — if the tab dies between
them, either both landed or neither did. A catch that existed locally with nothing
queued would never sync and nobody would know; that is the quiet data-loss bug this
shape prevents.

The vocabulary at the glass is ADR 004 §6's: "Saved to this device", then "N waiting to
back up". Offline is a normal state, never an error, and the word "failed" does not
appear while retries remain.

### The bug worth naming

The first build warmed the GPS when the sheet opened and **awaited the fix at save
time**. On a phone without a recent fix that is the full timeout — four seconds of
nothing, against a five-to-ten-second target for the whole catch, and a direct breach of
§21. It was caught by measuring the save, not by reading the code.

The fix is the rule now written into `startPositionRequest`: the position is *read*,
never awaited. Whatever has arrived is used; a fix that lands afterwards is patched on
silently. The same rule already governed the quick mark, and now both share it.

## Conditions (§16–§19)

`PLAN.md` §1 cuts live enrichment from the web prototype: tide and weather are fetched
server-side later and every web write lands `pending`. That cut is honoured.

Sun and moon are the exception, and the reason is D25: they are **computed on device**
from the instant and the coordinates — no API, no key, no network, as available on a
boat as on wifi. Leaving them null to ask a server later would be worse data for no gain.

So a snapshot is written `partial`, never `complete`: the astronomical fields are real
observations and the marine ones are genuinely still owed. Saying `complete` would be a
lie a future correlation would act on.

Tide state is not guessed at all. §19 forbids calling anything slack that was not
measured, and with no series fetched there is nothing honest to call.

## Numbers

Measured in headless Chromium at 390×844, production build.

| | |
|---|---|
| Basic catch — open sheet → saved and on screen | **225 ms** |
| Repeat catch — seeded species → saved | **47 ms** |
| Quick mark — tap → acknowledged | **46 ms** |
| Catch saved with the network **fully off** | **83 ms** |
| 10,000 catches — log opens | **655 ms**, 433 DOM nodes |
| 10,000 catches — search keystroke → repaint | **97 ms** |
| 10,000 catches — logging one more | **719 ms** |

The 5–10 second target in §2 is a *human* budget; the app's share of it is about a fifth
of a second. The list pages at 50, so the DOM stays small however long the history gets.

## Checks

- `npm run verify` green — tokens, tripwires, lint, tsc, **265 tests**. `npm run build`
  green, `/log` static.
- **32 functional browser checks** at 390×844, zero console errors: the full log/repeat/
  duplicate/delete/favorite/search path, the mark landing in the needs-details queue, no
  horizontal overflow at 390 px and 320 px, every visible control clearing a 44 px touch
  floor.
- **19 harder checks**: a catch saved with the network completely off and still present
  after reload; 10,000-catch scale; and a keyboard-only sweep including focus moving to
  "Keep it" when the delete confirm opens rather than falling to `<body>`.
- **The migration was run against a real PostgreSQL 16**, not eyeballed: all six
  migrations apply in order; deleting a tackle item leaves the catch's gear label intact
  with the link nulled (§15); blank labels and unknown roles are refused; two jigs on one
  catch are allowed; RLS blocks cross-angler read, insert and delete; `anon` has nothing.
- **Not tested on a real phone.** Same open item as the tide chart and the Tackle Box.

## Deviations from the spec, stated plainly

1. **No `tags`/`catch_tags` tables.** Tags are a `text[]` on the catch locally. §27 says
   tags should stay flexible and there is no tag UI yet; a join table with no writer is
   speculative schema. It graduates by ADR when something actually filters on it.
2. **`catch.tackle_item_id` was kept** rather than replaced by `catch_gear`. Removing it
   would break D21a rig inheritance and the shipped analytics views for no gain.
3. **Enrichment is `partial`, not `pending`**, when a position fix exists — because the
   on-device astro fields are genuinely observed. This is a deliberate refinement of
   PLAN §1's "everything lands pending", explained above.
4. **The prototype writes as one hard-coded local angler.** There is no auth session
   wired to the log yet, so `LOCAL_ANGLER_ID` stands in. The RLS that makes this safe on
   the server is in place and verified; the client simply has no session to read yet.

## Not built (and deliberately so)

- **The outbox flusher.** The envelope, the retry schedule, the conflict rules and the
  "what the glass may say" states are implemented and tested; the code that actually
  PUSHes to PostgREST and pulls with the `updated_at` cursor is not. It cannot be
  written honestly without a live backend to test against, and a sync layer that has
  never round-tripped is worse than none, because it looks finished. Writes queue
  durably in the meantime and nothing is lost.
- **Editing a catch's timestamp** (§22's "if catch time changes, the environmental data
  must not silently remain attached as if it were correct"). Edit-by-duplicate covers
  correcting a record today. Time editing needs the snapshot to be invalidated and
  re-derived with it, which is the enrichment lane's job.
- **Trip UI.** Trips are created and joined implicitly and correctly; there is no screen
  for starting, ending, naming or reviewing one yet. `/trip/[id]` is still a stub.
- **Spot picking, batch quantity beyond a stepper, and the calendar's catch counts.**
- Everything in §45, which is explicitly out.

---

## Second slice — the quick mark becomes optional (2026-09-01)

The first slice put the quick mark at the top of every screen as the largest control in
the app. The founder's revision: it should not be there by default, it should be a
setting, and it should not cost anybody screen space they did not ask for.

**Simple by default. Fast when needed.**

### What changed

- **Settings → Fishing shortcuts → Quick Mark**, default **off**, persisted on the
  device. Off is the real default, not a nudge: an angler who never turns it on never
  sees it and never pays for it in layout.
- **The header collapsed.** With the button gone it carries only the backup badge, so it
  is a 47px status line instead of an 88px control bar. No hole where the button was.
- **When on, the action docks bottom-right**, above the nav, right-aligned to the same
  16px gutter every page's content uses — and that the tide screen uses for its own
  alignment line. It is not a float looking for space; it lands on an edge that already
  existed.
- **Undo in the confirmation**, per `03-touch-and-interaction.md` §5 — a mis-tap is
  corrected inside the toast's window, never by a dialog before the fact.
- **One preference system.** `preference.ts` now holds the storage mechanics (localStorage,
  ref-gated `useSyncExternalStore`, same-tab change event) that `units.ts` had worked out,
  and both preferences go through it. A second preference did not become a second
  implementation of the same careful hydration handling.

### This placement is not a new idea — it is the one already written down

`05-app-shell.md` §1 already specifies the shell's primary action as *"docked at the
bottom per `03-touch-and-interaction.md` §3 — this is where the quick mark lives."* The
first slice's header placement contradicted the design system. This slice makes the code
agree with the document rather than inventing a third position.

### The conflict, and why the button is still 88px

The revision asks for something compact that does not dominate. `03-touch-and-interaction.md`
§1 and §5 size this specific control at 88px (`primary-quick-mark`) because it is meant
to be used **by feel, not by sight** — the founder's own framing is "you click it without
looking." Those two pull against each other, so, rather than silently shrinking it:

**The touch target stays 88px. What changed is where it lives and whether it is there at
all.** Shrinking it to look tidier would break the single property it exists for. As
built it is 110×88 in the bottom corner, about 3% of a 390×844 screen, and off by
default — which is what "does not dominate" actually asks for. Flagged rather than
decided quietly; say the word and it drops to the 68px `primary-standard` target.

### Why it is still absent from the tide screen

Every placement that fits costs the tide screen something it is not allowed to spend:
floating it bottom-right puts it over the timeline the angler scrubs horizontally, and
folding it into the date bar breaks that row's centred three-column symmetry. Giving it a
home there is a design decision for the tide screen itself, and this revision was
explicitly told not to redesign Tide. It stays off that route, as it already was.

### The bug the screenshots caught and the assertions did not

The first version used `sticky bottom-0`, which pins to the *viewport* bottom — the same
place the nav lives — so the button sat on top of the Settings tab. A bounding-box check
passed anyway, because it measured a scroll position where the two happened not to
overlap.

It now hangs at `bottom-full` off a shared bottom dock, which is exactly the nav's top
edge, so the two cannot overlap however tall either becomes — no hardcoded nav height to
go stale. There is a check that hit-tests every nav tab, not just its rectangle.

### Checked

- `npm run verify` green — **281 tests**, `npm run build` green.
- **37 browser checks** at 390×844, zero console errors: absent by default on four
  routes; the switch defaults off, toggles, and survives reload; when on, the action is
  gutter-aligned, above the nav, and every nav tab is hit-testable; marks still land in
  Needs details as unresolved; Undo removes the mark it just made; a mark still saves
  with the network fully off (46 ms); disabling leaves no reserved space (96px → 24px);
  the tide screen keeps no status line, no overlay and no vertical scroll; no horizontal
  overflow at 390 px or 320 px.
- **11 checks on the units preference**, because migrating `units.ts` onto the shared
  factory was the real regression risk: the tide screen still defaults to feet, switches
  to metres, and remembers the choice across a reload.
- Catch logging measured again after the change: **193 ms**, species picker unchanged.
