import { describe, expect, it } from "vitest";

import vectors from "../vectors/catch-rules.json";
import {
  celsiusToFahrenheit,
  compassLabel,
  depthToMetres,
  fahrenheitToCelsius,
  gramsToPoundsOunces,
  hpaToInHg,
  inHgToHpa,
  knotsToMps,
  lengthToMillimetres,
  mpsToKnots,
  parseMeasurement,
  weightToGrams,
  type DepthUnit,
  type LengthUnit,
  type WeightUnit,
} from "./measurement";
import {
  applyRig,
  canTransitionResolution,
  isCountable,
  localDateOf,
  repeatSeedFrom,
  sortGear,
  validateCatch,
} from "./rules";
import type { CatchGear, CatchRecord, RigRecord } from "./types";

const NOW = "2026-08-20T21:12:00.000Z";

function makeCatch(overrides: Partial<CatchRecord> = {}): CatchRecord {
  return {
    id: "0198d9c1-9800-7000-8000-000000000001",
    angler_id: "angler-1",
    trip_id: "trip-1",
    caught_at: NOW,
    caught_tz: "America/Los_Angeles",
    local_date: "2026-08-20",
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: "confirmed",
    dismissed_reason: null,
    resolved_at: NOW,
    species_id: "bluefin_tuna",
    species_other: null,
    outcome: "landed",
    disposition: "kept",
    quantity: 1,
    length_mm: null,
    weight_g: 38102,
    size_estimated: false,
    spot_id: null,
    platform: null,
    depth_fished_m: 76.2,
    rig_id: null,
    rig_revision: null,
    rig_slot: null,
    inherited_fields: [],
    location_condition_id: null,
    location_name: null,
    current_term: null,
    current_strength: null,
    structure_type_ids: [],
    bottom_depth_m: null,
    water_color_id: null,
    water_clarity_id: null,
    presentation: null,
    notes: null,
    tags: [],
    favorite: false,
    regulation_snapshot: null,
    capture_mode: "live",
    client_created_at: NOW,
    created_at: NOW,
    client_updated_at: NOW,
    deleted_at: null,
    ...overrides,
  };
}

const gear = (role: CatchGear["role"], label: string): CatchGear => ({
  id: `gear-${role}`,
  catch_id: "c1",
  angler_id: "angler-1",
  tackle_item_id: `tackle-${role}`,
  role,
  label,
  detail: null,
  created_at: NOW,
  deleted_at: null,
});

describe("localDateOf — vectors", () => {
  for (const v of vectors.localDate) {
    it(v.name, () => {
      expect(localDateOf(v.instant, v.zone)).toBe(v.expected);
    });
  }
});

describe("isCountable — vectors", () => {
  for (const v of vectors.countable) {
    it(v.name, () => {
      const record = makeCatch({
        resolution_state: v.resolution_state as CatchRecord["resolution_state"],
        outcome: v.outcome as CatchRecord["outcome"],
        resolved_at: v.resolution_state === "unresolved" ? null : NOW,
        dismissed_reason: v.resolution_state === "dismissed" ? "mistap" : null,
        deleted_at: v.deleted ? NOW : null,
      });
      expect(isCountable(record)).toBe(v.expected);
    });
  }
});

describe("resolution transitions — vectors (D22)", () => {
  for (const v of vectors.resolutionTransitions) {
    it(`${v.from} -> ${v.to} is ${v.allowed ? "allowed" : "refused"}`, () => {
      expect(
        canTransitionResolution(
          v.from as CatchRecord["resolution_state"],
          v.to as CatchRecord["resolution_state"],
        ),
      ).toBe(v.allowed);
    });
  }
});

describe("measurement — vectors", () => {
  for (const v of vectors.measurement) {
    it(v.name, () => {
      expect(weightToGrams(v.value, v.unit as WeightUnit, v.ounces)).toBe(v.expectedGrams);
    });
  }
  for (const v of vectors.length) {
    it(v.name, () => {
      expect(lengthToMillimetres(v.value, v.unit as LengthUnit)).toBe(v.expectedMm);
    });
  }
  for (const v of vectors.depth) {
    it(v.name, () => {
      expect(depthToMetres(v.value, v.unit as DepthUnit)).toBe(v.expectedMetres);
    });
  }
});

