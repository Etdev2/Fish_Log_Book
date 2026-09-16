import { describe, expect, it } from "vitest";

import vectors from "./vectors/enrichment.json";
import { buildFetchPlan, providerCacheKey, type PlanInput } from "./plan";
import { distanceM, distanceVerdict, FIELD_THRESHOLDS } from "./thresholds";
import { mergeObservations } from "./merge";
import { tideObservations, tideOutOfRange } from "./tide-adapter";
import type { EnrichmentField, Observation, ObservationKind, Refusal } from "./types";

const RETRIEVED_AT = 1_789_000_000_000;

function observation(
  field: EnrichmentField,
  value: number | string,
  distanceToSourceM: number | null,
  kind: ObservationKind = "SENSOR",
): Observation {
  return {
    field,
    value,
    unit: "x",
    kind,
    providerId: "test",
    datasetId: "test:ds",
    datasetVersion: "v1",
    observedAt: RETRIEVED_AT,
    retrievedAt: RETRIEVED_AT,
    spatialResolutionM: null,
    distanceToSourceM,
    qualityFlag: null,
    algoVersion: 1,
  };
}

describe("the fetch plan", () => {
  for (const vector of vectors.plans) {
    it(vector.name, () => {
      const plan = buildFetchPlan(vector.input as unknown as PlanInput);
      const planned = plan.planned.map((p) => p.field);

      for (const field of vector.plannedIncludes) expect(planned).toContain(field);

      if (vector.skippedWithReason) {
        for (const [field, reason] of Object.entries(vector.skippedWithReason)) {
          const entry = plan.skipped.find((s) => s.field === field);
          expect(entry, `expected ${field} to be skipped`).toBeDefined();
          expect(entry?.reason).toBe(reason);
          expect(planned).not.toContain(field);
        }
      }
    });
  }

  it("never plans a field the angler already answered", () => {
    /*
      The angler's thermometer is the only in-situ measurement in the system. Enriching
      over it would trade the best number for a satellite composite and call it an
      improvement.
    */
    const plan = buildFetchPlan({
      waterClass: "salt",
      geoCell1km: "3359_-11802",
      observedAtMs: RETRIEVED_AT,
      basis: "observed",
      userMeasuredFields: ["water_temp_c", "pressure_hpa"],
    });
    expect(plan.planned.map((p) => p.field)).not.toContain("water_temp_c");
    expect(plan.planned.map((p) => p.field)).not.toContain("pressure_hpa");
  });

  it("plans nothing twice", () => {
    const plan = buildFetchPlan({
      waterClass: "salt",
      geoCell1km: "3359_-11802",
      observedAtMs: RETRIEVED_AT,
      basis: "observed",
      userMeasuredFields: [],
    });
    const fields = plan.planned.map((p) => p.field);
    expect(new Set(fields).size).toBe(fields.length);
  });
});

describe("the provider cache key", () => {
  it("buckets by the clock hour, so a reef full of anglers is one request", () => {
    /*
      Aligned to an hour boundary on purpose. The bucket is a floor, not a window: two
      catches 5 minutes apart either side of :00 are two requests, and that is correct —
      a rolling window would have the same boundary somewhere else and would not be
      reproducible from the timestamp alone.
    */
    const topOfHour = Math.floor(RETRIEVED_AT / 3_600_000) * 3_600_000;
    const a = providerCacheKey("noaa", "v1", "3359_-11802", topOfHour);
    const b = providerCacheKey("noaa", "v1", "3359_-11802", topOfHour + 59 * 60_000);
    expect(a).toBe(b);

    const nextHour = providerCacheKey("noaa", "v1", "3359_-11802", topOfHour + 60 * 60_000);
    expect(nextHour).not.toBe(a);
  });

  it("does not bucket across hours, or across cells, or across dataset versions", () => {
    const base = providerCacheKey("noaa", "v1", "3359_-11802", RETRIEVED_AT);
    expect(providerCacheKey("noaa", "v1", "3359_-11802", RETRIEVED_AT + 3_600_000)).not.toBe(base);
    expect(providerCacheKey("noaa", "v1", "3360_-11802", RETRIEVED_AT)).not.toBe(base);
    expect(providerCacheKey("noaa", "v2", "3359_-11802", RETRIEVED_AT)).not.toBe(base);
  });

  it("contains a cell and never a coordinate", () => {
    // Rule E1: the key is what appears in a log line (ontology.md §6 item 4).
    const key = providerCacheKey("noaa", "v1", "3359_-11802", RETRIEVED_AT);
    expect(key).not.toMatch(/\d+\.\d{3,}/);
  });
});

describe("distance thresholds", () => {
  for (const vector of vectors.distances) {
    it(vector.name, () => {
      expect(distanceVerdict(vector.field as EnrichmentField, vector.distanceM)).toBe(vector.verdict);
    });
  }

  it("every field has a trusted radius inside its maximum", () => {
    for (const [field, t] of Object.entries(FIELD_THRESHOLDS)) {
      expect(t.trustedDistanceM, field).toBeLessThanOrEqual(t.maxDistanceM);
    }
  });

  it("measures real distance: Newport to San Diego is about 100 km", () => {
    const newport = { lat: 33.6047, lng: -117.883 };
    const sanDiego = { lat: 32.7142, lng: -117.1736 };
    const km = distanceM(newport, sanDiego) / 1000;
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(125);
  });

  it("is zero for a point against itself", () => {
    expect(distanceM({ lat: 33.6, lng: -117.9 }, { lat: 33.6, lng: -117.9 })).toBe(0);
  });
});

