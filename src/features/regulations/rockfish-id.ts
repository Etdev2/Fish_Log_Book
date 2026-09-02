/**
 * Guided rockfish identification (founder spec §5, §6, §7).
 *
 * A decision tree that asks plain visual questions and answers with CONFIDENCE LANGUAGE,
 * never certainty: "Likely vermilion rockfish" with a percentage, plus a hard
 * restricted-species warning whenever the candidate pool contains anything California
 * says zero-retention on. The product rule is §6: when identification is uncertain the
 * answer favors release, and the UI says so.
 *
 * Images in v1 are SCHEMATIC swatches (drawn color/pattern blocks), labeled as such — a
 * schematic is honest about what it is. §7's camera path narrows candidates through the
 * same scoring seam later; identification and regulation stay separate systems.
 */
import { SOCAL, speciesInPack } from "./reg-data";

export type TraitAnswer =
  | "red-orange"
  | "brown"
  | "black-blue"
  | "pink-copper"
  | "mixed"
  | "spots-yes"
  | "spots-no"
  | "bands-yes"
  | "bands-no"
  | "jaw-small"
  | "jaw-big"
  | "fins-uniform"
  | "fins-light"
  | "size-small"
  | "size-mid"
  | "size-big";

export interface IdQuestion {
  readonly id: string;
  readonly question: string;
  readonly answers: readonly { id: TraitAnswer; label: string }[];
}

export const ID_QUESTIONS: readonly IdQuestion[] = [
  {
    id: "color",
    question: "What is the fish's main color?",
    answers: [
      { id: "red-orange", label: "Red / orange" },
      { id: "brown", label: "Brown / olive" },
      { id: "black-blue", label: "Black / blue" },
      { id: "pink-copper", label: "Pink / copper shades" },
      { id: "mixed", label: "Mixed or patterned" },
    ],
  },
  {
    id: "spots",
    question: "Noticeable spots or blotches?",
    answers: [
      { id: "spots-yes", label: "Yes" },
      { id: "spots-no", label: "No / plain" },
    ],
  },
  {
    id: "bands",
    question: "Visible bars or stripes across the body?",
    answers: [
      { id: "bands-yes", label: "Yes" },
      { id: "bands-no", label: "No" },
    ],
  },
  {
    id: "fins",
    question: "How do the fins look?",
    answers: [
      { id: "fins-uniform", label: "Same color as the body" },
      { id: "fins-light", label: "Lighter / pale edges or clear fin membranes" },
    ],
  },
  {
    id: "jaw",
    question: "Mouth and jaw?",
    answers: [
      { id: "jaw-small", label: "Small mouth, jaw does not reach the eye" },
      { id: "jaw-big", label: "Large mouth, jaw reaches past the eye" },
    ],
  },
  {
    id: "size",
    question: "About how long?",
    answers: [
      { id: "size-small", label: "Under 12 in" },
      { id: "size-mid", label: "12–24 in" },
      { id: "size-big", label: "Over 24 in" },
    ],
  },
];

/**
 * Trait affinity: 1 = the trait is characteristic, 0 = the trait rules the species out
 * for practical purposes. Missing keys read as 0.5 (no information either way).
 */
export interface RockfishProfile {
  readonly speciesId: string;
  readonly commonName: string;
  readonly scientificName: string;
  /** Schematic swatch colors for the honest "not a photo" visual. */
  readonly swatch: { readonly base: string; readonly accent: string; readonly pattern: "plain" | "spots" | "blotches" };
  readonly keyFeatures: readonly string[];
  readonly similarTo: readonly string[];
  /** True when the pack or CCR marks zero-retention / no-take. */
  readonly noRetention: boolean;
  readonly traits: Partial<Record<TraitAnswer, number>>;
}

