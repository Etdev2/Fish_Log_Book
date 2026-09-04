/**
 * Fish ID — trait packs for the fish an angler genuinely cannot tell apart (spec §17).
 *
 * The organising principle is **consequence**, not coverage. A pack earns its place when
 * getting it wrong costs something: a citation, a protected fish in the box, or a closed
 * season broken by accident. Identifying 178 species badly would be worse than identifying
 * nine well, and this repo's own stance is that a wrong confident answer beats no answer
 * only in the wrong direction.
 *
 * Both packs here are keys published by the agency that writes the rules, which is the
 * same citation-or-nothing standard Fish Legal holds itself to.
 */

import type { TraitPack } from "@/core/rules/identification/types";

export const FISH_ID_PACK_VERSION = 1;

/**
 * Pacific salmon (WDFW/ADF&G key).
 *
 * This is the highest-consequence pack in the app. In much of Washington, Oregon and
 * Alaska an angler is required to identify the species before retaining it, seasons differ
 * per species on the same river on the same day, and the tell is two features you can read
 * on a fish in your hands: what the spots do on the tail, and the colour of the gum line.
 */
export const SALMON_PACK: TraitPack = {
  id: "pacific-salmon",
  name: "Pacific salmon",
  version: FISH_ID_PACK_VERSION,
  source:
    "WDFW Salmon & Trout Identification guide and the Washington salmon-identification regulations page, cross-checked against ADF&G's five-species guide. The tail-spot and gum-line key is theirs.",
  questions: [
    {
      id: "tail-spots",
      question: "What do the spots do on the tail?",
      options: [
        { id: "tail-both", label: "Spots on both lobes", figure: "tail-spots-both" },
        { id: "tail-upper", label: "Spots on the upper lobe only", figure: "tail-spots-upper" },
        { id: "tail-whole", label: "Large oval spots over the whole tail", figure: "tail-spots-whole" },
        { id: "tail-none", label: "No spots on the tail", figure: "tail-spots-none" },
      ],
    },
    {
      id: "gums",
      question: "Pull back the lip — what colour is the gum line?",
      options: [
        { id: "gums-black", label: "Black gums", figure: "gums-black" },
        { id: "gums-white", label: "White gums", figure: "gums-white" },
      ],
    },
    {
      id: "mouth",
      question: "And the inside of the mouth?",
      options: [
        { id: "mouth-black", label: "Black" },
        { id: "mouth-white", label: "White or pale" },
      ],
    },
    {
      id: "body",
      question: "What does the body look like?",
      options: [
        { id: "body-bright", label: "Bright silver, fresh from the salt" },
        { id: "body-red", label: "Red body, green head" },
        { id: "body-bars", label: "Olive with vertical bars or calico blotches" },
        { id: "body-hump", label: "Big hump on the back" },
      ],
    },
    {
      id: "size",
      question: "How big?",
      options: [
        { id: "size-small", label: "Under about 6 lb" },
        { id: "size-mid", label: "Around 6 to 15 lb" },
        { id: "size-big", label: "Over about 15 lb" },
      ],
    },
  ],
  profiles: [
    {
      speciesId: "chinook_salmon",
      commonName: "Chinook (king) salmon",
      scientificName: "Oncorhynchus tshawytscha",
      noRetention: false,
      traits: {
        "tail-both": 1, "tail-upper": 0.2, "tail-none": 0.1, "tail-whole": 0.4,
        "gums-black": 1, "gums-white": 0.1,
        "mouth-black": 1, "mouth-white": 0.2,
        "body-bright": 1, "body-red": 0.5, "body-hump": 0.2,
        "size-big": 1, "size-small": 0.3,
      },
      keyFeatures: [
        "Spots on BOTH lobes of the tail",
        "Black mouth and a black gum line — the deciding mark against a coho",
        "Largest of the five; a fish over 30 lb is almost certainly this",
      ],
      similarTo: ["coho_salmon"],
    },
    {
      speciesId: "coho_salmon",
      commonName: "Coho (silver) salmon",
      scientificName: "Oncorhynchus kisutch",
      noRetention: false,
      traits: {
        "tail-upper": 1, "tail-both": 0.2, "tail-none": 0.2, "tail-whole": 0.3,
        "gums-white": 1, "gums-black": 0.15,
        "mouth-black": 1, "mouth-white": 0.4,
        "body-bright": 1, "body-red": 0.8, "body-hump": 0.3,
        "size-mid": 1, "size-big": 0.6,
      },
      keyFeatures: [
        "Spots on the UPPER lobe of the tail only",
        "Black mouth but WHITE gums — this is the chinook/coho decision",
        "Turns maroon with a greenish-black head as it colours up",
      ],
      similarTo: ["chinook_salmon"],
    },
    {
      speciesId: "pink_salmon",
      commonName: "Pink (humpy) salmon",
      scientificName: "Oncorhynchus gorbuscha",
      noRetention: false,
      traits: {
        "tail-whole": 1, "tail-both": 0.5, "tail-upper": 0.3, "tail-none": 0.2,
        "gums-black": 1, "gums-white": 0.3,
        "mouth-white": 1, "mouth-black": 0.4,
        "body-hump": 1, "body-bright": 1, "body-bars": 0.2,
        "size-small": 1, "size-big": 0.2,
      },
      keyFeatures: [
        "Large oval spots covering the WHOLE tail — bigger than any other salmon's",
        "White mouth with a black gum line",
        "Smallest of the five; spawning males grow an enormous back hump",
      ],
      similarTo: ["chum_salmon"],
    },
    {
      speciesId: "sockeye_salmon",
      commonName: "Sockeye (red) salmon",
      scientificName: "Oncorhynchus nerka",
      noRetention: false,
      traits: {
        "tail-none": 1, "tail-both": 0.15, "tail-upper": 0.2, "tail-whole": 0.1,
        "gums-white": 1, "gums-black": 0.15,
        "mouth-white": 1, "mouth-black": 0.2,
        "body-red": 1, "body-bright": 1, "body-bars": 0.3,
        "size-mid": 1, "size-big": 0.4,
      },
      keyFeatures: [
        "No distinct spots on the back or tail at all",
        "White mouth, white gums, and a large bright gold eye",
        "Brick red body with a green head when spawning",
      ],
      similarTo: ["chum_salmon"],
    },
    {
      speciesId: "chum_salmon",
      commonName: "Chum (dog) salmon",
      scientificName: "Oncorhynchus keta",
      noRetention: false,
      traits: {
        "tail-none": 1, "tail-both": 0.15, "tail-upper": 0.2, "tail-whole": 0.2,
        "gums-white": 1, "gums-black": 0.2,
        "mouth-white": 1, "mouth-black": 0.3,
        "body-bars": 1, "body-bright": 1, "body-red": 0.5,
        "size-mid": 1, "size-big": 0.6,
      },
      keyFeatures: [
        "No spots on the back or tail — same as a sockeye, so use the body",
        "Olive-green vertical bars or calico blotches on the flank as it colours up",
        "White mouth and white gums; larger pupil and no gold eye",
      ],
      similarTo: ["sockeye_salmon", "pink_salmon"],
    },
    {
      speciesId: "steelhead",
      commonName: "Steelhead",
      scientificName: "Oncorhynchus mykiss",
      noRetention: false,
      traits: {
        "tail-both": 1, "tail-none": 0.3, "tail-whole": 0.4,
        "gums-white": 1, "gums-black": 0.15,
        "mouth-white": 1, "mouth-black": 0.2,
        "body-bright": 1, "body-red": 0.4, "body-hump": 0.1,
        "size-mid": 1, "size-big": 0.7,
      },
      keyFeatures: [
        "Spots across the tail but a WHITE mouth and white gums — not a chinook",
        "A rainbow trout that went to sea: silver flank, often a faint pink stripe",
        "Square-ish tail and a thicker wrist than a salmon of the same length",
      ],
      similarTo: ["coho_salmon", "chinook_salmon"],
    },
  ],
};

