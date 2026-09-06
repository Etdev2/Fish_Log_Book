import type { EligibleCatch, ScoreRule, ScoringFamily } from "./official-scoring";

/**
 * What a tournament is, expressed as data the host chooses rather than code somebody has
 * to write.
 *
 * The demand this file answers: a Captain's-Cup points event, a winner-take-all biggest
 * fish, a 1st/2nd/3rd payout, and a Bisbee's-style event where one boat enters several
 * categories — biggest marlin, biggest tuna, biggest dorado — each with its own pot. Those
 * look like four products. They are one shape:
 *
 *     a tournament is a list of CATEGORIES
 *     a category has a SCORING RULE and a PAYOUT
 *
 * Biggest-fish-winner-takes-all is one category. Bisbee's is three. Captain's Cup is one
 * category whose rule happens to be a species points table. Nothing else has to change,
 * and a host who wants the simple thing never meets the complicated thing — which is the
 * same bet Boat Games makes in `core/rules/games/modes.ts`, where three very different
 * games are one engine and a handful of preset rules.
 *
 * The scoring itself is not reimplemented here. `official-scoring.ts` already folds
 * catches into a score for nine families and is the server-authoritative one; a category
 * maps onto its `ScoreRule` and that is what runs.
 *
 * Money: a category can carry an entry fee, and the payout math below is exact. Nothing in
 * this file, or anywhere it is used, *collects* anything. A fee here is a fact about the
 * event, the same way it is a fact on the printed flyer — it is what the host tells
 * entrants it costs, and the payment domain is a separate, deliberate act.
 */

export type PayoutModel =
  /** No prize structure. A friendly event, or one settled outside the app. */
  | "NONE"
  /** One winner takes the category's pot. */
  | "WINNER_TAKE_ALL"
  /** Split down the places by percentage — 60/30/10 and the like. */
  | "PLACES";

export interface CategoryPayout {
  readonly model: PayoutModel;
  /** Percentages, first place first. Ignored unless the model is PLACES. */
  readonly split: readonly number[];
}

export interface FormatCategory {
  /** Stable within a tournament. Used by standings rows and award records. */
  readonly id: string;
  /** What the host calls it: "Biggest Marlin", "Overall", "Junior angler". */
  readonly name: string;
  readonly family: ScoringFamily;
  /** Species that score here. Empty means every species counts. */
  readonly species: readonly string[];
  /** Species id → points. Only meaningful for SPECIES_POINTS / SPECIES_MULTIPLIER. */
  readonly speciesPoints: Readonly<Record<string, number>>;
  /** How many fish count, for BEST_N_WEIGHT. */
  readonly bestN: number | null;
  readonly payout: CategoryPayout;
  /**
   * What it costs to enter this category, in minor units (cents). `null` means free, or
   * not decided. Declared only — see the note at the top of this file.
   */
  readonly entryFeeMinor: number | null;
}

export interface TournamentFormat {
  /** ISO 4217, uppercase. Applies to every fee and pot in the format. */
  readonly currency: string;
  readonly categories: readonly FormatCategory[];
}

/* -------------------------------------------------------------------------- */
/* The families a host can actually choose                                     */
/* -------------------------------------------------------------------------- */

/**
 * `official-scoring.ts` supports nine families. Five are offered here, because the other
 * four (SPECIES_MULTIPLIER, EVERY_FISH_COUNTS, POINTS, TOTAL_LENGTH) are either the same
 * idea in different clothes or need a rule text nobody has written yet. A family that
 * cannot be explained in one line on a phone does not belong in a picker.
 */
export const OFFERED_FAMILIES = [
  "BIGGEST_FISH",
  "TOTAL_WEIGHT",
  "BEST_N_WEIGHT",
  "SPECIES_POINTS",
  "BIGGEST_LENGTH",
] as const satisfies readonly ScoringFamily[];

export type OfferedFamily = (typeof OFFERED_FAMILIES)[number];

