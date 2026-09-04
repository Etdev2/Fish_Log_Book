import { describe, expect, it } from "vitest";

import { identify, validatePack } from "@/core/rules/identification/identify";

import { FIN_ID_PACK, VIEWING_GUIDANCE } from "./fin-id-pack";

describe("the marine mammal pack", () => {
  it("is a well-formed pack", () => {
    expect(validatePack(FIN_ID_PACK)).toEqual([]);
  });

  it("carries viewing guidance for every animal — a sighting always has an answer to 'how close'", () => {
    for (const profile of FIN_ID_PACK.profiles) {
      expect(VIEWING_GUIDANCE[profile.speciesId]).toBeDefined();
    }
  });

  it("uses NOAA's distances: 100 yards for whales, 50 for dolphins and porpoises", () => {
    expect(VIEWING_GUIDANCE.humpback_whale.distanceYards).toBe(100);
    expect(VIEWING_GUIDANCE.bottlenose_dolphin.distanceYards).toBe(50);
    expect(VIEWING_GUIDANCE.harbor_porpoise.distanceYards).toBe(50);
    // Right whales carry their own, far larger, federal buffer.
    expect(VIEWING_GUIDANCE.north_atlantic_right_whale.distanceYards).toBe(500);
  });

  it("marks every animal as no-retention — they are protected, and none is ever a target", () => {
    for (const profile of FIN_ID_PACK.profiles) {
      expect(profile.noRetention).toBe(true);
    }
  });

  it("cites where the traits came from", () => {
    expect(FIN_ID_PACK.source).toContain("NOAA");
  });
});

describe("telling the hard pairs apart", () => {
  const idOf = (answers: readonly string[]) =>
    identify(FIN_ID_PACK, answers).candidates[0].profile.speciesId;

  it("no dorsal fin plus a raised fluke reads as a gray whale, not a humpback", () => {
    expect(idOf(["dorsal-hump", "mark-mottled", "fluke-up"])).toBe("gray_whale");
  });

  it("a V-shaped blow with no fin at all is the right whale", () => {
    expect(idOf(["blow-v", "dorsal-none", "mark-patches"])).toBe("north_atlantic_right_whale");
  });

  it("the tallest blow on an enormous animal is a blue whale", () => {
    expect(idOf(["blow-tall", "size-huge", "dorsal-small-back"])).toBe("blue_whale");
  });

  it("a tall hooked fin two thirds back separates a fin whale from a blue", () => {
    expect(idOf(["blow-tall", "dorsal-tall-hooked", "fluke-down"])).toBe("fin_whale");
  });

  it("the hourglass flank is a common dolphin, not a bottlenose", () => {
    expect(idOf(["mark-hourglass", "size-small", "behav-bowride"])).toBe("common_dolphin");
  });

  it("a rooster tail is Dall's porpoise and nothing else here", () => {
    expect(idOf(["behav-rooster", "mark-blackwhite", "size-small"])).toBe("dalls_porpoise");
  });

  it("a very tall straight fin on a black-and-white animal is an orca, not a Dall's", () => {
    expect(idOf(["dorsal-tall-straight", "mark-blackwhite", "size-mid"])).toBe("killer_whale");
  });

  it("scratched pale grey with a blunt head is Risso's", () => {
    expect(idOf(["mark-scarred", "dorsal-tall-hooked", "size-small"])).toBe("rissos_dolphin");
  });

  it("refuses to separate a dark shy porpoise from too little (spec §4.5)", () => {
    // A small dark triangle is genuinely ambiguous until behaviour or markings are added.
    const result = identify(FIN_ID_PACK, ["dorsal-triangle"]);
    expect(result.ranked).toBe(false);
    expect(result.reason).not.toBeNull();
  });

  it("says why it picked what it picked (spec §4.7)", () => {
    const [top] = identify(FIN_ID_PACK, ["behav-rooster", "mark-blackwhite"]).candidates;
    expect(top.supporting.length).toBeGreaterThan(0);
  });
});
