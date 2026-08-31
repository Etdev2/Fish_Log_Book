import { describe, expect, it } from "vitest";

import { TACKLE_FIXTURE } from "./tackle-fixture";
import { itemMatchesFilter } from "./types";

describe("itemMatchesFilter", () => {
  it("keeps all-water items in a saltwater view", () => {
    const names = TACKLE_FIXTURE.filter((item) => itemMatchesFilter(item, "salt", "")).map(
      (item) => item.label,
    );

    expect(names).toContain("White paddle tail");
    expect(names).not.toContain("Willow spinnerbait");
  });

  it("finds an optional attribute without relaxing the water filter", () => {
    expect(itemMatchesFilter(TACKLE_FIXTURE[0], "salt", "silver")).toBe(true);
    expect(itemMatchesFilter(TACKLE_FIXTURE[4], "salt", "gold")).toBe(false);
  });
});
