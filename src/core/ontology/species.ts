/**
 * The species vocabulary (ontology §7, seeded by
 * `supabase/migrations/20260828120300_v1_seed_vocabularies.sql`).
 *
 * Mirrored into TypeScript rather than fetched, because the species picker is the one
 * screen that absolutely must work with no signal — it is the only required field on a
 * catch (spec §4) and the boat is offshore. The vocabulary is versioned server-side
 * (`vocabulary_version`) and this copy is the offline floor, not a second source of
 * truth: when the vocabulary endpoint lands it overwrites this list in the local store.
 *
 * Ids are the stable text codes from the migration. Spec §5 is explicit that species use
 * persistent ids and never raw text; `species_other` exists for the genuine unknown and
 * is deliberately a separate column so it can never be mistaken for one of these.
 *
 * KEEP IN STEP: `species.test.ts` fails if an id here is missing from the migration.
 */

export type WaterClass = "salt" | "fresh";
export type TakeStatus = "open" | "protected" | "regulated";

export interface Species {
  readonly id: string;
  readonly commonName: string;
  readonly scientificName: string | null;
  /** A roll-up like "Rockfish" — pickable when the angler cannot get more specific. */
  readonly isGroup: boolean;
  readonly rollsUpTo: string | null;
  readonly waterClass: WaterClass;
  readonly takeStatus: TakeStatus;
  readonly sortOrder: number;
}

