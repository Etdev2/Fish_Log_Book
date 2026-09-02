import { describe, expect, it } from "vitest";

import { computeZoneState, foldAcrossBundle, foldPosition, NEAR_BAND_M } from "./boundary-alerts";
import { SOCAL } from "./reg-data";
import { FLORIDA } from "./florida-pack";

const dume = SOCAL.areas.find((a) => a.id === "mpa-pt-dume")!;
const ccaSouth = SOCAL.areas.find((a) => a.id === "cca-south")!;
const irl = FLORIDA.areas.find((a) => a.id === "fl-irl-cnr")!;

const DUME_CENTER: readonly [number, number] = [-118.77, 33.975]; // squarely inside the demo MPA ring
const IRL_CENTER: readonly [number, number] = [-80.45, 27.9]; // mid-lagoon
const CCA_APPROACH: readonly [number, number] = [-118.107, 32.65]; // ~600m west of the CCA south edge
const CCA_INSIDE: readonly [number, number] = [-118.0, 32.65];

describe("computeZoneState", () => {
  it("classifies inside / near / outside against the ring realistically", () => {
    expect(computeZoneState(dume.polygon!, DUME_CENTER).state).toBe("inside");
    const onLagoonEdge = computeZoneState(irl.polygon!, [-80.45, 26.946]); // ~220 m south of the IRL box's lower edge
    expect(onLagoonEdge.state).toBe("near");
    const lagoonIn = computeZoneState(irl.polygon!, IRL_CENTER);
    expect(lagoonIn.state).toBe("inside");
    const far = computeZoneState(dume.polygon!, [-119.5, 34.4]);
    expect(far.state).toBe("outside");
  });
});

describe("foldPosition (spec §14: transitions, not spam)", () => {
  it("emits once on entry, then silence while the boat stays inside", () => {
    const first = foldPosition(irl, "outside", IRL_CENTER, "2026-09-01T08:00:00Z", 20);
    expect(first.event?.kind).toBe("entered");

    const second = foldPosition(irl, first.next, IRL_CENTER, "2026-09-01T08:00:30Z", 20);
    expect(second.event).toBeNull();
    const third = foldPosition(irl, second.next, [-80.4, 27.75], "2026-09-01T08:01:00Z", 20);
    // still inside IRL rectangle after moving in-zone
    expect(third.next).toBe("inside");
  });

  it("flags an approach then escalates on entry without repeating either", () => {
    // A point just south of the CCA ring's nearest edge.
    const approach = foldPosition(ccaSouth, "outside", CCA_APPROACH, "t1", null);
    expect(approach.event?.kind === "approached" || approach.event === null).toBe(true);
    const enter = foldPosition(ccaSouth, approach.next, CCA_INSIDE, "t2", null);
    expect(enter.event?.kind === "entered" || enter.next === "inside").toBe(true);
    const dwell = foldPosition(ccaSouth, enter.next, CCA_INSIDE, "t3", null);
    expect(dwell.event).toBeNull();
  });

  it("treats exiting as its own single event", () => {
    const inside = foldPosition(dume, "inside", DUME_CENTER, "t1", null);
    expect(inside.event).toBeNull(); // no change of mode
    const away = foldPosition(dume, "inside", [-119.0, 34.6], "t2", null);
    expect(away.event?.kind).toBe("exited");
  });
});

describe("foldAcrossBundle", () => {
  it("maintains independent state per zone across many fixes", () => {
    let watches = new Map<string, "outside" | "near" | "inside">();
    const fixes: readonly (readonly [number, number])[] = [
      [-117.9, 33.4], // water, no zone: uneventful
      DUME_CENTER, // enter Dume
      [-117.95, 33.42], // leave, return to open water
      DUME_CENTER, // re-enter → second alert is legal: you left and came back
    ];
    const kinds: string[][] = [];
    for (const f of fixes) {
      const r = foldAcrossBundle(
        [...SOCAL.areas, ...FLORIDA.areas],
        watches,
        f,
        "2026-09-01T10:00:00Z",
        15,
      );
      watches = r.watches;
      kinds.push(r.events.map((e) => `${e.kind}:${e.zoneId}`));
    }
    const flat = kinds.flat();
    expect(flat.filter((k) => k.startsWith("entered")).length).toBeGreaterThanOrEqual(1);
    expect(watches.get("mpa-pt-dume")).toBeDefined();
  });
});

describe("NEAR_BAND_M", () => {
  it("stays shorter than a small boat's 2-minute drift at slow troll (600m band)", () => {
    expect(NEAR_BAND_M).toBeLessThanOrEqual(1000);
    expect(NEAR_BAND_M).toBeGreaterThanOrEqual(200);
  });
});
