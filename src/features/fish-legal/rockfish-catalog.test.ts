import { describe, expect, it } from "vitest";

import { SPECIES } from "@/core/ontology/species";
import { ROCKFISH_CATALOG } from "./rockfish-catalog";
import { ROCKFISH_PROFILES } from "./rockfish-id";
import { idPhoto, SPECIES_PHOTOS } from "./species-photos";

const ids = new Set(ROCKFISH_CATALOG.map((r) => r.speciesId));

/** Picture keys that are Sebastes. The two named without "rockfish" are listed. */
const pictureRockfish = Object.keys(SPECIES_PHOTOS).filter(
  (id) => id.endsWith("_rockfish") || ["bocaccio", "cowcod", "treefish"].includes(id),
);

describe("the rockfish catalog", () => {
  it("lists every rockfish the ID can name", () => {
    for (const p of ROCKFISH_PROFILES) expect(ids, p.speciesId).toContain(p.speciesId);
  });

  it("lists every rockfish in the species vocabulary", () => {
    for (const s of SPECIES.filter((s) => s.rollsUpTo === "rockfish")) {
      expect(ids, s.id).toContain(s.id);
    }
  });

  it("lists every rockfish we hold a picture of", () => {
    for (const id of pictureRockfish) expect(ids, id).toContain(id);
  });

  it("is alphabetical with no repeats", () => {
    const names = ROCKFISH_CATALOG.map((r) => r.commonName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(ids.size).toBe(ROCKFISH_CATALOG.length);
  });

  it("marks the no-take rockfish", () => {
    const flagged = ROCKFISH_CATALOG.filter((r) => r.noRetention).map((r) => r.speciesId);
    expect(flagged).toEqual(expect.arrayContaining(["cowcod", "yelloweye_rockfish"]));
  });

  it("shows a picture for every rockfish except the unlicensed stock image", () => {
    const missing = ROCKFISH_CATALOG.filter((r) => idPhoto(r.speciesId) === null).map(
      (r) => r.speciesId,
    );
    expect(missing).toEqual(["bronzespotted_rockfish"]);
  });
});