export const SPECIES: readonly Species[] = [
  { id: "rockfish", commonName: "Rockfish", scientificName: "Sebastes spp.", isGroup: true, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 10 },
  { id: "surfperch", commonName: "Surfperch", scientificName: "Embiotocidae", isGroup: true, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 11 },
  { id: "croaker", commonName: "Croaker", scientificName: "Sciaenidae", isGroup: true, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 12 },
  { id: "california_halibut", commonName: "California halibut", scientificName: "Paralichthys californicus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 100 },
  { id: "barred_sand_bass", commonName: "Barred sand bass", scientificName: "Paralabrax nebulifer", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 101 },
  { id: "spotted_sand_bass", commonName: "Spotted sand bass", scientificName: "Paralabrax maculatofasciatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 102 },
  { id: "kelp_bass", commonName: "Kelp bass (calico)", scientificName: "Paralabrax clathratus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 103 },
  { id: "california_corbina", commonName: "California corbina", scientificName: "Menticirrhus undulatus", isGroup: false, rollsUpTo: "croaker", waterClass: "salt", takeStatus: "open", sortOrder: 104 },
  { id: "barred_surfperch", commonName: "Barred surfperch", scientificName: "Amphistichus argenteus", isGroup: false, rollsUpTo: "surfperch", waterClass: "salt", takeStatus: "open", sortOrder: 105 },
  { id: "walleye_surfperch", commonName: "Walleye surfperch", scientificName: "Hyperprosopon argenteum", isGroup: false, rollsUpTo: "surfperch", waterClass: "salt", takeStatus: "open", sortOrder: 106 },
  { id: "yellowfin_croaker", commonName: "Yellowfin croaker", scientificName: "Umbrina roncador", isGroup: false, rollsUpTo: "croaker", waterClass: "salt", takeStatus: "open", sortOrder: 107 },
  { id: "spotfin_croaker", commonName: "Spotfin croaker", scientificName: "Roncador stearnsii", isGroup: false, rollsUpTo: "croaker", waterClass: "salt", takeStatus: "open", sortOrder: 108 },
  { id: "white_croaker", commonName: "White croaker (tomcod)", scientificName: "Genyonemus lineatus", isGroup: false, rollsUpTo: "croaker", waterClass: "salt", takeStatus: "open", sortOrder: 109 },
  { id: "queenfish", commonName: "Queenfish", scientificName: "Seriphus politus", isGroup: false, rollsUpTo: "croaker", waterClass: "salt", takeStatus: "open", sortOrder: 110 },
  { id: "sargo", commonName: "Sargo", scientificName: "Anisotremus davidsonii", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 111 },
  { id: "opaleye", commonName: "Opaleye", scientificName: "Girella nigricans", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 112 },
  { id: "halfmoon", commonName: "Halfmoon", scientificName: "Medialuna californiensis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 113 },
  { id: "jacksmelt", commonName: "Jacksmelt", scientificName: "Atherinopsis californiensis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 114 },
  { id: "round_stingray", commonName: "Round stingray", scientificName: "Urobatis halleri", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 115 },
  { id: "shovelnose_guitarfish", commonName: "Shovelnose guitarfish", scientificName: "Pseudobatos productus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 116 },
  { id: "leopard_shark", commonName: "Leopard shark", scientificName: "Triakis semifasciata", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 117 },
  { id: "bat_ray", commonName: "Bat ray", scientificName: "Myliobatis californica", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 118 },
  { id: "horn_shark", commonName: "Horn shark", scientificName: "Heterodontus francisci", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 119 },
  { id: "california_sheephead", commonName: "California sheephead", scientificName: "Bodianus pulcher", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 200 },
  { id: "california_scorpionfish", commonName: "California scorpionfish (sculpin)", scientificName: "Scorpaena guttata", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 201 },
  { id: "lingcod", commonName: "Lingcod", scientificName: "Ophiodon elongatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 202 },
  { id: "cabezon", commonName: "Cabezon", scientificName: "Scorpaenichthys marmoratus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 203 },
  { id: "pacific_sanddab", commonName: "Pacific sanddab", scientificName: "Citharichthys sordidus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 204 },
  { id: "garibaldi", commonName: "Garibaldi", scientificName: "Hypsypops rubicundus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "protected", sortOrder: 205 },
  { id: "yellowtail", commonName: "Yellowtail", scientificName: "Seriola dorsalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 300 },
  { id: "white_seabass", commonName: "White seabass", scientificName: "Atractoscion nobilis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 301 },
  { id: "pacific_bonito", commonName: "Pacific bonito", scientificName: "Sarda chiliensis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 302 },
  { id: "pacific_barracuda", commonName: "Pacific barracuda", scientificName: "Sphyraena argentea", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 303 },
  { id: "pacific_mackerel", commonName: "Pacific mackerel", scientificName: "Scomber japonicus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 304 },
  { id: "jack_mackerel", commonName: "Jack mackerel", scientificName: "Trachurus symmetricus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 305 },
  { id: "bluefin_tuna", commonName: "Bluefin tuna", scientificName: "Thunnus orientalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 306 },
  { id: "yellowfin_tuna", commonName: "Yellowfin tuna", scientificName: "Thunnus albacares", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 307 },
  { id: "dorado", commonName: "Dorado", scientificName: "Coryphaena hippurus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 308 },
  { id: "thresher_shark", commonName: "Thresher shark", scientificName: "Alopias vulpinus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 309 },];

const BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export function speciesById(id: string | null): Species | null {
  return id === null ? null : (BY_ID.get(id) ?? null);
}

/** Display name for a catch: the vocabulary name, the angler's own text, or nothing. */
export function speciesLabel(id: string | null, other: string | null): string | null {
  return speciesById(id)?.commonName ?? (other?.trim() || null);
}

/**
 * Species matching for the picker. Matches common name, scientific name and the
 * shorthand anglers actually type — "calico" finds Kelp bass because the seeded common
 * name carries it in parentheses.
 */
export function searchSpecies(
  query: string,
  waterClass: WaterClass | null = null,
): readonly Species[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return SPECIES.filter((species) => {
    if (waterClass !== null && species.waterClass !== waterClass) return false;
    if (tokens.length === 0) return true;
    const text = `${species.commonName} ${species.scientificName ?? ""}`.toLowerCase();
    return tokens.every((token) => text.includes(token));
  }).slice().sort((a, b) => a.sortOrder - b.sortOrder);
}
