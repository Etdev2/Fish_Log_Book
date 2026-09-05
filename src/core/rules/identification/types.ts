/**
 * Fin ID — the shared identification layer (passport spec §17).
 *
 * "Fin ID" is one engine over many trait packs, not a new wizard per animal. The rockfish
 * identifier proved the shape; this is that shape with the fish taken out of it, so a
 * second pack — surfperch, groupers, whales later — is a data file rather than a rewrite.
 *
 * The scoring model is `docs/specs/rockfish-identification.md`. That document is the
 * authority on *why* the maths is what it is; this file is the vocabulary it needs.
 *
 * The honest claim, unchanged from that spec: this narrows a field. It never identifies a
 * fish. Percentages are shares of a surviving pool — "which is likelier", never
 * "identification certain" — and a wrong confident answer is worse than no answer, which
 * is why §4.5's refusal to rank is part of the engine rather than a nicety.
 */

/** One selectable answer. Ids are pack-scoped strings, not a global union. */
export interface TraitOption {
  readonly id: string;
  readonly label: string;
  /**
   * Optional key of a little diagram to show beside the label.
   *
   * A key rather than an image: the drawing lives in the UI layer, so this pure module
   * stays free of presentation, and a pack can name a figure without knowing how it is
   * drawn. Options with no figure simply read as text — most do not need one, and a
   * decorative picture beside every answer would bury the two that matter.
   */
  readonly figure?: string;
}

/**
 * One question and its mutually exclusive answers.
 *
 * Mutual exclusivity is what makes contradiction detectable: a species strongly marked as
 * some *other* option in the same question is evidence against, not silence. The old
 * rockfish code kept that relationship in a hand-maintained parallel list; here it falls
 * out of the question itself and cannot drift.
 */
export interface TraitQuestion {
  readonly id: string;
  readonly question: string;
  readonly options: readonly TraitOption[];
}

/** One species' trait signature within a pack. */
export interface TraitProfile {
  readonly speciesId: string;
  readonly commonName: string;
  readonly scientificName: string | null;
  /** Option id → affinity. Above 1 pulls toward, below 1 pushes away, absent = no signal. */
  readonly traits: Readonly<Record<string, number>>;
  /** True when the law says this one goes back regardless. Drives the §4.6 warning. */
  readonly noRetention: boolean;
  /** Plain-language marks an angler can check on the fish in their hands. */
  readonly keyFeatures: readonly string[];
  readonly similarTo: readonly string[];
}

/**
 * A pack is a closed world: these questions, these species, this provenance.
 *
 * `source` is not decoration. A pack whose traits were read off a state agency key and one
 * somebody wrote from memory are different objects, and an angler deciding whether to keep
 * a fish deserves to know which they are looking at — the same citation-or-nothing stance
 * Fish Legal already takes.
 */
export interface TraitPack {
  readonly id: string;
  readonly name: string;
  readonly questions: readonly TraitQuestion[];
  readonly profiles: readonly TraitProfile[];
  readonly source: string;
  readonly version: number;
}

/** One ranked possibility, with the reasons it is there. */
export interface Candidate {
  readonly profile: TraitProfile;
  /** Share of the weighted vote across the surviving pool, 0–100. */
  readonly sharePct: number;
  /**
   * §4.7: every candidate says why. An unexplainable ranking is one an angler cannot
   * check against the fish in their hands, which makes it worse than no ranking.
   */
  readonly supporting: readonly string[];
  readonly against: readonly string[];
}

export interface Identification {
  readonly candidates: readonly Candidate[];
  /**
   * §4.5. False when the engine declines to call a winner — too little answered, or the
   * field too flat to separate. The candidates are still returned, because "here are four
   * it might be" is useful; what is withheld is the implication that the top one is it.
   */
  readonly ranked: boolean;
  /** Plain-language reason when `ranked` is false. Shown to the angler, not logged. */
  readonly reason: string | null;
  /** §4.6: no-retention species still live enough to warn about. */
  readonly restricted: readonly Candidate[];
}
