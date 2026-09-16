/**
 * The gate that decides whether a pooled figure may be shown at all.
 *
 * `ontology.md` §6 item 5 already names the problem — "a pooled result over three users
 * at one 10 km cell is a description of three specific people's fishing" — and assigns
 * the threshold to `biostat`, where it is still open. The numbers in `DEFAULT_K_CONFIG`
 * are this module's stated placeholders until that work lands; they live in one config
 * object precisely so replacing them is a value change and not a search.
 *
 * Three conditions, and all three must pass. k alone is not enough: five anglers where
 * one contributed 90% of the rows is a description of that one angler, and twenty catches
 * is the floor below which a "trend" is an anecdote.
 *
 * Pure, per ADR 003. Spec: `privacy-consent-and-data-governance.md` §6.5.
 */

export interface KAnonymityConfig {
  /** Minimum distinct anglers contributing to the cell-and-period. */
  readonly k: number;
  /** Maximum share of rows one angler may contribute, 0..1. */
  readonly maxDominance: number;
  /** Minimum catches, independent of how many anglers produced them. */
  readonly minCatches: number;
}

export const DEFAULT_K_CONFIG: KAnonymityConfig = {
  k: 5,
  maxDominance: 0.6,
  minCatches: 20,
};

export interface CellSample {
  readonly distinctAnglers: number;
  readonly catchCount: number;
  /** Rows contributed by the single largest contributor. */
  readonly maxSingleAnglerCatches: number;
}

export type SuppressionReason = "TOO_FEW_ANGLERS" | "SINGLE_ANGLER_DOMINATES" | "TOO_FEW_CATCHES";

export type KAnonymityVerdict =
  | { readonly kind: "ALLOWED" }
  | { readonly kind: "SUPPRESSED"; readonly reasons: readonly SuppressionReason[] };

export function dominanceRatio(sample: CellSample): number {
  if (sample.catchCount <= 0) return 0;
  return sample.maxSingleAnglerCatches / sample.catchCount;
}

/**
 * Every failing condition is returned, not the first one.
 *
 * A cell that fails on all three is a different operational fact from one that is a
 * single angler short of passing, and an analyst asking "why is this area blank" deserves
 * the whole answer. None of these reasons is ever shown to a user — the surface says
 * "not enough independent reports here yet" (`fisheries-intelligence-map.md` §7.3),
 * because naming the failing condition would hand an attacker a probe.
 */
export function kAnonymityVerdict(
  sample: CellSample,
  config: KAnonymityConfig = DEFAULT_K_CONFIG,
): KAnonymityVerdict {
  const reasons: SuppressionReason[] = [];

  if (sample.distinctAnglers < config.k) reasons.push("TOO_FEW_ANGLERS");
  if (sample.catchCount < config.minCatches) reasons.push("TOO_FEW_CATCHES");
  if (dominanceRatio(sample) > config.maxDominance) reasons.push("SINGLE_ANGLER_DOMINATES");

  return reasons.length === 0 ? { kind: "ALLOWED" } : { kind: "SUPPRESSED", reasons };
}

/**
 * Two overlapping queries whose difference isolates a small group.
 *
 * This is the attack k-anonymity alone does not stop: ask for a region, ask again for the
 * region minus one cell, and the difference is that cell — at whatever precision the
 * larger queries were allowed, and with none of the suppression that cell would have
 * failed on its own. `privacy-consent-and-data-governance.md` §11.6 requires the test
 * suite to cover it, so the rule lives in code rather than in a reviewer's memory.
 *
 * The rule: a difference is only publishable if the difference ITSELF would pass the
 * gate. Callers that serve aggregates over a caller-chosen bounding box must run this
 * against the previous response, which is why it takes two samples rather than one.
 */
export function differenceIsSafe(
  larger: CellSample,
  smaller: CellSample,
  config: KAnonymityConfig = DEFAULT_K_CONFIG,
): boolean {
  const difference: CellSample = {
    distinctAnglers: Math.max(0, larger.distinctAnglers - smaller.distinctAnglers),
    catchCount: Math.max(0, larger.catchCount - smaller.catchCount),
    /*
      The worst case, not the arithmetic one. We cannot know from counts alone how the
      dominant contributor is split between the two queries, so we assume the whole of the
      larger query's dominant share survives into the difference. Assuming the friendly
      case here would make the check pass exactly when it matters most.
    */
    maxSingleAnglerCatches: Math.min(
      larger.maxSingleAnglerCatches,
      Math.max(0, larger.catchCount - smaller.catchCount),
    ),
  };

  return kAnonymityVerdict(difference, config).kind === "ALLOWED";
}
