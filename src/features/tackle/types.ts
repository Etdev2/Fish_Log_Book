/**
 * Tackle Box domain types, category registry, and pure inventory logic.
 *
 * The page is still a session-only prototype (see docs/design/08-tackle-box.md),
 * but the model is shaped for the eventual offline store: stable ids, a category
 * registry that extends by adding data (not code), and category-specific
 * attributes kept in one flat record so persistence stays trivial.
 */

export type CategoryId =
  | "hooks"
  | "jigs"
  | "hard-baits"
  | "soft-plastics"
  | "line"
  | "leaders"
  | "sinkers-weights"
  | "terminal-tackle"
  | "rods"
  | "reels"
  | "tools"
  | "accessories"
  | "other";

export type AttributeField = {
  /** Key within TackleItem.attributes. Shared names ("brand", "color", "weight")
   *  carry their value over when the angler switches category mid-entry. */
  key: string;
  label: string;
  /** Common, real-world choices. Never exhaustive — every field allows Other. */
  options: readonly string[];
  /** Placeholder for the free-text Other input. */
  placeholder: string;
  /** Ladder fields (hook sizes, pound test, weights) show every step; categorical
   *  fields default to 8 chips so rows stay tidy. */
  maxChips?: number;
};

export type CategorySpec = {
  id: CategoryId;
  label: string;
  /** Placeholder showing what a good item name looks like. */
  namePlaceholder: string;
  /** Brand, when the category carries one, is always the first field. */
  fields: readonly AttributeField[];
};

