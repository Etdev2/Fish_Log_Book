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
  { id: "ocean_whitefish", commonName: "Ocean whitefish", scientificName: "Caulolatilus princeps", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 206 },
  { id: "giant_sea_bass", commonName: "Giant sea bass (black sea bass)", scientificName: "Stereolepis gigas", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "protected", sortOrder: 207 },
  { id: "kelp_greenling", commonName: "Kelp greenling", scientificName: "Hexagrammos decagrammus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 208 },
  { id: "yellowtail", commonName: "Yellowtail", scientificName: "Seriola dorsalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 300 },
  { id: "white_seabass", commonName: "White seabass", scientificName: "Atractoscion nobilis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 301 },
  { id: "pacific_bonito", commonName: "Pacific bonito", scientificName: "Sarda chiliensis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 302 },
  { id: "pacific_barracuda", commonName: "Pacific barracuda", scientificName: "Sphyraena argentea", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 303 },
  { id: "pacific_mackerel", commonName: "Pacific mackerel", scientificName: "Scomber japonicus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 304 },
  { id: "jack_mackerel", commonName: "Jack mackerel", scientificName: "Trachurus symmetricus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 305 },
  { id: "bluefin_tuna", commonName: "Bluefin tuna", scientificName: "Thunnus orientalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 306 },
  { id: "yellowfin_tuna", commonName: "Yellowfin tuna", scientificName: "Thunnus albacares", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 307 },
  { id: "dorado", commonName: "Dorado", scientificName: "Coryphaena hippurus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 308 },
  { id: "thresher_shark", commonName: "Thresher shark", scientificName: "Alopias vulpinus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 309 },

  /* Regional expansion (ADR 007, founder requirements 2026-09-01 §4/§5). The list stays
   * one vocabulary, SoCal-shaped only by sort order; other regions surface through
   * `regions.ts`, not by filtering rows out. waterClass is the dominant regulatory
   * habitat — anadromous runs (salmon, steelhead, striped bass) pick the water they are
   * managed in, and may appear in either region's lists. */

  // Inshore anadromous / mixed-coast (400s)
  { id: "striped_bass", commonName: "Striped bass", scientificName: "Morone saxatilis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 400 },
  { id: "chinook_salmon", commonName: "Chinook salmon", scientificName: "Oncorhynchus tshawytscha", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 401 },
  { id: "coho_salmon", commonName: "Coho salmon", scientificName: "Oncorhynchus kisutch", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 402 },
  { id: "pacific_halibut", commonName: "Pacific halibut", scientificName: "Hippoglossus stenolepis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 403 },
  { id: "white_sturgeon", commonName: "White sturgeon", scientificName: "Acipenser transmontanus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 404 },

  // Atlantic inshore (410s)
  { id: "bluefish", commonName: "Bluefish", scientificName: "Pomatomus saltatrix", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 410 },
  { id: "summer_flounder", commonName: "Summer flounder (fluke)", scientificName: "Paralichthys dentatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 411 },
  { id: "black_sea_bass", commonName: "Black sea bass", scientificName: "Centropristis striata", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 412 },
  { id: "tautog", commonName: "Tautog (blackfish)", scientificName: "Tautoga onitis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 413 },
  { id: "atlantic_cod", commonName: "Atlantic cod", scientificName: "Gadus morhua", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 414 },
  { id: "pollock", commonName: "Pollock", scientificName: "Pollachius virens", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 415 },
  { id: "false_albacore", commonName: "False albacore", scientificName: "Euthynnus alletteratus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 416 },
  { id: "weakfish", commonName: "Weakfish", scientificName: "Cynoscion regalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 417 },

  // Florida / Gulf inshore + nearshore (420s)
  { id: "common_snook", commonName: "Snook", scientificName: "Centropomus undecimalis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 420 },
  { id: "red_drum", commonName: "Redfish (red drum)", scientificName: "Sciaenops ocellatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 421 },
  { id: "atlantic_tarpon", commonName: "Tarpon", scientificName: "Megalops atlanticus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 422 },
  { id: "spotted_seatrout", commonName: "Spotted seatrout (speckled trout)", scientificName: "Cynoscion nebulosus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 423 },
  { id: "gray_snapper", commonName: "Mangrove snapper (gray)", scientificName: "Lutjanus griseus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 424 },
  { id: "yellowtail_snapper", commonName: "Yellowtail snapper", scientificName: "Ocyurus chrysurus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 425 },
  { id: "southern_flounder", commonName: "Southern flounder", scientificName: "Paralichthys lethostigma", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 426 },
  { id: "sheepshead", commonName: "Sheepshead", scientificName: "Archosargus probatocephalus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 427 },
  { id: "permit", commonName: "Permit", scientificName: "Trachinotus falcatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 428 },
  { id: "atlantic_bonefish", commonName: "Bonefish", scientificName: "Albula vulpes", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 429 },

  // Florida / Gulf offshore (430s)
  { id: "red_snapper", commonName: "Red snapper", scientificName: "Lutjanus campechanus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 430 },
  { id: "gag_grouper", commonName: "Gag grouper", scientificName: "Mycteroperca microlepis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 431 },
  { id: "goliath_grouper", commonName: "Goliath grouper", scientificName: "Epinephelus itajara", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "protected", sortOrder: 432 },
  { id: "king_mackerel", commonName: "King mackerel", scientificName: "Scomberomorus cavalla", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 433 },
  { id: "spanish_mackerel", commonName: "Spanish mackerel", scientificName: "Scomberomorus maculatus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 434 },
  { id: "cobia", commonName: "Cobia", scientificName: "Rachycentron canadum", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 435 },
  { id: "greater_amberjack", commonName: "Greater amberjack", scientificName: "Seriola dumerili", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 436 },
  { id: "hogfish", commonName: "Hogfish", scientificName: "Lachnolaimus maximus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 437 },

  // Tropical offshore — Hawaii, Baja, shared pelagics (440s)
  { id: "wahoo", commonName: "Wahoo (ono)", scientificName: "Acanthocybium solandri", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 440 },
  { id: "blue_marlin", commonName: "Blue marlin", scientificName: "Makaira nigricans", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 441 },
  { id: "black_marlin", commonName: "Black marlin", scientificName: "Istiompax indica", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 442 },
  { id: "striped_marlin", commonName: "Striped marlin", scientificName: "Kajikia audax", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 443 },
  { id: "sailfish", commonName: "Pacific sailfish", scientificName: "Istiophorus platypterus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 444 },
  { id: "skipjack_tuna", commonName: "Skipjack tuna (aku)", scientificName: "Katsuwonus pelamis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 445 },
  { id: "giant_trevally", commonName: "Giant trevally (ulua)", scientificName: "Caranx ignobilis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 446 },
  { id: "bluefin_trevally", commonName: "Bluefin trevally (omilu)", scientificName: "Caranx melampygus", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 447 },
  { id: "green_jobfish", commonName: "Green jobfish (uku)", scientificName: "Aprion virescens", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "regulated", sortOrder: 448 },
  { id: "roosterfish", commonName: "Roosterfish", scientificName: "Nematistius pectoralis", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 449 },
  { id: "sierra_mackerel", commonName: "Sierra mackerel", scientificName: "Scomberomorus sierra", isGroup: false, rollsUpTo: null, waterClass: "salt", takeStatus: "open", sortOrder: 450 },

  // Freshwater (500s) — groundwork for lake/river regions (ADR 007 §5)
  { id: "trout", commonName: "Trout", scientificName: "Salmonidae", isGroup: true, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 500 },
  { id: "catfish", commonName: "Catfish", scientificName: "Siluriformes", isGroup: true, rollsUpTo: null, waterClass: "fresh", takeStatus: "open", sortOrder: 501 },
  { id: "walleye", commonName: "Walleye", scientificName: "Sander vitreus", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 502 },
  { id: "yellow_perch", commonName: "Yellow perch", scientificName: "Perca flavescens", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "open", sortOrder: 503 },
  { id: "smallmouth_bass", commonName: "Smallmouth bass", scientificName: "Micropterus dolomieu", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 504 },
  { id: "largemouth_bass", commonName: "Largemouth bass", scientificName: "Micropterus salmoides", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 505 },
  { id: "lake_trout", commonName: "Lake trout", scientificName: "Salvelinus namaycush", isGroup: false, rollsUpTo: "trout", waterClass: "fresh", takeStatus: "regulated", sortOrder: 506 },
  { id: "steelhead", commonName: "Steelhead", scientificName: "Oncorhynchus mykiss", isGroup: false, rollsUpTo: "trout", waterClass: "fresh", takeStatus: "regulated", sortOrder: 507 },
  { id: "brown_trout", commonName: "Brown trout", scientificName: "Salmo trutta", isGroup: false, rollsUpTo: "trout", waterClass: "fresh", takeStatus: "regulated", sortOrder: 508 },
  { id: "muskellunge", commonName: "Muskellunge (muskie)", scientificName: "Esox masquinongy", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 509 },
  { id: "northern_pike", commonName: "Northern pike", scientificName: "Esox lucius", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "open", sortOrder: 510 },
  { id: "black_crappie", commonName: "Black crappie", scientificName: "Pomoxis nigromaculatus", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "regulated", sortOrder: 511 },
  { id: "bluegill", commonName: "Bluegill", scientificName: "Lepomis macrochirus", isGroup: false, rollsUpTo: null, waterClass: "fresh", takeStatus: "open", sortOrder: 512 },
  { id: "channel_catfish", commonName: "Channel catfish", scientificName: "Ictalurus punctatus", isGroup: false, rollsUpTo: "catfish", waterClass: "fresh", takeStatus: "open", sortOrder: 513 },
];

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
