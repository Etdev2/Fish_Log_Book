import { describe, expect, it } from "vitest";

import { generateInventory, seedInventory } from "./gear-fixture";
import {
  EMPTY_QUERY,
  brandsIn,
  clampQuantity,
  countByCategory,
  draftFrom,
  isLowStock,
  isNarrowed,
  matchesText,
  parseTags,
  recentValues,
  selectGear,
  sortGear,
} from "./types";

const inventory = seedInventory();
const named = (items: { name: string }[]) => items.map((item) => item.name);

describe("search", () => {
  it("finds an item by words from different fields", () => {
    // "owner" is the brand, "circle" is in the name — neither field alone matches both.
    const hits = selectGear(inventory, { ...EMPTY_QUERY, text: "owner circle" }, "name");
    expect(hits).toHaveLength(2);
    expect(named(hits).every((name) => name.includes("Circle"))).toBe(true);
  });

  it("finds gear by its category, a word no item actually stores", () => {
    const hits = selectGear(inventory, { ...EMPTY_QUERY, text: "reels" }, "name");
    expect(named(hits)).toEqual(["Trinidad 16N"]);
  });

  it("finds gear by tag and by size", () => {
    expect(named(selectGear(inventory, { ...EMPTY_QUERY, text: "bluefin" }, "name"))).toContain("Streaker 200g");
    expect(named(selectGear(inventory, { ...EMPTY_QUERY, text: "200 lb" }, "name"))).toEqual([
      "Fluorocarbon 200 lb",
    ]);
  });

  it("narrows with each extra term rather than widening", () => {
    const one = selectGear(inventory, { ...EMPTY_QUERY, text: "owner" }, "name").length;
    const two = selectGear(inventory, { ...EMPTY_QUERY, text: "owner 2/0" }, "name").length;
    expect(two).toBeLessThan(one);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(matchesText(inventory[0], "  OWNER  ")).toBe(true);
  });

  it("matches everything when the box is empty", () => {
    expect(selectGear(inventory, EMPTY_QUERY, "name")).toHaveLength(inventory.length);
  });
});

describe("filters", () => {
  it("combines a category with a text search", () => {
    const hits = selectGear(inventory, { ...EMPTY_QUERY, categoryId: "line", text: "40" }, "name");
    expect(named(hits)).toEqual(["Fluorocarbon 40 lb"]);
  });

  it("keeps favourites and low stock as separate questions", () => {
    const favourites = selectGear(inventory, { ...EMPTY_QUERY, favoritesOnly: true }, "name");
    const low = selectGear(inventory, { ...EMPTY_QUERY, lowStockOnly: true }, "name");
    expect(favourites.every((item) => item.favorite)).toBe(true);
    expect(low.every(isLowStock)).toBe(true);
    expect(named(low)).toContain("Ringed Live Bait 1/0");
    expect(named(low)).not.toContain("Paddle tail 5in");
  });

  it("knows when the view is narrowed, so the screen can say so", () => {
    expect(isNarrowed(EMPTY_QUERY)).toBe(false);
    expect(isNarrowed({ ...EMPTY_QUERY, text: " " })).toBe(false);
    expect(isNarrowed({ ...EMPTY_QUERY, lowStockOnly: true })).toBe(true);
  });

  it("offers only brands that are actually in the inventory", () => {
    const brands = brandsIn(inventory);
    expect(brands).toContain("Owner");
    expect(brands).not.toContain("Penn");
    expect([...brands]).toEqual([...brands].sort());
  });
});

describe("sorting", () => {
  it("orders names the way a person reads them, not by code point", () => {
    const items = [
      { ...inventory[0], name: "Hook 10" },
      { ...inventory[0], name: "Hook 9" },
    ];
    expect(named(sortGear(items, "name"))).toEqual(["Hook 9", "Hook 10"]);
  });

  it("puts unbranded gear last rather than first", () => {
    const brands = sortGear(inventory, "brand").map((item) => item.brand);
    expect(brands[0]).toBeDefined();
    expect(brands[brands.length - 1]).toBeUndefined();
  });

  it("breaks ties on name so the list never reshuffles between renders", () => {
    const items = [
      { ...inventory[0], name: "Bravo", quantity: 5 },
      { ...inventory[0], name: "Alpha", quantity: 5 },
    ];
    expect(named(sortGear(items, "quantity"))).toEqual(["Alpha", "Bravo"]);
  });
});

describe("quantity", () => {
  it("never goes negative", () => {
    expect(clampQuantity(-1)).toBe(0);
    expect(clampQuantity(0)).toBe(0);
    expect(clampQuantity(7)).toBe(7);
  });

  it("refuses a value that is not a number at all", () => {
    expect(clampQuantity(Number.NaN)).toBe(0);
  });
});

describe("duplicate", () => {
  it("carries every field across but not the identity", () => {
    const draft = draftFrom(inventory[0]);
    expect(draft.name).toBe(inventory[0].name);
    expect(draft.brand).toBe(inventory[0].brand);
    expect(draft).not.toHaveProperty("id");
    expect(draft).not.toHaveProperty("createdAt");
  });

  it("copies the tags rather than sharing them with the original", () => {
    const source = inventory.find((item) => item.tags.length > 0);
    const draft = draftFrom(source!);
    expect(draft.tags).not.toBe(source!.tags);
    expect(draft.tags).toEqual(source!.tags);
  });
});

describe("fast entry", () => {
  it("offers the values used most recently, not the most common", () => {
    expect(recentValues(inventory, "brand")[0]).toBe("Owner");
  });

  it("drops blanks and duplicate tags, keeping the angler's own casing", () => {
    expect(parseTags(" Bluefin , offshore ,, Bluefin ")).toEqual(["Bluefin", "offshore"]);
  });
});

describe("at scale", () => {
  const many = generateInventory(5000);

  it("counts every category in one pass", () => {
    const counts = countByCategory(many);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(5000);
  });

  it("searches 5,000 entries fast enough to feel instant", () => {
    const started = performance.now();
    const hits = selectGear(many, { ...EMPTY_QUERY, text: "owner 4/0" }, "name");
    const elapsed = performance.now() - started;
    expect(hits.length).toBeGreaterThan(0);
    // The spec's bar is "effectively instant"; 100ms is a generous ceiling that still
    // fails loudly if someone makes this quadratic.
    expect(elapsed).toBeLessThan(100);
  });
});
