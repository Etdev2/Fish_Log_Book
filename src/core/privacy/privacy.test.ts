import { describe, expect, it } from "vitest";

import vectors from "./vectors/privacy.json";
import {
  PRECISION_LEVELS,
  coarsen,
  coarsestOf,
  geoCell,
  isCellSafe,
  precisionRank,
  type PrecisionLevel,
} from "./precision";
import {
  DEFAULT_SPECIES_POLICY,
  effectiveDisclosure,
  type SpeciesLocationPolicy,
} from "./effective";
import {
  DEFAULT_K_CONFIG,
  differenceIsSafe,
  kAnonymityVerdict,
  type CellSample,
} from "./k-anonymity";

describe("the precision ladder", () => {
  it("runs finest to coarsest, which every comparison depends on", () => {
    expect([...PRECISION_LEVELS]).toEqual([
      "EXACT",
      "CELL_1KM",
      "CELL_10KM",
      "CELL_50KM",
      "ZONE",
      "NONE",
    ]);
    for (let i = 1; i < PRECISION_LEVELS.length; i += 1) {
      expect(precisionRank(PRECISION_LEVELS[i])).toBeGreaterThan(
        precisionRank(PRECISION_LEVELS[i - 1]),
      );
    }
  });

  it("coarsestOf never widens, for any pair on the ladder", () => {
    for (const a of PRECISION_LEVELS) {
      for (const b of PRECISION_LEVELS) {
        const result = coarsestOf(a, b);
        expect(precisionRank(result)).toBeGreaterThanOrEqual(precisionRank(a));
        expect(precisionRank(result)).toBeGreaterThanOrEqual(precisionRank(b));
      }
    }
  });
});

describe("cell arithmetic matches the SQL generated columns", () => {
  for (const vector of vectors.cells) {
    it(vector.name, () => {
      const coordinate = { lat: vector.lat, lng: vector.lng };
      expect(geoCell(coordinate, "CELL_1KM")).toBe(vector.cell1km);
      expect(geoCell(coordinate, "CELL_10KM")).toBe(vector.cell10km);
      expect(geoCell(coordinate, "CELL_50KM")).toBe(vector.cell50km);
    });
  }

  it("has no cell for the non-cell levels", () => {
    const coordinate = { lat: 33.5, lng: -118.0 };
    expect(geoCell(coordinate, "EXACT")).toBeNull();
    expect(geoCell(coordinate, "ZONE")).toBeNull();
    expect(geoCell(coordinate, "NONE")).toBeNull();
  });
});

describe("coarsen", () => {
  const coordinate = { lat: 33.5987, lng: -118.0123 };

  it("returns the coordinate only at EXACT", () => {
    expect(coarsen(coordinate, "EXACT")).toEqual({ kind: "exact", lat: 33.5987, lng: -118.0123 });
  });

  it("returns a cell at each cell level", () => {
    expect(coarsen(coordinate, "CELL_10KM")).toEqual({
      kind: "cell",
      cell: "335_-1181",
      level: "CELL_10KM",
    });
  });

  it("carries the zone id at ZONE, and is honest when none is known", () => {
    expect(coarsen(coordinate, "ZONE", "ca-gma-southern")).toEqual({
      kind: "zone",
      zoneId: "ca-gma-southern",
    });
    expect(coarsen(coordinate, "ZONE")).toEqual({ kind: "zone", zoneId: null });
  });

  it("gives up geography entirely at NONE, even holding a coordinate", () => {
    expect(coarsen(coordinate, "NONE")).toEqual({ kind: "none" });
  });

  it("a catch with no coordinate discloses nothing, at any level", () => {
    for (const level of PRECISION_LEVELS) {
      const result = coarsen(null, level);
      expect(result.kind === "none" || result.kind === "zone").toBe(true);
    }
  });

  for (const vector of vectors.unsafeCells) {
    it(`fails closed rather than computing a wrong cell: ${vector.name}`, () => {
      const bad = { lat: vector.lat, lng: vector.lng };
      expect(isCellSafe(bad)).toBe(false);
      // Not a coordinate, and not a wrong cell. The coarsest thing that is still true.
      expect(coarsen(bad, "CELL_1KM")).toEqual({ kind: "zone", zoneId: null });
    });
  }

  it("never returns an exact coordinate for any level except EXACT", () => {
    for (const level of PRECISION_LEVELS) {
      if (level === "EXACT") continue;
      expect(coarsen(coordinate, level).kind).not.toBe("exact");
    }
  });
});

