import { describe, expect, it } from "vitest";

import { identify, matchBand } from "@/core/rules/identification/identify";
import { ROCKFISH_PACK } from "../rockfish-id";
import { BAND_WORDS } from "./candidate-card";

/** The words a card shows for each species, as the rockfish screen would render them. */
function wordsFor(answers: readonly string[]): Record<string, string | null> {
  const reading = identify(ROCKFISH_PACK, answers);
  return Object.fromEntries(
    reading.candidates.map((c) => {
      const band = matchBand(reading, c.profile.speciesId, answers.length);
      return [c.profile.speciesId, band === null ? null : BAND_WORDS[band]];
    }),
  );
}

describe("the words on an ID card instead of a percentage (ADR 007 §4)", () => {
  it("uses exactly these three plain words", () => {
    expect(BAND_WORDS).toEqual({ strong: "Best match", moderate: "Could be", weak: "Less likely" });
  });

  it("shows no word on any card before anything is answered", () => {
    expect(Object.values(wordsFor([])).every((w) => w === null)).toBe(true);
  });

  it("names one best match, a could-be and the less likely ones for a clear answer set", () => {
    // Black body, plain, no bands, dark fins, big mouth, 12-24 in.
    const words = wordsFor(["black-blue", "spots-no", "bands-no", "fins-uniform", "jaw-big", "size-mid"]);
    expect(words.black_rockfish).toBe("Best match");
    expect(words.bocaccio).toBe("Could be");
    expect(words.blue_rockfish).toBe("Less likely");
    expect(Object.values(words).filter((w) => w === "Best match")).toHaveLength(1);
  });

  it("never says best match when the engine will not pick a winner", () => {
    const answers = ["red-orange", "spots-yes", "jaw-big", "size-big"];
    expect(identify(ROCKFISH_PACK, answers).ranked).toBe(false);
    expect(Object.values(wordsFor(answers))).not.toContain("Best match");
  });
});
