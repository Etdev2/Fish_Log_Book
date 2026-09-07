import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { describe, expect, it } from "vitest";

/**
 * There is one way to go back, and it is this component.
 *
 * The shell round removed five spellings of "back" from the app — "← Passport",
 * "‹ Calendar", "Back to the Fish Log", a chevron-and-word, and eight screens with nothing
 * at all — and replaced them with `BackLink`. Within days the tournament section had grown
 * a *second* component with the same name, a different type scale, and its own class
 * constant, so half that section went back in `text-caption` and the other half in
 * `text-label`.
 *
 * That is not a thing anyone does on purpose; it is what happens when a feature needs a
 * back link and the shared one is one directory further away than a local one. So the rule
 * is a test rather than a convention.
 */

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

function sourceFiles(): readonly string[] {
  return execSync("git ls-files 'src/**/*.tsx' 'src/**/*.ts'", { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    // Test files are excluded because this one contains the very pattern it searches for,
    // written out in its own assertion. It failed on itself the moment it was committed —
    // which is at least proof the search works.
    .filter((file) => !/\.test\.tsx?$/.test(file));
}

describe("one back link", () => {
  const files = sourceFiles();

  it("finds the source tree, so a moved directory cannot make this vacuous", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("src/components/back-link.tsx");
  });

  it("is declared exactly once, in src/components", () => {
    const declarations = files.filter((file) =>
      /export function BackLink\b/.test(readFileSync(`${repoRoot}${file}`, "utf8")),
    );
    expect(
      declarations,
      `A second BackLink means two ways back with two different type scales, which is the ` +
        `inconsistency the shared component was created to end. Import ` +
        `\`@/components/back-link\` instead of declaring another.`,
    ).toEqual(["src/components/back-link.tsx"]);
  });

  it("is what the tournament section uses, since that is where the second one grew", () => {
    const usesShared = files.filter(
      (file) =>
        file.startsWith("src/features/tournaments/") &&
        readFileSync(`${repoRoot}${file}`, "utf8").includes('from "@/components/back-link"'),
    );
    expect(usesShared.length).toBeGreaterThan(0);
  });
});
