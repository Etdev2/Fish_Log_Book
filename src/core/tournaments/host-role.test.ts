import { describe, expect, it } from "vitest";

import {
  HOST_ROLES,
  hostCapabilities,
  isHost,
  isHostRole,
  visibleLanes,
} from "./host-role";

describe("who counts as a host", () => {
  it("treats no membership as no capabilities at all", () => {
    const none = hostCapabilities(null);
    expect(Object.values(none).every((granted) => granted === false)).toBe(true);
    expect(isHost(null)).toBe(false);
    expect(visibleLanes(none)).toEqual([]);
  });

  it("recognises only the four roles the database allows", () => {
    for (const role of HOST_ROLES) expect(isHostRole(role)).toBe(true);
    // The shapes a role can arrive in from an RPC that returns `unknown`.
    for (const notARole of ["owner", "JUDGE", "", null, undefined, 7, {}, ["OWNER"]]) {
      expect(isHostRole(notARole)).toBe(false);
    }
  });

  it("lets every role onto the host screen, and shows each of them different lanes", () => {
    for (const role of HOST_ROLES) expect(isHost(role)).toBe(true);

    expect(visibleLanes(hostCapabilities("OWNER"))).toEqual([
      "event",
      "roster",
      "judging",
      "money",
      "team",
    ]);
    expect(visibleLanes(hostCapabilities("ADMIN"))).toEqual([
      "event",
      "roster",
      "judging",
      "money",
      "team",
    ]);
    // The dock: the field and the fish, and nothing about money or access.
    expect(visibleLanes(hostCapabilities("STAFF"))).toEqual(["event", "roster", "judging"]);
    // The treasurer: no empty judging queue to wonder about, and no crew phone numbers.
    expect(visibleLanes(hostCapabilities("FINANCE"))).toEqual(["event", "money"]);
  });

  it("never offers a lane the role cannot use", () => {
    // The screen picks its opening lane from the front of this list. If a lane ever
    // appeared without its capability, somebody would land on a tab that renders a
    // permission error the moment its query runs.
    for (const role of HOST_ROLES) {
      const caps = hostCapabilities(role);
      const lanes = visibleLanes(caps);
      if (lanes.includes("money")) expect(caps.readMoney).toBe(true);
      if (lanes.includes("roster")) expect(caps.readRoster).toBe(true);
      if (lanes.includes("judging")) expect(caps.judge).toBe(true);
      if (lanes.includes("team")) expect(caps.manageStaff).toBe(true);
      expect(lanes.length).toBeGreaterThan(0);
    }
  });

  it("keeps approving a payout narrower than running the event", () => {
    // Being the organiser, or the judge, is not enough on its own — the sentence the
    // operations screen has printed since it was written, now enforceable.
    expect(hostCapabilities("STAFF").approvePayout).toBe(false);
    expect(hostCapabilities("STAFF").runEvent).toBe(true);
  });
});