export const TACKLE_CATEGORIES: readonly CategorySpec[] = [
  {
    id: "hooks",
    label: "Hooks",
    namePlaceholder: "e.g. Owner Mutu circle 4/0",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Owner", "Gamakatsu", "Mustad", "VMC", "Hayabusa", "Eagle Claw"],
        placeholder: "e.g. BKK",
      },
      {
        key: "style",
        label: "Hook style",
        options: ["Circle", "J-hook", "Octopus", "Live bait", "Treble", "Siwash", "Worm / offset", "Assist"],
        placeholder: "e.g. Fly hook",
      },
      {
        key: "size",
        label: "Size",
        options: ["8", "6", "4", "2", "1", "1/0", "2/0", "3/0", "4/0", "5/0", "6/0", "7/0", "8/0"],
        placeholder: "e.g. 9/0",
        maxChips: 13,
      },
    ],
  },
  {
    id: "jigs",
    label: "Jigs",
    namePlaceholder: "e.g. Tady 45 in mint",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Tady", "Salas", "JRI", "Shimano", "Daiwa", "Williamson"],
        placeholder: "e.g. Striker",
      },
      {
        key: "style",
        label: "Jig style",
        options: ["Surface iron", "Yo-yo iron", "Flat fall", "Knife", "Bucktail", "Lead-head", "Casting"],
        placeholder: "e.g. Skirt jig",
      },
      {
        key: "weight",
        label: "Weight",
        options: ["1 oz", "2 oz", "3 oz", "4 oz", "6 oz", "100 g", "150 g", "200 g", "250 g", "300 g"],
        placeholder: "e.g. 8 oz",
        maxChips: 10,
      },
      {
        key: "color",
        label: "Color / pattern",
        options: ["Blue / sardine", "Mint", "Chrome", "Scrambled egg", "Blue / white", "Glow"],
        placeholder: "e.g. Dorado",
      },
    ],
  },
  {
    id: "hard-baits",
    label: "Hard baits",
    namePlaceholder: "e.g. Nomad Streaker 200 g",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Nomad", "Rapala", "Yo-Zuri", "Shimano", "Duo", "Lucky Craft"],
        placeholder: "e.g. Strike Pro",
      },
      {
        key: "type",
        label: "Lure type",
        options: ["Jerkbait", "Crankbait", "Topwater walker", "Popper", "Stickbait", "Trolling plug", "Spoon"],
        placeholder: "e.g. Wakebait",
      },
      {
        key: "size",
        label: "Length",
        options: ["3 in", "4 in", "5 in", "6 in", "7 in", "9 in"],
        placeholder: "e.g. 90 mm",
      },
      {
        key: "weight",
        label: "Weight",
        options: ["1/4 oz", "3/8 oz", "1/2 oz", "3/4 oz", "1 oz", "2 oz", "100 g", "150 g", "200 g"],
        placeholder: "e.g. 240 g",
        maxChips: 9,
      },
      {
        key: "color",
        label: "Color / pattern",
        options: ["Sardine", "Chrome", "Bonita", "Bone", "Blue mackerel", "Fire tiger"],
        placeholder: "e.g. Squid",
      },
    ],
  },
  {
    id: "soft-plastics",
    label: "Soft plastics",
    namePlaceholder: "e.g. 5 in paddle tails, pearl",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Keitech", "Big Hammer", "MC Swimbaits", "Zoom", "Berkley", "Roboworm", "Z-Man"],
        placeholder: "e.g. Yamamoto",
      },
      {
        key: "style",
        label: "Style",
        options: ["Paddle tail", "Grub", "Worm", "Fluke", "Craw", "Creature", "Tube", "Stick worm"],
        placeholder: "e.g. Shrimp",
      },
      {
        key: "size",
        label: "Length",
        options: ["3 in", "4 in", "5 in", "6 in", "7 in"],
        placeholder: "e.g. 2.8 in",
      },
      {
        key: "color",
        label: "Color",
        options: ["Pearl white", "Green pumpkin", "Watermelon", "Chartreuse", "Motor oil"],
        placeholder: "e.g. Blue shad",
      },
    ],
  },
  {
    id: "line",
    label: "Line",
    namePlaceholder: "e.g. Mainline braid 65 lb",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["PowerPro", "Sufix", "Seaguar", "Berkley", "Maxima", "Izorline", "P-Line"],
        placeholder: "e.g. Daiwa J-Braid",
      },
      {
        key: "material",
        label: "Material",
        options: ["Braid", "Monofilament", "Fluorocarbon", "Copolymer"],
        placeholder: "e.g. Wire",
      },
      {
        key: "poundTest",
        label: "Pound test",
        options: ["6 lb", "8 lb", "10 lb", "12 lb", "15 lb", "20 lb", "25 lb", "30 lb", "40 lb", "50 lb", "65 lb", "80 lb", "100 lb"],
        placeholder: "e.g. 130 lb",
        maxChips: 13,
      },
      {
        key: "spoolLength",
        label: "Spool length",
        options: ["150 yd", "300 yd", "500 yd", "1000 yd", "3000 yd"],
        placeholder: "e.g. 75 yd",
      },
      {
        key: "color",
        label: "Color",
        options: ["Clear", "Green", "Hi-vis yellow", "Blue", "Smoke"],
        placeholder: "e.g. Multi-color",
      },
    ],
  },
  {
    id: "leaders",
    label: "Leaders",
    namePlaceholder: "e.g. Top-shot fluoro 80 lb",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Seaguar", "Yo-Zuri", "Ande", "Maxima", "Momoi", "Blackwater"],
        placeholder: "e.g. Sunline",
      },
      {
        key: "material",
        label: "Material",
        options: ["Fluorocarbon", "Monofilament", "Wire"],
        placeholder: "e.g. Fluoro-coated",
      },
      {
        key: "poundTest",
        label: "Pound test",
        options: ["20 lb", "25 lb", "30 lb", "40 lb", "50 lb", "60 lb", "80 lb", "100 lb", "130 lb", "200 lb"],
        placeholder: "e.g. 150 lb",
        maxChips: 10,
      },
      {
        key: "spoolLength",
        label: "Length",
        options: ["18 in", "24 in", "3 ft", "6 ft", "25 yd", "50 yd", "100 yd"],
        placeholder: "e.g. Pre-tied 3 ft",
      },
    ],
  },
  {
    id: "sinkers-weights",
    label: "Sinkers & weights",
    namePlaceholder: "e.g. Torpedo sinkers 4 oz",
    fields: [
      {
        key: "style",
        label: "Style",
        options: ["Torpedo", "Bank", "Pyramid", "Egg", "Sliding egg", "Split shot", "Trolling"],
        placeholder: "e.g. Dipsey",
      },
      {
        key: "weight",
        label: "Weight",
        options: ["1/4 oz", "1/2 oz", "3/4 oz", "1 oz", "2 oz", "3 oz", "4 oz", "6 oz", "8 oz", "12 oz", "16 oz"],
        placeholder: "e.g. 2 lb trolling",
        maxChips: 11,
      },
      {
        key: "material",
        label: "Material",
        options: ["Lead", "Tungsten", "Steel", "Bismuth"],
        placeholder: "e.g. Tin",
      },
    ],
  },
  {
    id: "terminal-tackle",
    label: "Terminal tackle",
    namePlaceholder: "e.g. Ball-bearing swivels 100 lb",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Spro", "Owner", "Sampo", "AFW", "Danielson"],
        placeholder: "e.g. Tsunami",
      },
      {
        key: "kind",
        label: "Kind",
        options: ["Barrel swivel", "Ball-bearing swivel", "Snap swivel", "Coastlock snap", "Split ring", "Sleeve / crimp", "Sabiki rig", "Beads"],
        placeholder: "e.g. Bobber stop",
      },
      {
        key: "size",
        label: "Size / rating",
        options: ["#10", "#8", "#6", "#4", "#2", "#1", "50 lb", "100 lb", "200 lb"],
        placeholder: "e.g. 330 lb",
        maxChips: 9,
      },
    ],
  },
  {
    id: "rods",
    label: "Rods",
    namePlaceholder: "e.g. 7 ft calico stick",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Penn", "Shimano", "Daiwa", "Seeker", "Calstar", "Phenix", "Okuma"],
        placeholder: "e.g. Cousins",
      },
      {
        key: "type",
        label: "Type",
        options: ["Conventional", "Spinning", "Casting", "Fly"],
        placeholder: "e.g. Rail rod",
      },
      {
        key: "length",
        label: "Length",
        options: ["6 ft", "6'6\"", "7 ft", "7'6\"", "8 ft", "9 ft"],
        placeholder: "e.g. 8'6\"",
      },
      {
        key: "rating",
        label: "Line rating",
        options: ["8–15 lb", "12–20 lb", "15–25 lb", "20–40 lb", "30–60 lb", "40–80 lb", "60–100 lb"],
        placeholder: "e.g. 25–60 lb",
      },
    ],
  },
  {
    id: "reels",
    label: "Reels",
    namePlaceholder: "e.g. Lexa 300 baitcaster",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Shimano", "Penn", "Daiwa", "Okuma", "Avet", "Accurate"],
        placeholder: "e.g. Lew's",
      },
      {
        key: "type",
        label: "Type",
        options: ["Conventional", "Spinning", "Baitcasting", "Lever drag", "Star drag"],
        placeholder: "e.g. Electric",
      },
      {
        key: "size",
        label: "Size",
        options: ["500", "1000", "2500", "3000", "4000", "5000", "6000", "8000", "12", "16", "20", "30"],
        placeholder: "e.g. 2-speed 30",
        maxChips: 12,
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    namePlaceholder: "e.g. Split-ring pliers",
    fields: [
      {
        key: "brand",
        label: "Brand",
        options: ["Bubba", "Rapala", "Gerber", "Boomerang", "XTools"],
        placeholder: "e.g. Piscifun",
      },
      {
        key: "kind",
        label: "Tool",
        options: ["Pliers", "Fillet knife", "Bait knife", "Line cutters", "Scale", "Gaff", "Landing net", "Hook remover"],
        placeholder: "e.g. Jaw spreader",
      },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    namePlaceholder: "e.g. 3700 tackle trays",
    fields: [
      {
        key: "kind",
        label: "Accessory",
        options: ["Tackle bag", "Tackle tray", "Tackle box", "Bait bucket", "Rod holder", "Fighting belt", "Gloves", "Headlamp"],
        placeholder: "e.g. Lure wrap",
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    namePlaceholder: "e.g. Spare spool",
    fields: [],
  },
];

export type TackleItem = {
  id: string;
  category: CategoryId;
  label: string;
  quantity: number;
  /** Alert threshold set by the angler; null means no alert. Quantity 0 always surfaces. */
  lowStockAt: number | null;
  attributes: Record<string, string>;
  notes?: string;
  isFavorite: boolean;
  addedAt: number;
};

export type TackleDraft = Omit<TackleItem, "id" | "addedAt">;

export type ViewFilter = "all" | "favorites" | "low";

export const VIEW_FILTER_LABELS: Record<ViewFilter, string> = {
  all: "All",
  favorites: "Favorites",
  low: "Low stock",
};

export type SortOrder = "recent" | "name" | "category" | "quantity";

export const SORT_LABELS: Record<SortOrder, string> = {
  recent: "Recently added",
  name: "Name A–Z",
  category: "Category",
  quantity: "Lowest quantity",
};

/** Recently used values per "categoryId:fieldKey" slot, most recent first. Session-scoped for now. */
export type RecentsMap = Record<string, readonly string[]>;

const RECENTS_CAP = 4;
const CHIP_CAP = 8;

export function categoryFor(id: CategoryId): CategorySpec {
  const spec = TACKLE_CATEGORIES.find((category) => category.id === id);
  if (!spec) throw new Error(`Unknown tackle category: ${id}`);
  return spec;
}

export function isOutOfStock(item: TackleItem): boolean {
  return item.quantity === 0;
}

export function isLowStock(item: TackleItem): boolean {
  if (item.quantity === 0) return true;
  return item.lowStockAt !== null && item.quantity <= item.lowStockAt;
}

export function itemMatchesView(item: TackleItem, view: ViewFilter): boolean {
  if (view === "favorites") return item.isFavorite;
  if (view === "low") return isLowStock(item);
  return true;
}

/** Every whitespace-separated search token must appear somewhere in the item's text. */
export function itemMatchesSearch(item: TackleItem, query: string): boolean {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    item.label,
    categoryFor(item.category).label,
    item.notes ?? "",
    ...Object.values(item.attributes),
  ]
    .join(" ")
    .toLocaleLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function sortItems(items: readonly TackleItem[], order: SortOrder): TackleItem[] {
  const byName = (a: TackleItem, b: TackleItem) => a.label.localeCompare(b.label);
  const categoryRank = (item: TackleItem) =>
    TACKLE_CATEGORIES.findIndex((category) => category.id === item.category);
  const sorted = [...items];
  switch (order) {
    case "name":
      return sorted.sort(byName);
    case "category":
      return sorted.sort((a, b) => categoryRank(a) - categoryRank(b) || byName(a, b));
    case "quantity":
      return sorted.sort((a, b) => a.quantity - b.quantity || byName(a, b));
    case "recent":
      return sorted.sort((a, b) => b.addedAt - a.addedAt);
  }
}

export function countByCategory(items: readonly TackleItem[]): Partial<Record<CategoryId, { total: number; low: number }>> {
  const counts: Partial<Record<CategoryId, { total: number; low: number }>> = {};
  for (const item of items) {
    const entry = counts[item.category] ?? { total: 0, low: 0 };
    entry.total += 1;
    if (isLowStock(item)) entry.low += 1;
    counts[item.category] = entry;
  }
  return counts;
}

export function countLow(items: readonly TackleItem[]): number {
  return items.filter(isLowStock).length;
}

/**
 * One scannable card line: brand (if any) plus the next two filled attributes,
 * always in the category's own field order. Cards never dump every attribute.
 */
export function cardSummary(item: TackleItem): string {
  const parts: string[] = [];
  for (const field of categoryFor(item.category).fields) {
    const value = item.attributes[field.key];
    if (!value) continue;
    parts.push(value);
    if (parts.length === 3) break;
  }
  return parts.join(" · ");
}

/**
 * When the angler switches category mid-entry, keep values whose key the new
 * category also uses (brand, color, weight…) and drop the rest.
 */
export function retainedAttributes(next: CategorySpec, attributes: Record<string, string>): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const field of next.fields) {
    const value = attributes[field.key];
    if (value) kept[field.key] = value;
  }
  return kept;
}

/** Record a used value for a "categoryId:fieldKey" slot: trimmed, de-duped, most recent first. */
export function rememberValue(recents: RecentsMap, slot: string, value: string | undefined): RecentsMap {
  const trimmed = value?.trim();
  if (!trimmed) return recents;
  const existing = recents[slot] ?? [];
  const next = [trimmed, ...existing.filter((entry) => entry.toLocaleLowerCase() !== trimmed.toLocaleLowerCase())];
  return { ...recents, [slot]: next.slice(0, RECENTS_CAP) };
}

/** Chip row for a field: the angler's recent values first, then the common options, de-duped. */
export function suggestedOptions(options: readonly string[], recents: readonly string[], cap = CHIP_CAP): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const value of [...recents, ...options]) {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(value);
    if (merged.length === cap) break;
  }
  return merged;
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(9999, Math.max(0, Math.trunc(value)));
}
