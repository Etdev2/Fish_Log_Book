import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  StripeSignatureError,
  createStripeWebhookVerifier,
  parseSignatureHeader,
  verifySignature,
} from "./stripe-signature";

/**
 * This is the only thing between the internet and a function that turns a pending
 * registration into a paid one. Every one of these tests is a way somebody gets into a
 * $400 tournament for nothing if the check is wrong in the permissive direction.
 */

const SECRET = "whsec_test_do_not_use_anywhere_real";
const NOW = 1_788_000_000;

function sign(body: string, timestamp = NOW, secret = SECRET): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

const BODY = JSON.stringify({
  id: "evt_1",
  type: "payment_intent.succeeded",
  livemode: false,
  data: { object: { id: "pi_1", amount: 75000, currency: "usd" } },
});

describe("verifySignature", () => {
  it("accepts a signature Stripe would have produced", () => {
    expect(() =>
      verifySignature({ rawBody: BODY, header: sign(BODY), secret: SECRET, nowSeconds: NOW }),
    ).not.toThrow();
  });

  it("rejects a body that changed by one byte", () => {
    const header = sign(BODY);
    expect(() =>
      verifySignature({ rawBody: BODY + " ", header, secret: SECRET, nowSeconds: NOW }),
    ).toThrow(StripeSignatureError);
  });

  it("rejects a signature made with a different secret", () => {
    const header = sign(BODY, NOW, "whsec_someone_elses");
    expect(() =>
      verifySignature({ rawBody: BODY, header, secret: SECRET, nowSeconds: NOW }),
    ).toThrow(StripeSignatureError);
  });

  it("rejects a replay from outside the tolerance window", () => {
    // A captured, genuinely-signed request must stop working. Without this check it is
    // valid forever, and one intercepted webhook confirms an order whenever its holder likes.
    const header = sign(BODY, NOW - 3600);
    expect(() =>
      verifySignature({ rawBody: BODY, header, secret: SECRET, nowSeconds: NOW }),
    ).toThrow(/timestamp-outside-tolerance/);
  });

  it("rejects a timestamp far in the future, not just an old one", () => {
    // A one-sided check is defeated by simply claiming a later time.
    const header = sign(BODY, NOW + 3600);
    expect(() =>
      verifySignature({ rawBody: BODY, header, secret: SECRET, nowSeconds: NOW }),
    ).toThrow(/timestamp-outside-tolerance/);
  });

  it("accepts inside the window on either side", () => {
    for (const skew of [-299, -1, 0, 1, 299]) {
      expect(() =>
        verifySignature({
          rawBody: BODY,
          header: sign(BODY, NOW + skew),
          secret: SECRET,
          nowSeconds: NOW,
        }),
      ).not.toThrow();
    }
  });

  it("accepts when any one of several v1 signatures matches — secrets get rotated", () => {
    const good = sign(BODY).split("v1=")[1];
    const header = `t=${NOW},v1=${"0".repeat(64)},v1=${good}`;
    expect(() =>
      verifySignature({ rawBody: BODY, header, secret: SECRET, nowSeconds: NOW }),
    ).not.toThrow();
  });

  it("rejects a header with no signature in it at all", () => {
    expect(() =>
      verifySignature({ rawBody: BODY, header: `t=${NOW}`, secret: SECRET, nowSeconds: NOW }),
    ).toThrow(/no-signatures/);
  });

  it("rejects a header with no timestamp", () => {
    expect(() =>
      verifySignature({ rawBody: BODY, header: "v1=abcdef", secret: SECRET, nowSeconds: NOW }),
    ).toThrow(/malformed-header/);
  });

  it("rejects a digest of the wrong length rather than crashing on it", () => {
    // Buffer.from(...,'hex') silently truncates bad input, so length is checked first.
    for (const bogus of ["v1=ab", "v1=" + "f".repeat(63), "v1=zz"]) {
      expect(() =>
        verifySignature({
          rawBody: BODY,
          header: `t=${NOW},${bogus}`,
          secret: SECRET,
          nowSeconds: NOW,
        }),
      ).toThrow(StripeSignatureError);
    }
  });

  it("is not fooled by the signature appearing as a substring", () => {
    const good = sign(BODY).split("v1=")[1];
    expect(() =>
      verifySignature({
        rawBody: BODY,
        header: `t=${NOW},v1=${good.slice(0, 60)}`,
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).toThrow(StripeSignatureError);
  });
});

describe("parseSignatureHeader", () => {
  it("ignores schemes it does not know, like v0", () => {
    const good = sign(BODY).split("v1=")[1];
    const parsed = parseSignatureHeader(`t=${NOW},v0=deadbeef,v1=${good}`);
    expect(parsed.signatures).toEqual([good]);
    expect(parsed.timestamp).toBe(NOW);
  });

  it("refuses a fractional or negative timestamp", () => {
    expect(() => parseSignatureHeader("t=1.5,v1=abcdef")).toThrow(/malformed-header/);
    expect(() => parseSignatureHeader("t=-1,v1=abcdef")).toThrow(/malformed-header/);
  });
});

describe("createStripeWebhookVerifier", () => {
  it("returns the event only after the signature has been checked", () => {
    const verifier = createStripeWebhookVerifier({ secret: SECRET, now: () => NOW * 1000 });
    const event = verifier.verify(BODY, sign(BODY));
    expect(event).toEqual({
      id: "evt_1",
      type: "payment_intent.succeeded",
      livemode: false,
      objectId: "pi_1",
    });
  });

  it("does not parse an unverified body", () => {
    // The body is untrusted input until the signature passes. A parse error here would mean
    // JSON.parse ran on it first.
    const verifier = createStripeWebhookVerifier({ secret: SECRET, now: () => NOW * 1000 });
    expect(() => verifier.verify("this is not json", `t=${NOW},v1=${"a".repeat(64)}`)).toThrow(
      StripeSignatureError,
    );
  });

  it("refuses a verified body that is not a Stripe event", () => {
    const body = JSON.stringify({ hello: "world" });
    const verifier = createStripeWebhookVerifier({ secret: SECRET, now: () => NOW * 1000 });
    expect(() => verifier.verify(body, sign(body))).toThrow(/missing an id or a type/);
  });

  it("reports livemode honestly, so a test event cannot pass for a real one", () => {
    const body = JSON.stringify({ id: "evt_2", type: "payment_intent.succeeded", livemode: true });
    const verifier = createStripeWebhookVerifier({ secret: SECRET, now: () => NOW * 1000 });
    expect(verifier.verify(body, sign(body)).livemode).toBe(true);
  });
});
