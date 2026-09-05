/**
 * The passport's own vocabulary (passport spec §9.2, §10, §11).
 *
 * Nothing here is stored. Every value in this file is *derived* from catches that already
 * exist, which is the whole of spec §28: the catch table stays authoritative and the
 * passport is a projection over it. That is also why there is no `caught: boolean` on a
 * species — caught-ness is the presence of a summary, so it cannot drift out of step with
 * the catches it was computed from.
 */

/**
 * One end of a personal best. Length and weight are deliberately separate records
 * (spec §9.2): the longest fish and the heaviest fish are frequently not the same fish,
 * and collapsing them into one "biggest" loses the angler's actual history.
 *
 * `estimated` carries `catch.size_estimated` forward so the UI can say so. A guessed
 * 30-inch fish is still that angler's best; it is just not a measured one, and the screen
 * should not imply otherwise.
 */
export interface PersonalBest {
  readonly catchId: string;
  /** Millimetres for length, grams for weight — the units the catch row already stores. */
  readonly value: number;
  readonly estimated: boolean;
  readonly caughtAt: string;
}

/** Everything the passport knows about one species for one angler. */
export interface SpeciesSummary {
  readonly speciesId: string;
  /** Catches that count (spec §10). Not the number of fish — see `fishCount`. */
  readonly catchCount: number;
  /**
   * Fish, summing `catch.quantity`. A bass-on-every-cast session logged as one catch of
   * twelve is twelve fish and one catch, and the two numbers answer different questions.
   */
  readonly fishCount: number;
  readonly keptCount: number;
  readonly releasedCount: number;
  readonly firstCatchId: string;
  readonly firstCaughtAt: string;
  readonly latestCatchId: string;
  readonly latestCaughtAt: string;
  readonly bestLength: PersonalBest | null;
  readonly bestWeight: PersonalBest | null;
}

/** The overview numbers (spec §8.2). */
export interface PassportTotals {
  readonly uniqueSpecies: number;
  readonly totalCatches: number;
  readonly totalFish: number;
  readonly keptCount: number;
  readonly releasedCount: number;
  /** The most recent species caught for the first time, or null on an empty log. */
  readonly latestNewSpecies: { readonly speciesId: string; readonly caughtAt: string } | null;
}

export type CollectionType = "family" | "habitat" | "region";

/**
 * One species' place in a collection (spec §29.2).
 *
 * `informationalOnly` is the §11 safeguard: a protected or prohibited fish may appear in a
 * collection so an angler learns it exists, but it can never be required to reach 100%.
 * Nobody should be nudged toward a fish they are not allowed to take.
 */
export interface CollectionSpecies {
  readonly speciesId: string;
  readonly required: boolean;
  readonly informationalOnly: boolean;
  readonly sortOrder: number;
}

/**
 * A versioned collection definition (spec §11, §29.1).
 *
 * `version` exists so an award or a progress reading can say which definition it was made
 * against. Adding a species to a collection changes what 100% means, and an angler who
 * finished it last season should not silently become incomplete.
 */
export interface CollectionDefinition {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly collectionType: CollectionType;
  /**
   * Set for regional collections, and used only to order them for an angler who has told
   * Settings where they fish. Never consulted when deciding whether a catch counts — a
   * catch carries no region (spec §45.1), and the species list is the geography (§48.1).
   */
  readonly regionId: string | null;
  readonly version: number;
  readonly active: boolean;
  readonly species: readonly CollectionSpecies[];
}

/** Progress against one collection. `required` excludes informational-only entries. */
export interface CollectionProgress {
  readonly collectionId: string;
  readonly caught: number;
  readonly required: number;
  readonly informationalCaught: number;
  readonly complete: boolean;
}
