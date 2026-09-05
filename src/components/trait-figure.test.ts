import { describe, expect, it } from "vitest";

import { FISH_ID_PACKS } from "@/features/fish-id/packs";
import { FIN_ID_PACK } from "@/features/wildlife/fin-id-pack";

/**
 * Every `figure` a pack names must be a figure that exists.
 *
 * A typo here fails silently in the worst way: React renders nothing, the chip loses its
 * drawing, and nobody notices until an angler is squinting at a fish. The key union lives
 * in the component, so this walks the packs and checks each one against it.
 */
const FIGURE_KEYS = new Set([
  "tail-spots-both", "tail-spots-upper", "tail-spots-whole", "tail-spots-none",
  "gums-black", "gums-white",
  "spines-even", "spine-third-long",
  "body-blotches", "body-bars", "body-spots", "body-plain",
  "blow-tall", "blow-bushy", "blow-v", "blow-low", "blow-none",
  "fin-none", "fin-hump", "fin-small-back", "fin-tall-hooked", "fin-tall-straight",
  "fin-curved", "fin-triangle",
]);

const ALL_PACKS = [...FISH_ID_PACKS.map((e) => e.pack), FIN_ID_PACK];

describe("trait figures", () => {
  it("every figure a pack names is one that exists", () => {
    const missing: string[] = [];
    for (const pack of ALL_PACKS) {
      for (const question of pack.questions) {
        for (const option of question.options) {
          if (option.figure !== undefined && !FIGURE_KEYS.has(option.figure)) {
            missing.push(`${pack.id}/${option.id} → ${option.figure}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("no two options in one question share a figure — they must be tellable apart", () => {
    for (const pack of ALL_PACKS) {
      for (const question of pack.questions) {
        const figures = question.options.map((o) => o.figure).filter((f) => f !== undefined);
        expect(figures.filter((v, i) => figures.indexOf(v) !== i)).toEqual([]);
      }
    }
  });

  it("draws the questions that actually decide the answer", () => {
    const salmon = ALL_PACKS.find((p) => p.id === "pacific-salmon");
    // Tail spots and the gum line ARE the salmon key; they must not be text-only.
    for (const id of ["tail-spots", "gums"]) {
      const question = salmon?.questions.find((q) => q.id === id);
      expect(question?.options.every((o) => o.figure !== undefined)).toBe(true);
    }

    const whales = ALL_PACKS.find((p) => p.id === "us-cetaceans");
    for (const id of ["blow", "dorsal"]) {
      const question = whales?.questions.find((q) => q.id === id);
      expect(question?.options.every((o) => o.figure !== undefined)).toBe(true);
    }
  });
});
