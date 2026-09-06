import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Every product page is inside the shell, so every product page has the bottom nav on it.
 *
 * Chrome is opt-in by route group (`app/(app)/layout.tsx`), which is the right design and
 * has exactly one failure mode: a route created outside the group inherits nothing and
 * nobody notices, because the page itself looks fine in isolation.
 *
 * That is precisely what happened to Fish Legal. Eight pages — today's limits, the
 * boundary map, the rockfish wizard, the species browser, alerts, the offline pack — lived
 * at `src/app/fish-legal/`, one directory up from the group. The Legal tab in the bottom
 * bar led to a screen with no bottom bar on it, and no back link either: a tap into Fish
 * Legal was a one-way trip out of the app's navigation, and the only way home was the
 * browser's own back button. They moved into `(app)/` on 2026-09-06.
 *
 * So this is a structural test, not a rendering one. A page's file path decides whether an
 * angler can navigate away from it, which makes the path a product decision worth pinning.
 */

const appDir = fileURLToPath(new URL("../../app/", import.meta.url));

/**
 * Route groups that deliberately render no product chrome. Each needs a reason, and
 * "it is a prototype" only counts while nothing in the product links to it.
 */
const CHROMELESS_GROUPS: Readonly<Record<string, string>> = {
  "(auth)":
    "Sign-in and the OAuth callback. A bottom bar advertising six destinations you cannot " +
    "reach yet would be a menu of locked doors.",
  "(internal)":
    "Internal prototypes (Learn & Build). Not linked from the product shell; if that " +
    "changes, it needs the shell or its own way back.",
};

/** Top-level entries directly under `src/app/`, excluding files and private folders. */
function topLevelDirs(): readonly string[] {
  return readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

/** Does this directory, or anything under it, define a page? */
function containsPage(dir: string): boolean {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      if (entry.name === "page.tsx") return true;
      continue;
    }
    if (containsPage(`${dir}/${entry.name}`)) return true;
  }
  return false;
}

describe("no page escapes the navigation shell", () => {
  it("finds the app directory, so a moved app dir cannot make this vacuous", () => {
    expect(topLevelDirs()).toContain("(app)");
  });

  it("puts every route that renders pages inside a group", () => {
    const stray = topLevelDirs().filter(
      (name) => !name.startsWith("(") && containsPage(`${appDir}${name}`),
    );
    expect(
      stray,
      `These routes sit outside every route group, so they inherit no layout and render ` +
        `with no bottom navigation and no header: ${stray.join(", ")}. Move them into ` +
        `src/app/(app)/ — that is all Fish Legal needed — or, if they genuinely must have ` +
        `no chrome, give them their own group and a reason in CHROMELESS_GROUPS.`,
    ).toEqual([]);
  });

  it("names a reason for every group that opts out of chrome", () => {
    const groups = topLevelDirs().filter((name) => name.startsWith("("));
    const unexplained = groups.filter(
      (name) => name !== "(app)" && !(name in CHROMELESS_GROUPS),
    );
    expect(
      unexplained,
      `A new route group renders without the shell unless it says otherwise. Add it to ` +
        `CHROMELESS_GROUPS with the reason an angler there needs no navigation.`,
    ).toEqual([]);
  });

  it("keeps Fish Legal in the shell — the regression this file exists for", () => {
    expect(existsSync(`${appDir}(app)/fish-legal/page.tsx`)).toBe(true);
    expect(existsSync(`${appDir}fish-legal`)).toBe(false);
  });
});
