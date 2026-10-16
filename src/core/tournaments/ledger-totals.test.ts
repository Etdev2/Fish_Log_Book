import { describe, expect, it } from "vitest";

import { parseTournamentMoneyTotals } from "./ledger-totals";

const row = {
  currency: "USD", collected_minor: "1000", outstanding_minor: "0",
  paid_orders: "1", unpaid_orders: "0", refunded_orders: "1",
};

describe("ledger totals crossing the JSON boundary", () => {
  it("preserves exact minor units and refund counts", () => {
    expect(parseTournamentMoneyTotals(row)).toEqual({
      currency: "USD", collectedMinor: 1000, outstandingMinor: 0,
      paidOrders: 1, unpaidOrders: 0, refundedOrders: 1,
    });
  });

  it("accepts the maximum exactly representable integer", () => {
    expect(parseTournamentMoneyTotals({ ...row, collected_minor: "9007199254740991" }).collectedMinor)
      .toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each(["9007199254740992", "9007199254740993", "9223372036854775807"])(
    "refuses %s instead of rounding it", (collected_minor) => {
      expect(() => parseTournamentMoneyTotals({ ...row, collected_minor })).toThrow("too large");
    },
  );

  it.each([null, 1, 1.5, "1.5", "-1", "", "NaN"])("refuses invalid integer %s", (collected_minor) => {
    expect(() => parseTournamentMoneyTotals({ ...row, collected_minor })).toThrow("invalid");
  });

  it("accepts a truly empty ledger with no currency", () => {
    expect(parseTournamentMoneyTotals({ ...row, currency: null, collected_minor: "0", paid_orders: "0", refunded_orders: "0" }).currency)
      .toBeNull();
  });
});
