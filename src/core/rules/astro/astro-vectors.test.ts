/**
 * The cross-client contract (ADR 003 §4).
 *
 * Every expected value here comes out of `src/core/rules/vectors/astro.json`, whose numbers
 * were taken from the U.S. Naval Observatory and cited in the file. A Swift reimplementation
 * loads the same JSON and must pass the same tolerances. Nothing in this file hard-codes a
 * number that this implementation produced.
 */
import { describe, expect, it } from "vitest";
import vectors from "../vectors/astro.json";
import { degrees, instant } from "@/core/units";
import { daylightSpans, moonPhaseAt, sunEventsFor, type GeoPoint, type SunEvents } from "./index";
import { MEAN_SYNODIC_MONTH_DAYS } from "./moon";

const at = (t: { ms: number }) => instant(t.ms);
const point = (w: { latitude: number; longitude: number }): GeoPoint => ({
  latitude: degrees(w.latitude),
  longitude: degrees(w.longitude),
});

/**
 * The USNO publishes to the whole minute, so its "11:09" means "somewhere in 11:09:00 to
 * 11:09:59". The vector records the start of that minute; a value up to 60 s later is
 * exactly as correct. This measures the distance from the published minute, not from a
 * point inside it.
 */
const secondsOutsidePublishedMinute = (actualMs: number, publishedMinuteStartMs: number) => {
  if (actualMs < publishedMinuteStartMs) return (publishedMinuteStartMs - actualMs) / 1000;
  const end = publishedMinuteStartMs + 60_000;
  return actualMs > end ? (actualMs - end) / 1000 : 0;
};

describe("the vector file itself", () => {
  it("agrees with its own human-readable ISO strings", () => {
    // The `iso` fields are for people; the `ms` fields are what the tests use. If an editor
    // changes one and forgets the other, this catches it before it becomes a silent lie.
    const walk = (node: unknown): void => {
      if (node === null || typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      if (typeof record.ms === "number" && typeof record.iso === "string") {
        expect(Date.parse(record.iso), `${record.iso}`).toBe(record.ms);
      }
      for (const child of Object.values(record)) walk(child);
    };
    walk(vectors);
  });

  it("cites a source for every case", () => {
    const ids = new Set(vectors.sources.map((s) => s.id));
    for (const group of [vectors.sunEvents, vectors.daylightSpans, vectors.moonPhase]) {
      for (const c of group) expect(ids, c.id).toContain(c.source);
    }
  });
});

describe("sunEventsFor, against the U.S. Naval Observatory", () => {
  const tolerance = vectors.tolerances.sunEventSeconds;

  for (const vector of vectors.sunEvents) {
    it(`${vector.id} — ${vector.place}`, () => {
      const actual = sunEventsFor(at(vector.at), point(vector.where));
      const expected = vector.expect as Partial<
        Record<keyof SunEvents, { ms: number; iso: string } | null>
      >;

      for (const key of Object.keys(expected) as (keyof SunEvents)[]) {
        const want = expected[key];
        const got = actual[key];

        if (want === null) {
          // Polar night or midnight sun. A plausible-looking timestamp here would be a lie
          // the UI has no way of detecting, which is why the type allows null at all.
          expect(got, `${vector.id}.${key} should be null`).toBeNull();
          continue;
        }

        expect(got, `${vector.id}.${key} should exist`).not.toBeNull();
        const off = secondsOutsidePublishedMinute(got as number, want!.ms);
        expect(
          off,
          `${vector.id}.${key}: got ${new Date(got as number).toISOString()}, ` +
            `USNO published ${want!.iso} (${off.toFixed(1)}s outside that minute)`,
        ).toBeLessThanOrEqual(tolerance);
      }
    });
  }

  it("orders the day dawn -> sunrise -> noon -> sunset -> dusk wherever all five exist", () => {
    for (const vector of vectors.sunEvents) {
      const e = sunEventsFor(at(vector.at), point(vector.where));
      if (e.civilDawn === null || e.sunrise === null || e.sunset === null || e.civilDusk === null) {
        continue;
      }
      expect(e.civilDawn, vector.id).toBeLessThan(e.sunrise);
      expect(e.sunrise, vector.id).toBeLessThan(e.solarNoon);
      expect(e.solarNoon, vector.id).toBeLessThan(e.sunset);
      expect(e.sunset, vector.id).toBeLessThan(e.civilDusk);
    }
  });
});

describe("daylightSpans, against the U.S. Naval Observatory", () => {
  const tolerance = vectors.tolerances.daylightBoundarySeconds;

  for (const vector of vectors.daylightSpans) {
    it(`${vector.id} — ${vector.place}`, () => {
      const actual = daylightSpans(at(vector.from), at(vector.to), point(vector.where));

      expect(
        actual.map((s) => s.phase),
        `${vector.id}: phase sequence`,
      ).toEqual(vector.expect.map((s) => s.phase));

      actual.forEach((span, i) => {
        const want = vector.expect[i];
        for (const edge of ["from", "to"] as const) {
          const published = want[edge].ms;
          // Range endpoints are exact by contract; interior boundaries are USNO events.
          const isRangeEdge =
            (edge === "from" && i === 0) || (edge === "to" && i === actual.length - 1);
          if (isRangeEdge) {
            expect(span[edge], `${vector.id}[${i}].${edge} is the range edge`).toBe(published);
            continue;
          }
          const off = secondsOutsidePublishedMinute(span[edge], published);
          expect(
            off,
            `${vector.id}[${i}].${edge}: got ${new Date(span[edge]).toISOString()}, ` +
              `USNO published ${want[edge].iso}`,
          ).toBeLessThanOrEqual(tolerance);
        }
      });
    });
  }
});

describe("moonPhaseAt, against the U.S. Naval Observatory", () => {
  for (const vector of vectors.moonPhase) {
    it(`${vector.id}`, () => {
      const phase = moonPhaseAt(at(vector.at));
      const expected = vector.expect as {
        name: string;
        illumination?: number;
        ageDays?: number;
      };

      expect(phase.name, `${vector.id}: name (our eighths convention, not a USNO value)`).toBe(
        expected.name,
      );

      if (expected.illumination !== undefined) {
        expect(
          Math.abs(phase.illumination - expected.illumination),
          `${vector.id}: illumination got ${phase.illumination.toFixed(4)}, ` +
            `expected ${expected.illumination}`,
        ).toBeLessThanOrEqual(vectors.tolerances.illumination);
      }

      if (expected.ageDays !== undefined) {
        // Age is circular: a moment a minute before a new moon is age ~29.5, not age ~-0.001.
        const raw = Math.abs(phase.ageDays - expected.ageDays);
        const circular = Math.min(raw, MEAN_SYNODIC_MONTH_DAYS - raw);
        expect(
          circular,
          `${vector.id}: ageDays got ${phase.ageDays.toFixed(3)}, expected ${expected.ageDays}`,
        ).toBeLessThanOrEqual(vectors.tolerances.moonAgeDays);
      }
    });
  }

  it("keeps illumination in 0..1 and age in a real lunation, sampled hourly for a year", () => {
    const start = Date.UTC(2026, 0, 1);
    for (let hour = 0; hour < 24 * 365; hour++) {
      const p = moonPhaseAt(instant(start + hour * 3_600_000));
      expect(p.illumination).toBeGreaterThanOrEqual(0);
      expect(p.illumination).toBeLessThanOrEqual(1);
      expect(p.ageDays).toBeGreaterThanOrEqual(0);
      // Real lunations run 29.27 to 29.83 days, so the mean synodic month is not a ceiling.
      expect(p.ageDays).toBeLessThan(29.9);
    }
  });
});