describe("measurement edges", () => {
  it("carries 15.99 oz up to the next pound rather than printing 16.0 oz", () => {
    const justUnderAPound = Math.round(15.99 * 28.349523125);
    expect(gramsToPoundsOunces(justUnderAPound)).toEqual({ lb: 1, oz: 0 });
  });

  it("refuses kilograms-and-ounces, which nobody means", () => {
    expect(weightToGrams(3, "kg", 4)).toBeNull();
  });

  it("distinguishes blank from unparseable", () => {
    expect(parseMeasurement("")).toBeNull();
    expect(parseMeasurement("   ")).toBeNull();
    expect(parseMeasurement("heavy")).toBeUndefined();
    expect(parseMeasurement("84")).toBe(84);
    expect(parseMeasurement(" 84.5 lb ")).toBe(84.5);
    expect(parseMeasurement(".5")).toBe(0.5);
  });

  it("rejects NaN and Infinity", () => {
    expect(weightToGrams(Number.NaN, "lb")).toBeNull();
    expect(weightToGrams(Number.POSITIVE_INFINITY, "lb")).toBeNull();
  });
});

describe("validateCatch — spec §40", () => {
  it("passes a well-formed catch", () => {
    expect(validateCatch(makeCatch())).toEqual([]);
  });

  it("rejects quantity below one", () => {
    expect(validateCatch(makeCatch({ quantity: 0 }))).toContain("quantity_below_one");
  });

  it("rejects a fractional quantity", () => {
    expect(validateCatch(makeCatch({ quantity: 1.5 }))).toContain("quantity_below_one");
  });

  it("rejects negative measurements", () => {
    const errors = validateCatch(
      makeCatch({ weight_g: -1, length_mm: -1, depth_fished_m: -1 }),
    );
    expect(errors).toContain("negative_weight");
    expect(errors).toContain("negative_length");
    expect(errors).toContain("negative_depth");
  });

  it("rejects an invalid timestamp", () => {
    expect(validateCatch(makeCatch({ caught_at: "not a date" }))).toContain("invalid_timestamp");
  });

  it("mirrors the confirmed-needs-outcome constraint", () => {
    expect(validateCatch(makeCatch({ outcome: null }))).toContain("confirmed_needs_outcome");
  });

  it("mirrors the dismissed-needs-reason constraint", () => {
    const errors = validateCatch(
      makeCatch({ resolution_state: "dismissed", outcome: null, dismissed_reason: null }),
    );
    expect(errors).toContain("dismissed_needs_reason");
  });

  it("rejects a reason without a dismissal", () => {
    expect(validateCatch(makeCatch({ dismissed_reason: "mistap" }))).toContain(
      "reason_without_dismissal",
    );
  });

  it("rejects resolved_at disagreeing with the state", () => {
    expect(validateCatch(makeCatch({ resolution_state: "unresolved", outcome: null }))).toContain(
      "resolved_state_mismatch",
    );
  });

  it("reports every problem at once rather than the first", () => {
    expect(validateCatch(makeCatch({ quantity: 0, weight_g: -5 })).length).toBe(2);
  });
});

