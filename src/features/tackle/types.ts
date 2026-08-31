/**
 * The gear inventory model (`docs/specs/tackle-box.md` §20).
 *
 * Two identifiers, deliberately, and the distinction is the one architectural thing in
 * this feature that matters later:
 *
 * `categoryId` is the angler-facing axis the spec organises by — Hooks, Line, Rods, Reels.
 * `lureClassId` is the poolable one from `docs/architecture/ontology.md` §4: the angler's
 * own lure is not comparable across users, its CLASS is. Only lure-ish categories have
 * one, which is why it is optional here and why `tackle_item.lure_class_id not null` in
 * the current schema cannot hold a rod. That conflict is flagged for `architect` in
 * `docs/team/channel/2026-08-31-01-ux-ui-to-architect.md`; nothing here migrates anything.
 *
 * Every item carries a persistent `id` so a catch can eventually name the exact item used
 * (spec §21), never the display string.
 */

export type GearCategoryId =
  | "lures"
  | "hooks"
  | "jigs"
  | "soft-plastics"
  | "hard-baits"
  | "terminal"
  | "line"
  | "leaders"
  | "weights"
  | "swivels"
  | "rods"
  | "reels"
  | "tools"
  | "accessories"
  | "other";

export interface GearCategory {
  readonly id: GearCategoryId;
  readonly label: string;
  /** A glyph, not an icon font or an image: it ships with the text and never 404s. */
  readonly glyph: string;
  /** Whether items in this category point at a poolable `lure_class`. */
  readonly lureLike: boolean;
}

/**
 * A vocabulary, not a union baked into the UI (spec §5: categories must not be hard-coded
 * in a way that prevents expansion). Screens iterate this list; adding a row here is the
 * whole change, and when the real `gear_category` table lands this array is what it seeds.
 */
export const GEAR_CATEGORIES: readonly GearCategory[] = [
  { id: "lures", label: "Lures", glyph: "🎣", lureLike: true },
  { id: "hooks", label: "Hooks", glyph: "🪝", lureLike: false },
  { id: "jigs", label: "Jigs", glyph: "🟡", lureLike: true },
  { id: "soft-plastics", label: "Soft plastics", glyph: "🪱", lureLike: true },
  { id: "hard-baits", label: "Hard baits", glyph: "🐟", lureLike: true },
  { id: "terminal", label: "Terminal tackle", glyph: "🔩", lureLike: false },
  { id: "line", label: "Line", glyph: "🧵", lureLike: false },
  { id: "leaders", label: "Leaders", glyph: "➰", lureLike: false },
  { id: "weights", label: "Sinkers & weights", glyph: "⚓", lureLike: false },
  { id: "swivels", label: "Swivels", glyph: "🔗", lureLike: false },
  { id: "rods", label: "Rods", glyph: "🎏", lureLike: false },
  { id: "reels", label: "Reels", glyph: "🌀", lureLike: false },
  { id: "tools", label: "Tools", glyph: "🔧", lureLike: false },
  { id: "accessories", label: "Accessories", glyph: "🧰", lureLike: false },
  { id: "other", label: "Other", glyph: "📦", lureLike: false },
];

export function categoryFor(id: string): GearCategory | undefined {
  return GEAR_CATEGORIES.find((category) => category.id === id);
}

export function categoryLabel(id: string): string {
  return categoryFor(id)?.label ?? "Other";
}

