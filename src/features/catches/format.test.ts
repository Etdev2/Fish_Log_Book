import { describe, expect, it } from "vitest";

import { formatClock } from "./format";

/**
 * Founder report, 2026-09-04: every catch WITH a GPS fix opened to a blank page.
 *
 * The cause was one bad argument. `formatClock` fed its zone straight to Intl, a caller
 * passed the literal "local", and Intl threw a RangeError mid-render — which took the
 * whole record down. Only GPS catches were affected because only they carry the sun times
 * that reached that call, which is exactly why it survived testing.
 */
const AT = "2026-09-04T20:30:00.000Z";

describe("formatClock", () => {
  it("does not throw on a zone that is not a real IANA name", () => {
    expect(() => formatClock(AT, "local")).not.toThrow();
    expect(formatClock(AT, "local")).toMatch(/\d/);
  });

  it("still honours a real zone", () => {
    expect(formatClock(AT, "America/Los_Angeles")).toBe(
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      }).format(new Date(AT)),
    );
  });

  it("reads differently in two real zones, so the fallback is not silently swallowing them", () => {
    expect(formatClock(AT, "America/Los_Angeles")).not.toBe(formatClock(AT, "Pacific/Auckland"));
  });

  it("survives an empty or nonsense zone rather than blanking the page", () => {
    for (const zone of ["", "nowhere", "GMT+25", "Local"]) {
      expect(() => formatClock(AT, zone)).not.toThrow();
    }
  });
});
