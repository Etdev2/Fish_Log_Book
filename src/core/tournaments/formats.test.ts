import { describe, expect, it } from "vitest";

import {
  catchesIn,
  countsIn,
  describeCategory,
  emptyCategory,
  familyColumnFor,
  FORMAT_PRESETS,
  formatMoney,
  parseFormat,
  payoutBreakdown,
  poolFor,
  scoreRuleFor,
  validateFormat,
  type FormatCategory,
  type TournamentFormat,
} from "./formats";
import { computeOfficialStandings, type EligibleCatch } from "./official-scoring";

function fish(id: string, entryId: string, speciesId: string | null, weightG: number): EligibleCatch {
  return { id, entryId, speciesId, weightG, lengthMm: null, approved: true, disqualified: false };
}

describe("presets", () => {
  it("every preset produces a format that validates", () => {
    for (const preset of FORMAT_PRESETS) {
      expect(validateFormat(preset.build()), preset.id).toEqual([]);
    }
  });

  it("covers the four shapes a host asked for", () => {
    const ids = FORMAT_PRESETS.map((preset) => preset.id);
    expect(ids).toEqual(["biggest_fish", "places", "species_points", "categories"]);
  });

  it("the multi-category preset is three separate competitions", () => {
    const format = FORMAT_PRESETS.find((preset) => preset.id === "categories")!.build();
    expect(format.categories).toHaveLength(3);
    for (const item of format.categories) {
      expect(item.species.length).toBeGreaterThan(0);
      expect(item.payout.model).toBe("WINNER_TAKE_ALL");
    }
  });

  it("the points preset ships a table the host can edit rather than an empty one", () => {
    const format = FORMAT_PRESETS.find((preset) => preset.id === "species_points")!.build();
    expect(Object.keys(format.categories[0].speciesPoints).length).toBeGreaterThan(4);
  });
});

describe("validateFormat", () => {
  const base = FORMAT_PRESETS[0].build();

  it("accepts a sound format", () => {
    expect(validateFormat(base)).toEqual([]);
  });

  it("rejects a tournament with nothing to score", () => {
    expect(validateFormat({ ...base, categories: [] })).toContain(
      "A tournament needs at least one category to score.",
    );
  });

  it("rejects a place split that does not add up to 100", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [
        { ...emptyCategory("a", "Overall"), payout: { model: "PLACES", split: [50, 30] } },
      ],
    };
    expect(validateFormat(format)).toContain('The split for “Overall” adds up to 80%, not 100%.');
  });

  it("allows a split a host typed as thirds", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [
        { ...emptyCategory("a", "Overall"), payout: { model: "PLACES", split: [33.3, 33.3, 33.4] } },
      ],
    };
    expect(validateFormat(format)).toEqual([]);
  });

  it("rejects two categories with the same name", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [emptyCategory("a", "Tuna"), emptyCategory("b", "tuna")],
    };
    expect(validateFormat(format).join(" ")).toContain("Two categories are both called");
  });

  it("rejects a points category with no species worth anything", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [{ ...emptyCategory("a", "Points"), family: "SPECIES_POINTS" }],
    };
    expect(validateFormat(format).join(" ")).toContain("at least one species needs a value");
  });

  it("rejects a best-few category that never says how many", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [{ ...emptyCategory("a", "Best few"), family: "BEST_N_WEIGHT" }],
    };
    expect(validateFormat(format).join(" ")).toContain("needs to say how many");
  });

  it("rejects a nonsense currency", () => {
    expect(validateFormat({ ...base, currency: "dollars" }).join(" ")).toContain("three-letter code");
  });
});

describe("category eligibility", () => {
  const marlin: FormatCategory = {
    ...emptyCategory("marlin", "Biggest marlin"),
    species: ["blue_marlin", "striped_marlin"],
  };

  it("counts only the species named", () => {
    expect(countsIn(marlin, "blue_marlin")).toBe(true);
    expect(countsIn(marlin, "bluefin_tuna")).toBe(false);
  });

  it("counts everything when no species are named", () => {
    expect(countsIn(emptyCategory("all", "Overall"), "anything_at_all")).toBe(true);
  });

  it("does not count a fish nobody identified into a species-restricted category", () => {
    expect(countsIn(marlin, null)).toBe(false);
    expect(countsIn(emptyCategory("all", "Overall"), null)).toBe(true);
  });

  it("splits one boat's catches across the categories they belong to", () => {
    const landed = [
      fish("c1", "e1", "blue_marlin", 180_000),
      fish("c2", "e1", "bluefin_tuna", 40_000),
      fish("c3", "e1", "bluefin_tuna", 52_000),
    ];
    const tuna: FormatCategory = {
      ...emptyCategory("tuna", "Biggest tuna"),
      species: ["bluefin_tuna", "yellowfin_tuna"],
    };

    expect(catchesIn(marlin, landed).map((c) => c.id)).toEqual(["c1"]);
    expect(catchesIn(tuna, landed).map((c) => c.id)).toEqual(["c2", "c3"]);
  });
});

describe("scoring through the official scorer", () => {
  it("scores a species-points category on the host's own table", () => {
    const item: FormatCategory = {
      ...emptyCategory("points", "Points"),
      family: "SPECIES_POINTS",
      speciesPoints: { yellowtail: 8, bonito: 1 },
    };
    const landed = [
      fish("c1", "e1", "yellowtail", 9_000),
      fish("c2", "e1", "bonito", 2_000),
      fish("c3", "e2", "yellowtail", 4_000),
    ];

    const standings = computeOfficialStandings(
      ["e1", "e2"],
      catchesIn(item, landed),
      [],
      scoreRuleFor(item),
    );

    expect(standings.find((row) => row.entryId === "e1")?.score).toBe(9);
    expect(standings.find((row) => row.entryId === "e2")?.score).toBe(8);
  });

  it("scores a heaviest-fish category on the single best weight", () => {
    const item = emptyCategory("overall", "Heaviest");
    const standings = computeOfficialStandings(
      ["e1"],
      [fish("c1", "e1", "dorado", 12_000), fish("c2", "e1", "dorado", 20_000)],
      [],
      scoreRuleFor(item),
    );
    expect(standings[0].score).toBe(20_000);
  });
});

