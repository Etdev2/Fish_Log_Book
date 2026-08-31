import type { TackleItem } from "./types";

/**
 * Deliberately local sample data for the web prototype. This is not a user's tackle,
 * is not written to storage, and is replaced by the offline query layer when that lane lands.
 */
export const TACKLE_FIXTURE: readonly TackleItem[] = [
  {
    id: "fixture-sabiki",
    label: "Blue flash sabiki",
    lureClass: "Sabiki",
    waterClass: "salt",
    color: "Blue / silver",
    sizeLabel: "Size 6",
    isFavorite: true,
  },
  {
    id: "fixture-swimbait",
    label: "White paddle tail",
    lureClass: "Swimbait (soft plastic)",
    waterClass: "both",
    color: "Pearl white",
    sizeLabel: "4 in",
    isFavorite: true,
  },
  {
    id: "fixture-bucktail",
    label: "Chartreuse bucktail",
    lureClass: "Bucktail jig",
    waterClass: "both",
    color: "Chartreuse",
    sizeLabel: "1 oz",
    isFavorite: false,
  },
  {
    id: "fixture-iron",
    label: "Mint surface iron",
    lureClass: "Surface iron",
    waterClass: "salt",
    color: "Mint / chrome",
    sizeLabel: "7 in",
    isFavorite: false,
  },
  {
    id: "fixture-spinnerbait",
    label: "Willow spinnerbait",
    lureClass: "Spinnerbait",
    waterClass: "fresh",
    color: "White / gold",
    sizeLabel: "3/8 oz",
    isFavorite: false,
  },
];
