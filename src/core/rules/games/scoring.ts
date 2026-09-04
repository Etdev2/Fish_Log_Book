/**
 * The Boat Games scoring fold (ADR 009 §3).
 *
 * One function decides every score in every mode: `score(rules, participants, events)`.
 * Nothing is stored — the scoreboard is *derived* on every read, and that is what makes
 * four of the founder's acceptance criteria structural rather than things to remember:
 *
 *   - **A catch cannot score twice.** Events fold by `id`, once. A double-tap on a wet
 *     screen either writes one row or writes two rows carrying the same id, and IndexedDB
 *     `put` makes those the same row.
 *   - **Undo works.** A `void` event names the event it undoes and the fold skips it.
 *     Nothing is mutated or deleted, so a correction is additive and the history survives.
 *   - **Three modes, one engine.** Captain's Cup, Fish Cricket and Make the Cut differ
 *     only in their `GameRules`. So will Species Sprint, Grand Slam and the rest.
 *   - **Order never depends on the clock.** Events fold in `seq` order. Offline the device
 *     clock is the only clock available and the angler can change it in Settings; a game
 *     must not reorder itself because somebody fixed their timezone at the dock.
 *
 * Pure. The two facts it needs about a species — what it rolls up to, and whether it is
 * protected — arrive as functions, the same way `evaluateBadges` takes `waterClassOf`,
 * so this file can be tested without the ontology and the Swift client can be checked
 * against the same vectors.
 */

import type {
  GameEvent,
  GameParticipant,
  GameRules,
  RepeatRule,
  Tiebreaker,
} from "./types";

/** The two ontology facts the fold needs, injected so the rules stay pure (ADR 003 §3). */
export interface ScoringContext {
  /** The group a species belongs to (`vermilion_rockfish` -> `rockfish`), or null. */
  readonly rollsUpTo: (speciesId: string) => string | null;
  /** Protected in the ontology, independent of any regional pack. */
  readonly isProtected: (speciesId: string) => boolean;
}

/**
 * Why an event scored what it did. Every zero has a named reason, because "this fish got
 * nothing" is the moment an angler needs a sentence and not a shrug.
 */
export type EventScoreStatus =
  | "scored"
  | "voided"
  | "pending_approval"
  | "zero_unresolved"
  | "zero_not_eligible"
  | "zero_protected"
  | "zero_illegal_retention"
  | "zero_repeat_cap"
  | "zero_eliminated";

export interface AppliedBonus {
  readonly kind: "first_blood" | "new_species" | "personal_best" | "release" | "biggest_of_round";
  readonly points: number;
}

export interface ScoredEvent {
  readonly event: GameEvent;
  readonly points: number;
  readonly base_points: number;
  readonly bonuses: readonly AppliedBonus[];
  readonly status: EventScoreStatus;
  /** One plain sentence, ready to render. Null when it simply scored. */
  readonly reason: string | null;
  /** Marks added, for Fish Cricket. Zero in the other modes. */
  readonly marks: number;
  /** The target this catch counted toward, for Fish Cricket. */
  readonly target: string | null;
}

export interface Standing {
  readonly participant_id: string;
  readonly team_id: string | null;
  readonly points: number;
  readonly handicap: number;
  readonly scoring_catches: number;
  readonly total_catches: number;
  readonly released: number;
  readonly unique_species: readonly string[];
  /** Fish Cricket: target -> marks accrued (capped at `marks_to_close`). */
  readonly marks: Readonly<Record<string, number>>;
  readonly closed: readonly string[];
  /** Make the Cut: the round at the end of which they were eliminated. */
  readonly eliminated_round: number | null;
  readonly rank: number;
}

export interface TeamStanding {
  readonly team_id: string;
  readonly points: number;
  readonly participant_ids: readonly string[];
  readonly eliminated_round: number | null;
  readonly rank: number;
}

export interface GameStandings {
  readonly rows: readonly Standing[];
  readonly teams: readonly TeamStanding[];
  /** The round currently in play (1-based). */
  readonly round: number;
  readonly leader_id: string | null;
  /** Every event in fold order, scored — the timeline and the review list read this. */
  readonly events: readonly ScoredEvent[];
  readonly paused: boolean;
  readonly complete: boolean;
  /** More than one id means a genuine tie the tiebreaker could not split. */
  readonly winner_ids: readonly string[];
}

// ---------------------------------------------------------------------------------
// Eligibility and points for one catch
// ---------------------------------------------------------------------------------

