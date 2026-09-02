import { describe, expect, it } from "vitest";

import { parseTideWirePayload } from "./tide-wire";

describe("parseTideWirePayload", () => {
  it("merges the hourly curve with the hilo turning points, ascending", () => {
    const result = parseTideWirePayload({
      hourly: {
        predictions: [
          { t: "2026-09-02 00:00", v: "0.931" },
          { t: "2026-09-02 01:00", v: "1.244" },
          { t: "2026-09-02 02:00", v: "1.555" },
        ],
      },
      hilo: {
        predictions: [{ t: "2026-09-02 01:30", v: "1.400", type: "H" }],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.samples).toHaveLength(4);
    expect(result.samples.map((s) => Number(s.at))).toEqual([...result.samples.map((s) => Number(s.at))].sort((a, b) => a - b));
    const turn = result.samples.find((s) => s.turn !== null);
    expect(turn).toBeDefined();
    expect(turn?.turn).toBe("high");
    expect(Number(turn?.height)).toBeCloseTo(1.4, 9);
  });

  it("keeps the turn, not the hourly sample, when they share an exact timestamp", () => {
    const result = parseTideWirePayload({
      hourly: {
        predictions: [
          { t: "2026-09-02 00:00", v: "0.931" },
          { t: "2026-09-02 01:00", v: "9.999" }, // would collide with the hilo turn below
        ],
      },
      hilo: {
        predictions: [{ t: "2026-09-02 01:00", v: "1.400", type: "H" }],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // No duplicate `at` — exactly one sample at 01:00, and it's the turn.
    const atOneHour = result.samples.filter((s) => Number(s.at) === Date.UTC(2026, 8, 2, 1, 0, 0));
    expect(atOneHour).toHaveLength(1);
    expect(atOneHour[0].turn).toBe("high");
    expect(Number(atOneHour[0].height)).toBeCloseTo(1.4, 9);
  });

  it("parses `v` as metres, not millimetres", () => {
    const result = parseTideWirePayload({
      hourly: { predictions: [{ t: "2026-09-02 00:00", v: "1.847" }] },
      hilo: { predictions: [{ t: "2026-09-02 03:00", v: "1.900", type: "H" }] },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number(result.samples[0].height)).toBeCloseTo(1.847, 9);
  });

  it("rejects a malformed payload without throwing", () => {
    expect(() => parseTideWirePayload(null)).not.toThrow();
    expect(parseTideWirePayload(null).ok).toBe(false);

    expect(() => parseTideWirePayload({ hourly: "not an object", hilo: {} })).not.toThrow();
    expect(parseTideWirePayload({ hourly: "not an object", hilo: {} }).ok).toBe(false);

    expect(() => parseTideWirePayload({ hourly: {}, hilo: {} })).not.toThrow();
    expect(parseTideWirePayload({ hourly: {}, hilo: {} }).ok).toBe(false);
  });

  it("treats CO-OPS's HTTP-200 error shape as a failure", () => {
    const result = parseTideWirePayload({
      hourly: { error: { message: "No data was found. This often means the station id is invalid." } },
      hilo: { predictions: [] },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("station id is invalid");
  });

  it("fails on an empty predictions array", () => {
    const result = parseTideWirePayload({
      hourly: { predictions: [] },
      hilo: { predictions: [] },
    });
    expect(result.ok).toBe(false);
  });

  it("drops individual malformed entries instead of failing the whole payload", () => {
    const result = parseTideWirePayload({
      hourly: {
        predictions: [
          { t: "not-a-timestamp", v: "1.0" },
          { t: "2026-09-02 00:00", v: "not-a-number" },
          { t: "2026-09-02 01:00", v: "1.244" },
        ],
      },
      hilo: { predictions: [] },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.samples).toHaveLength(1);
    expect(Number(result.samples[0].height)).toBeCloseTo(1.244, 9);
  });
});