/**
 * The Southern California sand basses (CDFW key).
 *
 * Three fish that share a bag limit and a slot size and are constantly confused, plus the
 * one that must never go in the box: juvenile giant sea bass are taken by mistake, and
 * they are fully protected. The engine's warning path exists for exactly this case.
 */
export const SOCAL_BASS_PACK: TraitPack = {
  id: "socal-bass",
  name: "Southern California bass",
  version: FISH_ID_PACK_VERSION,
  source:
    "CDFW Marine Species Portal kelp bass account and the CDFW spotted sand bass feature; the third-dorsal-spine key is the agency's own.",
  questions: [
    {
      id: "spine",
      question: "Look at the spiny part of the back fin. Is one spine much longer?",
      options: [
        { id: "spine-even", label: "All about the same height", figure: "spines-even" },
        { id: "spine-third", label: "The third spine is clearly the longest", figure: "spine-third-long" },
      ],
    },
    {
      id: "pattern",
      question: "What is the pattern on the body?",
      options: [
        { id: "pattern-blotch", label: "Pale blotches on olive or brown", figure: "body-blotches" },
        { id: "pattern-bars", label: "Dark vertical bars on the sides", figure: "body-bars" },
        { id: "pattern-spots", label: "Orange, brown or black spots", figure: "body-spots" },
        { id: "pattern-plain", label: "Plain, no real pattern", figure: "body-plain" },
      ],
    },
    {
      id: "where",
      question: "Where were you fishing?",
      options: [
        { id: "where-kelp", label: "Kelp or reef" },
        { id: "where-sand", label: "Open sand or flats" },
        { id: "where-bay", label: "Inside a bay or harbour" },
      ],
    },
    {
      id: "size",
      question: "How big?",
      options: [
        { id: "size-small", label: "Under about 14 inches" },
        { id: "size-legal", label: "Roughly 14 to 24 inches" },
        { id: "size-huge", label: "Much bigger — over about 3 feet" },
      ],
    },
  ],
  profiles: [
    {
      speciesId: "kelp_bass",
      commonName: "Kelp bass (calico)",
      scientificName: "Paralabrax clathratus",
      noRetention: false,
      traits: {
        "spine-even": 1, "spine-third": 0.15,
        "pattern-blotch": 1, "pattern-bars": 0.4, "pattern-spots": 0.3,
        "where-kelp": 1, "where-sand": 0.5, "where-bay": 0.5,
        "size-legal": 1, "size-huge": 0.2,
      },
      keyFeatures: [
        "Dorsal spines all about the same height — the CDFW tell against both sand basses",
        "Pale blotches on an olive-brown body, no clean vertical bars",
        "Holds in kelp and on reef rather than open sand",
      ],
      similarTo: ["barred_sand_bass"],
    },
    {
      speciesId: "barred_sand_bass",
      commonName: "Barred sand bass",
      scientificName: "Paralabrax nebulifer",
      noRetention: false,
      traits: {
        "spine-third": 1, "spine-even": 0.15,
        "pattern-bars": 1, "pattern-blotch": 0.5, "pattern-spots": 0.3,
        "where-sand": 1, "where-kelp": 0.6, "where-bay": 0.6,
        "size-legal": 1, "size-huge": 0.2,
      },
      keyFeatures: [
        "Third dorsal spine much longer than the ones either side of it",
        "Dark vertical bars along the flank, clearest on a fresh fish",
        "Open sand and the edges of structure, often in summer schools",
      ],
      similarTo: ["kelp_bass", "spotted_sand_bass"],
    },
    {
      speciesId: "spotted_sand_bass",
      commonName: "Spotted sand bass",
      scientificName: "Paralabrax maculatofasciatus",
      noRetention: false,
      traits: {
        "spine-third": 1, "spine-even": 0.15,
        "pattern-spots": 1, "pattern-bars": 0.5, "pattern-blotch": 0.4,
        "where-bay": 1, "where-sand": 0.7, "where-kelp": 0.4,
        "size-legal": 1, "size-huge": 0.2,
      },
      keyFeatures: [
        "Third dorsal spine elongated, like a barred sand bass",
        "Orange, brown and black spots over the body and fins — the separator from barred",
        "A bay and estuary fish above all",
      ],
      similarTo: ["barred_sand_bass"],
    },
    {
      speciesId: "giant_sea_bass",
      commonName: "Giant sea bass",
      scientificName: "Stereolepis gigas",
      noRetention: true,
      traits: {
        "spine-even": 1, "spine-third": 0.4,
        "pattern-spots": 1, "pattern-plain": 1, "pattern-blotch": 0.5,
        "where-kelp": 1, "where-sand": 0.6,
        "size-huge": 1, "size-small": 1, "size-legal": 0.5,
      },
      keyFeatures: [
        "PROTECTED — no take at any time. Release it in the water if you can.",
        "Juveniles are bright orange-red with big black spots and are mistaken for sand bass",
        "Adults are enormous and dusky; nothing else here approaches that size",
      ],
      similarTo: ["spotted_sand_bass"],
    },
  ],
};

export interface PackEntry {
  readonly pack: TraitPack;
  readonly blurb: string;
}

/** Every pack the Fish ID hub offers. Rockfish keeps its own screen for now. */
export const FISH_ID_PACKS: readonly PackEntry[] = [
  {
    pack: SALMON_PACK,
    blurb: "Tail spots and the gum line. Required before you keep one in most of the Northwest.",
  },
  {
    pack: SOCAL_BASS_PACK,
    blurb: "Calico, barred, spotted — and the protected one that gets taken by mistake.",
  },
];

export function fishPackById(id: string): TraitPack | null {
  return FISH_ID_PACKS.find((entry) => entry.pack.id === id)?.pack ?? null;
}
