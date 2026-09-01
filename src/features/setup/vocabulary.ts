import type { CurrentStrength, CurrentTerm, SetupType } from "@/core/rules/catch/types";

/**
 * The pick-lists the Setup page offers.
 *
 * Structure, water colour and water clarity mirror the seeded vocabularies in
 * `20260828120300_v1_seed_vocabularies.sql` — ids match, so a value chosen here is the
 * same value the server already knows. They are duplicated into TypeScript for the same
 * reason the species list is: Setup has to work on a boat with no signal, and the
 * vocabulary endpoint does not exist yet. When it lands, these become the offline floor
 * rather than a second source of truth.
 *
 * Current direction is the exception worth naming. `uphill / downhill / inshore /
 * offshore` are the words anglers use for which way the water is pushing past the spot.
 * They are NOT a measured current vector, they are not converted into one, and nothing
 * derives a bearing from them (spec §13). The ontology reserved exactly these four
 * values for exactly this reason.
 */

export const SETUP_TYPES: readonly { id: SetupType; label: string }[] = [
  { id: "flyline", label: "Flyline" },
  { id: "surface_iron", label: "Surface iron" },
  { id: "yo_yo", label: "Yo-yo" },
  { id: "knife_jig", label: "Knife jig" },
  { id: "slow_pitch", label: "Slow pitch" },
  { id: "dropper_loop", label: "Dropper loop" },
  { id: "trolling", label: "Trolling" },
  { id: "bottom", label: "Bottom fishing" },
  { id: "bait_rig", label: "Bait rig" },
  { id: "custom", label: "Custom" },
];

export const CURRENT_TERMS: readonly { id: CurrentTerm; label: string }[] = [
  { id: "uphill", label: "Uphill" },
  { id: "downhill", label: "Downhill" },
  { id: "inshore", label: "Inshore" },
  { id: "offshore", label: "Offshore" },
  { id: "unknown", label: "Unknown" },
];

export const CURRENT_STRENGTHS: readonly { id: CurrentStrength; label: string }[] = [
  { id: "none", label: "None" },
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "strong", label: "Strong" },
  { id: "very_strong", label: "Very strong" },
];

/** ids match `public.structure_type`; several may be chosen at once (spec §13). */
export const STRUCTURE_TYPES: readonly { id: string; label: string }[] = [
  { id: "rocky_point", label: "Rocky" },
  { id: "kelp_edge", label: "Kelp" },
  { id: "kelp_paddy", label: "Kelp paddy" },
  { id: "reef", label: "Reef" },
  { id: "sand_flat", label: "Sand" },
  { id: "eelgrass_bed", label: "Eelgrass" },
  { id: "hard_bottom", label: "Hard bottom" },
  { id: "wreck", label: "Wreck" },
  { id: "bank", label: "Bank" },
  { id: "canyon", label: "Canyon" },
  { id: "open_water", label: "Open water" },
];

export const WATER_COLORS: readonly { id: string; label: string }[] = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "green_brown", label: "Green-brown" },
  { id: "brown", label: "Brown" },
  // Three seeded colours the mirror had silently dropped (caught by the parity test):
  // tannic tea water, blooms, and red tide — seeded as colours, flagged for review,
  // because leaving them out meant those days got logged as custom text.
  { id: "tannic", label: "Tannic / tea" },
  { id: "algae_bloom", label: "Algae bloom" },
  { id: "red_tide", label: "Red tide" },
];

export const WATER_CLARITIES: readonly { id: string; label: string }[] = [
  { id: "gin_clear", label: "Gin clear" },
  { id: "clear", label: "Clear" },
  { id: "lightly_stained", label: "Lightly stained" },
  { id: "stained", label: "Stained" },
  // Founder requirement 2026-09-01 §3: milky glacial/plankton tints are not stained.
  { id: "milky", label: "Milky" },
  { id: "muddy", label: "Muddy" },
];

/** Roles a rod setup asks about, in the order they read down the rod. */
export const SETUP_GEAR_ROLES = [
  "rod",
  "reel",
  "main_line",
  "leader",
  "hook",
  "jig",
  "bait",
] as const;

export const SETUP_GEAR_PLACEHOLDER: Record<string, string> = {
  rod: "Calstar",
  reel: "Talica 12",
  main_line: "65 lb braid",
  leader: "40 lb fluorocarbon",
  hook: "2/0 Owner",
  jig: "Nomad Streaker 200g",
  bait: "Sardine",
};
