import { describe, expect, it } from "vitest";

import { validatePack } from "@/core/rules/identification/identify";

import {
  hasVerifiedRules,
  ID_QUESTIONS,
  identifyRockfish,
  identifyRockfishFully,
  restrictedIn,
  ROCKFISH_PACK,
  ROCKFISH_PROFILES,
} from "./rockfish-id";

describe("identifyRockfish (spec §5/§6)", () => {
  it("has no wrong answer for 'not sure' — zero answers mean a uniform field", () => {
    const result = identifyRockfish([]);
    expect(result.length).toBe(ROCKFISH_PROFILES.length);
    expect(result[0].confidencePct).toBe(result[result.length - 1].confidencePct);
  });

  it("favors vermilion on vermilion's own traits", () => {
    const result = identifyRockfish(["red-orange", "spots-yes", "jaw-small", "size-mid"]);
    expect(result[0].profile.speciesId).toBe("vermilion_rockfish");
  });

  it("favors copper on blotch + brown + mid size", () => {
    const result = identifyRockfish(["brown", "spots-yes", "size-mid", "jaw-small"]);
    expect(result[0].profile.speciesId).toBe("copper_rockfish");
  });

  it("favors bocaccio on the big jaw of a brownish fish", () => {
    const result = identifyRockfish(["jaw-big", "spots-no", "size-big", "brown"]);
    expect(result[0].profile.speciesId).toBe("bocaccio");
  });

  it("percentages are shares across the whole surviving pool", () => {
    const result = identifyRockfish(["brown"]);
    const sum = result.reduce((n, c) => n + c.confidencePct, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(ROCKFISH_PROFILES.length);
  });

  it("shining-on-orange raises the prohibited pair into the warning window", () => {
    const result = identifyRockfish(["red-orange", "spots-no", "size-big"]);
    const restricted = restrictedIn(result);
    expect(restricted.some((c) => c.profile.speciesId === "yelloweye_rockfish")).toBe(true);
    expect(restricted.some((c) => c.profile.speciesId === "cowcod")).toBe(true);
  });

  it("a clearly-black, small fish keeps the prohibited pair below the noise floor", () => {
    const result = identifyRockfish(["black-blue", "spots-no", "size-small", "jaw-small"]);
    expect(restrictedIn(result).length).toBe(0);
  });
});

describe("pack linkage + question integrity", () => {
  it("every wizard species with rules in the pack links out to a card", () => {
    // All ten wizard species carry RCG-complex group rules (plus species exceptions).
    for (const p of ROCKFISH_PROFILES) expect(hasVerifiedRules(p.speciesId)).toBe(true);
  });

  it("every question stays answerable by hand (no science words, modest option lists)", () => {
    for (const q of ID_QUESTIONS) {
      expect(q.answers.length).toBeGreaterThanOrEqual(2);
      expect(q.answers.length).toBeLessThanOrEqual(6);
    }
  });
});

describe("the rockfish pack on the shared Fin ID engine (passport spec §17)", () => {
  it("is a well-formed pack", () => {
    expect(validatePack(ROCKFISH_PACK)).toEqual([]);
  });

  it("derives contradiction from the questions, so no group list can go stale", () => {
    // Every trait any profile claims must be an answer to a real question.
    const optionIds = new Set(
      ROCKFISH_PACK.questions.flatMap((q) => q.options.map((o) => o.id)),
    );
    for (const profile of ROCKFISH_PACK.profiles) {
      for (const optionId of Object.keys(profile.traits)) {
        expect(optionIds.has(optionId)).toBe(true);
      }
    }
  });

  it("declines to name a winner off a single answer (spec §4.5)", () => {
    const result = identifyRockfishFully(["red-orange"]);
    expect(result.ranked).toBe(false);
    expect(result.reason).not.toBeNull();
    // It still returns the field — "here are the ones it might be" is useful.
    expect(result.candidates.length).toBeGreaterThan(1);
  });

  it("still warns about the prohibited pair even when it will not rank", () => {
    const result = identifyRockfishFully(["red-orange"]);
    expect(result.restricted.length).toBeGreaterThan(0);
  });

  it("says why the top candidate is top (spec §4.7)", () => {
    const [top] = identifyRockfish(["red-orange", "spots-yes", "size-mid"]);
    expect(top.supporting.length).toBeGreaterThan(0);
  });
});