describe("effective disclosure: the coarsest input wins", () => {
  for (const vector of vectors.disclosure) {
    it(vector.name, () => {
      const raw = vector.inputs as Record<string, unknown>;
      const policyName = raw.speciesPolicy as SpeciesLocationPolicy | undefined;

      const result = effectiveDisclosure({
        accountLevel: raw.accountLevel as PrecisionLevel | undefined,
        programLevel: raw.programLevel as PrecisionLevel | undefined,
        catchOverride: raw.catchOverride as PrecisionLevel | undefined,
        speciesPolicy: policyName === undefined ? undefined : DEFAULT_SPECIES_POLICY[policyName],
        programTemporalDelayDays: raw.programTemporalDelayDays as number | undefined,
      });

      expect(result.level).toBe(vector.level);
      expect(result.temporalDelayDays).toBe(vector.delayDays);
      expect(result.excludedFromSharedSurfaces).toBe(vector.excluded);
      expect([...result.binding].sort()).toEqual([...vector.binding].sort());
    });
  }

  it("cannot be widened by adding an input", () => {
    /*
      The property the whole module rests on: every additional rule may only make the
      answer coarser. If a future input is ever allowed to relax one, this fails.
    */
    const base = effectiveDisclosure({
      accountLevel: "CELL_10KM",
      speciesPolicy: DEFAULT_SPECIES_POLICY.standard,
    });
    for (const level of PRECISION_LEVELS) {
      const withProgram = effectiveDisclosure({
        accountLevel: "CELL_10KM",
        programLevel: level,
        speciesPolicy: DEFAULT_SPECIES_POLICY.standard,
      });
      expect(precisionRank(withProgram.level)).toBeGreaterThanOrEqual(precisionRank(base.level));
    }
  });
});

describe("k-anonymity", () => {
  for (const vector of vectors.kAnonymity) {
    it(vector.name, () => {
      const verdict = kAnonymityVerdict(vector.sample as CellSample);
      expect(verdict.kind).toBe(vector.allowed ? "ALLOWED" : "SUPPRESSED");
      if (verdict.kind === "SUPPRESSED") {
        expect([...verdict.reasons].sort()).toEqual([...vector.reasons].sort());
      }
    });
  }

  it("reads its thresholds from config, so biostat's numbers are a value change", () => {
    const sample: CellSample = {
      distinctAnglers: 8,
      catchCount: 40,
      maxSingleAnglerCatches: 10,
    };
    expect(kAnonymityVerdict(sample, DEFAULT_K_CONFIG).kind).toBe("ALLOWED");
    expect(kAnonymityVerdict(sample, { ...DEFAULT_K_CONFIG, k: 10 }).kind).toBe("SUPPRESSED");
  });
});

describe("differencing", () => {
  for (const vector of vectors.differencing) {
    it(vector.name, () => {
      expect(
        differenceIsSafe(vector.larger as CellSample, vector.smaller as CellSample),
      ).toBe(vector.safe);
    });
  }

  it("a difference that isolates a single angler is refused however big the inputs are", () => {
    /*
      The attack in one test: shrink the bounding box by one cell and subtract. Both
      queries are large enough to pass the gate on their own, which is exactly why the
      gate alone does not stop this.
    */
    const larger: CellSample = {
      distinctAnglers: 200,
      catchCount: 5000,
      maxSingleAnglerCatches: 60,
    };
    const smaller: CellSample = {
      distinctAnglers: 199,
      catchCount: 4995,
      maxSingleAnglerCatches: 60,
    };
    expect(kAnonymityVerdict(larger).kind).toBe("ALLOWED");
    expect(kAnonymityVerdict(smaller).kind).toBe("ALLOWED");
    expect(differenceIsSafe(larger, smaller)).toBe(false);
  });
});
