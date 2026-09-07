import { stripeEventFacts, webhookIntent } from "@/core/tournaments/webhook-intent";
import { verifyStripeWebhook } from "@/core/tournaments/stripe-provider";
import { createStripeWebhookVerifier } from "@/lib/payments/stripe-signature";
import { confirmTournamentOrder, paymentsConfigured } from "@/lib/supabase/service-role";

/**
 * The one route that may turn a pending registration into a paid one.
 *
 * Everything else in this app registers people; nothing else confirms them.
 * `confirm_tournament_order` is granted to no client role precisely so that this endpoint
 * is the only door, and the door is guarded by a signature the caller cannot forge.
 *
 * The order of operations here is the security, and it is deliberate:
 *
 *   1. read the RAW body — never `request.json()`, because parsing and re-serialising
 *      changes the bytes the signature was computed over, and the check would fail for
 *      every legitimate request while a hand-crafted one might still slip through a
 *      looser comparison;
 *   2. verify the signature, which also enforces a five-minute replay window;
 *   3. only then parse, and only then decide;
 *   4. call the database with the service role, which is the only credential that can
 *      confirm an order, and which never leaves the server.
 *
 * Nothing is configured by default. Without `STRIPE_WEBHOOK_SECRET` and
 * `SUPABASE_SERVICE_ROLE_KEY` this route refuses every request, which is the correct
 * behaviour for a deployment that has not been through Stripe onboarding and the legal work
 * that taking entry fees requires (ADR 010 §3).
 */

/** A webhook is a request, never a build artifact — this must not be prerendered. */
export const dynamic = "force-dynamic";

/** `node:crypto` for the HMAC, so this is the Node runtime rather than the edge. */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!paymentsConfigured() || !secret) {
    /*
      503, not 500: nothing is broken, this deployment simply does not take payments. The
      message says which half is missing without naming a value, because a webhook endpoint
      is a public URL and its error bodies are readable by anybody who probes it.
    */
    return Response.json(
      { error: "payments are not configured on this deployment" },
      { status: 503 },
    );
  }

  // Raw bytes, before anything else touches them. See step 1 above.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let verified;
  try {
    verified = verifyStripeWebhook(
      createStripeWebhookVerifier({ secret }),
      rawBody,
      signature,
    );
  } catch {
    // Deliberately not echoing the reason. A caller probing this endpoint learns only that
    // the signature was wrong, not which part of it was wrong.
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  const parsed = stripeEventFacts(JSON.parse(rawBody));
  if (!parsed) {
    return Response.json({ error: "unrecognised event" }, { status: 400 });
  }

  /*
    The verifier is the authority on what the event IS — its id, its type, and whether it is
    live — because those are the fields it checked a signature over and normalised. The
    parse supplies the payment details it does not carry: the amount and the order the
    payment names. Taking identity from the verified struct rather than re-deriving it means
    there is one answer to "was this live", not two that could drift.
  */
  const intent = webhookIntent({
    ...parsed,
    id: verified.id,
    type: verified.type,
    livemode: verified.livemode,
  }, {
    // A deployment is live when it says so. Defaulting to test means a misconfigured
    // production endpoint rejects real payments loudly rather than confirming them quietly.
    expectLivemode: process.env.STRIPE_LIVE_MODE === "true",
  });

  if (intent.kind === "ignore") {
    // 200 so Stripe stops retrying something we understand and do not act on.
    return Response.json({ received: true, ignored: intent.reason });
  }

  if (intent.kind === "reject") {
    return Response.json({ error: intent.reason }, { status: 422 });
  }

  const confirmed = await confirmTournamentOrder({
    orderId: intent.orderId,
    provider: "stripe",
    providerPaymentId: intent.paymentId,
    amountMinor: intent.amountMinor,
    currency: intent.currency,
  });

  if (!confirmed.ok) {
    /*
      500 so Stripe retries. The function is idempotent on the provider payment id, so a
      retry after a partial failure is safe, and a genuine problem — an order that does not
      exist, an amount below the total — shows up repeatedly in the Stripe dashboard where
      somebody will see it, rather than being swallowed by a 200.
    */
    return Response.json(
      { error: confirmed.reason === "failed" ? confirmed.message : confirmed.reason },
      { status: 500 },
    );
  }

  return Response.json({ received: true, confirmed: intent.orderId });
}

/**
 * Anything that is not a POST. Stripe only ever POSTs; a GET here is a person or a scanner,
 * and answering it with the shape of the endpoint helps neither.
 */
export function GET(): Response {
  return Response.json({ error: "method not allowed" }, { status: 405 });
}
