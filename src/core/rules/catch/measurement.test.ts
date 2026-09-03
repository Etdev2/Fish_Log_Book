/**
 * `measurement.ts` against `src/core/rules/vectors/catch-measurement.json`.
 *
 * The expected values in that file come from the exact SI definitions (1959 yard-and-pound,
 * NIST SP 811), not from this implementation. ADR 003 §4: the vectors are what let the
 * Swift client be checked against this one.
 */
import { describe, expect, it } from "vitest";

import vectors from "../vectors/catch-measurement.json";
import {
  compassLabel,
  celsiusToFahrenheit,
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

describe("measurement vectors (ADR 003 §4)", () => {
  it("weightToGrams", () => {
    for (const c of vectors.weightToGrams) {
      expect(weightToGrams(c.value, c.unit as WeightUnit, c.ounces), JSON.stringify(c))
        .toBe(c.expectedGrams);
    }
  });

  it("lengthToMillimetres", () => {
    for (const c of vectors.lengthToMillimetres) {
      expect(lengthToMillimetres(c.value, c.unit as LengthUnit), JSON.stringify(c))
        .toBe(c.expectedMm);
    }
  });

  it("depthToMetres", () => {
    for (const c of vectors.depthToMetres) {
      expect(depthToMetres(c.value, c.unit as DepthUnit), JSON.stringify(c)).toBe(c.expectedM);
    }
  });

  it("gramsToPoundsOunces", () => {
    for (const c of vectors.gramsToPoundsOunces) {
      expect(gramsToPoundsOunces(c.grams), JSON.stringify(c)).toEqual({ lb: c.lb, oz: c.oz });
    }
  });

  it("fahrenheitToCelsius round-trips", () => {
    for (const c of vectors.fahrenheitToCelsius) {
      expect(fahrenheitToCelsius(c.f), JSON.stringify(c)).toBeCloseTo(c.expectedC, 9);
      expect(celsiusToFahrenheit(fahrenheitToCelsius(c.f))).toBeCloseTo(c.f, 9);
    }
  });

  it("inHgToHpa matches the NIST-defined factor", () => {
    for (const c of vectors.inHgToHpa) {
      expect(inHgToHpa(c.inHg), JSON.stringify(c)).toBeCloseTo(c.expectedHpa, 9);
      expect(hpaToInHg(inHgToHpa(c.inHg))).toBeCloseTo(c.inHg, 9);
    }
  });

  it("knotsToMps matches the 1852 m nautical mile", () => {
    for (const c of vectors.knotsToMps) {
      expect(knotsToMps(c.knots), JSON.stringify(c)).toBeCloseTo(c.expectedMps, 9);
      expect(mpsToKnots(knotsToMps(c.knots))).toBeCloseTo(c.knots, 9);
    }
  });

  it("compassLabel", () => {
    for (const c of vectors.compassLabel) {
      expect(compassLabel(c.deg), JSON.stringify(c)).toBe(c.expected);
    }
  });

  it("parseMeasurement distinguishes blank from unparseable", () => {
    for (const c of vectors.parseMeasurement) {
      const expected = c.expected === "UNDEFINED" ? undefined : c.expected;
      expect(parseMeasurement(c.raw), JSON.stringify(c)).toBe(expected);
    }
  });
});
