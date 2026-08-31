/**
 * A starter inventory for the prototype, plus a generator for testing at the scale the
 * spec asks for (§22: 5,000 entries without UX degradation).
 *
 * Nothing here is a live query yet — the Tackle Box is session-only, the same way the tide
 * chart is fixture-backed, and the screen says so on the surface rather than implying a
 * sync that does not exist.
 */
import type { GearItem } from "./types";

const DAY = 86_400_000;
/** A fixed base instant, so the seeded "recently added" order is the same on the server and
 *  the client and there is nothing for React to flag as a hydration mismatch. */
const BASE = Date.UTC(2026, 7, 20, 17, 0, 0);

type Seed = Omit<GearItem, "id" | "createdAt" | "updatedAt" | "tags" | "favorite" | "quantity"> & {
  quantity: number;
  tags?: string[];
  favorite?: boolean;
  ageDays: number;
};

const SEEDS: Seed[] = [
  { categoryId: "hooks", name: "Mutu Light Circle 4/0", brand: "Owner", size: "4/0", quantity: 24, tags: ["Bluefin", "Offshore"], ageDays: 1 },
  { categoryId: "hooks", name: "Mutu Light Circle 2/0", brand: "Owner", size: "2/0", quantity: 31, tags: ["Yellowtail"], ageDays: 1 },
  { categoryId: "hooks", name: "Ringed Live Bait 1/0", brand: "Owner", size: "1/0", quantity: 2, ageDays: 3 },
  { categoryId: "lures", name: "Streaker 200g", brand: "Nomad", color: "Sardine", weight: "200 g", quantity: 3, favorite: true, tags: ["Bluefin", "Offshore"], lureClassId: "trolled-plug", ageDays: 2 },
  { categoryId: "jigs", name: "Flat Fall 160g", brand: "Shimano", color: "Blue/silver", weight: "160 g", quantity: 4, favorite: true, tags: ["Bluefin", "Night Fishing"], lureClassId: "yoyo-iron", ageDays: 4 },
  { categoryId: "jigs", name: "Colt Sniper 100g", brand: "Shimano", color: "Pink", weight: "100 g", quantity: 2, tags: ["Yellowtail"], lureClassId: "yoyo-iron", ageDays: 6 },
  { categoryId: "soft-plastics", name: "Paddle tail 5in", brand: "Big Hammer", color: "White", size: "5 in", quantity: 18, lureClassId: "swimbait", ageDays: 8 },
  { categoryId: "hard-baits", name: "Surface iron 6X", brand: "Salas", color: "Blue/white", quantity: 5, favorite: true, tags: ["Surface Iron", "Calico Bass"], lureClassId: "surface-iron", ageDays: 9 },
  { categoryId: "line", name: "Fluorocarbon 40 lb", brand: "Seaguar", size: "40 lb", quantity: 1, tags: ["Offshore"], ageDays: 12 },
  { categoryId: "line", name: "Braid 65 lb", brand: "Izorline", size: "65 lb", quantity: 2, ageDays: 14 },
  { categoryId: "leaders", name: "Fluorocarbon 200 lb", brand: "Seaguar", size: "200 lb", quantity: 1, tags: ["Bluefin"], ageDays: 15 },
  { categoryId: "weights", name: "Egg sinker 2 oz", size: "2 oz", quantity: 12, ageDays: 18 },
  { categoryId: "swivels", name: "Ball bearing swivel #6", brand: "Sampo", size: "#6", quantity: 9, ageDays: 20 },
  { categoryId: "rods", name: "Teramar 8ft", brand: "Shimano", size: "8 ft", quantity: 1, favorite: true, tags: ["Inshore"], ageDays: 30 },
  { categoryId: "reels", name: "Trinidad 16N", brand: "Shimano", quantity: 1, favorite: true, tags: ["Offshore"], ageDays: 30 },
  { categoryId: "tools", name: "Bait knife", brand: "Dexter", quantity: 1, ageDays: 40 },
  { categoryId: "accessories", name: "Deck towel", quantity: 3, ageDays: 45 },
];

export function seedInventory(): GearItem[] {
  return SEEDS.map((seed, index) => {
    const { ageDays, tags, favorite, ...rest } = seed;
    const at = BASE - ageDays * DAY;
    return { ...rest, id: `seed-${index}`, tags: tags ?? [], favorite: favorite ?? false, createdAt: at, updatedAt: at };
  });
}

const SIZES = ["1/0", "2/0", "3/0", "4/0", "5/0", "6/0", "7/0", "8/0"];
const BRANDS = ["Owner", "Gamakatsu", "Mustad", "VMC", "BKK"];
const COLORS = ["Black", "Nickel", "Bronze", "Blue", "Chartreuse"];

/**
 * A synthetic inventory for the scale check. Deterministic — no `Math.random` — so a slow
 * render is reproducible rather than a story about one unlucky run.
 */
export function generateInventory(count: number): GearItem[] {
  const categories = GEAR_CATEGORY_CYCLE;
  const items: GearItem[] = [];
  for (let i = 0; i < count; i++) {
    const at = BASE - i * 60_000;
    items.push({
      id: `bulk-${i}`,
      categoryId: categories[i % categories.length],
      name: `${BRANDS[i % BRANDS.length]} ${categories[i % categories.length]} ${SIZES[i % SIZES.length]}`,
      brand: BRANDS[i % BRANDS.length],
      size: SIZES[i % SIZES.length],
      color: COLORS[i % COLORS.length],
      quantity: (i % 40) + 1,
      tags: i % 7 === 0 ? ["Offshore"] : [],
      favorite: i % 23 === 0,
      createdAt: at,
      updatedAt: at,
    });
  }
  return items;
}

const GEAR_CATEGORY_CYCLE = ["hooks", "lures", "jigs", "soft-plastics", "line", "weights", "swivels", "tools"];