export const FAMILY_COPY: Readonly<Record<OfferedFamily, { readonly name: string; readonly blurb: string }>> = {
  BIGGEST_FISH: {
    name: "Heaviest single fish",
    blurb: "One fish decides it. Your best weight is your score.",
  },
  TOTAL_WEIGHT: {
    name: "Total weight",
    blurb: "Every eligible fish adds up.",
  },
  BEST_N_WEIGHT: {
    name: "Best few, added up",
    blurb: "Your heaviest handful counts, and nothing beyond it.",
  },
  SPECIES_POINTS: {
    name: "Points per species",
    blurb: "You set what each fish is worth. Most points wins.",
  },
  BIGGEST_LENGTH: {
    name: "Longest fish",
    blurb: "Measured, not weighed — for catch-and-release events.",
  },
};

export function isOfferedFamily(value: string): value is OfferedFamily {
  return (OFFERED_FAMILIES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                     */
/* -------------------------------------------------------------------------- */

export interface FormatPreset {
  readonly id: string;
  readonly name: string;
  /** One line, the way a host would describe the event to somebody at the dock. */
  readonly tagline: string;
  /** Three or four lines of "how it works", as on the Boat Games mode cards. */
  readonly how: readonly string[];
  readonly build: () => TournamentFormat;
}

const DEFAULT_CURRENCY = "USD";

function category(input: Partial<FormatCategory> & Pick<FormatCategory, "id" | "name">): FormatCategory {
  return {
    family: "BIGGEST_FISH",
    species: [],
    speciesPoints: {},
    bestN: null,
    payout: { model: "NONE", split: [] },
    entryFeeMinor: null,
    ...input,
  };
}

/**
 * A starting points table, not a truth about fish.
 *
 * Same reasoning as Boat Games' SoCal template: a calico bass is an ordinary afternoon in
 * Newport and a notable day off Seattle. The host edits this, and the tournament stores
 * the edited copy — so a table that came out wrong for their water costs them thirty
 * seconds rather than being an argument with the app.
 */
export const STARTING_SPECIES_POINTS: Readonly<Record<string, number>> = {
  yellowtail: 8,
  bluefin_tuna: 10,
  yellowfin_tuna: 8,
  dorado: 6,
  white_seabass: 8,
  kelp_bass: 2,
  barred_sand_bass: 2,
  pacific_bonito: 1,
  pacific_barracuda: 1,
};

export const FORMAT_PRESETS: readonly FormatPreset[] = [
  {
    id: "biggest_fish",
    name: "Heaviest fish wins",
    tagline: "One category, one winner, simplest thing that works.",
    how: [
      "Everybody fishes for the same thing.",
      "Your heaviest fish of the day is your score.",
      "Winner takes the pot, if there is one.",
    ],
    build: () => ({
      currency: DEFAULT_CURRENCY,
      categories: [
        category({
          id: "overall",
          name: "Heaviest fish",
          family: "BIGGEST_FISH",
          payout: { model: "WINNER_TAKE_ALL", split: [] },
        }),
      ],
    }),
  },
  {
    id: "places",
    name: "First, second, third",
    tagline: "Heaviest fish, and the pot splits down the places.",
    how: [
      "Scored the same as heaviest fish.",
      "The pot is split by percentage — 50/30/20 to start, and you can change it.",
      "If a place goes unfilled, its share is shared out among the places that were.",
    ],
    build: () => ({
      currency: DEFAULT_CURRENCY,
      categories: [
        category({
          id: "overall",
          name: "Heaviest fish",
          family: "BIGGEST_FISH",
          payout: { model: "PLACES", split: [50, 30, 20] },
        }),
      ],
    }),
  },
  {
    id: "species_points",
    name: "Points per species",
    tagline: "You decide what each fish is worth. Most points wins.",
    how: [
      "You set a points value per species, and edit the starting table to suit your water.",
      "Every eligible fish adds its points to the boat's total.",
      "A species with no value set scores nothing, so the table is the rules.",
    ],
    build: () => ({
      currency: DEFAULT_CURRENCY,
      categories: [
        category({
          id: "overall",
          name: "Points",
          family: "SPECIES_POINTS",
          speciesPoints: { ...STARTING_SPECIES_POINTS },
          payout: { model: "WINNER_TAKE_ALL", split: [] },
        }),
      ],
    }),
  },
  {
    id: "categories",
    name: "Several categories",
    tagline: "One entry, several fish, a pot for each — the Bisbee's shape.",
    how: [
      "Each category is its own competition with its own winner and its own pot.",
      "A boat can be in one category or all of them.",
      "Each carries its own entry fee, so the pots are separate money.",
    ],
    build: () => ({
      currency: DEFAULT_CURRENCY,
      categories: [
        category({
          id: "marlin",
          name: "Biggest marlin",
          family: "BIGGEST_FISH",
          species: ["blue_marlin", "black_marlin", "striped_marlin", "white_marlin"],
          payout: { model: "WINNER_TAKE_ALL", split: [] },
        }),
        category({
          id: "tuna",
          name: "Biggest tuna",
          family: "BIGGEST_FISH",
          species: ["bluefin_tuna", "yellowfin_tuna", "bigeye_tuna"],
          payout: { model: "WINNER_TAKE_ALL", split: [] },
        }),
        category({
          id: "dorado",
          name: "Biggest dorado",
          family: "BIGGEST_FISH",
          species: ["dorado"],
          payout: { model: "WINNER_TAKE_ALL", split: [] },
        }),
      ],
    }),
  },
];

/** The format a tournament has before its host has chosen anything. */
export function defaultFormat(): TournamentFormat {
  return FORMAT_PRESETS[0].build();
}

export function emptyCategory(id: string, name: string): FormatCategory {
  return category({ id, name });
}

/* -------------------------------------------------------------------------- */
/* Reading one back out of the database                                        */
/* -------------------------------------------------------------------------- */

/**
 * A format arrives from `tournament_scoring_version.configuration`, which is `jsonb` and
 * therefore anything at all. This is the only door: it returns a format or `null`, never a
 * half-parsed one, so no screen downstream has to defend itself against a missing field.
 */
export function parseFormat(value: unknown): TournamentFormat | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.categories)) return null;

  const categories: FormatCategory[] = [];
  for (const item of raw.categories) {
    if (typeof item !== "object" || item === null) return null;
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== "string" || typeof entry.name !== "string") return null;
    if (typeof entry.family !== "string") return null;

    categories.push({
      id: entry.id,
      name: entry.name,
      family: entry.family as ScoringFamily,
      species: Array.isArray(entry.species) ? entry.species.filter((s): s is string => typeof s === "string") : [],
      speciesPoints: numberRecord(entry.speciesPoints),
      bestN: typeof entry.bestN === "number" ? entry.bestN : null,
      payout: parsePayout(entry.payout),
      entryFeeMinor: typeof entry.entryFeeMinor === "number" ? entry.entryFeeMinor : null,
    });
  }

  if (categories.length === 0) return null;
  return {
    currency: typeof raw.currency === "string" ? raw.currency : DEFAULT_CURRENCY,
    categories,
  };
}

