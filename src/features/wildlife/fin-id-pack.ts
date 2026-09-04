/**
 * Fin ID — whales, dolphins and porpoises (passport spec §17, §20).
 *
 * This is what "Fin ID" was always about: a dorsal fin and a blow, seen once, at distance,
 * from a moving boat. It runs on the shared identification engine in
 * `core/rules/identification` — the same engine behind the rockfish wizard, which is the
 * point of §17. Adding this animal was a data file, not a second engine.
 *
 * **These are not catches and never will be.** Every animal here is protected under the
 * Marine Mammal Protection Act. Nothing in this module ranks a target, awards a point, or
 * suggests getting closer; the guidance below carries NOAA's viewing distances instead
 * (spec §21). The questions are deliberately answerable from 100 yards away, because that
 * is where the angler is legally required to stay.
 *
 * Traits are sourced, not remembered. Sources are named per species in `keyFeatures` terms
 * drawn from NOAA Fisheries species pages, the NOAA dolphin/porpoise comparison, and the
 * ADF&G wildlife-viewing profiles. Where two animals genuinely cannot be told apart at
 * distance, the engine's §4.5 refusal is the honest answer and this pack does not fight it.
 */

import type { TraitPack } from "@/core/rules/identification/types";

export const FIN_ID_PACK_VERSION = 1;

/**
 * What an angler must do about the animal, kept beside the pack rather than inside the
 * shared profile type — viewing distance is a marine-mammal concern, not something the
 * identification engine should know about.
 */
export interface ViewingGuidance {
  /** NOAA minimum approach distance, yards. */
  readonly distanceYards: number;
  readonly status: "endangered" | "protected";
  /** Set where NOAA actively wants sightings reported. */
  readonly reportUrl?: string;
}

const WHALE: ViewingGuidance = { distanceYards: 100, status: "protected" };
const WHALE_ENDANGERED: ViewingGuidance = { distanceYards: 100, status: "endangered" };
const SMALL: ViewingGuidance = { distanceYards: 50, status: "protected" };

export const VIEWING_GUIDANCE: Readonly<Record<string, ViewingGuidance>> = {
  gray_whale: WHALE,
  humpback_whale: WHALE,
  blue_whale: WHALE_ENDANGERED,
  fin_whale: WHALE_ENDANGERED,
  minke_whale: WHALE,
  north_atlantic_right_whale: {
    distanceYards: 500, // Right whales carry their own, much larger, federal buffer.
    status: "endangered",
    reportUrl: "https://www.fisheries.noaa.gov/species/north-atlantic-right-whale",
  },
  killer_whale: WHALE,
  bottlenose_dolphin: SMALL,
  common_dolphin: SMALL,
  pacific_white_sided_dolphin: SMALL,
  rissos_dolphin: SMALL,
  dalls_porpoise: SMALL,
  harbor_porpoise: SMALL,
};

