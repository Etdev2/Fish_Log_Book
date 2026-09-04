import { describe, expect, it } from "vitest";

import { REGIONS } from "@/core/ontology/regions";

import { boundaryViewFor, hasBoundaryData } from "./boundary-coverage";
import { FLORIDA } from "./florida-pack";
import { NORCAL } from "./norcal-pack";
import { SOCAL } from "./reg-data";

/**
 * The regression these exist for: every region that was not California used to fall
 * through to a Florida map centred on [26.5, -82.5]. Nothing failed, because nothing
 * asserted which coastline a region should see.
 */
describe("boundary coverage", () => {
  it("gives California and Florida a view, and every other region none", () => {
    const covered = REGIONS.map((r) => r.id).filter(hasBoundaryData);
    expect([...covered].sort()).toEqual(
      [
        "ca_gma_central",
        "ca_gma_mendocino",
        "ca_gma_northern",
        "ca_gma_san_francisco",
        "ca_gma_southern",
        "florida",
        "northern_california",
        "southern_california",
      ].sort(),
    );
  });

  it("never shows one region the coastline of another", () => {
    // The actual bug, stated as an assertion: a region's view must come from its own
    // bundle. Florida's areas may only be drawn for Florida.
    for (const { id } of REGIONS) {
      const view = boundaryViewFor(id);
      if (!view) continue;
      if (id === "florida") {
        expect(view.bundle).toBe(FLORIDA);
      } else {
        expect(view.bundle, `${id} must not render Florida`).not.toBe(FLORIDA);
        expect([SOCAL, NORCAL]).toContain(view.bundle);
      }
    }
  });

  it("draws the 50-fathom RCA ribbon only in the Southern GMA, where the law puts it", () => {
    const withRca = REGIONS.map((r) => r.id).filter((id) => boundaryViewFor(id)?.showRca);
    expect([...withRca].sort()).toEqual(["ca_gma_southern", "southern_california"]);
  });

  it("names every view for the coastline actually on screen", () => {
    for (const { id } of REGIONS) {
      const view = boundaryViewFor(id);
      if (!view) continue;
      expect(view.label.length).toBeGreaterThan(0);
      // A Florida view labelled "California" is the failure this catches.
      const saysFlorida = view.label.includes("Florida");
      expect(saysFlorida).toBe(id === "florida");
    }
  });

  it("points each view at an area its own bundle actually contains", () => {
    for (const { id } of REGIONS) {
      const view = boundaryViewFor(id);
      if (!view) continue;
      expect(view.areas.some((a) => a.id === view.areaId), `${id}: ${view.areaId}`).toBe(true);
    }
  });
});