export const ROCKFISH_PROFILES: readonly RockfishProfile[] = [
  {
    speciesId: "vermilion_rockfish",
    commonName: "Vermilion rockfish",
    scientificName: "Sebastes miniatus",
    swatch: { base: "#c0392b", accent: "#7b241c", pattern: "spots" },
    keyFeatures: [
      "Body red to orange-red with faint dark mottling or tiny brown spots",
      "Fins reddish, often with darker margins on young fish",
      "Small mouth; jaw does not reach past the eye",
      "Usually 12–20 inches in SoCal catches",
    ],
    similarTo: ["canary_rockfish", "yelloweye_rockfish", "cowcod"],
    noRetention: false,
    traits: { "red-orange": 1, "spots-yes": 1, "spots-no": 0.3, "bands-no": 1, "jaw-small": 1, "size-mid": 1, "size-big": 0.4, "size-small": 0.4, "fins-uniform": 1 },
  },
  {
    speciesId: "canary_rockfish",
    commonName: "Canary rockfish",
    scientificName: "Sebastes pinniger",
    swatch: { base: "#e67e22", accent: "#fdf2e9", pattern: "plain" },
    keyFeatures: [
      "Bright orange body with a gray zone along the lateral line",
      "Underside of the jaw and fin edges often pale",
      "Deeply forked tail",
      "Can reach 30 inches; most caught are smaller",
    ],
    similarTo: ["vermilion_rockfish", "yelloweye_rockfish"],
    noRetention: false,
    traits: { "red-orange": 1, "spots-no": 1, "spots-yes": 0.1, "bands-no": 1, "fins-light": 1, "jaw-small": 0.7, "size-mid": 1, "size-big": 0.7 },
  },
  {
    speciesId: "yelloweye_rockfish",
    commonName: "Yelloweye rockfish",
    scientificName: "Sebastes ruberrimus",
    swatch: { base: "#d35400", accent: "#f1c40f", pattern: "plain" },
    keyFeatures: [
      "Bright orange-red with a distinctly YELLOW EYE",
      "Latural line in a pale stripe; adults often have raspy head spines",
      "Big, deep-bodied fish — commonly over 24 inches",
      "PROHIBITED — no retention at any time in California",
    ],
    similarTo: ["canary_rockfish", "vermilion_rockfish", "cowcod"],
    noRetention: true,
    traits: { "red-orange": 1, "spots-no": 1, "spots-yes": 0.1, "bands-no": 1, "jaw-small": 0.6, "size-big": 1, "size-mid": 0.5, "fins-uniform": 1 },
  },
  {
    speciesId: "copper_rockfish",
    commonName: "Copper rockfish",
    scientificName: "Sebastes caurinus",
    swatch: { base: "#7e5109", accent: "#f0b27a", pattern: "blotches" },
    keyFeatures: [
      "Olive-brown with coppery or yellowish blotches on the back and sides",
      "Rear two-thirds of the lateral line noticeably lighter",
      "Spots/blotches, not plain",
      "Most under 24 inches",
    ],
    similarTo: ["gopher_rockfish", "olive_rockfish"],
    noRetention: false,
    traits: { brown: 1, "pink-copper": 0.8, "spots-yes": 1, "spots-no": 0.1, "bands-no": 1, "jaw-small": 0.8, "size-mid": 1, "size-small": 0.6, "fins-uniform": 0.8 },
  },
  {
    speciesId: "bocaccio",
    commonName: "Bocaccio",
    scientificName: "Sebastes paucispinis",
    swatch: { base: "#a04000", accent: "#d5caca", pattern: "plain" },
    keyFeatures: [
      "Olive-orange to brownish, often with a pinkish cast",
      "Very large mouth — the lower jaw juts past the eye",
      "Long, lean body compared with most rockfish",
      "Often 20+ inches; big ones are memorable",
    ],
    similarTo: ["vermilion_rockfish", "cowcod"],
    noRetention: false,
    traits: { brown: 0.8, "red-orange": 0.5, "spots-no": 1, "bands-no": 1, "jaw-big": 1, "jaw-small": 0, "size-big": 1, "size-mid": 0.8, "fins-uniform": 0.7 },
  },
  {
    speciesId: "blue_rockfish",
    commonName: "Blue rockfish",
    scientificName: "Sebastes mystinus",
    swatch: { base: "#1f3a93", accent: "#5d6d7e", pattern: "plain" },
    keyFeatures: [
      "Blue-black to slate, often with a blue sheen on the fins",
      "Small mouth, slim body, small scales",
      "Rarely over 21 inches; common at 10–16",
      "Schools over reefs in midwater",
    ],
    similarTo: ["black_rockfish", "olive_rockfish"],
    noRetention: false,
    traits: { "black-blue": 1, brown: 0.2, "spots-no": 1, "bands-no": 1, "jaw-small": 1, "size-small": 0.8, "size-mid": 1, "fins-uniform": 1 },
  },
  {
    speciesId: "black_rockfish",
    commonName: "Black rockfish",
    scientificName: "Sebastes melanops",
    swatch: { base: "#17202a", accent: "#808b96", pattern: "plain" },
    keyFeatures: [
      "Dark gray to black, often with a lighter belly",
      "Large mouth with the jaw reaching to about mid-eye",
      "Fins uniformly dark",
      "Common mid-teens to low-20s inches",
    ],
    similarTo: ["blue_rockfish", "olive_rockfish"],
    noRetention: false,
    traits: { "black-blue": 1, brown: 0.3, "spots-no": 1, "spots-yes": 0.2, "bands-no": 1, "jaw-big": 0.6, "size-mid": 1, "fins-uniform": 1 },
  },
  {
    speciesId: "olive_rockfish",
    commonName: "Olive rockfish",
    scientificName: "Sebastes serranoides",
    swatch: { base: "#6e6702", accent: "#aab7b8", pattern: "plain" },
    keyFeatures: [
      "Olive-brown above, sharply lighter toward the belly",
      "Fin membranes often pale/clear at the edges",
      "Jaw reaches about mid-eye",
      "Most under 20 inches",
    ],
    similarTo: ["black_rockfish", "blue_rockfish", "copper_rockfish"],
    noRetention: false,
    traits: { brown: 1, "black-blue": 0.3, "spots-no": 1, "bands-no": 1, "fins-light": 0.9, "jaw-big": 0.4, "size-mid": 1, "size-small": 0.5 },
  },
  {
    speciesId: "gopher_rockfish",
    commonName: "Gopher rockfish",
    scientificName: "Sebastes carnatus",
    swatch: { base: "#935116", accent: "#f5b7b1", pattern: "blotches" },
    keyFeatures: [
      "Olive-brown with pinkish or white blotches, often a pink cast on the lips",
      "Squat, thick-bodied fish",
      "Small — most 8–15 inches",
      "Clings tight to structure",
    ],
    similarTo: ["copper_rockfish", "olive_rockfish"],
    noRetention: false,
    traits: { brown: 1, "spots-yes": 1, "spots-no": 0.1, "bands-no": 1, "jaw-small": 0.9, "size-small": 1, "size-mid": 0.6, "fins-uniform": 0.7 },
  },
  {
    speciesId: "cowcod",
    commonName: "Cowcod",
    scientificName: "Sebastes levis",
    swatch: { base: "#e59866", accent: "#fdfefe", pattern: "plain" },
    keyFeatures: [
      "Salmon-pink to orange-red, plain-bodied with notably large scales",
      "Heavy, deep body and a big mouth",
      "Adults are big — over 24 inches is normal",
      "PROHIBITED — no retention at any time in California",
    ],
    similarTo: ["yelloweye_rockfish", "vermilion_rockfish", "bocaccio"],
    noRetention: true,
    traits: { "red-orange": 0.9, "pink-copper": 0.8, "spots-no": 1, "bands-no": 1, "jaw-big": 0.6, "size-big": 1, "size-mid": 0.3, "fins-uniform": 1 },
  },
];

