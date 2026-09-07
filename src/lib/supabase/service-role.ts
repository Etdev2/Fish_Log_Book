import { createClient } from "@supabase/supabase-js";

/**
 * The service-role credential, and the one thing it is allowed to do.
 *
 * The service role bypasses row-level security entirely. It is the most dangerous
 * credential this system has, so it is deliberately NOT exposed as a client that callers
 * can do anything with — this module exports one narrow function, and the only caller is
 * the payment webhook.
 *
 * That shape is the point. A `createServiceRoleClient()` export would be reused within a
 * month by something that only needed to read one row, and the blast radius of a mistake in
 * that caller would be every table in the database. A function that can confirm exactly one
 * order and return nothing else cannot be repurposed by accident.
 *
 * It lives in `src/lib/supabase/` because that is where network clients live (ADR 005 §3)
 * and because route files are forbidden from importing Supabase directly — a rule this file
 * exists to satisfy rather than to work around. The linter caught the first version of the
 * webhook doing exactly that.
 *
 * **Server only, and it fails closed rather than leaking.** `SUPABASE_SERVICE_ROLE_KEY` has
 * no `NEXT_PUBLIC_` prefix, so Next never inlines it into a client bundle: importing this
 * module from a client component would leave the key `undefined`, `confirmTournamentOrder`
 * would return `not-configured`, and nothing would be sent. The `server-only` package would
 * turn that runtime failure into a build error, which is better; it is not a dependency of
 * this project today, and adding one to a payments branch is not the place to start.
 */

export type ConfirmResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "not-configured" }
  | { readonly ok: false; readonly reason: "failed"; readonly message: string };

export interface ConfirmOrderInput {
  readonly orderId: string;
  readonly provider: string;
  readonly providerPaymentId: string;
  readonly amountMinor: number;
  /**
   * The currency the payment was actually taken in.
   *
   * Required, and checked against the order's own currency by the database function.
   * Comparing amounts without it is meaningless: 75000 minor units is $750 and also a good
   * deal less in several other currencies, so a payment in a cheaper one would satisfy the
   * amount check numerically.
   */
  readonly currency: string;
}

/**
 * Activates the entries on a paid order, via `confirm_tournament_order`.
 *
 * The database function is idempotent on `(provider, provider_payment_id)`, so calling this
 * twice for the same payment is safe — which matters, because a payment provider will
 * deliver the same webhook more than once.
 */
export async function confirmTournamentOrder(input: ConfirmOrderInput): Promise<ConfirmResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return { ok: false, reason: "not-configured" };

  const supabase = createClient(url, serviceRoleKey, {
    // No session, no refresh: this is a machine calling once, not a signed-in person.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.rpc("confirm_tournament_order", {
    target_order_id: input.orderId,
    provider_name: input.provider,
    provider_reference: input.providerPaymentId,
    paid_amount_minor: input.amountMinor,
    paid_currency: input.currency,
  });

  return error ? { ok: false, reason: "failed", message: error.message } : { ok: true };
}

/** Whether this deployment is configured to confirm payments at all. */
export function paymentsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET,
  );
}