/**
 * Does `speciesId` match `ruleId`, where `ruleId` may name a group?
 *
 * Exact match first, then one hop up the roll-up chain. One hop is enough for the current
 * ontology (a species rolls up to a group; groups do not nest), and the loop below is
 * bounded anyway so a future nested group cannot spin.
 */
export function speciesMatches(
  speciesId: string,
  ruleId: string,
  ctx: ScoringContext,
): boolean {
  if (speciesId === ruleId) return true;
  let cursor: string | null = speciesId;
  for (let hops = 0; hops < 4 && cursor !== null; hops += 1) {
    cursor = ctx.rollsUpTo(cursor);
    if (cursor === ruleId) return true;
  }
  return false;
}

function tierPointsFor(
  speciesId: string,
  rules: GameRules,
  ctx: ScoringContext,
): number {
  // An exact species tier beats a group tier, so "Bluefin 8" wins over "Tuna 3".
  const exact = rules.scoring.tiers.find((t) => t.species_id === speciesId);
  if (exact) return exact.points;
  const group = rules.scoring.tiers.find((t) => speciesMatches(speciesId, t.species_id, ctx));
  if (group) return group.points;
  return rules.scoring.default_points;
}

function isEligible(speciesId: string, rules: GameRules, ctx: ScoringContext): boolean {
  const eligible = rules.scoring.eligible_species;
  if (eligible === null) return true;
  return eligible.some((id) => speciesMatches(speciesId, id, ctx));
}

/**
 * The repeat rule, applied to the Nth scoring catch of a species by one participant.
 * `priorCount` is how many already scored. Returns the base value this one earns.
 */
export function repeatValue(base: number, priorCount: number, rule: RepeatRule): number {
  switch (rule.kind) {
    case "unlimited":
      return base;
    case "unique_only":
      return priorCount === 0 ? base : 0;
    case "capped":
      return priorCount < rule.count ? base : 0;
    case "diminishing": {
      // Full, half, quarter… floored at one point so a repeat is never worth nothing
      // while the rule still says catches count. Zero is what `capped` is for.
      const divided = Math.floor(base / 2 ** priorCount);
      return Math.max(1, divided);
    }
  }
}

/** The single largest fish among a set of scored catches. Weight first, then length. */
function largestOf(events: readonly ScoredEvent[]): readonly string[] {
  let best: { weight: number; length: number } | null = null;
  for (const scored of events) {
    const weight = scored.event.weight_g ?? 0;
    const length = scored.event.length_mm ?? 0;
    if (weight === 0 && length === 0) continue;
    if (
      best === null ||
      weight > best.weight ||
      (weight === best.weight && length > best.length)
    ) {
      best = { weight, length };
    }
  }
  if (best === null) return [];
  const winner = best;
  return events
    .filter(
      (s) =>
        (s.event.weight_g ?? 0) === winner.weight &&
        (s.event.length_mm ?? 0) === winner.length,
    )
    .map((s) => s.event.id);
}

// ---------------------------------------------------------------------------------
// The fold
// ---------------------------------------------------------------------------------

interface WorkingRow {
  points: number;
  scoring_catches: number;
  total_catches: number;
  released: number;
  species: Set<string>;
  speciesScoringCount: Map<string, number>;
  marks: Map<string, number>;
  eliminated_round: number | null;
}

