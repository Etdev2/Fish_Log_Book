import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import tokens from "./tokens.json";

const generatedTokens = readFileSync(
  fileURLToPath(new URL("../../app/tokens.generated.css", import.meta.url)),
  "utf8",
);

/*
 * These do not test the generator's plumbing. They test the properties the design system
 * would silently lose without them, each of which is an accessibility commitment rather
 * than a preference (docs/design/01-foundations.md §2–§3, 06-accessibility-baseline.md).
 */
describe("design tokens", () => {
  it("never renders text below the 16px floor", () => {
    for (const [name, def] of Object.entries(tokens.fontSize)) {
      if (name.startsWith("$")) continue;
      expect(Number.parseFloat(def.value), `${name} is ${def.value}`).toBeGreaterThanOrEqual(16);
    }
  });

  it("keeps body text at the 18px floor", () => {
    expect(tokens.fontSize["text-body"].value).toBe("18px");
  });

  it("keeps every touch target at or above the 48px floor", () => {
    const floor = Number.parseFloat(tokens.touchTarget.floor);
    expect(floor).toBeGreaterThanOrEqual(48);
    for (const [name, value] of Object.entries(tokens.touchTarget)) {
      if (name.startsWith("$")) continue;
      expect(Number.parseFloat(value), `${name} is ${value}`).toBeGreaterThanOrEqual(floor);
    }
  });

  it("has a 12px step, the interactive-spacing floor", () => {
    expect(Object.values(tokens.spacing)).toContain("12px");
  });

  it("generates the disabled opacity token used by the global disabled treatment", () => {
    expect(tokens.opacity.disabled).toBe("0.45");
    expect(generatedTokens).toContain("--opacity-disabled: 0.45;");
  });

  it("gives every colour both a light and a dark value", () => {
    for (const [name, value] of Object.entries(tokens.color)) {
      if (name.startsWith("$")) continue;
      expect(value.light, `${name} has no light value`).toBeTruthy();
      expect(value.dark, `${name} has no dark value`).toBeTruthy();
    }
  });
});
