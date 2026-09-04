import type { TackleItem } from "./types";

/**
 * Deliberately local sample data for the web prototype. This is not a user's tackle,
 * is not written to storage, and is replaced by the offline query layer when that lane lands.
 * It spans several categories on purpose so the category-driven form and low-stock
 * states are visible on first load. Includes one low and one out-of-stock item.
 */
export const TACKLE_FIXTURE: readonly TackleItem[] = [
  {
    id: "fixture-mutu-circle",
    category: "hooks",
    label: "Owner Mutu circle hooks",
    quantity: 18,
    lowStockAt: 8,
    attributes: { brand: "Owner", style: "Circle", size: "4/0" },
    isFavorite: true,
    addedAt: Date.UTC(2026, 7, 29, 15, 0),
  },
  {
    id: "fixture-octopus",
    category: "hooks",
    label: "Gamakatsu octopus 2/0",
    quantity: 6,
    lowStockAt: 8,
    attributes: { brand: "Gamakatsu", style: "Octopus", size: "2/0" },
    notes: "Dropper-loop hooks for rockfish.",
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 28, 15, 0),
  },
  {
    id: "fixture-tady-45",
    category: "jigs",
    label: "Tady 45 surface iron",
    quantity: 3,
    lowStockAt: 2,
    attributes: { brand: "Tady", style: "Surface iron", weight: "4 oz", color: "Mint" },
    isFavorite: true,
    addedAt: Date.UTC(2026, 7, 27, 15, 0),
  },
  {
    id: "fixture-streaker",
    category: "hard-baits",
    label: "Nomad Streaker",
    quantity: 1,
    lowStockAt: null,
    attributes: { brand: "Nomad", type: "Stickbait", weight: "200 g", color: "Sardine" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 26, 15, 0),
  },
  {
    id: "fixture-paddle-tails",
    category: "soft-plastics",
    label: "Big Hammer paddle tails",
    quantity: 24,
    lowStockAt: 10,
    attributes: { brand: "Big Hammer", style: "Paddle tail", size: "5 in", color: "Pearl white" },
    isFavorite: true,
    addedAt: Date.UTC(2026, 7, 25, 15, 0),
  },
  {
    id: "fixture-braid",
    category: "line",
    label: "Mainline braid",
    quantity: 1,
    lowStockAt: null,
    attributes: { brand: "PowerPro", material: "Braid", poundTest: "65 lb", spoolLength: "500 yd", color: "Hi-vis yellow" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 24, 15, 0),
  },
  {
    id: "fixture-fluoro-leader",
    category: "leaders",
    label: "Seaguar fluoro leader",
    quantity: 0,
    lowStockAt: 1,
    attributes: { brand: "Seaguar", material: "Fluorocarbon", poundTest: "40 lb", spoolLength: "25 yd" },
    notes: "Used for yellowtail at Catalina. Restock before the next overnight.",
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 23, 15, 0),
  },
  {
    id: "fixture-torpedo",
    category: "sinkers-weights",
    label: "Torpedo sinkers 4 oz",
    quantity: 12,
    lowStockAt: 6,
    attributes: { style: "Torpedo", weight: "4 oz", material: "Lead" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 22, 15, 0),
  },
  {
    id: "fixture-swivels",
    category: "terminal-tackle",
    label: "Ball-bearing swivels",
    quantity: 9,
    lowStockAt: 4,
    attributes: { brand: "Spro", kind: "Ball-bearing swivel", size: "100 lb" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 21, 15, 0),
  },
  {
    id: "fixture-calico-stick",
    category: "rods",
    label: "Calico special",
    quantity: 1,
    lowStockAt: null,
    attributes: { brand: "Calstar", type: "Conventional", length: "7 ft", rating: "12–20 lb" },
    isFavorite: true,
    addedAt: Date.UTC(2026, 7, 20, 15, 0),
  },
  {
    id: "fixture-lexa",
    category: "reels",
    label: "Lexa 300",
    quantity: 1,
    lowStockAt: null,
    attributes: { brand: "Daiwa", type: "Baitcasting", size: "300" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 19, 15, 0),
  },
  {
    id: "fixture-pliers",
    category: "tools",
    label: "Split-ring pliers",
    quantity: 1,
    lowStockAt: null,
    attributes: { brand: "Bubba", kind: "Pliers" },
    isFavorite: false,
    addedAt: Date.UTC(2026, 7, 18, 15, 0),
  },
];

/**
 * Whether an item is sample data rather than something the angler put in the box.
 *
 * The guided setup checklist needs this: the Tackle Box ships pre-seeded so the
 * category form and low-stock states are visible on first load, which meant "add gear to
 * your Tackle Box" rendered as already done for somebody who had never opened it. A
 * checklist that ticks a box you did not tick teaches you not to trust the other four.
 */
export function isFixtureItem(item: { readonly id: string }): boolean {
  return item.id.startsWith("fixture-");
}
