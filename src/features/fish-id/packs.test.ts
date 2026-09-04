import { describe, expect, it } from "vitest";

import { identify, validatePack } from "@/core/rules/identification/identify";
import { speciesById } from "@/core/ontology/species";

import { FISH_ID_PACKS, SALMON_PACK, SOCAL_BASS_PACK, fishPackById } from "./packs";

describe("the fish ID packs", () => {
  for (const { pack } of FISH_ID_PACKS) {
    it(`${pack.name} is well-formed and cites a source`, () => {
      expect(validatePack(pack)).toEqual([]);
      expect(pack.source.length).toBeGreaterThan(20);
    });

    it(`${pack.name} names only species the ontology has`, () => {
      for (const profile of pack.profiles) {
        expect(speciesById(profile.speciesId)).not.toBeNull();
      }
    });

    it(`${pack.name} agrees with the ontology about what is protected`, () => {
      for (const profile of pack.profiles) {
        const species = speciesById(profile.speciesId);
        if (species?.takeStatus === "protected") expect(profile.noRetention).toBe(true);
      }
    });
  }

  it("resolves packs by id and refuses unknown ones", () => {
    expect(fishPackById("pacific-salmon")).not.toBeNull();
    expect(fishPackById("not-a-pack")).toBeNull();
  });
});

describe("the salmon key — tail spots and the gum line", () => {
  const idOf = (answers: readonly string[]) =>
    identify(SALMON_PACK, answers).candidates[0].profile.speciesId;

  it("spots on both tail lobes with black gums is a chinook", () => {
    expect(idOf(["tail-both", "gums-black", "mouth-black"])).toBe("chinook_salmon");
  });

  it("the same fish with WHITE gums is a coho — the decision that matters most", () => {
    expect(idOf(["tail-upper", "gums-white", "mouth-black"])).toBe("coho_salmon");
  });

  it("spots over the whole tail with a black gum line is a pink", () => {
    expect(idOf(["tail-whole", "gums-black", "mouth-white"])).toBe("pink_salmon");
  });

  it("no spots plus a red body and green head is a sockeye", () => {
    expect(idOf(["tail-none", "gums-white", "body-red"])).toBe("sockeye_salmon");
  });

  it("no spots but calico bars is a chum, not a sockeye", () => {
    expect(idOf(["tail-none", "gums-white", "body-bars"])).toBe("chum_salmon");
  });

  it("spots on the tail but a white mouth is a steelhead, not a chinook", () => {
    expect(idOf(["tail-both", "gums-white", "mouth-white"])).toBe("steelhead");
  });

  it("declines to separate a chum from a sockeye on the tail alone (spec §4.5)", () => {
    const result = identify(SALMON_PACK, ["tail-none"]);
    expect(result.ranked).toBe(false);
  });
});

describe("the Southern California bass key", () => {
  const idOf = (answers: readonly string[]) =>
    identify(SOCAL_BASS_PACK, answers).candidates[0].profile.speciesId;

  it("even dorsal spines on a blotchy fish in kelp is a calico", () => {
    expect(idOf(["spine-even", "pattern-blotch", "where-kelp"])).toBe("kelp_bass");
  });

  it("a long third spine with bars is a barred sand bass", () => {
    expect(idOf(["spine-third", "pattern-bars", "where-sand"])).toBe("barred_sand_bass");
  });

  it("a long third spine with spots in a bay is a spotted sand bass", () => {
    expect(idOf(["spine-third", "pattern-spots", "where-bay"])).toBe("spotted_sand_bass");
  });

  it("warns about giant sea bass while it is still a live possibility", () => {
    // A spotted juvenile is the case that gets one taken by mistake.
    const result = identify(SOCAL_BASS_PACK, ["pattern-spots", "size-small"]);
    expect(result.restricted.some((c) => c.profile.speciesId === "giant_sea_bass")).toBe(true);
  });

  it("puts a huge plain fish on giant sea bass, which is release-only", () => {
    const result = identify(SOCAL_BASS_PACK, ["size-huge", "pattern-plain"]);
    expect(result.candidates[0].profile.speciesId).toBe("giant_sea_bass");
    expect(result.candidates[0].profile.noRetention).toBe(true);
  });
});
