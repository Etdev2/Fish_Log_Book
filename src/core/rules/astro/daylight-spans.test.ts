/**
 * The `daylightSpans` contract.
 *
 * The chart paints straight from this list and does no date arithmetic of its own, so the
 * *shape* of the output matters more than any individual boundary time. A boundary that is
 * thirty seconds out is invisible. A one-millisecond gap between two spans is a white line
 * down the middle of the chart, and an overlap is a colour that depends on paint order.
 *
 * Boundary values are checked against the U.S. Naval Observatory in `astro-vectors.test.ts`.
 * This file checks the properties that must hold for every input.
 */
import { describe, expect, it } from "vitest";
import { degrees, instant, type Instant } from "@/core/units";
import { daylightSpans, sunEventsFor, type DaylightSpan, type GeoPoint } from "./index";

const at = (iso: string): Instant => instant(Date.parse(iso));
const where = (latitude: number, longitude: number): GeoPoint => ({
  latitude: degrees(latitude),
  longitude: degrees(longitude),
});

const NEWPORT = where(41.5043, -71.3261); // the station this app ships a tide fixture for
const QUITO = where(-0.1807, -78.4678); // fastest twilight on Earth
const TROMSO = where(69.6496, 18.956); // polar night with a twilight window
const SVALBARD = where(78.2232, 15.6469); // polar night with no twilight at all
const HOBART = where(-42.8821, 147.3272); // southern hemisphere, southern DST
const SINGAPORE = where(1.3521, 103.8198); // no seasons to speak of

const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * The whole contract in one assertion, so every case below gets all of it.
 */
function expectValidCover(spans: readonly DaylightSpan[], from: Instant, to: Instant, label: string) {
  expect(spans.length, `${label}: must not be empty for a non-empty range`).toBeGreaterThan(0);
  expect(spans[0].from, `${label}: first span starts at 'from'`).toBe(from);
  expect(spans[spans.length - 1].to, `${label}: last span ends at 'to'`).toBe(to);

  spans.forEach((span, i) => {
    expect(span.to, `${label}: span ${i} has from < to`).toBeGreaterThan(span.from);
    expect(span.from, `${label}: span ${i} starts inside the range`).toBeGreaterThanOrEqual(from);
    expect(span.to, `${label}: span ${i} ends inside the range`).toBeLessThanOrEqual(to);
    if (i === 0) return;
    // Contiguous AND non-overlapping in one check: exact equality, not "close enough".
    expect(spans[i - 1].to, `${label}: no gap or overlap between spans ${i - 1} and ${i}`).toBe(
      span.from,
    );
    expect(spans[i - 1].phase, `${label}: spans ${i - 1} and ${i} must not share a phase`).not.toBe(
      span.phase,
    );
  });

  const covered = spans.reduce((sum, s) => sum + (s.to - s.from), 0);
  expect(covered, `${label}: spans sum to the whole range`).toBe(to - from);
}