export interface IdCandidate {
  readonly profile: RockfishProfile;
  /** Share of the weighted vote across candidates, 0–100, rounded. */
  readonly confidencePct: number;
}

/**
 * Score answers down to a ranked list. Multiplies affinities so one ruling trait pulls
 * hard; a "not sure" answer simply isn't in the list. Percentages are relative shares
 * of the surviving pool — they answer "which is likelier", never "identification certain".
 */
/** Question ids sharing a trait family — a strongly-signaled family means a missing
    affinity for a CONTRADICTING answer is evidence against, not "no information". */
const QUESTION_GROUPS: readonly (readonly TraitAnswer[])[] = [
  ["red-orange", "brown", "black-blue", "pink-copper", "mixed"],
  ["spots-yes", "spots-no"],
  ["bands-yes", "bands-no"],
  ["fins-uniform", "fins-light"],
  ["jaw-small", "jaw-big"],
  ["size-small", "size-mid", "size-big"],
];

function affinityFor(profile: RockfishProfile, answer: TraitAnswer): number {
  const affinity = profile.traits[answer];
  if (affinity !== undefined) return affinity;
  const group = QUESTION_GROUPS.find((g) => g.includes(answer));
  if (group) {
    const strongest = Math.max(...group.map((a) => profile.traits[a] ?? 0));
    // The species is strongly some OTHER option in this family (e.g. clearly red-orange,
    // and the angler answered black-blue): that counts against it.
    if (strongest >= 1) return 0.15;
  }
  return 0.5;
}

export function identifyRockfish(answers: readonly TraitAnswer[]): readonly IdCandidate[] {
  const scored = ROCKFISH_PROFILES.map((profile) => {
    let score = 1;
    let answered = 0;
    for (const answer of answers) {
      score *= affinityFor(profile, answer);
      answered += 1;
    }
    // No answers at all → uniform field, which is what "no information" should read as.
    return { profile, score: answered === 0 ? 1 : score };
  });
  const total = scored.reduce((sum, s) => sum + s.score, 0) || 1;
  return scored
    .map((s) => ({ profile: s.profile, confidencePct: Math.round((s.score / total) * 100) }))
    .sort((a, b) => b.confidencePct - a.confidencePct);
}

/**
 * §6 gate: any candidate above the warning floor that the law says no-retention on.
 * The floor is 5% — one-in-twenty of the surviving pool: low enough to catch an orange
 * red-flag early, high enough that a "clearly not that fish" (small, black, plain) does
 * not cry wolf and teach the angler to ignore the banner.
 */
export const RESTRICTED_WARNING_PCT = 5;

export function restrictedIn(candidates: readonly IdCandidate[]): readonly IdCandidate[] {
  return candidates.filter(
    (c) => c.profile.noRetention && c.confidencePct >= RESTRICTED_WARNING_PCT,
  );
}

/** Regulation linkage: only species the pack actually covers produce a card link. */
export function hasVerifiedRules(speciesId: string): boolean {
  return speciesInPack().includes(speciesId) || SOCAL.groups.some((g) => g.memberSpeciesIds.includes(speciesId));
}
