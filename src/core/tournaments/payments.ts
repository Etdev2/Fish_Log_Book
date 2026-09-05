export type PaymentStatus =
  | "PENDING"
  | "REQUIRES_ACTION"
  | "AUTHORIZED"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface PaymentRequest {
  orderId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  customerReference?: string;
  metadata?: Readonly<Record<string, string>>;
}

export interface PaymentResult {
  provider: string;
  providerPaymentId: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  requiresActionUrl?: string;
}

export interface RefundRequest {
  providerPaymentId: string;
  amountMinor: number;
  idempotencyKey: string;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";
  amountMinor: number;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
  confirmPayment(providerPaymentId: string): Promise<PaymentResult>;
  getStatus(providerPaymentId: string): Promise<PaymentResult>;
  refund(request: RefundRequest): Promise<RefundResult>;
}

export interface OrderItemInput {
  itemType:
    | "TOURNAMENT_ENTRY"
    | "TEAM_ENTRY"
    | "BOAT_ENTRY"
    | "MEMBERSHIP"
    | "LATE_FEE"
    | "SIDE_POT"
    | "JACKPOT"
    | "MERCHANDISE"
    | "DONATION"
    | "CUSTOM";
  quantity: number;
  unitAmountMinor: number;
}

export function computeOrderTotal(items: readonly OrderItemInput[]): number {
  return items.reduce((sum, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("quantity must be a positive integer");
    if (!Number.isInteger(item.unitAmountMinor) || item.unitAmountMinor < 0) throw new Error("unit amount must be a non-negative integer");
    return sum + item.quantity * item.unitAmountMinor;
  }, 0);
}

export function paymentCanActivateRegistration(status: PaymentStatus): boolean {
  return status === "CONFIRMED";
}
