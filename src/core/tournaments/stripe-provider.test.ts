import { describe, expect, it, vi } from "vitest";

import { StripePaymentProvider, verifyStripeWebhook, type StripeClientPort } from "./stripe-provider";

function client(): StripeClientPort {
  return {
    createPaymentIntent: vi.fn(async (input) => ({ id: "pi_1", status: "succeeded", amount: input.amount, currency: input.currency })),
    retrievePaymentIntent: vi.fn(async () => ({ id: "pi_1", status: "succeeded", amount: 5000, currency: "usd" })),
    createRefund: vi.fn(async (input) => ({ id: "re_1", amount: input.amount, status: "succeeded" })),
  };
}

describe("StripePaymentProvider", () => {
  it("passes the order id and idempotency key to the provider port", async () => {
    const port = client();
    const provider = new StripePaymentProvider(port);
    const result = await provider.createPayment({ orderId: "o1", amountMinor: 5000, currency: "USD", idempotencyKey: "idem-1" });
    expect(result.status).toBe("CONFIRMED");
    expect(port.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
      amount: 5000,
      currency: "usd",
      idempotencyKey: "idem-1",
      metadata: expect.objectContaining({ order_id: "o1" }),
    }));
  });

  it("maps Stripe requires_action without calling it confirmed", async () => {
    const port = client();
    port.createPaymentIntent = vi.fn(async () => ({ id: "pi_2", status: "requires_action", amount: 5000, currency: "usd", client_secret: "secret" }));
    const result = await new StripePaymentProvider(port).createPayment({ orderId: "o1", amountMinor: 5000, currency: "USD", idempotencyKey: "idem-2" });
    expect(result.status).toBe("REQUIRES_ACTION");
  });

  it("maps successful refunds", async () => {
    const result = await new StripePaymentProvider(client()).refund({ providerPaymentId: "pi_1", amountMinor: 1000, idempotencyKey: "refund-1" });
    expect(result).toEqual({ providerRefundId: "re_1", status: "CONFIRMED", amountMinor: 1000 });
  });
});

describe("Stripe webhook verification", () => {
  it("requires a signature before parsing an event", () => {
    expect(() => verifyStripeWebhook({ verify: vi.fn() }, "{}", null)).toThrow("missing Stripe signature");
  });

  it("delegates cryptographic verification to the server verifier", () => {
    const verifier = { verify: vi.fn(() => ({ id: "evt_1", type: "payment_intent.succeeded", livemode: false, objectId: "pi_1" })) };
    expect(verifyStripeWebhook(verifier, "raw", "sig").id).toBe("evt_1");
    expect(verifier.verify).toHaveBeenCalledWith("raw", "sig");
  });
});
