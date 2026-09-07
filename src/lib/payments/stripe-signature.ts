import { createHmac, timingSafeEqual } from "node:crypto";

import type { StripeWebhookVerifier, VerifiedStripeWebhook } from "@/core/tournaments/stripe-provider";

/**
 * Checking that a webhook really came from Stripe.
 *
 * This is the only thing standing between the internet and `confirm_tournament_order`,
 * which turns a pending registration into a paid one. Anybody can POST to a public URL. If
 * this function is wrong in the permissive direction, entry to every tournament in the app
 * is free to whoever notices — so it is written out in full, with the failure modes named,
 * rather than assumed.
 *
 * Stripe's scheme, for the reader who has not met it: the `Stripe-Signature` header is a
 * comma-separated list of `key=value` pairs — one `t` (a unix timestamp) and one or more
 * `v1` (hex HMAC-SHA256 digests). The signed payload is literally `${t}.${rawBody}`, and
 * the key is the endpoint's signing secret.
 *
 * Three properties this has to get right, each of which is a real attack if missed:
 *
 * - **The raw body, byte for byte.** `JSON.parse` then `JSON.stringify` produces different
 *   bytes — key order, whitespace, number formatting — and the digest will not match. The
 *   route handler must pass `await request.text()`, never a parsed object.
 * - **Timing-safe comparison.** A `===` on digests leaks, through response time, how many
 *   leading bytes were right, which is enough to forge one byte at a time.
 * - **A timestamp tolerance.** Without it a valid request captured once can be replayed
 *   forever. Five minutes is Stripe's own recommendation.
 */

/** Stripe's recommended replay window. */
export const DEFAULT_TOLERANCE_SECONDS = 300;

export type SignatureFailure =
  | "malformed-header"
  | "no-signatures"
  | "timestamp-outside-tolerance"
  | "no-matching-signature";

export class StripeSignatureError extends Error {
  constructor(readonly reason: SignatureFailure) {
    super(`stripe signature rejected: ${reason}`);
    this.name = "StripeSignatureError";
  }
}

interface ParsedHeader {
  readonly timestamp: number;
  readonly signatures: readonly string[];
}

/** Splits `t=...,v1=...,v1=...` without trusting anything about its shape. */
export function parseSignatureHeader(header: string): ParsedHeader {
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t") {
      const parsed = Number(value);
      // A non-numeric or fractional `t` is malformed, not "close enough".
      if (Number.isInteger(parsed) && parsed > 0) timestamp = parsed;
    } else if (key === "v1" && /^[0-9a-f]+$/i.test(value)) {
      // Stripe sends several v1 entries while a secret is being rotated; any may match.
      signatures.push(value.toLowerCase());
    }
  }

  if (timestamp === null) throw new StripeSignatureError("malformed-header");
  if (signatures.length === 0) throw new StripeSignatureError("no-signatures");
  return { timestamp, signatures };
}

/** Constant-time hex digest comparison. Length mismatch short-circuits, which is safe. */
function digestsMatch(expected: string, candidate: string): boolean {
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(candidate, "hex"));
}

export function verifySignature(input: {
  readonly rawBody: string;
  readonly header: string;
  readonly secret: string;
  readonly nowSeconds: number;
  readonly toleranceSeconds?: number;
}): void {
  const { timestamp, signatures } = parseSignatureHeader(input.header);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;

  // Absolute difference: a timestamp far in the FUTURE is as suspicious as an old one, and
  // a one-sided check is trivially defeated by a clock claim.
  if (Math.abs(input.nowSeconds - timestamp) > tolerance) {
    throw new StripeSignatureError("timestamp-outside-tolerance");
  }

  const expected = createHmac("sha256", input.secret)
    .update(`${timestamp}.${input.rawBody}`, "utf8")
    .digest("hex");

  // Every candidate is compared, without an early return on the first match, so the time
  // taken does not reveal which one matched.
  let matched = false;
  for (const candidate of signatures) {
    if (digestsMatch(expected, candidate)) matched = true;
  }
  if (!matched) throw new StripeSignatureError("no-matching-signature");
}

/**
 * The `StripeWebhookVerifier` the core payment code expects, backed by real crypto.
 *
 * Parsing happens only after the signature is verified — the body is untrusted input until
 * that moment, and it is worth being able to say so from the shape of the code.
 */
export function createStripeWebhookVerifier(options: {
  readonly secret: string;
  readonly now?: () => number;
  readonly toleranceSeconds?: number;
}): StripeWebhookVerifier {
  return {
    verify(rawBody: string, signatureHeader: string): VerifiedStripeWebhook {
      verifySignature({
        rawBody,
        header: signatureHeader,
        secret: options.secret,
        nowSeconds: Math.floor((options.now?.() ?? Date.now()) / 1000),
        toleranceSeconds: options.toleranceSeconds,
      });

      const event = JSON.parse(rawBody) as {
        id?: unknown;
        type?: unknown;
        livemode?: unknown;
        data?: { object?: { id?: unknown } };
      };

      if (typeof event.id !== "string" || typeof event.type !== "string") {
        throw new Error("stripe event is missing an id or a type");
      }

      return {
        id: event.id,
        type: event.type,
        livemode: event.livemode === true,
        objectId: typeof event.data?.object?.id === "string" ? event.data.object.id : undefined,
      };
    },
  };
}
