import { describe, expect, it } from "vitest";

import vectors from "../vectors/identification.json";
import { identify, MIN_LEAD_PCT, validatePack } from "./identify";
import type { TraitPack, TraitProfile } from "./types";

const PACK: TraitPack = {
  ...vectors.pack,
  profiles: vectors.pack.profiles.map(
    (p): TraitProfile => ({
      speciesId: p.speciesId,
      commonName: p.commonName,
      scientificName: null,
      // The JSON's per-profile shapes widen to a union with optional keys; keep only the
      // affinities that are actually present rather than casting the shape away.
      traits: Object.fromEntries(
        Object.entries(p.traits).filter(([, v]) => typeof v === "number"),
      ) as Record<string, number>,
      noRetention: p.noRetention,
      keyFeatures: [`${p.commonName} looks like ${p.commonName}`],
      similarTo: [],
    }),
  ),
};

describe("the Fin ID engine", () => {
  for (const vector of vectors.cases) {
    it(vector.name, () => {
      const result = identify(PACK, vector.answers);
      expect(result.ranked).toBe(vector.expectRanked);
      if (vector.expectTop !== null) {
        expect(result.candidates[0].profile.speciesId).toBe(vector.expectTop);
      }
      expect(result.restricted).toHaveLength(vector.expectRestrictedCount);
      if (!result.ranked) expect(result.reason).not.toBeNull();
    });
  }

  it("shares always sum to about 100 — they are a share of the pool, not a probability", () => {
    const total = identify(PACK, ["red", "big"]).candidates.reduce((s, c) => s + c.sharePct, 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(2); // rounding only
  });

  it("refuses to rank a field it cannot separate (spec §4.5)", () => {
    // A pack of two identical species: nothing an angler answers can tell them apart.
    const twins: TraitPack = {
      ...PACK,
      profiles: [
        { ...PACK.profiles[0], speciesId: "a", commonName: "A" },
        { ...PACK.profiles[0], speciesId: "b", commonName: "B" },
      ],
    };
    const result = identify(twins, ["red", "big"]);
    expect(result.ranked).toBe(false);
    expect(result.candidates[0].sharePct - result.candidates[1].sharePct).toBeLessThan(MIN_LEAD_PCT);
    expect(result.reason).toContain("too close");
  });

  it("says why every candidate is there (spec §4.7)", () => {
    const [top] = identify(PACK, ["red", "big"]).candidates;
    expect(top.supporting).toContain("Red");
    expect(top.supporting).toContain("Big");

    const black = identify(PACK, ["red", "big"]).candidates.find(
      (c) => c.profile.speciesId === "blackfish",
    );
    expect(black?.against).toContain("Red");
  });

  it("treats an unanswered question as silence, not as a guess (spec §5)", () => {
    const answered = identify(PACK, ["red", "big"]);
    const partial = identify(PACK, ["red"]);
    // Fewer answers means a flatter field, never a different winner invented from nothing.
    expect(partial.candidates[0].profile.speciesId).toBe(answered.candidates[0].profile.speciesId);
  });

  it("is deterministic — the same answers always give the same order", () => {
    expect(identify(PACK, ["red", "big"])).toEqual(identify(PACK, ["red", "big"]));
  });

  it("does not care what order the answers arrive in", () => {
    const a = identify(PACK, ["red", "big"]).candidates.map((c) => c.sharePct);
    const b = identify(PACK, ["big", "red"]).candidates.map((c) => c.sharePct);
    expect(b).toEqual(a);
  });

  it("accepts a valid pack and names the problems in a broken one", () => {
    expect(validatePack(PACK)).toEqual([]);

    const broken: TraitPack = {
      ...PACK,
      source: "",
      profiles: [{ ...PACK.profiles[0], traits: { "not-an-option": 2 }, keyFeatures: [] }],
    };
    const problems = validatePack(broken);
    expect(problems.join(" ")).toContain("not-an-option");
    expect(problems.join(" ")).toContain("no source");
    expect(problems.join(" ")).toContain("key features");
  });
});
