/**
 * The Fin ID scoring engine (`docs/specs/rockfish-identification.md` §4).
 *
 * Pure, like every rule here. The maths is the rockfish identifier's, unchanged in
 * behaviour and generalised in shape: multiply affinities so one ruling trait pulls hard,
 * normalise to shares of the surviving pool, and never present a share as a certainty.
 *
 * Two pieces of that spec the original code never implemented are implemented here,
 * because both are safety features rather than polish: §4.5's refusal to rank a field it
 * cannot separate, and §4.7's requirement that every candidate can say why it is there.
 */

import type { Candidate, Identification, TraitPack, TraitProfile } from "./types";

/** Neutral affinity — the answer tells us nothing about this species either way. */
const NO_SIGNAL = 0.5;

/**
 * Affinity for a species that is strongly some *other* option in the same question.
 *
 * The angler said black; this fish is emphatically red. That is evidence against, and
 * treating it as silence is how a confidently wrong answer gets produced.
 */
const CONTRADICTED = 0.15;

/** At or above this, a profile counts as "strongly marked" for an option. */
const STRONG = 1;

/** §4.6: a no-retention species this live is worth a banner even when it is not winning. */
export const RESTRICTED_WARNING_PCT = 5;

/** §4.5: below this many answers there is not enough to call a winner from. */
export const MIN_ANSWERS_TO_RANK = 2;

/**
 * §4.5: the top must clear the runner-up by this much to be called a winner. A 31/29 split
 * is a coin toss wearing a rosette, and presenting it as an answer is the failure mode the
 * whole spec is written against.
 */
export const MIN_LEAD_PCT = 10;

function optionOwner(pack: TraitPack, optionId: string) {
  return pack.questions.find((q) => q.options.some((o) => o.id === optionId)) ?? null;
}

/**
 * One answer's affinity for one species, and whether it counted for or against.
 *
 * Contradiction is derived from the pack's own questions rather than a parallel list of
 * groups, so adding a question cannot leave a stale group behind.
 */
function affinity(
  pack: TraitPack,
  profile: TraitProfile,
  optionId: string,
): { value: number; verdict: "for" | "against" | "neutral" } {
  const direct = profile.traits[optionId];
  if (direct !== undefined) {
    return { value: direct, verdict: direct >= STRONG ? "for" : "against" };
  }

  const question = optionOwner(pack, optionId);
  if (question !== null) {
    const strongestElsewhere = Math.max(
      0,
      ...question.options.map((o) => profile.traits[o.id] ?? 0),
    );
    if (strongestElsewhere >= STRONG) return { value: CONTRADICTED, verdict: "against" };
  }

  return { value: NO_SIGNAL, verdict: "neutral" };
}

function labelFor(pack: TraitPack, optionId: string): string {
  for (const question of pack.questions) {
    const option = question.options.find((o) => o.id === optionId);
    if (option !== undefined) return option.label;
  }
  return optionId;
}

/**
 * Rank a pack against a set of answers.
 *
 * Answers are option ids. "Not sure" is expressed by *not answering* (spec §5) — a
 * first-class choice that costs the angler nothing and tells the engine the truth, which
 * is better than a guess it would then treat as evidence.
 */
export function identify(pack: TraitPack, answers: readonly string[]): Identification {
  const scored = pack.profiles.map((profile) => {
    let score = 1;
    const supporting: string[] = [];
    const against: string[] = [];

    for (const optionId of answers) {
      const { value, verdict } = affinity(pack, profile, optionId);
      score *= value;
      if (verdict === "for") supporting.push(labelFor(pack, optionId));
      if (verdict === "against") against.push(labelFor(pack, optionId));
    }

    // No answers at all → a uniform field, which is what "no information" should look like.
    return { profile, score: answers.length === 0 ? 1 : score, supporting, against };
  });

  const total = scored.reduce((sum, s) => sum + s.score, 0) || 1;

  const candidates: Candidate[] = scored
    .map((s) => ({
      profile: s.profile,
      sharePct: Math.round((s.score / total) * 100),
      supporting: s.supporting,
      against: s.against,
    }))
    .sort((a, b) =>
      b.sharePct - a.sharePct ||
      // Ties break on name so the same answers always render the same order.
      (a.profile.commonName < b.profile.commonName ? -1 : 1),
    );

  const restricted = candidates.filter(
    (c) => c.profile.noRetention && c.sharePct >= RESTRICTED_WARNING_PCT,
  );

  // §4.5, in order of how honest each refusal is.
  let ranked = true;
  let reason: string | null = null;

  if (answers.length === 0) {
    ranked = false;
    reason = "Answer a question or two and this will start narrowing.";
  } else if (answers.length < MIN_ANSWERS_TO_RANK) {
    ranked = false;
    reason = "One answer is not enough to separate these. Try another question.";
  } else if (candidates.length > 1) {
    const lead = candidates[0].sharePct - candidates[1].sharePct;
    if (lead < MIN_LEAD_PCT) {
      ranked = false;
      reason = "These are too close to call from what you have told us. Look for another mark.";
    }
  }

  return { candidates, ranked, reason, restricted };
}

/** Definition problems, run by a test rather than at import (a bad pack fails a build). */
export function validatePack(pack: TraitPack): readonly string[] {
  const problems: string[] = [];
  const optionIds = new Set<string>();

  for (const question of pack.questions) {
    if (question.options.length < 2) {
      problems.push(`${pack.id}/${question.id}: a question needs at least two answers`);
    }
    for (const option of question.options) {
      if (optionIds.has(option.id)) {
        problems.push(`${pack.id}: option "${option.id}" appears in two questions`);
      }
      optionIds.add(option.id);
    }
  }

  for (const profile of pack.profiles) {
    for (const optionId of Object.keys(profile.traits)) {
      if (!optionIds.has(optionId)) {
        problems.push(`${pack.id}/${profile.speciesId}: "${optionId}" is not an answer to any question`);
      }
    }
    if (profile.keyFeatures.length === 0) {
      problems.push(`${pack.id}/${profile.speciesId}: no key features, so a ranking cannot be checked by hand`);
    }
  }

  if (pack.profiles.length < 2) problems.push(`${pack.id}: a pack of one species identifies nothing`);
  if (pack.source.trim() === "") problems.push(`${pack.id}: no source`);

  return problems;
}