function numberRecord(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null) return {};
  const out: Record<string, number> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "number" && Number.isFinite(item)) out[key] = item;
  }
  return out;
}

function parsePayout(value: unknown): CategoryPayout {
  if (typeof value !== "object" || value === null) return { model: "NONE", split: [] };
  const raw = value as Record<string, unknown>;
  const model: PayoutModel =
    raw.model === "WINNER_TAKE_ALL" || raw.model === "PLACES" ? raw.model : "NONE";
  const split = Array.isArray(raw.split)
    ? raw.split.filter((n): n is number => typeof n === "number" && Number.isFinite(n))
    : [];
  return { model, split };
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Everything a host could set that would produce a tournament nobody can score, in the
 * words they would need to fix it. Empty means the format is sound.
 *
 * These run before the format is saved, because the alternative is finding out on the
 * water — and a scoring version, once locked, is deliberately immutable.
 */
export function validateFormat(format: TournamentFormat): readonly string[] {
  const problems: string[] = [];

  if (format.categories.length === 0) {
    problems.push("A tournament needs at least one category to score.");
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const item of format.categories) {
    const name = item.name.trim();
    if (name.length === 0) {
      problems.push("Every category needs a name.");
    } else if (seenNames.has(name.toLowerCase())) {
      problems.push(`Two categories are both called “${name}”. Give them different names.`);
    } else {
      seenNames.add(name.toLowerCase());
    }

    if (seenIds.has(item.id)) problems.push(`Two categories share the id “${item.id}”.`);
    seenIds.add(item.id);

    if (item.family === "SPECIES_POINTS") {
      const values = Object.values(item.speciesPoints);
      if (values.length === 0) {
        problems.push(`“${name || item.id}” scores on points, so at least one species needs a value.`);
      }
      if (values.some((points) => points < 0)) {
        problems.push(`“${name || item.id}” has a species worth less than nothing.`);
      }
    }

    if (item.family === "BEST_N_WEIGHT" && (item.bestN === null || item.bestN < 1)) {
      problems.push(`“${name || item.id}” counts your best few fish, so it needs to say how many.`);
    }

    if (item.payout.model === "PLACES") {
      if (item.payout.split.length === 0) {
        problems.push(`“${name || item.id}” pays down the places, so it needs a split.`);
      } else {
        if (item.payout.split.some((share) => share <= 0)) {
          problems.push(`“${name || item.id}” has a place worth nothing. Remove it instead.`);
        }
        const total = item.payout.split.reduce((sum, share) => sum + share, 0);
        // Rounded, because a host typing 33.3/33.3/33.4 means 100 and should not be
        // argued with over a floating-point tenth.
        if (Math.round(total * 10) / 10 !== 100) {
          problems.push(`The split for “${name || item.id}” adds up to ${trim(total)}%, not 100%.`);
        }
      }
    }

    if (item.entryFeeMinor !== null && item.entryFeeMinor < 0) {
      problems.push(`“${name || item.id}” has a negative entry fee.`);
    }
  }

  if (!/^[A-Z]{3}$/.test(format.currency)) {
    problems.push("The currency needs to be a three-letter code, like USD.");
  }

  return problems;
}

function trim(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                     */
/* -------------------------------------------------------------------------- */

/** The rule `official-scoring.ts` runs for this category. */
export function scoreRuleFor(item: FormatCategory): ScoreRule {
  return {
    family: item.family,
    bestN: item.bestN ?? undefined,
    speciesPoints: item.family === "SPECIES_POINTS" ? item.speciesPoints : undefined,
    speciesMultiplier: item.family === "SPECIES_MULTIPLIER" ? item.speciesPoints : undefined,
  };
}

/** Does this fish count in this category at all? */
export function countsIn(item: FormatCategory, speciesId: string | null): boolean {
  if (item.species.length === 0) return true;
  if (speciesId === null) return false;
  return item.species.includes(speciesId);
}

/**
 * The catches that score in a category, out of everything an entry landed.
 *
 * A boat in a Bisbee's-style event lands a marlin and two tuna; the marlin category sees
 * one fish and the tuna category sees two. Filtering here rather than inside the scorer
 * keeps `official-scoring.ts` as the one place a score is computed.
 */
export function catchesIn(
  item: FormatCategory,
  catches: readonly EligibleCatch[],
): readonly EligibleCatch[] {
  return catches.filter((entry) => countsIn(item, entry.speciesId));
}

/* -------------------------------------------------------------------------- */
/* Money                                                                       */
/* -------------------------------------------------------------------------- */

export interface PayoutSlice {
  readonly rank: number;
  readonly amountMinor: number;
}

/**
 * How a category's pot is divided, in whole minor units, given how many places actually
 * got filled.
 *
 * Three rules, each of which exists because the naive version is wrong somewhere real:
 *
 * 1. **Unfilled places do not vanish.** A 50/30/20 category fished by two boats pays those
 *    two boats the whole pot in the ratio 50:30, not 80% of it with the rest unaccounted
 *    for. Money that arrives has to leave.
 * 2. **Whole units only.** Everything is integer minor units, so no rounding invents or
 *    loses a cent.
 * 3. **The remainder goes to first place.** Splitting 100.00 three ways leaves a cent;
 *    somebody has to have it, and the convention every tournament uses is the winner.
 */
export function payoutBreakdown(input: {
  readonly poolMinor: number;
  readonly payout: CategoryPayout;
  /** How many places were actually filled — usually the number of scored entries. */
  readonly placesFilled: number;
}): readonly PayoutSlice[] {
  const pool = Math.max(0, Math.floor(input.poolMinor));
  if (pool === 0 || input.placesFilled <= 0 || input.payout.model === "NONE") return [];

  if (input.payout.model === "WINNER_TAKE_ALL") {
    return [{ rank: 1, amountMinor: pool }];
  }

  const shares = input.payout.split.slice(0, input.placesFilled);
  const total = shares.reduce((sum, share) => sum + share, 0);
  if (shares.length === 0 || total <= 0) return [];

  const slices = shares.map((share, index) => ({
    rank: index + 1,
    amountMinor: Math.floor((pool * share) / total),
  }));

  const distributed = slices.reduce((sum, slice) => sum + slice.amountMinor, 0);
  const remainder = pool - distributed;
  if (remainder > 0) {
    slices[0] = { rank: 1, amountMinor: slices[0].amountMinor + remainder };
  }

  return slices;
}

/** The pot a category holds if every paid entry pays its fee. */
export function poolFor(item: FormatCategory, entries: number): number {
  if (item.entryFeeMinor === null || entries <= 0) return 0;
  return item.entryFeeMinor * entries;
}

/**
 * Minor units to something a person reads. `Intl` handles the currency's own decimal
 * places, so this is correct for JPY (none) as well as USD (two).
 */
export function formatMoney(amountMinor: number, currency: string): string {
  const fractionDigits = currencyDigits(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / 10 ** fractionDigits);
}

function currencyDigits(currency: string): number {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions();
    return parts.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/* -------------------------------------------------------------------------- */
/* Saying it in English                                                        */
/* -------------------------------------------------------------------------- */

/** One line describing how a category is won. */
export function describeCategory(item: FormatCategory, currency: string): string {
  const scoring = isOfferedFamily(item.family)
    ? FAMILY_COPY[item.family].name.toLowerCase()
    : item.family.toLowerCase().replaceAll("_", " ");

  const scope =
    item.species.length === 0
      ? "any fish"
      : item.species.length === 1
        ? "one species"
        : `${item.species.length} species`;

  const money =
    item.entryFeeMinor === null || item.entryFeeMinor === 0
      ? "no entry fee"
      : `${formatMoney(item.entryFeeMinor, currency)} to enter`;

  const prize =
    item.payout.model === "WINNER_TAKE_ALL"
      ? "winner takes the pot"
      : item.payout.model === "PLACES"
        ? `pot splits ${item.payout.split.join("/")}`
        : "no pot";

  return `${scoring}, ${scope} · ${money} · ${prize}`;
}

/** The whole format, as the lines a rules page prints. */
export function describeFormat(format: TournamentFormat): readonly string[] {
  return format.categories.map((item) => `${item.name}: ${describeCategory(item, format.currency)}`);
}

/**
 * The single family that goes in `tournament_scoring_version.scoring_family`.
 *
 * That column predates categories and holds one value. When every category scores the same
 * way it is that family; when they differ it is CUSTOM, and the `configuration` document
 * is the truth. Writing the first category's family into a column that claims to describe
 * the tournament would be a lie a future query would believe.
 */
export function familyColumnFor(format: TournamentFormat): ScoringFamily | "CUSTOM" {
  const families = new Set(format.categories.map((item) => item.family));
  return families.size === 1 ? [...families][0] : "CUSTOM";
}