describe("the cover is always sorted, contiguous, gap-free and complete", () => {
  const cases: [string, GeoPoint, string, string][] = [
    ["Newport, one day in summer", NEWPORT, "2026-06-21T04:00:00Z", "2026-06-22T04:00:00Z"],
    ["Newport, one day in winter", NEWPORT, "2026-12-21T05:00:00Z", "2026-12-22T05:00:00Z"],
    ["Newport, ten days", NEWPORT, "2026-08-25T00:00:00Z", "2026-09-04T00:00:00Z"],
    ["Newport, an autumn month", NEWPORT, "2026-09-15T00:00:00Z", "2026-10-15T00:00:00Z"],
    ["Quito, equinox", QUITO, "2026-03-20T05:00:00Z", "2026-03-21T05:00:00Z"],
    ["Singapore, three days", SINGAPORE, "2026-08-29T00:00:00Z", "2026-09-01T00:00:00Z"],
    ["Hobart, three days", HOBART, "2026-07-01T00:00:00Z", "2026-07-04T00:00:00Z"],
    ["Tromso, polar night", TROMSO, "2026-01-01T00:00:00Z", "2026-01-04T00:00:00Z"],
    ["Tromso, midnight sun", TROMSO, "2026-06-20T00:00:00Z", "2026-06-25T00:00:00Z"],
    ["Tromso, the week the sun returns", TROMSO, "2026-01-13T00:00:00Z", "2026-01-20T00:00:00Z"],
    ["Svalbard, deep polar night", SVALBARD, "2026-01-01T00:00:00Z", "2026-01-05T00:00:00Z"],
    ["Svalbard, midnight sun", SVALBARD, "2026-06-01T00:00:00Z", "2026-06-05T00:00:00Z"],
    ["the north pole", where(90, 0), "2026-03-18T00:00:00Z", "2026-03-25T00:00:00Z"],
    ["the south pole", where(-90, 0), "2026-09-20T00:00:00Z", "2026-09-27T00:00:00Z"],
    ["the date line", where(0, 180), "2026-05-05T00:00:00Z", "2026-05-08T00:00:00Z"],
  ];

  for (const [label, place, from, to] of cases) {
    it(label, () => {
      const f = at(from);
      const t = at(to);
      expectValidCover(daylightSpans(f, t, place), f, t, label);
    });
  }

  it("holds for a year of Newport, one day at a time", () => {
    for (let day = 0; day < 365; day++) {
      const f = instant(Date.UTC(2026, 0, 1) + day * DAY);
      const t = instant((f as number) + DAY);
      expectValidCover(daylightSpans(f, t, NEWPORT), f, t, `Newport day ${day}`);
    }
  });

  it("holds for a year of Tromso, one day at a time — including the days the sun returns", () => {
    for (let day = 0; day < 365; day++) {
      const f = instant(Date.UTC(2026, 0, 1) + day * DAY);
      const t = instant((f as number) + DAY);
      expectValidCover(daylightSpans(f, t, TROMSO), f, t, `Tromso day ${day}`);
    }
  });

  it("holds when the range starts and ends at awkward moments", () => {
    // Ranges deliberately aligned to real events, where an off-by-one produces a zero-length
    // span or a duplicated boundary.
    const events = sunEventsFor(at("2026-06-21T16:00:00Z"), NEWPORT);
    const anchors = [events.civilDawn!, events.sunrise!, events.solarNoon, events.sunset!];
    for (const anchor of anchors) {
      for (const lengthMs of [1, 1_000, 60_000, 6 * HOUR, 2 * DAY]) {
        const f = instant(anchor as number);
        const t = instant((anchor as number) + lengthMs);
        expectValidCover(daylightSpans(f, t, NEWPORT), f, t, `from an event, +${lengthMs}ms`);
      }
      for (const lengthMs of [1, 1_000, 60_000, 6 * HOUR]) {
        const f = instant((anchor as number) - lengthMs);
        const t = instant(anchor as number);
        expectValidCover(daylightSpans(f, t, NEWPORT), f, t, `to an event, -${lengthMs}ms`);
      }
    }
  });
});

describe("empty and reversed ranges", () => {
  it("returns nothing for a zero-length range", () => {
    const t = at("2026-06-21T16:00:00Z");
    expect(daylightSpans(t, t, NEWPORT)).toEqual([]);
  });

  it("returns nothing for a reversed range rather than throwing or inverting it", () => {
    expect(daylightSpans(at("2026-06-22T00:00:00Z"), at("2026-06-21T00:00:00Z"), NEWPORT)).toEqual(
      [],
    );
  });

  it("returns exactly one span for a one-millisecond range", () => {
    const f = at("2026-06-21T16:00:00Z");
    const t = instant((f as number) + 1);
    const spans = daylightSpans(f, t, NEWPORT);
    expect(spans).toHaveLength(1);
    expect(spans[0].phase).toBe("day");
    expectValidCover(spans, f, t, "one millisecond");
  });
});