export function score(
  rules: GameRules,
  participants: readonly GameParticipant[],
  events: readonly GameEvent[],
  ctx: ScoringContext,
): GameStandings {
  const active = participants.filter((p) => p.removed_at === null);
  const rows = new Map<string, WorkingRow>();
  for (const p of active) {
    rows.set(p.id, {
      points: p.handicap_points,
      scoring_catches: 0,
      total_catches: 0,
      released: 0,
      species: new Set(),
      speciesScoringCount: new Map(),
      marks: new Map(),
      eliminated_round: null,
    });
  }

  /*
    Fold order is `seq`, and each id folds exactly once.

    The dedup is not belt-and-braces over IndexedDB's `put`. It is the guarantee itself:
    the founder's criterion is "a catch cannot score twice", and the only way to mean that
    is for the *scoring* to be idempotent, whatever the caller hands it. A retried write, a
    double-tap that re-fires a handler, a Phase 2 sync that replays an event already
    present — all of them arrive here as a duplicate id, and all of them score once.
  */
  const seen = new Set<string>();
  const ordered = [...events]
    .sort((a, b) => (a.seq === b.seq ? (a.id < b.id ? -1 : 1) : a.seq - b.seq))
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  const voided = new Set<string>();
  for (const e of ordered) {
    if (e.kind === "void" && e.voids_event_id !== null) voided.add(e.voids_event_id);
  }

  const scored: ScoredEvent[] = [];
  const roundCatches = new Map<number, ScoredEvent[]>();
  let round = 1;
  let paused = false;
  let complete = false;
  let firstBloodTaken = false;

  const closedTargets = (): Map<string, Set<string>> => {
    const out = new Map<string, Set<string>>();
    for (const [id, row] of rows) {
      const set = new Set<string>();
      for (const [target, marks] of row.marks) {
        if (marks >= (rules.cricket?.marks_to_close ?? 3)) set.add(target);
      }
      out.set(id, set);
    }
    return out;
  };

  for (const event of ordered) {
    if (event.kind === "paused") {
      paused = true;
      continue;
    }
    if (event.kind === "resumed") {
      paused = false;
      continue;
    }
    if (event.kind === "void") {
      scored.push(blank(event, "voided", null));
      continue;
    }
    if (event.kind === "adjustment") {
      const row = event.participant_id === null ? undefined : rows.get(event.participant_id);
      const delta = event.adjustment_points ?? 0;
      if (row) row.points += delta;
      scored.push({ ...blank(event, "scored", event.note), points: delta });
      continue;
    }
    if (event.kind === "round_advanced") {
      applyRoundEnd(round);
      round += 1;
      if (round > rules.rounds.count) {
        complete = true;
        round = rules.rounds.count;
      }
      scored.push(blank(event, "scored", null));
      continue;
    }

    // --- a catch ------------------------------------------------------------------
    const row = event.participant_id === null ? undefined : rows.get(event.participant_id);
    if (!row) {
      scored.push(blank(event, "voided", "This player was removed from the game."));
      continue;
    }
    if (voided.has(event.id)) {
      row.total_catches += 1;
      scored.push(blank(event, "voided", "Undone."));
      continue;
    }

    row.total_catches += 1;
    if (event.disposition === "released") row.released += 1;

    const zero = (status: EventScoreStatus, reason: string): void => {
      scored.push(blank(event, status, reason));
    };

    if (rules.host_approval && !event.approved) {
      zero("pending_approval", "Waiting for the captain to confirm this one.");
      continue;
    }
    if (row.eliminated_round !== null) {
      zero("zero_eliminated", "Out of the running — this fish still counts on the trip.");
      continue;
    }
    if (event.species_id === null) {
      // An unresolved Quick Mark scores nothing until somebody says what it was.
      zero("zero_unresolved", "No species yet — name the fish and it scores.");
      continue;
    }
    const speciesId: string = event.species_id;
    if (ctx.isProtected(speciesId) || event.legal?.protected_species === true) {
      zero("zero_protected", "Protected species. No points, and none were ever available.");
      continue;
    }
    if (event.legal !== null && event.legal.verdict === "release" && event.disposition === "kept") {
      // The game never pays for a fish that should have gone back.
      zero("zero_illegal_retention", `Kept against the rules — ${event.legal.reason}`);
      continue;
    }
    if (!isEligible(speciesId, rules, ctx)) {
      zero("zero_not_eligible", "Not a target in this game.");
      continue;
    }

    const base = tierPointsFor(speciesId, rules, ctx);
    const prior = row.speciesScoringCount.get(speciesId) ?? 0;
    const earned = repeatValue(base, prior, rules.scoring.repeat);

    if (earned === 0) {
      row.species.add(speciesId);
      zero("zero_repeat_cap", "Already scored the limit for this species.");
      continue;
    }

    const bonuses: AppliedBonus[] = [];
    const b = rules.scoring.bonuses;
    if (!firstBloodTaken && b.first_blood > 0) {
      bonuses.push({ kind: "first_blood", points: b.first_blood });
      firstBloodTaken = true;
    }
    if (event.new_species && b.new_species > 0) {
      bonuses.push({ kind: "new_species", points: b.new_species });
    }
    if (event.personal_best && b.personal_best > 0) {
      bonuses.push({ kind: "personal_best", points: b.personal_best });
    }
    if (event.disposition === "released" && b.release > 0) {
      bonuses.push({ kind: "release", points: b.release });
    }

    // Fish Cricket marks. A closed target keeps scoring points until everyone closes it.
    let marks = 0;
    let target: string | null = null;
    let targetWasClosed = false;
    if (rules.cricket !== null) {
      const cricket = rules.cricket;
      target = cricket.targets.find((t) => speciesMatches(speciesId, t, ctx)) ?? null;
      if (target !== null) {
        const held = row.marks.get(target) ?? 0;
        // Read BEFORE the marks land. The catch that closes a target closes it and stops
        // there; the next one scores. Same as the darts game this borrows from, and the
        // reason the read is separated from the write rather than folded into it.
        targetWasClosed = held >= cricket.marks_to_close;
        if (!targetWasClosed) {
          marks = event.personal_best && cricket.personal_best_marks
            ? 3
            : isSizeBonus(event) && cricket.size_bonus_marks
              ? 2
              : 1;
          row.marks.set(target, Math.min(cricket.marks_to_close, held + marks));
        }
      }
    }

    const bonusTotal = bonuses.reduce((sum, x) => sum + x.points, 0);
    // In Cricket a target that is not yet closed earns marks, not points; points only
    // start once this player has closed it and an opponent has not.
    const pointsFromCatch =
      rules.cricket === null ? earned : cricketPoints(event, target, earned, targetWasClosed);
    const total = pointsFromCatch + bonusTotal;

    row.points += total;
    row.scoring_catches += 1;
    row.species.add(speciesId);
    row.speciesScoringCount.set(speciesId, prior + 1);

    const entry: ScoredEvent = {
      event,
      points: total,
      base_points: pointsFromCatch,
      bonuses,
      status: "scored",
      reason: null,
      marks,
      target,
    };
    scored.push(entry);
    const bucket = roundCatches.get(round) ?? [];
    bucket.push(entry);
    roundCatches.set(round, bucket);
  }

  /**
   * Cricket points: only a target this player had ALREADY closed pays, and only while at
   * least one opponent still has it open. Once everybody has closed it the target is dead
   * and catching it is worth nothing — that pressure to move on is the whole game.
   */
  function cricketPoints(
    event: GameEvent,
    target: string | null,
    earned: number,
    wasClosed: boolean,
  ): number {
    if (target === null || !wasClosed) return 0;
    const closed = closedTargets();
    const everyoneElseClosed = active
      .filter((p) => p.id !== event.participant_id)
      .every((p) => closed.get(p.id)?.has(target) === true);
    return everyoneElseClosed ? 0 : earned;
  }

  /** Round boundary: the biggest-fish bonus, then elimination, then any score reset. */
  function applyRoundEnd(finished: number): void {
    const bonus = rules.scoring.bonuses.biggest_of_round;
    if (bonus > 0) {
      for (const id of largestOf(roundCatches.get(finished) ?? [])) {
        const owner = scored.find((s) => s.event.id === id)?.event.participant_id;
        const row = owner === null || owner === undefined ? undefined : rows.get(owner);
        if (row) row.points += bonus;
      }
    }

    if (rules.elimination !== null) {
      const standing = [...rows.entries()]
        .filter(([, r]) => r.eliminated_round === null)
        .sort((a, b) => b[1].points - a[1].points);
      const survivors = eliminate(standing, rules.elimination.rule);
      for (const [id, row] of standing) {
        if (!survivors.has(id)) row.eliminated_round = finished;
      }
    }

    if (!rules.rounds.carry_scores) {
      for (const [id, row] of rows) {
        const handicap = active.find((p) => p.id === id)?.handicap_points ?? 0;
        row.points = handicap;
        row.speciesScoringCount.clear();
      }
    }
  }

  const finalRows = rankRows(rows, active, rules.tiebreaker, scored);
  const teams = rankTeams(finalRows);
  const leader = finalRows.find((r) => r.eliminated_round === null) ?? finalRows[0] ?? null;

  return {
    rows: finalRows,
    teams,
    round,
    leader_id: leader ? leader.participant_id : null,
    events: scored,
    paused,
    complete,
    winner_ids: complete ? winnersOf(finalRows) : [],
  };
}