export interface GearItem {
  readonly id: string;
  readonly categoryId: string;
  readonly lureClassId?: string;
  readonly name: string;
  readonly brand?: string;
  readonly size?: string;
  readonly color?: string;
  readonly weight?: string;
  readonly quantity: number;
  readonly notes?: string;
  readonly tags: readonly string[];
  readonly imageUrl?: string;
  readonly favorite: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** Everything the editor collects. Only `categoryId`, `name` and `quantity` are required
 *  (spec §9) — the rest of the form may be left untouched and the item still saves. */
export type GearDraft = Omit<GearItem, "id" | "createdAt" | "updatedAt">;

export const EMPTY_DRAFT: GearDraft = {
  categoryId: "lures",
  name: "",
  quantity: 1,
  tags: [],
  favorite: false,
};

/** Below this, an item shows as low stock and the "Low stock" filter catches it. */
export const LOW_STOCK_AT = 3;

export function isLowStock(item: GearItem): boolean {
  return item.quantity <= LOW_STOCK_AT;
}

/** Quantity is a count of physical objects: it has no negative (spec §12). */
export function clampQuantity(quantity: number): number {
  return Number.isFinite(quantity) ? Math.max(0, Math.round(quantity)) : 0;
}

export type GearSort = "recent" | "name" | "brand" | "quantity" | "updated" | "category";

export const GEAR_SORT_LABELS: Record<GearSort, string> = {
  recent: "Recently added",
  updated: "Recently updated",
  name: "Name",
  brand: "Brand",
  quantity: "Quantity",
  category: "Category",
};

export interface GearQuery {
  readonly text: string;
  readonly categoryId: string | null;
  readonly brand: string | null;
  readonly favoritesOnly: boolean;
  readonly lowStockOnly: boolean;
}

export const EMPTY_QUERY: GearQuery = {
  text: "",
  categoryId: null,
  brand: null,
  favoritesOnly: false,
  lowStockOnly: false,
};

/** True when any narrowing is active — the screen says so rather than leaving a reader to
 *  wonder why their gear is missing. */
export function isNarrowed(query: GearQuery): boolean {
  return (
    query.text.trim() !== "" ||
    query.categoryId !== null ||
    query.brand !== null ||
    query.favoritesOnly ||
    query.lowStockOnly
  );
}

/**
 * Free-text match over everything the angler might type (spec §13): name, brand, size,
 * colour, weight, tags, notes, and the category's own label — so "hooks" finds hooks even
 * though no item stores that word.
 *
 * Every term must match somewhere, so "owner 3/0" narrows rather than widens. Matching is
 * case- and accent-insensitive by way of `toLocaleLowerCase`, and substring rather than
 * prefix, because "circle hook" should find "Mutu Circle Hook".
 */
export function matchesText(item: GearItem, text: string): boolean {
  const terms = text.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [
    item.name,
    item.brand,
    item.size,
    item.color,
    item.weight,
    item.notes,
    categoryLabel(item.categoryId),
    ...item.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function matchesQuery(item: GearItem, query: GearQuery): boolean {
  if (query.categoryId !== null && item.categoryId !== query.categoryId) return false;
  if (query.brand !== null && (item.brand ?? "") !== query.brand) return false;
  if (query.favoritesOnly && !item.favorite) return false;
  if (query.lowStockOnly && !isLowStock(item)) return false;
  return matchesText(item, query.text);
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * Sorted with a stable tie-break on name, so two items with the same brand or quantity
 * never swap places between renders — a list that reshuffles under a thumb is worse than
 * one sorted slightly differently than expected.
 */
export function sortGear(items: readonly GearItem[], sort: GearSort): GearItem[] {
  const byName = (a: GearItem, b: GearItem) => collator.compare(a.name, b.name);
  const sorted = [...items];
  switch (sort) {
    case "name":
      return sorted.sort(byName);
    case "brand":
      return sorted.sort((a, b) => collator.compare(a.brand ?? "￿", b.brand ?? "￿") || byName(a, b));
    case "quantity":
      return sorted.sort((a, b) => b.quantity - a.quantity || byName(a, b));
    case "updated":
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt || byName(a, b));
    case "category":
      return sorted.sort((a, b) => collator.compare(categoryLabel(a.categoryId), categoryLabel(b.categoryId)) || byName(a, b));
    case "recent":
    default:
      return sorted.sort((a, b) => b.createdAt - a.createdAt || byName(a, b));
  }
}

export function selectGear(items: readonly GearItem[], query: GearQuery, sort: GearSort): GearItem[] {
  return sortGear(items.filter((item) => matchesQuery(item, query)), sort);
}

/** How many entries sit in each category, for the category cards (spec §6). */
export function countByCategory(items: readonly GearItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  return counts;
}

/** Distinct brands actually present, for the brand filter — never a fixed brand list. */
export function brandsIn(items: readonly GearItem[]): string[] {
  const brands = new Set<string>();
  for (const item of items) if (item.brand) brands.add(item.brand);
  return [...brands].sort((a, b) => collator.compare(a, b));
}

/**
 * A duplicate carries everything across (spec §11): the angler is entering the same hook in
 * a different size, so the only field they should have to touch is the one that differs.
 * The copy is a DRAFT, not an item — it gets its own id when saved, because two physical
 * boxes of hooks are two rows a catch might one day point at.
 */
export function draftFrom(item: GearItem): GearDraft {
  return {
    categoryId: item.categoryId,
    lureClassId: item.lureClassId,
    name: item.name,
    brand: item.brand,
    size: item.size,
    color: item.color,
    weight: item.weight,
    quantity: item.quantity,
    notes: item.notes,
    tags: [...item.tags],
    imageUrl: item.imageUrl,
    favorite: item.favorite,
  };
}

/**
 * The values the angler used most recently, for pre-filling the next entry (spec §10).
 * Recency beats frequency here: someone working through a box of Owner hooks wants the
 * last thing they typed, not the most common thing in the whole inventory.
 */
export function recentValues(
  items: readonly GearItem[],
  field: "brand" | "size" | "color",
  limit = 6,
): string[] {
  const seen: string[] = [];
  for (const item of [...items].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const value = item[field];
    if (value && !seen.includes(value)) seen.push(value);
    if (seen.length >= limit) break;
  }
  return seen;
}

export function parseTags(input: string): string[] {
  const seen: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag && !seen.some((existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase())) seen.push(tag);
  }
  return seen;
}
