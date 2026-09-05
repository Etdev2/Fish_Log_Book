import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { allDestinations, destinationGroups } from "./destinations";

/**
 * Nothing in this app is reachable only by knowing where it is.
 *
 * The failure this prevents already happened: Boat Games shipped, and the day after, the
 * person who commissioned it went looking twice and could not find it. It had a link — on
 * the Fish Log, a screen he opens daily — and that still was not enough, because the six
 * bottom-bar slots were full and everything past six had been quietly filed inside
 * whatever screen seemed related. The Passport lived behind Settings. So did the Tackle
 * Box. Fish ID was linked from nowhere at all.
 *
 * Every one of those was a defensible local decision. Together they made a product you
 * have to already know your way around. So this test treats findability as a property of
 * the routing table rather than a thing everyone remembers: add a top-level route and you
 * either put it in the drawer or you say here, in writing, why it is not a destination.
 */

const appDir = fileURLToPath(new URL("../../app/", import.meta.url));

/**
 * Routes that exist but are deliberately not places you "go" — they are things you open
 * from somewhere else, and a drawer entry for them would be noise.
 *
 * Every entry needs a reason. "It felt cluttered" is not one; if a real feature ends up
 * here, that is the bug this file exists to catch.
 */
const NOT_DESTINATIONS: Readonly<Record<string, string>> = {
  catch: "One catch, opened from the Fish Log or the Calendar. Has no meaning without an id.",
  day: "One calendar day, opened from the Calendar.",
  trip: "One trip, opened from the Calendar or the Fish Log.",
  spots:
    "Unfinished. shell-nav.test.ts already pins that it must not be advertised; when it " +
    "ships, it belongs in the drawer and this line should be deleted.",
};

/** Top-level route segments, from both the (app) group and the routes outside it. */
function routeSegments(): readonly string[] {
  const found = new Set<string>();
  for (const dir of [`${appDir}(app)/`, appDir]) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      // Route groups `(app)`, private folders `_x`, and dynamic segments are not
      // top-level destinations in their own right.
      if (/^[([_]/.test(entry.name)) continue;
      if (!existsSync(`${dir}${entry.name}/page.tsx`)) continue;
      found.add(entry.name);
    }
  }
  return [...found].sort();
}

describe("every destination is findable from anywhere", () => {
  const segments = routeSegments();
  const hrefs = new Set(allDestinations().map((d) => d.href));

  it("finds the route directories, so a moved app dir cannot make this vacuous", () => {
    expect(segments.length).toBeGreaterThan(8);
    expect(segments).toContain("log");
  });

  it("lists every top-level route in the drawer, or names why it is not a destination", () => {
    const missing = segments.filter(
      (segment) => !hrefs.has(`/${segment}`) && !(segment in NOT_DESTINATIONS),
    );
    expect(
      missing,
      `These routes exist but cannot be reached from the navigation drawer. Add them to ` +
        `destinations.ts, or add them to NOT_DESTINATIONS with a reason. A feature nobody ` +
        `can find is a feature nobody built.`,
    ).toEqual([]);
  });

  it("includes the Calendar, which has no directory of its own", () => {
    expect(hrefs.has("/")).toBe(true);
  });

  it("points only at routes that exist", () => {
    for (const destination of allDestinations()) {
      if (destination.href === "/") continue;
      const segment = destination.href.replace(/^\//, "");
      expect(
        segments,
        `${destination.href} is in the drawer but has no page`,
      ).toContain(segment);
    }
  });

  it("names the things that were previously buried", () => {
    // The three that prompted this work. If any is dropped, that is a regression.
    for (const href of ["/games", "/passport", "/tackle"]) {
      expect(hrefs.has(href), `${href} is not in the drawer`).toBe(true);
    }
  });
});

describe("the drawer reads like something a person wrote", () => {
  it("gives every destination a label and a plain-language line", () => {
    for (const destination of allDestinations()) {
      expect(destination.label.length).toBeGreaterThan(2);
      expect(destination.blurb.length).toBeGreaterThan(10);
      // A blurb that just repeats the label teaches nothing.
      expect(destination.blurb.toLowerCase()).not.toBe(destination.label.toLowerCase());
    }
  });

  it("has no duplicate destinations", () => {
    const hrefs = allDestinations().map((d) => d.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("renders no empty group when a feature flag is off", () => {
    for (const group of destinationGroups()) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
