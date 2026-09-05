import { describe, expect, it } from "vitest";

import {
  PUBLIC_CATCH_FIELDS,
  PUBLIC_ENTRY_FIELDS,
  PUBLIC_LEADERBOARD_FIELDS,
  PUBLIC_TOURNAMENT_FIELDS,
  containsPrivateField,
} from "./public-projection";

describe("public tournament projections", () => {
  it("keeps private fields out of every public allowlist", () => {
    for (const fields of [
      PUBLIC_TOURNAMENT_FIELDS,
      PUBLIC_ENTRY_FIELDS,
      PUBLIC_CATCH_FIELDS,
      PUBLIC_LEADERBOARD_FIELDS,
    ]) {
      expect(containsPrivateField(fields)).toBe(false);
    }
  });

  it("detects raw location and integrity fields if somebody adds them later", () => {
    expect(containsPrivateField(["id", "lat"])).toBe(true);
    expect(containsPrivateField(["id", "gps_accuracy_m"])).toBe(true);
    expect(containsPrivateField(["id", "fair_play_signal"])).toBe(true);
    expect(containsPrivateField(["id", "wallet_address"])).toBe(true);
  });

  it("allows only approved/final catch-safe field names", () => {
    expect(PUBLIC_CATCH_FIELDS).toContain("weight_g");
    expect(PUBLIC_CATCH_FIELDS).toContain("length_mm");
    expect(PUBLIC_CATCH_FIELDS).not.toContain("latitude" as never);
    expect(PUBLIC_CATCH_FIELDS).not.toContain("device_metadata" as never);
  });
});
