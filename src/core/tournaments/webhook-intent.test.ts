import { describe, expect, it } from "vitest";

import { stripeEventFacts, webhookIntent } from "./webhook-intent";

const TEST_ENV = { expectLivemode: false };

function facts(over: Partial<Parameters<typeof webhookIntent>[0]> = {}) {
  return {
    id: "evt_1",
    type: "payment_intent.succeeded",
    livemode: false,
    objectId: "pi_1",
    amountMinor: 75000,
    currency: "usd",
    orderId: "11111111-1111-1111-1111-111111111111",
    ...over,
  };
}

describe("webhookIntent", () => {
  it("confirms a succeeded payment that names its order", () => {
    expect(webhookIntent(facts(), TEST_ENV)).toEqual({
      kind: "confirm",
      orderId: "11111111-1111-1111-1111-111111111111",
      paymentId: "pi_1",
      amountMinor: 75000,
      currency: "usd",
    });
  });

  it("acknowledges events it does not act on, so Stripe stops retrying", () => {
    // A 500 on an event we simply do not handle makes Stripe retry it for days.
    expect(webhookIntent(facts({ type: "customer.created" }), TEST_ENV).kind).toBe("ignore");
    expect(webhookIntent(facts({ type: "payment_intent.created" }), TEST_ENV).kind).toBe("ignore");
  });

  it("refuses a live payment at a test endpoint, rather than dropping it", () => {
    // This is a wiring mistake somebody must fix. A silent 200 would let a real payment be
    // swallowed by a staging deployment.
    const intent = webhookIntent(facts({ livemode: true }), TEST_ENV);
    expect(intent.kind).toBe("reject");
    expect(intent.kind === "reject" && intent.reason).toMatch(/live payment/);
  });

  it("refuses a test payment at a live endpoint", () => {
    expect(webhookIntent(facts({ livemode: false }), { expectLivemode: true }).kind).toBe("reject");
  });

  it("refuses a succeeded payment with no order on it — that is unattributed money", () => {
    const intent = webhookIntent(facts({ orderId: undefined }), TEST_ENV);
    expect(intent.kind).toBe("reject");
  });

  it("refuses a succeeded payment with no amount, rather than confirming for zero", () => {
    for (const amountMinor of [undefined, Number.NaN, -1]) {
      expect(webhookIntent(facts({ amountMinor }), TEST_ENV).kind).toBe("reject");
    }
  });

  it("refuses a succeeded payment with no payment id — it could not be made idempotent", () => {
    expect(webhookIntent(facts({ objectId: undefined }), TEST_ENV).kind).toBe("reject");
  });

  it("refuses a succeeded payment with no currency", () => {
    // 75000 minor units is $750 and also far less in several other currencies. Comparing
    // the amount without the currency is how a cheap payment buys a dollar entry.
    expect(webhookIntent(facts({ currency: undefined }), TEST_ENV).kind).toBe("reject");
  });
});

describe("stripeEventFacts", () => {
  it("reads a payment intent the way Stripe sends one", () => {
    const parsed = stripeEventFacts({
      id: "evt_9",
      type: "payment_intent.succeeded",
      livemode: false,
      data: {
        object: {
          id: "pi_9",
          amount: 80000,
          amount_received: 75000,
          currency: "usd",
          metadata: { tournament_order_id: "order-9" },
        },
      },
    });
    // The captured amount, not the requested one: those differ on a partial capture, and
    // only what was actually taken may activate a registration.
    expect(parsed?.amountMinor).toBe(75000);
    expect(parsed?.orderId).toBe("order-9");
    expect(parsed?.objectId).toBe("pi_9");
  });

  it("falls back to `amount` when nothing was captured separately", () => {
    const parsed = stripeEventFacts({
      id: "evt_10",
      type: "charge.succeeded",
      data: { object: { id: "ch_10", amount: 25000, metadata: { tournament_order_id: "o" } } },
    });
    expect(parsed?.amountMinor).toBe(25000);
  });

  it("survives a shape it has never seen without throwing", () => {
    expect(stripeEventFacts({ id: "evt", type: "x" })?.orderId).toBeUndefined();
    expect(stripeEventFacts({ id: "evt", type: "x", data: {} })?.amountMinor).toBeUndefined();
    expect(stripeEventFacts(null)).toBeNull();
    expect(stripeEventFacts("nope")).toBeNull();
    expect(stripeEventFacts({ type: "x" })).toBeNull();
  });

  it("treats a missing livemode as not live", () => {
    expect(stripeEventFacts({ id: "e", type: "t" })?.livemode).toBe(false);
  });
});
