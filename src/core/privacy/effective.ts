import { coarsestOf, type PrecisionLevel } from "./precision";

/**
 * How four independent rules combine into one answer: the coarsest wins, always.
 *
 * An angler's account default, a programme they joined, a per-catch "extra private"
 * switch and the species' own sensitivity policy are all allowed to say how precise a
 * disclosure may be. They are intersected, never unioned — which means joining a
 * programme can only ever make a disclosure coarser than the account default, and a
 * species policy can override an angler who is more relaxed than their local agency is
 * about a spawning aggregation.
 *
 * Spec: `docs/specs/expansion/privacy-consent-and-data-governance.md` §6.2, §6.3.
 * Pure, per ADR 003.
 */

/**
 * Per-species, per-region sensitivity. `standard` adds nothing; the other two set a
 * floor that no consent can lower.
 *
 * `protected` — rare, listed, spawning-aggregating or heavily targeted.
 * `suppressed` — a spot disclosure is a poaching risk, so it never reaches a shared
 * surface at all. That last part is not expressible as a precision level, which is why
 * `excludedFromSharedSurfaces` is a separate field on the result rather than a sixth
 * rung on the ladder.
 */
export type SpeciesLocationPolicy = "standard" | "protected" | "suppressed";

export interface SpeciesPolicyRule {
  readonly policy: SpeciesLocationPolicy;
  readonly minPrecision: PrecisionLevel;
  readonly temporalDelayDays: number;
}

/**
 * The defaults this module falls back to when no row exists for a species in a region.
 *
 * A MISSING policy is treated as `protected`, not as `standard`. Failing closed is the
 * whole posture: a species nobody has classified yet is a species nobody has checked, and
 * the cost of being too careful with a common fish is a coarser map, while the cost of
 * being too relaxed with an unclassified rare one is a dead animal.
 */
export const DEFAULT_SPECIES_POLICY: Readonly<Record<SpeciesLocationPolicy, SpeciesPolicyRule>> = {
  standard: { policy: "standard", minPrecision: "CELL_10KM", temporalDelayDays: 0 },
  protected: { policy: "protected", minPrecision: "CELL_50KM", temporalDelayDays: 30 },
  suppressed: { policy: "suppressed", minPrecision: "ZONE", temporalDelayDays: 90 },
};

export const UNCLASSIFIED_SPECIES_POLICY: SpeciesPolicyRule = DEFAULT_SPECIES_POLICY.protected;

export interface DisclosureInputs {
  /** The angler's own default in Settings. Absent means they have never chosen. */
  readonly accountLevel?: PrecisionLevel;
  /** The programme, project or grant asking. Absent means no programme is involved. */
  readonly programLevel?: PrecisionLevel;
  /** `extra_private` on this one catch. */
  readonly catchOverride?: PrecisionLevel;
  /** The species policy for this species in this region. Absent = unclassified. */
  readonly speciesPolicy?: SpeciesPolicyRule;
  /** Programme-requested delay, in days. Combined with the species delay by taking the longer. */
  readonly programTemporalDelayDays?: number;
}

export interface EffectiveDisclosure {
  readonly level: PrecisionLevel;
  readonly temporalDelayDays: number;
  readonly excludedFromSharedSurfaces: boolean;
  /** Which inputs set the final level, for the audit row and for the UI's explanation. */
  readonly binding: readonly string[];
}

/**
 * The angler's default when they have never chosen one.
 *
 * `NONE`, deliberately. `ontology.md` §6 states there is no "public catch" state because
 * there is no sharing feature, and a default that shares anything would make the
 * introduction of sharing a silent disclosure of every catch logged before it existed.
 */
export const DEFAULT_ACCOUNT_LEVEL: PrecisionLevel = "NONE";

export function effectiveDisclosure(inputs: DisclosureInputs): EffectiveDisclosure {
  const species = inputs.speciesPolicy ?? UNCLASSIFIED_SPECIES_POLICY;

  const candidates: readonly { readonly source: string; readonly level: PrecisionLevel }[] = [
    { source: "account", level: inputs.accountLevel ?? DEFAULT_ACCOUNT_LEVEL },
    ...(inputs.programLevel === undefined
      ? []
      : [{ source: "program", level: inputs.programLevel }]),
    ...(inputs.catchOverride === undefined
      ? []
      : [{ source: "catch", level: inputs.catchOverride }]),
    { source: "species", level: species.minPrecision },
  ];

  const level = candidates.reduce<PrecisionLevel>(
    (acc, candidate) => coarsestOf(acc, candidate.level),
    "EXACT",
  );

  /*
    Every input that is AT the winning level is named, not just the first one found.
    "Your setting and this species' protection both put this at 50 km" is a different
    sentence from "this species put it there", and the angler is owed the accurate one.
  */
  const binding = candidates.filter((c) => c.level === level).map((c) => c.source);

  return {
    level,
    temporalDelayDays: Math.max(species.temporalDelayDays, inputs.programTemporalDelayDays ?? 0),
    excludedFromSharedSurfaces: species.policy === "suppressed",
    binding,
  };
}
