import { describe, expect, it } from "vitest";

import { idPhoto, pictureCredits, speciesPhoto } from "./species-photos";

describe("species pictures", () => {
  it("keeps unlicensed stock images off ID screens", () => {
    expect(speciesPhoto("bronzespotted_rockfish")).not.toBeNull();
    expect(idPhoto("bronzespotted_rockfish")).toBeNull();
    expect(idPhoto("vermilion_rockfish")?.src).toBe("/species-photos/vermilion_rockfish.jpg");
  });

  it("returns nothing, never a stand-in, for a species with no picture", () => {
    expect(idPhoto("pink_salmon")).toBeNull();
  });

  it("lists each credit once for a list of thumbnails", () => {
    const credits = pictureCredits([
      idPhoto("vermilion_rockfish"),
      idPhoto("canary_rockfish"),
      null,
    ]);
    expect(credits).toHaveLength(1);
    expect(pictureCredits([null, null])).toEqual([]);
  });
});