/** A "qualifying size" is any fish the angler actually measured. */
function isSizeBonus(event: GameEvent): boolean {
  return (event.weight_g ?? 0) > 0 || (event.length_mm ?? 0) > 0;
}

function blank(event: GameEvent, status: EventScoreStatus, reason: string | null): ScoredEvent {
  return {
    event,
    points: 0,
    base_points: 0,
    bonuses: [],
    status,
    reason,
    marks: 0,
    target: null,
  };
}

/** Who survives one round boundary. Returns the ids that stay in. */
function eliminate(
  standing: readonly (readonly [string, WorkingRow])[],
  rule: GameRules["elimination"] extends null ? never : NonNullable<GameRules["elimination"]>["rule"],
): Set<string> {
  const ids = standing.map(([id]) => id);
  if (ids.length <= 1) return new Set(ids);

  switch (rule.kind) {
    case "lowest": {
      // Everyone tied at the bottom goes. Two anglers on the same score both had the
      // same day, and silently keeping one of them is the kind of arbitrary the founder
      // would hear about on the drive home.
      const lowest = standing[standing.length - 1][1].points;
      return new Set(standing.filter(([, r]) => r.points > lowest).map(([id]) => id));
    }
    case "below_threshold":
      return new Set(standing.filter(([, r]) => r.points >= rule.points).map(([id]) => id));
    case "top_half": {
      const keep = Math.max(1, Math.ceil(ids.length / 2));
      return new Set(ids.slice(0, keep));
    }
  }
}

