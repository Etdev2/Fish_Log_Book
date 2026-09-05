# 009 — Boat Games: participant ownership, and the event fold

**Date:** 2026-09-04 · **Status:** accepted
**Answers:** the founder's Boat Games handoff — "the architect should determine whether
guest catches extend the existing catch model or remain game-event records until claimed."
**Depends on:** `003-web-prototype-boundary.md` (pure core, vectors, folder law),
`004-offline-store-and-sync.md` (IndexedDB is the read path, ids minted on device),
`005-front-end-architecture.md` §2 (tokens).
**Supersedes:** nothing. **Amends:** `docs/specs/fishing-passport-wildlife-boat-games.md`
Part IV — the modes ship under the handoff's names (Boat Games, Captain's Cup, Fish
Cricket, Make the Cut), and the local one-device game comes first rather than at Phase 4.

## Context

The handoff asks for a game where four anglers on one boat score catches on the host's
phone, offline, with no accounts. The single hard requirement: *"If Mike catches a fish
and Elliott records it on Elliott's phone, Mike's catch must not appear in Elliott's
personal Passport, catch history, personal bests, or statistics."*

That is not a preference. It is a correctness constraint on data the founder already has
on his phone, with no server to re-derive from.

**The Passport reads the catch store wholesale.** `usePassport()`
(`src/features/passport/data.ts:77`) hands `log.catches` — every row in the IndexedDB
`catch` store — to `speciesSummaries`, `evaluateBadges` and `evaluateSlams`. Nothing in
`src/core/` or `src/features/passport/` filters by `angler_id`; grep finds the column only
in test fixtures and in the four places `src/features/catches/` writes
`LOCAL_ANGLER_ID`. It is written and never read.

So a guest's yellowtail written to the `catch` store is, in the same tick: a new species
in the founder's My Species grid, progress toward his badges, and a leg of his slam. There
is no filter to "add later" — it would have to be added in five call sites and kept
correct forever, and the first time someone forgets, the founder's Passport inflates
quietly and there is no way to tell which fish were his.

## The call

### 1. A game catch is a `game_event`. It is not a `catch` row.

Three new IndexedDB stores at `DB_VERSION = 4`: `game_session`, `game_participant`,
`game_event`.

`game_event` carries its own `species_id`, `length_mm`, `weight_g`, `disposition` and
`caught_at` — everything scoring needs. It does not need a catch row to exist, and for a
guest there is nothing to reference: the event *is* the record.

`game_event.catch_id` is nullable and set in exactly one case: the host tapped **also log
this to my book**, and the catch was then minted through the ordinary
`features/catches/create.ts` path so it arrives with its rig, location, conditions and
regulation snapshot like every other fish. The event references it; it never copies it.
This is spec §28's rule ("game events reference catches; they do not copy an editable
duplicate") in the direction the spec anticipated, and the guest direction is the case the
spec did not have to answer because it assumed accounts.

Consequences, stated plainly because they are visible to the angler:

- A guest's fish is not in anyone's Passport, because it is not in anyone's log. Correct.
- The host's own fish is in his log **only if he opted in**. A host who taps through a
  fast game entry and never opts in ends the trip with fish in the game and not in his
  book. That is the founder's chosen trade (fast entry beats complete records when three
  people are hauling fish), and the results screen should offer a bulk "log my game
  catches" so it is recoverable rather than lost.
- Phase 2 claiming needs no un-contamination step. A guest who creates an account claims
  their `participant_id`, and their events mint catch rows under *their* user. Nothing has
  to be moved out of anyone else's log, because it was never in it.

### 2. Game stores are written outside the outbox.

`commit()` in `src/lib/offline/db.ts` writes a row and its outbox mutation in one
transaction, and `ENTITY_STORES` is the syncable set. Adding the game stores to it would
queue mutations for Supabase tables that do not exist — every one would come back 4xx,
land in `rejected`, and put a permanent **needs attention** badge on the founder's phone
for a feature that is working correctly.

Phase 1 games are local-only, so they get their own write path (`commitLocal`, same
one-transaction discipline, no outbox). Phase 2 adds them to `ENTITY_STORES` at the same
time it adds the tables.

### 3. The scoreboard is a pure fold over events, never a stored number.

`src/core/rules/games/` — pure, no I/O, vector-policed, the same shape as
`core/rules/catch`. One function: `score(rules, events) -> Standings`.

This is not tidiness. It is how four acceptance criteria stop being things to remember:

- **"A catch cannot score twice."** Every event carries a client-minted uuidv7 as its
  idempotency key; the fold folds a key once. A double-tap on a moving boat writes one
  row or two rows with the same key, and either way scores once.
- **Undo and corrections.** Undo appends a `void` event naming the voided event's id and
  re-folds. A correction appends a `revise` event. Nothing is ever mutated, so correction
  history is free rather than a column somebody has to maintain.
- **Three modes, one engine.** Captain's Cup, Fish Cricket and Make the Cut are three
  `rules` configs over one fold, not three scoring systems. The future modes in the
  handoff (Species Sprint, Grand Slam, Bingo, Exact 21) are further configs.
- **Rounds are events, not a clock.** `round_advanced` is an event with a sequence number.
  A multi-day game advances when the host says so. The timer on a within-session game is a
  *display* of `started_at` plus a duration — it never decides anything. Offline, the
  device clock is the only clock and it can be changed in Settings; a game that ends
  because someone adjusted their phone is a bug this shape does not have.

### 4. Legal eligibility is snapshotted per event, from the pack that was current.

`regulationCard()` already returns a `KeepVerdict` and the numbers behind it, and
`buildRegulationSnapshot()` already freezes it onto a catch. A `game_event` snapshots the
same reading at scoring time, so a pack update next season does not rewrite a finished
game — the same stance the catch log already takes.

Scoring rules that fall out of it:

- Retained against a `release` verdict → zero points, flagged. The fish stays in the game
  record; only its score is zero.
- Released → full points. The game never needs a fish killed.
- No pack for the region → the card is null, and null means *nothing verified was
  knowable*, not *prohibited*. It scores normally and snapshots `legal_status: unknown`.
  Silence is not proof, in either direction.

**Gap this surfaced.** The handoff says protected species cannot be *selected as targets*.
`RegulationCard` cannot currently express that: `verdict: "release"` covers both "this
species is prohibited" and "the season is closed today", and those want opposite answers —
a prohibited species must not be a target, a closed-season species is a perfectly good
catch-and-release target. The reason is only in `verdictReason`, a human sentence, and
matching on it is the kind of string-sniffing that breaks silently when someone improves
the wording. `reg-engine.ts` needs to expose the distinction it already computes
internally (it has the `prohibited` row in hand at line ~144). Small, additive, and it
belongs to Fish Legal rather than to Games.

## What this does not decide

- **Handicap.** The handoff lists it under player setup, but no mode says what it does.
  Taken as a per-participant integer added once to the starting score and shown on the
  scoreboard — the only reading that works across all three modes. Flagged for the founder.
- **Connected play, photos, verification, leaderboards, tournaments.** Out of Phase 1 by
  the handoff's own instruction.