export const FIN_ID_PACK: TraitPack = {
  id: "us-cetaceans",
  name: "Whales, dolphins and porpoises",
  version: FIN_ID_PACK_VERSION,
  source:
    "NOAA Fisheries species pages (gray, humpback, blue, fin, minke, North Atlantic right, killer whale, bottlenose and common dolphin, Dall's and harbor porpoise), NOAA's dolphin-versus-porpoise comparison, and ADF&G wildlife-viewing profiles. Viewing distances from NOAA Marine Life Viewing Guidelines.",

  questions: [
    {
      id: "blow",
      question: "Did you see a blow, and what shape was it?",
      options: [
        { id: "blow-tall", label: "Tall narrow column, very high", figure: "blow-tall" },
        { id: "blow-bushy", label: "Bushy, cloud-shaped", figure: "blow-bushy" },
        { id: "blow-v", label: "V-shaped, two spouts", figure: "blow-v" },
        { id: "blow-low", label: "Low, wide or heart-shaped", figure: "blow-low" },
        { id: "blow-none", label: "No blow seen", figure: "blow-none" },
      ],
    },
    {
      id: "dorsal",
      question: "What was the fin on its back like?",
      options: [
        { id: "dorsal-none", label: "No fin at all", figure: "fin-none" },
        { id: "dorsal-hump", label: "A hump or row of knuckles, not a fin", figure: "fin-hump" },
        { id: "dorsal-small-back", label: "Small fin, set well back", figure: "fin-small-back" },
        { id: "dorsal-tall-hooked", label: "Tall and hooked", figure: "fin-tall-hooked" },
        { id: "dorsal-tall-straight", label: "Very tall and straight", figure: "fin-tall-straight" },
        { id: "dorsal-curved", label: "Curved, mid-back, dolphin-like", figure: "fin-curved" },
        { id: "dorsal-triangle", label: "Small dark triangle", figure: "fin-triangle" },
      ],
    },
    {
      id: "size",
      question: "How big, next to your boat?",
      options: [
        { id: "size-small", label: "Smaller than the boat" },
        { id: "size-mid", label: "About the boat's length" },
        { id: "size-large", label: "Clearly longer than the boat" },
        { id: "size-huge", label: "Enormous — twice the boat or more" },
      ],
    },
    {
      id: "fluke",
      question: "Did it lift its tail when it dived?",
      options: [
        { id: "fluke-up", label: "Yes, tail came clear of the water" },
        { id: "fluke-down", label: "No, it just rolled under" },
      ],
    },
    {
      id: "marks",
      question: "What were its markings?",
      options: [
        { id: "mark-blackwhite", label: "Sharp black and white" },
        { id: "mark-mottled", label: "Mottled or blotchy grey" },
        { id: "mark-dark", label: "Plain dark all over" },
        { id: "mark-hourglass", label: "Hourglass or tan panel on the side" },
        { id: "mark-scarred", label: "Pale and heavily scratched" },
        { id: "mark-patches", label: "Rough white patches on the head" },
      ],
    },
    {
      id: "group",
      question: "How many were there?",
      options: [
        { id: "group-alone", label: "One or two" },
        { id: "group-small", label: "A handful" },
        { id: "group-large", label: "A big pod" },
      ],
    },
    {
      id: "behaviour",
      question: "What was it doing?",
      options: [
        { id: "behav-bowride", label: "Riding the bow wave" },
        { id: "behav-breach", label: "Breaching or slapping" },
        { id: "behav-rooster", label: "Throwing a rooster-tail of spray" },
        { id: "behav-travel", label: "Just travelling or resting" },
      ],
    },
  ],

  profiles: [
    {
      speciesId: "gray_whale",
      commonName: "Gray whale",
      scientificName: "Eschrichtius robustus",
      noRetention: true,
      traits: {
        "blow-low": 1, "blow-tall": 0.3, "blow-v": 0.2,
        "dorsal-hump": 1, "dorsal-none": 0.8, "dorsal-tall-straight": 0.1, "dorsal-curved": 0.1,
        "size-large": 1, "size-small": 0.1,
        "fluke-up": 1,
        "mark-mottled": 1, "mark-blackwhite": 0.2, "mark-hourglass": 0.1,
        "group-alone": 1, "group-small": 1,
      },
      keyFeatures: [
        "No dorsal fin — a low hump followed by a row of knuckles down to the tail",
        "Mottled grey, usually crusted with barnacles and pale scars",
        "Low bushy blow, heart-shaped from behind on a calm day",
        "Lifts its flukes clear of the water on a deep dive",
      ],
      similarTo: ["humpback_whale"],
    },
    {
      speciesId: "humpback_whale",
      commonName: "Humpback whale",
      scientificName: "Megaptera novaeangliae",
      noRetention: true,
      traits: {
        "blow-bushy": 1, "blow-v": 0.2, "blow-tall": 0.4,
        "dorsal-small-back": 1, "dorsal-hump": 0.8, "dorsal-tall-straight": 0.1,
        "size-large": 1, "size-small": 0.1,
        "fluke-up": 1,
        "mark-dark": 1, "mark-hourglass": 0.1, "mark-scarred": 0.3,
        "group-alone": 1, "group-small": 1,
        "behav-breach": 1,
      },
      keyFeatures: [
        "Very long white pectoral flippers — the giveaway when it rolls or breaches",
        "Small dorsal fin sitting on a fleshy hump",
        "Bushy, cloud-shaped blow",
        "Flukes lifted high on a dive, with a pattern unique to the individual",
      ],
      similarTo: ["gray_whale", "fin_whale"],
    },
    {
      speciesId: "blue_whale",
      commonName: "Blue whale",
      scientificName: "Balaenoptera musculus",
      noRetention: true,
      traits: {
        "blow-tall": 1, "blow-low": 0.2, "blow-v": 0.1, "blow-bushy": 0.4,
        "dorsal-small-back": 1, "dorsal-tall-straight": 0.1, "dorsal-curved": 0.1,
        "size-huge": 1, "size-small": 0.1, "size-mid": 0.1,
        "mark-mottled": 1, "mark-blackwhite": 0.2, "mark-hourglass": 0.1,
        "group-alone": 1,
      },
      keyFeatures: [
        "The tallest blow of any whale — a narrow column that can reach 30 feet",
        "Enormous and slender; mottled blue-grey that looks pale under water",
        "Tiny dorsal fin, set very far back and often not seen at all",
      ],
      similarTo: ["fin_whale"],
    },
    {
      speciesId: "fin_whale",
      commonName: "Fin whale",
      scientificName: "Balaenoptera physalus",
      noRetention: true,
      traits: {
        "blow-tall": 1, "blow-v": 0.2, "blow-low": 0.3,
        "dorsal-tall-hooked": 1, "dorsal-none": 0.1, "dorsal-hump": 0.2,
        "size-huge": 1, "size-large": 1, "size-small": 0.1,
        "fluke-down": 1, "fluke-up": 0.2,
        "mark-dark": 1, "mark-hourglass": 0.1,
        "group-alone": 1, "group-small": 1,
      },
      keyFeatures: [
        "Tall hooked dorsal fin about two thirds of the way back, rising at a shallow angle",
        "Dark back, white underside, and a white right lower jaw — asymmetric, unique to this whale",
        "Very large and fast; rarely lifts its flukes when diving",
      ],
      similarTo: ["blue_whale", "humpback_whale"],
    },
    {
      speciesId: "minke_whale",
      commonName: "Minke whale",
      scientificName: "Balaenoptera acutorostrata",
      noRetention: true,
      traits: {
        "blow-low": 1, "blow-none": 1, "blow-tall": 0.2, "blow-v": 0.1,
        "dorsal-curved": 1, "dorsal-tall-hooked": 0.8, "dorsal-none": 0.1,
        "size-mid": 1, "size-huge": 0.2,
        "fluke-down": 1,
        "mark-dark": 1, "mark-hourglass": 0.2,
        "group-alone": 1,
      },
      keyFeatures: [
        "Smallest of the local baleen whales — about the length of a sportfisher",
        "Blow is faint and often missed entirely",
        "Curved dorsal fin appears almost at the same moment as the blow",
        "Pale band across each flipper, if you get a clear look",
      ],
      similarTo: ["fin_whale"],
    },
    {
      speciesId: "north_atlantic_right_whale",
      commonName: "North Atlantic right whale",
      scientificName: "Eubalaena glacialis",
      noRetention: true,
      traits: {
        "blow-v": 1, "blow-tall": 0.3, "blow-low": 0.4,
        "dorsal-none": 1, "dorsal-tall-hooked": 0.1, "dorsal-tall-straight": 0.1, "dorsal-curved": 0.1,
        "size-large": 1, "size-small": 0.1,
        "fluke-up": 1,
        "mark-patches": 1, "mark-hourglass": 0.1, "mark-blackwhite": 0.3,
        "group-alone": 1,
      },
      keyFeatures: [
        "V-shaped blow — two spouts, seen from ahead or behind",
        "No dorsal fin at all on a stocky black body",
        "Rough white patches on the head, called callosities",
        "Critically endangered. If you are on the Atlantic coast, report the sighting.",
      ],
      similarTo: ["gray_whale"],
    },
    {
      speciesId: "killer_whale",
      commonName: "Killer whale (orca)",
      scientificName: "Orcinus orca",
      noRetention: true,
      traits: {
        "blow-bushy": 1, "blow-tall": 0.3, "blow-none": 1,
        "dorsal-tall-straight": 1, "dorsal-none": 0.1, "dorsal-hump": 0.1, "dorsal-triangle": 0.3,
        "size-mid": 1, "size-huge": 0.2,
        "mark-blackwhite": 1, "mark-mottled": 0.2, "mark-hourglass": 0.2, "mark-dark": 0.4,
        "group-small": 1, "group-large": 1,
        "behav-breach": 1,
      },
      keyFeatures: [
        "Unmistakable sharp black and white, with a white patch behind the eye",
        "Males carry a very tall, straight dorsal fin — up to six feet",
        "Travels in family groups that surface together",
      ],
      similarTo: ["dalls_porpoise"],
    },
    {
      speciesId: "bottlenose_dolphin",
      commonName: "Bottlenose dolphin",
      scientificName: "Tursiops truncatus",
      noRetention: true,
      traits: {
        "blow-none": 1, "blow-tall": 0.1, "blow-v": 0.1,
        "dorsal-curved": 1, "dorsal-none": 0.1, "dorsal-tall-straight": 0.2, "dorsal-hump": 0.1,
        "size-small": 1, "size-huge": 0.1, "size-large": 0.1,
        "mark-dark": 1, "mark-hourglass": 0.2, "mark-blackwhite": 0.3,
        "group-small": 1, "group-large": 1,
        "behav-bowride": 1,
      },
      keyFeatures: [
        "Uniform grey, paler underneath, with a short thick beak",
        "Bigger and stockier than a common dolphin — 8 to 12 feet",
        "Tall curved dorsal fin at the middle of the back",
        "Will often come to the boat and ride the bow",
      ],
      similarTo: ["common_dolphin", "rissos_dolphin"],
    },
    {
      speciesId: "common_dolphin",
      commonName: "Common dolphin",
      scientificName: "Delphinus delphis",
      noRetention: true,
      traits: {
        "blow-none": 1, "blow-tall": 0.1,
        "dorsal-curved": 1, "dorsal-none": 0.1, "dorsal-tall-straight": 0.2,
        "size-small": 1, "size-large": 0.1, "size-huge": 0.1,
        "mark-hourglass": 1, "mark-dark": 0.4, "mark-blackwhite": 0.4, "mark-scarred": 0.2,
        "group-large": 1, "group-alone": 0.3,
        "behav-bowride": 1,
      },
      keyFeatures: [
        "Hourglass pattern on the flank — tan or gold forward, pale grey behind",
        "Smaller and slimmer than a bottlenose, 5 to 8 feet, with a long slender beak",
        "Usually in big fast-moving pods, often hundreds",
      ],
      similarTo: ["bottlenose_dolphin", "pacific_white_sided_dolphin"],
    },
    {
      speciesId: "pacific_white_sided_dolphin",
      commonName: "Pacific white-sided dolphin",
      scientificName: "Lagenorhynchus obliquidens",
      noRetention: true,
      traits: {
        "blow-none": 1,
        "dorsal-curved": 1, "dorsal-none": 0.1, "dorsal-triangle": 0.3,
        "size-small": 1, "size-huge": 0.1, "size-large": 0.1,
        "mark-blackwhite": 1, "mark-hourglass": 0.5, "mark-mottled": 0.2,
        "group-large": 1,
        "behav-bowride": 1, "behav-breach": 1,
      },
      keyFeatures: [
        "Strongly two-toned: dark back, pale grey flank stripes, white belly",
        "Tall dorsal fin that is dark in front and pale behind — the quickest tell",
        "Boisterous, in large pods, and a keen bow-rider",
      ],
      similarTo: ["common_dolphin"],
    },
    {
      speciesId: "rissos_dolphin",
      commonName: "Risso's dolphin",
      scientificName: "Grampus griseus",
      noRetention: true,
      traits: {
        "blow-none": 1,
        "dorsal-tall-hooked": 1, "dorsal-curved": 1, "dorsal-none": 0.1, "dorsal-triangle": 0.2,
        "size-small": 1, "size-mid": 0.8, "size-huge": 0.1,
        "mark-scarred": 1, "mark-hourglass": 0.1, "mark-dark": 0.5,
        "group-small": 1,
      },
      keyFeatures: [
        "Pale grey and covered in white scratches — older animals look almost white",
        "Blunt head with no beak at all",
        "Tall dorsal fin, taller than a bottlenose's for the body size",
      ],
      similarTo: ["bottlenose_dolphin"],
    },
    {
      speciesId: "dalls_porpoise",
      commonName: "Dall's porpoise",
      scientificName: "Phocoenoides dalli",
      noRetention: true,
      traits: {
        "blow-none": 1,
        "dorsal-triangle": 1, "dorsal-curved": 0.4, "dorsal-none": 0.1, "dorsal-tall-straight": 0.3,
        "size-small": 1, "size-large": 0.1, "size-huge": 0.1,
        "mark-blackwhite": 1, "mark-hourglass": 0.2, "mark-scarred": 0.2,
        "group-small": 1,
        "behav-rooster": 1,
      },
      keyFeatures: [
        "Throws a rooster-tail of spray at speed — nothing else here does that",
        "Black and white like a tiny orca, but only about six feet long",
        "Small triangular dorsal fin with a white blaze along the top",
        "Fast and busy; rarely leaps clear the way a dolphin does",
      ],
      similarTo: ["killer_whale", "harbor_porpoise"],
    },
    {
      speciesId: "harbor_porpoise",
      commonName: "Harbor porpoise",
      scientificName: "Phocoena phocoena",
      noRetention: true,
      traits: {
        "blow-none": 1,
        "dorsal-triangle": 1, "dorsal-curved": 0.4, "dorsal-tall-straight": 0.1, "dorsal-none": 0.1,
        "size-small": 1, "size-mid": 0.2, "size-large": 0.1, "size-huge": 0.1,
        "mark-dark": 1, "mark-blackwhite": 0.3, "mark-hourglass": 0.1,
        "group-alone": 1, "group-small": 1,
        "behav-bowride": 0.1, "behav-rooster": 0.2, "behav-travel": 1,
      },
      keyFeatures: [
        "Small, dark and shy — usually a brief roll and gone",
        "Small blunt triangular dorsal fin, no white blaze",
        "Avoids boats; almost never rides a bow, which separates it from every dolphin here",
      ],
      similarTo: ["dalls_porpoise"],
    },
  ],
};
