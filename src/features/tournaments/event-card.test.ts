import { describe, expect, it } from "vitest";

import {
  closesInLabel,
  entryFeeLabel,
  eventsByDay,
  formatMoney,
  matchesFilter,
  registrationState,
  sortForReading,
  type TournamentEvent,
} from "./event-card";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.parse("2026-09-07T12:00:00Z");

function event(overrides: Partial<TournamentEvent> = {}): TournamentEvent {
  return {
    id: "t1",
    name: "Test Open",
    status: "REGISTRATION_OPEN",
    visibility: "PUBLIC",
    starts_at: new Date(NOW + 7 * DAY).toISOString(),
    ends_at: new Date(NOW + 7 * DAY + 8 * HOUR).toISOString(),
    location_name: "Dana Point Harbor",
    registration_closes_at: new Date(NOW + 3 * DAY).toISOString(),
    entry_fee_minor: 25000,
    prize_pool_minor: 480000,
    currency: "USD",
    refund_policy: "Full refund up to 48 hours before the start.",
    entrant_count: 19,
    entered: false,
    hosting: false,
    ...overrides,
  };
}

describe("registrationState", () => {
  it("counts down while entries are open", () => {
    const state = registrationState(event(), NOW);
    expect(state.kind).toBe("open");
    if (state.kind !== "open") throw new Error("unreachable");
    expect(state.closesInMs).toBe(3 * DAY);
    expect(state.urgent).toBe(false);
  });

  it("flags the last day as urgent — it changes what you do with your evening", () => {
    const state = registrationState(
      event({ registration_closes_at: new Date(NOW + 5 * HOUR).toISOString() }),
      NOW,
    );
    expect(state.kind === "open" && state.urgent).toBe(true);
  });

  it("closes on the deadline passing, even while the status still says open", () => {
    // The status column is changed by a host or a job, not by the clock. The screen must
    // not invite an entry the deadline has already refused.
    expect(
      registrationState(event({ registration_closes_at: new Date(NOW - 1).toISOString() }), NOW).kind,
    ).toBe("closed");
  });

  it("distinguishes a draft that has not opened from an event that has closed", () => {
    expect(registrationState(event({ status: "DRAFT" }), NOW).kind).toBe("not-open");
    expect(registrationState(event({ status: "LIVE" }), NOW).kind).toBe("closed");
  });

  it("treats a missing or unreadable deadline as open, never as locked out", () => {
    expect(registrationState(event({ registration_closes_at: null }), NOW).kind).toBe("open-no-deadline");
    expect(registrationState(event({ registration_closes_at: "not a date" }), NOW).kind).toBe(
      "open-no-deadline",
    );
  });
});

describe("money", () => {
  it("drops the cents when there are none", () => {
    expect(formatMoney(25000, "USD")).toBe("$250");
    expect(formatMoney(25050, "USD")).toBe("$250.50");
  });

  it("says Free rather than $0 — it is the reason somebody enters", () => {
    expect(entryFeeLabel(event({ entry_fee_minor: 0 }))).toBe("Free to enter");
  });

  it("says nothing at all when the host has not priced it", () => {
    // Null is "not priced yet", which is not the same as free, and guessing either way
    // misinforms somebody about money.
    expect(entryFeeLabel(event({ entry_fee_minor: null }))).toBeNull();
    expect(formatMoney(null, "USD")).toBeNull();
  });

  it("still shows the number when the currency code is unknown", () => {
    // Intl accepts any well-formed three-letter code and prefixes it, which is fine.
    expect(formatMoney(480000, "XYZ")).toContain("4,800");
    expect(formatMoney(480000, "XYZ")).toContain("XYZ");
  });

  it("falls back rather than throwing on a malformed currency code", () => {
    // Intl DOES throw on a code that is not three letters, and a bad row in the database
    // must not take the whole events list down with it.
    expect(formatMoney(480000, "US")).toBe("4800 US");
  });
});

describe("closesInLabel", () => {
  it("reads in the unit a deadline is actually measured in", () => {
    expect(closesInLabel(3 * DAY)).toBe("closes in 3 days");
    expect(closesInLabel(1 * DAY)).toBe("closes in 1 day");
    expect(closesInLabel(5 * HOUR)).toBe("closes in 5 hours");
    expect(closesInLabel(90 * 1000)).toBe("closes in 1 min");
    expect(closesInLabel(10 * 1000)).toBe("closes in under a minute");
  });
});

describe("eventsByDay", () => {
  it("buckets events onto their local start day", () => {
    const a = event({ id: "a", starts_at: "2026-09-10T15:00:00Z" });
    const b = event({ id: "b", starts_at: "2026-09-10T23:00:00Z" });
    const byDay = eventsByDay([a, b], "UTC");
    expect(byDay.get("2026-09-10")?.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("puts an unscheduled event on no day rather than inventing one", () => {
    // A draft with no date belongs in the list, not on today's cell.
    expect(eventsByDay([event({ starts_at: null })], "UTC").size).toBe(0);
    expect(eventsByDay([event({ starts_at: "garbage" })], "UTC").size).toBe(0);
  });

  it("uses the viewer's zone, so a late event does not slide a day", () => {
    const late = event({ starts_at: "2026-09-11T04:00:00Z" });
    expect([...eventsByDay([late], "UTC").keys()]).toEqual(["2026-09-11"]);
    expect([...eventsByDay([late], "America/Los_Angeles").keys()]).toEqual(["2026-09-10"]);
  });
});

describe("filters", () => {
  it("'open' keeps anything you could still enter", () => {
    expect(matchesFilter(event(), "open", NOW)).toBe(true);
    expect(matchesFilter(event({ status: "FINAL" }), "open", NOW)).toBe(false);
    expect(matchesFilter(event({ status: "DRAFT" }), "open", NOW)).toBe(false);
  });

  it("'mine' keeps what you are in and what you run", () => {
    expect(matchesFilter(event(), "mine", NOW)).toBe(false);
    expect(matchesFilter(event({ entered: true }), "mine", NOW)).toBe(true);
    expect(matchesFilter(event({ hosting: true }), "mine", NOW)).toBe(true);
  });
});

describe("sortForReading", () => {
  it("puts what is being fished now above what is coming, and finished last", () => {
    const order = sortForReading([
      event({ id: "done", status: "FINAL", starts_at: new Date(NOW - 9 * DAY).toISOString() }),
      event({ id: "soon", status: "REGISTRATION_OPEN", starts_at: new Date(NOW + 2 * DAY).toISOString() }),
      event({ id: "now", status: "LIVE", starts_at: new Date(NOW - 3 * HOUR).toISOString() }),
      event({ id: "later", status: "REGISTRATION_OPEN", starts_at: new Date(NOW + 20 * DAY).toISOString() }),
    ]).map((e) => e.id);
    expect(order).toEqual(["now", "soon", "later", "done"]);
  });

  it("reads finished events newest first — last weekend beats last June", () => {
    const order = sortForReading([
      event({ id: "june", status: "FINAL", starts_at: new Date(NOW - 90 * DAY).toISOString() }),
      event({ id: "saturday", status: "FINAL", starts_at: new Date(NOW - 2 * DAY).toISOString() }),
    ]).map((e) => e.id);
    expect(order).toEqual(["saturday", "june"]);
  });

  it("sinks undated events instead of sorting them as 1970", () => {
    const order = sortForReading([
      event({ id: "undated", status: "REGISTRATION_OPEN", starts_at: null }),
      event({ id: "dated", status: "REGISTRATION_OPEN" }),
    ]).map((e) => e.id);
    expect(order).toEqual(["dated", "undated"]);
  });
});
