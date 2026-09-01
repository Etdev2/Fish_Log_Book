import { describe, expect, it } from "vitest";

import { TACKLE_FIXTURE } from "./tackle-fixture";
import {
  cardSummary,
  categoryFor,
  clampQuantity,
  countByCategory,
  countLow,
  isLowStock,
  isOutOfStock,
  itemMatchesSearch,
  rememberValue,
  retainedAttributes,
  sortItems,
  suggestedOptions,
  type TackleItem,
} from "./types";

const byId = (id: string): TackleItem => {
  const item = TACKLE_FIXTURE.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`fixture missing ${id}`);
  return item;
};

describe("itemMatchesSearch", () => {
  it("finds attributes like brand and pound test, not just the name", () => {
    expect(itemMatchesSearch(byId("fixture-braid"), "powerpro")).toBe(true);
    expect(itemMatchesSearch(byId("fixture-fluoro-leader"), "40 lb fluoro")).toBe(true);
    expect(itemMatchesSearch(byId("fixture-mutu-circle"), "owner")).toBe(true);
  });

  it("requires every token to match, so wrong tokens exclude the item", () => {
    expect(itemMatchesSearch(byId("fixture-mutu-circle"), "owner 4/0")).toBe(true);
    expect(itemMatchesSearch(byId("fixture-mutu-circle"), "owner 8/0")).toBe(false);
  });

  it("matches category names and notes", () => {
    expect(itemMatchesSearch(byId("fixture-calico-stick"), "rods")).toBe(true);
    expect(itemMatchesSearch(byId("fixture-octopus"), "rockfish")).toBe(true);
  });
});

describe("low stock", () => {
  it("always flags empty items even without an alert set", () => {
    expect(isOutOfStock(byId("fixture-fluoro-leader"))).toBe(true);
    expect(isLowStock(byId("fixture-fluoro-leader"))).toBe(true);
  });

  it("flags items at or under their alert threshold only", () => {
    expect(isLowStock(byId("fixture-octopus"))).toBe(true); // 6 <= 8
    expect(isLowStock(byId("fixture-mutu-circle"))).toBe(false); // 18 > 8
    expect(isLowStock(byId("fixture-tady-45"))).toBe(false); // 3 > 2
  });

  it("never flags healthy stock without an alert", () => {
    expect(isLowStock(byId("fixture-calico-stick"))).toBe(false);
    expect(countLow(TACKLE_FIXTURE)).toBe(2);
  });
});

describe("sortItems", () => {
  it("sorts by name, by quantity with a name tiebreak, and by recency", () => {
    const three = [byId("fixture-tady-45"), byId("fixture-paddle-tails"), byId("fixture-mutu-circle")];
    expect(sortItems(three, "name").map((item) => item.id)).toEqual([
      "fixture-paddle-tails",
      "fixture-mutu-circle",
      "fixture-tady-45",
    ]);
    expect(sortItems(three, "quantity").map((item) => item.id)).toEqual([
      "fixture-tady-45",
      "fixture-mutu-circle",
      "fixture-paddle-tails",
    ]);
    expect(sortItems(three, "recent")[0].id).toBe("fixture-mutu-circle");
  });
});

describe("countByCategory", () => {
  it("counts items and low items per category", () => {
    const counts = countByCategory(TACKLE_FIXTURE);
    expect(counts.hooks).toEqual({ total: 2, low: 1 });
    expect(counts.leaders).toEqual({ total: 1, low: 1 });
    expect(counts.rods).toEqual({ total: 1, low: 0 });
    expect(counts.other).toBeUndefined();
  });
});

describe("cardSummary", () => {
  it("takes brand first, then the next two filled attributes in field order", () => {
    expect(cardSummary(byId("fixture-mutu-circle"))).toBe("Owner · Circle · 4/0");
    expect(cardSummary(byId("fixture-torpedo"))).toBe("Torpedo · 4 oz · Lead");
    expect(cardSummary(byId("fixture-lexa"))).toBe("Daiwa · Baitcasting · 300");
  });
});

describe("retainedAttributes", () => {
  it("keeps shared keys when the category changes and drops the rest", () => {
    const next = retainedAttributes(categoryFor("leaders"), {
      brand: "Seaguar",
      poundTest: "40 lb",
      hookStyle: "Circle",
    });
    expect(next).toEqual({ brand: "Seaguar", poundTest: "40 lb" });
  });
});

describe("rememberValue / suggestedOptions", () => {
  it("keeps the four most recent unique values, newest first, ignoring blanks", () => {
    let recents = rememberValue({}, "hooks:brand", "Owner");
    recents = rememberValue(recents, "hooks:brand", "  ");
    recents = rememberValue(recents, "hooks:brand", "BKK");
    recents = rememberValue(recents, "hooks:brand", " owner ");
    expect(recents["hooks:brand"]).toEqual(["owner", "BKK"]);

    for (const brand of ["A", "B", "C", "D"]) recents = rememberValue(recents, "hooks:brand", brand);
    expect(recents["hooks:brand"]).toHaveLength(4);
  });

  it("puts the angler’s own recents ahead of the common options without duplicates", () => {
    const chips = suggestedOptions(["Owner", "Gamakatsu", "Mustad"], ["bkk", "Owner"]);
    expect(chips.slice(0, 3)).toEqual(["bkk", "Owner", "Gamakatsu"]);
  });

  it("caps the chip row so the sheet stays tidy", () => {
    expect(suggestedOptions(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], ["0"])).toHaveLength(8);
  });

  it("shows the full hook-size ladder including 5/0", () => {
    const size = categoryFor("hooks").fields.find((field) => field.key === "size");
    if (!size) throw new Error("hooks category must carry a size field");
    const chips = suggestedOptions(size.options, [], size.maxChips);
    expect(chips).toHaveLength(13);
    expect(chips).toContain("5/0");
  });
});

describe("clampQuantity", () => {
  it("never goes negative and tolerates junk input", () => {
    expect(clampQuantity(-3)).toBe(0);
    expect(clampQuantity(Number.NaN)).toBe(0);
    expect(clampQuantity(12.9)).toBe(12);
  });
});
