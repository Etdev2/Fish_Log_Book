import { describe, expect, it } from "vitest";

import { computeOrderTotal, paymentCanActivateRegistration } from "./payments";

describe("payment domain", () => {
  it("totals mixed order items without coupling item type to provider", () => {
    expect(computeOrderTotal([
      { itemType: "TOURNAMENT_ENTRY", quantity: 1, unitAmountMinor: 5000 },
      { itemType: "SIDE_POT", quantity: 2, unitAmountMinor: 1000 },
      { itemType: "MERCHANDISE", quantity: 1, unitAmountMinor: 2500 },
    ])).toBe(9500);
  });

  it("rejects invalid money inputs", () => {
    expect(() => computeOrderTotal([{ itemType: "CUSTOM", quantity: 0, unitAmountMinor: 100 }])).toThrow();
    expect(() => computeOrderTotal([{ itemType: "CUSTOM", quantity: 1, unitAmountMinor: -1 }])).toThrow();
  });

  it("only treats confirmed payment as registration-activating", () => {
    expect(paymentCanActivateRegistration("CONFIRMED")).toBe(true);
    for (const status of ["PENDING", "REQUIRES_ACTION", "AUTHORIZED", "FAILED", "CANCELLED", "PARTIALLY_REFUNDED", "REFUNDED"] as const) {
      expect(paymentCanActivateRegistration(status)).toBe(false);
    }
  });
});