describe("across a daylight saving change", () => {
  /*
   * There is no clock in this engine to spring forward — everything is UTC
   * epoch-milliseconds (ADR 006 §3) — so the honest test is that a DST weekend is utterly
   * unremarkable: no repeated hour, no missing hour, no duplicated span, and sunrise moving
   * by its usual couple of minutes a day in UTC while the local clock does something
   * dramatic. That last part is `format.ts`'s problem, not ours.
   */
  it("US spring forward: 2026-03-08, 02:00 EST becomes 03:00 EDT", () => {
    const f = at("2026-03-07T00:00:00Z");
    const t = at("2026-03-10T00:00:00Z");
    const spans = daylightSpans(f, t, NEWPORT);
    expectValidCover(spans, f, t, "US spring forward");
    expect(spans.filter((s) => s.phase === "day")).toHaveLength(3);
  });

  it("US fall back: 2026-11-01, 02:00 EDT becomes 01:00 EST", () => {
    const f = at("2026-10-31T00:00:00Z");
    const t = at("2026-11-03T00:00:00Z");
    const spans = daylightSpans(f, t, NEWPORT);
    expectValidCover(spans, f, t, "US fall back");
    expect(spans.filter((s) => s.phase === "day")).toHaveLength(3);
  });

  it("southern hemisphere DST: Hobart, 2026-04-05", () => {
    // 147 degrees east, so local midnight is around 14:00 the previous day in UTC. The range
    // is anchored to local night, not to a UTC date, or the count of daylight spans would
    // include two partial days.
    const f = at("2026-04-03T15:00:00Z");
    const t = at("2026-04-06T15:00:00Z");
    const spans = daylightSpans(f, t, HOBART);
    expectValidCover(spans, f, t, "Hobart DST end");
    expect(spans.filter((s) => s.phase === "day")).toHaveLength(3);
  });

  it("UTC sunrise moves smoothly across the change, by minutes and not by an hour", () => {
    const sunrises = ["2026-03-06", "2026-03-07", "2026-03-08", "2026-03-09", "2026-03-10"].map(
      (d) => sunEventsFor(at(`${d}T17:00:00Z`), NEWPORT).sunrise as number,
    );
    for (let i = 1; i < sunrises.length; i++) {
      const stepMinutes = (sunrises[i] - sunrises[i - 1] - DAY) / 60_000;
      expect(Math.abs(stepMinutes), `day ${i}`).toBeLessThan(3);
    }
  });
});

describe("polar degeneracy", () => {
  it("covers a midnight-sun range with a single unbroken day", () => {
    const f = at("2026-06-21T00:00:00Z");
    const t = at("2026-06-24T00:00:00Z");
    const spans = daylightSpans(f, t, TROMSO);
    expect(spans).toEqual([{ from: f, to: t, phase: "day" }]);
  });

  it("covers a deep polar-night range with a single unbroken night", () => {
    const f = at("2026-01-01T00:00:00Z");
    const t = at("2026-01-04T00:00:00Z");
    const spans = daylightSpans(f, t, SVALBARD);
    expect(spans).toEqual([{ from: f, to: t, phase: "night" }]);
  });

  it("still finds the twilight window inside a polar night that has one", () => {
    const f = at("2026-01-01T00:00:00Z");
    const t = at("2026-01-02T00:00:00Z");
    const spans = daylightSpans(f, t, TROMSO);
    expect(spans.map((s) => s.phase)).toEqual(["night", "civil-twilight", "night"]);
  });
});

describe("the spans agree with the events", () => {
  it("day begins at sunrise and ends at sunset, to the second", () => {
    const events = sunEventsFor(at("2026-06-21T16:00:00Z"), NEWPORT);
    const spans = daylightSpans(at("2026-06-21T04:00:00Z"), at("2026-06-22T04:00:00Z"), NEWPORT);
    const day = spans.find((s) => s.phase === "day");
    expect(day).toBeDefined();
    expect(Math.abs(day!.from - (events.sunrise as number))).toBeLessThan(2_000);
    expect(Math.abs(day!.to - (events.sunset as number))).toBeLessThan(2_000);
  });

  it("splitting a range in two and concatenating gives the same cover", () => {
    const f = at("2026-08-29T00:00:00Z");
    const mid = at("2026-08-30T13:37:00Z");
    const t = at("2026-09-01T00:00:00Z");

    const whole = daylightSpans(f, t, NEWPORT);
    const halves = [...daylightSpans(f, mid, NEWPORT), ...daylightSpans(mid, t, NEWPORT)];

    // The seam splits whichever span contains `mid`, so merge equal-phase neighbours first.
    const merged: DaylightSpan[] = [];
    for (const span of halves) {
      const last = merged[merged.length - 1];
      if (last && last.phase === span.phase) merged[merged.length - 1] = { ...last, to: span.to };
      else merged.push(span);
    }
    expect(merged).toEqual(whole);
  });

  it("gives about twelve hours of daylight at the equator, whatever the date", () => {
    for (const date of ["2026-01-15", "2026-03-20", "2026-06-21", "2026-09-23", "2026-12-21"]) {
      const f = at(`${date}T05:15:00Z`);
      const t = instant((f as number) + DAY);
      const spans = daylightSpans(f, t, QUITO);
      const daylight = spans
        .filter((s) => s.phase === "day")
        .reduce((sum, s) => sum + (s.to - s.from), 0);
      expect(Math.abs(daylight / HOUR - 12.1), date).toBeLessThan(0.2);
    }
  });
});
