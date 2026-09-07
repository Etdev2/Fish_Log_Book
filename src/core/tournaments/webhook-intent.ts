import { ORDER_METADATA_KEY } from "./payments";

/**
 * What a verified Stripe event means for an order — decided here, away from the network.
 *
 * The route handler's job is to verify a signature and then do what this says. Keeping the
 * decision pure means the interesting cases — an event for an order we do not know, a
 * livemode event arriving at a test deployment, a type we do not handle — are testable
 * without a webhook, a database, or a running server.
 */

export interface StripeEventFacts {
  readonly id: string;
  readonly type: string;
  readonly livemode: boolean;
  /** `data.object.id` — the payment intent, for the events we care about. */
  readonly objectId?: string;
  /** `data.object.amount_received` (or `amount`), in minor units. */
  readonly amountMinor?: number;
  /** `data.object.currency`. Checked against the order's — see `confirm_tournament_order`. */
  readonly currency?: string;
  /** Our order id, which we set as metadata when the payment was created. */
  readonly orderId?: string;
}

export type WebhookIntent =
  | {
      readonly kind: "confirm";
      readonly orderId: string;
      readonly paymentId: string;
      readonly amountMinor: number;
      readonly currency: string;
    }
  /** Understood, and nothing to do. Answered 200 so the provider stops retrying. */
  | { readonly kind: "ignore"; readonly reason: string }
  /** Something is wrong enough that the provider should retry or a human should look. */
  | { readonly kind: "reject"; readonly reason: string };

/** The only event that activates a registration. Others are acknowledged and dropped. */
const CONFIRMING_TYPES = new Set(["payment_intent.succeeded", "charge.succeeded"]);

export function webhookIntent(
  event: StripeEventFacts,
  environment: { readonly expectLivemode: boolean },
): WebhookIntent {
  /*
    A live event arriving at a test deployment (or the reverse) means the endpoint is wired
    to the wrong Stripe account or the wrong environment. Rejecting rather than ignoring is
    deliberate: this is a misconfiguration somebody has to fix, and a silent 200 would let a
    production payment be quietly dropped by a staging server.
  */
  if (event.livemode !== environment.expectLivemode) {
    return {
      kind: "reject",
      reason: event.livemode
        ? "a live payment reached an endpoint configured for test mode"
        : "a test payment reached an endpoint configured for live mode",
    };
  }

  if (!CONFIRMING_TYPES.has(event.type)) {
    return { kind: "ignore", reason: `nothing to do for ${event.type}` };
  }

  if (!event.orderId) {
    /*
      A succeeded payment with no order on it is money we cannot attribute. Rejecting makes
      the provider retry and puts it in a failure log where somebody will see it; ignoring
      would lose it silently, and it is somebody's entry fee.
    */
    return { kind: "reject", reason: "a succeeded payment carried no order reference" };
  }

  if (!event.objectId) {
    return { kind: "reject", reason: "a succeeded payment carried no payment id" };
  }

  if (typeof event.amountMinor !== "number" || !Number.isFinite(event.amountMinor) || event.amountMinor < 0) {
    return { kind: "reject", reason: "a succeeded payment carried no readable amount" };
  }

  if (!event.currency) {
    // An amount without a currency is a number, not a price. Refusing sends it back for a
    // retry and puts it in front of a person, rather than guessing USD.
    return { kind: "reject", reason: "a succeeded payment carried no currency" };
  }

  return {
    kind: "confirm",
    orderId: event.orderId,
    paymentId: event.objectId,
    amountMinor: event.amountMinor,
    currency: event.currency,
  };
}

/**
 * Pulls the facts out of a Stripe event body that has already been signature-verified.
 *
 * Defensive about shape rather than trusting it: this is JSON from the network, and while
 * the signature proves it came from Stripe, it does not prove the shape is what this
 * version of the code expects.
 */
export function stripeEventFacts(payload: unknown): StripeEventFacts | null {
  if (typeof payload !== "object" || payload === null) return null;
  const event = payload as Record<string, unknown>;
  if (typeof event.id !== "string" || typeof event.type !== "string") return null;

  const data = event.data as { object?: Record<string, unknown> } | undefined;
  const object = data?.object ?? {};
  const metadata = (object.metadata as Record<string, unknown> | undefined) ?? {};

  // `amount_received` is the amount actually captured; `amount` is what was requested. The
  // captured one is the one that may activate a registration.
  const amountRaw = object.amount_received ?? object.amount;

  return {
    id: event.id,
    type: event.type,
    livemode: event.livemode === true,
    objectId: typeof object.id === "string" ? object.id : undefined,
    amountMinor: typeof amountRaw === "number" && Number.isFinite(amountRaw) ? amountRaw : undefined,
    currency: typeof object.currency === "string" && object.currency.length > 0 ? object.currency : undefined,
    orderId:
      typeof metadata[ORDER_METADATA_KEY] === "string"
        ? (metadata[ORDER_METADATA_KEY] as string)
        : undefined,
  };
}
