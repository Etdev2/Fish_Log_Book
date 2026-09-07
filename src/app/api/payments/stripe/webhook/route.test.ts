import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ORDER_METADATA_KEY } from "@/core/tournaments/payments";

/**
 * The webhook endpoint, exercised as a request rather than as a function.
 *
 * It is the only route in the app that can turn a pending registration into a paid one, so
 * the cases below are the ways somebody gets in for free if it is wrong, plus the ways a
 * real payment gets silently lost if it is wrong in the other direction.
 *
 * The Supabase client is mocked because the point here is the handler's decisions, not the
 * database function — that has its own tests, run against a real Postgres by
 * `npm run db:check`.
 */

const SECRET = "whsec_test_only";
const rpc = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc }),
}));

function sign(body: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const digest = createHmac("sha256", SECRET).update(`${timestamp}.${body}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

function event(over: Record<string, unknown> = {}, object: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: "evt_1",
    type: "payment_intent.succeeded",
    livemode: false,
    data: {
      object: {
        id: "pi_1",
        amount_received: 75000,
        currency: "usd",
        metadata: { [ORDER_METADATA_KEY]: "11111111-1111-1111-1111-111111111111" },
        ...object,
      },
    },
    ...over,
  });
}

function post(body: string, signature?: string | null): Request {
  return new Request("https://example.test/api/payments/stripe/webhook", {
    method: "POST",
    headers: signature === null ? {} : { "stripe-signature": signature ?? sign(body) },
    body,
  });
}

async function handler() {
  return (await import("./route")).POST;
}

beforeEach(() => {
  vi.resetModules();
  rpc.mockReset();
  rpc.mockResolvedValue({ error: null });
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  delete process.env.STRIPE_LIVE_MODE;
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

describe("the payment webhook", () => {
  it("confirms the order a correctly signed payment names", async () => {
    const body = event();
    const response = await (await handler())(post(body));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("confirm_tournament_order", {
      target_order_id: "11111111-1111-1111-1111-111111111111",
      provider_name: "stripe",
      provider_reference: "pi_1",
      paid_amount_minor: 75000,
      paid_currency: "usd",
    });
  });

  it("confirms nothing when the signature is wrong", async () => {
    const response = await (await handler())(post(event(), "t=1,v1=" + "0".repeat(64)));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("confirms nothing when there is no signature at all", async () => {
    const response = await (await handler())(post(event(), null));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("confirms nothing when the body was changed after signing", async () => {
    // The classic bug this guards: an endpoint that re-serialises before verifying.
    const body = event();
    const signature = sign(body);
    const tampered = body.replace("75000", "1");
    const response = await (await handler())(post(tampered, signature));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("confirms nothing when a signature is replayed hours later", async () => {
    const body = event();
    const old = sign(body, Math.floor(Date.now() / 1000) - 3600);
    const response = await (await handler())(post(body, old));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses to take payments at all when nothing is configured", async () => {
    // The default state of this repository, and the correct behaviour for it.
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await (await handler())(post(event()));
    expect(response.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses when the service role key is missing, even with a good signature", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect((await (await handler())(post(event()))).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("acknowledges an event it does not act on, so Stripe stops retrying", async () => {
    const body = event({ type: "customer.created" });
    const response = await (await handler())(post(body));
    expect(response.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a live payment arriving at a test deployment", async () => {
    const body = event({ livemode: true });
    const response = await (await handler())(post(body));
    expect(response.status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a succeeded payment that names no order", async () => {
    const body = event({}, { metadata: {} });
    expect((await (await handler())(post(body))).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a succeeded payment with no currency, rather than assuming dollars", async () => {
    // An amount without a currency is a number, not a price. The database compares the two,
    // so guessing here would defeat that check before it ran.
    const body = event({}, { currency: undefined });
    expect((await (await handler())(post(body))).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry when the database call fails", async () => {
    // 500 rather than 200: the confirm function is idempotent, so a retry is safe, and a
    // real problem surfaces in the Stripe dashboard instead of being swallowed.
    rpc.mockResolvedValue({ error: { message: "order not found" } });
    const response = await (await handler())(post(event()));
    expect(response.status).toBe(500);
  });

  it("does not answer a GET with anything useful", async () => {
    const { GET } = await import("./route");
    expect(GET().status).toBe(405);
  });
});
