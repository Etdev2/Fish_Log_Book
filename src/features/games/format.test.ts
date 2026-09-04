import { describe, expect, it } from "vitest";

import { formatElapsed, formatRemaining, formatWhen, pointsLabel } from "./format";

describe("formatElapsed", () => {
  it("drops the hour until there is one", () => {
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(3_723_000)).toBe("1:02:03");
  });
  it("never renders a negative clock", () => {
    expect(formatElapsed(-5_000)).toBe("0:00");
  });
});

describe("formatRemaining", () => {
  it("says the time is up rather than counting past zero", () => {
    expect(formatRemaining(0)).toBe("Time's up");
    expect(formatRemaining(-60_000)).toBe("Time's up");
  });
  it("uses minutes under the hour and hours over it", () => {
    expect(formatRemaining(8 * 60_000)).toBe("8 min left");
    expect(formatRemaining(120 * 60_000)).toBe("2 hr left");
    expect(formatRemaining(95 * 60_000)).toBe("1 hr 35 min left");
  });
});

describe("formatWhen", () => {
  const now = new Date(2026, 8, 4, 12, 0, 0);
  it("speaks in days near the present", () => {
    expect(formatWhen(new Date(2026, 8, 4, 6).toISOString(), now)).toBe("Today");
    expect(formatWhen(new Date(2026, 8, 3, 22).toISOString(), now)).toBe("Yesterday");
    expect(formatWhen(new Date(2026, 8, 1).toISOString(), now)).toBe("3 days ago");
  });
  it("crosses midnight by calendar day, not by elapsed hours", () => {
    // 14 hours earlier, but a different day — an angler calls that yesterday.
    expect(formatWhen(new Date(2026, 8, 3, 22).toISOString(), new Date(2026, 8, 4, 12))).toBe("Yesterday");
  });
});

describe("pointsLabel", () => {
  it("gets the singular right", () => {
    expect(pointsLabel(1)).toBe("+1 pt");
    expect(pointsLabel(5)).toBe("+5 pts");
    expect(pointsLabel(-1)).toBe("-1 pt");
  });
});
