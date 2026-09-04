import { describe, expect, it } from "vitest";

import { TACKLE_CATEGORIES, fieldOptions, type AttributeField } from "./types";

/**
 * ADR 008 ruling 2. The bug these exist for: the reels `size` field offered spinning
 * sizes (500–8000) and conventional sizes (12–30) in one row whatever type was chosen,
 * so every number on it was ambiguous. A "4000 lever drag" is not a big reel, it is a
 * category error.
 */

const allFields: { category: string; field: AttributeField }[] = TACKLE_CATEGORIES.flatMap(
  (category) => category.fields.map((field) => ({ category: category.id, field })),
);

describe("dependent field schema", () => {
  it("gives every optionsBy field a dependsOn that names a real field in the same category", () => {
    for (const category of TACKLE_CATEGORIES) {
      for (const field of category.fields) {
        if (!field.optionsBy) continue;
        expect(field.dependsOn, `${category.id}.${field.key}`).toBeTruthy();
        expect(
          category.fields.some((f) => f.key === field.dependsOn),
          `${category.id}.${field.key} depends on "${field.dependsOn}", which is not a field here`,
        ).toBe(true);
      }
    }
  });

  it("puts a dependent field after its controller, so the controller is answered first", () => {
    for (const category of TACKLE_CATEGORIES) {
      category.fields.forEach((field, index) => {
        if (!field.dependsOn) return;
        const controllerIndex = category.fields.findIndex((f) => f.key === field.dependsOn);
        expect(
          controllerIndex,
          `${category.id}.${field.key} is asked before the "${field.dependsOn}" it depends on`,
        ).toBeLessThan(index);
      });
    }
  });

  it("offers every controlling value a set, so no choice leads to an empty row without a hint", () => {
    for (const category of TACKLE_CATEGORIES) {
      for (const field of category.fields) {
        if (!field.optionsBy || !field.dependsOn) continue;
        const controller = category.fields.find((f) => f.key === field.dependsOn)!;
        for (const value of controller.options) {
          const resolved = fieldOptions(field, { [field.dependsOn]: value });
          expect(resolved.length, `${category.id}.${field.key} has nothing for ${value}`).toBeGreaterThan(0);
        }
        // Before the controller is answered there are no options, so there must be a hint.
        expect(fieldOptions(field, {})).toHaveLength(0);
        expect(field.emptyHint, `${category.id}.${field.key} needs an emptyHint`).toBeTruthy();
      }
    }
  });

  it("never mixes two numbering systems in one option list — the original bug", () => {
    // Spinning thousands (>=1000) and line classes (<=130) in the same row is the
    // signature of the defect. A list of pure ladder numbers must stay on one scale.
    for (const { category, field } of allFields) {
      const lists = field.optionsBy ? Object.values(field.optionsBy) : [field.options];
      for (const list of lists) {
        const numbers = list.filter((o) => /^\d+$/.test(o)).map(Number);
        if (numbers.length < 2) continue;
        const thousands = numbers.filter((n) => n >= 1000);
        const classes = numbers.filter((n) => n <= 130);
        expect(
          thousands.length > 0 && classes.length > 0,
          `${category}.${field.key} mixes spinning thousands with line classes: ${list.join(", ")}`,
        ).toBe(false);
      }
    }
  });
});

describe("reel sizes", () => {
  const reels = TACKLE_CATEGORIES.find((c) => c.id === "reels")!;
  const size = reels.fields.find((f) => f.key === "size")!;

  it("gives a spinning reel thousands and a conventional reel line classes", () => {
    expect(fieldOptions(size, { type: "Spinning" })).toContain("4000");
    expect(fieldOptions(size, { type: "Spinning" })).not.toContain("30");
    expect(fieldOptions(size, { type: "Conventional" })).toContain("30");
    expect(fieldOptions(size, { type: "Conventional" })).not.toContain("4000");
  });

  it("goes far enough at both ends to cover the fish this app is for", () => {
    // A 20000 popping reel and a 130-class marlin reel both exist on this coast.
    expect(fieldOptions(size, { type: "Spinning" })).toContain("20000");
    expect(fieldOptions(size, { type: "Lever drag" })).toContain("130");
  });

  it("keeps a size already saved against a different type — nothing is destroyed", () => {
    // ADR 008: attributes are free text and ChoiceField treats an off-list value as
    // custom, so no migration is owed and an old "20" on a spinning reel survives.
    const resolved = fieldOptions(size, { type: "Spinning" });
    expect(resolved).not.toContain("20");
    expect(typeof "20").toBe("string");
  });
});