describe("applyRig — D21a", () => {
  const rig: RigRecord = {
    id: "rig-1",
    angler_id: "angler-1",
    trip_id: "trip-1",
    slot: 1,
    name: "40 lb Flyline",
    setup_type: "flyline",
    revision: 2,
    effective_from: NOW,
    spot_id: "spot-1",
    platform: "boat",
    depth_fished_m: 76.2,
    gear: [
      { angler_id: "angler-1", tackle_item_id: "t1", role: "jig", label: "Nomad Streaker 200g", detail: "Pink" },
    ],
    live_bait: true,
    created_at: NOW,
    retired_at: null,
  };

  it("fills absent fields from the standing rig and records what it supplied", () => {
    const result = applyRig({}, rig, "c1", NOW);
    expect(result.spot_id).toBe("spot-1");
    expect(result.platform).toBe("boat");
    expect(result.depth_fished_m).toBe(76.2);
    expect(result.rig_revision).toBe(2);
    expect(result.inherited_fields).toEqual(["spot_id", "platform", "depth_fished_m", "gear"]);
  });

  it("never overrides what the angler typed", () => {
    const result = applyRig({ depth_fished_m: 30 }, rig, "c1", NOW);
    expect(result.depth_fished_m).toBe(30);
    expect(result.inherited_fields).not.toContain("depth_fished_m");
  });

  it("copies rig gear onto the catch so a later rig change cannot rewrite it", () => {
    const result = applyRig({}, rig, "c1", NOW);
    expect(result.gear).toHaveLength(1);
    expect(result.gear[0].catch_id).toBe("c1");
    expect(result.gear[0].label).toBe("Nomad Streaker 200g");
  });

  it("with no rig, inherits nothing and claims nothing", () => {
    const result = applyRig({ platform: "shore" }, null, "c1", NOW);
    expect(result.platform).toBe("shore");
    expect(result.inherited_fields).toEqual([]);
    expect(result.rig_id).toBeNull();
  });
});

describe("repeatSeedFrom — spec §6/§7", () => {
  const previous = makeCatch({ weight_g: 38102, length_mm: 900, notes: "meter marks at 250" });

  it("carries how you were fishing", () => {
    const seed = repeatSeedFrom(previous, [gear("jig", "Nomad Streaker 200g")]);
    expect(seed.species_id).toBe("bluefin_tuna");
    expect(seed.depth_fished_m).toBe(76.2);
    expect(seed.gear).toHaveLength(1);
  });

  it("does NOT carry this particular fish", () => {
    const seed = repeatSeedFrom(previous, []) as unknown as Record<string, unknown>;
    expect(seed.weight_g).toBeUndefined();
    expect(seed.length_mm).toBeUndefined();
    expect(seed.notes).toBeUndefined();
  });
});

describe("sortGear", () => {
  it("reads a rig top to bottom, rod first", () => {
    const sorted = sortGear([gear("jig", "j"), gear("rod", "r"), gear("leader", "l")]);
    expect(sorted.map((g) => g.role)).toEqual(["rod", "leader", "jig"]);
  });
});

describe("environment converters (Historical §2 — display in, SI stored)", () => {
  it("freezes and boils water at the right numbers", () => {
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 4);
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 4);
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 4);
  });

  it("round-trips an honest water temperature", () => {
    expect(celsiusToFahrenheit(fahrenheitToCelsius(64.3))).toBeCloseTo(64.3, 4);
  });

  it("round-trips pressure through hPa, the storage unit", () => {
    expect(inHgToHpa(hpaToInHg(1013.25))).toBeCloseTo(1013.25, 3);
    // A standard atmosphere in the display unit an angler's barometer reports.
    expect(hpaToInHg(1013.25)).toBeCloseTo(29.92, 1);
  });

  it("round-trips wind through m/s, displaying knots", () => {
    expect(mpsToKnots(knotsToMps(8))).toBeCloseTo(8, 4);
    expect(knotsToMps(19.44)).toBeCloseTo(10, 2);
  });
});

describe("compassLabel", () => {
  it("names the cardinal points", () => {
    expect(compassLabel(0)).toBe("N");
    expect(compassLabel(90)).toBe("E");
    expect(compassLabel(180)).toBe("S");
    expect(compassLabel(270)).toBe("W");
  });

  it("wraps negatives and past-360 bearings", () => {
    expect(compassLabel(-45)).toBe(compassLabel(315));
    expect(compassLabel(380)).toBe(compassLabel(20));
  });

  it("splits the difference halfway between points", () => {
    expect(compassLabel(202.5)).toBe("SSW");
  });
});