describe("payoutBreakdown", () => {
  it("gives the whole pot to the winner when that is the model", () => {
    expect(
      payoutBreakdown({
        poolMinor: 250_000,
        payout: { model: "WINNER_TAKE_ALL", split: [] },
        placesFilled: 9,
      }),
    ).toEqual([{ rank: 1, amountMinor: 250_000 }]);
  });

  it("splits down the places", () => {
    expect(
      payoutBreakdown({
        poolMinor: 100_000,
        payout: { model: "PLACES", split: [50, 30, 20] },
        placesFilled: 3,
      }),
    ).toEqual([
      { rank: 1, amountMinor: 50_000 },
      { rank: 2, amountMinor: 30_000 },
      { rank: 3, amountMinor: 20_000 },
    ]);
  });

  it("shares an unfilled place out rather than leaving money unaccounted for", () => {
    const slices = payoutBreakdown({
      poolMinor: 100_000,
      payout: { model: "PLACES", split: [50, 30, 20] },
      placesFilled: 2,
    });
    expect(slices).toEqual([
      { rank: 1, amountMinor: 62_500 },
      { rank: 2, amountMinor: 37_500 },
    ]);
    expect(slices.reduce((sum, slice) => sum + slice.amountMinor, 0)).toBe(100_000);
  });

  it("never invents or loses a cent, and the remainder goes to the winner", () => {
    const slices = payoutBreakdown({
      poolMinor: 10_000,
      payout: { model: "PLACES", split: [33.3, 33.3, 33.4] },
      placesFilled: 3,
    });
    expect(slices.reduce((sum, slice) => sum + slice.amountMinor, 0)).toBe(10_000);
    expect(slices[0].amountMinor).toBeGreaterThanOrEqual(slices[1].amountMinor);
  });

  it("pays nothing out of an empty pot, or to an empty field", () => {
    const payout = { model: "PLACES", split: [50, 30, 20] } as const;
    expect(payoutBreakdown({ poolMinor: 0, payout, placesFilled: 3 })).toEqual([]);
    expect(payoutBreakdown({ poolMinor: 100, payout, placesFilled: 0 })).toEqual([]);
  });

  it("pays nothing when the category has no prize structure", () => {
    expect(
      payoutBreakdown({ poolMinor: 100_000, payout: { model: "NONE", split: [] }, placesFilled: 4 }),
    ).toEqual([]);
  });
});

describe("poolFor", () => {
  it("multiplies the fee by the entries", () => {
    const item = { ...emptyCategory("a", "A"), entryFeeMinor: 25_000 };
    expect(poolFor(item, 12)).toBe(300_000);
  });

  it("is nothing when the category is free", () => {
    expect(poolFor(emptyCategory("a", "A"), 12)).toBe(0);
  });
});

describe("parseFormat", () => {
  it("round-trips a preset through JSON", () => {
    const format = FORMAT_PRESETS[3].build();
    expect(parseFormat(JSON.parse(JSON.stringify(format)))).toEqual(format);
  });

  it("refuses anything that is not a format rather than half-reading it", () => {
    expect(parseFormat(null)).toBeNull();
    expect(parseFormat({})).toBeNull();
    expect(parseFormat({ categories: [] })).toBeNull();
    expect(parseFormat({ categories: [{ name: "no id" }] })).toBeNull();
  });

  it("fills in the parts an older stored format did not have", () => {
    const parsed = parseFormat({
      categories: [{ id: "a", name: "Overall", family: "BIGGEST_FISH" }],
    });
    expect(parsed).toEqual({
      currency: "USD",
      categories: [
        {
          id: "a",
          name: "Overall",
          family: "BIGGEST_FISH",
          species: [],
          speciesPoints: {},
          bestN: null,
          payout: { model: "NONE", split: [] },
          entryFeeMinor: null,
        },
      ],
    });
  });
});

describe("familyColumnFor", () => {
  it("is the one family when every category agrees", () => {
    expect(familyColumnFor(FORMAT_PRESETS[3].build())).toBe("BIGGEST_FISH");
  });

  it("is CUSTOM when they do not, rather than picking the first", () => {
    const format: TournamentFormat = {
      currency: "USD",
      categories: [
        emptyCategory("a", "A"),
        { ...emptyCategory("b", "B"), family: "TOTAL_WEIGHT" },
      ],
    };
    expect(familyColumnFor(format)).toBe("CUSTOM");
  });
});

describe("describeCategory", () => {
  it("says how it is won, what it costs, and what it pays", () => {
    const line = describeCategory(
      {
        ...emptyCategory("marlin", "Biggest marlin"),
        species: ["blue_marlin", "striped_marlin"],
        entryFeeMinor: 50_000,
        payout: { model: "PLACES", split: [60, 30, 10] },
      },
      "USD",
    );
    expect(line).toContain("heaviest single fish");
    expect(line).toContain("2 species");
    expect(line).toContain("$500.00");
    expect(line).toContain("60/30/10");
  });

  it("says a free category is free rather than saying nothing", () => {
    expect(describeCategory(emptyCategory("a", "Overall"), "USD")).toContain("no entry fee");
  });
});

describe("formatMoney", () => {
  it("reads minor units in the currency's own decimal places", () => {
    expect(formatMoney(250_000, "USD")).toContain("2,500");
  });
});