describe("merging observations into a status", () => {
  for (const vector of vectors.merges) {
    it(vector.name, () => {
      const plan = {
        planned: vector.planned.map((field) => ({ field: field as EnrichmentField, reason: "PLANNED" as const })),
        skipped: [],
      };
      const observed = vector.observed.map((o) =>
        observation(o.field as EnrichmentField, o.value, o.distanceToSourceM),
      );
      const refusals = vector.refusals as unknown as Refusal[];

      const result = mergeObservations(plan, observed, refusals);

      expect(result.status).toBe(vector.status);
      expect([...result.retryFields].sort()).toEqual([...vector.retryFields].sort());

      if (vector.expectValue) {
        for (const [field, value] of Object.entries(vector.expectValue)) {
          expect(result.projection[field]).toBe(value);
        }
      }
    });
  }

  it("relabels a distant value INTERPOLATED rather than dropping or trusting it", () => {
    const plan = { planned: [{ field: "tide_height_m" as EnrichmentField, reason: "PLANNED" as const }], skipped: [] };
    const result = mergeObservations(plan, [observation("tide_height_m", 1.2, 20_000)], []);
    expect(result.status).toBe("complete");
    expect(result.observations[0].kind).toBe("INTERPOLATED");
  });

  it("never puts a null value in the projection", () => {
    /*
      biostat rule 1, and the schema comment says it too: missing is null, never zero. A
      field that came back empty is a refusal, not a reading of nothing.
    */
    const plan = { planned: [{ field: "sst_c" as EnrichmentField, reason: "PLANNED" as const }], skipped: [] };
    const empty: Observation = { ...observation("sst_c", 0, 1000), value: null };
    const result = mergeObservations(plan, [empty], []);
    expect(result.projection).not.toHaveProperty("sst_c");
  });
});

describe("the tide adapter", () => {
  const reading = {
    at: 1_789_000_000_000,
    height: { value: 1.42, certainty: "published", basis: "test" },
    rate: { value: 0.31, certainty: "published", basis: "test" },
    motion: "rising",
    previousTurn: null,
    nextTurn: { at: 1_789_000_000_000 + 95 * 60_000, kind: "high", height: 1.9 },
    cycleProgress: 0.5,
    ruleOfTwelfthsHour: 3,
    twelfths: 3,
    pace: { value: "steady", certainty: "published", basis: "test" },
  } as unknown as Parameters<typeof tideObservations>[0]["reading"];

  const input = {
    reading,
    product: "predictions" as const,
    stationId: "9410580",
    distanceToStationM: 4200,
    retrievedAtMs: RETRIEVED_AT,
    datasetVersion: "coops-2026",
    algoVersion: 1,
  };

  it("labels predictions as a model, not as a sensor", () => {
    /*
      The most widespread provenance error this dataset could make, since tide is the
      field we can serve most often. A harmonic prediction is not a measurement of water.
    */
    const { observations } = tideObservations(input);
    for (const o of observations) expect(o.kind).toBe("MODEL_ANALYSIS");
  });

  it("labels verified water levels as a sensor, because that is what they are", () => {
    const { observations } = tideObservations({ ...input, product: "verified" });
    for (const o of observations) expect(o.kind).toBe("SENSOR");
  });

  it("carries the station distance on every observation", () => {
    const { observations } = tideObservations(input);
    for (const o of observations) expect(o.distanceToSourceM).toBe(4200);
  });

  it("gives minutes to the next turn, from the series rather than by extrapolation", () => {
    const { observations } = tideObservations(input);
    const turn = observations.find((o) => o.field === "minutes_to_next_tide_turn");
    expect(turn?.value).toBe(95);
  });

  it("refuses the next turn rather than inventing one when the series ends", () => {
    const shortSeries = { ...input, reading: { ...reading, nextTurn: null } as typeof reading };
    const { observations, refusals } = tideObservations(shortSeries);
    expect(observations.find((o) => o.field === "minutes_to_next_tide_turn")).toBeUndefined();
    expect(refusals[0]).toMatchObject({ field: "minutes_to_next_tide_turn", reason: "NO_COVERAGE" });
  });

  it("maps near-slack to slack, never to a fifth state the column cannot hold", () => {
    const nearSlack = { ...input, reading: { ...reading, motion: "near-slack" } as typeof reading };
    const state = tideObservations(nearSlack).observations.find((o) => o.field === "tide_state");
    expect(state?.value).toBe("slack");
  });

  it("knows when a station is simply too far to speak for this water", () => {
    expect(tideOutOfRange(4_200)).toBe(false);
    expect(tideOutOfRange(80_000)).toBe(true);
  });

  it("every observation it produces carries a dataset version", () => {
    // Rule D3: a value with no provenance is not a value. The schema enforces it too.
    const { observations } = tideObservations(input);
    for (const o of observations) {
      expect(o.datasetVersion).toBeTruthy();
      expect(o.providerId).toBeTruthy();
      expect(o.retrievedAt).toBe(RETRIEVED_AT);
    }
  });
});
