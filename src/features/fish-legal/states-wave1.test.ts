import { describe, expect, it } from "vitest";

import { packForRegion } from "./packs";
import { speciesById } from "@/core/ontology/species";
import { regionById, popularSpeciesIds } from "@/core/ontology/regions";
import { limitLines } from "./catch-limits";

const WAVE1 = ["texas", "louisiana", "mississippi", "alabama", "baja_california", "baja_california_sur", "cabo_baja"] as const;

describe("states expansion wave 1 (Gulf + Baja)", () => {
  it("every wave-1 region resolves to a pack", () => {
    for (const id of WAVE1) expect(packForRegion(id), id).not.toBeNull();
  });

  it("every rule in wave-1 packs carries a verbatim, a source URL, and a verification date", () => {
    for (const id of WAVE1) {
      const bundle = packForRegion(id)!.data;
      for (const r of bundle.rules) {
        expect(r.verbatim.length, `${id}/${r.id} verbatim`).toBeGreaterThan(20);
        expect(r.sourceUrl.startsWith("http"), `${id}/${r.id} sourceUrl`).toBe(true);
        expect(r.verifiedAt, `${id}/${r.id} verifiedAt`).toBe("2026-09-02");
      }
    }
  });

  it("species rows named by wave-1 rules exist in the vocabulary", () => {
    for (const id of WAVE1) {
      for (const r of packForRegion(id)!.data.rules) {
        if (r.speciesId) expect(speciesById(r.speciesId), `${id}/${r.id} species ${r.speciesId}`).not.toBeNull();
      }
    }
  });

  it("Texas trout is the 2026-27 rule (3/day, 15-20 slot); LA reds are the 2024 reset (4/day, 18-27)", () => {
    const tx = packForRegion("texas")!.data.rules.find((r) => r.speciesId === "spotted_seatrout")!;
    expect(tx.bagDaily).toBe(3);
    expect([tx.minSizeIn, tx.maxSizeIn]).toEqual([15, 20]);
    const la = packForRegion("louisiana")!.data.rules.find((r) => r.speciesId === "red_drum")!;
    expect(la.bagDaily).toBe(4);
    expect([la.minSizeIn, la.maxSizeIn]).toEqual([18, 27]);
  });

  it("Mexico pack composition: dorado/rooster 2 counting-heavy, marlin/sail 1, composite note present", () => {
    const bc = packForRegion("baja_california")!.data;
    expect(bc.rules.find((r) => r.speciesId === "dorado")!.bagDaily).toBe(2);
    expect(bc.rules.find((r) => r.speciesId === "striped_marlin")!.bagDaily).toBe(1);
    expect(bc.rules.some((r) => r.verbatim.includes("Diez ejemplares"))).toBe(true);
    // BCS is the same federal law on its own area (Cabo region resolves there too).
    expect(packForRegion("cabo_baja")!.data.pack.id).toBe("baja-california-sur-2026-09-01");
  });

  it("kept fish count toward wave-1 species caps (limits engine reads the packs)", () => {
    const lines = limitLines(packForRegion("texas")!.data, "2026-09-02", new Map([["red_drum", 2]]));
    const red = lines.find((l) => l.id === "red_drum")!;
    expect(red.limit).toBe(3);
    expect(red.retained).toBe(2);
    expect(red.state).toBe("approaching");
  });

  it("Settings regions exist for the wave and lead with real species", () => {
    for (const id of ["texas", "louisiana", "mississippi", "alabama", "baja_california", "baja_california_sur"]) {
      expect(regionById(id), id).not.toBeNull();
      const pops = popularSpeciesIds(id as Parameters<typeof popularSpeciesIds>[0]);
      expect(pops.length).toBeGreaterThan(5);
      expect(pops.every((s) => speciesById(s) !== null)).toBe(true);
    }
  });

  it("California's five GMAs are selectable Settings regions with packs and a GMA focus area", () => {
    const GMAS = [
      { id: "ca_gma_northern", area: "ca-gma-northern" },
      { id: "ca_gma_mendocino", area: "ca-gma-mendocino" },
      { id: "ca_gma_san_francisco", area: "ca-gma-san-francisco" },
      { id: "ca_gma_central", area: "ca-gma-central" },
      { id: "ca_gma_southern", area: "ca-gma-southern" },
    ] as const;
    for (const { id, area } of GMAS) {
      expect(regionById(id), id).not.toBeNull();
      expect(popularSpeciesIds(id).every((s) => speciesById(s) !== null), id).toBe(true);
      const bundle = packForRegion(id);
      expect(bundle, id).not.toBeNull();
      expect(bundle!.primaryAreaId, id).toBe(area);
      expect(bundle!.jurisdictionLabel, id).toContain("CDFW");
    }
  });

  it("PNW wave: Oregon and Washington have regions, verified packs, and focus areas; Alaska lands packless", () => {
    const PNW = [
      { id: "oregon", area: "or-marine", authority: "ODFW" },
      { id: "washington", area: "wa-ma-1-4-coastal", authority: "WDFW" },
    ] as const;
    for (const { id, area, authority } of PNW) {
      expect(regionById(id), id).not.toBeNull();
      const pops = popularSpeciesIds(id as Parameters<typeof popularSpeciesIds>[0]);
      expect(pops.length).toBeGreaterThan(5);
      expect(pops.every((s) => speciesById(s) !== null), id).toBe(true);
      const bundle = packForRegion(id);
      expect(bundle, id).not.toBeNull();
      expect(bundle!.primaryAreaId, id).toBe(area);
      expect(bundle!.jurisdictionLabel, id).toContain(authority);
      // Verified-or-nothing: every shipped rule carries the agency's own sentence.
      expect(bundle!.data.rules.every((r) => r.verbatim.length > 20), id).toBe(true);
    }
    // Alaska is a Settings region with species leads but no pack until ADF&G verbatims.
    expect(regionById("alaska")).not.toBeNull();
    expect(packForRegion("alaska")).toBeNull();
  });
});
