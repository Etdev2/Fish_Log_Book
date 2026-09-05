import { describe, expect, it } from "vitest";

import { evaluateVerification } from "./verification";

describe("evaluateVerification", () => {
  it("clears when every required check passes", () => {
    const result = evaluateVerification([
      { type: "PHOTO_PRESENT", result: "PASS", reasonCode: "PHOTO_PRESENT" },
      { type: "GPS_BOUNDARY", result: "PASS", reasonCode: "INSIDE" },
      { type: "QR_TOKEN", result: "NOT_REQUIRED", reasonCode: "NOT_REQUIRED" },
    ]);
    expect(result.disposition).toBe("CLEAR");
    expect(result.signals).toEqual([]);
  });

  it("requires review for warning/unknown results", () => {
    const result = evaluateVerification([
      { type: "GPS_ACCURACY", result: "WARNING", reasonCode: "ACCURACY_95M" },
    ]);
    expect(result.disposition).toBe("REVIEW_REQUIRED");
    expect(result.signals[0]?.code).toBe("GPS_LOW_ACCURACY");
  });

  it("does not automatically block an ordinary failure", () => {
    const result = evaluateVerification([
      { type: "PHOTO_DUPLICATE", result: "FAIL", reasonCode: "EXACT_HASH_MATCH" },
    ]);
    expect(result.disposition).toBe("REVIEW_REQUIRED");
    expect(result.signals[0]?.code).toBe("PHOTO_DUPLICATE");
  });

  it("blocks only when policy explicitly marks a failed check deterministic", () => {
    const result = evaluateVerification(
      [{ type: "GPS_BOUNDARY", result: "FAIL", reasonCode: "OUTSIDE_BOUNDARY" }],
      new Set(["GPS_BOUNDARY"]),
    );
    expect(result.disposition).toBe("BLOCKED_BY_POLICY");
    expect(result.signals[0]?.code).toBe("GPS_OUTSIDE_BOUNDARY");
  });

  it("keeps QR reuse explainable", () => {
    const result = evaluateVerification([
      { type: "QR_TOKEN", result: "FAIL", reasonCode: "QR_REUSED" },
    ]);
    expect(result.signals).toEqual([
      { code: "QR_REUSED", severity: "BLOCKING_REVIEW", explanation: "QR_REUSED" },
    ]);
  });
});
