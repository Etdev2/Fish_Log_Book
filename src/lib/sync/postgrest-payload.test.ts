import { describe, expect, it } from "vitest";

import { pickPostgrestPayload } from "./postgrest-payload";

describe("pickPostgrestPayload", () => {
  it("drops nested gear on trip_rig so PostgREST does not 400", () => {
    const picked = pickPostgrestPayload("trip_rig", {
      id: "r1",
      slot: 1,
      gear: [{ role: "rod", label: "Calstar" }],
    });
    expect(picked.slot).toBe(1);
    expect(picked).not.toHaveProperty("gear");
  });

  it("keeps catch columns the schema knows, drops generated cells", () => {
    const picked = pickPostgrestPayload("catch", {
      id: "c1",
      species_other: "mystery",
      favorite: true,
      geo_cell_1km: "3360_-11820",
    });
    expect(picked.species_other).toBe("mystery");
    expect(picked.favorite).toBe(true);
    expect(picked).not.toHaveProperty("geo_cell_1km");
  });
});
