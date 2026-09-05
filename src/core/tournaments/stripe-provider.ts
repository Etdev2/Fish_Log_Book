import type { PaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult } from "./payments";

export interface StripePaymentIntentLike {
  id: string;
  status: "requires_payment_method" | "requires_action" | "processing" | "requires_capture" | "succeeded" | "canceled";
  amount: number;
  currency: string;
  client_secret?: string | null;
}

export interface StripeRefundLike {
  id: string;
  amount: number;
  status: "pending" | "succeeded" | "failed" | "canceled" | null;
}

export interface StripeClientPort {
  createPaymentIntent(input: {
    amount: number;
    currency: string;
    idempotencyKey: string;
    metadata: Readonly<Record<string, string>>;
    connectedAccountId?: string;
    applicationFeeAmount?: number;
  }): Promise<StripePaymentIntentLike>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntentLike>;
  createRefund(input: {
    paymentIntentId: string;
    amount: number;
    idempotencyKey: string;
    reason?: string;
  }): Promise<StripeRefundLike>;
}

function mapPaymentStatus(status: StripePaymentIntentLike["status"]): PaymentResult["status"] {
  switch (status) {
    case "requires_action": return "REQUIRES_ACTION";
    case "processing": return "PENDING";
    case "requires_capture": return "AUTHORIZED";
    case "succeeded": return "CONFIRMED";
    case "canceled": return "CANCELLED";
    case "requires_payment_method": return "FAILED";
  }
}

function mapRefundStatus(status: StripeRefundLike["status"]): RefundResult["status"] {
  switch (status) {
    case "succeeded": return "CONFIRMED";
    case "failed": return "FAILED";
    case "canceled": return "CANCELLED";
    default: return "PENDING";
  }
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  constructor(
    private readonly client: StripeClientPort,
    private readonly options: {
      connectedAccountId?: string;
      applicationFeeAmount?: (request: PaymentRequest) => number | undefined;
    } = {},
  ) {}

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const intent = await this.client.createPaymentIntent({
      amount: request.amountMinor,
      currency: request.currency.toLowerCase(),
      idempotencyKey: request.idempotencyKey,
      metadata: { order_id: request.orderId, ...(request.metadata ?? {}) },
      connectedAccountId: this.options.connectedAccountId,
      applicationFeeAmount: this.options.applicationFeeAmount?.(request),
    });
    return this.toResult(intent);
  }

  async confirmPayment(providerPaymentId: string): Promise<PaymentResult> {
    return this.toResult(await this.client.retrievePaymentIntent(providerPaymentId));
  }

  async getStatus(providerPaymentId: string): Promise<PaymentResult> {
    return this.toResult(await this.client.retrievePaymentIntent(providerPaymentId));
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    const refund = await this.client.createRefund({
      paymentIntentId: request.providerPaymentId,
      amount: request.amountMinor,
      idempotencyKey: request.idempotencyKey,
      reason: request.reason,
    });
    return { providerRefundId: refund.id, status: mapRefundStatus(refund.status), amountMinor: refund.amount };
  }

  private toResult(intent: StripePaymentIntentLike): PaymentResult {
    return {
      provider: this.name,
      providerPaymentId: intent.id,
      status: mapPaymentStatus(intent.status),
      amountMinor: intent.amount,
      currency: intent.currency.toUpperCase(),
      requiresActionUrl: intent.status === "requires_action" && intent.client_secret ? intent.client_secret : undefined,
    };
  }
}

export interface VerifiedStripeWebhook {
  id: string;
  type: string;
  livemode: boolean;
  objectId?: string;
}

export interface StripeWebhookVerifier {
  verify(rawBody: string, signatureHeader: string): VerifiedStripeWebhook;
}

export function verifyStripeWebhook(
  verifier: StripeWebhookVerifier,
  rawBody: string,
  signatureHeader: string | null,
): VerifiedStripeWebhook {
  if (!signatureHeader) throw new Error("missing Stripe signature");
  if (!rawBody) throw new Error("missing raw webhook body");
  return verifier.verify(rawBody, signatureHeader);
}
