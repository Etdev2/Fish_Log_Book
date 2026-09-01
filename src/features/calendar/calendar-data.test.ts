import { describe, expect, it } from "vitest";

import {
  ariaForKey,
  currentMonthCursor,
  localDateKey,
  monthCells,
  monthCursorOfDayKey,
  monthLabel,
  parseDayParam,
  shiftMonth,
  summarizeDays,
} from "./calendar-data";

const catchRow = (iso: string, unresolved = false) => ({
  caught_at: iso,
  deleted_at: null as string | null,
  species_id: unresolved ? null : "yellowtail",
  species_other: null as string | null,
});

describe("month cells", () => {
  it("renders full weeks only — a wholly out-of-month row is trimmed", () => {
    const cells = monthCells({ year: 2026, month: 8 }, "America/Los_Angeles", 0); // September 2026
    expect(cells).toHaveLength(35);
    expect(cells[0].dayOfMonth).toBe(31); // Monday August 31
    expect(cells[0].inCurrentMonth).toBe(false);
    expect(cells[cells.length - 1].key).toBe("2026-10-04");
    expect(cells.filter((c) => c.inCurrentMonth)).toHaveLength(30);
    expect(cells.find((c) => c.key === "2026-09-01")?.inCurrentMonth).toBe(true);
  });

  it("handles February without a leap-year slip", () => {
    const cells = monthCells({ year: 2025, month: 1 }, "America/Los_Angeles", 0);
    expect(cells.filter((c) => c.inCurrentMonth)).toHaveLength(28);
    expect(cells[0].key).toBe("2025-01-27");
  });

  it("survives a DST month inside the grid (March 2026 PDT, the 6-row month)", () => {
    const cells = monthCells({ year: 2026, month: 2 }, "America/Los_Angeles", 0);
    expect(cells).toHaveLength(42);
    expect(cells.filter((c) => c.inCurrentMonth)).toHaveLength(31);
    expect(cells.find((c) => c.key === "2026-03-15")).toBeTruthy();
  });
});

describe("local date keys", () => {
  it("assigns a catch to the VIEWER's day, not UTC's", () => {
    // 05:30 UTC is 22:30 the previous day in PDT — the catch is a "Tuesday" catch here.
    const at = Date.parse("2026-09-02T05:30:00.000Z");
    expect(localDateKey(at, "UTC")).toBe("2026-09-02");
    expect(localDateKey(at, "America/Los_Angeles")).toBe("2026-09-01");
  });
});

describe("day summaries", () => {
  it("counts resolved catches and unresolved marks separately; deleted rows never count", () => {
    const zone = "America/Los_Angeles";
    const map = summarizeDays(
      [
        catchRow("2026-09-01T15:00:00Z"),
        catchRow("2026-09-01T16:00:00Z"),
        catchRow("2026-09-01T17:00:00Z", true),
        { ...catchRow("2026-09-01T18:00:00Z"), deleted_at: "2026-09-01T19:00:00Z" },
        catchRow("2026-09-03T15:00:00Z"),
      ],
      zone,
    );
    expect(map.get("2026-09-01")).toEqual({ catches: 2, needsDetails: 1 });
    expect(map.get("2026-09-03")).toEqual({ catches: 1, needsDetails: 0 });
    expect(map.size).toBe(2);
  });

  it("a catch with an unparseable clock is not a day on the grid", () => {
    const map = summarizeDays([{ ...catchRow("not-a-date") }], "UTC");
    expect(map.size).toBe(0);
  });
});

describe("day params and labels", () => {
  it("accepts real days and rejects everything else", () => {
    expect(parseDayParam("2026-09-14")).toBe("2026-09-14");
    expect(parseDayParam("2026-02-29")).toBeNull();
    expect(parseDayParam("2024-02-29")).toBe("2024-02-29");
    expect(parseDayParam("09-14-2026")).toBeNull();
    expect(parseDayParam("2026-9-4")).toBeNull();
    expect(parseDayParam("../../etc/passwd")).toBeNull();
  });

  it("labels a day honestly, including empty", () => {
    expect(ariaForKey("2026-09-14", { catches: 2, needsDetails: 1 })).toContain("2 catches, 1 needs details");
    expect(ariaForKey("2026-09-14", undefined)).toContain("no fishing logged");
  });

  it("month cursors shift correctly across years", () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(monthCursorOfDayKey("2026-09-14")).toEqual({ year: 2026, month: 8 });
    expect(monthLabel({ year: 2026, month: 8 })).toContain("September 2026");
    expect(currentMonthCursor("America/Los_Angeles", Date.parse("2026-09-01T20:00:00Z"))).toEqual({
      year: 2026,
      month: 8,
    });
  });
});