function rankRows(
  rows: Map<string, WorkingRow>,
  participants: readonly GameParticipant[],
  tiebreaker: Tiebreaker,
  scored: readonly ScoredEvent[],
): readonly Standing[] {
  const biggestBy = new Map<string, number>();
  for (const s of scored) {
    if (s.status !== "scored" || s.event.participant_id === null) continue;
    const size = s.event.weight_g ?? s.event.length_mm ?? 0;
    biggestBy.set(
      s.event.participant_id,
      Math.max(biggestBy.get(s.event.participant_id) ?? 0, size),
    );
  }

  const built = participants.flatMap((p) => {
    const row = rows.get(p.id);
    if (!row) return [];
    return [{
      participant_id: p.id,
      team_id: p.team_id,
      points: row.points,
      handicap: p.handicap_points,
      scoring_catches: row.scoring_catches,
      total_catches: row.total_catches,
      released: row.released,
      unique_species: [...row.species],
      marks: Object.fromEntries(row.marks),
      closed: [...row.marks.entries()].filter(([, m]) => m > 0).map(([t]) => t),
      eliminated_round: row.eliminated_round,
      rank: 0,
    }];
  });

  const sorted = [...built].sort((a, b) => {
    // An eliminated player never outranks one still fishing, whatever the score says.
    if ((a.eliminated_round === null) !== (b.eliminated_round === null)) {
      return a.eliminated_round === null ? -1 : 1;
    }
    if (b.points !== a.points) return b.points - a.points;
    switch (tiebreaker) {
      case "most_species":
        return b.unique_species.length - a.unique_species.length;
      case "biggest_fish":
        return (biggestBy.get(b.participant_id) ?? 0) - (biggestBy.get(a.participant_id) ?? 0);
      case "earliest_lead":
      case "shared_win":
        return 0;
    }
  });

  // Equal scores share a rank. 1, 2, 2, 4 — never 1, 2, 3, 4 with two equal totals.
  let lastPoints: number | null = null;
  let lastRank = 0;
  return sorted.map((r, i) => {
    const rank = r.points === lastPoints ? lastRank : i + 1;
    lastPoints = r.points;
    lastRank = rank;
    return { ...r, rank };
  });
}

function rankTeams(rows: readonly Standing[]): readonly TeamStanding[] {
  const byTeam = new Map<string, Standing[]>();
  for (const r of rows) {
    if (r.team_id === null) continue;
    byTeam.set(r.team_id, [...(byTeam.get(r.team_id) ?? []), r]);
  }
  const built = [...byTeam.entries()].map(([team_id, members]) => ({
    team_id,
    points: members.reduce((sum, m) => sum + m.points, 0),
    participant_ids: members.map((m) => m.participant_id),
    eliminated_round: members.every((m) => m.eliminated_round !== null)
      ? Math.max(...members.map((m) => m.eliminated_round ?? 0))
      : null,
    rank: 0,
  }));
  return built
    .sort((a, b) => b.points - a.points)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

function winnersOf(rows: readonly Standing[]): readonly string[] {
  const standing = rows.filter((r) => r.eliminated_round === null);
  const pool = standing.length > 0 ? standing : rows;
  if (pool.length === 0) return [];
  const top = pool[0].points;
  return pool.filter((r) => r.points === top).map((r) => r.participant_id);
}
